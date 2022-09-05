import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);

        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('OES_texture_float_linear');

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.emissionStrength = 5;
        this.bloomThreshold = 1;
        this.bloomStepWidth = 1;
        this.exposure = 1;
        this.bloomResolutionDivider = 4;

        this.createGeometryBuffer();
        this.createBloomBuffer();
        this.createBlurBuffer();
        this.createClipQuad();
    }

    render(scene, camera) {
        this.renderGeometry(scene, camera);
        this.renderBloom();
        this.renderBlur();
        this.renderToCanvas();
    }

    renderGeometry(scene, camera) {
        const gl = this.gl;

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.geometryBuffer.framebuffer);
        gl.viewport(0, 0, size.width, size.height);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.renderGeometryBuffer;
        gl.useProgram(program);

        const matrix = mat4.create();
        const viewMatrix = camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(matrix, camera.projection, viewMatrix);

        gl.uniform1f(uniforms.uEmissionStrength, this.emissionStrength);

        for (const node of scene.nodes) {
            this.renderNode(node, matrix, uniforms);
        }
    }

    renderBloom() {
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        const size = {
            width: Math.floor(gl.drawingBufferWidth / this.bloomResolutionDivider),
            height: Math.floor(gl.drawingBufferHeight / this.bloomResolutionDivider),
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.bloomBuffer.framebuffer);
        gl.viewport(0, 0, size.width, size.height);

        const { program, uniforms } = this.programs.renderBloom;
        gl.useProgram(program);

        gl.uniform1f(uniforms.uBloomThreshold, this.bloomThreshold);
        gl.uniform1f(uniforms.uBloomStepWidth, this.bloomStepWidth);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.colorTexture);
        gl.uniform1i(uniforms.uColor, 0);

        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindVertexArray(this.clipQuad.vao);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    renderBlur() {
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        const size = {
            width: Math.floor(gl.drawingBufferWidth / this.bloomResolutionDivider),
            height: Math.floor(gl.drawingBufferHeight / this.bloomResolutionDivider),
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurBuffer.writeFramebuffer);
        gl.viewport(0, 0, size.width, size.height);

        const { program, uniforms } = this.programs.renderBlur;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.bloomBuffer.texture);
        gl.uniform1i(uniforms.uColor, 0);

        gl.uniform2f(uniforms.uDirection, 1 / size.width, 0);

        gl.bindVertexArray(this.clipQuad.vao);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurBuffer.readFramebuffer);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.blurBuffer.writeTexture);
        gl.uniform1i(uniforms.uColor, 0);

        gl.uniform2f(uniforms.uDirection, 0, 1 / size.height);

        gl.bindVertexArray(this.clipQuad.vao);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

        for (let i = 0; i < 2; i++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurBuffer.writeFramebuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.blurBuffer.readTexture);
            gl.uniform1i(uniforms.uColor, 0);

            gl.uniform2f(uniforms.uDirection, 1 / size.width, 0);

            gl.bindVertexArray(this.clipQuad.vao);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

            gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurBuffer.readFramebuffer);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.blurBuffer.writeTexture);
            gl.uniform1i(uniforms.uColor, 0);

            gl.uniform2f(uniforms.uDirection, 0, 1 / size.height);

            gl.bindVertexArray(this.clipQuad.vao);
            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        }
    }

    renderToCanvas() {
        const gl = this.gl;

        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.CULL_FACE);

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, size.width, size.height);

        const { program, uniforms } = this.programs.renderToCanvas;
        gl.useProgram(program);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.geometryBuffer.colorTexture);
        gl.uniform1i(uniforms.uColor, 0);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.blurBuffer.readTexture);
        gl.uniform1i(uniforms.uBloom, 1);

        gl.uniform1f(uniforms.uExposure, this.exposure);

        gl.bindVertexArray(this.clipQuad.vao);
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
    }

    renderNode(node, matrix, uniforms) {
        const gl = this.gl;

        matrix = mat4.clone(matrix);
        mat4.mul(matrix, matrix, node.matrix);

        if (node.mesh) {
            gl.bindVertexArray(node.mesh.vao);
            gl.uniformMatrix4fv(uniforms.uProjectionViewModel, false, matrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, node.diffuseTexture);
            gl.uniform1i(uniforms.uDiffuse, 0);

            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, node.emissionTexture);
            gl.uniform1i(uniforms.uEmission, 1);

            gl.drawElements(gl.TRIANGLES, node.mesh.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, matrix, uniforms);
        }
    }

    createClipQuad() {
        const gl = this.gl;

        if (this.clipQuad) {
            gl.deleteVertexArray(this.clipQuad.vao);
            gl.deleteBuffer(this.clipQuad.buffer);
        }

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const buffer = WebGL.createClipQuad(gl);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        this.clipQuad = {
            vao,
            buffer,
        };
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
            min: gl.LINEAR_MIPMAP_LINEAR,
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

    createBloomBuffer() {
        const gl = this.gl;

        if (this.bloomBuffer) {
            gl.deleteFramebuffer(this.bloomBuffer.framebuffer);
            gl.deleteTexture(this.bloomBuffer.texture);
        }

        const size = {
            width: Math.floor(gl.drawingBufferWidth / this.bloomResolutionDivider),
            height: Math.floor(gl.drawingBufferHeight / this.bloomResolutionDivider),
        };

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

        const texture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            ...format,
        });

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        this.bloomBuffer = {
            texture,
            framebuffer,
        };
    }

    createBlurBuffer() {
        const gl = this.gl;

        if (this.blurBuffer) {
            gl.deleteFramebuffer(this.blurBuffer.readFramebuffer);
            gl.deleteFramebuffer(this.blurBuffer.writeFramebuffer);
            gl.deleteTexture(this.blurBuffer.readTexture);
            gl.deleteTexture(this.blurBuffer.writeTexture);
        }

        const size = {
            width: Math.floor(gl.drawingBufferWidth / this.bloomResolutionDivider),
            height: Math.floor(gl.drawingBufferHeight / this.bloomResolutionDivider),
        };

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

        const readTexture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            ...format,
        });

        const readFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, readFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, readTexture, 0);

        const writeTexture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            ...format,
        });

        const writeFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, writeFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, writeTexture, 0);

        this.blurBuffer = {
            readTexture,
            readFramebuffer,
            writeTexture,
            writeFramebuffer,
        };
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
            image   : texture,
            iformat : gl.SRGB8_ALPHA8,
            min     : gl.NEAREST,
            mag     : gl.NEAREST,
        });
    }

}
