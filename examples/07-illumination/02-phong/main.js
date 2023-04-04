import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';
import { loadTexture, loadMesh } from '../../../common/engine/BasicLoaders.js';

import { Renderer } from './Renderer.js';
import { Material } from './Material.js';
import { Light } from './Light.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);

const root = new Node();

const camera = new Node();
root.addChild(camera);

camera.addComponent(new Transform({
    translation: [0, 2, 5],
}));

camera.addComponent(new Camera({
    near: 0.1,
    far: 100,
}));

const cameraController = new OrbitController(camera, canvas);

const light = new Node();
root.addChild(light);

light.addComponent(new Transform({
    translation: [0, 2, 1],
}));

light.addComponent(new Light());

const model = new Node();
root.addChild(model);

const material = new Material();
model.addComponent(material);

const [mesh, texture, envmap] = await Promise.all([
    loadMesh(gl, '../../../common/models/bunny.json'),
    loadTexture(gl, '../../../common/images/grass.png', {
        mip: true,
        min: gl.NEAREST_MIPMAP_NEAREST,
        mag: gl.NEAREST,
    }),
]);

model.mesh = mesh;
material.texture = texture;

function update(time, dt) {
    cameraController.update(dt);
}

function render() {
    renderer.render(root, camera, light);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(renderer, 'perFragment').onChange(perFragment => {
    renderer.currentProgram = perFragment
        ? renderer.programs.perFragment
        : renderer.programs.perVertex;
});

const lightSettings = light.getComponentOfType(Light);
const lightFolder = gui.addFolder('Light');
lightFolder.open();
lightFolder.add(lightSettings, 'intensity', 0, 5);
lightFolder.addColor(lightSettings, 'color');

const lightTransform = light.getComponentOfType(Transform);
const lightPosition = lightFolder.addFolder('Position');
lightPosition.open();
lightPosition.add(lightTransform.translation, 0, -10, 10).name('x');
lightPosition.add(lightTransform.translation, 1, -10, 10).name('y');
lightPosition.add(lightTransform.translation, 2, -10, 10).name('z');

const lightAttenuation = lightFolder.addFolder('Attenuation');
lightAttenuation.open();
lightAttenuation.add(lightSettings.attenuation, 0, 0, 5).name('constant');
lightAttenuation.add(lightSettings.attenuation, 1, 0, 2).name('linear');
lightAttenuation.add(lightSettings.attenuation, 2, 0, 1).name('quadratic');

const materialFolder = gui.addFolder('Material');
materialFolder.open();
materialFolder.add(material, 'diffuse', 0, 1);
materialFolder.add(material, 'specular', 0, 1);
materialFolder.add(material, 'shininess', 1, 200);

document.querySelector('.loader-container').remove();
