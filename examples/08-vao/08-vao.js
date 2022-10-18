import { GUI } from '../../lib/dat.gui.module.js';

import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.programs = WebGL.buildPrograms(gl, shaders);

        // We can set the clear color in the initialization step.
        gl.clearColor(1, 1, 1, 1);

        const vertices = new Float32Array([
             0.0,  0.5,    1, 0, 0, 1,
            -0.5, -0.5,    0, 1, 0, 1,
             0.5, -0.5,    0, 0, 1, 1,
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Move the whole setup to the initialization step.
        // A vertex array object (VAO) is going to store attribute
        // format data as well as references to buffer objects.
        this.vao = gl.createVertexArray();

        // Bind the VAO. All subsequent buffer bindings and attribute
        // manipulation is going to be stored the the currently bound VAO.
        gl.bindVertexArray(this.vao);

        // Make sure you bind the correct buffer to the ARRAY_BUFFER target.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // We can now use explicit attribute locations as we have set them
        // in the shaders. By convention, we are going to use location 0
        // for vertex positions and location 1 for vertex colors.
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 24, 8);

        this.offsetX = 0;
        this.offsetY = 0;
        this.scaleX = 0.5;
        this.scaleY = 0.5;
    }

    render() {
        const gl = this.gl;

        // Clear the screen.
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Bind the correct VAO. All buffer-attribute connections
        // are already set up.
        gl.bindVertexArray(this.vao);

        // Draw the first triangle with the first program.
        let program = this.programs.first;
        gl.useProgram(program.program);
        gl.uniform2f(program.uniforms.uOffset, 0.4 + this.offsetX, 0 + this.offsetY);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Draw the second triangle with the second program.
        program = this.programs.second;
        gl.useProgram(program.program);
        gl.uniform2f(program.uniforms.uOffset, -0.4 + this.offsetX, 0 + this.offsetY);
        gl.uniform2f(program.uniforms.uScale, this.scaleX, this.scaleY);
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
gui.add(app, 'scaleX', -1, 1);
gui.add(app, 'scaleY', -1, 1);
