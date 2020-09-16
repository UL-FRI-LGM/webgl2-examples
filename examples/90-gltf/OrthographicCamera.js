import Camera from './Camera.js';

const mat4 = glMatrix.mat4;

export default class OrthographicCamera extends Camera {

    constructor(options = {}) {
        super(options);

        this.left = options.left || -1;
        this.right = options.right || 1;
        this.bottom = options.bottom || -1;
        this.top = options.top || 1;
        this.near = options.near || -1;
        this.far = options.far || 1;

        this.updateMatrix();
    }

    updateMatrix() {
        mat4.ortho(this.matrix,
            this.left, this.right,
            this.bottom, this.top,
            this.near, this.far);
    }

}
