"use strict";
var express = require('express');
var graph = require('fbgraph');
var db = require('./database');

module.exports = {

   graph: graph,

   resumeSession: function(req){
      var deferred = Q.defer();
      return deferred.promise;
   },

   routes: function(server) {

      if(!process.env.FB_APPID || !process.env.FB_SECRET){
         console.log("No Facebook environment variables, attempting to load from '../.env.json'");
         require('../.env.json');
      }
      var conf = {
         FB_APPID: process.env.FB_APPID || require("../.env.json").FB_APPID,
         FB_SECRET: process.env.FB_SECRET || require("../.env.json").FB_SECRET,
         scope: 'email'
      };

      // Encrypt session cookies
      server.use(express.session({
         secret: process.env.SESSION_SECRET || require("../.env.json").SESSION_SECRET
      }));

      server.get('/auth/facebook', function (req, res) {
         var redirect = "http://" + req.headers.host + "/auth/facebook";
         // The Facebook app is configured to send a code= parameter in its callback
         // to this function, so if it doesn't exist, show the OAuth dialog.
         if (!req.query.code) {
            var authUrl = graph.getOauthUrl({
               "client_id": conf.FB_APPID,
               "redirect_uri": redirect,
               "scope": conf.scope
            });

            if (!req.query.error) { //checks whether a user denied the app facebook login/permissions
               res.redirect(authUrl);
            } else {  //req.query.error == 'access_denied'
               res.send('access denied');
            }
            return;
         }

         // code is set
         // we'll send that and get the access token

         graph.authorize({
            "client_id": conf.FB_APPID,
            "redirect_uri": redirect,
            "client_secret": conf.FB_SECRET,
            "code": req.query.code
         }, function (err, result) {
            if(!err){
               req.session.fbToken = result.access_token;
               graph.get('/me',function(err,fbUser){
                  if(err){
                     return res.send("failed to query FB user with access token");
                  }
                  db.findUser(fbUser.id).then(function(user){
                     if(user){
                        req.session.userId = user._id.toString();
                        return res.redirect('/256');
                     }
                     user = {
                        facebookId: fbUser.id,
                        name: fbUser.name,
                        email: fbUser.email
                     };
                     db.createUser(user).then(function(result){
                        req.session.userId = result._id.toString();
                        res.redirect('/256');
                     });
                  });
               });
            }
         });
      });

      server.get("/auth/logout",function(req,res){
         req.session.destroy();
         res.redirect("/256");
      });

   }
};