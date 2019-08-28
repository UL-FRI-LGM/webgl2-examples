const mat4 = glMatrix.mat4;

export default class GLTFLoader {

    constructor(gl) {
        this.gl = gl;
        this.gltf = null;

        this.built = false;

        this.aspectRatio = 1;
    }

    async load(uri) {
        const dirname = uri.split('/').slice(0, -1).join('/') + '/';
        const gltf = this.gltf = await this.loadGLTF(uri);

        let promises = [];

        if (!gltf.images) {
            gltf.images = [];
        }

        gltf.images.push({
            uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII='
        });

        for (let image of gltf.images) {
            if (typeof image.uri === 'undefined') {
                throw new Error('image.uri has to be defined');
            }
            const path = image.uri.startsWith('data:') ? image.uri : dirname + image.uri;
            promises.push(this.loadImage(path).then((img) => image.image = img));
        }

        if (!gltf.buffers) {
            gltf.buffers = [];
        }

        for (let buffer of gltf.buffers) {
            if (typeof buffer.uri === 'undefined') {
                throw new Error('buffer.uri has to be defined');
            }
            const path = buffer.uri.startsWith('data:') ? buffer.uri : dirname + buffer.uri;
            promises.push(this.loadBuffer(path).then((buf) => buffer.buffer = buf));
        }

        await Promise.all(promises);

        this.build();
    }

    loadGLTF(uri) {
        return fetch(uri).then(response => response.json());
    }

    loadBuffer(uri) {
        return fetch(uri).then(response => response.arrayBuffer());
    }

    loadImage(uri) {
        return new Promise((resolve, reject) => {
            let image = new Image();
            image.addEventListener('load', () => resolve(image));
            image.addEventListener('error', reject);
            image.src = uri;
        });
    }

    build() {
        let gltf = this.gltf;

        if (gltf.asset.version !== '2.0') {
            throw new Error('glTF versions other than 2.0 not supported');
        }

        this.createSamplers();
        this.createTextures();
        this.createMaterials();
        this.prepareBuffers();
        this.createBufferViews();
        this.createMeshes();
        this.createScenes();

        this.built = true;
    }

