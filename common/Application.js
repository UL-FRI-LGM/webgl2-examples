export default class Application {

    constructor(canvas) {
        this._update = this._update.bind(this);

        this.canvas = canvas;
        this._initGL();
        this.start();

        requestAnimationFrame(this._update);
    }

    _initGL() {
        // Try to create a WebGL 2.0 context.
        // We need both a try-catch and a null check.
        this.gl = null;
        try {
            this.gl = this.canvas.getContext('webgl2', {
                // options, such as disabling the depth buffer
            });
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
        if (canvas.width !== canvas.clientWidth ||
            canvas.height !== canvas.clientHeight)
        {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
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
