import { GUI } from 'dat';
import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

// Create a texture for the framebuffer.
// Note that if the data passed to gl.texImage2D is null,
// the memory is allocated, but no data transfer takes place.
// Rendering into mipmapped textures is not supported, so we have to
// explicitly set the filter.
const resolution = 64;
const renderTexture = WebGL.createTexture(gl, {
    width  : resolution,
    height : resolution,
    min    : gl.NEAREST,
    mag    : gl.NEAREST,
});

// Create the framebuffer object.
const framebuffer = gl.createFramebuffer();

// Bind the framebuffer. We are going to use the FRAMEBUFFER target.
// There also exist separate targets for read and write operations.
gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

// Attach the texture to the framebuffer.
gl.framebufferTexture2D(

    // This has to be gl.FRAMEBUFFER.
    gl.FRAMEBUFFER,

    // Attach the texture to the 0-th color attachment of the framebuffer.
    // There is also gl.DEPTH_ATTACHMENT if you need a depth buffer.
    // You can have multiple color attachments (at least 4), which you
    // can write into by specifying multiple fragment shader outputs.
    gl.COLOR_ATTACHMENT0,

    // We have to specify the texture target. This is useful for
    // rendering into different faces of a cubemap texture.
    gl.TEXTURE_2D,

    // Our texture object.
    renderTexture,

    // The mipmap level of the texture.
    0
);

// Create the triangle mesh.
const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

WebGL.createBuffer(gl, {
    data: new Float32Array([
         0.0,  0.5,    0.5, 1,
        -0.5, -0.5,    0, 0,
         0.5, -0.5,    1, 0,
    ])
});

WebGL.configureAttribute(gl, {
    location: 0,
    count: 2,
    type: gl.FLOAT,
    stride: 16,
    offset: 0,
});

WebGL.configureAttribute(gl, {
    location: 3,
    count: 2,
    type: gl.FLOAT,
    stride: 16,
    offset: 8,
});

WebGL.createBuffer(gl, {
    target: gl.ELEMENT_ARRAY_BUFFER,
    data: new Uint16Array([
         0, 1, 2
    ])
});

const orangeTexture = WebGL.createTexture(gl, {
    data: new Uint8Array([255, 155, 55, 255]),
    width: 1,
    height: 1,
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
    const { program, uniforms } = programs.textured;

    gl.useProgram(program);
    gl.bindVertexArray(vao);

    // Activate texture unit 0 and connect it to the uniform.
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uniforms.uTexture, 0);

    // First, we are going to draw the triangle into the framebuffer
    // we created earlier. First, we have to bind it.
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Set the viewport transform to cover the whole framebuffer.
    gl.viewport(0, 0, resolution, resolution);

    // Set the offset and texture.
    gl.uniform2f(uniforms.uOffset, settings.offsetX, settings.offsetY);
    gl.bindTexture(gl.TEXTURE_2D, orangeTexture);

    // Draw it with a black background.
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);

    // Next, bind the default framebuffer (a.k.a. canvas in our case).
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Set the viewport to cover the whole default framebuffer.
    // It may be of different size than the canvas, so use the values
    // supplied by the WebGL context.
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    // Set the offset and texture.
    gl.uniform2f(uniforms.uOffset, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, renderTexture);

    // Draw it with a white background.
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, 0);
}

new ResizeSystem({ canvas }).start();
new UpdateSystem({ render }).start();

const gui = new GUI();
gui.add(settings, 'offsetX', -1, 1);
gui.add(settings, 'offsetY', -1, 1);
