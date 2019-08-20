import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import * as shaders from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        const vertexShader = WebGL.createShader(gl, shaders.vertex, gl.VERTEX_SHADER);
        const fragmentShader = WebGL.createShader(gl, shaders.fragment, gl.FRAGMENT_SHADER);
        const program = WebGL.createProgram(gl, [ vertexShader, fragmentShader ]);

        // ===== UNIFORM & ATTRIBUTE LOCATIONS ===== //

        let attributes = {};

        // get number of active attributes (not optimzed out by the compiler)
        const activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
        for (let i = 0; i < activeAttributes; i++) {
            // for each active attribute get its name and location
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }

        let uniforms = {};

        // do the same for uniforms
        const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < activeUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }

        console.log(attributes, uniforms);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
});
