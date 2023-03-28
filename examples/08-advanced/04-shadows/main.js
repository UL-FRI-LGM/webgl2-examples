import { mat4, vec3, quat } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/Node.js';
import { OrbitController } from '../../../common/engine/OrbitController.js';
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

const shadowCameraRoot = new Node();
const shadowCamera = new Node();
shadowCamera.projectionMatrix = mat4.create();
mat4.perspective(shadowCamera.projectionMatrix, 0.5, 1, 15, 50);
shadowCamera.translation = [0, 0, 20];
shadowCamera.aspect = 0.3;
shadowCamera.near = 15;
shadowCamera.far = 50;
cubeRoot.addChild(shadowCameraRoot);
shadowCameraRoot.addChild(shadowCamera);

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

function update(time, dt) {
    cameraController.update();
    shadowCameraRoot.rotation =
        quat.setAxisAngle(quat.create(), [0, 1, 0], time * 0.1);
}

function render() {
    renderer.render(scene, camera, shadowCamera);
}

function resize({ displaySize: { width, height }}) {
    const aspect = width / height;
    const fovy = Math.PI / 3;
    const near = 0.1;
    const far = 100;

    mat4.perspective(camera.projectionMatrix, fovy, aspect, near, far);

    renderer.createShadowBuffer();
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

document.querySelector('.loader-container').remove();
