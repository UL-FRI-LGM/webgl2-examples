import * as WebGL from './WebGL.js';

export async function loadMesh(gl, url) {
    const response = await fetch(url);
    const mesh = await response.json();

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    WebGL.createBuffer(gl, {
        data: new Float32Array(mesh.positions),
    });

    WebGL.configureAttribute(gl, {
        location: 0,
        count: 3,
        type: gl.FLOAT,
    });

    WebGL.createBuffer(gl, {
        data: new Float32Array(mesh.normals),
    });

    WebGL.configureAttribute(gl, {
        location: 1,
        count: 3,
        type: gl.FLOAT,
    });

    WebGL.createBuffer(gl, {
        data: new Float32Array(mesh.texcoords),
    });

    WebGL.configureAttribute(gl, {
        location: 3,
        count: 2,
        type: gl.FLOAT,
    });

    WebGL.createBuffer(gl, {
        target: gl.ELEMENT_ARRAY_BUFFER,
        data: new Uint16Array(mesh.indices),
    });

    const indices = mesh.indices.length;

    return { vao, indices };
}

export async function loadTexture(gl, url, options) {
    const response = await fetch(url);
    const blob = await response.blob();
    const image = await createImageBitmap(blob);
    const spec = Object.assign({ image }, options);
    return WebGL.createTexture(gl, spec);
}
