import { GUI } from '../../lib/dat.gui.module.js';
import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { Node } from './Node.js';

import { shaders } from './shaders.js';

class App extends Application {

    initGL() {
        const gl = this.gl;

        gl.clearColor(0.85, 0.98, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    initHandlers() {
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);

        this.canvas.addEventListener('click', e => this.canvas.requestPointerLock());
        document.addEventListener('pointerlockchange', e => {
            if (document.pointerLockElement === this.canvas) {
                document.addEventListener('pointermove', this.pointermoveHandler);
            } else {
                document.removeEventListener('pointermove', this.pointermoveHandler);
            }
        });
    }

    async start() {
        const gl = this.gl;

        this.initGL();
        this.initHandlers();

        this.time = performance.now();
        this.startTime = this.time;

        this.root = new Node();

        this.camera = new Node();
        this.root.addChild(this.camera);
        Object.assign(this.camera, {
            projection: mat4.create(),

            // We are going to use Euler angles for rotation.
            // Specifically, we are going to use x-rotation for tilting
            // and y-rotation for panning.
            rotation: vec3.set(vec3.create(), 0, 0, 0),

            // We are also going to store the translation separately and
            // use it to recompute the transformation matrix every frame.
            translation: vec3.set(vec3.create(), 0, 1, 0),

            // This is going to be a simple decay-based model, where
            // the user input is used as acceleration. The acceleration
            // is used to update velocity, which is in turn used to update
            // translation. If there is no user input, speed will decay.
            velocity: vec3.set(vec3.create(), 0, 0, 0),

            // The model needs some limits and parameters.

            // Acceleration in meters per second squared.
            acceleration: 20,

            // Maximum speed in meters per second.
            maxSpeed: 3,

            // Decay as 1 - log percent max speed loss per second.
            decay: 0.9,

            // Pointer sensitivity in radians per pixel.
            pointerSensitivity : 0.002,
        });

        this.floor = new Node();
        this.root.addChild(this.floor);
        mat4.fromScaling(this.floor.matrix, [10, 1, 10]);

        const [model, texture] = await Promise.all([
            this.loadModel('../../common/models/floor.json'),
            this.loadTexture('../../common/images/grass.png', {
                mip: true,
                min: gl.NEAREST_MIPMAP_NEAREST,
                mag: gl.NEAREST,
            }),
        ]);

        this.floor.model = model;
        this.floor.texture = texture;
    }

    update() {
        // We are essentially solving the system of differential equations
        //
        //   a = dv/dt
        //   v = dx/dt
        //
        // where a is acceleration, v is speed and x is translation.
        // The system can be sufficiently solved with Euler's method:
        //
        //   v(t + dt) = v(t) + a(t) * dt
        //   x(t + dt) = x(t) + v(t) * dt
        //
        // which can be implemented as
        //
        //   v += a * dt
        //   x += v * dt
        //
        // Needless to say, better methods exist. Specifically, second order
        // methods accurately compute the solution to our second order system,
        // whereas there is always going to be some error related to the
        // exponential decay.

        const c = this.camera;

        // Calculate dt as the time difference from the previous frame.
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;


        // Calculate forward and right vectors from the y-orientation.
        const cos = Math.cos(c.rotation[1]);
        const sin = Math.sin(c.rotation[1]);
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

        // Update velocity based on acceleration (first line of Euler's method).
        vec3.scaleAndAdd(c.velocity, c.velocity, acc, dt * c.acceleration);

        // If there is no user input, apply decay.
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
        {
            const decay = Math.exp(dt * Math.log(1 - c.decay));
            vec3.scale(c.velocity, c.velocity, decay);
        }

        // Limit speed to prevent accelerating to infinity and beyond.
        const len = vec3.len(c.velocity);
        if (len > c.maxSpeed) {
            vec3.scale(c.velocity, c.velocity, c.maxSpeed / len);
        }

        // Update translation based on velocity (second line of Euler's method).
        vec3.scaleAndAdd(c.translation, c.translation, c.velocity, dt);

        // Update the final transformation matrix based on the updated variables.
        const m = c.matrix;
        mat4.identity(m);
        mat4.translate(m, m, c.translation);
        mat4.rotateY(m, m, c.rotation[1]);
        mat4.rotateX(m, m, c.rotation[0]);
    }

    pointermoveHandler(e) {
        // Rotation can be updated through the pointermove handler.
        // Given that pointermove is only called under pointer lock,
        // movementX/Y will be available.

        const c = this.camera;

        // Horizontal pointer movement causes camera panning (y-rotation),
        // vertical pointer movement causes camera tilting (x-rotation).
        const dx = e.movementX;
        const dy = e.movementY;
        c.rotation[0] -= dy * c.pointerSensitivity;
        c.rotation[1] -= dx * c.pointerSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        // Limit pitch so that the camera does not invert on itself.
        if (c.rotation[0] > halfpi) {
            c.rotation[0] = halfpi;
        }
        if (c.rotation[0] < -halfpi) {
            c.rotation[0] = -halfpi;
        }

        // Constrain yaw to the range [0, pi * 2]
        c.rotation[1] = ((c.rotation[1] % twopi) + twopi) % twopi;
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }

    render() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.simple;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uTexture, 0);

        let mvpMatrix = mat4.create();
        const mvpStack = [];
        const mvpLocation = uniforms.uModelViewProjection;
        const viewMatrix = this.camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(mvpMatrix, this.camera.projection, viewMatrix);

        this.root.traverse(
            node => {
                mvpStack.push(mat4.clone(mvpMatrix));
                mat4.mul(mvpMatrix, mvpMatrix, node.matrix);
                if (node.model) {
                    gl.bindVertexArray(node.model.vao);
                    gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
                    gl.bindTexture(gl.TEXTURE_2D, node.texture);
                    gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
                }
            },
            node => {
                mvpMatrix = mvpStack.pop();
            }
        );
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;
        const fovy = Math.PI / 2;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projection, fovy, aspect, near, far);
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    async loadModel(url) {
        const response = await fetch(url);
        const json = await response.json();
        return this.createModel(json);
    }

    async loadTexture(url, options) {
        const response = await fetch(url);
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        const spec = Object.assign({ image }, options);
        return WebGL.createTexture(this.gl, spec);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app.camera, 'pointerSensitivity', 0.0001, 0.01);
gui.add(app.camera, 'maxSpeed', 0, 10);
gui.add(app.camera, 'decay', 0, 1);
gui.add(app.camera, 'acceleration', 1, 100);
