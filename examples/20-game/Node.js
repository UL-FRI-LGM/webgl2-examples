import Utils from './Utils.js';

const mat4 = glMatrix.mat4;

export default class Node {

    constructor(options) {
        Utils.init(this, Node.defaults, options);

        this.children = [];
        this.parent = null;
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
    aabbMin: [0, 0, 0],
    aabbMax: [0, 0, 0],
};
