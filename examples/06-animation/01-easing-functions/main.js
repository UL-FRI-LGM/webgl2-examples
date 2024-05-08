import { quat, vec3, mat4 } from 'glm';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';
import { TurntableController } from 'engine/controllers/TurntableController.js';
import { getGlobalModelMatrix } from 'engine/core/SceneUtils.js';
import { Camera, Transform } from 'engine/core.js';

import * as EasingFunctions from 'engine/animators/EasingFunctions.js';

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load('scene/scene.gltf');

const scene = loader.loadScene(loader.defaultScene);
const camera = loader.loadNode('Camera');
camera.addComponent(new TurntableController(camera, canvas, {
    distance: 10,
    pitch: -0.1,
}));

const cube = loader.loadNode('Cube');
const start = loader.loadNode('Start');
const end = loader.loadNode('End');

const startPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(start));
const endPosition = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(end));

function update(t, dt) {
    const time = t % 1;
    const transform = cube.getComponentOfType(Transform);
    vec3.lerp(transform.translation, startPosition, endPosition, EasingFunctions.bounceEaseOut(time));

    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    })
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
