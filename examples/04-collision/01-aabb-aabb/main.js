import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Renderer } from './Renderer.js';
import { Physics } from './Physics.js';
import { Camera } from './Camera.js';
import { SceneLoader } from './SceneLoader.js';
import { SceneBuilder } from './SceneBuilder.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);

const sceneJson = await new SceneLoader().loadScene('scene.json');
const builder = new SceneBuilder(sceneJson);
const scene = builder.build();
const physics = new Physics(scene);

// Find first camera.
let camera = null;
scene.traverse(node => {
    if (node instanceof Camera) {
        camera = node;
    }
});

renderer.prepare(scene);

canvas.addEventListener('click', e => canvas.requestPointerLock());
document.addEventListener('pointerlockchange', e => {
    if (document.pointerLockElement === canvas) {
        camera.enable();
    } else {
        camera.disable();
    }
});

function update(time, dt) {
    camera.update(dt);
    physics.update(dt);
}

function render() {
    renderer.render(scene, camera);
}

function resize({ displaySize: { width, height }}) {
    camera.aspect = width / height;
    camera.updateProjection();
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

document.querySelector('.loader-container').remove();
