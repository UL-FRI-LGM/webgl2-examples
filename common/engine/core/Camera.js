import { mat4 } from '../../../lib/gl-matrix-module.js';

export class Camera {

    constructor({
        orthographic = false,
        aspect = 1,
        fovy = 1,
        halfy = 1,
        near = orthographic ? -1 : 1,
        far = orthographic ? 1 : Infinity,
    } = {}) {
        this.orthographic = orthographic;
        this.aspect = aspect;
        this.fovy = fovy;
        this.halfy = halfy;
        this.near = near;
        this.far = far;
    }

    get projectionMatrix() {
        return this.orthographic ? this.orthographicMatrix : this.perspectiveMatrix;
    }

    get orthographicMatrix() {
        const { halfy, aspect, near, far } = this;
        const halfx = halfy * aspect;
        return mat4.ortho(mat4.create(), -halfx, halfx, -halfy, halfy, near, far);
    }

    get perspectiveMatrix() {
        const { fovy, aspect, near, far } = this;
        return mat4.perspective(mat4.create(), fovy, aspect, near, far);
    }

}
