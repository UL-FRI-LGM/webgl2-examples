import { GUI } from '../../../lib/dat.gui.module.js';
import { quat, mat4 } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';
import { loadTexture, loadModel } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';
import { Material } from './Material.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);

const root = new Node();

const camera = new Node();
root.addChild(camera);

camera.addComponent(new Transform());
camera.addComponent(new Camera({
    near: 0.1,
    far: 100,
}));

const cameraController = new OrbitController(camera, canvas);

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

const model = new Node();
root.addChild(model);

model.model = mesh;

const modelMaterial = new Material();
modelMaterial.texture = texture;
modelMaterial.envmap = envmap;

model.addComponent(modelMaterial);

const skybox = new Node();
skybox.model = cube;

const skyboxMaterial = new Material();
skyboxMaterial.envmap = envmap;

skybox.addComponent(skyboxMaterial);

function update(time, dt) {
    cameraController.update(dt);
}

function render() {
    renderer.render(root, camera, skybox);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(modelMaterial, 'effect', 0, 1);
gui.add(modelMaterial, 'reflectance', 0, 1);
gui.add(modelMaterial, 'transmittance', 0, 1);
gui.add(modelMaterial, 'ior', 0, 1);

document.querySelector('.loader-container').remove();
