import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    getLocalMatrix(node) {
        const transform = node.getComponentOfType(Transform);
        return transform ? transform.matrix : mat4.create();
    }

    getGlobalMatrix(node) {
        const localMatrix = this.getLocalMatrix(node);
        if (!node.parent) {
            return localMatrix;
        } else {
            const globalMatrix = this.getGlobalMatrix(node.parent);
            return mat4.mul(globalMatrix, globalMatrix, localMatrix);
        }
    }

    getProjectionMatrix(node) {
        const camera = node.getComponentOfType(Camera);
        return camera ? camera.projectionMatrix : mat4.create();
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.simple;
        gl.useProgram(program);

        const viewMatrix = this.getGlobalMatrix(camera);
        mat4.invert(viewMatrix, viewMatrix);

        const projectionMatrix = this.getProjectionMatrix(camera);

        const mvpMatrix = mat4.create();
        mat4.mul(mvpMatrix, mvpMatrix, projectionMatrix);
        mat4.mul(mvpMatrix, mvpMatrix, viewMatrix);

        this.renderNode(scene, mvpMatrix);
    }

    renderNode(node, mvpMatrix) {
        const gl = this.gl;

        const localMatrix = this.getLocalMatrix(node);
        mvpMatrix = mat4.mul(mat4.create(), mvpMatrix, localMatrix);

        const { uniforms } = this.programs.simple;

        if (node.mesh && node.texture) {
            gl.bindVertexArray(node.mesh.vao);

            gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, node.texture);

            gl.drawElements(gl.TRIANGLES, node.mesh.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, mvpMatrix);
        }
    }

}
