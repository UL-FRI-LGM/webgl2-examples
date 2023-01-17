import { GUI } from '../../../lib/dat.gui.module.js';
import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import { Application } from '../../../common/engine/Application.js';
import { Node } from '../../../common/engine/Node.js';

import { Renderer } from './Renderer.js';
import { FirstPersonController } from './FirstPersonController.js';

import { shaders } from './shaders.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.root = new Node();

        this.camera = new Node();
        this.camera.translation = [0, 1, 0];
        this.camera.projectionMatrix = mat4.create();
        this.root.addChild(this.camera);

        this.controller = new FirstPersonController(this.camera, this.gl.canvas);

        this.floor = new Node();
        this.floor.scale = [10, 1, 10];
        this.root.addChild(this.floor);

        const [model, texture] = await Promise.all([
            this.renderer.loadModel('../../../common/models/floor.json'),
            this.renderer.loadTexture('../../../common/images/grass.png', {
                mip: true,
                min: gl.NEAREST_MIPMAP_NEAREST,
                mag: gl.NEAREST,
            }),
        ]);

        this.floor.model = model;
        this.floor.texture = texture;
    }

    update(time, dt) {
        this.controller.update(dt);
    }

    render() {
        this.renderer.render(this.root, this.camera);
    }

    resize(width, height) {
        const aspect = width / height;
        const fovy = Math.PI / 2;
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
gui.add(app.controller, 'pointerSensitivity', 0.0001, 0.01);
gui.add(app.controller, 'maxSpeed', 0, 10);
gui.add(app.controller, 'decay', 0, 1);
gui.add(app.controller, 'acceleration', 1, 100);
