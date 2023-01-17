const vertex = `#version 300 es
uniform vec2 uOffset;

layout (location = 0) in vec2 aPosition;
layout (location = 5) in vec4 aColor;

out vec4 vColor;

void main() {
    vColor = aColor;
    gl_Position = vec4(aPosition + uOffset, 0, 1);
}
`;

const fragment = `#version 300 es
precision mediump float;

in vec4 vColor;

out vec4 oColor;

void main() {
    oColor = vColor;
}
`;

export const shaders = {
    colored: { vertex, fragment }
};
