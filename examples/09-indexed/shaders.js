const vertex = `#version 300 es
layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec4 aColor;

uniform mat4 uModelViewProjection;

out vec4 vColor;

void main() {
    vColor = aColor;
    gl_Position = uModelViewProjection * aPosition;
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

export default {
    simple: { vertex, fragment }
};
