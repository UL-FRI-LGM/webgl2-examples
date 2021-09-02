import { GUI } from '../../lib/dat.gui.module.js';
import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { Node } from './Node.js';

import { shaders } from './shaders.js';
import * as FloorModel from './floor.js';

class App extends Application {

    initGL() {
        const gl = this.gl;

        gl.clearColor(0.85, 0.98, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    initHandlers() {
        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        this.mousemoveHandler = this.mousemoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);
        this.keys = {};

        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler);
        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    start() {
        const gl = this.gl;

        this.initGL();
        this.initHandlers();

        const floorModel = this.createModel(FloorModel);
        const defaultTexture = WebGL.createTexture(gl, {
            data   : new Uint8Array([255, 255, 255, 255]),
            width  : 1,
            height : 1,
        });

        this.time = Date.now();
        this.startTime = this.time;

        this.root = new Node();

        this.camera = new Node();
        this.root.addChild(this.camera);
        Object.assign(this.camera, {
            projection       : mat4.create(),
            rotation         : vec3.set(vec3.create(), 0, 0, 0),
            translation      : vec3.set(vec3.create(), 0, 1, 0),
            velocity         : vec3.set(vec3.create(), 0, 0, 0),
            mouseSensitivity : 0.002,
            maxSpeed         : 3,
            friction         : 0.2,
            acceleration     : 20
        });

        this.floor = new Node();
        this.floor.model = floorModel;
        this.floor.texture = defaultTexture;
        this.root.addChild(this.floor);
        mat4.fromScaling(this.floor.transform, [10, 1, 10]);

        this.loadTexture('../../common/images/grass.png', {
            mip: true,
            min: gl.NEAREST_MIPMAP_NEAREST,
            mag: gl.NEAREST,
        }, texture => {
            this.floor.texture = texture;
        });
    }

    update() {
        this.time = Date.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        const c = this.camera;

        const forward = vec3.set(vec3.create(),
            -Math.sin(c.rotation[1]), 0, -Math.cos(c.rotation[1]));
        const right = vec3.set(vec3.create(),
            Math.cos(c.rotation[1]), 0, -Math.sin(c.rotation[1]));

        // 1: add movement acceleration
        let acc = vec3.create();
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

        // 2: update velocity
        vec3.scaleAndAdd(c.velocity, c.velocity, acc, dt * c.acceleration);

        // 3: if no movement, apply friction
        if (!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA'])
        {
            vec3.scale(c.velocity, c.velocity, 1 - c.friction);
        }

        // 4: limit speed
        const len = vec3.len(c.velocity);
        if (len > c.maxSpeed) {
            vec3.scale(c.velocity, c.velocity, c.maxSpeed / len);
        }

        // 5: update translation
        vec3.scaleAndAdd(c.translation, c.translation, c.velocity, dt);

        // 6: update the final transform
        const t = c.transform;
        mat4.identity(t);
        mat4.translate(t, t, c.translation);
        mat4.rotateY(t, t, c.rotation[1]);
        mat4.rotateX(t, t, c.rotation[0]);
    }

    enableMouseLook() {
        this.canvas.requestPointerLock();
    }

    pointerlockchangeHandler() {
        if (document.pointerLockElement === this.canvas) {
            this.canvas.addEventListener('mousemove', this.mousemoveHandler);
        } else {
            this.canvas.removeEventListener('mousemove', this.mousemoveHandler);
        }
    }

    mousemoveHandler(e) {
        const dx = e.movementX;
        const dy = e.movementY;
        const c = this.camera;
        c.rotation[0] -= dy * c.mouseSensitivity;
        c.rotation[1] -= dx * c.mouseSensitivity;

        const pi = Math.PI;
        const twopi = pi * 2;
        const halfpi = pi / 2;

        // Limit pitch
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

        const program = this.programs.simple;
        gl.useProgram(program.program);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.uTexture, 0);

        let mvpMatrix = mat4.create();
        let mvpStack = [];
        const mvpLocation = program.uniforms.uModelViewProjection;
        const viewMatrix = this.camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(mvpMatrix, this.camera.projection, viewMatrix);

        this.root.traverse(
            node => {
                mvpStack.push(mat4.clone(mvpMatrix));
                mat4.mul(mvpMatrix, mvpMatrix, node.transform);
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

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);

        const indices = model.indices.length;
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 16);

        return { vao, indices };
    }

    loadTexture(url, options, handler) {
        const gl = this.gl;

        let image = new Image();
        image.addEventListener('load', () => {
            const opts = Object.assign({ image }, options);
            handler(WebGL.createTexture(gl, opts));
        });
        image.src = url;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new GUI();
    gui.add(app.camera, 'mouseSensitivity', 0.0001, 0.01);
    gui.add(app.camera, 'maxSpeed', 0, 10);
    gui.add(app.camera, 'friction', 0.05, 0.75);
    gui.add(app.camera, 'acceleration', 1, 100);
    gui.add(app, 'enableMouseLook');
});
