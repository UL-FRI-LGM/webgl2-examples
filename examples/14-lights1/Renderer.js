import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(0.85, 0.98, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.defaultTexture = WebGL.createTexture(gl, {
            data   : new Uint8Array([255, 255, 255, 255]),
            width  : 1,
            height : 1,
        });

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    render(scene, camera, light) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.phong;
        gl.useProgram(program.program);

        const defaultTexture = this.defaultTexture;
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.uTexture, 0);

        const matrix = mat4.create();
        const matrixStack = [];

        const viewMatrix = camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);

        gl.uniform1f(program.uniforms.uAmbient, light.ambient);
        gl.uniform1f(program.uniforms.uDiffuse, light.diffuse);
        gl.uniform1f(program.uniforms.uSpecular, light.specular);
        gl.uniform1f(program.uniforms.uShininess, light.shininess);
        gl.uniform3fv(program.uniforms.uLightPosition, light.position);
        gl.uniform3fv(program.uniforms.uLightAttenuation, light.attenuatuion);
        gl.uniform3fv(program.uniforms.uLightColor,
            vec3.scale(vec3.create(), light.color, 1 / 255));

        scene.traverse(
            node => {
                matrixStack.push(mat4.clone(matrix));
                mat4.mul(matrix, matrix, node.matrix);
                if (node.model) {
                    gl.bindVertexArray(node.model.vao);
                    gl.uniformMatrix4fv(program.uniforms.uViewModel, false, matrix);
                    const texture = node.texture || defaultTexture;
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
                }
            },
            node => {
                mat4.copy(matrix, matrixStack.pop());
            }
        );
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

    loadTexture(url, options, handler) {
        const gl = this.gl;

        const image = new Image();
        image.addEventListener('load', () => {
            const opts = Object.assign({ image }, options);
            handler(WebGL.createTexture(gl, opts));
        });
        image.src = url;
    }

}
