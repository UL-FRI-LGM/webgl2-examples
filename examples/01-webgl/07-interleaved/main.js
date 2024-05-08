import { GUI } from 'dat';
import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

// This time we are going to store all the data interleaved, so that
// all the attributes for each vertex are close in memory.
// This significantly improves cache usage.

// Create the vertex buffer. We use 2 floats for the position attribute
// and 4 floats for the color attribute per vertex. Each vertex
// therefore requires 24 bytes of data. The positions start at the
// offset of 0 bytes, and the colors start at the offset of 8 bytes.
WebGL.createBuffer(gl, {
    data: new Float32Array([
         0.0,  0.5, /* vertex 0 position */ 1, 0, 0, 1, /* vertex 0 color */
        -0.5, -0.5, /* vertex 1 position */ 0, 1, 0, 1, /* vertex 1 color */
         0.5, -0.5, /* vertex 2 position */ 0, 0, 1, 1, /* vertex 2 color */
    ])
});

// Configure the position attribute with the correct stride and offset.
WebGL.configureAttribute(gl, {
    location: 0,
    count: 2,
    type: gl.FLOAT,
    stride: 24,
    offset: 0,
});

// Configure the color attribute with the correct stride and offset.
WebGL.configureAttribute(gl, {
    location: 5,
    count: 4,
    type: gl.FLOAT,
    stride: 24,
    offset: 8,
});

// Build the programs and extract the attribute and uniform locations.
const programs = WebGL.buildPrograms(gl, shaders);

// These two values will be passed into
// the shader to offset the vertices.
const settings = {
    offsetX: 0,
    offsetY: 0,
};

function render() {
    // Select the correct program to use for rendering.
    const { program, uniforms } = programs.colored;
    gl.useProgram(program);

    // Set the viewport transform.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Set the uniform value.
    gl.uniform2f(uniforms.uOffset, settings.offsetX, settings.offsetY);

    // Draw the triangle.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

new ResizeSystem({ canvas }).start();
new UpdateSystem({ render }).start();

const gui = new GUI();
gui.add(settings, 'offsetX', -1, 1);
gui.add(settings, 'offsetY', -1, 1);
