import { mat4 } from '../../lib/gl-matrix-module.js';

import { Camera } from './Camera.js';

export class PerspectiveCamera extends Camera {

    constructor(options = {}) {
        super(options);

        this.aspect = options.aspect ?? 1.5;
        this.fov = options.fov ?? 1.5;
        this.near = options.near ?? 1;
        this.far = options.far ?? Infinity;

        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        mat4.perspective(this.projectionMatrix,
            this.fov, this.aspect,
            this.near, this.far);
    }

}
