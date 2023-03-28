import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.simple;
        gl.useProgram(program);

        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);

        const mvpMatrix = mat4.create();
        mat4.mul(mvpMatrix, mvpMatrix, camera.projectionMatrix);
        mat4.mul(mvpMatrix, mvpMatrix, viewMatrix);
        mat4.mul(mvpMatrix, mvpMatrix, scene.globalMatrix);

        this.renderNode(scene, mvpMatrix);
    }

    renderNode(node, mvpMatrix) {
        const gl = this.gl;

        mvpMatrix = mat4.mul(mat4.create(), mvpMatrix, node.localMatrix);

        const { uniforms } = this.programs.simple;

        if (node.model && node.texture) {
            gl.bindVertexArray(node.model.vao);

            gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, node.texture);

            gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, mvpMatrix);
        }
    }

}
