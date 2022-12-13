import { GUI } from '../../../lib/dat.gui.module.js';

import { Application } from '../../../common/engine/Application.js';
import { WebGL } from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // Create the vertex array object (VAO).
        this.vao = gl.createVertexArray();

        // Bind the VAO. All subsequent buffer bindings and attribute
        // configuration is going to be stored the the currently bound VAO.
        gl.bindVertexArray(this.vao);

        // Create the vertex buffer.
        WebGL.createBuffer(gl, {
            data: new Float32Array([
                 0.0,  0.5, /* vertex 0 position */ 1, 0, 0, 1, /* vertex 0 color */
                -0.5, -0.5, /* vertex 1 position */ 0, 1, 0, 1, /* vertex 1 color */
                 0.5, -0.5, /* vertex 2 position */ 0, 0, 1, 1, /* vertex 2 color */
            ])
        });

        // Configure the position attribute.
        WebGL.configureAttribute(gl, {
            location: 0,
            count: 2,
            type: gl.FLOAT,
            stride: 24,
            offset: 0,
        });

        // Configure the color attribute.
        WebGL.configureAttribute(gl, {
            location: 5,
            count: 4,
            type: gl.FLOAT,
            stride: 24,
            offset: 8,
        });

        // Create the index buffer.
        WebGL.createBuffer(gl, {
            target: gl.ELEMENT_ARRAY_BUFFER,
            data: new Uint16Array([
                 0, 1, 2
            ])
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

        // Select the VAO for rendering.
        gl.bindVertexArray(this.vao);

        // Set the uniform value.
        gl.uniform2f(uniforms.uOffset, this.offsetX, this.offsetY);

        // Draw the triangle.
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'offsetX', -1, 1);
gui.add(app, 'offsetY', -1, 1);
