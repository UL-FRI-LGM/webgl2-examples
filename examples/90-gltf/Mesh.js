export default class Mesh {

    constructor(options = {}) {
        this.primitives = [...(options.primitives || [])];
    }

}
