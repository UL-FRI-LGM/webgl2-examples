import { GUI } from 'dat';
import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const programs = WebGL.buildPrograms(gl, shaders);

const settings = {
    // The color of the triangle.
    color: [ 255, 155, 55, 255 ],

    // These two values will be passed into
    // the shader to offset the vertices.
    offsetX: 0,
    offsetY: 0,
};

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
