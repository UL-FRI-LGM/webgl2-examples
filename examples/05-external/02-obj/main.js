import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { OBJLoader } from 'engine/loaders/OBJLoader.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';

import {
    Camera,
    Material,
    Mesh,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from 'engine/core.js';

import { OrbitController } from 'engine/controllers/OrbitController.js';

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new OBJLoader();
const mesh = await loader.loadMesh('../../../models/bunny/bunny.obj');

const image = await fetch('../../../models/bunny/grayscale.png')
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob));

const sampler = new Sampler({
    minFilter: 'nearest',
    magFilter: 'nearest',
});

const texture = new Texture({ image, sampler });

const material = new Material({ baseTexture: texture });

const model = new Node();
model.addComponent(new Transform());
model.addComponent(new Model({
    primitives: [
        new Primitive({ mesh, material }),
    ],
}));

const camera = new Node();
camera.addComponent(new Transform());
camera.addComponent(new Camera());
camera.addComponent(new OrbitController(camera, canvas));

const scene = new Node();
scene.addChild(model);
scene.addChild(camera);

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
