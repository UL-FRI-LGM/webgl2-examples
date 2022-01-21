const perVertexVertexShader = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

uniform vec3 uCameraPosition;

uniform vec3 uLightColor;
uniform vec3 uLightPosition;
uniform vec3 uLightAttenuation;

uniform float uMaterialShininess;
uniform float uMaterialSpecular;

out vec2 vTexCoord;
out vec3 vLight;

void main() {
    vec3 surfacePosition = (uModelMatrix * vec4(aPosition, 1)).xyz;

    float d = distance(surfacePosition, uLightPosition);
    float attenuation = 1.0 / dot(uLightAttenuation, vec3(1, d, d * d));

    vec3 N = normalize(mat3(uModelMatrix) * aNormal);
    vec3 L = normalize(uLightPosition - surfacePosition);
    vec3 E = normalize(uCameraPosition - surfacePosition);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.0, dot(L, N));
    float phong = pow(max(0.0, dot(E, R)), uMaterialShininess) * uMaterialSpecular;

    vLight = ((lambert + phong) * attenuation) * uLightColor;
    vTexCoord = aTexCoord;
    gl_Position = uProjectionMatrix * (uViewMatrix * vec4(surfacePosition, 1));
}
`;

const perVertexFragmentShader = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vTexCoord;
in vec3 vLight;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord) * vec4(vLight, 1);
}
`;

const perFragmentVertexShader = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal;

uniform mat4 uModelMatrix;
uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;

out vec3 vPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vPosition = (uModelMatrix * vec4(aPosition, 1)).xyz;
    vNormal = mat3(uModelMatrix) * aNormal;
    vTexCoord = aTexCoord;

    gl_Position = uProjectionMatrix * (uViewMatrix * vec4(vPosition, 1));
}
`;

const perFragmentFragmentShader = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

uniform vec3 uCameraPosition;

uniform vec3 uLightColor;
uniform vec3 uLightPosition;
uniform vec3 uLightAttenuation;

uniform float uMaterialShininess;
uniform float uMaterialSpecular;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec3 surfacePosition = vPosition;

    float d = distance(surfacePosition, uLightPosition);
    float attenuation = 1.0 / dot(uLightAttenuation, vec3(1, d, d * d));

    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLightPosition - surfacePosition);
    vec3 E = normalize(uCameraPosition - surfacePosition);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.0, dot(L, N));
    float phong = pow(max(0.0, dot(E, R)), uMaterialShininess) * uMaterialSpecular;

    vec3 light = ((lambert + phong) * attenuation) * uLightColor;

    oColor = texture(uTexture, vTexCoord) * vec4(light, 1);
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
