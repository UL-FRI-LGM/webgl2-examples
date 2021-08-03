export class Accessor {

    constructor(options = {}) {
        this.bufferView = options.bufferView || null;
        this.byteOffset = options.byteOffset || 0;
        this.componentType = options.componentType || 5120;
        this.normalized = options.normalized || false;
        this.count = options.count || 0;
        this.numComponents = options.numComponents || 0;
        this.min = options.min || null;
        this.max = options.max || null;
    }

}
