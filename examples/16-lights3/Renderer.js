import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import * as WebGL from './WebGL.js';
import { shaders } from './shaders.js';
import { Light } from './Light.js';

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

    render(scene, camera) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.phong;
        gl.useProgram(program.program);

        const defaultTexture = this.defaultTexture;
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.uTexture, 0);

        let matrix = mat4.create();
        let matrixStack = [];

        const viewMatrix = camera.getGlobalTransform();
        mat4.invert(viewMatrix, viewMatrix);
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);

        let lightCounter = 0;

        scene.traverse(
            node => {
                matrixStack.push(mat4.clone(matrix));
                mat4.mul(matrix, matrix, node.transform);
                if (node.model) {
                    gl.bindVertexArray(node.model.vao);
                    gl.uniformMatrix4fv(program.uniforms.uViewModel, false, matrix);
                    const texture = node.texture || defaultTexture;
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
                } else if (node instanceof Light) {
                    let color = vec3.clone(node.ambientColor);
                    vec3.scale(color, color, 1.0 / 255.0);
                    gl.uniform3fv(program.uniforms['uAmbientColor[' + lightCounter + ']'], color);
                    color = vec3.clone(node.diffuseColor);
                    vec3.scale(color, color, 1.0 / 255.0);
                    gl.uniform3fv(program.uniforms['uDiffuseColor[' + lightCounter + ']'], color);
                    color = vec3.clone(node.specularColor);
                    vec3.scale(color, color, 1.0 / 255.0);
                    gl.uniform3fv(program.uniforms['uSpecularColor[' + lightCounter + ']'], color);
                    let position = [0,0,0];
                    mat4.getTranslation(position, node.transform);

                    gl.uniform3fv(program.uniforms['uLightPosition[' + lightCounter + ']'], position);
                    gl.uniform1f(program.uniforms['uShininess[' + lightCounter + ']'], node.shininess);
                    gl.uniform3fv(program.uniforms['uLightAttenuation[' + lightCounter + ']'], node.attenuatuion);
                    lightCounter++;
                }
            },
            node => {
                matrix = matrixStack.pop();
            }
        );
    }

    createModel(model) {
        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, model.vertices, gl.STATIC_DRAW);

        const indices = model.indices.length;
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.indices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.enableVertexAttribArray(1);
        gl.enableVertexAttribArray(2);

        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);

        return { vao, indices };
    }

    loadTexture(url, options, handler) {
        const gl = this.gl;

        let image = new Image();
        image.addEventListener('load', () => {
            const opts = Object.assign({ image }, options);
            handler(WebGL.createTexture(gl, opts));
        });
        image.src = url;
    }

}
