import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { Node } from '../../../common/engine/core/Node.js';
import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';

import { Renderer } from './Renderer.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const renderer = new Renderer(gl);
const camera = new Node();
camera.projectionMatrix = mat4.create();
const cameraController = new OrbitController(camera, canvas);

function update(time, dt) {
    cameraController.update(dt);
}

function render() {
    renderer.render(camera);
}

function resize({ displaySize: { width, height }}) {
    const aspect = width / height;
    const fovy = Math.PI / 3;
    const near = 0.1;
    const far = 100;

    mat4.perspective(camera.projectionMatrix, fovy, aspect, near, far);
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
