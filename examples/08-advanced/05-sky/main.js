import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

import { Application } from '../../../common/engine/Application.js';
import { Node } from '../../../common/engine/Node.js';
import { OrbitController } from '../../../common/engine/OrbitController.js';

import { Renderer } from './Renderer.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);
        this.camera = new Node();
        this.camera.projectionMatrix = mat4.create();
        this.cameraController = new OrbitController(this.camera, this.gl.canvas);
    }

    update(time, dt) {
        this.cameraController.update(dt);
    }

    render() {
        this.renderer.render(this.camera);
    }

    resize(width, height) {
        const aspect = width / height;
        const fovy = Math.PI / 3;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projectionMatrix, fovy, aspect, near, far);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();

// geometry
gui.add(app.renderer, 'planetRadius', 5000e3, 10000e3);
gui.add(app.renderer, 'atmosphereRadius', 5000e3, 10000e3);
gui.add(app.renderer, 'cameraAltitude', 1, 50e3);
gui.add(app.renderer, 'sunHeight', 0, 1);

// physics
gui.add(app.renderer, 'sunIntensity', 0, 50);
gui.add(app.renderer, 'mieScatteringAnisotropy', -1, 1);
gui.add(app.renderer, 'mieDensityScale', 0, 20000);
gui.add(app.renderer, 'rayleighDensityScale', 0, 20000);

// integration
gui.add(app.renderer, 'primaryRaySamples', 1, 64).step(1);
gui.add(app.renderer, 'secondaryRaySamples', 1, 64).step(1);
