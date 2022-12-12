import { GUI } from '../../lib/dat.gui.module.js';

import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // These are all the different primitive types in WebGL.
        // As this example only draws a single triangle,
        // most of them are not really useful.
        this.primitiveType = gl.TRIANGLES;
        this.primitiveTypes = {
            POINTS         : gl.POINTS,
            LINES          : gl.LINES,
            LINE_STRIP     : gl.LINE_STRIP,
            LINE_LOOP      : gl.LINE_LOOP,
            TRIANGLES      : gl.TRIANGLES,
            TRIANGLE_STRIP : gl.TRIANGLE_STRIP,
            TRIANGLE_FAN   : gl.TRIANGLE_FAN,
        };

        // The functionality from the previous example has been
        // moved to the WebGL.js function buildPrograms.

        // The variable this.programs now contains a program object,
        // active attribute locations, and active uniform locations
        // for each of the supplied shaders.
        this.programs = WebGL.buildPrograms(gl, shaders);

        // Triangle vertices. They have to be stored in a typed array
        // to be properly transferred to the GPU memory.
        const vertices = new Float32Array([
             0.0,  0.5, // vertex 0 position
            -0.5, -0.5, // vertex 1 position
             0.5, -0.5, // vertex 2 position
        ]);

        // Create a buffer object to represent a chunk of GPU memory.
        this.vertexBuffer = gl.createBuffer();

        // Bind the buffer to the ARRAY_BUFFER target.
        // Every subsequent operation on that target will affect
        // the currently bound buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Transfer the data from the main memory to the GPU memory.
        // The STATIC_DRAW hint tells WebGL that we are going to modify
        // the data rarely and access it from a shader often.
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        // Repeat for color data. Float32Array is actually too accurate,
        // as displays do not have such large contrasts and bit depth.
        // We will keep it simple for now, but we should probably be
        // using a Uint8Array for colors.
        const colors = new Float32Array([
            1, 0, 0, 1, // vertex 0 color
            0, 1, 0, 1, // vertex 1 color
            0, 0, 1, 1, // vertex 2 color
        ]);

        // Upload the color data to the GPU.
        this.colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

        // These two values will be passed into
        // the shader to offset the vertices.
        this.offsetX = 0;
        this.offsetY = 0;
    }

    render() {
        const gl = this.gl;

        // First, clear the screen. We do not want pixels
        // from the previous frame to be visible.
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Select the correct program to use for rendering.
        const { program, attributes, uniforms } = this.programs.test;
        gl.useProgram(program);

        // Bind the buffer first, because vertexAttribPointer
        // associates an attribute with the bound buffer.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Tell WebGL that the data comes from a buffer.
        // Back in the day this was an OpenGL extension, now it is mandatory.
        gl.enableVertexAttribArray(attributes.aPosition);

        // Connect the buffer and the attribute and specify how to extract
        // the data from the buffer.
        // The attribute aPosition is of type vec2 and we have two floats
        // per vertex in the buffer. The data is tightly packed,
        // so let WebGL compute the stride and offset.
        gl.vertexAttribPointer(
            attributes.aPosition, // attribute location
            2, // number of components per attribute
            gl.FLOAT, // the type of each component
            false, // should integers be normalized when cast to a float
            0, // stride (ignore for now)
            0, // offset (ignore for now)
        );

        // Repeat for color data.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer);
        gl.enableVertexAttribArray(attributes.aColor);
        gl.vertexAttribPointer(attributes.aColor, 4, gl.FLOAT, false, 0, 0);

        // Set all uniforms. Uniform values are program state, so they do not
        // need to be set again when switching to a different program and
        // then switching back.
        // The uniform uOffset is of type vec2 so we pass in two floats (2f).
        gl.uniform2f(uniforms.uOffset, this.offsetX, this.offsetY);

        // Draw! The primitive type is chosen by the user from
        // a list of options (see above). We are drawing 3 vertices
        // and starting with the vertex at index 0.
        gl.drawArrays(this.primitiveType, 0, 3);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'offsetX', -1, 1);
gui.add(app, 'offsetY', -1, 1);
gui.add(app, 'primitiveType', app.primitiveTypes);
