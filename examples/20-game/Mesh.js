import Utils from './Utils.js';
import Node from './Node.js';

export default class Mesh extends Node {

    constructor(options) {
        super(options);
        Utils.init(this, this.constructor.defaults, options);
    }

}

Mesh.defaults = {
    vertices: [],
    texcoords: [],
    normals: [],
    indices: []
};
