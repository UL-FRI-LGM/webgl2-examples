import { GUI } from '../../lib/dat.gui.module.js';
import { mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    async start() {
        const gl = this.gl;

        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        // Define the vertices' positions and texture coordinates.
        //
        //  11--13
        //  |    |
        //  |    |
        //  1----3----5----7----9
        //  |    |    |    |    |
        //  |    |    |    |    |
        //  0----2----4----6----8
        //  |    |
        //  |    |
        //  10--12
        //
        const vertices = new Float32Array([
            //  positions      texcoords        index
            -1, -1, -1,  1,      0,  0,      //   0
            -1,  1, -1,  1,      0,  1,      //   1
            -1, -1,  1,  1,      1,  0,      //   2
            -1,  1,  1,  1,      1,  1,      //   3
             1, -1,  1,  1,      2,  0,      //   4
             1,  1,  1,  1,      2,  1,      //   5
             1, -1, -1,  1,      3,  0,      //   6
             1,  1, -1,  1,      3,  1,      //   7
            -1, -1, -1,  1,      4,  0,      //   8
            -1,  1, -1,  1,      4,  1,      //   9
             1, -1, -1,  1,      0, -1,      //  10
             1,  1, -1,  1,      0,  2,      //  11
             1, -1,  1,  1,      1, -1,      //  12
             1,  1,  1,  1,      1,  2,      //  13
        ]);

        const indices = new Uint16Array([
             0,  2,  1,      1,  2,  3,
             2,  4,  3,      3,  4,  5,
             4,  6,  5,      5,  6,  7,
             6,  8,  7,      7,  8,  9,
             1,  3, 11,     11,  3, 13,
            10, 12,  0,      0, 12,  2,
        ]);

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 16);

        this.modelMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();
        this.mvpMatrix = mat4.create();

        mat4.fromTranslation(this.viewMatrix, [ 0, 0, 5 ]);

        this.isRotationEnabled = true;

        // Load the image. This will block start() until the promises resolve.
        // Note that createImageBitmap also accepts <img>, <image>, <video>,
        // <canvas>, etc., so you can create a texture from such sources.
        const response = await fetch('../../common/images/crate-diffuse.png');
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

        // A bool will hold the current filtering mode of the texture
        // so we can change it with a press of a button.
        this.isLinearFilter = false;

        // A switch for perspective-correct texture mapping.
        // This is just to show the effect of incorrect texture mapping.
        this.isPerspectiveCorrect = true;

        // The texture coordinates are scaled in the shader.
        // This is just to demonstrate undersampling issues.
        this.textureScale = 1;
    }

    update() {
        if (this.isRotationEnabled) {
            const time = performance.now();
            mat4.identity(this.modelMatrix);
            mat4.rotateX(this.modelMatrix, this.modelMatrix, time * 0.0007);
            mat4.rotateY(this.modelMatrix, this.modelMatrix, time * 0.0006);

            this.updateModelViewProjection();
        }
    }

    render() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(this.vao);

        const { program, uniforms } = this.programs.simple;
        gl.useProgram(program);

        gl.uniform1i(uniforms.uPerspectiveCorrect, this.isPerspectiveCorrect);
        gl.uniform1f(uniforms.uTextureScale, this.textureScale);
        gl.uniformMatrix4fv(uniforms.uModelViewProjection,
            false, this.mvpMatrix);

        // Set the texture unit 0 to be active.
        gl.activeTexture(gl.TEXTURE0);

        // Bind the correct texture to texture unit 0.
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Set the uniform uTexture to use the texture unit 0.
        // Note that the type of the uniform is 1i (1 integer).
        gl.uniform1i(uniforms.uTexture, 0);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;
        const fovy = Math.PI / 3;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.projectionMatrix, fovy, aspect, near, far);
    }

    updateModelViewProjection() {
        const matrix = this.mvpMatrix;
        mat4.copy(matrix, this.modelMatrix);
        const view = mat4.invert(mat4.create(), this.viewMatrix);
        mat4.mul(matrix, view, matrix);
        mat4.mul(matrix, this.projectionMatrix, matrix);
    }

    changeFilter() {
        const gl = this.gl;

        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const filter = this.isLinearFilter ? gl.LINEAR : gl.NEAREST;
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'isLinearFilter')
   .name('Linear filtering')
   .onChange(e => app.changeFilter());
gui.add(app, 'isPerspectiveCorrect')
   .name('Perspective-correct');
gui.add(app, 'textureScale')
   .name('Texture scale');
gui.add(app, 'isRotationEnabled')
   .name('Enable rotation');
