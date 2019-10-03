import Node from './Node.js';

export default class Light extends Node {

    constructor() {
        super();

        Object.assign(this, {
            ambientColor     : [51, 51, 51],
            diffuseColor     : [0, 0, 0],
            specularColor    : [0, 0 ,0],
            shininess        : 10,
            attenuatuion     : [1.0, 0, 0.02]
        });
    }

}