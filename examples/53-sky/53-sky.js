import { GUI } from '../../lib/dat.gui.module.js';
import { mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Camera } from './Camera.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = performance.now();
        this.startTime = this.time;

        this.camera = new Camera();

        this.canvas.addEventListener('click', e => this.canvas.requestPointerLock());
        document.addEventListener('pointerlockchange', e => {
            if (document.pointerLockElement === this.canvas) {
                this.camera.enable();
            } else {
                this.camera.disable();
            }
        });
    }

    render() {
        this.renderer.render(this.camera);
    }

    resize() {
        this.camera.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.camera.updateProjection();
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
