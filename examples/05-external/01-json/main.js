import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { JSONLoader } from '../../../common/engine/loaders/JSONLoader.js';
import { UnlitRenderer } from '../../../common/engine/renderers/UnlitRenderer.js';

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
} from '../../../common/engine/core.js';

import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const loader = new JSONLoader();
const mesh = await loader.loadMesh('../../../common/models/bunny.json');

const image = await fetch('../../../common/images/grayscale.png')
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

const renderer = new UnlitRenderer(gl);

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
