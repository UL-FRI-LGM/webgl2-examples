import { GUI } from 'dat';
import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

// Create the vertex array object (VAO).
const vao = gl.createVertexArray();

// Bind the VAO. All subsequent buffer bindings and attribute
// configuration is going to be stored the the currently bound VAO.
gl.bindVertexArray(vao);

// Create the vertex buffer.
WebGL.createBuffer(gl, {
    data: new Float32Array([
         0.0,  0.5, /* vertex 0 position */ 1, 0, 0, 1, /* vertex 0 color */
        -0.5, -0.5, /* vertex 1 position */ 0, 1, 0, 1, /* vertex 1 color */
         0.5, -0.5, /* vertex 2 position */ 0, 0, 1, 1, /* vertex 2 color */
    ])
});

// Configure the position attribute.
WebGL.configureAttribute(gl, {
    location: 0,
    count: 2,
    type: gl.FLOAT,
    stride: 24,
    offset: 0,
});

// Configure the color attribute.
WebGL.configureAttribute(gl, {
    location: 5,
    count: 4,
    type: gl.FLOAT,
    stride: 24,
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

    // Select the VAO for rendering.
    gl.bindVertexArray(vao);

    // Set the uniform value.
    gl.uniform2f(uniforms.uOffset, settings.offsetX, settings.offsetY);

    // Draw the triangle.
    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
}

new ResizeSystem({ canvas }).start();
new UpdateSystem({ render }).start();

const gui = new GUI();
gui.add(settings, 'offsetX', -1, 1);
gui.add(settings, 'offsetY', -1, 1);
