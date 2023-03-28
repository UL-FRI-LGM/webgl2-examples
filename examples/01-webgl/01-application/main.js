import { GUI } from '../../../lib/dat.gui.module.js';
import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const settings = {
    color: [ 255, 155, 55, 255 ],
};

function render() {
    gl.clearColor(...settings.color.map(c => c / 255));
    gl.clear(gl.COLOR_BUFFER_BIT);
}

new ResizeSystem({ canvas }).start();
new UpdateSystem({ render }).start();

const gui = new GUI();
gui.addColor(settings, 'color');
