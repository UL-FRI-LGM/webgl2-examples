import { mat4 } from '../../../lib/gl-matrix-module.js';

export class Node {

    constructor() {
        // Every node has its own local transformation.
        this.localMatrix = mat4.create();

        // For scene tree purposes, we need to know the children
        // and the parent of a node.
        this.children = [];
        this.parent = null;
    }

    get globalMatrix() {
        if (!this.parent) {
            // If the node does not have a parent, it is the root node.
            // Return its local transformation.
            return mat4.clone(this.localMatrix);
        } else {
            // If the node has a parent, we have to take the parent's
            // global transformation into account. This recursion
            // essentially multiplies all local transformations up
            // to the root node.
            const globalMatrix = this.parent.globalMatrix;
            return mat4.mul(globalMatrix, globalMatrix, this.localMatrix);
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
