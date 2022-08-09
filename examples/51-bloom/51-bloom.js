import { GUI } from '../../lib/dat.gui.module.js';
import { vec3, quat } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';

import { Scene } from './Scene.js';
import { Node } from './Node.js';
import { Camera } from './Camera.js';
import { Renderer } from './Renderer.js';

class App extends Application {

    start() {
        this.renderer = new Renderer(this.gl);
        this.aspect = 1;

        this.pointerdownHandler = this.pointerdownHandler.bind(this);
        this.pointerupHandler = this.pointerupHandler.bind(this);
        this.pointermoveHandler = this.pointermoveHandler.bind(this);

        this.canvas.addEventListener('pointerdown', this.pointerdownHandler);

        this.scene = new Scene();
        this.camera = new Camera();
        this.camera.translation = [0, 0, 10];
        this.camera.aspect = this.aspect;
        this.camera.updateMatrix();
        this.camera.updateProjection();
        this.scene.addNode(this.camera);

        this.cubeRoot = new Node();
        this.scene.addNode(this.cubeRoot);

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
        const [cubeDiffuseImage, cubeEmissionImage, cubeMesh] = await Promise.all([
            this.loadImage('../../common/images/crate-diffuse.png'),
            this.loadImage('../../common/images/crate-emission.png'),
            this.loadJson('../../common/models/cube.json'),
        ]);

        const cubeDiffuseTexture = this.renderer.createTexture(cubeDiffuseImage);
        const cubeEmissionTexture = this.renderer.createTexture(cubeEmissionImage);
        const cubeModel = this.renderer.createModel(cubeMesh);
        const cubeCount = 100;

        for (let i = 0; i < cubeCount; i++) {
            const cube = new Node();
            cube.diffuseTexture = cubeDiffuseTexture;
            cube.emissionTexture = cubeEmissionTexture;
            cube.mesh = cubeModel;
            vec3.random(cube.translation, Math.random() * 5);
            quat.random(cube.rotation);
            const scale = 0.1 + Math.random();
            cube.scale = [scale, scale, scale];
            cube.updateMatrix();
            this.cubeRoot.addNode(cube);
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        this.aspect = w / h;
        this.camera.aspect = this.aspect;
        this.camera.updateProjection();

        this.renderer.createGeometryBuffer();
        this.renderer.createBloomBuffer();
        this.renderer.createBlurBuffer();
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
        const r = this.cubeRoot.rotation;
        quat.mul(r, q, r);
        this.cubeRoot.updateMatrix();
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app.renderer, 'emissionStrength', 0, 5);
gui.add(app.renderer, 'bloomThreshold', 0, 5);
gui.add(app.renderer, 'bloomStepWidth', 0, 1);
gui.add(app.renderer, 'exposure', 0, 5);
