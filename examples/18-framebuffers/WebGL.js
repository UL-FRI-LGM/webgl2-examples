export function createShader(gl, source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const status = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!status) {
        const log = gl.getShaderInfoLog(shader);
        throw new Error('Cannot compile shader\nInfo log:\n' + log);
    }
    return shader;
}

export function createProgram(gl, shaders) {
    const program = gl.createProgram();
    for (let shader of shaders) {
        gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    const status = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!status) {
        const log = gl.getProgramInfoLog(program);
        throw new Error('Cannot link program\nInfo log:\n' + log);
    }

    let attributes = {};
    const activeAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < activeAttributes; i++) {
        const info = gl.getActiveAttrib(program, i);
        attributes[info.name] = gl.getAttribLocation(program, info.name);
    }

    let uniforms = {};
    const activeUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < activeUniforms; i++) {
        const info = gl.getActiveUniform(program, i);
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
    }

    return { program, attributes, uniforms };
}

export function buildPrograms(gl, shaders) {
    var programs = {};
    for (let name in shaders) {
        try {
            var program = shaders[name];
            programs[name] = createProgram(gl, [
                createShader(gl, program.vertex, gl.VERTEX_SHADER),
                createShader(gl, program.fragment, gl.FRAGMENT_SHADER)
            ]);
        } catch (err) {
            throw new Error('Error compiling ' + name + '\n' + err);
        }
    }
    return programs;
}

export function createTexture(gl, options) {
    const target  = options.target  || gl.TEXTURE_2D;
    const iformat = options.iformat || gl.RGBA;
    const format  = options.format  || gl.RGBA;
    const type    = options.type    || gl.UNSIGNED_BYTE;
    const texture = options.texture || gl.createTexture();

    if (typeof options.unit !== 'undefined') {
        gl.activeTexture(gl.TEXTURE0 + options.unit);
    }

    gl.bindTexture(target, texture);

    if (options.image) {
        gl.texImage2D(
            target, 0, iformat,
            format, type, options.image);
    } else {
        // if options.data == null, just allocate
        gl.texImage2D(
            target, 0, iformat,
            options.width, options.height, 0,
            format, type, options.data);
    }

    if (options.wrapS) { gl.texParameteri(target, gl.TEXTURE_WRAP_S, options.wrapS); }
    if (options.wrapT) { gl.texParameteri(target, gl.TEXTURE_WRAP_T, options.wrapT); }
    if (options.min) { gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, options.min); }
    if (options.mag) { gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, options.mag); }
    if (options.mip) { gl.generateMipmap(target); }

    return texture;
}
