import Node from './Node.js';

export default class Floor extends Node {

    constructor(width, height) {
        super();

        let vertices = [];
        this.vertices = vertices;
        for (let j = 0; j <= height; j++) {
            for (let i = 0; i <= width; i++) {
                const x = i - width / 2;
                const z = j - height / 2;
                const y = Math.random() / 4;

                // position
                vertices.push(x);
                vertices.push(y);
                vertices.push(z);

                // normal
                vertices.push(0);
                vertices.push(1);
                vertices.push(0);

                // texcoords
                vertices.push(x);
                vertices.push(z);
            }
        }

        let indices = [];
        this.indices = indices;
        for (let j = 0; j < height; j++) {
            for (let i = 0; i < width; i++) {
                indices.push(i + j * (width + 1));
                indices.push(i + (j + 1) * (width + 1));
                indices.push((i + 1) + j * (width + 1));
                indices.push((i + 1) + j * (width + 1));
                indices.push(i + (j + 1) * (width + 1));
                indices.push((i + 1) + (j + 1) * (width + 1));
            }
        }

        this.vertices = new Float32Array(vertices);
        this.indices = new Uint16Array(indices);
    }

}
