export class Accessor {

    constructor({
        buffer,
        viewLength,
        viewOffset = 0,
        offset = 0,
        stride = componentSize,

        componentType = 'int',
        componentCount = 1,
        componentSize = 1,
        componentSigned = false,
        componentNormalized = false,
    } = {}) {
        this.buffer = buffer;
        this.offset = offset;
        this.stride = stride;

        this.componentType = componentType;
        this.componentCount = componentCount;
        this.componentSize = componentSize;
        this.componentSigned = componentSigned;
        this.componentNormalized = componentNormalized;

        const viewType = this.getViewType({
            componentType,
            componentSize,
            componentSigned,
        });

        if (viewLength !== undefined) {
            this.view = new viewType(buffer, viewOffset, viewLength / viewType.BYTES_PER_ELEMENT);
        } else {
            this.view = new viewType(buffer, viewOffset);
        }

        this.offsetInElements = offset / viewType.BYTES_PER_ELEMENT;
        this.strideInElements = stride / viewType.BYTES_PER_ELEMENT;

        this.count = Math.floor((this.view.length - this.offsetInElements) / this.strideInElements);

        this.normalize = this.getNormalizer({
            componentType,
            componentSize,
            componentSigned,
            componentNormalized,
        });

        this.denormalize = this.getDenormalizer({
            componentType,
            componentSize,
            componentSigned,
            componentNormalized,
        });
    }

    get(index) {
        const start = index * this.strideInElements + this.offsetInElements;
        const end = start + this.componentCount;
        return [...this.view.slice(start, end)].map(this.normalize);
    }

    set(index, value) {
        const start = index * this.strideInElements + this.offsetInElements;
        this.view.set(value.map(this.denormalize), start);
    }

    getNormalizer({
        componentType,
        componentSize,
        componentSigned,
        componentNormalized,
    }) {
        if (!componentNormalized || componentType === 'float') {
            return x => x;
        }

        const multiplier = componentSigned
            ? 2 ** ((componentSize * 8) - 1) - 1
            : 2 ** (componentSize * 8) - 1;

        return x => Math.max(x / multiplier, -1);
    }

    getDenormalizer({
        componentType,
        componentSize,
        componentSigned,
        componentNormalized,
    }) {
        if (!componentNormalized || componentType === 'float') {
            return x => x;
        }

        const multiplier = componentSigned
            ? 2 ** ((componentSize * 8) - 1) - 1
            : 2 ** (componentSize * 8) - 1;

        const min = componentSigned ? -1 : 0;
        const max = 1;

        return x => Math.floor(0.5 + multiplier * Math.min(Math.max(x, min), max));
    }

    getViewType({
        componentType,
        componentSize,
        componentSigned,
    }) {
        if (componentType === 'float') {
            if (componentSize === 4) {
                return Float32Array;
            }
        } else if (componentType === 'int') {
            if (componentSigned) {
                switch (componentSize) {
                    case 1: return Int8Array;
                    case 2: return Int16Array;
                    case 4: return Int32Array;
                }
            } else {
                switch (componentSize) {
                    case 1: return Uint8Array;
                    case 2: return Uint16Array;
                    case 4: return Uint32Array;
                }
            }
        }
    }

}
