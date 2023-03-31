import { mat4, vec3, quat } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';
import { loadTexture, loadMesh } from '../../../common/engine/BasicLoaders.js';

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

const shadowCameraRoot = new Node();
cubeRoot.addChild(shadowCameraRoot);

shadowCameraRoot.addComponent(new Transform());

const shadowCamera = new Node();
shadowCameraRoot.addChild(shadowCamera);

shadowCamera.addComponent(new Transform({
    translation: [0, 0, 20],
}));

shadowCamera.addComponent(new Camera({
    fovy: 0.5,
    near: 15,
    far: 50,
}));

const [cubeMesh, cubeTexture] = await Promise.all([
    loadMesh(gl, '../../../common/models/cube.json'),
    loadTexture(gl, '../../../common/images/crate-diffuse.png', {
        mip: true,
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

    cube.texture = cubeTexture;
    cube.mesh = cubeMesh;
}

function update(time, dt) {
    cameraController.update();
    const shadowTransform = shadowCameraRoot.getComponentOfType(Transform);
    quat.setAxisAngle(shadowTransform.rotation, [0, 1, 0], time * 0.1);
}

function render() {
    renderer.render(scene, camera, shadowCamera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
    renderer.resize(width, height);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

document.querySelector('.loader-container').remove();
