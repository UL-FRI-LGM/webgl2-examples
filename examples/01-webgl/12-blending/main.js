import { GUI } from '../../../lib/dat.gui.module.js';

import { Application } from '../../../common/engine/Application.js';
import { WebGL } from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        // First, enable blending.
        gl.enable(gl.BLEND);

        // The output color and alpha are going to be calculated as
        // OUTPUT_COLOR = COMBINE(SRC_COLOR * SRC_COLOR_FACTOR, DST_COLOR * DST_COLOR_FACTOR)
        // OUTPUT_ALPHA = COMBINE(SRC_ALPHA * SRC_ALPHA_FACTOR, DST_ALPHA * DST_ALPHA_FACTOR)
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE);

        // The COMBINE function is addition by default, but you can also set it
        // to subtraction, reverse subtraction, min, or max. Here, we set it to
        // addition explicitly.
        gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);

        // Load the image.
        const response = await fetch('../../../common/images/crate-diffuse.png');
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        // Create the texture.
        this.texture = WebGL.createTexture(gl, {
            image: imageBitmap,
            min: gl.NEAREST,
            mag: gl.NEAREST,
        });

        // Create the vertex array object (VAO).
        this.vao = gl.createVertexArray();

        // Bind the VAO. All subsequent buffer bindings and attribute
        // configuration is going to be stored the the currently bound VAO.
        gl.bindVertexArray(this.vao);

        // Create the vertex buffer.
        WebGL.createBuffer(gl, {
            data: new Float32Array([
                 0.0,  0.5, /* vertex 0 position */ 0.5, 1, /* vertex 0 texture coordinates */
                -0.5, -0.5, /* vertex 1 position */ 0, 0,   /* vertex 1 texture coordinates */
                 0.5, -0.5, /* vertex 2 position */ 1, 0,   /* vertex 2 texture coordinates */
            ])
        });

        // Configure the position attribute.
        WebGL.configureAttribute(gl, {
            location: 0,
            count: 2,
            type: gl.FLOAT,
            stride: 16,
            offset: 0,
        });

        // Configure the texture coordinates attribute.
        WebGL.configureAttribute(gl, {
            location: 3,
            count: 2,
            type: gl.FLOAT,
            stride: 16,
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
        const { program, uniforms } = this.programs.textured;
        gl.useProgram(program);

        // Select the VAO for rendering.
        gl.bindVertexArray(this.vao);

        // Set the uniform value.
        gl.uniform2f(uniforms.uOffset, this.offsetX, this.offsetY);

        // Activate texture unit 0.
        gl.activeTexture(gl.TEXTURE0);

        // Bind the texture to texture unit 0.
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Set the uniform uTexture to use the texture unit 0.
        // Note that the type of the uniform is 1i (1 integer).
        gl.uniform1i(uniforms.uTexture, 0);

        // Draw the triangle.
        gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
    }

    resize() {
        const gl = this.gl;
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas, {
    preserveDrawingBuffer: true,
});
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'offsetX', -1, 1);
gui.add(app, 'offsetY', -1, 1);
