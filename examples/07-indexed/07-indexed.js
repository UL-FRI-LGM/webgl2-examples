import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

const mat4 = glMatrix.mat4;

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

        // We are going to use the running time to
        // calculate the rotation of the cube.
        this.startTime = Date.now();
    }

    update() {
        // Recalculate the model matrix with new rotation values.
        let time = Date.now() - this.startTime;
        mat4.identity(this.modelMatrix);
        mat4.rotateX(this.modelMatrix, this.modelMatrix, time * 0.0007);
        mat4.rotateY(this.modelMatrix, this.modelMatrix, time * 0.0006);

        // We made changes to the MVP matrix, so we have to update it.
        this.updateModelViewProjection();
    }

    render() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(this.vao);

        let program = this.programs.simple;
        gl.useProgram(program.program);

        // Set the corresponding uniform. The second argument tells WebGL
        // whether to transpose the matrix before uploading it to the GPU.
        gl.uniformMatrix4fv(program.uniforms.uModelViewProjection,
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
        const fovy = Math.PI / 2;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.projectionMatrix, fovy, aspect, near, far);
    }

    updateModelViewProjection() {
        let matrix = this.mvpMatrix;

        // First, copy the model matrix to the MVP. This will be the first
        // transformation of a vertex.
        mat4.copy(matrix, this.modelMatrix);

        // Then, multiply it from the left by the inverse of the view
        // matrix. We use an inverse because moving the camera in one way
        // is equivalent of moving the whole world the other way.
        let viewInverse = mat4.invert(mat4.create(), this.viewMatrix);
        mat4.mul(matrix, viewInverse, matrix);

        // Finally, multiply the result from the left by the projection
        // matrix. This will be the last transformation of a vertex.
        mat4.mul(matrix, this.projectionMatrix, matrix);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
});
