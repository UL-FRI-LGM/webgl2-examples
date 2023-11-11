import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { GLTFLoader } from '../../../common/engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from '../../../common/engine/renderers/UnlitRenderer.js';
import { FirstPersonController } from '../../../common/engine/controllers/FirstPersonController.js';

import { Camera, Model } from '../../../common/engine/core.js';

import {
    calculateAxisAlignedBoundingBox,
    mergeAxisAlignedBoundingBoxes,
} from '../../../common/engine/core/MeshUtils.js';

import { Physics } from './Physics.js';

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load('scene/scene.gltf');

const scene = loader.loadScene(loader.defaultScene);
const camera = loader.loadNode('Camera');
camera.addComponent(new FirstPersonController(camera, canvas));
camera.isDynamic = true;
camera.aabb = {
    min: [-0.2, -0.2, -0.2],
    max: [0.2, 0.2, 0.2],
};

loader.loadNode('Box.000').isStatic = true;
loader.loadNode('Box.001').isStatic = true;
loader.loadNode('Box.002').isStatic = true;
loader.loadNode('Box.003').isStatic = true;
loader.loadNode('Box.004').isStatic = true;
loader.loadNode('Box.005').isStatic = true;
loader.loadNode('Wall.000').isStatic = true;
loader.loadNode('Wall.001').isStatic = true;
loader.loadNode('Wall.002').isStatic = true;
loader.loadNode('Wall.003').isStatic = true;

const physics = new Physics(scene);
scene.traverse(node => {
    const model = node.getComponentOfType(Model);
    if (!model) {
        return;
    }

    const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
    node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
});

function update(time, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(time, dt);
        }
    });

    physics.update(time, dt);
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
