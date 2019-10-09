import * as WebGL from './WebGL.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

export default class SceneLoader {

    async loadScene(uri) {
        const scene = await this.loadJson(uri);
        const images = scene.textures.map(uri => this.loadImage(uri));
        const models = scene.models.map(uri => this.loadJson(uri));
        scene.textures = await Promise.all(images);
        scene.models = await Promise.all(models);
        return scene;
    }

    loadImage(uri) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', reject);
            image.src = uri;
        });
    }

    loadJson(uri) {
        return fetch(uri).then(response => response.json());
    }

}
