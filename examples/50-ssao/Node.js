import { vec3, mat4, quat } from '../../lib/gl-matrix-module.js';

export class Node {

    constructor() {
        this.translation = [0, 0, 0];
        this.rotation = [0, 0, 0, 1];
        this.scale = [1, 1, 1];

        this.matrix = mat4.create();
        this.updateMatrix();

        this.children = [];
        this.parent = null;
    }

    updateMatrix() {
        mat4.fromRotationTranslationScale(
            this.matrix,
            this.rotation,
            this.translation,
            this.scale);
    }

    getGlobalTransform() {
        if (!this.parent) {
            return mat4.clone(this.matrix);
        } else {
            const matrix = this.parent.getGlobalTransform();
            return mat4.mul(matrix, matrix, this.matrix);
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
        for (const child of this.children) {
            child.traverse(before, after);
        }
        if (after) {
            after(this);
        }
    }

}
