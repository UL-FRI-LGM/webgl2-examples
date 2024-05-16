import { GUI } from 'dat';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { TurntableController } from 'engine/controllers/TurntableController.js';

import {
    Camera,
    Node,
    Transform,
} from 'engine/core.js';

import { Renderer } from './Renderer.js';

const canvas = document.querySelector('canvas');
const renderer = new Renderer(canvas);
await renderer.initialize();

const camera = new Node();
camera.addComponent(new Transform());
camera.addComponent(new Camera());
const cameraController = new TurntableController(camera, canvas);

function update(time, dt) {
    cameraController.update(time, dt);
}

function render() {
    renderer.render(camera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();

// geometry
gui.add(renderer, 'planetRadius', 5000e3, 10000e3);
gui.add(renderer, 'atmosphereRadius', 5000e3, 10000e3);
gui.add(renderer, 'cameraAltitude', 1, 50e3);
gui.add(renderer, 'sunHeight', 0, 1);

// physics
gui.add(renderer, 'sunIntensity', 0, 50);
gui.add(renderer, 'mieScatteringAnisotropy', -1, 1);
gui.add(renderer, 'mieDensityScale', 0, 20000);
gui.add(renderer, 'rayleighDensityScale', 0, 20000);

// integration
gui.add(renderer, 'primaryRaySamples', 1, 64).step(1);
gui.add(renderer, 'secondaryRaySamples', 1, 64).step(1);

document.querySelector('.loader-container').remove();
