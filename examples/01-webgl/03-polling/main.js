import { Application } from '../../../common/engine/Application.js';
import { WebGL } from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // Compile the shaders and create the program.
        const vertexShader = WebGL.createShader(gl, shaders.test.vertex, gl.VERTEX_SHADER);
        const fragmentShader = WebGL.createShader(gl, shaders.test.fragment, gl.FRAGMENT_SHADER);
        const { program } = WebGL.createProgram(gl, [ vertexShader, fragmentShader ]);

        // We are going to store attribute locations in a dictionary that
        // maps attribute names to their respective locations.
        const attributes = {};

        // Get the number of active attributes (i.e. not optimzed out by the compiler).
        const activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);

        // For each active attribute get its name and location,
        // and store them in the dictionary.
        for (let i = 0; i < activeAttributes; i++) {
            const info = gl.getActiveAttrib(program, i);
            attributes[info.name] = gl.getAttribLocation(program, info.name);
        }

        // We are going to store uniform locations in a dictionary that
        // maps uniform names to their respective locations.
        const uniforms = {};

        // Get the number of active uniforms (i.e. not optimzed out by the compiler).
        const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);

        // For each active uniform get its name and location,
        // and store them in the dictionary.
        for (let i = 0; i < activeUniforms; i++) {
            const info = gl.getActiveUniform(program, i);
            uniforms[info.name] = gl.getUniformLocation(program, info.name);
        }

        console.log(attributes, uniforms);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();
