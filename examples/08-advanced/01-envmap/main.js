import { GUI } from 'dat';
import { quat, mat4 } from 'glm';

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

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);
await renderer.initialize();

const scene = new Node();

const camera = new Node();
camera.addComponent(new Transform());
camera.addComponent(new Camera());
camera.addComponent(new OrbitController(camera, canvas));
scene.addChild(camera);

const [cubeMesh, modelMesh, baseImage, envmapImage] = await Promise.all([
    new JSONLoader().loadMesh('../../../models/cube/cube.json'),
    new JSONLoader().loadMesh('../../../models/bunny/bunny.json'),
    new ImageLoader().load('../../../models/bunny/grayscale.png'),
    new ImageLoader().load('cambridge.webp'),
]);

const modelMaterial = new Material({
    baseTexture: new Texture({
        image: baseImage,
        sampler: new Sampler({
            minFilter: 'nearest',
            magFilter: 'nearest',
        }),
        isSRGB: true,
    }),
});

modelMaterial.effect = 1;
modelMaterial.reflectance = 0.2;
modelMaterial.transmittance = 0.8;
modelMaterial.ior = 0.75;

const model = new Node();
model.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: modelMesh,
            material: modelMaterial,
        }),
    ],
}));
scene.addChild(model);

const skybox = new Node();
skybox.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: cubeMesh,
            material: new Material({
                baseTexture: new Texture({
                    image: envmapImage,
                    sampler: new Sampler({
                        minFilter: 'linear',
                        magFilter: 'linear',
                    }),
                    isSRGB: true,
                }),
            }),
        }),
    ],
}));

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });
}

function render() {
    renderer.render(scene, camera, skybox);
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
