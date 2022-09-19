import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { Node } from './Node.js';

export class Camera extends Node {

    constructor() {
        super();

        this.aspect = 1;
        this.fov = 1.5;
        this.near = 0.01;
        this.far = 100;

        this.pointerSensitivity = 0.003;

        this.projection = mat4.create();
        this.yaw = 0;
        this.pitch = 0;

        this.pointermoveHandler = this.pointermoveHandler.bind(this);

        this.updateProjection();
    }

    updateProjection() {
        mat4.perspective(this.projection, this.fov, this.aspect, this.near, this.far);
    }

    updateMatrix() {
        mat4.identity(this.matrix);
        mat4.rotateY(this.matrix, this.matrix, this.yaw);
        mat4.rotateX(this.matrix, this.matrix, this.pitch);
    }

    enable() {
        document.addEventListener('pointermove', this.pointermoveHandler);
    }

    disable() {
        document.removeEventListener('pointermove', this.pointermoveHandler);
    }

    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;
        const c = this;

        c.pitch -= dy * c.pointerSensitivity;
        c.yaw -= dx * c.pointerSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        if (c.pitch > halfpi) {
            c.pitch = halfpi;
        }
        if (c.pitch < -halfpi) {
            c.pitch = -halfpi;
        }

        c.yaw = ((c.yaw % twopi) + twopi) % twopi;
    }

}
