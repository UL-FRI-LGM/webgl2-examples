import * as WebGL from './WebGL.js';
import shaders from './shaders.js';

const mat4 = glMatrix.mat4;

export default class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.programs = WebGL.buildPrograms(gl, shaders);
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const program = this.programs.simple;
        gl.useProgram(program.program);

        let mvpMatrix = mat4.create();
        let mvpStack = [];
        const mvpLocation = program.uniforms.uModelViewProjection;
        const viewMatrix = mat4.clone(camera.transform);
        let parent = camera.parent;
        while (parent) {
            mat4.mul(viewMatrix, parent.transform, viewMatrix);
            parent = parent.parent;
        }
        mat4.invert(viewMatrix, viewMatrix);
        mat4.mul(mvpMatrix, camera.camera.matrix, viewMatrix);

        function useMaterial(material) {
            const pbr = material.pbrMetallicRoughness;
            if (pbr) {
                if (pbr.baseColorTexture) {
                    const texture = pbr.baseColorTexture.texture;
                    gl.activeTexture(gl.TEXTURE0);
                    gl.bindTexture(gl.TEXTURE_2D, texture.textureObject);
                    gl.bindSampler(0, texture.sampler.samplerObject);
                    gl.uniform1i(program.uniforms.uBaseColorTexture, 0);
                }
            }
        }

        function renderNode(node) {
            mvpStack.push(mat4.clone(mvpMatrix));
            mat4.mul(mvpMatrix, mvpMatrix, node.transform);
            if (node.mesh) {
                for (let primitive of node.mesh.primitives) {
                    gl.bindVertexArray(primitive.vao);
                    gl.uniformMatrix4fv(mvpLocation, false, mvpMatrix);
                    useMaterial(primitive.material);
                    if (primitive.indices) {
                        const mode = primitive.mode;
                        const count = primitive.indices.count;
                        const type = primitive.indices.componentType;
                        gl.drawElements(mode, count, type, 0);
                    } else {
                        const mode = primitive.mode;
                        const count = primitive.attributes.POSITION.count;
                        gl.drawArrays(mode, 0, count);
                    }
                }
            }
            for (let child of node.children) {
                renderNode(child);
            }
            mvpMatrix = mvpStack.pop();
        }

        for (let node of scene.nodes) {
            renderNode(node);
        }
    }

}
