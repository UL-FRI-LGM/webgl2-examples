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

import { Light } from './Light.js';

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

    render(scene, camera, light) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.burley;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.uniform3fv(uniforms.uCameraPosition,
            mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera)));

        const lightComponent = light.getComponentOfType(Light);

        gl.uniform3fv(uniforms.uLight.color,
            vec3.scale(vec3.create(), lightComponent.color, 1 / 255));
        gl.uniform3fv(uniforms.uLight.position,
            mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light)));
        gl.uniform3fv(uniforms.uLight.attenuation, lightComponent.attenuation);
        gl.uniform1f(uniforms.uLight.intensity, lightComponent.intensity);

        this.renderNode(scene);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { uniforms } = this.programs.burley;

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

        const { program, uniforms } = this.programs.burley;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;

        this.prepareTexture(material.baseTexture);
        const baseTexture = this.prepareImage(material.baseTexture.image);
        const baseSampler = this.prepareSampler(material.baseTexture.sampler);

        this.prepareTexture(material.metalnessTexture);
        const metalnessTexture = this.prepareImage(material.metalnessTexture.image);
        const metalnessSampler = this.prepareSampler(material.metalnessTexture.sampler);

        this.prepareTexture(material.roughnessTexture);
        const roughnessTexture = this.prepareImage(material.roughnessTexture.image);
        const roughnessSampler = this.prepareSampler(material.roughnessTexture.sampler);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.bindSampler(0, baseSampler);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(uniforms.uMetalnessTexture, 1);
        gl.bindTexture(gl.TEXTURE_2D, metalnessTexture);
        gl.bindSampler(1, metalnessSampler);

        gl.activeTexture(gl.TEXTURE2);
        gl.uniform1i(uniforms.uRoughnessTexture, 2);
        gl.bindTexture(gl.TEXTURE_2D, roughnessTexture);
        gl.bindSampler(2, roughnessSampler);

        gl.uniform3fv(uniforms.uBaseFactor, material.baseFactor.slice(0, 3));
        gl.uniform1f(uniforms.uMetalnessFactor, material.metalnessFactor);
        gl.uniform1f(uniforms.uRoughnessFactor, material.roughnessFactor);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
    }

}
