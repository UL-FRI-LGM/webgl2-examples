import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';
import GLTFLoader from './GLTFLoader.js';
import Renderer from './Renderer.js';

const mat4 = glMatrix.mat4;

class App extends Application {

    start() {
        this.renderer = new Renderer(this.gl);
        this.loader = new GLTFLoader(this.gl);

        this.loader.load('../../common/models/monkey/monkey.gltf');
    }

    render() {
        if (!this.loader.built) {
            return;
        }

        const scene = this.loader.getObjectByName('Scene');
        const camera = this.loader.getObjectByName('Camera');
        if (!scene || !camera) {
            throw new Error('Scene or camera not present in glTF');
        }

        this.renderer.render(scene, camera);
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspectRatio = w / h;

        this.loader.setAspectRatio(aspectRatio);
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
});
