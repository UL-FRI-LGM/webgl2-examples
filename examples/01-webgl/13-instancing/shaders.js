const vertex = `#version 300 es
layout (location = 0) in vec2 aPosition;
layout (location = 5) in vec4 aColor;

layout (location = 6) in vec2 aInstancePosition;
layout (location = 7) in float aInstanceRotation;
layout (location = 8) in float aInstanceScale;

out vec4 vColor;

void main() {
    vColor = aColor;

    float c = cos(aInstanceRotation);
    float s = sin(aInstanceRotation);
    mat2 instanceRotation = mat2(c, s, -s, c);

    vec2 position = instanceRotation * (aInstanceScale * aPosition) + aInstancePosition;
    gl_Position = vec4(position, 0, 1);
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
    instanced: { vertex, fragment }
};
