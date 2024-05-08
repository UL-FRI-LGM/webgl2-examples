import { quat, vec2, vec3 } from 'glm';

import { Transform } from 'engine/core/Transform.js';

export class TouchController {

    constructor(node, domElement, {
        translation = [0, 0, 0],
        rotation = [0, 0, 0, 1],
        distance = 2,
        translateSensitivity = 0.001,
        rotateSensitivity = 0.004,
        wheelSensitivity = 0.002,
    } = {}) {
        this.node = node;
        this.domElement = domElement;

        this.translation = translation;
        this.rotation = rotation;
        this.distance = distance;

        this.translateSensitivity = translateSensitivity;
        this.rotateSensitivity = rotateSensitivity;
        this.wheelSensitivity = wheelSensitivity;

        this.pointers = new Map();
        this.initHandlers();
    }

    initHandlers() {
        this.pointerdownHandler = this.pointerdownHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.wheelHandler = this.wheelHandler.bind(this);

        this.domElement.addEventListener('pointerdown', this.pointerdownHandler);
        this.domElement.addEventListener('pointerup', this.pointerupHandler);
        this.domElement.addEventListener('pointercancel', this.pointerupHandler);
        this.domElement.addEventListener('pointermove', this.pointermoveHandler);
        this.domElement.addEventListener('wheel', this.wheelHandler);
    }

    pointerdownHandler(e) {
        this.pointers.set(e.pointerId, e);
        this.domElement.setPointerCapture(e.pointerId);
        this.domElement.requestPointerLock();
    }

    pointerupHandler(e) {
        this.pointers.delete(e.pointerId);
        this.domElement.releasePointerCapture(e.pointerId);
        this.domElement.ownerDocument.exitPointerLock();
    }

    pointermoveHandler(e) {
        if (!this.pointers.has(e.pointerId)) {
            return;
        }

        if (this.pointers.size === 1) {
            if (e.shiftKey) {
                this.translate(e.movementX, e.movementY);
            } else {
                this.rotate(e.movementX, e.movementY);
            }
            this.pointers.set(e.pointerId, e);
        } else {
            const N = this.pointers.size;

            // Points before movement
            const A = [...this.pointers.values()].map(e => [e.clientX, e.clientY]);

            this.pointers.set(e.pointerId, e);

            // Points after movement
            const B = [...this.pointers.values()].map(e => [e.clientX, e.clientY]);

            const centroidA = A.reduce((a, v) => vec2.scaleAndAdd(a, a, v, 1 / N), [0, 0]);
            const centroidB = B.reduce((a, v) => vec2.scaleAndAdd(a, a, v, 1 / N), [0, 0]);

            const translation = vec2.subtract(vec2.create(), centroidB, centroidA);

            const centeredA = A.map(v => vec2.subtract(vec2.create(), v, centroidA));
            const centeredB = B.map(v => vec2.subtract(vec2.create(), v, centroidB));

            const scaleA = centeredA.reduce((a, v) => a + vec2.length(v) / N, 0);
            const scaleB = centeredB.reduce((a, v) => a + vec2.length(v) / N, 0);

            const scale = scaleA / scaleB;

            const normalizedA = centeredA.map(v => vec2.normalize(vec2.create(), v));
            const normalizedB = centeredB.map(v => vec2.normalize(vec2.create(), v));

            let sin = 0;
            for (let i = 0; i < A.length; i++) {
                const a = normalizedA[i];
                const b = normalizedB[i];
                sin += (a[0] * b[1] - a[1] * b[0]) / N;
            }
            const angle = Math.asin(sin);

            this.translate(...translation);
            this.scale(scale);
            this.screw(angle);
        }
    }

    wheelHandler(e) {
        this.scale(Math.exp(e.deltaY * this.wheelSensitivity));
    }

    screw(amount) {
        quat.rotateZ(this.rotation, this.rotation, amount);
    }

    rotate(dx, dy) {
        quat.rotateX(this.rotation, this.rotation, -dy * this.rotateSensitivity);
        quat.rotateY(this.rotation, this.rotation, -dx * this.rotateSensitivity);
        quat.normalize(this.rotation, this.rotation);
    }

    translate(dx, dy) {
        const translation = [-dx, dy, 0];
        vec3.transformQuat(translation, translation, this.rotation);
        vec3.scaleAndAdd(this.translation, this.translation, translation, this.distance * this.translateSensitivity);
    }

    scale(amount) {
        this.distance *= amount;
    }

    update() {
        const transform = this.node.getComponentOfType(Transform);
        if (!transform) {
            return;
        }

        quat.copy(transform.rotation, this.rotation);
        vec3.transformQuat(transform.translation, [0, 0, this.distance], this.rotation);
        vec3.add(transform.translation, transform.translation, this.translation);
    }

}
