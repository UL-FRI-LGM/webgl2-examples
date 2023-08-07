export function linear(t) {
    return t;
}

export function easeInSine(t) {
    return -1 * Math.cos(t * (Math.PI / 2)) + 1;
}

export function easeOutSine(t) {
    return Math.sin(t * (Math.PI / 2));
}

export function easeInOutSine(t) {
    return -0.5 * (Math.cos(Math.PI * t) - 1);
}

export function easeInQuad(t) {
    return t * t;
}

export function easeOutQuad(t) {
    return t * (2 - t);
}

export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : - 1 + (4 - 2 * t) * t;
}

export function easeInCubic(t) {
    return t * t * t;
}

export function easeOutCubic(t) {
    const t1 = t - 1;
    return t1 * t1 * t1 + 1;
}

export function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

export function easeInQuart(t) {
    return t * t * t * t;
}

export function easeOutQuart(t) {
    const t1 = t - 1;
    return 1 - t1 * t1 * t1 * t1;
}

export function easeInOutQuart(t) {
    const t1 = t - 1;
    return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * t1 * t1 * t1 * t1;
}

export function easeInQuint(t) {
    return t * t * t * t * t;
}

export function easeOutQuint(t) {
    const t1 = t - 1;
    return 1 + t1 * t1 * t1 * t1 * t1;
}

export function easeInOutQuint(t) {
    const t1 = t - 1;
    return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * t1 * t1 * t1 * t1 * t1;
}

export function easeInExpo(t) {
    if (t === 0) {
        return 0;
    }

    return Math.pow(2, 10 * (t - 1));
}

export function easeOutExpo(t) {
    if (t === 1) {
        return 1;
    }

    return (-Math.pow(2, -10 * t) + 1);
}

export function easeInOutExpo(t) {
    if (t === 0 || t === 1) {
        return t;
    }

    const scaledTime = t * 2;
    const scaledTime1 = scaledTime - 1;

    if (scaledTime < 1) {
        return 0.5 * Math.pow(2, 10 * (scaledTime1));
    }

    return 0.5 * (-Math.pow(2, -10 * scaledTime1) + 2);
}

export function easeInCirc(t) {
    return -1 * (Math.sqrt(1 - t * t) - 1);
}

export function easeOutCirc(t) {
    const t1 = t - 1;
    return Math.sqrt(1 - t1 * t1);
}

export function easeInOutCirc(t) {
    const scaledTime = t * 2;
    const scaledTime1 = scaledTime - 2;

    if (scaledTime < 1) {
        return -0.5 * (Math.sqrt(1 - scaledTime * scaledTime) - 1);
    }

    return 0.5 * (Math.sqrt(1 - scaledTime1 * scaledTime1) + 1);
}

export function easeInBack(t, magnitude = 1.70158) {
    return t * t * ((magnitude + 1) * t - magnitude);
}

export function easeOutBack(t, magnitude = 1.70158) {
    const scaledTime = (t / 1) - 1;
    return (scaledTime * scaledTime * ((magnitude + 1) * scaledTime + magnitude)) + 1;
}

export function easeInOutBack(t, magnitude = 1.70158) {
    const scaledTime = t * 2;
    const scaledTime2 = scaledTime - 2;

    const s = magnitude * 1.525;

    if (scaledTime < 1) {
        return 0.5 * scaledTime * scaledTime * (((s + 1) * scaledTime) - s);
    }

    return 0.5 * (scaledTime2 * scaledTime2 * ((s + 1) * scaledTime2 + s) + 2);
}
export function easeInElastic(t, magnitude = 0.7) {
    if (t === 0 || t === 1) {
        return t;
    }

    const scaledTime = t / 1;
    const scaledTime1 = scaledTime - 1;

    const p = 1 - magnitude;
    const s = p / (2 * Math.PI) * Math.asin(1);

    return -(Math.pow(2, 10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p));
}

export function easeOutElastic(t, magnitude = 0.7) {
    if (t === 0 || t === 1) {
        return t;
    }

    const p = 1 - magnitude;
    const scaledTime = t * 2;

    const s = p / (2 * Math.PI) * Math.asin(1);
    return (Math.pow(2, -10 * scaledTime) * Math.sin((scaledTime - s) * (2 * Math.PI) / p)) + 1;
}

export function easeInOutElastic(t, magnitude = 0.65) {
    if (t === 0 || t === 1) {
        return t;
    }

    const p = 1 - magnitude;
    const scaledTime = t * 2;
    const scaledTime1 = scaledTime - 1;

    const s = p / (2 * Math.PI) * Math.asin(1);

    if (scaledTime < 1) {
        return -0.5 * (Math.pow(2, 10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p));
    }

    return (Math.pow(2, -10 * scaledTime1) * Math.sin((scaledTime1 - s) * (2 * Math.PI) / p) * 0.5) + 1;
}

export function easeOutBounce(t) {
    const scaledTime = t / 1;

    if (scaledTime < (1 / 2.75)) {
        return 7.5625 * scaledTime * scaledTime;
    } else if (scaledTime < (2 / 2.75)) {
        const scaledTime2 = scaledTime - (1.5 / 2.75);
        return (7.5625 * scaledTime2 * scaledTime2) + 0.75;
    } else if (scaledTime < (2.5 / 2.75)) {
        const scaledTime2 = scaledTime - (2.25 / 2.75);
        return (7.5625 * scaledTime2 * scaledTime2) + 0.9375;
    } else {
        const scaledTime2 = scaledTime - (2.625 / 2.75);
        return (7.5625 * scaledTime2 * scaledTime2) + 0.984375;
    }
}

export function easeInBounce(t) {
    return 1 - easeOutBounce(1 - t);
}

export function easeInOutBounce(t) {
    if (t < 0.5) {
        return easeInBounce(t * 2) * 0.5;
    }
    return (easeOutBounce((t * 2) - 1) * 0.5) + 0.5;
}
