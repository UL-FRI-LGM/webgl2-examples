import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';
import { Material } from './Material.js';

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

    getViewMatrix(node) {
        const globalMatrix = this.getGlobalMatrix(node);
        return mat4.invert(globalMatrix, globalMatrix);
    }

    getProjectionMatrix(node) {
        const camera = node.getComponentOfType(Camera);
        return camera ? camera.projectionMatrix : mat4.create();
    }

    render(scene, camera, skybox) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.envmap;
        gl.useProgram(program);

        const viewMatrix = this.getViewMatrix(camera);
        const projectionMatrix = this.getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.uniform3fv(uniforms.uCameraPosition,
            mat4.getTranslation(vec3.create(), this.getGlobalMatrix(camera)));

        this.renderNode(scene, mat4.create());
        this.renderSkybox(skybox, camera);
    }

    renderNode(node, modelMatrix) {
        const gl = this.gl;

        const localMatrix = this.getLocalMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);

        const { uniforms } = this.programs.envmap;

        const material = node.getComponentOfType(Material);

        if (node.mesh && material) {
            gl.bindVertexArray(node.mesh.vao);

            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, material.texture);

            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uniforms.uEnvmap, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.envmap);

            gl.uniform1f(uniforms.uReflectance, material.reflectance);
            gl.uniform1f(uniforms.uTransmittance, material.transmittance);
            gl.uniform1f(uniforms.uIOR, material.ior);
            gl.uniform1f(uniforms.uEffect, material.effect);

            gl.drawElements(gl.TRIANGLES, node.mesh.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderSkybox(skybox, camera) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.skybox;
        gl.useProgram(program);

        const viewMatrix = this.getViewMatrix(camera);
        const projectionMatrix = this.getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.bindVertexArray(skybox.mesh.vao);

        const material = skybox.getComponentOfType(Material);

        if (material) {
            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uniforms.uEnvmap, 1);
            gl.bindTexture(gl.TEXTURE_2D, material.envmap);

            gl.depthFunc(gl.LEQUAL);
            gl.disable(gl.CULL_FACE);
            gl.drawElements(gl.TRIANGLES, skybox.mesh.indices, gl.UNSIGNED_SHORT, 0);
            gl.enable(gl.CULL_FACE);
            gl.depthFunc(gl.LESS);
        }

    }

}
