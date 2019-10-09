export default class Scene {

    constructor() {
        this.nodes = [];
        this.camera = null;
    }

    addNode(node) {
        this.nodes.push(node);

        // Find the first camera and set it as active.
        if (!this.camera) {
            node.traverse(() => {}, node => {
                if (node instanceof Camera) {
                    this.camera = node;
                }
            });
        }
    }

}
