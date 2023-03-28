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
        this.perFragment = true;
        this.currentProgram = this.perFragment
            ? this.programs.perFragment
            : this.programs.perVertex;
    }

    render(scene, camera, light) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.currentProgram;
        gl.useProgram(program);

        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projectionMatrix);
        gl.uniform3fv(uniforms.uCameraPosition,
            mat4.getTranslation(vec3.create(), camera.globalMatrix));

        gl.uniform3fv(uniforms.uLight.color,
            vec3.scale(vec3.create(), light.color, light.intensity / 255));
        gl.uniform3fv(uniforms.uLight.position,
            mat4.getTranslation(vec3.create(), light.globalMatrix));
        gl.uniform3fv(uniforms.uLight.attenuation, light.attenuation);

        this.renderNode(scene, scene.globalMatrix);
    }

    renderNode(node, modelMatrix) {
        const gl = this.gl;

        modelMatrix = mat4.clone(modelMatrix);
        mat4.mul(modelMatrix, modelMatrix, node.localMatrix);

        const { uniforms } = this.currentProgram;

        if (node.model && node.material) {
            gl.bindVertexArray(node.model.vao);

            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, node.material.texture);

            gl.uniform1f(uniforms.uMaterial.diffuse, node.material.diffuse);
            gl.uniform1f(uniforms.uMaterial.specular, node.material.specular);
            gl.uniform1f(uniforms.uMaterial.shininess, node.material.shininess);

            gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

}
