import { GUI } from '../../../lib/dat.gui.module.js';
import { quat, mat4 } from '../../../lib/gl-matrix-module.js';

import { Application } from '../../../common/engine/Application.js';
import { Node } from '../../../common/engine/Node.js';
import { OrbitController } from '../../../common/engine/OrbitController.js';

import { Renderer } from './Renderer.js';
import { Material } from './Material.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.root = new Node();
        this.camera = new Node();
        this.model = new Node();
        this.skybox = new Node();
        this.root.addChild(this.camera);
        this.root.addChild(this.model);

        this.cameraController = new OrbitController(this.camera, this.gl.canvas);
        this.camera.projectionMatrix = mat4.create();

        const [cube, model, texture, envmap] = await Promise.all([
            this.renderer.loadModel('../../../common/models/cube.json'),
            this.renderer.loadModel('../../../common/models/bunny.json'),
            this.renderer.loadTexture('../../../common/images/grayscale.png', {
                mip: true,
                min: gl.NEAREST_MIPMAP_NEAREST,
                mag: gl.NEAREST,
            }),
            this.renderer.loadTexture('../../../common/images/cambridge.webp', {
                min: gl.LINEAR,
                mag: gl.LINEAR,
            }),
        ]);

        this.skybox.model = cube;
        this.skybox.material = new Material();
        this.skybox.material.envmap = envmap;

        this.model.model = model;
        this.model.material = new Material();
        this.model.material.texture = texture;
        this.model.material.envmap = envmap;
    }

    update(time, dt) {
        this.cameraController.update(dt);
    }

    render() {
        this.renderer.render(this.root, this.camera, this.skybox);
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
gui.add(app.model.material, 'effect', 0, 1);
gui.add(app.model.material, 'reflectance', 0, 1);
gui.add(app.model.material, 'transmittance', 0, 1);
gui.add(app.model.material, 'ior', 0, 1);
