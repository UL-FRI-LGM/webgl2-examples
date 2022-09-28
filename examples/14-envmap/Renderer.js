import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    render(scene, camera, skybox) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.envmap;
        gl.useProgram(program);

        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projection);
        gl.uniform3fv(uniforms.uCameraPosition,
            mat4.getTranslation(vec3.create(), camera.globalMatrix));

        this.renderNode(scene, scene.globalMatrix);
        this.renderSkybox(skybox, camera);
    }

    renderNode(node, modelMatrix) {
        const gl = this.gl;

        modelMatrix = mat4.clone(modelMatrix);
        mat4.mul(modelMatrix, modelMatrix, node.localMatrix);

        const { uniforms } = this.programs.envmap;

        if (node.model && node.material) {
            gl.bindVertexArray(node.model.vao);

            gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);

            gl.activeTexture(gl.TEXTURE0);
            gl.uniform1i(uniforms.uTexture, 0);
            gl.bindTexture(gl.TEXTURE_2D, node.material.texture);

            gl.activeTexture(gl.TEXTURE1);
            gl.uniform1i(uniforms.uEnvmap, 1);
            gl.bindTexture(gl.TEXTURE_2D, node.material.envmap);

            gl.uniform1f(uniforms.uReflectance, node.material.reflectance);
            gl.uniform1f(uniforms.uTransmittance, node.material.transmittance);
            gl.uniform1f(uniforms.uIOR, node.material.ior);
            gl.uniform1f(uniforms.uEffect, node.material.effect);

            gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
        }

        for (const child of node.children) {
            this.renderNode(child, modelMatrix);
        }
    }

    renderSkybox(skybox, camera) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.skybox;
        gl.useProgram(program);

        const viewMatrix = camera.globalMatrix;
        mat4.invert(viewMatrix, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, camera.projection);

        gl.bindVertexArray(skybox.model.vao);

        gl.activeTexture(gl.TEXTURE1);
        gl.uniform1i(uniforms.uEnvmap, 1);
        gl.bindTexture(gl.TEXTURE_2D, skybox.material.envmap);

        gl.depthFunc(gl.LEQUAL);
        gl.disable(gl.CULL_FACE);
        gl.drawElements(gl.TRIANGLES, skybox.model.indices, gl.UNSIGNED_SHORT, 0);
        gl.enable(gl.CULL_FACE);
        gl.depthFunc(gl.LESS);
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

    async loadModel(url) {
        const response = await fetch(url);
        const json = await response.json();
        return this.createModel(json);
    }

    async loadTexture(url, options) {
        const response = await fetch(url);
        const blob = await response.blob();
        const image = await createImageBitmap(blob);
        const spec = Object.assign({ image }, options);
        return WebGL.createTexture(this.gl, spec);
    }

}
