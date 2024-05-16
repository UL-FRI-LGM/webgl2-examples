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

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.uniform3fv(uniforms.uCameraPosition,
            mat4.getTranslation(vec3.create(), getGlobalModelMatrix(camera)));

        const lightComponent = light.getComponentOfType(Light);

        gl.uniform3fv(uniforms.uLight.color,
            vec3.scale(vec3.create(), lightComponent.color, lightComponent.intensity / 255));
        gl.uniform3fv(uniforms.uLight.position,
            mat4.getTranslation(vec3.create(), getGlobalModelMatrix(light)));
        gl.uniform3fv(uniforms.uLight.attenuation, lightComponent.attenuation);

        this.renderNode(scene);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { uniforms } = this.currentProgram;

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

        const { program, uniforms } = this.currentProgram;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);

        this.prepareTexture(material.baseTexture);
        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.uniform1f(uniforms.uMaterial.diffuse, material.diffuse);
        gl.uniform1f(uniforms.uMaterial.specular, material.specular);
        gl.uniform1f(uniforms.uMaterial.shininess, material.shininess);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
    }

}
