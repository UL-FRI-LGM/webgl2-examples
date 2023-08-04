import { mat4 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../../../common/engine/WebGL.js';

import {
    Accessor,
    Camera,
    Material,
    Mesh,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
    Vertex,
} from '../../../common/engine/core.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
} from '../../../common/engine/core/SceneUtils.js';

import {
    parseFormat,
    createVertexBuffer,
} from '../../../common/engine/core/VertexUtils.js';

import { shaders } from './shaders.js';

// This class prepares all assets for use with WebGL
// and takes care of rendering.

export class Renderer {

    constructor(gl) {
        this.gl = gl;
        this.glObjects = new WeakMap();
        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(1, 1, 1, 1);
        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.CULL_FACE);

        this.defaultTexture = WebGL.createTexture(gl, {
            width: 1,
            height: 1,
            data: new Uint8Array([0, 0, 0, 0]),
        });

        this.defaultSampler = WebGL.createSampler(gl, {
            min: gl.LINEAR,
            mag: gl.LINEAR,
            wrapS: gl.REPEAT,
            wrapT: gl.REPEAT,
        });
    }

    prepareSampler(sampler) {
        if (this.glObjects.has(sampler)) {
            return this.glObjects.get(sampler);
        }

        const gl = this.gl;

        const minFilter = {
            'nearest': {
                'nearest': gl.NEAREST_MIPMAP_NEAREST,
                'linear': gl.NEAREST_MIPMAP_LINEAR,
            },
            'linear': {
                'nearest': gl.LINEAR_MIPMAP_NEAREST,
                'linear': gl.LINEAR_MIPMAP_LINEAR,
            },
        };

        const magFilter = {
            'nearest': gl.NEAREST,
            'linear': gl.LINEAR,
        };

        const wrap = {
            'repeat': gl.REPEAT,
            'mirror-repeat': gl.MIRRORED_REPEAT,
            'clamp-to-edge': gl.CLAMP_TO_EDGE,
        };

        const glSampler = WebGL.createSampler(this.gl, {
            minFilter: minFilter[sampler.minFilter][sampler.mipmapFilter],
            magFilter: magFilter[sampler.magFilter],
            wrapS: wrap[sampler.addressModeU],
            wrapT: wrap[sampler.addressModeV],
        });

        this.glObjects.set(sampler, glSampler);
        return glSampler;
    }

    prepareImage(image) {
        if (this.glObjects.has(image)) {
            return this.glObjects.get(image);
        }

        const glTexture = WebGL.createTexture(this.gl, { image, mip: true });

        this.glObjects.set(image, glTexture);
        return glTexture;
    }

    prepareTexture(texture) {
        if (texture.image) {
            this.prepareImage(texture.image);
        }
        if (texture.sampler) {
            this.prepareSampler(texture.sampler);
        }
    }

    prepareMaterial(material) {
        if (material.baseTexture) {
            this.prepareTexture(material.baseTexture);
        }
        if (material.emissionTexture) {
            this.prepareTexture(material.emissionTexture);
        }
        if (material.normalTexture) {
            this.prepareTexture(material.normalTexture);
        }
        if (material.occlusionTexture) {
            this.prepareTexture(material.occlusionTexture);
        }
        if (material.roughnessTexture) {
            this.prepareTexture(material.roughnessTexture);
        }
        if (material.metalnessTexture) {
            this.prepareTexture(material.metalnessTexture);
        }
    }

    prepareMesh(mesh) {
        if (this.glObjects.has(mesh)) {
            return this.glObjects.get(mesh);
        }

        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vertexBufferLayout = {
            arrayStride: 48,
            attributes: [
                {
                    name: 'position',
                    shaderLocation: 0,
                    offset: 0,
                    format: 'float32x3',
                },
                {
                    name: 'texcoords',
                    shaderLocation: 1,
                    offset: 12,
                    format: 'float32x2',
                },
                {
                    name: 'normal',
                    shaderLocation: 2,
                    offset: 20,
                    format: 'float32x3',
                },
                {
                    name: 'tangent',
                    shaderLocation: 3,
                    offset: 32,
                    format: 'float32x3',
                },
            ],
        };

        const vertexBufferArrayBuffer = createVertexBuffer(mesh.vertices, vertexBufferLayout);
        const vertexBuffer = WebGL.createBuffer(gl, {
            data: vertexBufferArrayBuffer,
            target: gl.ARRAY_BUFFER,
        });

        const indexBufferArrayBuffer = new Uint32Array(mesh.indices).buffer;
        const indexBuffer = WebGL.createBuffer(gl, {
            data: indexBufferArrayBuffer,
            target: gl.ELEMENT_ARRAY_BUFFER,
        });

        const componentTypeMap = {
            'float': {
                'true': {
                    4: gl.FLOAT,
                },
                'false': {
                    4: gl.FLOAT,
                },
            },
            'int': {
                'true': {
                    1: gl.BYTE,
                    2: gl.SHORT,
                    4: gl.INT,
                },
                'false': {
                    1: gl.UNSIGNED_BYTE,
                    2: gl.UNSIGNED_SHORT,
                    4: gl.UNSIGNED_INT,
                },
            },
        };

        for (const attribute of vertexBufferLayout.attributes) {
            const format = parseFormat(attribute.format);
            gl.enableVertexAttribArray(attribute.shaderLocation);
            gl.vertexAttribPointer(
                attribute.shaderLocation,
                format.componentCount,
                componentTypeMap[format.componentType][format.componentSigned][format.componentSize],
                format.componentNormalized,
                vertexBufferLayout.arrayStride,
                attribute.offset);
        }

        gl.bindVertexArray(null);

        this.glObjects.set(mesh, vao);
        return vao;
    }

    preparePrimitive(primitive) {
        if (primitive.mesh) {
            this.prepareMesh(primitive.mesh);
        }
        if (primitive.material) {
            this.prepareMaterial(primitive.material);
        }
    }

    prepareModel(model) {
        for (const primitive of model.primitives) {
            this.preparePrimitive(primitive);
        }
    }

    prepareNode(node) {
        const models = node.getComponentsOfType(Mesh);
        for (const model of models) {
            this.prepareMesh(mesh);
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
        gl.uniformMatrix4fv(uniforms.uModelViewProjection, false, mvpMatrix);

        const models = node.getComponentsOfType(Model);
        for (const model of models) {
            for (const primitive of model.primitives) {
                this.renderPrimitive(primitive);
            }
        }

        for (const child of node.children) {
            this.renderNode(child, mvpMatrix);
        }
    }

    renderPrimitive(primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.simple;

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);

        const glTexture = material.baseTexture
                        ? this.prepareImage(material.baseTexture.image)
                        : this.defaultTexture;
        const glSampler = material.baseTexture
                        ? this.prepareSampler(material.baseTexture.sampler)
                        : this.defaultSampler;

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }

}
