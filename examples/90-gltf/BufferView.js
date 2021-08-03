export class BufferView {

    constructor(options = {}) {
        this.buffer = options.buffer || null;
        this.byteOffset = options.byteOffset || 0;
        this.byteLength = options.byteLength || 0;
        this.byteStride = options.byteStride !== undefined ? options.byteStride : null;
        this.target = options.target || null;
    }

}
