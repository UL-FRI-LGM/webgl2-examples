import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

const mat4 = glMatrix.mat4;

export default class Renderer {

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

    prepare(scene) {
        // TODO traverse scene, create GL objects
        // (??? transforms, projection matrices ???)
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.simple;
        gl.useProgram(program.program);

        const defaultTexture = this.defaultTexture;
        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(program.uniforms.uTexture, 0);

        let matrix = mat4.create();
        let matrixStack = [];

        const viewMatrix = this.getGlobalTransform(camera);
        mat4.invert(viewMatrix, viewMatrix);
        mat4.copy(matrix, viewMatrix);
        gl.uniformMatrix4fv(program.uniforms.uProjection, false, camera.projection);

        gl.uniform1f(program.uniforms.uEmissive, 0.2);
        gl.uniform1f(program.uniforms.uDiffuse, 0.8);
        gl.uniform1f(program.uniforms.uSpecular, 2);
        gl.uniform1f(program.uniforms.uShininess, 10);
        gl.uniform3f(program.uniforms.uLightPosition, 2, 5, 3);
        gl.uniform3f(program.uniforms.uLightColor, 1, 1, 1);
        gl.uniform3f(program.uniforms.uLightAttenuation, 1.0, 0, 0.02);

        scene.traverse(
            (node) => {
                matrixStack.push(mat4.clone(matrix));
                mat4.mul(matrix, matrix, node.transform);
                if (node.model) {
                    gl.bindVertexArray(node.model.vao);
                    gl.uniformMatrix4fv(program.uniforms.uViewModel, false, matrix);
                    const texture = node.texture || defaultTexture;
                    gl.bindTexture(gl.TEXTURE_2D, texture);
                    gl.drawElements(gl.TRIANGLES, node.model.indices, gl.UNSIGNED_SHORT, 0);
                }
            },
            (node) => {
                matrix = matrixStack.pop();
            }
        );
    }

    getGlobalTransform(node) {
        if (!node.parent) {
            return mat4.clone(node.transform);
        } else {
            let transform = this.getGlobalTransform(node.parent);
            return mat4.mul(transform, transform, node.transform);
        }
    }

    updateTransforms(scene) {
        scene.nodes.forEach(node => {
            node.traverse(node => {
                // update node.transform from TRS
                // update node.projection for cameras
            });
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
