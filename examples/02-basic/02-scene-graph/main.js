import { GUI } from '../../../lib/dat.gui.module.js';
import { mat4 } from '../../../lib/gl-matrix-module.js';

import { Application } from '../../../common/engine/Application.js';
import { WebGL } from '../../../common/engine/WebGL.js';

import { Node } from './Node.js';

import { shaders } from './shaders.js';

class App extends Application {

    initGL() {
        const gl = this.gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    async start() {
        const gl = this.gl;

        this.initGL();

        // We need a root node to add all other nodes to it.
        this.root = new Node();

        // The camera holds a projection transformation, and its global
        // transformation is used as the inverse view transformation.
        this.camera = new Node();
        this.camera.projectionMatrix = mat4.create();
        this.root.addChild(this.camera);

        // Create three cubes, two attached to the root node and one
        // attached to another cube.
        this.cube1 = new Node();
        this.cube2 = new Node();
        this.cube3 = new Node();

        this.root.addChild(this.cube1);
        this.root.addChild(this.cube2);
        this.cube2.addChild(this.cube3);

        // Set two variables for controlling the cubes' rotations from GUI.
        this.leftRotation = 0;
        this.rightRotation = 0;

        // Load the model and texture.
        const [model, texture] = await Promise.all([
            this.loadModel('../../../common/models/cube.json'),
            this.loadTexture('../../../common/images/crate-diffuse.png', {
                mip: true,
                min: gl.NEAREST_MIPMAP_NEAREST,
                mag: gl.NEAREST,
            }),
        ]);

        this.cube1.model = model;
        this.cube2.model = model;
        this.cube3.model = model;
        this.cube1.texture = texture;
        this.cube2.texture = texture;
        this.cube3.texture = texture;
    }

    update() {
        const t1 = this.cube1.localMatrix;
        mat4.fromTranslation(t1, [-2, 0, -5]);
        mat4.rotateX(t1, t1, this.leftRotation);

        const t2 = this.cube2.localMatrix;
        mat4.fromTranslation(t2, [2, 0, -5]);
        mat4.rotateX(t2, t2, this.rightRotation);

        const t3 = this.cube3.localMatrix;
        mat4.fromTranslation(t3, [-1, 0, -3]);
        mat4.rotateY(t3, t3, 1);
    }

    render() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.simple;
        gl.useProgram(program);

        // In this simple example, only one program is used and only one
        // texture uniform is present. We can set it to use the correct
        // texture mapping unit in advance.
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uTexture, 0);

        // Create a MVP matrix and a stack to hold the intermediate matrices.
        let mvpMatrix = mat4.create();
        const mvpStack = [];

        // We can premultiply the view and projection matrices, so that we
        // do not have to do it for every node during scene traversal.
        const viewMatrix = this.camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(mvpMatrix, this.camera.projectionMatrix, viewMatrix);

        // Traverse the scene. Before any modification, the MVP matrix has to
        // be pushed onto the stack and then restored once the node is done
        // rendering itself and its children.
        // This is usually done with recursion, but we made the stack explitit
        // for demonstration purposes.
        this.root.traverse(
            node => {
                mvpStack.push(mat4.clone(mvpMatrix));
                mat4.mul(mvpMatrix, mvpMatrix, node.localMatrix);
                if (node.model) {
                    gl.bindVertexArray(node.model.vao);
                    gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);
                    gl.bindTexture(gl.TEXTURE_2D, node.texture);
                    gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
                }
            },
            node => {
                mvpMatrix = mvpStack.pop();
            }
        );
    }

    resize(width, height) {
        const aspect = width / height;
        const fovy = Math.PI / 2;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projectionMatrix, fovy, aspect, near, far);
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.texcoords), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    async loadModel(url) {
        const response = await fetch(url);
        const json = await response.json();
        return this.createModel(json);
    }

    async loadTexture(url, options) {
        const response = await fetch(url);
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        const spec = Object.assign({ image }, options);
        return WebGL.createTexture(this.gl, spec);
    }

}

const canvas = document.querySelector('canvas');
const app = new App(canvas);
await app.init();
document.querySelector('.loader-container').remove();

const gui = new GUI();
gui.add(app, 'leftRotation', -3, 3);
gui.add(app, 'rightRotation', -3, 3);
