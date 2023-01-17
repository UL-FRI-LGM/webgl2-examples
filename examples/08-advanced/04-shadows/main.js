import { mat4, vec3, quat } from '../../../lib/gl-matrix-module.js';

import { Application } from '../../../common/engine/Application.js';
import { Node } from '../../../common/engine/Node.js';
import { OrbitController } from '../../../common/engine/OrbitController.js';

import { Renderer } from './Renderer.js';

class App extends Application {

    start() {
        this.renderer = new Renderer(this.gl);

        this.scene = new Node();
        this.camera = new Node();
        this.camera.projectionMatrix = mat4.create();
        this.scene.addChild(this.camera);

        this.cameraController = new OrbitController(this.camera, this.gl.canvas);
        this.cameraController.distance = 10;

        this.cubeRoot = new Node();
        this.scene.addChild(this.cubeRoot);

        this.shadowCameraRoot = new Node();
        this.shadowCamera = new Node();
        this.shadowCamera.projectionMatrix = mat4.create();
        mat4.perspective(this.shadowCamera.projectionMatrix, 0.5, 1, 15, 50);
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
            const image = new Image();
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
            this.loadImage('../../../common/images/crate-diffuse.png'),
            this.loadJson('../../../common/models/cube.json'),
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

    update(time, dt) {
        this.cameraController.update();
        this.shadowCameraRoot.rotation =
            quat.setAxisAngle(quat.create(), [0, 1, 0], time);
    }

    render() {
        this.renderer.render(this.scene, this.camera, this.shadowCamera);
    }

    resize(width, height) {
        const aspect = width / height;
        const fovy = Math.PI / 3;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projectionMatrix, fovy, aspect, near, far);

        this.renderer.createShadowBuffer();
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();
