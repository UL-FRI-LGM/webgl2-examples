import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.instanced;
        gl.useProgram(program);

        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projection);

        this.renderNode(scene, scene.globalMatrix);
    }

    renderNode(node, modelMatrix) {
        const gl = this.gl;

        modelMatrix = mat4.clone(modelMatrix);
        mat4.mul(modelMatrix, modelMatrix, node.localMatrix);

        const { uniforms } = this.programs.instanced;

        if (node.model) {
            gl.bindVertexArray(node.model.vao);

            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, node.texture);

            gl.drawElementsInstanced(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0, node.instanceCount);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    createModel(model, instances) {
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

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instances.texCoordMatrices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.enableVertexAttribArray(3);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 9 * 4, 0 * 4);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 9 * 4, 3 * 4);
        gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 9 * 4, 6 * 4);
        gl.vertexAttribDivisor(2, 1);
        gl.vertexAttribDivisor(3, 1);
        gl.vertexAttribDivisor(4, 1);

        gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instances.instanceMatrices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(5);
        gl.enableVertexAttribArray(6);
        gl.enableVertexAttribArray(7);
        gl.enableVertexAttribArray(8);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 16 * 4, 0 * 4);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 16 * 4, 4 * 4);
        gl.vertexAttribPointer(7, 4, gl.FLOAT, false, 16 * 4, 8 * 4);
        gl.vertexAttribPointer(8, 4, gl.FLOAT, false, 16 * 4, 12 * 4);
        gl.vertexAttribDivisor(5, 1);
        gl.vertexAttribDivisor(6, 1);
        gl.vertexAttribDivisor(7, 1);
        gl.vertexAttribDivisor(8, 1);

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
