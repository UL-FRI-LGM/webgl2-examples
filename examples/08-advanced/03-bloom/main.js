import { GUI } from '../../../lib/dat.gui.module.js';
import { vec3, mat4, quat } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';
import { loadTexture, loadModel } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);

const scene = new Node();

const camera = new Node();
scene.addChild(camera);

camera.addComponent(new Transform());
camera.addComponent(new Camera());

const cameraController = new OrbitController(camera, canvas);
cameraController.distance = 10;

const cubeRoot = new Node();
scene.addChild(cubeRoot);

const [cubeMesh, cubeDiffuseTexture, cubeEmissionTexture] = await Promise.all([
    loadModel(gl, '../../../common/models/cube.json'),
    loadTexture(gl, '../../../common/images/crate-diffuse.png', {
        mip: true,
        iformat: gl.SRGB8_ALPHA8,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
    loadTexture(gl, '../../../common/images/crate-emission.png', {
        mip: true,
        iformat: gl.SRGB8_ALPHA8,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
]);

const cubeCount = 100;
for (let i = 0; i < cubeCount; i++) {
    const cube = new Node();
    cubeRoot.addChild(cube);

    cube.addComponent(new Transform({
        translation: vec3.random(vec3.create(), Math.random() * 5),
        rotation: quat.random(quat.create()),
        scale: vec3.scale(vec3.create(), [1, 1, 1], 0.1 + Math.random()),
    }));

    cube.diffuseTexture = cubeDiffuseTexture;
    cube.emissionTexture = cubeEmissionTexture;
    cube.mesh = cubeMesh;
}

function update() {
    cameraController.update();
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
    renderer.resize(width, height);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(renderer, 'emissionStrength', 0, 10);
gui.add(renderer, 'bloomIntensity', 0, 2);
gui.add(renderer, 'bloomThreshold', 0, 5);
gui.add(renderer, 'bloomKnee', 0, 1);
gui.add(renderer, 'preExposure', 0, 5);
gui.add(renderer, 'postExposure', 0, 5);
gui.add(renderer, 'gamma', 0.5, 3);

document.querySelector('.loader-container').remove();
