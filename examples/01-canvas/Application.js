export class Application {

    constructor(canvas, glOptions) {
        this._update = this._update.bind(this);
        this._render = this._render.bind(this);

        // We can pass in options, such as disabling the depth buffer,
        // disabling antialiasing, preserving the drawing buffer, etc.
        this.gl = canvas.getContext('webgl2', glOptions);
    }

    async init() {
        // Call the user-defined start method.
        await this.start();

        this._time = performance.now() / 1000;

        // The update loop should run as fast as possible.
        setInterval(this._update, 0);

        // The render loop should be synchronized with the screen.
        requestAnimationFrame(this._render);
    }

    _update() {
        // Measure the absolute time and time elapsed from the last
        // update frame. These are going to be useful for animations.
        const time = performance.now() / 1000;
        const dt = time - this._time;
        this._time = time;

        // Call the user-defined update method.
        this.update(time, dt);
    }

    _render() {
        // Check for resize on render, because elements do not
        // trigger a resize event. Windows do, but it might
        // not change the size of the canvas.
        this._resize();

        // Call the user-defined render method.
        this.render();

        // Request next render frame.
        requestAnimationFrame(this._render);
    }

    _resize() {
        const canvas = this.gl.canvas;
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

            // Call the user-defined resize method.
            this.resize(width, height);
        }
    }

    start() {
        // initialization code (including event handler binding)
    }

    update() {
        // update code (input, animations, AI ...)
    }

    render() {
        // render code (WebGL API calls)
    }

    resize() {
        // resize code (e.g. update projection matrix)
    }

}