    createSamplers() {
        const gl = this.gl;
        let gltf = this.gltf;

        gltf.samplers = gltf.samplers || [];

        gltf.samplers.push({});

        for (let sampler of gltf.samplers) {
            const samplerObject = gl.createSampler();
            sampler.samplerObject = samplerObject;
            if (sampler.magFilter) {
                gl.samplerParameteri(samplerObject, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
            }
            if (sampler.minFilter) {
                gl.samplerParameteri(samplerObject, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
            }
            if (sampler.wrapS) {
                gl.samplerParameteri(samplerObject, gl.TEXTURE_WRAP_S, sampler.wrapS);
            }
            if (sampler.wrapT) {
                gl.samplerParameteri(samplerObject, gl.TEXTURE_WRAP_T, sampler.wrapT);
            }
        }
    }

    createTextures() {
        const gl = this.gl;
        let gltf = this.gltf;

        gltf.textures = gltf.textures || [];

        gltf.textures.push({
            source: gltf.images.length - 1
        });

        for (let texture of gltf.textures) {
            const textureObject = gl.createTexture();
            texture.textureObject = textureObject;
            if (typeof texture.source === 'undefined') {
                throw new Error('texture.source has to be defined');
            }
            texture.source = gltf.images[texture.source];
            const sampler = typeof texture.sampler !== 'undefined'
                ? texture.sampler
                : gltf.samplers.length - 1;
            texture.sampler = gltf.samplers[sampler];

            gl.bindTexture(gl.TEXTURE_2D, textureObject);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source.image);
            gl.generateMipmap(gl.TEXTURE_2D);
        }
    }

    createMaterials() {
        const gl = this.gl;
        let gltf = this.gltf;

        gltf.materials = gltf.materials || [];

        gltf.materials.push({});

        for (let material of gltf.materials) {
            // TODO: convert everything to textures
            if (material.normalTexture) {
                material.normalTexture.texture = gltf.textures[material.normalTexture.index];
            }
            if (material.occlusionTexture) {
                material.occlusionTexture.texture = gltf.textures[material.occlusionTexture.index];
            }
            if (material.emissiveTexture) {
                material.emissiveTexture.texture = gltf.textures[material.emissiveTexture.index];
            }
            let pbr = material.pbrMetallicRoughness;
            if (pbr) {
                if (pbr.baseColorTexture) {
                    pbr.baseColorTexture.texture = gltf.textures[pbr.baseColorTexture.index];
                }
                if (pbr.metallicRoughnessTexture) {
                    pbr.metallicRoughnessTexture.texture = gltf.textures[pbr.metallicRoughnessTexture.index];
                }
            }
        }
    }

    prepareAccessor(accessor, target) {
        const gl = this.gl;
        let gltf = this.gltf;

        if (typeof accessor.bufferView === 'undefined') {
            throw new Error('accessor.bufferView has to be defined');
        }

        let bufferView = gltf.bufferViews[accessor.bufferView];
        accessor.bufferView = bufferView;
        if (typeof bufferView.target !== 'undefined' && bufferView.target !== target) {
            throw new Error('bufferView.target does not agree with accessor');
        }
        bufferView.target = target;
        bufferView.buffer = gltf.buffers[bufferView.buffer];
    }

    prepareBuffers() {
        const gl = this.gl;
        let gltf = this.gltf;

        gltf.buffers = gltf.buffers || [];
        gltf.bufferViews = gltf.bufferViews || [];
        gltf.accessors = gltf.accessors || [];
        gltf.meshes = gltf.meshes || [];

        for (let mesh of gltf.meshes) {
            for (let primitive of mesh.primitives) {
                if (typeof primitive.indices !== 'undefined') {
                    const accessor = gltf.accessors[primitive.indices];
                    primitive.indices = accessor;
                    this.prepareAccessor(accessor, gl.ELEMENT_ARRAY_BUFFER);
                }
                for (let attribute in primitive.attributes) {
                    const accessorIndex = primitive.attributes[attribute];
                    const accessor = gltf.accessors[accessorIndex];
                    primitive.attributes[attribute] = accessor;
                    this.prepareAccessor(accessor, gl.ARRAY_BUFFER);
                }
                if (typeof primitive.mode === 'undefined') {
                    primitive.mode = gl.TRIANGLES;
                }
            }
        }
    }

    createBufferViews() {
        const gl = this.gl;
        let gltf = this.gltf;

        gltf.bufferViews = gltf.bufferViews || [];

        for (let bufferView of gltf.bufferViews) {
            if (typeof bufferView.target === 'undefined') {
                throw new Error('bufferView.target has to be defined');
            }

            const data = new Uint8Array(bufferView.buffer.buffer);
            const bufferObject = gl.createBuffer();
            bufferView.bufferObject = bufferObject;
            gl.bindBuffer(bufferView.target, bufferObject);
            gl.bufferData(bufferView.target, data, gl.STATIC_DRAW,
                bufferView.byteOffset, bufferView.byteLength);
        }
    }

    createMeshes() {
        const gl = this.gl;
        let gltf = this.gltf;

        gltf.meshes = gltf.meshes || [];

        const attributeTypeToSize = {
            SCALAR : 1,
            VEC2   : 2,
            VEC3   : 3,
            VEC4   : 4,
            MAT2   : 4,
            MAT3   : 9,
            MAT4   : 16,
        };

        const attributeNameToIndex = {
            POSITION   : 0,
            NORMAL     : 1,
            TANGENT    : 2,
            TEXCOORD_0 : 3,
            TEXCOORD_1 : 4,
            COLOR_0    : 5,
            JOINTS_0   : 6,
            WEIGHTS_0  : 7,
        };

        for (let mesh of gltf.meshes) {
            for (let primitive of mesh.primitives) {
                const material = typeof primitive.material !== 'undefined'
                    ? primitive.material
                    : gltf.materials.length - 1;
                primitive.material = gltf.materials[material];

                const vao = gl.createVertexArray();
                gl.bindVertexArray(vao);
                primitive.vao = vao;

                if (typeof primitive.indices !== 'undefined') {
                    const bufferView = primitive.indices.bufferView;
                    gl.bindBuffer(bufferView.target, bufferView.bufferObject);
                }

                for (let attribute in primitive.attributes) {
                    const accessor = primitive.attributes[attribute];
                    const bufferView = accessor.bufferView;
                    const index = attributeNameToIndex[attribute];
                    const size = attributeTypeToSize[accessor.type];
                    const type = accessor.componentType;
                    const normalized = !!accessor.normalized;
                    const stride = bufferView.byteStride || 0; // is this correct or should it be computed?
                    const offset = accessor.byteOffset || 0;

                    if (typeof index === 'undefined') {
                        throw new Error('Attribute ' + attribute + ' not supported');
                    }

                    gl.bindBuffer(bufferView.target, bufferView.bufferObject);
                    gl.enableVertexAttribArray(index);
                    gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
                }
            }
        }
    }

    createNode(node) {
        const gl = this.gl;
        let gltf = this.gltf;

        if (typeof node.camera !== 'undefined') {
            node.camera = gltf.cameras[node.camera];
            node.camera.matrix = mat4.create();
            if (node.camera.type === 'perspective') {
                const p = node.camera.perspective;
                const fovy = p.yfov;
                const aspect = p.aspectRatio || this.aspectRatio;
                const near = p.znear;
                const far = p.zfar || Infinity;
                mat4.perspective(node.camera.matrix, fovy, aspect, near, far);
            } else if (node.camera.type === 'orthographic') {
                const o = node.camera.orthographic;
                const left = -o.xmag / 2;
                const right = o.xmag / 2;
                const bottom = -o.ymag / 2;
                const top = o.ymag / 2;
                const near = o.znear;
                const far = o.zfar;
                mat4.ortho(node.camera.matrix, left, right, bottom, top, near, far);
            }
        }

        if (typeof node.mesh !== 'undefined') {
            node.mesh = gltf.meshes[node.mesh];
        }

        const t = node.transform = mat4.create();
        if (node.matrix) {
            mat4.copy(t, node.matrix);
        } else {
            const q = node.rotation || [0, 0, 0, 1];
            const v = node.translation || [0, 0, 0];
            const s = node.scale || [1, 1, 1];
            mat4.fromRotationTranslationScale(t, q, v, s);
        }

        node.children = node.children || [];
        for (let i = 0; i < node.children.length; i++) {
            const child = gltf.nodes[node.children[i]];
            node.children[i] = child;
            child.parent = node;
            this.createNode(child);
        }
    }

    createScenes() {
        const gl = this.gl;
        let gltf = this.gltf;

        gltf.scenes = gltf.scenes || [];
        gltf.nodes = gltf.nodes || [];
        gltf.cameras = gltf.cameras || [];

        for (let scene of gltf.scenes) {
            scene.nodes = scene.nodes || [];

            for (let i = 0; i < scene.nodes.length; i++) {
                const node = gltf.nodes[scene.nodes[i]];
                scene.nodes[i] = node;
                this.createNode(node);
            }
        }
    }

    getObjectByName(name) {
        let object = null;
        let gltf = this.gltf;

        const sets = [
            'accessors',
            'buffers',
            'bufferViews',
            'scenes',
            'nodes',
            'cameras',
            'meshes',
            'materials',
            'textures',
            'images',
            'samplers',
        ];

        for (let set of sets) {
            // yes, assignment, not equality
            if (object = gltf[set].find(x => x.name === name)) {
                return object;
            }
        }

        return null;
    }

    setAspectRatio(aspectRatio) {
        const gl = this.gl;
        let gltf = this.gltf;

        this.aspectRatio = aspectRatio;

        if (!gltf) {
            return;
        }

        gltf.cameras = gltf.cameras || [];

        for (let camera of gltf.cameras) {
            if (camera.type === 'perspective') {
                const p = camera.perspective;
                if (typeof p.aspectRatio === 'undefined') {
                    const fovy = p.yfov;
                    const aspect = p.aspectRatio || this.aspectRatio;
                    const near = p.znear;
                    const far = p.zfar || Infinity;
                    mat4.perspective(camera.matrix, fovy, aspect, near, far);
                }
            }
        }
    }

}
