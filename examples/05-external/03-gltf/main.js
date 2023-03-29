import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { GLTFLoader } from './GLTFLoader.js';
import { Renderer } from './Renderer.js';

import { Camera } from '../../../common/engine/core/Camera.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const loader = new GLTFLoader();
await loader.load('../../../common/models/rocks/rocks.gltf');

const scene = await loader.loadScene(loader.defaultScene);
if (!scene) {
    throw new Error('A default scene is required to run this example');
}

const camera = scene.find(node => node.getComponentOfType(Camera));
if (!camera) {
    throw new Error('A camera in the scene is require to run this example');
}

const renderer = new Renderer(gl);
renderer.prepareScene(scene);

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ render }).start();

document.querySelector('.loader-container').remove();
