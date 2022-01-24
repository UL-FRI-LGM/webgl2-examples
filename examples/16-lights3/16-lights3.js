import { mat4 } from '../../lib/gl-matrix-module.js';
import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Node } from './Node.js';
import { Camera } from './Camera.js';
import { Light } from './Light.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = performance.now();
        this.startTime = this.time;

        this.root = new Node();

        this.camera = new Camera();
        this.camera.translation = [0, 2, 5];
        this.camera.rotation = [-0.6, 0, 0];
        this.root.addChild(this.camera);

        this.lights = [
            new Light({
                diffuseColor: [255, 50, 50],
                specularColor: [255, 255, 255],
                phase: 0 * Math.PI / 2
            }),
            new Light({
                diffuseColor: [50, 255, 50],
                specularColor: [255, 255, 255],
                phase: 1 * Math.PI / 2
            }),
            new Light({
                diffuseColor: [50, 50, 255],
                specularColor: [255, 255, 255],
                phase: 2 * Math.PI / 2
            }),
            new Light({
                diffuseColor: [255, 255, 50],
                specularColor: [255, 255, 255],
                phase: 3 * Math.PI / 2
            }),
        ];
        for (const light of this.lights) {
            this.root.addChild(light);
        }

        this.funky = new Node();
        this.root.addChild(this.funky);

        fetch('../../common/models/funky.json')
        .then(response => response.json())
        .then(json => {
            this.funky.model = this.renderer.createModel(json);
        });

        this.renderer.loadTexture('../../common/images/grayscale.png', {
            mip: true,
            min: gl.NEAREST_MIPMAP_NEAREST,
            mag: gl.NEAREST,
        }, texture => {
            this.funky.texture = texture;
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

        const frequency = 0.002;
        const radius = 5;
        for (const light of this.lights) {
            const x = radius * Math.cos(this.time * frequency + light.phase);
            const z = radius * Math.sin(this.time * frequency + light.phase);
            mat4.fromTranslation(light.matrix, [x, 0, z]);
        }

        this.camera.update(dt);
    }

    render() {
        this.renderer.render(this.root, this.camera, this.lights);
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
});
