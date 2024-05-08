import { GUI } from 'dat';
import { mat4 } from 'glm';

import * as WebGL from 'engine/WebGL.js';

import { ResizeSystem } from 'engine/systems/ResizeSystem.js';
import { UpdateSystem } from 'engine/systems/UpdateSystem.js';

import { Node } from 'engine/core/Node.js';
import { shaders } from './shaders.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');

const programs = WebGL.buildPrograms(gl, shaders);

gl.clearColor(1, 1, 1, 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

// We need a root node to add all other nodes to it.
const root = new Node();
root.localMatrix = mat4.create();

// The camera holds a projection transformation, and its global
// transformation is used as the inverse view transformation.
const camera = new Node();
camera.localMatrix = mat4.create();
camera.projectionMatrix = mat4.create();
root.addChild(camera);

// Create three cubes, two attached to the root node and one
// attached to another cube.
const cube1 = new Node();
const cube2 = new Node();
const cube3 = new Node();
cube1.localMatrix = mat4.create();
cube2.localMatrix = mat4.create();
cube3.localMatrix = mat4.create();

root.addChild(cube1);
root.addChild(cube2);
cube2.addChild(cube3);

// Load the mesh.
const json = await fetch('../../../models/cube/cube.json')
    .then(response => response.json());

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

WebGL.createBuffer(gl, { data: new Float32Array(json.positions) });
WebGL.configureAttribute(gl, {
    location: 0,
    count: 3,
    type: gl.FLOAT,
});

WebGL.createBuffer(gl, { data: new Float32Array(json.texcoords) });
WebGL.configureAttribute(gl, {
    location: 3,
    count: 2,
    type: gl.FLOAT,
});

WebGL.createBuffer(gl, {
    target: gl.ELEMENT_ARRAY_BUFFER,
    data: new Uint16Array(json.indices),
});

const mesh = { vao, indices: json.indices.length };

cube1.mesh = mesh;
cube2.mesh = mesh;
cube3.mesh = mesh;

// Load the texture.
const image = await fetch('../../../models/cube/cube-diffuse.png')
    .then(response => response.blob())
    .then(blob => createImageBitmap(blob));

const texture = WebGL.createTexture(gl, {
    image,
    mip: true,
    min: gl.NEAREST_MIPMAP_NEAREST,
    mag: gl.NEAREST,
});

cube1.texture = texture;
cube2.texture = texture;
cube3.texture = texture;

// Set two variables for controlling the cubes' rotations from GUI.
const settings = {
    leftRotation: 0,
    rightRotation: 0,
};

function getGlobalMatrix(node) {
    if (!node.parent) {
        // If the node does not have a parent, it is the root node.
        // Return its local transformation.
        return mat4.clone(node.localMatrix);
    } else {
        // If the node has a parent, we have to take the parent's
        // global transformation into account. This recursion
        // essentially multiplies all local transformations up
        // to the root node.
        const globalMatrix = getGlobalMatrix(node.parent);
        return mat4.mul(globalMatrix, globalMatrix, node.localMatrix);
    }
}

function update() {
    const t1 = cube1.localMatrix;
    mat4.fromTranslation(t1, [-2, 0, -5]);
    mat4.rotateX(t1, t1, settings.leftRotation);

    const t2 = cube2.localMatrix;
    mat4.fromTranslation(t2, [2, 0, -5]);
    mat4.rotateX(t2, t2, settings.rightRotation);

    const t3 = cube3.localMatrix;
    mat4.fromTranslation(t3, [-1, 0, -3]);
    mat4.rotateY(t3, t3, 1);
}

function render() {
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const { program, uniforms } = programs.simple;
    gl.useProgram(program);

    // In this simple example, only one program is used and only one
    // texture uniform is present. We can set it to use the correct
    // texture mapping unit in advance.
    gl.activeTexture(gl.TEXTURE0);
    gl.uniform1i(uniforms.uTexture, 0);

    // Create a MVP matrix.
    let mvpMatrix = mat4.create();

    // We can premultiply the view and projection matrices, so that we
    // do not have to do it for every node during scene traversal.
    const viewMatrix = getGlobalMatrix(camera);
    mat4.invert(viewMatrix, viewMatrix);
    mat4.mul(mvpMatrix, camera.projectionMatrix, viewMatrix);

    renderNode(root, mvpMatrix);
}

function renderNode(node, mvpMatrix) {
    mvpMatrix = mat4.mul(mat4.create(), mvpMatrix, node.localMatrix);

    const { uniforms } = programs.simple;

    if (node.mesh) {
        gl.bindVertexArray(node.mesh.vao);
        gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);
        gl.bindTexture(gl.TEXTURE_2D, node.texture);
        gl.drawElements(gl.TRIANGLES, node.mesh.indices, gl.UNSIGNED_SHORT, 0);
    }

    for (const child of node.children) {
        renderNode(child, mvpMatrix);
    }
}

function resize({ displaySize: { width, height }}) {
    const aspect = width / height;
    const fovy = Math.PI / 2;
    const near = 0.1;
    const far = 100;

    mat4.perspective(camera.projectionMatrix, fovy, aspect, near, far);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

const gui = new GUI();
gui.add(settings, 'leftRotation', -3, 3);
gui.add(settings, 'rightRotation', -3, 3);

document.querySelector('.loader-container').remove();
