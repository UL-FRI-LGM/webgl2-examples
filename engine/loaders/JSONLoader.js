import { Mesh, Vertex } from '../core.js';

export class JSONLoader {

    async loadMesh(url) {
        const response = await fetch(url);
        const json = await response.json();

        const vertices = [];
        const vertexCount = json.positions.length / 3;
        for (let i = 0; i < vertexCount; i++) {
            const position = json?.positions?.slice(i * 3, (i + 1) * 3);
            const texcoords = json?.texcoords?.slice(i * 2, (i + 1) * 2);
            const normal = json?.normals?.slice(i * 3, (i + 1) * 3);
            const tangent = json?.tangents?.slice(i * 3, (i + 1) * 3);
            vertices.push(new Vertex({ position, texcoords, normal, tangent }));
        }

        const indices = json.indices;

        return new Mesh({ vertices, indices });
    }

}
