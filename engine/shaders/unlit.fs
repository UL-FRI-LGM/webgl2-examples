#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseTexture;
uniform vec4 uBaseFactor;

in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec4 baseColor = texture(uBaseTexture, vTexCoord);
    oColor = uBaseFactor * baseColor;
}
