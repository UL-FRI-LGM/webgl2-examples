import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.startTime = Date.now();

        this.programs = WebGL.buildPrograms(gl, shaders);

        // Create a triangle mesh. It contains only positions.
        this.triangle = gl.createVertexArray();
        gl.bindVertexArray(this.triangle);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -0.5, -0.5,
             0.5, -0.5,
             0.0,  0.5,
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        // Create a square mesh. It contains positions and texture coordinates.
        this.square = gl.createVertexArray();
        gl.bindVertexArray(this.square);
        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            -1, -1,    0, 0,
             1, -1,    1, 0,
             1,  1,    1, 1,
            -1,  1,    0, 1,
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 16, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 16, 8);

        // Create a 32x32 texture for the framebuffer.
        // Note that if the data passed to gl.texImage2D is null,
        // the memory is allocated, but no data transfer takes place.
        // Rendering into mipmapped textures is not supported, so we have to
        // explicitly set the filter.
        this.texture = WebGL.createTexture(gl, {
            width  : 32,
            height : 32,
            min    : gl.NEAREST,
            mag    : gl.NEAREST,
        });

        // Create the framebuffer object.
        this.framebuffer = gl.createFramebuffer();

        // Bind the framebuffer to the correct target.
        // 99.9% of the time you are going to be using the FRAMEBUFFER target.
        // There also exist separate targets for read and write operations.
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        // Attach the texture to the framebuffer.
        gl.framebufferTexture2D(

            // This has to be gl.FRAMEBUFFER for historical reasons.
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
            this.texture,

            // The mipmap level of the texture.
            0
        );
    }

    render() {
        const gl = this.gl;

        const time = Date.now() - this.startTime;
        const c = Math.cos(time * 0.0003);
        const s = Math.sin(time * 0.0003);
        const transform = [c, s, -s, c];

        // First, we are going to draw a triangle into the framebuffer
        // we created earlier. First, we have to bind it.
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);

        // Set the viewport transform to cover the whole framebuffer.
        gl.viewport(0, 0, 32, 32);

        // Set up the simple program and the triangle mesh.
        let program = this.programs.simple;
        gl.useProgram(program.program);
        gl.bindVertexArray(this.triangle);
        gl.uniformMatrix2fv(program.uniforms.uTransform, false, transform);

        // Draw it with a black background.
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        // Next, bind the default framebuffer (a.k.a. canvas in our case).
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Set the viewport to cover the whole default framebuffer.
        // It may be of different size than the canvas, so use the values
        // supplied by the WebGL context.
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        // Set up the textured program and the square mesh.
        program = this.programs.textured;
        gl.useProgram(program.program);
        gl.bindVertexArray(this.square);

        gl.uniformMatrix2fv(program.uniforms.uTransform, false, transform);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(program.uniforms.uTexture, 0);

        // Draw it with a white background.
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
});
