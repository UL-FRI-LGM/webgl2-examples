import Application from '../../common/Application.js';

import Renderer from './Renderer.js';
import Node from './Node.js';
import Camera from './Camera.js';
import Light from './Light.js';
import Floor from './Floor.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

class App extends Application {

    start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = Date.now();
        this.startTime = this.time;

        this.root = new Node();

        this.camera = new Camera();
        this.root.addChild(this.camera);

        for (let i = 0; i < 4; i++) {
            let light = new Light();
            // mat4.fromTranslation(light.transform, [Math.random() * 10 - 5, 5, Math.random() * 10 - 5]);
            // light.ambientColor = [Math.random() * 64, Math.random() * 64, Math.random() * 64];
            // light.diffuseColor = [Math.random() * 128 + 128, Math.random() * 128 + 128, Math.random() * 128 + 128];
            // light.specularColor = [Math.random() * 64 + 192, Math.random() * 64 + 192, Math.random() * 64 + 192];

            mat4.fromTranslation(light.transform, [- 5, 5, 5]);
            light.ambientColor = [64, 64, 64];
            light.diffuseColor = [192, 192, 192];
            light.specularColor = [255, 255, 255];
            console.log(light);
            this.root.addChild(light);
        }

        this.floor = new Floor(10, 10);
        this.floor.model = this.renderer.createModel(this.floor);
        this.root.addChild(this.floor);

        this.renderer.loadTexture('../../common/images/grass.png', {
            mip: true,
            min: gl.NEAREST_MIPMAP_NEAREST,
            mag: gl.NEAREST,
        }, (texture) => {
            this.floor.texture = texture;
        });

        this.pointerlockchangeHandler = this.pointerlockchangeHandler.bind(this);
        document.addEventListener('pointerlockchange', this.pointerlockchangeHandler);
    }

    enableCamera() {
        this.canvas.requestPointerLock();
    }

    pointerlockchangeHandler() {
        if (document.pointerLockElement === this.canvas) {
            this.camera.enable();
        } else {
            this.camera.disable();
        }
    }

    update() {
        this.time = Date.now();
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
    const gui = new dat.GUI();
    gui.add(app, 'enableCamera');
});
