import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

import { loadTexture, loadMesh } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';
import { FirstPersonController } from './FirstPersonController.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const root = new Node();

const camera = new Node();
camera.addComponent(new Transform({
    translation: [0, 1, 0],
}));
camera.addComponent(new Camera({
    fovy: Math.PI / 2,
    near: 0.1,
    far: 100,
}));
root.addChild(camera);

const controller = new FirstPersonController(camera, canvas);

const floor = new Node();
floor.addComponent(new Transform({
    scale: [10, 1, 10],
}));
root.addChild(floor);

const [mesh, texture] = await Promise.all([
    loadMesh(gl, '../../../common/models/floor.json'),
    loadTexture(gl, '../../../common/images/grass.png', {
        mip: true,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
]);

floor.mesh = mesh;
floor.texture = texture;

const renderer = new Renderer(gl);

function update(time, dt) {
    controller.update(dt);
}

function render() {
    renderer.render(root, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(controller, 'maxSpeed', 0, 10);
gui.add(controller, 'decay', 0, 1);
gui.add(controller, 'acceleration', 1, 100);

document.querySelector('.loader-container').remove();
