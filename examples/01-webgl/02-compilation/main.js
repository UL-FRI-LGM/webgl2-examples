import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

// ===== VERTEX SHADER ===== //

// Create vertex shader object.
const vertexShader = gl.createShader(gl.VERTEX_SHADER);

// Append source string.
gl.shaderSource(vertexShader, shaders.orange.vertex);

// Try to compile.
gl.compileShader(vertexShader);

// Get compile status and report error if compilation failed.
const vertexStatus = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
if (!vertexStatus) {
    const log = gl.getShaderInfoLog(vertexShader);
    throw new Error('Cannot compile vertex shader\nInfo log:\n' + log);
} else {
    console.log('Vertex shader compiled successfully');
}

// ===== FRAGMENT SHADER ===== //

// Repeat for fragment shader.
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, shaders.orange.fragment);
gl.compileShader(fragmentShader);

const fragmentStatus = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
if (!fragmentStatus) {
    const log = gl.getShaderInfoLog(fragmentShader);
    throw new Error('Cannot compile fragment shader\nInfo log:\n' + log);
} else {
    console.log('Fragment shader compiled successfully');
}

// ===== PROGRAM OBJECT ===== //

// Create a program object.
const program = gl.createProgram();

// Attach both shaders - both are mandatory.
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);

// Try to link.
gl.linkProgram(program);

// Get link status and report error if linkage failed.
const programStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
if (!programStatus) {
    const log = gl.getProgramInfoLog(program);
    throw new Error('Cannot link program\nInfo log:\n' + log);
} else {
    console.log('Program linked successfully');
}

function render() {
    // Activate the program. This function call, although simple, can be
    // very slow as the driver switches the pipeline and revalidates it.
    gl.useProgram(program);

    // Set the viewport transformation to cover the whole canvas.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Draw separate triangles, start with vertex 0, and process
    // 3 vertices. This means that we will draw a single triangle.
    // The built-in variable gl_VertexID will therefore range from 0 to 2.
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

new ResizeSystem({ canvas }).start();
new UpdateSystem({ render }).start();
