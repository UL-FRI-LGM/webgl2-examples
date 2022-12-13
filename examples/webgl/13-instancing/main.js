import { Application } from '../../../common/engine/Application.js';
import { WebGL } from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // Create a buffer for per-vertex data.

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        WebGL.createBuffer(gl, {
            data: new Float32Array([
                // position     color
                 0.0,  0.5,   1, 0, 0, 1,
                -0.5, -0.5,   0, 1, 0, 1,
                 0.5, -0.5,   0, 0, 1, 1,
            ])
        });

        WebGL.configureAttribute(gl, {
            location: 0,
            count: 2,
            type: gl.FLOAT,
            stride: 24,
            offset: 0,
        });

        WebGL.configureAttribute(gl, {
            location: 5,
            count: 4,
            type: gl.FLOAT,
            stride: 24,
            offset: 8,
        });

        WebGL.createBuffer(gl, {
            target: gl.ELEMENT_ARRAY_BUFFER,
            data: new Uint16Array([
                 0, 1, 2
            ])
        });

        // Create buffers for per-instance data.

        this.instances = [];
        const W = 8;
        const H = 8;
        for (let i = 0; i < W; i++) {
            for (let j = 0; j < H; j++) {
                const [x, y] = [
                    ((i + 0.5) / W) * 2 - 1,
                    ((j + 0.5) / H) * 2 - 1,
                ];
                this.instances.push({
                    translation: [x, y],
                    rotation: 0,
                    scale: 2 / W,

                    timeOffset: Math.hypot(1, x, y),
                    timeSpeed: Math.hypot(1, x, y),
                });
            }
        }

        this.instanceBuffer = WebGL.createBuffer(gl, {
            // 4 floats per instance (2D translation, 1D rotation, 1D scale)
            data: new Float32Array(this.instances.length * 4)
        });

        WebGL.configureAttribute(gl, {
            location: 6,
            count: 2,
            type: gl.FLOAT,
            stride: 16,
            offset: 0,
            divisor: 1,
        });

        WebGL.configureAttribute(gl, {
            location: 7,
            count: 1,
            type: gl.FLOAT,
            stride: 16,
            offset: 8,
            divisor: 1,
        });

        WebGL.configureAttribute(gl, {
            location: 8,
            count: 1,
            type: gl.FLOAT,
            stride: 16,
            offset: 12,
            divisor: 1,
        });

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    update(time, dt) {
        const gl = this.gl;

        for (const instance of this.instances) {
            const t = time * instance.timeSpeed + instance.timeOffset;
            instance.rotation = Math.sin(t) * Math.PI;
        }

        WebGL.createBuffer(gl, {
            buffer: this.instanceBuffer,
            data: new Float32Array(this.instances.flatMap(
                ({ translation, rotation, scale }) => [ ...translation, rotation, scale ]
            ))
        });
    }

    render() {
        const gl = this.gl;

        const { program, uniforms } = this.programs.instanced;
        gl.useProgram(program);

        gl.bindVertexArray(this.vao);

        // Draw the triangles. The last parameter is the instance count.
        gl.drawElementsInstanced(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0, this.instances.length);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();
