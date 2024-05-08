import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { GLTFLoader } from 'engine/loaders/GLTFLoader.js';
import { UnlitRenderer } from 'engine/renderers/UnlitRenderer.js';

import { Camera } from 'engine/core.js';

const canvas = document.querySelector('canvas');
const renderer = new UnlitRenderer(canvas);
await renderer.initialize();

const loader = new GLTFLoader();
await loader.load('../../../models/rocks/rocks.gltf');

const scene = loader.loadScene(loader.defaultScene);
if (!scene) {
    throw new Error('A default scene is required to run this example');
}

const camera = scene.find(node => node.getComponentOfType(Camera));
if (!camera) {
    throw new Error('A camera in the scene is require to run this example');
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ render }).start();

document.querySelector('.loader-container').remove();
