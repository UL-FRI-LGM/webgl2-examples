const perVertexVertexShader = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 uLightColor;
uniform vec3 uLightDirection;

out vec2 vTexCoord;
out vec3 vDiffuseLight;

void main() {
    vec3 N = normalize(mat3(uModelMatrix) * aNormal);
    vec3 L = uLightDirection;

    float lambert = max(0.0, dot(L, N));

    vDiffuseLight = lambert * uLightColor;
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * (uViewMatrix * (uModelMatrix * vec4(aPosition, 1)));
}
`;

const perVertexFragmentShader = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vTexCoord;
in vec3 vDiffuseLight;

out vec4 oColor;

void main() {
    vec4 baseColor = texture(uTexture, vTexCoord);
    vec3 finalColor = baseColor.rgb * vDiffuseLight;
    oColor = pow(vec4(finalColor, 1), vec4(1.0 / 2.2));
}
`;

const perFragmentVertexShader = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vNormal = mat3(uModelMatrix) * aNormal;
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * (uViewMatrix * (uModelMatrix * vec4(aPosition, 1)));
}
`;

const perFragmentFragmentShader = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

uniform vec3 uLightColor;
uniform vec3 uLightDirection;

in vec3 vNormal;
in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = uLightDirection;

    float lambert = max(0.0, dot(L, N));

    vec3 diffuseLight = lambert * uLightColor;

    vec4 baseColor = texture(uTexture, vTexCoord);
    vec3 finalColor = baseColor.rgb * diffuseLight;
    oColor = pow(vec4(finalColor, 1), vec4(1.0 / 2.2));
}
`;

export const shaders = {
    perVertex: {
        vertex: perVertexVertexShader,
        fragment: perVertexFragmentShader,
    },
    perFragment: {
        vertex: perFragmentVertexShader,
        fragment: perFragmentFragmentShader,
    },
};
