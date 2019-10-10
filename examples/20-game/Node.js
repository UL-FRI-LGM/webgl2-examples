import Utils from './Utils.js';

const mat4 = glMatrix.mat4;
const quat = glMatrix.quat;

export default class Node {

    constructor(options) {
        Utils.init(this, Node.defaults, options);

        this.transform = mat4.create();
        this.updateTransform();

        this.children = [];
        this.parent = null;
    }

    updateTransform() {
        const t = this.transform;
        const q = quat.fromEuler(quat.create(), ...this.rotation);
        const v = this.translation;
        const s = this.scale;
        mat4.fromRotationTranslationScale(t, q, v, s);
    }

    getGlobalTransform() {
        if (!this.parent) {
            return mat4.clone(this.transform);
        } else {
            let transform = this.parent.getGlobalTransform();
            return mat4.mul(transform, transform, this.transform);
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
        before(this);
        for (let child of this.children) {
            child.traverse(before, after);
        }
        after(this);
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
