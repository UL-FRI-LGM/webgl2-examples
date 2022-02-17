import { GUI } from '../../lib/dat.gui.module.js';
import { mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';

import { Renderer } from './Renderer.js';
import { Node } from './Node.js';
import { Camera } from './Camera.js';
import { Light } from './Light.js';
import { Material } from './Material.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = performance.now();
        this.startTime = this.time;

        this.root = new Node();
        this.camera = new Camera();
        this.light = new Light();
        this.funky = new Node();
        this.root.addChild(this.camera);
        this.root.addChild(this.light);
        this.root.addChild(this.funky);

        this.camera.translation = [0, 2, 5];
        this.camera.rotation = [-0.6, 0, 0];

        const [model, texture, envmap] = await Promise.all([
            this.renderer.loadModel('../../common/models/funky.json'),
            this.renderer.loadTexture('../../common/images/grayscale.png', {
                mip: true,
                min: gl.NEAREST_MIPMAP_NEAREST,
                mag: gl.NEAREST,
            }),
        ]);

        this.funky.model = model;
        this.funky.material = new Material();
        this.funky.material.texture = texture;

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

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app.renderer, 'perFragment').onChange(perFragment => {
    app.renderer.currentProgram = perFragment
        ? app.renderer.programs.perFragment
        : app.renderer.programs.perVertex;
});

const light = gui.addFolder('Light');
light.open();
light.add(app.light, 'intensity', 0, 5);
light.addColor(app.light, 'color');
const lightPosition = light.addFolder('Position');
lightPosition.open();
lightPosition.add(app.light.matrix, 12, -10, 10).name('x');
lightPosition.add(app.light.matrix, 13, -10, 10).name('y');
lightPosition.add(app.light.matrix, 14, -10, 10).name('z');
const lightAttenuation = light.addFolder('Attenuation');
lightAttenuation.open();
lightAttenuation.add(app.light.attenuation, 0, 0, 5).name('constant');
lightAttenuation.add(app.light.attenuation, 1, 0, 2).name('linear');
lightAttenuation.add(app.light.attenuation, 2, 0, 1).name('quadratic');

const material = gui.addFolder('Material');
material.open();
material.add(app.funky.material, 'diffuse', 0, 1);
material.add(app.funky.material, 'specular', 0, 1);
material.add(app.funky.material, 'shininess', 1, 200);
