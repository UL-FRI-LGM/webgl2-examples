import { GUI } from '../../../lib/dat.gui.module.js';

import { Application } from '../../../common/engine/Application.js';
import { WebGL } from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // You can create buffers and connect them to the corresponding
        // attribute locations before compiling the shaders. In this case,
        // the attribute locations have to be known in advance.

        // Create the buffer with vertex positions.
        WebGL.createBuffer(gl, {
            data: new Float32Array([
                 0.0,  0.5,
                -0.5, -0.5,
                 0.5, -0.5,
            ])
        });

        // Connect the position buffer to the attribute location 0.
        WebGL.configureAttribute(gl, {
            location: 0,
            count: 2,
            type: gl.FLOAT,
        });

        // Create the buffer with vertex colors.
        WebGL.createBuffer(gl, {
            data: new Uint8Array([
                255, 0, 0, 255,
                0, 255, 0, 255,
                0, 0, 255, 255,
            ])
        });

        // Connect the color buffer to the attribute location 5.
        WebGL.configureAttribute(gl, {
            location: 5,
            count: 4,
            type: gl.UNSIGNED_BYTE,
            normalize: true,
        });

        // Build the programs and extract the attribute and uniform locations.
        this.programs = WebGL.buildPrograms(gl, shaders);

        // These two values will be passed into
        // the shader to offset the vertices.
        this.offsetX = 0;
        this.offsetY = 0;
    }

    render() {
        const gl = this.gl;

        // Select the correct program to use for rendering.
        const { program, uniforms } = this.programs.colored;
        gl.useProgram(program);

        // Set the uniform value.
        gl.uniform2f(uniforms.uOffset, this.offsetX, this.offsetY);

        // Draw the triangle.
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'offsetX', -1, 1);
gui.add(app, 'offsetY', -1, 1);
