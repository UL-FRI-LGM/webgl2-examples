import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { loadTexture, loadModel } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';
import { FirstPersonController } from './FirstPersonController.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const root = new Node();

const camera = new Node();
camera.translation = [0, 1, 0];
camera.projectionMatrix = mat4.create();
root.addChild(camera);

const controller = new FirstPersonController(camera, gl.canvas);

const floor = new Node();
floor.scale = [10, 1, 10];
root.addChild(floor);

const [model, texture] = await Promise.all([
    loadModel(gl, '../../../common/models/floor.json'),
    loadTexture(gl, '../../../common/images/grass.png', {
        mip: true,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
]);

floor.model = model;
floor.texture = texture;

const renderer = new Renderer(gl);

function update(time, dt) {
    controller.update(dt);
}

function render() {
    renderer.render(root, camera);
}

function resize({ displaySize: { width, height }}) {
    const aspect = width / height;
    const fovy = Math.PI / 2;
    const near = 0.1;
    const far = 100;

    mat4.perspective(camera.projectionMatrix, fovy, aspect, near, far);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(controller, 'maxSpeed', 0, 10);
gui.add(controller, 'decay', 0, 1);
gui.add(controller, 'acceleration', 1, 100);

document.querySelector('.loader-container').remove();
