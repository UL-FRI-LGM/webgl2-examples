import { GUI } from 'dat';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { ImageLoader } from 'engine/loaders/ImageLoader.js';
import { JSONLoader } from 'engine/loaders/JSONLoader.js';

import { OrbitController } from 'engine/controllers/OrbitController.js';

import {
    Camera,
    Material,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from 'engine/core.js';

import { Renderer } from './Renderer.js';
import { Light } from './Light.js';

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);
await renderer.initialize();

const scene = new Node();

const camera = new Node();
camera.addComponent(new Transform());
camera.addComponent(new Camera());
camera.addComponent(new OrbitController(camera, canvas));
scene.addChild(camera);

const light = new Node();
light.addComponent(new Transform({
    translation: [0, 2, 1],
}));
light.addComponent(new Light());
scene.addChild(light);

const material = new Material({
    baseTexture: new Texture({
        image: await new ImageLoader().load('../../../models/floor/grass.png'),
        sampler: new Sampler({
            minFilter: 'nearest',
            magFilter: 'nearest',
        }),
        isSRGB: true,
    }),
});

material.diffuse = 1;
material.specular = 1;
material.shininess = 50;

const model = new Node();
model.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: await new JSONLoader().loadMesh('../../../models/bunny/bunny.json'),
            material,
        }),
    ],
}));
scene.addChild(model);

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });
}

function render() {
    renderer.render(scene, camera, light);
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
