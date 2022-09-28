import { mat3, mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';
import { Node } from '../../common/engine/Node.js';
import { FirstPersonController } from '../../common/engine/FirstPersonController.js';

import { Renderer } from './Renderer.js';

function createGrassTextureAtlas() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const grassWidth = 32;
    const grassHeight = 32;
    const grassCount = 8;
    const grassBladeCount = 20;

    canvas.width = grassWidth * grassCount;
    canvas.height = grassHeight;

    for (let grass = 0; grass < grassCount; grass++) {
        ctx.save();

        ctx.scale(grassWidth, grassHeight);
        ctx.translate(0.5, 0);
        ctx.translate(grass, 0);

        for (let blade = 0; blade < 20; blade++) {
            const lineWidth = 0.03;

            const x1 = (Math.random() - 0.5) * 0.8;
            const y1 = 0;
            const x2 = x1 + (Math.random() - 0.5) * 0.3;
            const y2 = 0.95 - 5 * x1 ** 2;

            const H = 80 + Math.random() * 30;
            const S = 30 + Math.random() * 20;
            const L = 20 + Math.random() * 20;

            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = `hsl(${H} ${S}% ${L}%)`;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }

        const flowerCount = 1 + Math.floor(Math.random() * 2);
        for (let flower = 0; flower < flowerCount; flower++) {
            const x = (Math.random() - 0.5) * 0.8;
            const y = 0.95 - 5 * x ** 2;
            const radius = 0.02 + Math.random() * 0.05;

            const H = 0 + Math.random() * 50;
            const S = 70 + Math.random() * 20;
            const L = 40 + Math.random() * 20;

            ctx.fillStyle = `hsl(${H} ${S}% ${L}%)`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    return canvas;
}

function createGrassPatch(instanceCount) {
    const instanceMatrices = new Float32Array(instanceCount * 4 * 4);
    const texCoordMatrices = new Float32Array(instanceCount * 3 * 3);

    for (let i = 0; i < instanceCount; i++) {
        const instanceMatrix = mat4.create();
        const texCoordMatrix = mat3.create();

        const textureCount = 8;
        const textureIndex = Math.floor(Math.random() * textureCount);
        mat3.translate(texCoordMatrix, texCoordMatrix, [textureIndex / textureCount, 0]);
        mat3.scale(texCoordMatrix, texCoordMatrix, [1 / textureCount, 1]);

        const instanceYaw = Math.random() * Math.PI * 2;
        const instanceTilt = (Math.random() - 0.5) * (Math.PI / 2 * 0.5);
        const angle = Math.random() * Math.PI * 2;
        const radiusSeed = Math.random();
        const radius = Math.sqrt(radiusSeed) * 5;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        const scaleMax = 1 - (radiusSeed * 0.9) ** 2;
        const scaleMin = 0.5 - 0.5 * (radiusSeed * 0.9) ** 2;
        const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
        mat4.translate(instanceMatrix, instanceMatrix, [x, 0, y]);
        mat4.rotateY(instanceMatrix, instanceMatrix, instanceYaw);
        mat4.rotateX(instanceMatrix, instanceMatrix, instanceTilt);
        mat4.scale(instanceMatrix, instanceMatrix, [scale, scale, scale]);

        instanceMatrices.set(instanceMatrix, i * 4 * 4);
        texCoordMatrices.set(texCoordMatrix, i * 3 * 3);
    }

    return { instanceCount, instanceMatrices, texCoordMatrices };
}

class App extends Application {

    async start() {
        const gl = this.gl;

        this.renderer = new Renderer(gl);

        this.time = performance.now();
        this.startTime = this.time;

        this.root = new Node();
        this.camera = new Node();
        this.root.addChild(this.camera);

        this.camera.projection = mat4.create();
        this.camera.translation = [0, 2, 0];

        this.cameraController = new FirstPersonController(this.camera, this.canvas);

        const grassTextureAtlas = createGrassTextureAtlas();
        const grassModel = await fetch('../../common/models/grass.json')
            .then(response => response.json());
        const grassPatch = createGrassPatch(5000);

        this.grass = new Node();
        this.grass.texture = await this.renderer.loadTexture(grassTextureAtlas.toDataURL(), {
            min: gl.NEAREST,
            mag: gl.NEAREST,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        });
        this.grass.model = this.renderer.createModel(grassModel, grassPatch);
        this.grass.instanceCount = grassPatch.instanceCount;
        this.root.addChild(this.grass);
    }

    update() {
        this.time = performance.now();
        const dt = (this.time - this.startTime) * 0.001;
        this.startTime = this.time;

        this.cameraController.update(dt);
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

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();
