import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.startTime = Date.now();

        this.programs = WebGL.buildPrograms(gl, shaders);

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

        this.texture = WebGL.createTexture(gl, {
            width  : 32,
            height : 32,
            wrapS  : gl.CLAMP_TO_EDGE,
            wrapT  : gl.CLAMP_TO_EDGE,
            min    : gl.NEAREST,
            mag    : gl.NEAREST,
        });

        this.framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);
    }

    update() {
        const time = Date.now() - this.startTime;

        let c = Math.cos(time * 0.0003);
        let s = Math.sin(time * 0.0003);
        this.triangleTransform = [c, s, -s, c];

        this.squareTransform = [c, s, -s, c];
    }

    render() {
        const gl = this.gl;

        let program = this.programs.simple;
        gl.useProgram(program.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
        gl.viewport(0, 0, 32, 32);
        gl.bindVertexArray(this.triangle);
        gl.uniformMatrix2fv(program.uniforms.uTransform, false, this.triangleTransform);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        program = this.programs.textured;
        gl.useProgram(program.program);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindVertexArray(this.square);
        gl.uniformMatrix2fv(program.uniforms.uTransform, false, this.squareTransform);
        gl.uniform1i(program.uniforms.uTexture, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
});
