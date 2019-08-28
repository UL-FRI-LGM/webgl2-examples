const vertex = `#version 300 es

// POSITION   : 0,
// NORMAL     : 1,
// TANGENT    : 2,
// TEXCOORD_0 : 3,
// TEXCOORD_1 : 4,
// COLOR_0    : 5,
// JOINTS_0   : 6,
// WEIGHTS_0  : 7,

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

uniform mediump sampler2D uTexture;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord);
}
`;

export default {
    simple: { vertex, fragment }
};
