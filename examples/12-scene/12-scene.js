import Application from '../../common/Application.js';
import * as WebGL from './WebGL.js';

import Node from './Node.js';

import shaders from './shaders.js';
import * as CubeModel from './cube.js';

const mat4 = glMatrix.mat4;

class App extends Application {

    initGL() {
        const gl = this.gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    start() {
        const gl = this.gl;

        this.initGL();

        // We need a root node to add all other nodes to it.
        this.root = new Node();

        // The camera holds a projection transformation, and its global
        // transformation is used as the inverse view transformation.
        this.camera = new Node();
        this.camera.projection = mat4.create();
        this.root.addChild(this.camera);

        // Load the model. Here we just hardcoded the model as a javascript
        // module, but usually the resources would be requested asynchronously
        // during the loading screen.
        const cubeModel = this.createModel(CubeModel);

        // A default texture is needed before the actual texture is fetched
        // from the server.
        const defaultTexture = WebGL.createTexture(gl, {
            data   : new Uint8Array([255, 255, 255, 255]),
            width  : 1,
            height : 1,
        });

        // Create three cubes, two attached to the root node and one
        // attached to another cube. Set the correct models and textures.
        this.cube1 = new Node();
        this.cube1.model = cubeModel;
        this.cube1.texture = defaultTexture;
        this.root.addChild(this.cube1);

        this.cube2 = new Node();
        this.cube2.model = cubeModel;
        this.cube2.texture = defaultTexture;
        this.root.addChild(this.cube2);

        this.cube3 = new Node();
        this.cube3.model = cubeModel;
        this.cube3.texture = defaultTexture;
        this.cube2.addChild(this.cube3);

        // Set two variables for controlling the cubes' rotations from GUI.
        this.leftRotation = 0;
        this.rightRotation = 0;

        // Finally, send a request for a texture and attach the texture to
        // all three cubes when the response arrives. This example shows how
        // to handle resource loading asynchronously.
        this.loadTexture('../../common/images/crate-diffuse.png', {
            mip: true,
            min: gl.NEAREST_MIPMAP_NEAREST,
            mag: gl.NEAREST,
        }, (texture) => {
            this.cube1.texture = texture;
            this.cube2.texture = texture;
            this.cube3.texture = texture;
        });
    }

    update() {
        let t1 = this.cube1.transform;
        mat4.fromTranslation(t1, [-2, 0, -5]);
        mat4.rotateX(t1, t1, this.leftRotation);

        let t2 = this.cube2.transform;
        mat4.fromTranslation(t2, [2, 0, -5]);
        mat4.rotateX(t2, t2, this.rightRotation);

        let t3 = this.cube3.transform;
        mat4.fromTranslation(t3, [-1, 0, -3]);
        mat4.rotateY(t3, t3, 1);
    }

    render() {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.simple;
        gl.useProgram(program.program);

        // In this simple example, only one program is used and only one
        // texture uniform is present. We can set it to use the correct
        // texture mapping unit in advance.
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.uTexture, 0);

        // Create a MVP matrix and a stack to hold the intermediate matrices.
        let mvpMatrix = mat4.create();
        let mvpStack = [];
        const mvpLocation = program.uniforms.uModelViewProjection;
        // We can premultiply the view and projection matrices, so that we
        // do not have to do it for every node during scene traversal.
        const viewMatrix = this.camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(mvpMatrix, this.camera.projection, viewMatrix);

        // Traverse the scene. Before any modification, the MVP matrix has to
        // be pushed onto the stack and then restored once the node is done
        // rendering itself and its children.
        this.root.traverse(
            (node) => {
                mvpStack.push(mat4.clone(mvpMatrix));
                mat4.mul(mvpMatrix, mvpMatrix, node.transform);
                if (node.model) {
                    gl.bindVertexArray(node.model.vao);
                    gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
                    gl.bindTexture(gl.TEXTURE_2D, node.texture);
                    gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
                }
            },
            (node) => {
                mvpMatrix = mvpStack.pop();
            }
        );
    }

    resize() {
        const w = this.canvas.clientWidth;
        const h = this.canvas.clientHeight;
        const aspect = w / h;
        const fovy = Math.PI / 2;
        const near = 0.1;
        const far = 100;

        mat4.perspective(this.camera.projection, fovy, aspect, near, far);
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);

        const indices = model.indices.length;
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);

        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 16);

        return { vao, indices };
    }

    loadTexture(url, options, handler) {
        const gl = this.gl;

        let image = new Image();
        image.addEventListener('load', () => {
            const opts = Object.assign({ image }, options);
            handler(WebGL.createTexture(gl, opts));
        });
        image.src = url;
    }

}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.querySelector('canvas');
    const app = new App(canvas);
    const gui = new dat.GUI();
    gui.add(app, 'leftRotation', -3, 3);
    gui.add(app, 'rightRotation', -3, 3);
});
