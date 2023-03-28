import { GUI } from '../../../lib/dat.gui.module.js';
import { quat, mat4 } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/Node.js';
import { OrbitController } from '../../../common/engine/OrbitController.js';
import { loadTexture, loadModel } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';
import { Material } from './Material.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);

const root = new Node();
const camera = new Node();
const model = new Node();
const skybox = new Node();
root.addChild(camera);
root.addChild(model);

const cameraController = new OrbitController(camera, canvas);
camera.projectionMatrix = mat4.create();

const [cube, mesh, texture, envmap] = await Promise.all([
    loadModel(gl, '../../../common/models/cube.json'),
    loadModel(gl, '../../../common/models/bunny.json'),
    loadTexture(gl, '../../../common/images/grayscale.png', {
        mip: true,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
    loadTexture(gl, '../../../common/images/cambridge.webp', {
        min: gl.LINEAR,
        mag: gl.LINEAR,
    }),
]);

skybox.model = cube;
skybox.material = new Material();
skybox.material.envmap = envmap;

model.model = mesh;
model.material = new Material();
model.material.texture = texture;
model.material.envmap = envmap;

function update(time, dt) {
    cameraController.update(dt);
}

function render() {
    renderer.render(root, camera, skybox);
}

function resize({ displaySize: { width, height }}) {
    const aspect = width / height;
    const fovy = Math.PI / 3;
    const near = 0.1;
    const far = 100;

    mat4.perspective(camera.projectionMatrix, fovy, aspect, near, far);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(model.material, 'effect', 0, 1);
gui.add(model.material, 'reflectance', 0, 1);
gui.add(model.material, 'transmittance', 0, 1);
gui.add(model.material, 'ior', 0, 1);

document.querySelector('.loader-container').remove();
