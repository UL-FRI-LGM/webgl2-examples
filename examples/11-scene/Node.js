const mat4 = glMatrix.mat4;

export default class Node {

    constructor() {
        // Every node has its own local transformation.
        this.transform = mat4.create();

        // For scene tree purposes, we need to know the children
        // and the parent of a node.
        this.children = [];
        this.parent = null;
    }

    getGlobalTransform() {
        if (!this.parent) {
            // If the node does not have a parent, it is the root node.
            // Return its local transformation.
            return mat4.clone(this.transform);
        } else {
            // If the node has a parent, we have to take the parent's
            // global transformation into account. This recursion
            // essentially multiplies all local transformations up
            // to the root node.
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
        // This method is a helper that is useful for all kinds of tasks.
        // We are going to use it for rendering.
        before(this);
        for (let child of this.children) {
            child.traverse(before, after);
        }
        after(this);
    }

}
