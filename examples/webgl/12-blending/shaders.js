const vertex = `#version 300 es
uniform vec2 uOffset;

layout (location = 0) in vec2 aPosition;
layout (location = 3) in vec2 aTexCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(aPosition + uOffset, 0, 1);
}
`;

const fragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord);
    oColor.a *= 0.05;
}
`;

export const shaders = {
    textured: { vertex, fragment }
};
