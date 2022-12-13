const vertex = `#version 300 es

const vec2 vertices[] = vec2[](
    vec2( 0.0,  0.5), // vertex 0 position
    vec2(-0.5, -0.5), // vertex 1 position
    vec2( 0.5, -0.5)  // vertex 2 position
);

void main() {
    vec2 position = vertices[gl_VertexID];
    gl_Position = vec4(position, 0, 1);
}
`;

const fragment = `#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(1.0, 0.6, 0.2, 1.0);
}
`;

export const shaders = {
    orange: { vertex, fragment }
};
