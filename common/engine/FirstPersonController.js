import { quat, vec3, mat4 } from '../../lib/gl-matrix-module.js';

export class FirstPersonController {

    constructor(node, domElement) {
        this.node = node;
        this.domElement = domElement;

        this.keys = {};

        this.pitch = 0;
        this.yaw = 0;

        this.velocity = [0, 0, 0];
        this.acceleration = 20;
        this.maxSpeed = 3;
        this.decay = 0.9;
        this.pointerSensitivity = 0.002;

        this.initHandlers();
    }

    initHandlers() {
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const element = this.domElement;
        const doc = element.ownerDocument;

        doc.addEventListener('keydown', this.keydownHandler);
        doc.addEventListener('keyup', this.keyupHandler);

        element.addEventListener('click', e => element.requestPointerLock());
        doc.addEventListener('pointerlockchange', e => {
            if (doc.pointerLockElement === element) {
                doc.addEventListener('pointermove', this.pointermoveHandler);
            } else {
                doc.removeEventListener('pointermove', this.pointermoveHandler);
            }
        });
    }

    update(dt) {
        // Calculate forward and right vectors.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const forward = [-sin, 0, -cos];
        const right = [cos, 0, -sin];

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if (this.keys['KeyW']) {
            vec3.add(acc, acc, forward);
        }
        if (this.keys['KeyS']) {
            vec3.sub(acc, acc, forward);
        }
        if (this.keys['KeyD']) {
            vec3.add(acc, acc, right);
        }
        if (this.keys['KeyA']) {
            vec3.sub(acc, acc, right);
        }

        // Update velocity based on acceleration.
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // If there is no user input, apply decay.
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
        {
            const decay = Math.exp(dt * Math.log(1 - this.decay));
            vec3.scale(this.velocity, this.velocity, decay);
        }

        // Limit speed to prevent accelerating to infinity and beyond.
        const speed = vec3.length(this.velocity);
        if (speed > this.maxSpeed) {
            vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
        }

        // Update translation based on velocity.
        this.node.translation = vec3.scaleAndAdd(vec3.create(),
            this.node.translation, this.velocity, dt);

        // Update rotation based on the Euler angles.
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        this.node.rotation = rotation;
    }

    pointermoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.pointerSensitivity;
        this.yaw   -= dx * this.pointerSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

}
