import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // this.programs now contains a program object and attribute and
        // uniform locations for each of the supplied shaders.
        this.programs = WebGL.buildPrograms(gl, shaders);

        // Triangle vertices. They have to be stored in a typed array
        // to be properly transferred to the GPU memory.
        const vertices = new Float32Array([
             0.0,  0.5,
            -0.5, -0.5,
             0.5, -0.5
        ]);

        // Create a buffer object to represent a chunk of GPU memory.
        this.vertexBuffer = gl.createBuffer();

        // Bind the buffer to the ARRAY_BUFFER target.
        // Every subsequent operation on that target will affect
        // the currently bound buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Transfer the data from the main memory to the GPU memory.
        // The STATIC_DRAW hint tells WebGL that we are going to modify
        // the data rarely and access it from a shader often.
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Repeat for color data.
        const colors = new Float32Array([
            1, 0, 0, 1,
            0, 1, 0, 1,
            0, 0, 1, 1
        ]);

        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

        this.offsetX = 0;
        this.offsetY = 0;
    }

    render() {
        const gl = this.gl;

        // First, clear the screen. We do not want pixels
        // from the previous frame to be visible.
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Select the correct program to use for rendering.
        const program = this.programs.test;
        gl.useProgram(program.program);

        // Bind the buffer first, because vertexAttribPointer
        // associates an attribute with the bound buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Tell WebGL that the data comes from a buffer.
        // Back in the day this was an OpenGL extension, now it is mandatory.
        gl.enableVertexAttribArray(program.attributes.aPosition);

        // Connect the buffer and the attribute and specify how to extract
        // the data from the buffer.
        // The attribute aPosition is of type vec2 and we have two floats
        // per vertex in the buffer. The data is tightly packed,
        // so let WebGL compute the stride and offset.
        gl.vertexAttribPointer(
            program.attributes.aPosition, // attribute location
            2, // number of components per attribute
            gl.FLOAT, // the type of each component
            false, // should integers be normalized when cast to a float
            0, // stride (ignore for now)
            0, // offset (ignore for now)
        );

        // Repeat for color data
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(program.attributes.aColor);
        gl.vertexAttribPointer(program.attributes.aColor, 4, gl.FLOAT, false, 0, 0);


        // Set all uniforms. Uniform values are program state, so they do not
        // need to be set again when switching to a different program and
        // then switching back.
        // The uniform uOffset is of type vec2 so we pass in two floats (2f).
        gl.uniform2f(program.uniforms.uOffset, this.offsetX, this.offsetY);

        // Draw! We are drawing triangles, passing in 3 vertices
        // and starting with the vertex at index 0.
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new dat.GUI();
    gui.add(app, 'offsetX', -1, 1);
    gui.add(app, 'offsetY', -1, 1);
});
