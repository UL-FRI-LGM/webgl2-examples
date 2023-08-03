import { Utils } from './Utils.js';

export class Mesh {

    constructor(options) {
        Utils.init(this, this.constructor.defaults, options);
    }

}

Mesh.defaults = {
    positions: [],
    texcoords: [],
    normals: [],
    indices: []
};
