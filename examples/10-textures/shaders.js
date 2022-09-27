const vertex = `#version 300 es
layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;

uniform mat4 uModelViewProjection;
uniform bool uPerspectiveCorrect;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;

    if (!uPerspectiveCorrect) {
        gl_Position /= gl_Position.w;
    }
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;
uniform float uTextureScale;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord * uTextureScale);
}
`;

export const shaders = {
    simple: { vertex, fragment }
};
