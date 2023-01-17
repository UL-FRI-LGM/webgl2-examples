import { GUI } from '../../../lib/dat.gui.module.js';

import { Application } from '../../../common/engine/Application.js';
import { WebGL } from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        // Load the image. This will block start() until the promises resolve.
        // Note that createImageBitmap also accepts <img>, <image>, <video>,
        // <canvas>, etc., so you can create a texture from such sources.
        const response = await fetch('../../../common/images/crate-diffuse.png');
        const blob = await response.blob();
        const imageBitmap = await createImageBitmap(blob);

        // Create a texture object.
        this.texture = gl.createTexture();

        // Bind the texture to the correct target. There are also other texture
        // types, such as cube maps, 3D textures, and texture arrays.
        // This texture is going to be used as a 2D texture.
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Upload the image to the GPU texture memory pointed to by the
        // texture object. Note that raw data (ArrayBuffer) can also be
        // uploaded, but that function has a slightly different prototype.
        gl.texImage2D(

            // Use the TEXTURE_2D target.
            gl.TEXTURE_2D,

            // Upload to the level 0 mipmap (most detailed).
            0,

            // Use the unsized RGBA internal format. This is
            // adequate for most needs.
            gl.RGBA,

            // The "high-level" format of the texture.
            gl.RGBA,

            // The type of the data in the main memory.
            gl.UNSIGNED_BYTE,

            // Note that the (internal format, format, type) combination
            // has to be supported by WebGL.

            // The ImageBitmap. This can also be <video>, <canvas>, etc.
            imageBitmap
        );

        // We have to set the filtering for the image and optionally
        // generate/upload mipmaps. In this example we are not going to use
        // mipmaps, so we have to be careful that we use appropriate filters.

        // First, we set the minification filter. This filter is used when a
        // pixel covers many texels (when the image is downscaled).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

        // Then, we set the magnification filter. This filter is used when a
        // texel covers many pixels (when the image is upscaled).
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        // We also need to specify what happens when we sample the texture
        // outside the unit square. In our case we just repeat the texture.
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

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

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'offsetX', -1, 1);
gui.add(app, 'offsetY', -1, 1);
