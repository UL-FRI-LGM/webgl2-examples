import { Mesh, Vertex } from '../core.js';

export class OBJLoader {

    async loadMesh(url) {
        const response = await fetch(url);
        const text = await response.text();

        const lines = text.split('\n');

        const vRegex = /v\s+(\S+)\s+(\S+)\s+(\S+)\s*/;
        const vData = lines
            .filter(line => vRegex.test(line))
            .map(line => [...line.match(vRegex)].slice(1))
            .map(entry => entry.map(entry => Number(entry)));

        const vnRegex = /vn\s+(\S+)\s+(\S+)\s+(\S+)\s*/;
        const vnData = lines
            .filter(line => vnRegex.test(line))
            .map(line => [...line.match(vnRegex)].slice(1))
            .map(entry => entry.map(entry => Number(entry)));

        const vtRegex = /vt\s+(\S+)\s+(\S+)\s*/;
        const vtData = lines
            .filter(line => vtRegex.test(line))
            .map(line => [...line.match(vtRegex)].slice(1))
            .map(entry => entry.map(entry => Number(entry)));

        function triangulate(list) {
            const triangles = [];
            for (let i = 2; i < list.length; i++) {
                triangles.push(list[0], list[i - 1], list[i]);
            }
            return triangles;
        }

        const fRegex = /f\s+(.*)/;
        const fData = lines
            .filter(line => fRegex.test(line))
            .map(line => line.match(fRegex)[1])
            .map(line => line.trim().split(/\s+/))
            .flatMap(face => triangulate(face));

        const vertices = [];
        const indices = [];
        const cache = {};
        let cacheLength = 0;
        const indicesRegex = /(\d+)(\/(\d+))?(\/(\d+))?/;

        for (const id of fData) {
            if (id in cache) {
                indices.push(cache[id]);
            } else {
                cache[id] = cacheLength;
                indices.push(cacheLength);
                const [,vIndex,,vtIndex,,vnIndex] = [...id.match(indicesRegex)]
                    .map(entry => Number(entry) - 1);
                vertices.push(new Vertex({
                    position: vData[vIndex],
                    normal: vnData[vnIndex],
                    texcoords: vtData[vtIndex],
                }));
                cacheLength++;
            }
        }

        return new Mesh({ vertices, indices });
    }

}
