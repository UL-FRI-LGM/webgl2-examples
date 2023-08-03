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
    Vertex,
} from '../core.js';

// TODO: GLB support
// TODO: accessors with no buffer views (zero-initialized)
// TODO: image from buffer view
// TODO: mipmaps
// TODO: material texcoord sets
// TODO: material alpha, doubleSided

export class GLTFLoader {

    // Loads the GLTF JSON file and all buffers and images that it references.
    // It also creates a cache for all future resource loading.
    async load(url) {
        this.gltf = await fetch(url).then(response => response.json());
        this.defaultScene = this.gltf.scene ?? 0;
        this.cache = new Map();

        const buffers = this.gltf.buffers.map(async buffer => {
            const bufferUrl = new URL(buffer.uri, url);
            const response = await fetch(bufferUrl);
            const arrayBuffer = await response.arrayBuffer();
            this.cache.set(buffer, arrayBuffer);
            return arrayBuffer;
        });

        const images = this.gltf.images.map(async image => {
            const imageUrl = new URL(image.uri, url);
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const imageBitmap = await createImageBitmap(blob);
            this.cache.set(image, imageBitmap);
            return imageBitmap;
        });

        this.buffers = await Promise.all(buffers);
        this.images = await Promise.all(images);
    }

    // Finds an object in list at the given index, or if the 'name'
    // property matches the given name.
    findByNameOrIndex(list, nameOrIndex) {
        if (typeof nameOrIndex === 'number') {
            return list[nameOrIndex];
        } else {
            return list.find(element => element.name === nameOrIndex);
        }
    }

    loadImage(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.images, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }

