import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4, vec3, quat } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';
import { loadTexture, loadModel } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);

const scene = new Node();
const camera = new Node();
camera.projectionMatrix = mat4.create();
scene.addChild(camera);

const cameraController = new OrbitController(camera, canvas);
cameraController.distance = 10;

const cubeRoot = new Node();
scene.addChild(cubeRoot);

const [cubeMesh, cubeTexture] = await Promise.all([
    loadModel(gl, '../../../common/models/cube.json'),
    loadTexture(gl, '../../../common/images/crate-diffuse.png', {
        mip: true,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
]);

const cubeCount = 100;
for (let i = 0; i < cubeCount; i++) {
    const cube = new Node();
    cube.texture = cubeTexture;
    cube.mesh = cubeMesh;

    const scale = 0.1 + Math.random();
    cube.translation = vec3.random(vec3.create(), Math.random() * 5);
    cube.rotation = quat.random(quat.create());
    cube.scale = [scale, scale, scale];

    cubeRoot.addChild(cube);
}

function update() {
    cameraController.update();
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    const aspect = width / height;
    const fovy = Math.PI / 3;
    const near = 0.1;
    const far = 100;

    mat4.perspective(camera.projectionMatrix, fovy, aspect, near, far);

    renderer.createGeometryBuffer();
    renderer.createSSAOBuffer();
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(renderer, 'colorEnabled');
gui.add(renderer, 'occlusionEnabled');
gui.add(renderer, 'occlusionStrength', 0, 10);
gui.add(renderer, 'occlusionScale', 0, 2);
gui.add(renderer, 'occlusionRange', 0, 2);
gui.add(renderer, 'depthBias', 0, 0.5);
gui.add(renderer, 'occlusionSampleCount',
    [1, 2, 4, 8, 16, 32, 64]
).onChange(value => renderer.createSSAOSamples());

document.querySelector('.loader-container').remove();
