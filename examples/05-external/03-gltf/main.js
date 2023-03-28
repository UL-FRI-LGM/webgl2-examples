import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { GLTFLoader } from './GLTFLoader.js';
import { Renderer } from './Renderer.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const loader = new GLTFLoader();
await loader.load('../../../common/models/rocks/rocks.gltf');

const scene = await loader.loadScene(loader.defaultScene);
const camera = await loader.loadNode('Camera');

if (!scene || !camera) {
    throw new Error('Scene or Camera not present in glTF');
}

if (!camera.camera) {
    throw new Error('Camera node does not contain a camera reference');
}

const renderer = new Renderer(gl);
renderer.prepareScene(scene);

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.camera.aspect = width / height;
    camera.camera.updateProjectionMatrix();
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ render }).start();

document.querySelector('.loader-container').remove();
