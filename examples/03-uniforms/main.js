import { GUI } from '../../lib/dat.gui.module.js';
import { Application } from '../../common/engine/Application.js';
import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

class App extends Application {

    start() {
        const gl = this.gl;

        // Compile the shaders and create the program.
        const vertexShader = WebGL.createShader(gl, shaders.color.vertex, gl.VERTEX_SHADER);
        const fragmentShader = WebGL.createShader(gl, shaders.color.fragment, gl.FRAGMENT_SHADER);
        const { program } = WebGL.createProgram(gl, [ vertexShader, fragmentShader ]);

        // Activate the program.
        gl.useProgram(program);

        // Get uniform locations.
        this.uOffset = gl.getUniformLocation(program, 'uOffset');
        this.uColor = gl.getUniformLocation(program, 'uColor');

        // Create a default color in the RGBA format.
        // The values range from 0 to 255.
        this.color = [ 255, 155, 55, 255 ];

        // Set the default offset.
        this.offsetX = 0;
        this.offsetY = 0;
    }

    render() {
        const gl = this.gl;

        // Set the uniform values.
        gl.uniform2f(this.uOffset, this.offsetX, this.offsetY);
        gl.uniform4fv(this.uColor, this.color.map(c => c / 255));

        // If everything is connected correctly,
        // the rendering code does not change.
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.addColor(app, 'color');
gui.add(app, 'offsetX', -1, 1);
gui.add(app, 'offsetY', -1, 1);
