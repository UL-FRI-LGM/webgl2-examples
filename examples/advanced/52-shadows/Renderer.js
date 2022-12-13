import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import { WebGL } from '../../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.shadowMapSize = 1024;

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

        const lightMatrix = mat4.create();
        const lightTransformMatrix = shadowCamera.globalMatrix;
        mat4.invert(lightTransformMatrix, lightTransformMatrix);
        mat4.mul(lightMatrix, shadowCamera.projectionMatrix, lightTransformMatrix);
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

        const cameraMatrix = mat4.create();
        const cameraTransformMatrix = camera.globalMatrix;
        mat4.invert(cameraTransformMatrix, cameraTransformMatrix);
        mat4.mul(cameraMatrix, camera.projectionMatrix, cameraTransformMatrix);
        gl.uniformMatrix4fv(uniforms.uCameraMatrix, false, cameraMatrix);

        const lightMatrix = mat4.create();
        const lightTransformMatrix = shadowCamera.globalMatrix;
        mat4.invert(lightTransformMatrix, lightTransformMatrix);
        mat4.mul(lightMatrix, shadowCamera.projectionMatrix, lightTransformMatrix);
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

        modelMatrix = mat4.clone(modelMatrix);
        mat4.mul(modelMatrix, modelMatrix, node.localMatrix);

        if (node.mesh) {
            gl.bindVertexArray(node.mesh.vao);
            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, node.texture);
            gl.uniform1i(uniforms.uTexture, 0);

            gl.drawElements(gl.TRIANGLES, node.mesh.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix, uniforms);
        }
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
            min     : gl.NEAREST,
            mag     : gl.NEAREST,
        });
    }

}
