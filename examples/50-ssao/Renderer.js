import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        gl.getExtension('EXT_color_buffer_float');

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.colorEnabled = true;
        this.occlusionEnabled = true;
        this.occlusionStrength = 2;
        this.occlusionSampleCount = 32;
        this.occlusionScale = 0.5;
        this.occlusionRange = 1;
        this.depthBias = 0.2;

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

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderGeometryBuffer;
        gl.useProgram(program);

        const matrix = mat4.create();
        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjection, false, camera.projection);

        for (const node of scene.children) {
            this.renderNode(node, matrix, uniforms);
        }
    }

    renderSSAO(camera) {
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.ssaoBuffer.framebuffer);

        const { program, uniforms } = this.programs.ssao;
        gl.useProgram(program);

        gl.uniformMatrix4fv(uniforms.uProjection, false, camera.projection);
        gl.uniform1i(uniforms.uOcclusionSampleCount, this.occlusionSampleCount);
        gl.uniform1f(uniforms.uOcclusionScale, this.occlusionScale);
        gl.uniform1f(uniforms.uOcclusionRange, this.occlusionRange);
        gl.uniform1f(uniforms.uDepthBias, this.depthBias);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.ssaoSamples);
        gl.uniform1i(uniforms.uOcclusionSamples, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.positionTexture);
        gl.uniform1i(uniforms.uPosition, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.normalTexture);
        gl.uniform1i(uniforms.uNormal, 2);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderToCanvas() {
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        const { program, uniforms } = this.programs.renderToCanvas;
        gl.useProgram(program);

        gl.uniform1f(uniforms.uOcclusionStrength, this.occlusionStrength);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.colorEnabled ? this.geometryBuffer.colorTexture : this.noColor);
        gl.uniform1i(uniforms.uColor, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.occlusionEnabled ? this.ssaoBuffer.texture : this.noOcclusion);
        gl.uniform1i(uniforms.uAmbient, 1);

        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.normalTexture);
        gl.uniform1i(uniforms.uNormal, 2);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderNode(node, matrix, uniforms) {
        const gl = this.gl;

        matrix = mat4.clone(matrix);
        mat4.mul(matrix, matrix, node.localMatrix);

        if (node.mesh) {
            gl.bindVertexArray(node.mesh.vao);
            gl.uniformMatrix4fv(uniforms.uViewModel, false, matrix);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, node.texture);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.drawElements(gl.TRIANGLES, node.mesh.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, matrix, uniforms);
        }
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

    createModel(model) {
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
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(model.normals), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0);

        const indices = model.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

        return { vao, indices };
    }

    createTexture(texture) {
        const gl = this.gl;
        return WebGL.createTexture(gl, {
            image : texture,
            min   : gl.NEAREST,
            mag   : gl.NEAREST
        });
    }

}
