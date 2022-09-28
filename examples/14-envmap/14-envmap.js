import { GUI } from '../../lib/dat.gui.module.js';
import { quat, mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';
import { Node } from '../../common/engine/Node.js';
import { FirstPersonController } from '../../common/engine/FirstPersonController.js';

import { Renderer } from './Renderer.js';
import { Material } from './Material.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = performance.now();
        this.startTime = this.time;

        this.root = new Node();
        this.camera = new Node();
        this.funky = new Node();
        this.skybox = new Node();
        this.root.addChild(this.camera);
        this.root.addChild(this.funky);

        this.cameraController = new FirstPersonController(this.camera, this.canvas);
        this.cameraController.pitch = -Math.PI / 6;

        this.camera.projection = mat4.create();
        this.camera.translation = [0, 2, 5];

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
    }

    update() {
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        this.cameraController.update(dt);
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
