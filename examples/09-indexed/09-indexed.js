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

        // We have to enable the depth test to prevent overlapping
        // triangles from being drawn all over the place.
        gl.enable(gl.DEPTH_TEST);

        // A fragment passes the depth test if its depth is less than
        // the depth of the fragment in the framebuffer.
        gl.depthFunc(gl.LESS);

        // For efficiency, enable back face culling.
        gl.enable(gl.CULL_FACE);

        // Cull back faces, not front. This is actually the default.
        gl.cullFace(gl.BACK);

        // A front face is defined by counter-clockwise orientation.
        // This is also the default, but we set it here for clarity.
        gl.frontFace(gl.CCW);

        // Define the vertices' positions and colors.
        const vertices = new Float32Array([
            //  positions            colors           index
            -1, -1, -1,  1,      0,  0,  0,  1,    //   0
            -1, -1,  1,  1,      0,  0,  1,  1,    //   1
            -1,  1, -1,  1,      0,  1,  0,  1,    //   2
            -1,  1,  1,  1,      0,  1,  1,  1,    //   3
             1, -1, -1,  1,      1,  0,  0,  1,    //   4
             1, -1,  1,  1,      1,  0,  1,  1,    //   5
             1,  1, -1,  1,      1,  1,  0,  1,    //   6
             1,  1,  1,  1,      1,  1,  1,  1,    //   7
        ]);

        // Connect the vertices together with triangles.
        // Reference the above vertices by their respective indices.
        // Using 16-bit indices and Uint16Array is most common, but
        // we could also use 8-bit or 32-bit indices.
        const indices = new Uint16Array([
            0, 1, 2,    2, 1, 3,
            4, 0, 6,    6, 0, 2,
            5, 4, 7,    7, 4, 6,
            1, 5, 3,    3, 5, 7,
            6, 2, 7,    7, 2, 3,
            1, 0, 5,    5, 0, 4,
        ]);

        // Create the VAO to store the attributes and indices.
        // All bindings are going to be stored in this VAO.
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // Upload attributes to the GPU.
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Upload indices to the GPU.
        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        // Set up attributes and their formats.
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);

        // Create separate matrices for the model transformation (M),
        // the camera (view) transformation (V) and the projection (P).
        this.modelMatrix = mat4.create();
        this.viewMatrix = mat4.create();
        this.projectionMatrix = mat4.create();

        // Create another matrix to hold the product of the above
        // matrices. This is called the model-view-projection (MVP) matrix.
        this.mvpMatrix = mat4.create();

        // Initialize the camera to be translated 5 units back.
        mat4.fromTranslation(this.viewMatrix, [ 0, 0, 5 ]);

        // A switch to enable or disable rotation.
        this.isRotationEnabled = true;

        // A switch for perspective-correct interpolation.
        // This is just to show the effect of incorrect interpolation.
        this.isPerspectiveCorrect = true;
    }

    update() {
        if (this.isRotationEnabled) {
            // Recalculate the model matrix with new rotation values.
            // We are going to use the running time to
            // calculate the rotation of the cube.
            const time = performance.now();
            mat4.identity(this.modelMatrix);
            mat4.rotateX(this.modelMatrix, this.modelMatrix, time * 0.0007);
            mat4.rotateY(this.modelMatrix, this.modelMatrix, time * 0.0006);

            // We made changes to the MVP matrix, so we have to update it.
            this.updateModelViewProjection();
        }
    }

    render() {
        const gl = this.gl;

        // Clear both the color and the depth buffer.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Use the geometry set up in the start method.
        gl.bindVertexArray(this.vao);

        // Use a simple coloring shader.
        const { program, uniforms } = this.programs.simple;
        gl.useProgram(program);

        // Set the perspective correctness flag.
        gl.uniform1i(uniforms.uPerspectiveCorrect, this.isPerspectiveCorrect);

        // Set the transformation uniform. The second argument tells WebGL
        // whether to transpose the matrix before uploading it to the GPU.
        gl.uniformMatrix4fv(uniforms.uModelViewProjection,
            false, this.mvpMatrix);

        // Call drawElements when drawing indexed geometry. The number of
        // indices is 36, each index is a short (Uint16Array) and start
        // with the index at index 0.
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
    }

    resize() {
        // When the canvas resizes, recalculate the projection matrix with
        // the new aspect ratio.
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

        // First, copy the model matrix to the MVP. This will be the first
        // transformation of a vertex.
        mat4.copy(matrix, this.modelMatrix);

        // Then, multiply it from the left by the inverse of the camera
        // transformation matrix. We use an inverse because moving the camera
        // in one way is equivalent of moving the whole world the other way.
        const view = mat4.invert(mat4.create(), this.viewMatrix);
        mat4.mul(matrix, view, matrix);

        // Finally, multiply the result from the left by the projection
        // matrix. This will be the last transformation of a vertex.
        mat4.mul(matrix, this.projectionMatrix, matrix);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'isPerspectiveCorrect')
   .name('Perspective-correct');
gui.add(app, 'isRotationEnabled')
   .name('Enable rotation');
