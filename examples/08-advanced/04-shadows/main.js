import { mat4, vec3, quat } from '../../../lib/gl-matrix-module.js';

import { ResizeSystem } from '../../../common/engine/systems/ResizeSystem.js';
import { UpdateSystem } from '../../../common/engine/systems/UpdateSystem.js';

import { ImageLoader } from '../../../common/engine/loaders/ImageLoader.js';
import { JSONLoader } from '../../../common/engine/loaders/JSONLoader.js';

import { OrbitController } from '../../../common/engine/controllers/OrbitController.js';

import {
    Camera,
    Material,
    Model,
    Node,
    Primitive,
    Sampler,
    Texture,
    Transform,
} from '../../../common/engine/core.js';

import { Renderer } from './Renderer.js';

const canvas = document.querySelector('canvas');
const gl = canvas.getContext('webgl2');
const renderer = new Renderer(gl);

const scene = new Node();

const camera = new Node();
camera.addComponent(new Transform());
camera.addComponent(new Camera());
camera.addComponent(new OrbitController(camera, canvas, {
    distance: 10,
}));
scene.addChild(camera);

const cubeRoot = new Node();
scene.addChild(cubeRoot);

const shadowCameraRoot = new Node();
shadowCameraRoot.addComponent(new Transform());
shadowCameraRoot.addComponent({
    update(t) {
        const shadowTransform = shadowCameraRoot.getComponentOfType(Transform);
        quat.setAxisAngle(shadowTransform.rotation, [0, 1, 0], t * 0.1);
    }
})
cubeRoot.addChild(shadowCameraRoot);

const shadowCamera = new Node();
shadowCamera.addComponent(new Transform({
    translation: [0, 0, 20],
}));
shadowCamera.addComponent(new Camera({
    fovy: 0.5,
    near: 15,
    far: 50,
}));
shadowCameraRoot.addChild(shadowCamera);

const [cubeMesh, cubeImage] = await Promise.all([
    new JSONLoader().loadMesh('../../../common/models/cube.json'),
    new ImageLoader().load('../../../common/images/crate-diffuse.png'),
]);

const cubeMaterial = new Material({
    baseTexture: new Texture({
        image: cubeImage,
        sampler: new Sampler({
            minFilter: 'nearest',
            magFilter: 'nearest',
        }),
    }),
});

const cubeModel = new Model({
    primitives: [
        new Primitive({
            mesh: cubeMesh,
            material: cubeMaterial,
        }),
    ],
});

const cubeCount = 100;
for (let i = 0; i < cubeCount; i++) {
    const cube = new Node();
    cube.addComponent(new Transform({
        translation: vec3.random(vec3.create(), Math.random() * 5),
        rotation: quat.random(quat.create()),
        scale: vec3.scale(vec3.create(), [1, 1, 1], 0.1 + Math.random()),
    }));
    cube.addComponent(cubeModel);
    cubeRoot.addChild(cube);
}

function update(t, dt) {
    scene.traverse(node => {
        for (const component of node.components) {
            component.update?.(t, dt);
        }
    });
}

function render() {
    renderer.render(scene, camera, shadowCamera);
}

function resize({ displaySize: { width, height }}) {
    camera.getComponentOfType(Camera).aspect = width / height;
    renderer.resize(width, height);
}

new ResizeSystem({ canvas, resize }).start();
new UpdateSystem({ update, render }).start();

document.querySelector('.loader-container').remove();
