import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import { WebGL } from '../../../common/engine/WebGL.js';

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

    render(scene, camera) {
        this.renderGeometry(scene, camera);
        this.renderBright();
        this.renderBloom();
        this.renderToCanvas();
    }

    resize(width, height) {
        this.createGeometryBuffer();
        this.createBloomBuffers();
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

        const matrix = mat4.create();
        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(matrix, camera.projectionMatrix, viewMatrix);

        gl.uniform1f(uniforms.uEmissionStrength, this.emissionStrength);
        gl.uniform1f(uniforms.uExposure, this.preExposure);

        for (const node of scene.children) {
            this.renderNode(node, matrix, uniforms);
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

        gl.uniform1f(uniforms.uExposure, this.postExposure);
        gl.uniform1f(uniforms.uGamma, this.gamma);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderNode(node, matrix, uniforms) {
        const gl = this.gl;

        matrix = mat4.clone(matrix);
        mat4.mul(matrix, matrix, node.localMatrix);

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
