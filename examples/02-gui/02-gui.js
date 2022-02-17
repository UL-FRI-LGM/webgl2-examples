import { GUI } from '../../lib/dat.gui.module.js';
import { Application } from '../../common/engine/Application.js';

// The functionality from the previous example
// has been moved to Application.js.

class App extends Application {

    start() {
        this.color = [ 65, 105, 225 ];
    }

    render() {
        const gl = this.gl;

        const c = this.color;
        gl.clearColor(c[0] / 255, c[1] / 255, c[2] / 255, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

// Create the GUI manager.
const gui = new GUI();

// This color picker widget modifies the variable app.color.
gui.addColor(app, 'color');
