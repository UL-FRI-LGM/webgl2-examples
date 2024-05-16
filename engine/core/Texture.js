export class Texture {

    constructor({
        image,
        sampler,
        isSRGB = false,
    } = {}) {
        this.image = image;
        this.sampler = sampler;
        this.isSRGB = isSRGB;
    }

    get width() {
        return this.image.width;
    }

    get height() {
        return this.image.height;
    }

}
