import { Node } from './Node.js';

export class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            position         : [2, 5, 3],
            ambientColor     : [150, 150, 150],
            diffuseColor     : [255, 150, 150],
            specularColor    : [255, 255, 255],
            shininess        : 10,
            attenuatuion     : [1.0, 0, 0.02]
        });
    }

}