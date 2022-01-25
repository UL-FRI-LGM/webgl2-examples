import { GUI } from '../../lib/dat.gui.module.js';
import { mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Node } from './Node.js';
import { Camera } from './Camera.js';
import { Material } from './Material.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = performance.now();
        this.startTime = this.time;

        this.root = new Node();
        this.camera = new Camera();
        this.funky = new Node();
        this.root.addChild(this.camera);
        this.root.addChild(this.funky);

        this.camera.translation = [0, 2, 5];
        this.camera.rotation = [-0.6, 0, 0];

        this.funky.material = new Material();

        fetch('../../common/models/funky.json')
        .then(response => response.json())
        .then(json => {
            this.funky.model = this.renderer.createModel(json);
        });

        this.renderer.loadTexture('../../common/images/grayscale.png', {
            min: gl.NEAREST,
            mag: gl.NEAREST,
        }, texture => {
            this.funky.material.texture = texture;
        });

        this.renderer.loadTexture('../../common/images/cambridge.webp', {
            min: gl.LINEAR,
            mag: gl.LINEAR,
        }, envmap => {
            this.funky.material.envmap = envmap;
        });

        this.canvas.addEventListener('click', e => this.canvas.requestPointerLock());
        document.addEventListener('pointerlockchange', e => {
            if (document.pointerLockElement === this.canvas) {
                this.camera.enable();
            } else {
                this.camera.disable();
            }
        });
    }

    update() {
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        this.camera.update(dt);
    }

    render() {
        this.renderer.render(this.root, this.camera);
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;
        const fovy = Math.PI / 3;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projection, fovy, aspect, near, far);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new GUI();
    gui.add(app.funky.material, 'effect', 0, 1);
    gui.add(app.funky.material, 'reflectance', 0, 1);
    gui.add(app.funky.material, 'transmittance', 0, 1);
    gui.add(app.funky.material, 'ior', 0, 1);
});
