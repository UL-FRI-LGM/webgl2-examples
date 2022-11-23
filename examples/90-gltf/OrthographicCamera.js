import { mat4 } from '../../lib/gl-matrix-module.js';

import { Camera } from './Camera.js';

export class OrthographicCamera extends Camera {

    constructor(options = {}) {
        super(options);

        this.left = options.left ?? -1;
        this.right = options.right ?? 1;
        this.bottom = options.bottom ?? -1;
        this.top = options.top ?? 1;
        this.near = options.near ?? -1;
        this.far = options.far ?? 1;

        this.updateProjectionMatrix();
    }

    updateProjectionMatrix() {
        mat4.ortho(this.projectionMatrix,
            this.left, this.right,
            this.bottom, this.top,
            this.near, this.far);
    }

}
