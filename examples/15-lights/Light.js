import { Node } from './Node.js';

export class Light extends Node {

    constructor() {
        super();

        this.color = [255, 255, 255];
        this.intensity = 1;
        this.attenuation = [0.001, 0, 0.3];
    }

}