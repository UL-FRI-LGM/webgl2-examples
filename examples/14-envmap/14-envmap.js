import { GUI } from '../../lib/dat.gui.module.js';
import { mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Node } from './Node.js';
import { Camera } from './Camera.js';
import { Material } from './Material.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = performance.now();
        this.startTime = this.time;

        this.root = new Node();
        this.camera = new Camera();
        this.funky = new Node();
        this.skybox = new Node();
        this.root.addChild(this.camera);
        this.root.addChild(this.funky);

        this.camera.translation = [0, 2, 5];
        this.camera.rotation = [-0.6, 0, 0];

        const [cube, funky, texture, envmap] = await Promise.all([
            this.renderer.loadModel('../../common/models/cube.json'),
            this.renderer.loadModel('../../common/models/funky.json'),
            this.renderer.loadTexture('../../common/images/grayscale.png', {
                mip: true,
                min: gl.NEAREST_MIPMAP_NEAREST,
                mag: gl.NEAREST,
            }),
            this.renderer.loadTexture('../../common/images/cambridge.webp', {
                min: gl.LINEAR,
                mag: gl.LINEAR,
            }),
        ]);

        this.skybox.model = cube;
        this.skybox.material = new Material();
        this.skybox.material.envmap = envmap;

        this.funky.model = funky;
        this.funky.material = new Material();
        this.funky.material.texture = texture;
        this.funky.material.envmap = envmap;

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
        this.renderer.render(this.root, this.camera, this.skybox);
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

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app.funky.material, 'effect', 0, 1);
gui.add(app.funky.material, 'reflectance', 0, 1);
gui.add(app.funky.material, 'transmittance', 0, 1);
gui.add(app.funky.material, 'ior', 0, 1);
