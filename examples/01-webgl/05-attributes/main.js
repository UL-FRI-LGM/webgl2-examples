import { GUI } from 'dat';
import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

// Compile the shaders and create the program.
const programs = WebGL.buildPrograms(gl, shaders);

const settings = {
    // The color of the triangle.
    color: [ 255, 155, 55, 255 ],

    // These two values will be passed into
    // the shader to offset the vertices.
    offsetX: 0,
    offsetY: 0,
};

// Prepare the data in the main memory. An ArrayBuffer or a typed
// view (TypedArray or DataView) is necessary to assure the correct
// binary data format. Note that, from the point of view of WebGL,
// a buffer is just an array of bytes without any type information.
const array = new Float32Array([
     0.0,  0.5, // vertex 0 position
    -0.5, -0.5, // vertex 1 position
     0.5, -0.5, // vertex 2 position
]);

// Create the buffer object. Note that this call only creates a handle
// in the driver and does not allocate any space in the GPU memory.
const buffer = gl.createBuffer();

// Activate the buffer object by binding it to the appropriate target.
// This buffer will store the data for the vertex attributes, so
// we bind it to the ARRAY_BUFFER target. Other targets exist for
// uniform buffer objects and indices.
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

// Transfer the data from the main memory to the GPU memory. Memory
// allocation is performed here if the buffer was empty before.
// If the buffer was not empty and the new data needs more space,
// reallocation may be necessary. The function accepts an additional
// hint about the intended usage of the data. The driver can use this
// hint to optimize the memory accesses. The STATIC_DRAW hint tells
// WebGL that we are going to write the data rarely (maybe only once)
// and read it from a shader often.
gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW);

// Now we have to connect the buffer to the vertex position attribute.
// We will have to get the attribute's location from the driver.
const aPosition = programs.test.attributes.aPosition;

// First, we are going to enable the attribute. This tells WebGL that
// the data for this attribute is going to come from a buffer object.
gl.enableVertexAttribArray(aPosition);

// Then, we are going to connect the currently active buffer object
// to the position attribute and, in the same function call, define
// the data format and layout.
gl.vertexAttribPointer(
    // Attribute location.
    aPosition,

    // The format of the data in the buffer object. Since the
    // attribute in the shader is declared as a vec2, we are supplying
    // 2 components of the type FLOAT.
    2, gl.FLOAT,

    // Should integers be normalized when cast to a float?
    // This parameter does not affect float attributes.
    false,

    // The layout of the data in the buffer object. These two numbers
    // represent the stride and offset in bytes. You can ignore
    // them for now, as they are used for interleaved attributes.
    // If they are both set to 0, WebGL will assume they are tightly
    // packed inside the buffer and compute the stride based on the
    // data format defined above.
    0, 0
);

function render() {
    const { program, uniforms } = programs.test;

    // Activate the program.
    gl.useProgram(program);

    // Set the viewport transform.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Set the uniform values.
    gl.uniform2f(uniforms.uOffset, settings.offsetX, settings.offsetY);
    gl.uniform4fv(uniforms.uColor, settings.color.map(c => c / 255));

    // If everything is connected correctly,
    // the rendering code does not change.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

new ResizeSystem({ canvas }).start();
new UpdateSystem({ render }).start();

const gui = new GUI();
gui.addColor(settings, 'color');
gui.add(settings, 'offsetX', -1, 1);
gui.add(settings, 'offsetY', -1, 1);
