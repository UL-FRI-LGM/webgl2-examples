import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';
import { loadTexture, loadModel } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';
import { Material } from './Material.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);

const root = new Node();
const camera = new Node();
const light = new Node();
const model = new Node();
root.addChild(camera);
root.addChild(light);
root.addChild(model);

light.position = [0, 2, 1];
light.color = [255, 255, 255];
light.intensity = 1;
light.attenuation = [0.001, 0, 0.3];

camera.projectionMatrix = mat4.create();
camera.translation = [0, 2, 5];

const cameraController = new OrbitController(camera, canvas);

const [mesh, texture, envmap] = await Promise.all([
    loadModel(gl, '../../../common/models/bunny.json'),
    loadTexture(gl, '../../../common/images/grass.png', {
        mip: true,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
]);

model.model = mesh;
model.material = new Material();
model.material.texture = texture;

function update(time, dt) {
    cameraController.update(dt);
    light.translation = light.position;
}

function render() {
    renderer.render(root, camera, light);
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
gui.add(renderer, 'perFragment').onChange(perFragment => {
    renderer.currentProgram = perFragment
        ? renderer.programs.perFragment
        : renderer.programs.perVertex;
});

const lightFolder = gui.addFolder('Light');
lightFolder.open();
lightFolder.add(light, 'intensity', 0, 5);
lightFolder.addColor(light, 'color');
const lightPosition = lightFolder.addFolder('Position');
lightPosition.open();
lightPosition.add(light.position, 0, -10, 10).name('x');
lightPosition.add(light.position, 1, -10, 10).name('y');
lightPosition.add(light.position, 2, -10, 10).name('z');
const lightAttenuation = lightFolder.addFolder('Attenuation');
lightAttenuation.open();
lightAttenuation.add(light.attenuation, 0, 0, 5).name('constant');
lightAttenuation.add(light.attenuation, 1, 0, 2).name('linear');
lightAttenuation.add(light.attenuation, 2, 0, 1).name('quadratic');

const materialFolder = gui.addFolder('Material');
materialFolder.open();
materialFolder.add(model.material, 'diffuse', 0, 1);
materialFolder.add(model.material, 'specular', 0, 1);
materialFolder.add(model.material, 'shininess', 1, 200);

document.querySelector('.loader-container').remove();
