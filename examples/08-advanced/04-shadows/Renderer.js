import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

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

    getLocalMatrix(node) {
        const transform = node.getComponentOfType(Transform);
        return transform ? transform.matrix : mat4.create();
    }

    getGlobalMatrix(node) {
        const localMatrix = this.getLocalMatrix(node);
        if (!node.parent) {
            return localMatrix;
        } else {
            const globalMatrix = this.getGlobalMatrix(node.parent);
            return mat4.mul(globalMatrix, globalMatrix, localMatrix);
        }
    }

    getViewMatrix(node) {
        const globalMatrix = this.getGlobalMatrix(node);
        return mat4.invert(globalMatrix, globalMatrix);
    }

    getProjectionMatrix(node) {
        const camera = node.getComponentOfType(Camera);
        return camera ? camera.projectionMatrix : mat4.create();
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

        const lightTransformMatrix = this.getViewMatrix(shadowCamera);
        const lightProjectionMatrix = this.getProjectionMatrix(shadowCamera);
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

        const cameraTransformMatrix = this.getViewMatrix(camera);
        const cameraProjectionMatrix = this.getProjectionMatrix(camera);
        const cameraMatrix = mat4.mul(mat4.create(),
            cameraProjectionMatrix, cameraTransformMatrix);
        gl.uniformMatrix4fv(uniforms.uCameraMatrix, false, cameraMatrix);

        const lightTransformMatrix = this.getViewMatrix(shadowCamera);
        const lightProjectionMatrix = this.getProjectionMatrix(shadowCamera);
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

        const localMatrix = this.getLocalMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);

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

}
