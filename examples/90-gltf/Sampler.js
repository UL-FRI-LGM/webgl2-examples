export class Sampler {

    constructor(options = {}) {
        this.mag = options.mag || 9729;
        this.min = options.min || 9729;
        this.wrapS = options.wrapS || 10497;
        this.wrapT = options.wrapT || 10497;
    }

}
