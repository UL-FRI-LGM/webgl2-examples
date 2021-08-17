const renderGeometryBufferVertex = `#version 300 es

uniform mat4 uViewModel;
uniform mat4 uProjection;

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

out vec4 vPosition;
out vec2 vTexCoord;
out vec3 vNormal;

void main() {
    vTexCoord = aTexCoord;
    vPosition = uViewModel * aPosition;
    vNormal = mat3(uViewModel) * aNormal;
    gl_Position = uProjection * vPosition;
}
`;

const renderGeometryBufferFragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec4 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;

layout (location = 0) out vec4 oColor;
layout (location = 1) out vec4 oPosition;
layout (location = 2) out vec3 oNormal;

void main() {
    oColor = texture(uTexture, vTexCoord);
    oPosition = vPosition;
    oNormal = normalize(vNormal);
}
`;

const ssaoVertex = `#version 300 es

layout (location = 0) in vec2 aPosition;

out vec2 vPosition;

void main() {
    vPosition = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0, 1);
}
`;

const ssaoFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler2DShadow;

uniform mat4 uProjection;
uniform float uDepthBias;
uniform float uOcclusionRange;
uniform float uOcclusionScale;
uniform int uOcclusionSampleCount;
uniform sampler2D uOcclusionSamples;
uniform sampler2D uPosition;
uniform sampler2D uNormal;

in vec2 vPosition;

layout (location = 0) out float oAmbient;

void main() {
    vec3 position = texture(uPosition, vPosition).xyz;
    vec3 normal = texture(uNormal, vPosition).xyz;

    float randomScale = 123.456789012345;
    float randomOffset = dot(vPosition, vec2(1, 1)) * randomScale;
    vec3 randomVector = texture(uOcclusionSamples, vec2(randomOffset, 0)).xyz;
    vec3 tangent = normalize(randomVector - normal * dot(randomVector, normal));
    vec3 bitangent = cross(normal, tangent);
    mat3 TBN = mat3(tangent, bitangent, -normal);

    float occlusion = 0.0;
    for (int i = 0; i < uOcclusionSampleCount; i++) {
        vec3 direction = texelFetch(uOcclusionSamples, ivec2(i, 0), 0).rgb;
        vec3 probe = position + TBN * direction * uOcclusionScale;
        vec4 probeProjection = uProjection * vec4(probe, 1);
        probeProjection /= probeProjection.w;
        float referenceDepth = texture(uPosition, probeProjection.xy * 0.5 + 0.5).z;
        float rangeCheck = smoothstep(0.0, 1.0, uOcclusionRange * uOcclusionScale / abs(position.z - referenceDepth));
        occlusion += referenceDepth > probe.z + uDepthBias ? rangeCheck : 0.0;
    }
    oAmbient = 1.0 - occlusion / float(uOcclusionSampleCount);
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

uniform float uOcclusionStrength;
uniform sampler2D uColor;
uniform sampler2D uAmbient;
uniform sampler2D uNormal;

in vec2 vPosition;

layout (location = 0) out vec4 oColor;

void main() {
    vec4 color = texture(uColor, vPosition);
    vec3 normal = texture(uNormal, vPosition).xyz;

    if (length(normal) > 1.5) {
        oColor = vec4(1);
        return;
    }

    float ambient = pow(texture(uAmbient, vPosition).r, uOcclusionStrength);
    oColor = color * vec4(vec3(ambient), 1);
}
`;

export const shaders = {
    renderGeometryBuffer: {
        vertex: renderGeometryBufferVertex,
        fragment: renderGeometryBufferFragment
    },
    ssao: {
        vertex: ssaoVertex,
        fragment: ssaoFragment
    },
    renderToCanvas: {
        vertex: renderToCanvasVertex,
        fragment: renderToCanvasFragment
    },
};
