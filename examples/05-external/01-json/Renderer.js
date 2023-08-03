import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import {
    Camera,
    Material,
    Mesh,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from '../../../common/engine/core.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from '../../../common/engine/core/SceneUtils.js';

import { shaders } from './shaders.js';

const vertexBufferLayout = [
    {
        // position
        location: 0,
        count: 3,
        type: 0x1406, // gl.FLOAT
        offset: 0,
        stride: 20,
    },
    {
        // texcoords
        location: 3,
        count: 2,
        type: 0x1406, // gl.FLOAT
        offset: 12,
        stride: 20,
    },
];

// TODO: generalize vertex/index buffer creation
function createMeshArrayBuffers(mesh) {
    const vertexBufferStride = 20;
    const vertexBufferSize = mesh.vertices.length * vertexBufferStride;
    const vertexBufferArrayBuffer = new ArrayBuffer(vertexBufferSize);
    const vertexBufferFloatArray = new Float32Array(vertexBufferArrayBuffer);

    for (let i = 0; i < mesh.vertices.length; i++) {
        vertexBufferFloatArray[i * 5 + 0] = mesh.vertices[i].position[0];
        vertexBufferFloatArray[i * 5 + 1] = mesh.vertices[i].position[1];
        vertexBufferFloatArray[i * 5 + 2] = mesh.vertices[i].position[2];

        vertexBufferFloatArray[i * 5 + 3] = mesh.vertices[i].texcoords[0];
        vertexBufferFloatArray[i * 5 + 4] = mesh.vertices[i].texcoords[1];
    }

    const indexBufferUintArray = new Uint32Array(mesh.indices);
    const indexBufferArrayBuffer = indexBufferUintArray.buffer;

    return { vertexBufferArrayBuffer, indexBufferArrayBuffer };
}

export class Renderer {

    constructor(gl) {
        this.gl = gl;
        this.glObjects = new WeakMap();
        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.targetMap = {
            vertex: gl.ARRAY_BUFFER,
            index: gl.ELEMENT_ARRAY_BUFFER,
        };

        this.minFilterMap = {
            nearest: {
                nearest: gl.NEAREST_MIPMAP_NEAREST,
                linear: gl.NEAREST_MIPMAP_LINEAR,
            },
            linear: {
                nearest: gl.LINEAR_MIPMAP_NEAREST,
                linear: gl.LINEAR_MIPMAP_LINEAR,
            },
        };

        this.magFilterMap = {
            nearest: gl.NEAREST,
            linear: gl.LINEAR,
        };

        this.wrapMap = {
            clamp: gl.CLAMP_TO_EDGE,
            repeat: gl.REPEAT,
            mirror: gl.MIRRORED_REPEAT,
        };

        this.topologyMap = {
            point_list: gl.POINTS,
            line_list: gl.LINES,
            line_strip: gl.LINE_STRIP,
            triangle_list: gl.TRIANGLES,
            triangle_strip: gl.TRIANGLE_STRIP,
        };

        this.typeMap = {
            uint: {
                1: gl.UNSIGNED_BYTE,
                2: gl.UNSIGNED_SHORT,
                4: gl.UNSIGNED_INT,
            },
            float: {
                4: gl.FLOAT,
            },
        };

        this.defaultMaterial = new Material({
            baseTexture: new Texture({
                image: new ImageData(new Uint8ClampedArray([255, 255, 255, 255]), 1, 1),
                sampler: new Sampler(),
            }),
        });

        this.prepareMaterial(this.defaultMaterial);
    }

    prepareBuffer(buffer) {
        if (this.glObjects.has(buffer)) {
            return this.glObjects.get(buffer);
        }

        const gl = this.gl;

        const data = buffer.data;
        const target = this.targetMap[buffer.usage];

        const glBuffer = WebGL.createBuffer(gl, { data, target });

        this.glObjects.set(buffer, glBuffer);
        return glBuffer;
    }

    prepareMaterial(material) {
        if (material.baseTexture) {
            this.prepareTexture(material.baseTexture);
        }
    }

    prepareTexture(texture) {
        if (texture.image) {
            this.prepareImage(texture.image);
        }

        if (texture.sampler) {
            this.prepareSampler(texture.sampler);
        }
    }

    prepareImage(image) {
        if (this.glObjects.has(image)) {
            return this.glObjects.get(image);
        }

        const gl = this.gl;

        const glTexture = WebGL.createTexture(gl, {
            image,
            mip: true,
        });

        this.glObjects.set(image, glTexture);
        return glTexture;
    }

    prepareSampler(sampler) {
        if (this.glObjects.has(sampler)) {
            return this.glObjects.get(sampler);
        }

        const gl = this.gl;

        const min = this.minFilterMap[sampler.minFilter][sampler.mipmapFilter];
        const mag = this.magFilterMap[sampler.magFilter];
        const wrapS = this.wrapMap[sampler.addressModeU];
        const wrapT = this.wrapMap[sampler.addressModeV];
        const wrapR = this.wrapMap[sampler.addressModeW];

        const glSampler = WebGL.createSampler(gl, {
            min, mag, wrapS, wrapT, wrapR,
        });

        this.glObjects.set(sampler, glSampler);
        return glSampler;
    }

    prepareModel(model) {
        for (const primitive of model.primitives) {
            this.preparePrimitive(primitive);
        }
    }

    preparePrimitive(primitive) {
        if (primitive.mesh) {
            this.prepareMesh(primitive.mesh);
        }

        if (primitive.material) {
            this.prepareMaterial(primitive.material);
        }
    }

    prepareMesh(mesh) {
        if (this.glObjects.has(mesh)) {
            return this.glObjects.get(mesh);
        }

        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const { vertexBufferArrayBuffer, indexBufferArrayBuffer } = createMeshArrayBuffers(mesh);
        const vertexBuffer = WebGL.createBuffer(gl, {
            data: vertexBufferArrayBuffer,
            target: gl.ARRAY_BUFFER,
        });
        const indexBuffer = WebGL.createBuffer(gl, {
            data: indexBufferArrayBuffer,
            target: gl.ELEMENT_ARRAY_BUFFER,
        });

        for (const attribute of vertexBufferLayout) {
            WebGL.configureAttribute(gl, attribute);
        }

        this.glObjects.set(mesh, vao);
        return vao;
    }

    prepareNode(node) {
        const models = node.getComponentsOfType(Model);
        for (const model of models) {
            this.prepareModel(model);
        }

        for (const child of node.children) {
            this.prepareNode(child);
        }
    }

    render(scene, camera) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs.simple;
        gl.useProgram(program);

        const viewMatrix = getGlobalViewMatrix(camera);
        const projectionMatrix = getProjectionMatrix(camera);
        const mvpMatrix = mat4.multiply(mat4.create(), projectionMatrix, viewMatrix);

        for (const node of scene.children) {
            this.renderNode(node, mvpMatrix);
        }
    }

    renderNode(node, mvpMatrix) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.simple;

        const localMatrix = getLocalModelMatrix(node);
        mvpMatrix = mat4.mul(mat4.create(), mvpMatrix, localMatrix);

        const models = node.getComponentsOfType(Model);
        for (const model of models) {
            gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);
            this.renderModel(model);
        }

        for (const child of node.children) {
            this.renderNode(child, mvpMatrix);
        }
    }

    renderModel(model) {
        for (const primitive of model.primitives) {
            this.renderPrimitive(primitive);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.simple;

        const vao = this.glObjects.get(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material ?? this.defaultMaterial;
        gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);

        const texture = this.glObjects.get(material.baseTexture.image);
        const sampler = this.glObjects.get(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindSampler(0, sampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);
    }

}
