import Application from '../../common/Application.js';
import * as shaders from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // ===== VERTEX SHADER ===== //

        // create vertex shader object
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);

        // append source string
        gl.shaderSource(vertexShader, shaders.vertex);

        // try to compile
        gl.compileShader(vertexShader);

        // get compile status and report error if compilation failed
        let status = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
        if (!status) {
            const log = gl.getShaderInfoLog(vertexShader);
            throw new Error('Cannot compile vertex shader\nInfo log:\n' + log);
        }

        // ===== FRAGMENT SHADER ===== //

        // repeat for fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, shaders.fragment);
        gl.compileShader(fragmentShader);

        status = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
        if (!status) {
            const log = gl.getShaderInfoLog(fragmentShader);
            throw new Error('Cannot compile fragment shader\nInfo log:\n' + log);
        }

        // ===== PROGRAM OBJECT ===== //

        // create a program object
        const program = gl.createProgram();

        // attach both shaders
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        // try to link
        gl.linkProgram(program);

        // get link status and report error if linkage failed
        status = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!status) {
            const log = gl.getProgramInfoLog(program);
            throw new Error('Cannot link program\nInfo log:\n' + log);
        }

        console.log('Compilation successful');
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
});
