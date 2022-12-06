import { quat, vec3 } from '../../lib/gl-matrix-module.js';

export class OrbitController {

    constructor(node, domElement) {
        this.node = node;
        this.domElement = domElement;

        this.pitch = 0;
        this.yaw = 0;
        this.distance = 2;

        this.moveSensitivity = 0.004;
        this.zoomSensitivity = 0.002;

        this.initHandlers();
    }

    initHandlers() {
        this.pointerdownHandler = this.pointerdownHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.wheelHandler = this.wheelHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        element.addEventListener('pointerdown', this.pointerdownHandler);
        element.addEventListener('wheel', this.wheelHandler);
    }

    pointerdownHandler(e) {
        this.domElement.setPointerCapture(e.pointerId);
        this.domElement.removeEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.addEventListener('pointerup', this.pointerupHandler);
        this.domElement.addEventListener('pointermove', this.pointermoveHandler);
    }

    pointerupHandler(e) {
        this.domElement.releasePointerCapture(e.pointerId);
        this.domElement.addEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.removeEventListener('pointerup', this.pointerupHandler);
        this.domElement.removeEventListener('pointermove', this.pointermoveHandler);
    }

    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.moveSensitivity;
        this.yaw   -= dx * this.moveSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    wheelHandler(e) {
        this.distance *= Math.exp(this.zoomSensitivity * e.deltaY);
    }

    update() {
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;

        const translation = [0, 0, this.distance];
        vec3.rotateX(translation, translation, [0, 0, 0], this.pitch);
        vec3.rotateY(translation, translation, [0, 0, 0], this.yaw);
        this.node.translation = translation;
    }

}
