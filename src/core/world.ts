/**
 Copyright (C) 2013 by Justin DuJardin

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

///<reference path="../typedef/underscore/underscore.d.ts"/>
///<reference path="./resourceLoader.ts"/>
///<reference path="./time.ts"/>
///<reference path="./input.ts"/>
///<reference path="./spriteRender.ts"/>


module eburp {

    export interface IWorld {
        loader:ResourceLoader;
        time:Time;
        scene:any;
        input:Input;
        sprites:SpriteRender;
    }
    export interface IWorldObject {
        world:IWorld;
        onAddToWorld(world:IWorld);
        onRemoveFromWorld(world:IWorld);
    }


    export class World implements IWorld {
        loader:ResourceLoader = null;
        time:Time = null;
        scene:any = null;
        input:Input = null;
        sprites:SpriteRender = null;
        constructor(services){
            services = _.defaults(services,{
                loader: new ResourceLoader,
                time:   new Time({autoStart: true}),
                scene:  null, // TODO: When scene is ported
                input:  new Input,
                sprites:new SpriteRender
            });
            _.extend(this,services);

            _.each(services,(s:IWorldObject,k) => {
                this.mark(s);
            });
        }

        mark(object:IWorldObject):World{
            if(object){
                object.world = this;
                if(object.onAddToWorld){
                    object.onAddToWorld(this);
                }
            }
            return this;
        }

        erase(object:IWorldObject):World{
            if(object){
                delete object.world;
                if(object.onRemoveFromWorld){
                    object.onRemoveFromWorld(this);
                }
            }
            return this;
        }
    }
}