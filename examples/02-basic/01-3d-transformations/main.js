import { GUI } from 'dat';
import { mat4 } from 'glm';

import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const programs = WebGL.buildPrograms(gl, shaders);

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

// Create the VAO to store the attributes and indices.
// All bindings are going to be stored in this VAO.
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

WebGL.createBuffer(gl, {
    data: new Float32Array([
        //  positions            colors           index
        -1, -1, -1,  1,      0,  0,  0,  1,    //   0
        -1, -1,  1,  1,      0,  0,  1,  1,    //   1
        -1,  1, -1,  1,      0,  1,  0,  1,    //   2
        -1,  1,  1,  1,      0,  1,  1,  1,    //   3
         1, -1, -1,  1,      1,  0,  0,  1,    //   4
         1, -1,  1,  1,      1,  0,  1,  1,    //   5
         1,  1, -1,  1,      1,  1,  0,  1,    //   6
         1,  1,  1,  1,      1,  1,  1,  1,    //   7
    ]),
});

WebGL.configureAttribute(gl, {
    location: 0,
    count: 4,
    type: gl.FLOAT,
    stride: 32,
    offset: 0,
});

WebGL.configureAttribute(gl, {
    location: 5,
    count: 4,
    type: gl.FLOAT,
    stride: 32,
    offset: 16,
});

WebGL.createBuffer(gl, {
    target: gl.ELEMENT_ARRAY_BUFFER,
    data: new Uint16Array([
        0, 1, 2,    2, 1, 3,
        4, 0, 6,    6, 0, 2,
        5, 4, 7,    7, 4, 6,
        1, 5, 3,    3, 5, 7,
        6, 2, 7,    7, 2, 3,
        1, 0, 5,    5, 0, 4,
    ]),
});

// Create separate matrices for the model transformation (M),
// the camera (view) transformation (V) and the projection (P).
const modelMatrix = mat4.create();
const viewMatrix = mat4.create();
const projectionMatrix = mat4.create();

// Initialize the camera to be translated 5 units back.
mat4.fromTranslation(viewMatrix, [ 0, 0, 5 ]);

// A switch to enable or disable rotation.
const settings = {
    isRotationEnabled: true,
};

function update(time, dt) {
    if (settings.isRotationEnabled) {
        // Recalculate the model matrix with new rotation values.
        // We are going to use the running time to
        // calculate the rotation of the cube.
        mat4.identity(modelMatrix);
        mat4.rotateX(modelMatrix, modelMatrix, time * 0.7);
        mat4.rotateY(modelMatrix, modelMatrix, time * 0.6);
    }
}

function render() {
    // Set the viewport transform.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Clear both the color and the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Use the geometry set up in the start method.
    gl.bindVertexArray(vao);

    // Use a simple coloring shader.
    const { program, uniforms } = programs.simple;
    gl.useProgram(program);

    // Create the matrix that will hold the product of the projection,
    // view, and model matrices (in that order from left to right).
    // This is often called the model-view-projection (MVP) matrix.
    const mvpMatrix = mat4.create();

    // First, copy the model matrix to the MVP. This will be the first
    // transformation of a vertex.
    mat4.copy(mvpMatrix, modelMatrix);

    // Then, multiply it from the left by the inverse of the view matrix.
    // We use an inverse because moving the camera in one way is
    // equivalent of moving the whole world the other way.
    const view = mat4.invert(mat4.create(), viewMatrix);
    mat4.mul(mvpMatrix, view, mvpMatrix);

    // Finally, multiply the result from the left by the projection
    // matrix. This will be the last transformation of a vertex.
    mat4.mul(mvpMatrix, projectionMatrix, mvpMatrix);

    // Set the transformation uniform. The second argument tells WebGL
    // whether to transpose the matrix before uploading it to the GPU.
    gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);

    // Call drawElements when drawing indexed geometry. The number of
    // indices is 36, each index is a short (Uint16Array) and start
    // with the index at index 0.
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function resize({ displaySize: { width, height }}) {
    // When the canvas resizes, recalculate the projection matrix with
    // the new aspect ratio.
    const aspect = width / height;
    const fovy = Math.PI / 3;
    const near = 0.1;
    const far = 100;

    mat4.perspective(projectionMatrix, fovy, aspect, near, far);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(settings, 'isRotationEnabled').name('Enable rotation');
