import { mat4, vec3, quat } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';
import { Node } from '../../common/engine/Node.js';

import { Renderer } from './Renderer.js';

class App extends Application {

    start() {
        this.renderer = new Renderer(this.gl);
        this.aspect = 1;

        this.pointerdownHandler = this.pointerdownHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);

        this.canvas.addEventListener('pointerdown', this.pointerdownHandler);

        this.scene = new Node();
        this.camera = new Node();
        this.camera.projection = mat4.create();
        this.camera.translation = [0, 0, 10];
        this.camera.aspect = this.aspect;
        this.scene.addChild(this.camera);

        this.cubeRoot = new Node();
        this.scene.addChild(this.cubeRoot);

        this.shadowCameraRoot = new Node();
        this.shadowCamera = new Node();
        this.shadowCamera.projection = mat4.create();
        mat4.perspective(this.shadowCamera.projection, 0.5, 1, 15, 50);
        this.shadowCamera.translation = [0, 0, 20];
        this.shadowCamera.aspect = 0.3;
        this.shadowCamera.near = 15;
        this.shadowCamera.far = 50;
        this.cubeRoot.addChild(this.shadowCameraRoot);
        this.shadowCameraRoot.addChild(this.shadowCamera);

        this.load();
    }

    loadImage(uri) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.addEventListener('load', e => resolve(image));
            image.addEventListener('error', reject);
            image.src = uri;
        });
    }

    loadJson(uri) {
        return fetch(uri).then(response => response.json());
    }

    async load() {
        const [cubeImage, cubeMesh] = await Promise.all([
            this.loadImage('../../common/images/crate-diffuse.png'),
            this.loadJson('../../common/models/cube.json'),
        ]);

        const cubeTexture = this.renderer.createTexture(cubeImage);
        const cubeModel = this.renderer.createModel(cubeMesh);
        const cubeCount = 100;

        for (let i = 0; i < cubeCount; i++) {
            const cube = new Node();
            cube.texture = cubeTexture;
            cube.mesh = cubeModel;

            const scale = 0.1 + Math.random();
            cube.translation = vec3.random(vec3.create(), Math.random() * 5);
            cube.rotation = quat.random(quat.create());
            cube.scale = [scale, scale, scale];

            this.cubeRoot.addChild(cube);
        }
    }

    update() {
        const time = performance.now() * 0.001;
        this.shadowCameraRoot.rotation =
            quat.setAxisAngle(quat.create(), [0, 1, 0], time);
    }

    render() {
        this.renderer.render(this.scene, this.camera, this.shadowCamera);
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;
        const fovy = Math.PI / 3;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projection, fovy, aspect, near, far);

        this.renderer.createShadowBuffer();
    }

    pointerdownHandler(e) {
        this.pointerStart = [e.clientX, e.clientY];
        this.canvas.removeEventListener('pointerdown', this.pointerdownHandler);
        window.addEventListener('pointerup', this.pointerupHandler);
        window.addEventListener('pointermove', this.pointermoveHandler);
    }

    pointerupHandler() {
        this.canvas.addEventListener('pointerdown', this.pointerdownHandler);
        window.removeEventListener('pointerup', this.pointerupHandler);
        window.removeEventListener('pointermove', this.pointermoveHandler);
    }

    pointermoveHandler(e) {
        const [x0, y0] = this.pointerStart;
        const [x1, y1] = [e.clientX, e.clientY];
        const [dx, dy] = [x1 - x0, y1 - y0];
        this.pointerStart = [x1, y1];

        const pointerSensitivity = 0.003;
        const q = quat.create();
        quat.rotateX(q, q, dy * pointerSensitivity);
        quat.rotateY(q, q, dx * pointerSensitivity);
        this.cubeRoot.rotation = quat.mul(quat.create(), q, this.cubeRoot.rotation);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();
