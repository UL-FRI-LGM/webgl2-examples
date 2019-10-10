import Application from '../../common/Application.js';

import Renderer from './Renderer.js';
import Node from './Node.js';
import Camera from './Camera.js';
import Light from './Light.js';

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

        this.light = new Light();
        this.root.addChild(this.light);

        const floorModel = this.createFloorModel(10, 10);

        this.floor = new Node();
        this.floor.model = this.renderer.createModel(floorModel);
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

    createFloorModel(width, height) {
        let vertices = [];
        for (let j = 0; j <= height; j++) {
            for (let i = 0; i <= width; i++) {
                const x = i - width / 2;
                const z = j - height / 2;
                const y = Math.random() / 4;

                // position
                vertices.push(x);
                vertices.push(y);
                vertices.push(z);

                // normal
                vertices.push(0);
                vertices.push(1);
                vertices.push(0);

                // texcoords
                vertices.push(x);
                vertices.push(z);
            }
        }

        let indices = [];
        for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
                indices.push(i + j * (width + 1));
                indices.push(i + (j + 1) * (width + 1));
                indices.push((i + 1) + j * (width + 1));
                indices.push((i + 1) + j * (width + 1));
                indices.push(i + (j + 1) * (width + 1));
                indices.push((i + 1) + (j + 1) * (width + 1));
            }
        }

        vertices = new Float32Array(vertices);
        indices = new Uint16Array(indices);

        return { vertices, indices };
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
        this.renderer.render(this.root, this.camera, this.light);
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
    gui.add(app.light, 'ambient', 0.0, 1.0);
    gui.add(app.light, 'diffuse', 0.0, 1.0);
    gui.add(app.light, 'specular', 0.0, 1.0);
    gui.add(app.light, 'shininess', 0.0, 1000.0);
    gui.addColor(app.light, 'color');
    for (let i = 0; i < 3; i++) {
        gui.add(app.light.position, i, -10.0, 10.0).name('position.' + String.fromCharCode('x'.charCodeAt(0) + i));
    }
    gui.add(app, 'enableCamera');
});
