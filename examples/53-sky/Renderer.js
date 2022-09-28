import { vec3, mat4 } from '../../lib/gl-matrix-module.js';

import { WebGL } from '../../common/engine/WebGL.js';

import { shaders } from './shaders.js';

export class Renderer {

    constructor(gl) {
        this.gl = gl;

        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('OES_texture_float_linear');

        Object.assign(this, {
            // geometry
            planetRadius: 6360e3,
            atmosphereRadius: 6420e3,
            cameraAltitude: 100,
            sunHeight: 0.02,

            // physics
            sunIntensity: 20,
            mieScatteringAnisotropy: 0.76,
            mieScatteringCoefficient: [21e-6, 21e-6, 21e-6],
            mieDensityScale: 400,
            rayleighScatteringCoefficient: [3.8e-6, 13.5e-6, 33.1e-6],
            rayleighDensityScale: 2000,

            // integration
            primaryRaySamples: 32,
            secondaryRaySamples: 8,
        });

        this.programs = WebGL.buildPrograms(gl, shaders);

        this.createSkyBuffer();
    }

    createSkyBuffer() {
        const gl = this.gl;

        if (this.sky) {
            gl.deleteFramebuffer(this.sky.framebuffer);
            gl.deleteTexture(this.sky.texture);
        }

        const size = {
            width: 512,
            height: 512,
        };

        const sampling = {
            min: gl.LINEAR,
            mag: gl.LINEAR,
            wrapS: gl.CLAMP_TO_EDGE,
            wrapT: gl.CLAMP_TO_EDGE,
        };

        const format = {
            format: gl.RGBA,
            iformat: gl.RGBA16F,
            type: gl.FLOAT,
        };

        const texture = WebGL.createTexture(gl, {
            ...size,
            ...sampling,
            ...format,
        });

        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        this.sky = {
            texture,
            framebuffer,
            size,
        };
    }

    render(camera) {
        this.renderNishita();
        this.renderSkybox(camera);
    }

    renderNishita() {
        const gl = this.gl;

        const { framebuffer, size } = this.sky;
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.viewport(0, 0, size.width, size.height);

        const { program, uniforms } = this.programs.nishita;
        gl.useProgram(program);

        // geometry
        gl.uniform1f(uniforms.uPlanetRadius, this.planetRadius);
        gl.uniform1f(uniforms.uAtmosphereRadius, this.atmosphereRadius);
        gl.uniform1f(uniforms.uCameraAltitude, this.cameraAltitude);
        const sunAngle = this.sunHeight * Math.PI / 2;
        gl.uniform3fv(uniforms.uSunDirection, [0, Math.sin(sunAngle), Math.cos(sunAngle)]);

        // physics
        gl.uniform1f(uniforms.uSunIntensity, this.sunIntensity);
        gl.uniform1f(uniforms.uMieScatteringAnisotropy, this.mieScatteringAnisotropy);
        gl.uniform3fv(uniforms.uMieScatteringCoefficient, this.mieScatteringCoefficient);
        gl.uniform1f(uniforms.uMieDensityScale, this.mieDensityScale);
        gl.uniform3fv(uniforms.uRayleighScatteringCoefficient, this.rayleighScatteringCoefficient);
        gl.uniform1f(uniforms.uRayleighDensityScale, this.rayleighDensityScale);

        // integration
        gl.uniform1ui(uniforms.uPrimaryRaySamples, this.primaryRaySamples);
        gl.uniform1ui(uniforms.uSecondaryRaySamples, this.secondaryRaySamples);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    renderSkybox(camera) {
        const gl = this.gl;

        const { program, uniforms } = this.programs.skybox;
        gl.useProgram(program);

        const viewMatrix = camera.globalMatrix;
        const unprojectMatrix = mat4.clone(camera.projection);
        mat4.invert(unprojectMatrix, unprojectMatrix);
        mat4.multiply(unprojectMatrix, viewMatrix, unprojectMatrix);

        gl.uniformMatrix4fv(uniforms.uUnprojectMatrix, false, unprojectMatrix);

        const size = {
            width: gl.drawingBufferWidth,
            height: gl.drawingBufferHeight,
        };

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, size.width, size.height);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.sky.texture);
        gl.uniform1i(uniforms.uSkybox, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

}
