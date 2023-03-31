import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import { Camera } from '../../../common/engine/core/Camera.js';
import { Transform } from '../../../common/engine/core/Transform.js';

import { Light } from './Light.js';
import { Material } from './Material.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
        this.perFragment = true;
        this.currentProgram = this.perFragment
            ? this.programs.perFragment
            : this.programs.perVertex;
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

    render(scene, camera, light) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.currentProgram;
        gl.useProgram(program);

        const viewMatrix = this.getViewMatrix(camera);
        const projectionMatrix = this.getProjectionMatrix(camera);

        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);

        gl.uniform3fv(uniforms.uCameraPosition,
            mat4.getTranslation(vec3.create(), this.getGlobalMatrix(camera)));

        const lightComponent = light.getComponentOfType(Light);

        gl.uniform3fv(uniforms.uLight.color,
            vec3.scale(vec3.create(), lightComponent.color, lightComponent.intensity / 255));
        gl.uniform3fv(uniforms.uLight.position,
            mat4.getTranslation(vec3.create(), this.getGlobalMatrix(light)));
        gl.uniform3fv(uniforms.uLight.attenuation, lightComponent.attenuation);

        this.renderNode(scene);
    }

    renderNode(node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const localMatrix = this.getLocalMatrix(node);
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);

        const { uniforms } = this.currentProgram;

        const material = node.getComponentOfType(Material);

        if (node.mesh && material) {
            gl.bindVertexArray(node.mesh.vao);

            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, material.texture);

            gl.uniform1f(uniforms.uMaterial.diffuse, material.diffuse);
            gl.uniform1f(uniforms.uMaterial.specular, material.specular);
            gl.uniform1f(uniforms.uMaterial.shininess, material.shininess);

            gl.drawElements(gl.TRIANGLES, node.mesh.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

}
