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

        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('OES_texture_float_linear');

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.emissionStrength = 10;
        this.preExposure = 1;
        this.postExposure = 1;
        this.gamma = 2.2;

        this.bloomThreshold = 1.5;
        this.bloomKnee = 0.9;
        this.bloomIntensity = 0.7;
        this.bloomBuffers = [];

        this.createGeometryBuffer();
    }

    resize(width, height) {
        this.createGeometryBuffer();
        this.createBloomBuffers();
    }

    render(scene, camera) {
        this.renderGeometry(scene, camera);
        this.renderBright();
        this.renderBloom();
        this.renderToCanvas();
    }

    renderGeometry(scene, camera) {
        const gl = this.gl;

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.geometryBuffer.framebuffer);
        gl.viewport(0, 0, size.width, size.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderGeometryBuffer;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.uniform1f(uniforms.uEmissionStrength, this.emissionStrength);
        gl.uniform1f(uniforms.uExposure, this.preExposure);

        for (const node of scene.children) {
            this.renderNode(node);
        }
    }

    renderBright() {
        const gl = this.gl;

        const { framebuffer, size } = this.bloomBuffers[0];
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, size.width, size.height);

        const { program, uniforms } = this.programs.renderBright;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.colorTexture);
        gl.uniform1i(uniforms.uColor, 0);
        gl.bindSampler(0, null);

        gl.uniform1f(uniforms.uBloomThreshold, this.bloomThreshold);
        gl.uniform1f(uniforms.uBloomKnee, this.bloomKnee);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderBloom() {
        const gl = this.gl;

        const levels = this.bloomBuffers.length;

        for (let i = 1; i < levels; i++) {
            const { framebuffer, size } = this.bloomBuffers[i];

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.viewport(0, 0, size.width, size.height);

            const { program, uniforms } = this.programs.downsampleAndBlur;
            gl.useProgram(program);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.bloomBuffers[i - 1].texture);
            gl.uniform1i(uniforms.uColor, 0);
            gl.bindSampler(0, null);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        gl.enable(gl.BLEND);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE, gl.ONE, gl.ZERO);

        for (let i = levels - 2; i >= 0; i--) {
            const { framebuffer, size } = this.bloomBuffers[i];

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.viewport(0, 0, size.width, size.height);

            const { program, uniforms } = this.programs.upsampleAndCombine;
            gl.useProgram(program);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.bloomBuffers[i + 1].texture);
            gl.uniform1i(uniforms.uColor, 0);
            gl.bindSampler(0, null);

            gl.uniform1f(uniforms.uBloomIntensity, this.bloomIntensity);

            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ONE, gl.ZERO);

        const { framebuffer, size } = this.bloomBuffers[0];

        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, size.width, size.height);

        const { program, uniforms } = this.programs.upsampleAndCombine;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.colorTexture);
        gl.uniform1i(uniforms.uColor, 0);
        gl.bindSampler(0, null);

        gl.uniform1f(uniforms.uBloomIntensity, 1);

        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.disable(gl.BLEND);
    }

    renderToCanvas() {
        const gl = this.gl;

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, size.width, size.height);

        const { program, uniforms } = this.programs.renderToCanvas;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.bloomBuffers[0].texture);
        gl.uniform1i(uniforms.uColor, 0);
        gl.bindSampler(0, null);

        gl.uniform1f(uniforms.uExposure, this.postExposure);
        gl.uniform1f(uniforms.uGamma, this.gamma);

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

        this.prepareTexture(material.emissionTexture);
        const emissionTexture = this.prepareImage(material.emissionTexture.image);
        const emissionSampler = this.prepareSampler(material.emissionTexture.sampler);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);
        gl.bindTexture(gl.TEXTURE_2D, baseTexture);
        gl.bindSampler(0, baseSampler);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(uniforms.uEmissionTexture, 1);
        gl.bindTexture(gl.TEXTURE_2D, emissionTexture);
        gl.bindSampler(1, emissionSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
    }

    createGeometryBuffer() {
        const gl = this.gl;

        if (this.geometryBuffer) {
            gl.deleteFramebuffer(this.geometryBuffer.framebuffer);
            gl.deleteRenderbuffer(this.geometryBuffer.depthBuffer);
            gl.deleteTexture(this.geometryBuffer.colorTexture);
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
            format: gl.RGBA,
            iformat: gl.RGBA16F,
            type: gl.FLOAT,
        });

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorTexture, 0);

        gl.drawBuffers([
            gl.COLOR_ATTACHMENT0,
        ]);

        this.geometryBuffer = {
            framebuffer,
            depthBuffer,
            colorTexture,
        };
    }

    createBloomBuffers() {
        const gl = this.gl;

        for (const buffer of this.bloomBuffers) {
            gl.deleteFramebuffer(buffer.framebuffer);
            gl.deleteTexture(buffer.texture);
        }

        const sampling = {
            min: gl.LINEAR,
            mag: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        };

        const format = {
            format: gl.RGBA,
            iformat: gl.RGBA16F,
            type: gl.FLOAT,
        };

        function numberOfLevels(width, height) {
            return Math.ceil(Math.log2(Math.max(width, height)));
        }

        function sizeAtLevel(level, baseWidth, baseHeight) {
            return {
                width: Math.max(1, Math.floor(baseWidth / (2 ** level))),
                height: Math.max(1, Math.floor(baseHeight / (2 ** level))),
            };
        }

        const levels = numberOfLevels(gl.drawingBufferWidth, gl.drawingBufferHeight);
        this.bloomBuffers = new Array(levels).fill(0).map((_, level) => {
            const size = sizeAtLevel(level, gl.drawingBufferWidth, gl.drawingBufferHeight);

            const texture = WebGL.createTexture(gl, {
                ...size,
                ...sampling,
                ...format,
            });

            const framebuffer = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

            return {
                texture,
                framebuffer,
                size,
            };
        });
    }

}
