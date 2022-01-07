import { vec3, mat4, quat } from '../../lib/gl-matrix-module.js';

import { Utils } from './Utils.js';

export class Node {

    constructor(options) {
        Utils.init(this, Node.defaults, options);

        this.matrix = mat4.create();
        this.updateMatrix();

        this.children = [];
        this.parent = null;
    }

    updateMatrix() {
        const m = this.matrix;
        const degrees = this.rotation.map(x => x * 180 / Math.PI);
        const q = quat.fromEuler(quat.create(), ...degrees);
        const v = vec3.clone(this.translation);
        const s = vec3.clone(this.scale);
        mat4.fromRotationTranslationScale(m, q, v, s);
    }

    getGlobalTransform() {
        if (!this.parent) {
            return mat4.clone(this.matrix);
        } else {
            const matrix = this.parent.getGlobalTransform();
            return mat4.mul(matrix, matrix, this.matrix);
        }
    }

    addChild(node) {
        this.children.push(node);
        node.parent = this;
    }

    removeChild(node) {
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

Node.defaults = {
    translation: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
    aabb: {
        min: [0, 0, 0],
        max: [0, 0, 0],
    },
};
