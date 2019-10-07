import * as WebGL from './WebGL.js';

const mat4 = glMatrix.mat4;
const vec3 = glMatrix.vec3;

export default class LevelBuilder {

    constructor(gl) {
        this.gl = gl;
    }

    async build(spec) {
        const textures = spec.textures.map(uri => this.loadTexture(uri));
        const models = spec.models.map(uri => this.loadModel(uri));
        await Promise.all(textures);
        await Promise.all(models);
        const walls = spec.walls.map(wall => {
        });

        //return { vertices, indices };
    }

    createWall(wall) {
        const x0 = wall.x;
        const z0 = wall.y;
        const y0 = 0;
        const x1 = wall.x + wall.w;
        const z1 = wall.y + wall.h;
        const y1 = 1;
        return {
            vertices: [
                x0, y0, z0,    x1, y0, z0,    x0, y1, z0,    x1, y1, z0,
                x1, y0, z0,    x1, y0, z1,    x1, y1, z0,    x1, y1, z1,
                x1, y0, z1,    x0, y0, z1,    x1, y1, z1,    x0, y1, z1,
                x0, y0, z1,    x0, y0, z0,    x0, y1, z1,    x0, y1, z0,
            ],
            texcoords: [
                x0, y0,        x1, y0,        x0, y1,        x1, y1,
                z0, y0,        z1, y0,        z0, y1,        z1, y1,
                x1, y0,        x0, y0,        x1, y1,        x0, y1,
                z1, y0,        z0, y0,        z1, y1,        z0, y1,
            ],
            normals: [
                 0,  0, -1,     0,  0, -1,     0,  0, -1,     0,  0, -1,
                 1,  0,  0,     1,  0,  0,     1,  0,  0,     1,  0,  0,
                 0,  0,  1,     0,  0,  1,     0,  0,  1,     0,  0,  1,
                -1,  0,  0,    -1,  0,  0,    -1,  0,  0,    -1,  0,  0,
            ],
            indices: [
                 0,  1,  2,     2,  1,  3,
                 4,  5,  6,     6,  5,  7,
                 8,  9, 10,    10,  9, 11,
                12, 13, 14,    14, 13, 15,
            ],
        };
    }

    loadImage(uri) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', reject);
            image.src = uri;
        });
    }

    async loadTexture(uri) {
        const gl = this.gl;
        const image = await this.loadImage(uri);
        return WebGL.createTexture(gl, {
            image,
            min: gl.NEAREST,
            mag: gl.NEAREST
        });
    }

    loadModel(uri) {
        return fetch(uri).then(response => response.json());
    }

}
