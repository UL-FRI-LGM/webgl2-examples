// This script only supports vertex positions, normals,
// texture coordinates, and triangular faces.

const fs = require('fs');

const data = fs.readFileSync(process.argv[2], 'utf8');
const lines = data.split('\n');

const verticesRegex = /v\s+(\S+)\s+(\S+)\s+(\S+)\s*/;
const vertices = lines
    .filter(line => verticesRegex.test(line))
    .flatMap(line => [...line.match(verticesRegex)].slice(1))
    .map(entry => Number(entry));

const normalsRegex = /vn\s+(\S+)\s+(\S+)\s+(\S+)\s*/;
const normals = lines
    .filter(line => normalsRegex.test(line))
    .flatMap(line => [...line.match(normalsRegex)].slice(1))
    .map(entry => Number(entry));

const texcoordsRegex = /vt\s+(\S+)\s+(\S+)\s*/;
const texcoords = lines
    .filter(line => texcoordsRegex.test(line))
    .flatMap(line => [...line.match(texcoordsRegex)].slice(1))
    .map(entry => Number(entry));

const indicesRegex = /f\s+(\S+)\s+(\S+)\s+(\S+)\s*/;
const indices = lines
    .filter(line => indicesRegex.test(line))
    .flatMap(line => [...line.match(indicesRegex)].slice(1))
    .map(entry => Number(entry))
    .map(entry => entry - 1);

console.log(JSON.stringify({ vertices, normals, texcoords, indices }));
