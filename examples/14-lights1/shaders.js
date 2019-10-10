const vertex = `#version 300 es
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;

uniform mat4 uViewModel;
uniform mat4 uProjection;

uniform float uAmbient;
uniform float uDiffuse;
uniform float uSpecular;

uniform float uShininess;
uniform vec3 uLightPosition;
uniform vec3 uLightColor;
uniform vec3 uLightAttenuation;

out vec2 vTexCoord;
out vec3 vLight;

void main() {
    vec3 vertexPosition = (uViewModel * vec4(aPosition, 1)).xyz;
    vec3 lightPosition = (uViewModel * vec4(uLightPosition, 1)).xyz;
    float d = distance(vertexPosition, lightPosition);
    float attenuation = 1.0 / dot(uLightAttenuation * vec3(1, d, d * d), vec3(1, 1, 1));

    vec3 N = (uViewModel * vec4(aNormal, 0)).xyz;
    vec3 L = normalize(lightPosition - vertexPosition);
    vec3 E = normalize(-vertexPosition);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.0, dot(L, N));
    float phong = pow(max(0.0, dot(E, R)), uShininess);

    float ambient = uAmbient;
    float diffuse = uDiffuse * lambert;
    float specular = uSpecular * phong;

    vLight = ((ambient + diffuse + specular) * attenuation) * uLightColor;
    vTexCoord = aTexCoord;
    gl_Position = uProjection * vec4(vertexPosition, 1);
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uTexture;

in vec2 vTexCoord;
in vec3 vLight;

out vec4 oColor;

void main() {
    oColor = texture(uTexture, vTexCoord) * vec4(vLight, 1);
}
`;

export default {
    phong: { vertex, fragment }
};
