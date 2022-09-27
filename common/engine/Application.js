export class Application {

    constructor(canvas, glOptions) {
        this._update = this._update.bind(this);

        this.canvas = canvas;
        this._initGL(glOptions);
    }

    async init() {
        await this.start();
        requestAnimationFrame(this._update);
    }

    _initGL(glOptions) {
        this.gl = null;
        try {
            this.gl = this.canvas.getContext('webgl2', glOptions);
        } catch (error) {
        }

        if (!this.gl) {
            console.log('Cannot create WebGL 2.0 context');
        }
    }

    _update() {
        this._resize();
        this.update();
        this.render();
        requestAnimationFrame(this._update);
    }

    _resize() {
        const canvas = this.canvas;
        const gl = this.gl;

        const pixelRatio = window.devicePixelRatio;
        const width = pixelRatio * canvas.clientWidth;
        const height = pixelRatio * canvas.clientHeight;

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

            this.resize();
        }
    }

    start() {
        // initialization code (including event handler binding)
    }

    update() {
        // update code (input, animations, AI ...)
    }

    render() {
        // render code (gl API calls)
    }

    resize() {
        // resize code (e.g. update projection matrix)
    }

}
