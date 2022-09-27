class Application {

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
        // Try to create a WebGL 2.0 context.
        // We need both a try-catch and a null check.
        this.gl = null;
        try {
            // We can pass in options, such as disabling the depth buffer,
            // disabling antialiasing, preserving the drawing buffer, etc.
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
        // Check for resize on RAF, because elements do not
        // trigger a resize event. Windows do, but it might
        // not change the size of the canvas.
        const canvas = this.canvas;
        const gl = this.gl;

        // A CSS pixel is not the same as a physical pixel.
        // Compute the size in physical pixels.
        const pixelRatio = window.devicePixelRatio;
        const width = pixelRatio * canvas.clientWidth;
        const height = pixelRatio * canvas.clientHeight;

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            // Change the drawing region to reflect the canvas size.
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

        const gl = this.gl;
        gl.clearColor(0.3, 0.4, 0.9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }

    resize() {
        // resize code (e.g. update projection matrix)
    }

}

const canvas = document.querySelector('canvas');
const app = new Application(canvas);
await app.init();
document.querySelector('.loader-container').remove();
