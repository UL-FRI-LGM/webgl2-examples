export class Texture {

    constructor({
        image,
        sampler,
    } = {}) {
        this.image = image;
        this.sampler = sampler;
    }

    get width() {
        return this.image.width;
    }

    get height() {
        return this.image.height;
    }

}
