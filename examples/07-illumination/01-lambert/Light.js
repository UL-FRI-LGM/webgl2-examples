export class Light {

    constructor({
        color = [255, 255, 255],
        direction = [0, 0, 1],
    } = {}) {
        this.color = color;
        this.direction = direction;
    }

}
