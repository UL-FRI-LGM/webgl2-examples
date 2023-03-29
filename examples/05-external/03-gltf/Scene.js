import { Node } from '../../../common/engine/core/Node.js';

export class Scene {

    constructor(options = {}) {
        this.nodes = [...(options.nodes ?? [])];
    }

    addNode(node) {
        this.nodes.push(node);
    }

    traverse(before, after) {
        for (const node of this.nodes) {
            node.traverse(before, after);
        }
    }

    linearize() {
        const array = [];
        this.traverse(node => array.push(node));
        return array;
    }

    filter(predicate) {
        return this.linearize().filter(predicate);
    }

    find(predicate) {
        return this.linearize().find(predicate);
    }

    map(transform) {
        return this.linearize().map(transform);
    }

}
