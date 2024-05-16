import { vec3, mat4 } from 'glm';

import * as WebGL from 'engine/WebGL.js';

import { BaseRenderer } from 'engine/renderers/BaseRenderer.js';

import {
    getLocalModelMatrix,
    getGlobalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
} from 'engine/core/SceneUtils.js';

import { shaders } from './shaders.js';

export class Renderer extends BaseRenderer {

    constructor(canvas) {
        super(canvas);
    }

    async initialize() {
        const gl = this.gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    getSkyboxPrimitive(skybox) {
        const models = getModels(skybox);
        return models[0].primitives[0];
    }

    render(scene, camera, skybox) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.envmap;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.uniform3fv(uniforms.uCameraPosition,
            mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera)));

        const skyboxPrimitive = this.getSkyboxPrimitive(skybox);
        const skyboxMaterial = skyboxPrimitive.material;

        this.prepareTexture(skyboxMaterial.baseTexture);
        const skyboxTexture = this.prepareImage(skyboxMaterial.baseTexture.image);
        const skyboxSampler = this.prepareSampler(skyboxMaterial.baseTexture.sampler);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(uniforms.uEnvmap, 1);
        gl.bindTexture(gl.TEXTURE_2D, skyboxTexture);
        gl.bindSampler(1, skyboxSampler);

        this.renderNode(scene);
        this.renderSkybox(skybox, camera);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { uniforms } = this.programs.envmap;

        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const { uniforms } = this.programs.envmap;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;

        const baseTexture = this.prepareImage(material.baseTexture.image);
        const baseSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.bindSampler(0, baseSampler);

        gl.uniform1f(uniforms.uReflectance, material.reflectance);
        gl.uniform1f(uniforms.uTransmittance, material.transmittance);
        gl.uniform1f(uniforms.uIOR, material.ior);
        gl.uniform1f(uniforms.uEffect, material.effect);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
    }

    renderSkybox(skybox, camera) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.skybox;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        const skyboxPrimitive = this.getSkyboxPrimitive(skybox);
        const skyboxMaterial = skyboxPrimitive.material;

        this.prepareTexture(skyboxMaterial.baseTexture);
        const skyboxTexture = this.prepareImage(skyboxMaterial.baseTexture.image);
        const skyboxSampler = this.prepareSampler(skyboxMaterial.baseTexture.sampler);

        const vao = this.prepareMesh(skyboxPrimitive.mesh);
        gl.bindVertexArray(vao);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(uniforms.uEnvmap, 1);
        gl.bindTexture(gl.TEXTURE_2D, skyboxTexture);
        gl.bindSampler(1, skyboxSampler);

        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);
        gl.drawElements(gl.TRIANGLES, skyboxPrimitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
        gl.enable(gl.CULL_FACE);
        gl.depthFunc(gl.LESS);
    }

}
