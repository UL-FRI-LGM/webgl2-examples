const vertex = `#version 300 es
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

const fragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseTexture;
uniform sampler2D uMetalnessTexture;
uniform sampler2D uRoughnessTexture;

uniform vec3 uBaseFactor;
uniform float uMetalnessFactor;
uniform float uRoughnessFactor;

uniform vec3 uCameraPosition;

struct Light {
    vec3 position;
    vec3 attenuation;
    vec3 color;
    float intensity;
};

uniform Light uLight;

in vec3 vPosition;
in vec3 vNormal;
in vec2 vTexCoord;

out vec4 oColor;

vec3 F_Schlick(vec3 f0, vec3 f90, float VdotH) {
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

float F_Schlick(float f0, float f90, float VdotH) {
    return f0 + (f90 - f0) * pow(clamp(1.0 - VdotH, 0.0, 1.0), 5.0);
}

float V_GGX(float NdotL, float NdotV, float roughness) {
    float roughnessSq = roughness * roughness;

    float GGXV = NdotL * sqrt(NdotV * NdotV * (1.0 - roughnessSq) + roughnessSq);
    float GGXL = NdotV * sqrt(NdotL * NdotL * (1.0 - roughnessSq) + roughnessSq);

    float GGX = GGXV + GGXL;
    return clamp(0.5 / GGX, 0.0, 1.0);
}

float D_GGX(float NdotH, float roughness) {
    const float PI = 3.14159265358979;
    float roughnessSq = roughness * roughness;
    float f = (NdotH * NdotH) * (roughnessSq - 1.0) + 1.0;
    return roughnessSq / (PI * f * f);
}

float Fd_Lambert() {
    const float PI = 3.14159265358979;
    return 1.0 / PI;
}

float Fd_Burley(float NdotV, float NdotL, float LdotH, float roughness) {
    const float PI = 3.14159265358979;
    float f90 = 0.5 + 2.0 * roughness * LdotH * LdotH;
    float lightScatter = F_Schlick(1.0, f90, NdotL);
    float viewScatter = F_Schlick(1.0, f90, NdotV);
    return lightScatter * viewScatter * (1.0 / PI);
}

vec3 linearToSRGB(vec3 color) {
    const float gamma = 2.2;
    return pow(color, vec3(1.0 / gamma));
}

vec3 getLightIntensity(Light light, vec3 surfacePosition) {
    float d = distance(light.position, surfacePosition);
    float attenuation = dot(light.attenuation, vec3(1, d, d * d));
    return light.color * light.intensity / attenuation;
}

void main() {
    vec3 N = normalize(vNormal);
    vec3 L = normalize(uLight.position - vPosition);
    vec3 V = normalize(uCameraPosition - vPosition);
    vec3 H = normalize(V + L);

    float NdotL = clamp(dot(N, L), 0.0, 1.0);
    float NdotV = clamp(dot(N, V), 0.0, 1.0);
    float NdotH = clamp(dot(N, H), 0.0, 1.0);
    float LdotH = clamp(dot(L, H), 0.0, 1.0);
    float VdotH = clamp(dot(V, H), 0.0, 1.0);

    vec3 baseColor = texture(uBaseTexture, vTexCoord).rgb;
    float metalness = texture(uMetalnessTexture, vTexCoord).r;
    float perceptualRoughness = texture(uRoughnessTexture, vTexCoord).r;
    float roughness = perceptualRoughness * perceptualRoughness;

    vec3 f0 = mix(vec3(0.04), baseColor, metalness);
    vec3 f90 = vec3(1);
    vec3 diffuseColor = mix(baseColor, vec3(0), metalness);

    vec3  F = F_Schlick(f0, f90, VdotH);
    float Vis = V_GGX(NdotL, NdotV, roughness);
    float D = D_GGX(NdotH, roughness);

    vec3 diffuse = (vec3(1) - F) * Fd_Lambert() * diffuseColor;
    vec3 specular = F * Vis * D;

    vec3 lightIntensity = getLightIntensity(uLight, vPosition);

    vec3 finalColor = (diffuse + specular) * lightIntensity;

    oColor = vec4(linearToSRGB(finalColor), 1);
}
`;

export const shaders = {
    burley: { vertex, fragment }
};
