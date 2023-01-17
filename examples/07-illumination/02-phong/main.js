import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

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
        this.light = new Node();
        this.model = new Node();
        this.root.addChild(this.camera);
        this.root.addChild(this.light);
        this.root.addChild(this.model);

        this.light.position = [0, 2, 1];
        this.light.color = [255, 255, 255];
        this.light.intensity = 1;
        this.light.attenuation = [0.001, 0, 0.3];

        this.camera.projectionMatrix = mat4.create();
        this.camera.translation = [0, 2, 5];

        this.cameraController = new OrbitController(this.camera, this.gl.canvas);

        const [model, texture, envmap] = await Promise.all([
            this.renderer.loadModel('../../../common/models/bunny.json'),
            this.renderer.loadTexture('../../../common/images/grass.png', {
                mip: true,
                min: gl.NEAREST_MIPMAP_NEAREST,
                mag: gl.NEAREST,
            }),
        ]);

        this.model.model = model;
        this.model.material = new Material();
        this.model.material.texture = texture;
    }

    update(time, dt) {
        this.cameraController.update(dt);
        this.light.translation = this.light.position;
    }

    render() {
        this.renderer.render(this.root, this.camera, this.light);
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
lightPosition.add(app.light.position, 0, -10, 10).name('x');
lightPosition.add(app.light.position, 1, -10, 10).name('y');
lightPosition.add(app.light.position, 2, -10, 10).name('z');
const lightAttenuation = light.addFolder('Attenuation');
lightAttenuation.open();
lightAttenuation.add(app.light.attenuation, 0, 0, 5).name('constant');
lightAttenuation.add(app.light.attenuation, 1, 0, 2).name('linear');
lightAttenuation.add(app.light.attenuation, 2, 0, 1).name('quadratic');

const material = gui.addFolder('Material');
material.open();
material.add(app.model.material, 'diffuse', 0, 1);
material.add(app.model.material, 'specular', 0, 1);
material.add(app.model.material, 'shininess', 1, 200);
