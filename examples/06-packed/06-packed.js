import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.programs = WebGL.buildPrograms(gl, shaders);

        // This time we store all the data interleaved, so that
        // all the attributes for each vertex are close in memory.
        // This significantly improves cache usage.
        const vertices = new Float32Array([
             0.0,  0.5,    1, 0, 0, 1,
            -0.5, -0.5,    0, 1, 0, 1,
             0.5, -0.5,    0, 0, 1, 1,
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.offsetX = 0;
        this.offsetY = 0;
    }

    render() {
        const gl = this.gl;

        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        const program = this.programs.test;
        gl.useProgram(program.program);

        // Bind the one buffer we have created.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Tell WebGL that the data comes from a buffer.
        gl.enableVertexAttribArray(program.attributes.aPosition);

        // Connect the buffer and the attribute and specify how to extract
        // the data from the buffer.
        //
        // Now the position data is not tightly packed together, as it is
        // interleaved with color data. We thus have to compute the
        // offset and the stride ourselves.
        gl.vertexAttribPointer(
            program.attributes.aPosition,
            2, gl.FLOAT, false,

            // We have 6 floats per vertex (2 for position and 4 for color),
            // each float is 4 bytes, so the stride is 6 * 4 bytes = 24 bytes.
            24,

            // Within each vertex, the position is stored right at
            // the beginning, therefore the offset is 0.
            0
        );

        // For color data we do not have to bind a different buffer, the data
        // is already available in the single buffer we already have bound.
        gl.enableVertexAttribArray(program.attributes.aColor);
        gl.vertexAttribPointer(
            program.attributes.aColor,
            4, gl.FLOAT, false,

            // The stride is the same, each vertex is 24 bytes in size.
            24,

            // The offset within each vertex is 2 floats because of the
            // position data, so that is 2 * 4 bytes = 8 bytes.
            8
        );

        // Set the uniform.
        gl.uniform2f(program.uniforms.uOffset, this.offsetX, this.offsetY);

        // Draw!
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
