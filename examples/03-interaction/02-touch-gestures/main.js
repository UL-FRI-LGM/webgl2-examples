import { mat4 } from 'glm';

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

import * as WebGL from 'engine/WebGL.js';
import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';
import { ImageLoader } from 'engine/loaders/ImageLoader.js';
import { JSONLoader } from 'engine/loaders/JSONLoader.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';

import { TouchController } from './TouchController.js';

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const scene = new Node();

const camera = new Node();
camera.addComponent(new Transform({
    translation: [0, 1, 0],
}));
camera.addComponent(new Camera({
    near: 0.01,
    far: 1000,
}));
camera.addComponent(new TouchController(camera, canvas, { distance: 5 }));
scene.addChild(camera);

const floor = new Node();
floor.addComponent(new Transform());
floor.addComponent(new Model({
    primitives: [
        new Primitive({
            mesh: await new JSONLoader().loadMesh('../../../models/cube/cube.json'),
            material: new Material({
                baseTexture: new Texture({
                    image: await new ImageLoader().load('../../../models/floor/grass.png'),
                    sampler: new Sampler({
                        minFilter: 'nearest',
                        magFilter: 'nearest',
                    }),
                    isSRGB: true,
                }),
            }),
        }),
    ],
}));
scene.addChild(floor);

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
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

document.querySelector('.loader-container').remove();
