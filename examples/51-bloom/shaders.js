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
uniform float uExposure;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec3 diffuse = texture(uDiffuse, vTexCoord).rgb;
    vec3 emission = texture(uEmission, vTexCoord).rgb;

    vec3 color = diffuse + uEmissionStrength * emission;
    oColor = vec4(color * uExposure, 1);
}
`;

const renderBrightVertex = `#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}
`;

const renderBrightFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uColor;
uniform float uBloomThreshold;
uniform float uBloomKnee;

in vec2 vPosition;

out vec4 oColor;

void main() {
    vec4 color = texture(uColor, vPosition);
    float brightness = dot(color.rgb, vec3(0.2126, 0.7152, 0.0722));

    const float epsilon = 1e-4;
    float knee = uBloomThreshold * uBloomKnee;
    float source = brightness - uBloomThreshold + knee;
    source = clamp(source, 0.0, 2.0 * knee);
    source = source * source / (4.0 * knee + epsilon);
    float weight = max(brightness - uBloomThreshold, source) / max(brightness, epsilon);

    oColor = vec4(color.rgb * weight, 1);
}
`;

const downsampleAndBlurVertex = `#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}
`;

const downsampleAndBlurFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uColor;

in vec2 vPosition;

out vec4 oColor;

vec4 sampleTexture(sampler2D sampler, vec2 position) {
    vec2 texelSize = vec2(1) / vec2(textureSize(sampler, 0));
    vec4 offset = texelSize.xyxy * vec2(-1, 1).xxyy;
    return 0.25 * (
        texture(sampler, position + offset.xy) +
        texture(sampler, position + offset.zy) +
        texture(sampler, position + offset.xw) +
        texture(sampler, position + offset.zw));
}

void main() {
    oColor = sampleTexture(uColor, vPosition);
}
`;

const upsampleAndCombineVertex = `#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}
`;

const upsampleAndCombineFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uColor;
uniform float uBloomIntensity;

in vec2 vPosition;

out vec4 oColor;

void main() {
    oColor = vec4(texture(uColor, vPosition).rgb, uBloomIntensity);
}
`;

const renderToCanvasVertex = `#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}
`;

const renderToCanvasFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uColor;
uniform float uExposure;
uniform float uGamma;

in vec2 vPosition;

out vec4 oColor;

void main() {
    vec4 color = texture(uColor, vPosition) * uExposure;
    oColor = vec4(pow(color.rgb, vec3(1.0 / uGamma)), 1);
}
`;

export const shaders = {
    renderGeometryBuffer: {
        vertex: renderGeometryBufferVertex,
        fragment: renderGeometryBufferFragment,
    },
    renderBright: {
        vertex: renderBrightVertex,
        fragment: renderBrightFragment,
    },
    downsampleAndBlur: {
        vertex: downsampleAndBlurVertex,
        fragment: downsampleAndBlurFragment,
    },
    upsampleAndCombine: {
        vertex: upsampleAndCombineVertex,
        fragment: upsampleAndCombineFragment,
    },
    renderToCanvas: {
        vertex: renderToCanvasVertex,
        fragment: renderToCanvasFragment,
    },
};
