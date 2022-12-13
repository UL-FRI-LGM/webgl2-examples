const vertex = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in mat3 aTexCoordMatrix;
layout (location = 5) in mat4 aInstanceMatrix;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec2 vTexCoord;

void main() {
    vTexCoord = (aTexCoordMatrix * vec3(aTexCoord, 1)).xy;
    gl_Position =
        uProjectionMatrix * (
        uViewMatrix * (
        uModelMatrix * (
        aInstanceMatrix * (
        vec4(aPosition, 1)))));
}
`;

const fragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec4 albedo = texture(uTexture, vTexCoord);
    if (albedo.a < 0.5) discard;
    oColor = vec4(albedo.rgb, 1);
}
`;

export const shaders = {
    instanced: { vertex, fragment }
};