        return this.cache.get(gltfSpec);
    }

    loadBuffer(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.buffers, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }

        return this.cache.get(gltfSpec);
    }

    loadSampler(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.samplers, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const minFilter = {
            9728: 'nearest',
            9729: 'linear',
            9984: 'nearest',
            9985: 'linear',
            9986: 'nearest',
            9987: 'linear',
        };

        const magFilter = {
            9728: 'nearest',
            9729: 'linear',
        };

        const mipmapFilter = {
            9728: 'nearest',
            9729: 'linear',
            9984: 'nearest',
            9985: 'nearest',
            9986: 'linear',
            9987: 'linear',
        };

        const addressMode = {
            33071: 'clamp-to-edge',
            33648: 'mirror-repeat',
            10497: 'repeat',
        };

        const sampler = new Sampler({
            minFilter: minFilter[gltfSpec.minFilter],
            magFilter: magFilter[gltfSpec.magFilter],
            mipmapFilter: mipmapFilter[gltfSpec.minFilter],
            addressModeU: addressMode[gltfSpec.wrapS],
            addressModeV: addressMode[gltfSpec.wrapT],
        });

        this.cache.set(gltfSpec, sampler);
        return sampler;
    }

    loadTexture(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.textures, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const image = this.loadImage(gltfSpec.source);
        const sampler = this.loadSampler(gltfSpec.sampler);

        const texture = new Texture({ image, sampler });

        this.cache.set(gltfSpec, texture);
        return texture;
    }

    loadMaterial(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.materials, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const options = {};
        const pbr = gltfSpec.pbrMetallicRoughness;
        if (pbr) {
            if (pbr.baseColorTexture) {
                options.baseTexture = this.loadTexture(pbr.baseColorTexture.index);
            }
            if (pbr.metallicRoughnessTexture) {
                options.metalnessTexture = this.loadTexture(pbr.metallicRoughnessTexture.index);
                options.roughnessTexture = this.loadTexture(pbr.metallicRoughnessTexture.index);
            }
            options.baseFactor = pbr.baseColorFactor;
            options.metalnessFactor = pbr.metallicFactor;
            options.roughnessFactor = pbr.roughnessFactor;
        }

        if (gltfSpec.normalTexture) {
            options.normalTexture = this.loadTexture(gltfSpec.normalTexture.index);
            options.normalFactor = gltfSpec.normalTexture.scale;
        }

        if (gltfSpec.emissiveTexture) {
            options.emissionTexture = this.loadTexture(gltfSpec.emissiveTexture.index);
            options.emissionFactor = gltfSpec.emissiveFactor;
        }

        if (gltfSpec.occlusionTexture) {
            options.occlusionTexture = this.loadTexture(gltfSpec.occlusionTexture.index);
            options.occlusionFactor = gltfSpec.occlusionTexture.strength;
        }

        const material = new Material(options);

        this.cache.set(gltfSpec, material);
        return material;
    }

    prepareAccessor(index) {
        const viewMap = {
            5120: Int8Array,
            5121: Uint8Array,
            5122: Int16Array,
            5123: Uint16Array,
            5125: Uint32Array,
            5126: Float32Array,
        };

        const numComponentsMap = {
            SCALAR: 1,
            VEC2: 2,
            VEC3: 3,
            VEC4: 4,
            MAT2: 4,
            MAT3: 9,
            MAT4: 16,
        };

        const accessor = this.gltf.accessors[index];

        if (accessor.bufferView === undefined) {
            console.warn('Accessor does not reference a buffer view');
            return null;
        }
        const bufferView = this.gltf.bufferViews[accessor.bufferView];
        const buffer = this.loadBuffer(bufferView.buffer);

        const viewConstructor = viewMap[accessor.componentType];
        const viewOffset = bufferView.byteOffset ?? 0;
        const viewLength = bufferView.byteLength / viewConstructor.BYTES_PER_ELEMENT;
        const view = new viewConstructor(buffer, viewOffset, viewLength);

        const byteStride = bufferView.byteStride;
        const byteOffset = accessor.byteOffset ?? 0;

        const numComponents = numComponentsMap[accessor.type];
        const count = accessor.count;
        const stride = byteStride ? byteStride / viewConstructor.BYTES_PER_ELEMENT : numComponents;
        const offset = byteOffset / viewConstructor.BYTES_PER_ELEMENT;

        function get(i) {
            const start = offset + stride * i;
            const end = offset + stride * i + numComponents;
            return [...view.slice(start, end)];
        }

        return { view, count, offset, stride, numComponents, get };
    }

    createMeshFromPrimitive(spec) {
        if (spec.attributes.POSITION === undefined) {
            console.warn('No position in mesh');
            return new Mesh();
        }

        if (spec.indices === undefined) {
            console.warn('No indices in mesh');
            return new Mesh();
        }

        const attributeAccessData = {};
        for (const attribute in spec.attributes) {
            attributeAccessData[attribute] = this.prepareAccessor(spec.attributes[attribute]);
        }

        const position = attributeAccessData.POSITION;
        const texcoords = attributeAccessData.TEXCOORD_0;
        const normal = attributeAccessData.NORMAL;
        const tangent = attributeAccessData.TANGENT;

        const vertexCount = position.count;
        const vertices = [];

        for (let i = 0; i < vertexCount; i++) {
            const options = {};

            if (position) { options.position = position.get(i); }
            if (texcoords) { options.texcoords = texcoords.get(i); }
            if (normal) { options.normal = normal.get(i); }
            if (tangent) { options.tangent = tangent.get(i); }

            vertices.push(new Vertex(options));
        }

        const indices = [];
        const indicesAccessor = this.prepareAccessor(spec.indices);
        const indexCount = indicesAccessor.count;

        for (let i = 0; i < indexCount; i++) {
            indices.push(indicesAccessor.get(i));
        }

        return new Mesh({ vertices, indices });
    }

    loadMesh(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.meshes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const primitives = [];
        for (const primitiveSpec of gltfSpec.primitives) {
            if (primitiveSpec.mode !== 4 && primitiveSpec.mode !== undefined) {
                console.warn(`GLTFLoader: skipping primitive with mode ${primitiveSpec.mode}`);
                continue;
            }

            const options = {};
            options.mesh = this.createMeshFromPrimitive(primitiveSpec);

            if (primitiveSpec.material !== undefined) {
                options.material = this.loadMaterial(primitiveSpec.material);
            }

            primitives.push(new Primitive(options));
        }

        const model = new Model({ primitives });

        this.cache.set(gltfSpec, model);
        return model;
    }

    loadCamera(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.cameras, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const options = {};
        if (gltfSpec.type === 'perspective') {
            const { aspectRatio, yfov, znear, zfar } = gltfSpec.perspective;
            Object.assign(options, {
                orthographic: 0,
                aspect: aspectRatio,
                fovy: yfov,
                near: znear,
                far: zfar,
            });
        } else if (gltfSpec.type === 'orthographic') {
            const { xmag, ymag, znear, zfar } = gltfSpec.orthographic;
            Object.assign(options, {
                orthographic: 1,
                aspect: xmag / ymag,
                halfy: ymag,
                near: znear,
                far: zfar,
            });
        }

        const camera = new Camera(options);

        this.cache.set(gltfSpec, camera);
        return camera;
    }

    loadNode(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.nodes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const node = new Node();

        node.addComponent(new Transform(gltfSpec));

        if (gltfSpec.children) {
            for (const childIndex of gltfSpec.children) {
                node.addChild(this.loadNode(childIndex));
            }
        }

        if (gltfSpec.camera !== undefined) {
            node.addComponent(this.loadCamera(gltfSpec.camera));
        }

        if (gltfSpec.mesh !== undefined) {
            node.addComponent(this.loadMesh(gltfSpec.mesh));
        }

        this.cache.set(gltfSpec, node);
        return node;
    }

    loadScene(nameOrIndex) {
        const gltfSpec = this.findByNameOrIndex(this.gltf.scenes, nameOrIndex);
        if (!gltfSpec) {
            return null;
        }
        if (this.cache.has(gltfSpec)) {
            return this.cache.get(gltfSpec);
        }

        const scene = new Node();
        if (gltfSpec.nodes) {
            for (const nodeIndex of gltfSpec.nodes) {
                scene.addChild(this.loadNode(nodeIndex));
            }
        }

        this.cache.set(gltfSpec, scene);
        return scene;
    }

}
