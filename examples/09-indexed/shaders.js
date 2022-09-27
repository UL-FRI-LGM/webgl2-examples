const vertex = `#version 300 es
layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec4 aColor;

uniform mat4 uModelViewProjection;
uniform bool uPerspectiveCorrect;

out vec4 vColor;

void main() {
    vColor = aColor;
    gl_Position = uModelViewProjection * aPosition;

    if (!uPerspectiveCorrect) {
        gl_Position /= gl_Position.w;
    }
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
    simple: { vertex, fragment }
};
