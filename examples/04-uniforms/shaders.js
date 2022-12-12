const vertex = `#version 300 es

uniform vec2 uOffset;

const vec2 vertices[] = vec2[](
    vec2( 0.0,  0.5),
    vec2(-0.5, -0.5),
    vec2( 0.5, -0.5)
);

void main() {
    vec2 position = vertices[gl_VertexID];
    gl_Position = vec4(position + uOffset, 0, 1);
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
