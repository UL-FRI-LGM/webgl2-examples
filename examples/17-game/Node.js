import Utils from './Utils.js';

const vec3 = glMatrix.vec3;
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
        const degrees = this.rotation.map(x => x * 180 / Math.PI);
        const q = quat.fromEuler(quat.create(), ...degrees);
        const v = vec3.clone(this.translation);
        const s = vec3.clone(this.scale);
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
        before && before(this);
        for (let child of this.children) {
            child.traverse(before, after);
        }
        after && after(this);
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
