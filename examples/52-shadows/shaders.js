const renderShadowsVertex = `#version 300 es

uniform mat4 uLightMatrix;
uniform mat4 uModelMatrix;

layout (location = 0) in vec4 aPosition;

void main() {
    gl_Position = uLightMatrix * uModelMatrix * aPosition;
}
`;

const renderShadowsFragment = `#version 300 es
void main() {}
`;

const renderGeometryVertex = `#version 300 es

uniform mat4 uModelMatrix;
uniform mat4 uCameraMatrix;

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

out vec4 vPosition;
out vec2 vTexCoord;
out vec3 vNormal;

void main() {
    vTexCoord = aTexCoord;
    vPosition = uModelMatrix * aPosition;
    vNormal = mat3(uModelMatrix) * aNormal;
    gl_Position = uCameraMatrix * vPosition;
}
`;

const renderGeometryFragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;
precision mediump sampler2DShadow;

uniform sampler2D uTexture;
uniform sampler2DShadow uDepth;
uniform mat4 uLightMatrix;

in vec4 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;

out vec4 oColor;

void main() {
    vec4 lightSpacePosition = uLightMatrix * vPosition;
    lightSpacePosition /= lightSpacePosition.w;
    lightSpacePosition.xyz = lightSpacePosition.xyz * 0.5 + 0.5;
    float shadowFactor = texture(uDepth, lightSpacePosition.xyz);

    vec3 lightSpaceNormal = normalize(mat3(uLightMatrix) * vNormal);
    float lambertFactor = max(0.0, lightSpaceNormal.z);

    float shading = mix(0.2, 1.0, lambertFactor * shadowFactor);
    oColor = texture(uTexture, vTexCoord) * vec4(vec3(shading), 1);
}
`;

export const shaders = {
    renderGeometry: {
        vertex: renderGeometryVertex,
        fragment: renderGeometryFragment,
    },
    renderShadows: {
        vertex: renderShadowsVertex,
        fragment: renderShadowsFragment,
    },
};
