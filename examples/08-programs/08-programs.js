import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        this.programs = WebGL.buildPrograms(gl, shaders);

        const vertices = new Float32Array([
             0.0,  0.5,    1, 0, 0, 1,
            -0.5, -0.5,    0, 1, 0, 1,
             0.5, -0.5,    0, 0, 1, 1,
        ]);

        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.offsetX = 0;
        this.offsetY = 0;
        this.scaleX = 0.5;
        this.scaleY = 0.5;
    }

    render() {
        const gl = this.gl;

        gl.clearColor(1, 1, 1, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Bind the buffer for settings up the attributes.
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

        // Use the first program.
        let program = this.programs.first;
        gl.useProgram(program.program);

        // Set up aPosition.
        gl.enableVertexAttribArray(program.attributes.aPosition);
        gl.vertexAttribPointer(program.attributes.aPosition,
            2, gl.FLOAT, false, 24, 0);

        // Set up aColor.
        gl.enableVertexAttribArray(program.attributes.aColor);
        gl.vertexAttribPointer(program.attributes.aColor,
            4, gl.FLOAT, false, 24, 8);

        // Draw the first triangle with the first program.
        gl.uniform2f(program.uniforms.uOffset, 0.4 + this.offsetX, 0 + this.offsetY);
        gl.drawArrays(gl.TRIANGLES, 0, 3);



        // Now switch the program.
        program = this.programs.second;
        gl.useProgram(program.program);

        // We have to set the attributes again, as they may not be
        // assigned the same locations in different shaders.

        gl.enableVertexAttribArray(program.attributes.aPosition);
        gl.vertexAttribPointer(program.attributes.aPosition,
            2, gl.FLOAT, false, 24, 0);

        gl.enableVertexAttribArray(program.attributes.aColor);
        gl.vertexAttribPointer(program.attributes.aColor,
            4, gl.FLOAT, false, 24, 8);

        // Draw the second triangle with the second program.
        gl.uniform2f(program.uniforms.uOffset, -0.4 + this.offsetX, 0 + this.offsetY);
        gl.uniform2f(program.uniforms.uScale, this.scaleX, this.scaleY);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new dat.GUI();
    gui.add(app, 'offsetX', -1, 1);
    gui.add(app, 'offsetY', -1, 1);
    gui.add(app, 'scaleX', -1, 1);
    gui.add(app, 'scaleY', -1, 1);
});
