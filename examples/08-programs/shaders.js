const firstVertex = `#version 300 es
uniform vec2 uOffset;

in vec2 aPosition;
in vec4 aColor;

out vec4 vColor;

void main() {
    vColor = aColor;
    gl_Position = vec4(aPosition + uOffset, 0, 1);
}
`;

const firstFragment = `#version 300 es
precision mediump float;

in vec4 vColor;

out vec4 oColor;

void main() {
    oColor = vColor;
}
`;

const secondVertex = `#version 300 es
uniform vec2 uOffset;
uniform vec2 uScale;

in vec2 aPosition;
in vec4 aColor;

out vec4 vColor;

void main() {
    vColor = vec4(1) - aColor;
    vColor.a = 1.0;
    gl_Position = vec4(aPosition * uScale + uOffset, 0, 1);
}
`;

const secondFragment = `#version 300 es
precision mediump float;

in vec4 vColor;

out vec4 oColor;

void main() {
    oColor = vColor;
}
`;

export default {
    first: {
        vertex   : firstVertex,
        fragment : firstFragment
    },
    second: {
        vertex   : secondVertex,
        fragment : secondFragment
    }
};
