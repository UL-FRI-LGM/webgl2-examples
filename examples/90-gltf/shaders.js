const vertex = `#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 3) in vec2 aTexCoord;

uniform mat4 uModelViewProjection;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;
}
`;

const fragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseColorTexture;
uniform vec4 uBaseColorFactor;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec4 baseColor = texture(uBaseColorTexture, vTexCoord);
    oColor = uBaseColorFactor * baseColor;
}
`;

export const shaders = {
    simple: { vertex, fragment }
};
