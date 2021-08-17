import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { Node } from './Node.js';

export class Camera extends Node {

    constructor() {
        super();

        this.aspect = 1;
        this.fov = 1.5;
        this.near = 0.01;
        this.far = 100;

        this.projection = mat4.create();
        this.updateProjection();
    }

    updateProjection() {
        mat4.perspective(this.projection, this.fov, this.aspect, this.near, this.far);
    }

}
