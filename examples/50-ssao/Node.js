import { vec3, mat4, quat } from '../../lib/gl-matrix-module.js';

export class Node {

    constructor() {
        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0, 1];
        this.scale = [1, 1, 1];

        this.transform = mat4.create();
        this.updateTransform();

        this.children = [];
        this.parent = null;
    }

    updateTransform() {
        mat4.fromRotationTranslationScale(
            this.transform,
            this.rotation,
            this.translation,
            this.scale);
    }

    getGlobalTransform() {
        if (!this.parent) {
            return mat4.clone(this.transform);
        } else {
            let transform = this.parent.getGlobalTransform();
            return mat4.mul(transform, transform, this.transform);
        }
    }

    addNode(node) {
        this.children.push(node);
        node.parent = this;
    }

    removeNode(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
            node.parent = null;
        }
    }

    traverse(before, after) {
        if (before) {
            before(this);
        }
        for (let child of this.children) {
            child.traverse(before, after);
        }
        if (after) {
            after(this);
        }
    }

}
