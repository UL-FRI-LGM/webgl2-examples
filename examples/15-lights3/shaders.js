const vertex = `#version 300 es
precision mediump float;
layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoord;

uniform mat4 uViewModel;
uniform mat4 uProjection;

out vec3 vVertexPosition;
out vec3 vNormal;
out vec2 vTexCoord;

void main() {
    vVertexPosition = (uViewModel * vec4(aPosition, 1)).xyz;
    vNormal = aNormal;
    vTexCoord = aTexCoord;
    gl_Position = uProjection * vec4(vVertexPosition, 1);
}
`;

const fragment = `#version 300 es
precision mediump float;

uniform mat4 uViewModel;

uniform mediump sampler2D uTexture;

uniform vec3 uAmbientColor[4];
uniform vec3 uDiffuseColor[4];
uniform vec3 uSpecularColor[4];

uniform float uShininess[4];
uniform vec3 uLightPosition[4];
uniform vec3 uLightAttenuation[4];

in vec3 vVertexPosition;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 oColor;

void main() {
    vec3 lightPosition = (uViewModel * vec4(uLightPosition[0], 1)).xyz;
    float d = distance(vVertexPosition, lightPosition);
    float attenuation = 1.0 / dot(uLightAttenuation[0] * vec3(1, d, d * d), vec3(1, 1, 1));

    vec3 N = (uViewModel * vec4(vNormal, 0)).xyz;
    vec3 L = normalize(lightPosition - vVertexPosition);
    vec3 E = normalize(-vVertexPosition);
    vec3 R = normalize(reflect(-L, N));

    float lambert = max(0.0, dot(L, N));
    float phong = pow(max(0.0, dot(E, R)), uShininess[0]);

    vec3 ambient = uAmbientColor[0];
    vec3 diffuse = uDiffuseColor[0] * lambert;
    vec3 specular = uSpecularColor[0] * phong;

    vec3 light = (ambient + diffuse + specular) * attenuation;


    // oColor = texture(uTexture, vTexCoord) * vec4(light, 1);
    oColor = vec4(uDiffuseColor[0], 1.0);
}
`;

export default {
    phong: { vertex, fragment }
};
