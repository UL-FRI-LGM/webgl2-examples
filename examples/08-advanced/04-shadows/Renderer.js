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

        this.shadowMapSize = 1024;

        this.createShadowBuffer();
    }

    resize(width, height) {
        this.createShadowBuffer();
    }

    render(scene, camera, shadowCamera) {
        this.renderShadows(scene, shadowCamera);
        this.renderGeometry(scene, camera, shadowCamera);
    }

    renderShadows(scene, shadowCamera) {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.FRONT);

        const size = {
            width: this.shadowMapSize,
            height: this.shadowMapSize,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowBuffer.framebuffer);
        gl.viewport(0, 0, size.width, size.height);

        gl.clear(gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderShadows;
        gl.useProgram(program);

        const lightTransformMatrix = getGlobalViewMatrix(shadowCamera);
        const lightProjectionMatrix = getProjectionMatrix(shadowCamera);
        const lightMatrix = mat4.mul(mat4.create(),
            lightProjectionMatrix, lightTransformMatrix);
        gl.uniformMatrix4fv(uniforms.uLightMatrix, false, lightMatrix);

        const modelMatrix = mat4.create();
        for (const node of scene.children) {
            this.renderNode(node, modelMatrix, uniforms);
        }
    }

    renderGeometry(scene, camera, shadowCamera) {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, size.width, size.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderGeometry;
        gl.useProgram(program);

        const cameraTransformMatrix = getGlobalViewMatrix(camera);
        const cameraProjectionMatrix = getProjectionMatrix(camera);
        const cameraMatrix = mat4.mul(mat4.create(),
            cameraProjectionMatrix, cameraTransformMatrix);
        gl.uniformMatrix4fv(uniforms.uCameraMatrix, false, cameraMatrix);

        const lightTransformMatrix = getGlobalViewMatrix(shadowCamera);
        const lightProjectionMatrix = getProjectionMatrix(shadowCamera);
        const lightMatrix = mat4.mul(mat4.create(),
            lightProjectionMatrix, lightTransformMatrix);
        gl.uniformMatrix4fv(uniforms.uLightMatrix, false, lightMatrix);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.shadowBuffer.depthTexture);
        gl.uniform1i(uniforms.uDepth, 1);

        const modelMatrix = mat4.create();
        for (const node of scene.children) {
            this.renderNode(node, modelMatrix, uniforms);
        }
    }

    renderNode(node, modelMatrix, uniforms) {
        const gl = this.gl;

        const localMatrix = getLocalModelMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

        const models = getModels(node);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive, uniforms);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix, uniforms);
        }
    }

    renderPrimitive(primitive, uniforms) {
        const gl = this.gl;

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

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
    }

    createShadowBuffer() {
        const gl = this.gl;

        if (this.shadowBuffer) {
            gl.deleteFramebuffer(this.shadowBuffer.framebuffer);
            gl.deleteTexture(this.shadowBuffer.depthTexture);
        }

        const size = {
            width: this.shadowMapSize,
            height: this.shadowMapSize,
        };

        const sampling = {
            min: gl.LINEAR,
            mag: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        };

        const depthBuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, size.width, size.height);

        const depthTexture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            format: gl.DEPTH_STENCIL,
            iformat: gl.DEPTH24_STENCIL8,
            type: gl.UNSIGNED_INT_24_8,
        });
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE);

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, depthTexture, 0);

        gl.drawBuffers([]);

        this.shadowBuffer = {
            framebuffer,
            depthTexture,
        };
    }

}
