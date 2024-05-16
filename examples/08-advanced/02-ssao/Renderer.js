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

        gl.getExtension('EXT_color_buffer_float');

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.colorEnabled = true;
        this.occlusionEnabled = true;
        this.occlusionStrength = 3;
        this.occlusionSampleCount = 32;
        this.occlusionScale = 0.5;
        this.occlusionRange = 1;
        this.depthBias = 0.01;

        this.noOcclusion = WebGL.createTexture(gl, {
            width: 1,
            height: 1,
            data: new Uint8Array([255]),
            format: gl.RED,
            iformat: gl.R8,
            type: gl.UNSIGNED_BYTE,
            min: gl.LINEAR,
            mag: gl.LINEAR,
        });

        this.noColor = WebGL.createTexture(gl, {
            width: 1,
            height: 1,
            data: new Uint8Array([255, 255, 255, 255]),
            format: gl.RGBA,
            iformat: gl.RGBA,
            type: gl.UNSIGNED_BYTE,
            min: gl.NEAREST,
            mag: gl.NEAREST,
        });

        this.createGeometryBuffer();
        this.createSSAOBuffer();
        this.createSSAOSamples();
    }

    resize(width, height) {
        this.createGeometryBuffer();
        this.createSSAOBuffer();
    }

    render(scene, camera) {
        this.renderGeometryBuffer(scene, camera);
        this.renderSSAO(camera);
        this.renderToCanvas();
    }

    renderGeometryBuffer(scene, camera) {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.geometryBuffer.framebuffer);

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderGeometryBuffer;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        for (const node of scene.children) {
            this.renderNode(node);
        }
    }

    renderSSAO(camera) {
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.ssaoBuffer.framebuffer);

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        const { program, uniforms } = this.programs.ssao;
        gl.useProgram(program);

        const projectionMatrix = getProjectionMatrix(camera);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.uniform1i(uniforms.uOcclusionSampleCount, this.occlusionSampleCount);
        gl.uniform1f(uniforms.uOcclusionScale, this.occlusionScale);
        gl.uniform1f(uniforms.uOcclusionRange, this.occlusionRange);
        gl.uniform1f(uniforms.uDepthBias, this.depthBias);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.ssaoSamples);
        gl.uniform1i(uniforms.uOcclusionSamples, 0);
        gl.bindSampler(0, null);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.positionTexture);
        gl.uniform1i(uniforms.uPosition, 1);
        gl.bindSampler(1, null);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.normalTexture);
        gl.uniform1i(uniforms.uNormal, 2);
        gl.bindSampler(2, null);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderToCanvas() {
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

        const { program, uniforms } = this.programs.renderToCanvas;
        gl.useProgram(program);

        gl.uniform1f(uniforms.uOcclusionStrength, this.occlusionStrength);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.colorEnabled ? this.geometryBuffer.colorTexture : this.noColor);
        gl.uniform1i(uniforms.uColor, 0);
        gl.bindSampler(0, null);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.occlusionEnabled ? this.ssaoBuffer.texture : this.noOcclusion);
        gl.uniform1i(uniforms.uAmbient, 1);
        gl.bindSampler(1, null);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.normalTexture);
        gl.uniform1i(uniforms.uNormal, 2);
        gl.bindSampler(2, null);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { uniforms } = this.programs.renderGeometryBuffer;

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

        const { uniforms } = this.programs.renderGeometryBuffer;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);

        this.prepareTexture(material.baseTexture);
        const baseTexture = this.prepareImage(material.baseTexture.image);
        const baseSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.bindSampler(0, baseSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
    }

    createGeometryBuffer() {
        const gl = this.gl;

        if (this.geometryBuffer) {
            gl.deleteFramebuffer(this.geometryBuffer.framebuffer);
            gl.deleteRenderbuffer(this.geometryBuffer.depthBuffer);
            gl.deleteTexture(this.geometryBuffer.colorTexture);
            gl.deleteTexture(this.geometryBuffer.positionTexture);
            gl.deleteTexture(this.geometryBuffer.normalTexture);
        }

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
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

        const colorTexture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
        });

        const positionTexture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            format: gl.RGBA,
            iformat: gl.RGBA16F,
            type: gl.FLOAT,
        });

        const normalTexture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            format: gl.RGBA,
            iformat: gl.RGBA16F,
            type: gl.FLOAT,
        });

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, positionTexture, 0);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, normalTexture, 0);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
            gl.COLOR_ATTACHMENT1,
            gl.COLOR_ATTACHMENT2,
        ]);

        this.geometryBuffer = {
            framebuffer,
            depthBuffer,
            colorTexture,
            positionTexture,
            normalTexture,
        };
    }

    createSSAOBuffer() {
        const gl = this.gl;

        if (this.ssaoBuffer) {
            gl.deleteFramebuffer(this.ssaoBuffer.framebuffer);
            gl.deleteTexture(this.ssaoBuffer.texture);
        }

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        const sampling = {
            min: gl.LINEAR,
            mag: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        };

        const texture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            format: gl.RED,
            iformat: gl.R8,
            type: gl.UNSIGNED_BYTE,
        });

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
        ]);

        this.ssaoBuffer = {
            framebuffer,
            texture,
        };
    }

    createSSAOSamples() {
        const gl = this.gl;

        const samples = new Float32Array(this.occlusionSampleCount * 4);
        const sample = vec3.create();
        for (let i = 0; i < this.occlusionSampleCount; i++) {
            const length = Math.random();
            vec3.random(sample, length);
            samples[i * 4 + 0] = sample[0];
            samples[i * 4 + 1] = sample[1];
            samples[i * 4 + 2] = Math.abs(sample[2]);
            samples[i * 4 + 3] = 1;
        }

        const texture = WebGL.createTexture(gl, {
            width: this.occlusionSampleCount,
            height: 1,
            format: gl.RGBA,
            iformat: gl.RGBA16F,
            type: gl.FLOAT,
            data: samples,
            min: gl.LINEAR,
            mag: gl.LINEAR,
        });

        this.ssaoSamples = texture;
    }

}
