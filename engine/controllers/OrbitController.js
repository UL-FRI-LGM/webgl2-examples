import { quat, vec3 } from 'glm';

import { Transform } from '../core/Transform.js';

export class OrbitController {

    constructor(node, domElement, {
        rotation = [0, 0, 0, 1],
        distance = 2,
        moveSensitivity = 0.004,
        zoomSensitivity = 0.002,
    } = {}) {
        this.node = node;
        this.domElement = domElement;

        this.rotation = rotation;
        this.distance = distance;

        this.moveSensitivity = moveSensitivity;
        this.zoomSensitivity = zoomSensitivity;

        this.initHandlers();
    }

    initHandlers() {
        this.pointerdownHandler = this.pointerdownHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.wheelHandler = this.wheelHandler.bind(this);

        this.domElement.addEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.addEventListener('wheel', this.wheelHandler);
    }

    pointerdownHandler(e) {
        this.domElement.setPointerCapture(e.pointerId);
        this.domElement.requestPointerLock();
        this.domElement.removeEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.addEventListener('pointerup', this.pointerupHandler);
        this.domElement.addEventListener('pointermove', this.pointermoveHandler);
    }

    pointerupHandler(e) {
        this.domElement.releasePointerCapture(e.pointerId);
        this.domElement.ownerDocument.exitPointerLock();
        this.domElement.addEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.removeEventListener('pointerup', this.pointerupHandler);
        this.domElement.removeEventListener('pointermove', this.pointermoveHandler);
    }

    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;

        quat.rotateX(this.rotation, this.rotation, -dy * this.moveSensitivity);
        quat.rotateY(this.rotation, this.rotation, -dx * this.moveSensitivity);
        quat.normalize(this.rotation, this.rotation);
    }

    wheelHandler(e) {
        this.distance *= Math.exp(this.zoomSensitivity * e.deltaY);
    }

    update() {
        const transform = this.node.getComponentOfType(Transform);
        if (!transform) {
            return;
        }

        quat.copy(transform.rotation, this.rotation);
        vec3.transformQuat(transform.translation, [0, 0, this.distance], this.rotation);
    }

}
