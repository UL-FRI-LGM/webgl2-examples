export class Application {

    constructor(canvas, glOptions) {
        this._update = this._update.bind(this);
        this._render = this._render.bind(this);

        this.gl = canvas.getContext('webgl2', glOptions);
    }

    async init() {
        await this.start();

        this._time = performance.now() / 1000;

        setInterval(this._update, 0);
        requestAnimationFrame(this._render);
    }

    _update() {
        const time = performance.now() / 1000;
        const dt = time - this._time;
        this._time = time;

        this.update(time, dt);
    }

    _render() {
        this._resize();
        this.render();
        requestAnimationFrame(this._render);
    }

    _resize() {
        const canvas = this.gl.canvas;
        const gl = this.gl;

        const pixelRatio = window.devicePixelRatio;
        const width = pixelRatio * canvas.clientWidth;
        const height = pixelRatio * canvas.clientHeight;

        if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

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
        // render code (gl API calls)
    }

    resize() {
        // resize code (e.g. update projection matrix)
    }

}
