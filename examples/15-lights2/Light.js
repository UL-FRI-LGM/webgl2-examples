import Node from './Node.js';

export default class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            position         : [2, 5, 3],
            ambientColor     : [51, 51, 51],
            diffuseColor     : [204, 204, 204],
            specularColor    : [255, 255, 255],
            shininess        : 10,
            attenuatuion     : [1.0, 0, 0.02]
        });
    }

}