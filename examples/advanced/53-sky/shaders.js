const nishitaVertex = `#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

out vec2 vPosition;

void main() {
    vec2 position = vertices[gl_VertexID];
    vPosition = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0, 1);
}
`;

const nishitaFragment = `#version 300 es
precision highp float;

// geometry
uniform float uPlanetRadius;
uniform float uAtmosphereRadius;
uniform float uCameraAltitude;
uniform vec3 uSunDirection;

// physics
uniform float uSunIntensity;
uniform float uMieScatteringAnisotropy;
uniform vec3 uMieScatteringCoefficient;
uniform float uMieDensityScale;
uniform vec3 uRayleighScatteringCoefficient;
uniform float uRayleighDensityScale;

// integration
uniform uint uPrimaryRaySamples;
uniform uint uSecondaryRaySamples;

uniform float uTime;

in vec2 vPosition;

out vec4 oColor;

const float PI = 3.14159265358979;

vec3 directionFromTexcoord(vec2 texcoord) {
    float sx = sin(vPosition.x * 2.0 * PI);
    float sy = sin(vPosition.y * PI);
    float cx = cos(vPosition.x * 2.0 * PI);
    float cy = cos(vPosition.y * PI);
    return vec3(cx * sy, cy, sx * sy);
}

bool raySphereIntersection(vec3 origin, vec3 direction, float radius, out float t0, out float t1) {
    float a = dot(direction, direction);
    float b = dot(direction, origin) * 2.0;
    float c = dot(origin, origin) - radius * radius;

    float D = b * b - 4.0 * a * c;

    if (D < 0.0) {
        return false;
    }

    D = sqrt(D);
    t0 = (-b - D) / (2.0 * a);
    t1 = (-b + D) / (2.0 * a);

    if (t1 < 0.0) {
        return false;
    }

    t0 = max(t0, 0.0);

    return true;
}

float miePhaseFunction(float cosine, float anisotropy) {
    float g = anisotropy;
    float mu = cosine;
    float g2 = g * g;
    float mu2 = mu * mu;
    float gmu = g * mu;
    return 3.0 / (8.0 * PI) * ((1.0 - g2) * (1.0 + mu2)) /
        ((2.0 + g2) * pow(1.0 + g2 - 2.0 * gmu, 3.0 / 2.0));
}

float rayleighPhaseFunction(float cosine) {
    float mu = cosine;
    float mu2 = mu * mu;
    return 3.0 / (16.0 * PI) * (1.0 + mu2);
}

vec3 rayleighScatteringCoefficient(float height) {
    return uRayleighScatteringCoefficient * exp(-height / uRayleighDensityScale);
}

vec3 mieScatteringCoefficient(float height) {
    return uMieScatteringCoefficient * exp(-height / uMieDensityScale);
}

vec3 rayleighAbsorptionCoefficient(float height) {
    return vec3(0);
}

vec3 mieAbsorptionCoefficient(float height) {
    return mieScatteringCoefficient(height) * 0.1;
}

vec3 radianceSecondaryRay(vec3 origin, vec3 direction) {
    float tnear, tfar;

    // If the secondary ray is in shadow, there is no radiance, because
    // we assumed no emission or higher order scettering.
    if (raySphereIntersection(origin, direction, uPlanetRadius, tnear, tfar)) {
        return vec3(0);
    }

    raySphereIntersection(origin, direction, uAtmosphereRadius, tnear, tfar);

    vec3 near = origin + tnear * direction;
    vec3 far = origin + tfar * direction;

    // Calculate transmittance along the secondary ray by first integrating
    // the optical depth and then calculating the exponential.
    float segmentLength = distance(near, far) / float(uSecondaryRaySamples);
    vec3 opticalDepth = vec3(0);

    for (uint i = 0u; i < uSecondaryRaySamples; i++) {
        vec3 position = near + segmentLength * direction;
        float height = length(position) - uPlanetRadius;

        opticalDepth += rayleighAbsorptionCoefficient(height);
        opticalDepth += rayleighScatteringCoefficient(height);
        opticalDepth += mieAbsorptionCoefficient(height);
        opticalDepth += mieScatteringCoefficient(height);
    }

    // Assume the sun is white.
    vec3 sunRadiance = vec3(uSunIntensity);
    vec3 transmittance = exp(-opticalDepth * segmentLength);
    return transmittance * sunRadiance;
}

vec3 radiancePrimaryRay(vec3 origin, vec3 direction) {
    float tnear, tfar;

    // If the ray does not intersect the atmosphere, there is no radiance, because
    // we assumed no background radiance.
    if (!raySphereIntersection(origin, direction, uAtmosphereRadius, tnear, tfar)) {
        return vec3(0);
    }

    // Two options remain: the ray hits the planet or exits the atmosphere.
    // We can handle both situations by integrating only up to the appropriate intersection.
    float tPlanetNear, tPlanetFar;
    if (raySphereIntersection(origin, direction, uPlanetRadius, tPlanetNear, tPlanetFar)) {
        tfar = tPlanetNear;
    }

    vec3 near = origin + tnear * direction;
    vec3 far = origin + tfar * direction;

    float scatteringCosine = dot(direction, uSunDirection);
    float rayleighPhase = rayleighPhaseFunction(scatteringCosine);
    float miePhase = miePhaseFunction(scatteringCosine, uMieScatteringAnisotropy);

    vec3 radiance = vec3(0);

    // Calculate transmittance along the secondary ray by first integrating
    // the optical depth and then calculating the exponential.
    float segmentLength = distance(near, far) / float(uPrimaryRaySamples);
    vec3 opticalDepth = vec3(0);

    for (uint i = 0u; i < uPrimaryRaySamples; i++) {
        vec3 position = near + segmentLength * direction;
        float height = length(position) - uPlanetRadius;

        opticalDepth += rayleighAbsorptionCoefficient(height);
        opticalDepth += rayleighScatteringCoefficient(height);
        opticalDepth += mieAbsorptionCoefficient(height);
        opticalDepth += mieScatteringCoefficient(height);

        vec3 transmittance = exp(-opticalDepth * segmentLength);

        vec3 incidentRadiance = radianceSecondaryRay(position, uSunDirection);

        vec3 rayleigh = rayleighScatteringCoefficient(height) * rayleighPhase;
        vec3 mie = mieScatteringCoefficient(height) * miePhase;
        radiance += transmittance * (rayleigh + mie) * incidentRadiance * segmentLength;
    }

    return radiance;
}

void main() {
    vec3 position = vec3(0, uPlanetRadius + uCameraAltitude, 0);
    vec3 direction = directionFromTexcoord(vPosition);

    oColor = vec4(radiancePrimaryRay(position, direction), 1);
}
`;

