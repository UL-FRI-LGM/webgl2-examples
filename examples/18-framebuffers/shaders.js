const simpleVertex = `#version 300 es
layout (location = 0) in vec2 aPosition;

uniform mat2 uTransform;

void main() {
    gl_Position = vec4(uTransform * aPosition, 0, 1);
}
`;

const simpleFragment = `#version 300 es
precision mediump float;

out vec4 oColor;

void main() {
    oColor = vec4(1, 0, 0, 1);
}
`;

const texturedVertex = `#version 300 es
layout (location = 0) in vec2 aPosition;
layout (location = 1) in vec2 aTexCoord;

uniform mat2 uTransform;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = vec4(uTransform * aPosition, 0, 1);
}
`;

const texturedFragment = `#version 300 es
precision mediump float;

uniform sampler2D uTexture;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord);
}
`;

export default {
    simple: {
        vertex   : simpleVertex,
        fragment : simpleFragment
    },
    textured: {
        vertex   : texturedVertex,
        fragment : texturedFragment
    }
};
