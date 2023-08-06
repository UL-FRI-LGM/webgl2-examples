#version 300 es

layout (location = 0) in vec4 aPosition;
layout (location = 1) in vec2 aTexCoord;

uniform mat4 uModelViewProjection;

out vec2 vTexCoord;

void main() {
    vTexCoord = aTexCoord;
    gl_Position = uModelViewProjection * aPosition;
}
