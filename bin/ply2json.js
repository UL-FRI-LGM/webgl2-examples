// This script only supports vertex positions, normals,
// texture coordinates, and triangular faces.
// It only parses input files in ascii format.

const fs = require('fs');

const data = fs.readFileSync(process.argv[2], 'utf8');
const lines = data.split('\n');

const vertexCountRegex = /element vertex (\d+)/;
const vertexCount = lines
    .filter(line => vertexCountRegex.test(line))
    .flatMap(line => [...line.match(vertexCountRegex)].slice(1))
    .map(entry => Number(entry))[0];

const faceCountRegex = /element face (\d+)/;
const faceCount = lines
    .filter(line => faceCountRegex.test(line))
    .flatMap(line => [...line.match(faceCountRegex)].slice(1))
    .map(entry => Number(entry))[0];

const endHeaderIndex = lines.indexOf('end_header');
const vertexStartIndex = endHeaderIndex + 1;
const vertexData = lines.slice(vertexStartIndex, vertexStartIndex + vertexCount);
const faceStartIndex = vertexStartIndex + vertexCount;
const faceData = lines.slice(faceStartIndex, faceStartIndex + faceCount);

// assume vertices are of format (x, y, z, nx, ny, nz, s, t)
const parsedVertices = vertexData.map(line => line.split(' ').map(entry => Number(entry)));
const vertices = parsedVertices.map(line => line.slice(0, 3)).flat();
const normals = parsedVertices.map(line => line.slice(3, 6)).flat();
const texcoords = parsedVertices.map(line => line.slice(6, 8)).flat();

// assume faces are of format (n, i0, i1, i2)
const parsedFaces = faceData.map(line => line.split(' ').map(entry => Number(entry)));
const indices = parsedFaces.map(line => line.slice(1, 4)).flat();

console.log(JSON.stringify({ vertices, normals, texcoords, indices }));
