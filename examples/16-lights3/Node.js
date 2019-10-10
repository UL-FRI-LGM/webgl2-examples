const mat4 = glMatrix.mat4;

export default class Node {

    constructor() {
        this.transform = mat4.create();
        this.children = [];
        this.parent = null;
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
