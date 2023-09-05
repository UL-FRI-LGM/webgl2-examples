import { GUI } from '../../../lib/dat.gui.module.js';
import { vec3, mat4, quat } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { ImageLoader } from '../../../common/engine/loaders/ImageLoader.js';
import { JSONLoader } from '../../../common/engine/loaders/JSONLoader.js';

import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';

import {
    Camera,
    Material,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from '../../../common/engine/core.js';

import { Renderer } from './Renderer.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const renderer = new Renderer(gl);

const scene = new Node();

const camera = new Node();
camera.addComponent(new Transform());
camera.addComponent(new Camera({
    near: 0.1,
    far: 100,
}));
camera.addComponent(new OrbitController(camera, canvas, {
    distance: 10,
}));
scene.addChild(camera);

const cubeRoot = new Node();
scene.addChild(cubeRoot);

const [cubeMesh, cubeDiffuse, cubeEmission] = await Promise.all([
    new JSONLoader().loadMesh('../../../common/models/cube.json'),
    new ImageLoader().load('../../../common/images/crate-diffuse.png'),
    new ImageLoader().load('../../../common/images/crate-emission.png'),
]);

const cubeModel = new Model({
    primitives: [
        new Primitive({
            mesh: cubeMesh,
            material: new Material({
                baseTexture: new Texture({
                    image: cubeDiffuse,
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                    }),
                }),
                emissionTexture: new Texture({
                    image: cubeEmission,
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                    }),
                }),
            }),
        }),
    ],
});

const cubeCount = 100;
for (let i = 0; i < cubeCount; i++) {
    const cube = new Node();
    cube.addComponent(new Transform({
        translation: vec3.random(vec3.create(), Math.random() * 5),
        rotation: quat.random(quat.create()),
        scale: vec3.scale(vec3.create(), [1, 1, 1], 0.1 + Math.random()),
    }));
    cube.addComponent(cubeModel);
    cubeRoot.addChild(cube);
}

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });
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
