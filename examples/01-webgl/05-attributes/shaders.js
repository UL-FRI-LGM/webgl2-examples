const vertex = `#version 300 es

uniform vec2 uOffset;

in vec2 aPosition;

void main() {
    gl_Position = vec4(aPosition + uOffset, 0, 1);
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform vec4 uColor;

out vec4 oColor;

void main() {
    oColor = uColor;
}
`;

export const shaders = {
    test: { vertex, fragment }
};
