import { GUI } from 'dat';
import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

// You can create buffers and connect them to the corresponding
// attribute locations before compiling the shaders. In this case,
// the attribute locations have to be known in advance.

// Create the buffer with vertex positions.
WebGL.createBuffer(gl, {
    data: new Float32Array([
         0.0,  0.5,
        -0.5, -0.5,
         0.5, -0.5,
    ])
});

// Connect the position buffer to the attribute location 0.
WebGL.configureAttribute(gl, {
    location: 0,
    count: 2,
    type: gl.FLOAT,
});

// Create the buffer with vertex colors.
WebGL.createBuffer(gl, {
    data: new Uint8Array([
        255, 0, 0, 255,
        0, 255, 0, 255,
        0, 0, 255, 255,
    ])
});

// Connect the color buffer to the attribute location 5.
WebGL.configureAttribute(gl, {
    location: 5,
    count: 4,
    type: gl.UNSIGNED_BYTE,
    normalize: true,
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
