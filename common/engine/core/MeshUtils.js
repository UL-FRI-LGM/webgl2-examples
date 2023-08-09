import { vec3 } from '../../../lib/gl-matrix-module.js';

export function calculateAxisAlignedBoundingBox(mesh) {
    const initial = {
        min: vec3.clone(mesh.vertices[0].position),
        max: vec3.clone(mesh.vertices[0].position),
    };

    return {
        min: mesh.vertices.reduce((a, b) => vec3.min(a, a, b.position), initial.min),
        max: mesh.vertices.reduce((a, b) => vec3.max(a, a, b.position), initial.max),
    };
}

export function mergeAxisAlignedBoundingBoxes(boxes) {
    const initial = {
        min: vec3.clone(boxes[0].min),
        max: vec3.clone(boxes[0].max),
    };

    return {
        min: boxes.reduce(({ min: amin }, { min: bmin }) => vec3.min(amin, amin, bmin), initial),
        max: boxes.reduce(({ max: amax }, { max: bmax }) => vec3.max(amax, amax, bmax), initial),
    };
}
