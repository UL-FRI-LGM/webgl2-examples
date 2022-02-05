const skyboxVertex = `#version 300 es
layout (location = 0) in vec3 aPosition;

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vPosition;

void main() {
    vPosition = aPosition;
    vec3 rotated = mat3(uViewMatrix) * aPosition;
    vec4 projected = uProjectionMatrix * vec4(rotated, 1);
    gl_Position = projected.xyww;
}
`;

const skyboxFragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uEnvmap;

in vec3 vPosition;

out vec4 oColor;

vec2 directionToTexcoord(vec3 v) {
    const float PI = 3.14159265358979;
    return vec2((atan(v.z, v.x) / PI) * 0.5 + 0.5, acos(v.y) / PI);
}

void main() {
    oColor = texture(uEnvmap, directionToTexcoord(normalize(vPosition)));
}
`;

const envmapVertex = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vPosition;
out vec2 vTexCoord;
out vec3 vNormal;

void main() {
    vec3 surfacePosition = (uModelMatrix * vec4(aPosition, 1)).xyz;

    vPosition = surfacePosition;
    vNormal = mat3(uModelMatrix) * aNormal;
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * (uViewMatrix * vec4(surfacePosition, 1));
}
`;

const envmapFragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform mediump sampler2D uEnvmap;

uniform vec3 uCameraPosition;
uniform float uReflectance;
uniform float uTransmittance;
uniform float uIOR;
uniform float uEffect;

in vec3 vPosition;
in vec2 vTexCoord;
in vec3 vNormal;

out vec4 oColor;

vec2 directionToTexcoord(vec3 v) {
    const float PI = 3.14159265358979;
    return vec2((atan(v.z, v.x) / PI) * 0.5 + 0.5, acos(v.y) / PI);
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPosition - vPosition);
    vec3 R = reflect(-V, N);
    vec3 T = refract(-V, N, uIOR);

    vec4 surfaceColor = texture(uTexture, vTexCoord);
    vec4 reflectedColor = texture(uEnvmap, directionToTexcoord(R));
    vec4 refractedColor = texture(uEnvmap, directionToTexcoord(T));

    vec4 reflection = mix(surfaceColor, reflectedColor, uReflectance);
    vec4 refraction = mix(surfaceColor, refractedColor, uTransmittance);

    oColor = mix(reflection, refraction, uEffect);
}
`;

export const shaders = {
    skybox: {
        vertex: skyboxVertex,
        fragment: skyboxFragment,
    },
    envmap: {
        vertex: envmapVertex,
        fragment: envmapFragment,
    },
};
