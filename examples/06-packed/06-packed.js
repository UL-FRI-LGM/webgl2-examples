import { GUI } from '../../lib/dat.gui.module.js';

import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.programs = WebGL.buildPrograms(gl, shaders);

        // This time we store all the data interleaved, so that
        // all the attributes for each vertex are close in memory.
        // This significantly improves cache usage. Again, we should
        // be using a Uint8Array for color data, but we simplify here.
        const vertices = new Float32Array([
             0.0,  0.5, /* vertex 0 position */ 1, 0, 0, 1, /* vertex 0 color */
            -0.5, -0.5, /* vertex 1 position */ 0, 1, 0, 1, /* vertex 1 color */
             0.5, -0.5, /* vertex 2 position */ 0, 0, 1, 1, /* vertex 2 color */
        ]);

        // This is how the buffer looks like now:

        // |  | <-- 1 byte
        // 0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 16 17 18 19 20
        // |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
        // | --float-- | --float-- | --float-- | --float-- | --float-- |

        // | position.x| position.y|  color.r  |  color.g  |  color.b  |
        // | --- position size --- | ----------- color size ---------- |
        // |                       |
        // ^ position offset       ^ color offset

        // Upload all data to GPU. We are going to deal with the
        // format of this data later, when we link it with the shader.
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.offsetX = 0;
        this.offsetY = 0;
    }

    render() {
        const gl = this.gl;

        // First, clear the screen.
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Use the shader we compiled in the start method.
        const { program, attributes, uniforms } = this.programs.test;
        gl.useProgram(program);

        // Bind the one buffer we have created.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Tell WebGL that the attribute data comes from a buffer.
        gl.enableVertexAttribArray(attributes.aPosition);

        // Connect the buffer and the attribute and specify how to extract
        // the data from the buffer.
        // Now the position data is not tightly packed together, as it is
        // interleaved with color data. We thus have to supply the
        // offset and the stride explicitly.
        gl.vertexAttribPointer(
            // The attribute at the given location is two floats.
            // Do not normalize (even though this parameter is
            // ignored when using floats).
            attributes.aPosition,
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
        gl.enableVertexAttribArray(attributes.aColor);
        gl.vertexAttribPointer(
            attributes.aColor,
            4, gl.FLOAT, false,

            // The stride is the same, each vertex is 24 bytes in size.
            24,

            // The offset within each vertex is 2 floats because of the
            // position data, so that is 2 * 4 bytes = 8 bytes.
            8
        );

        // Set the uniform.
        gl.uniform2f(uniforms.uOffset, this.offsetX, this.offsetY);

        // Draw!
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
