const renderGeometryBufferVertex = `#version 300 es

uniform mat4 uProjectionViewModel;

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uProjectionViewModel * aPosition;
}
`;

const renderGeometryBufferFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uDiffuse;
uniform sampler2D uEmission;

uniform float uEmissionStrength;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec3 diffuse = texture(uDiffuse, vTexCoord).rgb;
    vec3 emission = texture(uEmission, vTexCoord).rgb;

    oColor = vec4(diffuse + uEmissionStrength * emission, 1);
}
`;

const renderBloomVertex = `#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}
`;

const renderBloomFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uColor;
uniform float uBloomThreshold;
uniform float uBloomStepWidth;

in vec2 vPosition;

layout (location = 0) out vec4 oColor;

void main() {
    vec3 color = texture(uColor, vPosition).rgb;
    vec3 brightnessFactors = vec3(0.2126, 0.7152, 0.0722);
    float brightness = dot(pow(color, vec3(1.0 / 2.2)), brightnessFactors);
    float minBrightness = uBloomThreshold - uBloomStepWidth * 0.5;
    float maxBrightness = uBloomThreshold + uBloomStepWidth * 0.5;
    oColor = vec4(smoothstep(minBrightness, maxBrightness, brightness) * color, 1);
}
`;

const renderBlurVertex = `#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}
`;

const renderBlurFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uColor;
uniform vec2 uDirection;

in vec2 vPosition;

layout (location = 0) out vec4 oColor;

const float offset[5] = float[](0.0, 1.0, 2.0, 3.0, 4.0);
const float weight[5] = float[](
    0.2270270270,
    0.1945945946,
    0.1216216216,
    0.0540540541,
    0.0162162162);

void main() {
    vec4 color = texture(uColor, vPosition) * weight[0];
    for (int i = 1; i < 5; i++) {
        color += texture(uColor, vPosition + uDirection * offset[i]) * weight[i];
        color += texture(uColor, vPosition - uDirection * offset[i]) * weight[i];
    }
    oColor = color;
}
`;

const renderToCanvasVertex = `#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}
`;

const renderToCanvasFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uColor;
uniform sampler2D uBloom;
uniform float uExposure;

in vec2 vPosition;

layout (location = 0) out vec4 oColor;

float reinhard(float x) {
    return x / (1.0 + x);
}

vec3 reinhard(vec3 x) {
    return x / (1.0 + x);
}

vec3 rgb2ycc(vec3 x) {
    const mat3 m = mat3(
        0.2126, 0.7152, 0.0722,
        -0.1146, -0.3854, 0.5,
        0.5, -0.4542, -0.0458
    );

    return m * x;
}

vec3 ycc2rgb(vec3 x) {
    const mat3 m = mat3(
        1, 0, 1.5748,
        1, -0.1873, -0.4681,
        1, 1.8556, 0
    );

    return m * x;
}

vec3 rgb2xyz(vec3 x) {
    const mat3 m = mat3(
        0.4124564,  0.3575761,  0.1804375,
        0.2126729,  0.7151522,  0.0721750,
        0.0193339,  0.1191920,  0.9503041);

    return m * x;
}

vec3 xyz2rgb(vec3 x) {
    const mat3 m = mat3(
        3.2404542, -1.5371385, -0.4985314,
       -0.9692660,  1.8760108,  0.0415560,
        0.0556434, -0.2040259,  1.0572252);

    return m * x;
}

vec3 xyz2xyy(vec3 x) {
    float sum = dot(x, vec3(1));
    return vec3(
        x.x / sum,
        x.y,
        x.y / sum);
}

vec3 xyy2xyz(vec3 x) {
    return x.y * vec3(
        x.x / x.z,
        1.0,
        (1.0 - x.x - x.z) / x.z);
}

void main() {
    vec3 color = texture(uColor, vPosition).rgb;
    vec3 bloom = texture(uBloom, vPosition).rgb;

    //oColor = vec4((color + bloom) * uExposure, 1);

    vec3 totalRGB = color + bloom;
    vec3 totalYCC = rgb2ycc(totalRGB);
    vec3 totalXYZ = rgb2xyz(totalRGB);
    vec3 totalXYY = xyz2xyy(totalXYZ);

    vec3 tonemappedRGB = totalRGB * uExposure;
    //vec3 tonemappedRGB = reinhard(totalRGB * uExposure);

    //totalYCC.x = reinhard(totalYCC.x * uExposure);
    //vec3 tonemappedRGB = ycc2rgb(totalYCC);

    //totalXYZ = reinhard(totalXYZ * uExposure);
    //vec3 tonemappedRGB = xyz2rgb(totalXYZ);

    //totalXYY.y = reinhard(totalXYY.y * uExposure);
    //vec3 tonemappedRGB = xyz2rgb(xyy2xyz(totalXYY));

    vec3 gammaCorrectedRGB = pow(tonemappedRGB, vec3(1.0 / 2.2));
    oColor = vec4(gammaCorrectedRGB, 1);
}
`;

export const shaders = {
    renderGeometryBuffer: {
        vertex: renderGeometryBufferVertex,
        fragment: renderGeometryBufferFragment,
    },
    renderBloom: {
        vertex: renderBloomVertex,
        fragment: renderBloomFragment,
    },
    renderBlur: {
        vertex: renderBlurVertex,
        fragment: renderBlurFragment,
    },
    renderToCanvas: {
        vertex: renderToCanvasVertex,
        fragment: renderToCanvasFragment,
    },
};
