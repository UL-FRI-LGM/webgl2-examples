import { Node } from './Node.js';

export class Light extends Node {

    constructor(options) {
        super();

        Object.assign(this, {
            ambientColor     : [0, 0, 0],
            diffuseColor     : [0, 0, 0],
            specularColor    : [0, 0 ,0],
            shininess        : 50,
            attenuatuion     : [0.5, 0, 0.05],
        }, options);
    }

}