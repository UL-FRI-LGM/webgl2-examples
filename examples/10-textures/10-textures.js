import { GUI } from '../../lib/dat.gui.module.js';
import { mat4 } from '../../lib/gl-matrix-module.js';

import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
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

        this.startTime = Date.now();

        // Create a texture object.
        this.texture = gl.createTexture();

        // Bind the texture to the correct target. This texture is
        // going to be used as a 2D texture, not as a cube map,
        // 3D texture or a texture array.
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Upload some data to the GPU. This is just a red pixel which we
        // are going to use before the image data is fetched by the browser.
        gl.texImage2D(
            // Use the TEXTURE_2D target. Cube maps have different targets
            // for different faces of the cube.
            gl.TEXTURE_2D,

            // Upload to the level 0 mipmap (most detailed).
            0,

            // Use the unsized RGBA internal format. This is
            // adequate for most needs.
            gl.RGBA,

            // Width and height of the texture. This one is only 1x1.
            1, 1,

            // Border width. Must be 0 by the specification. It was used
            // in earlier versions of OpenGL, but now it is obsolete.
            0,

            // The "high-level" format of the texture. Note that the combination
            // of RGBA for both the high-level format and the internal format
            // is always accepted by the WebGL, but other may not be.
            gl.RGBA,

            // The type of the data in the main memory.
            gl.UNSIGNED_BYTE,

            // The data in the main memory (red color - before the actual data is
            // loaded from the URI).
            new Uint8Array([255, 0, 0, 255])
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

        // We will also create a request for an image.
        const image = new Image();

        // Upload the image to the GPU when it is loaded.
        image.addEventListener('load', () => {
            // We are inside an event handler. Things may have changed,
            // so we have to be sure the correct texture is bound.
            gl.bindTexture(gl.TEXTURE_2D, this.texture);

            gl.texImage2D(
                gl.TEXTURE_2D,    // target
                0,                // mipmap level
                gl.RGBA,          // internal format
                gl.RGBA,          // format
                gl.UNSIGNED_BYTE, // type

                // In WebGL we can upload the image element directly.
                // We can also use <image>, <video> and <canvas> elements.
                image
            );
        });

        // Set the image's source URL to send the request.
        image.src = '../../common/images/crate-diffuse.png';
    }

    update() {
        let time = Date.now() - this.startTime;
        mat4.identity(this.modelMatrix);
        mat4.rotateX(this.modelMatrix, this.modelMatrix, time * 0.0007);
        mat4.rotateY(this.modelMatrix, this.modelMatrix, time * 0.0006);

        this.updateModelViewProjection();
    }

    render() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(this.vao);

        let program = this.programs.simple;
        gl.useProgram(program.program);

        gl.uniformMatrix4fv(program.uniforms.uModelViewProjection,
            false, this.mvpMatrix);

        // Set the texture unit 0 to be active.
        gl.activeTexture(gl.TEXTURE0);

        // Bind the correct texture to texture unit 0.
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        // Set the uniform uTexture to use the texture unit 0.
        // Note that the type of the uniform is 1i (1 integer).
        gl.uniform1i(program.uniforms.uTexture, 0);

        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;
        const fovy = Math.PI / 2;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.projectionMatrix, fovy, aspect, near, far);
    }

    updateModelViewProjection() {
        let matrix = this.mvpMatrix;
        mat4.copy(matrix, this.modelMatrix);
        let viewInverse = mat4.invert(mat4.create(), this.viewMatrix);
        mat4.mul(matrix, viewInverse, matrix);
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

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new GUI();
    gui.add(app, 'isLinearFilter')
       .name('Linear filtering')
       .onChange(() => { app.changeFilter(); });
});
