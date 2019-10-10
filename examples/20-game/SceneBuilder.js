import Node from './Node.js';
import Mesh from './Mesh.js';
import Camera from './Camera.js';
import Scene from './Scene.js';

export default class SceneBuilder {

    constructor(spec) {
        this.spec = spec;
    }

    createNode(spec) {
        if (spec.model !== undefined) {
            const updated = Object.assign({}, spec, this.spec.models[spec.model]);
            return new Mesh(updated);
        } else if (spec.projection !== undefined) {
            return new Camera(spec);
        } else {
            return new Node(spec);
        }
    }

    build() {
        let scene = new Scene();
        this.spec.nodes.forEach(spec => scene.addNode(this.createNode(spec)));
        return scene;
    }

}
