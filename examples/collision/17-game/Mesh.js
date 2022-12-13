import { Utils } from './Utils.js';

export class Mesh {

    constructor(options) {
        Utils.init(this, this.constructor.defaults, options);
    }

}

Mesh.defaults = {
    vertices: [],
    texcoords: [],
    normals: [],
    indices: []
};
