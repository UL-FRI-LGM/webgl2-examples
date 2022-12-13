import { GUI } from '../../../lib/dat.gui.module.js';
import { Application } from './Application.js';

class App extends Application {

    start() {
        // Create a default color in the RGBA format.
        // The values range from 0 to 255.
        this.color = [ 255, 155, 55, 255 ];
    }

    render() {
        const gl = this.gl;
        gl.clearColor(...this.color.map(c => c / 255));
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

}

// Create an App instance with the canvas from the HTML.
const canvas = document.querySelector('canvas');
const app = new App(canvas);

// Wait for initialization to finish and then remove the loader.
await app.init();
document.querySelector('.loader-container').remove();

// Create the GUI manager.
const gui = new GUI();

// This color picker widget modifies the variable app.color.
gui.addColor(app, 'color');