const skyboxVertex = `#version 300 es

const vec2 vertices[] = vec2[](
    vec2(-1, -1),
    vec2( 3, -1),
    vec2(-1,  3)
);

uniform mat4 uUnprojectMatrix;

out vec3 vDirection;

vec3 unproject(vec3 devicePosition) {
    vec4 clipPosition = uUnprojectMatrix * vec4(devicePosition, 1);
    return clipPosition.xyz / clipPosition.w;
}

void main() {
    vec2 position = vertices[gl_VertexID];
    vec3 near = unproject(vec3(position, -1));
    vec3 far = unproject(vec3(position, 1));
    vDirection = far - near;
    gl_Position = vec4(position, 0, 1);
}
`;

const skyboxFragment = `#version 300 es
precision mediump float;

uniform mediump sampler2D uSkybox;

in vec3 vDirection;

out vec4 oColor;

vec2 directionToTexcoord(vec3 v) {
    const float PI = 3.14159265358979;
    return vec2((atan(v.z, v.x) / PI) * 0.5 + 0.5, acos(v.y) / PI);
}

void main() {
    oColor = texture(uSkybox, directionToTexcoord(normalize(vDirection)));
    oColor = pow(oColor, vec4(vec3(1.0 / 2.2), 1));
}
`;

export const shaders = {
    nishita: {
        vertex: nishitaVertex,
        fragment: nishitaFragment,
    },
    skybox: {
        vertex: skyboxVertex,
        fragment: skyboxFragment,
    },
};
