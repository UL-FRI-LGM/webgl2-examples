export function swap(f, t, ...args) { return 1 - f(1 - t, ...args); }
export function inout(f, t, ...args) { return t < 0.5 ? f(2 * t, ...args) / 2 : 1 - f(2 * (1 - t), ...args) / 2; }

export function step(t, p = 0) { return t < p ? 0 : 1; }
export function stepEaseIn(...args) { return step(...args); }
export function stepEaseOut(...args) { return swap(step, ...args); }
export function stepEaseInOut(...args) { return inout(step, ...args); }

export function linear(t) { return t; }
export function linearEaseIn(...args) { return linear(...args); }
export function linearEaseOut(...args) { return swap(linear, ...args); }
export function linearEaseInOut(...args) { return inout(linear, ...args); }

export function poly(t, p = 2) { return Math.pow(t, p); }
export function polyEaseIn(...args) { return poly(...args); }
export function polyEaseOut(...args) { return swap(poly, ...args); }
export function polyEaseInOut(...args) { return inout(poly, ...args); }

export function expo(t, p = 5) { return (Math.exp(p * t) - 1) / (Math.exp(p) - 1); }
export function expoEaseIn(...args) { return expo(...args); }
export function expoEaseOut(...args) { return swap(expo, ...args); }
export function expoEaseInOut(...args) { return inout(expo, ...args); }

export function sine(t, n = 1) { return 1 - Math.cos(n * t * Math.PI / 2); }
export function sineEaseIn(...args) { return sine(...args); }
export function sineEaseOut(...args) { return swap(sine, ...args); }
export function sineEaseInOut(...args) { return inout(sine, ...args); }

export function circ(t) { return 1 - Math.sqrt(1 - t * t); }
export function circEaseIn(...args) { return circ(...args); }
export function circEaseOut(...args) { return swap(circ, ...args); }
export function circEaseInOut(...args) { return inout(circ, ...args); }

export function back(t, p = 2) { return t * t * ((p + 1) * t - p); }
export function backEaseIn(...args) { return back(...args); }
export function backEaseOut(...args) { return swap(back, ...args); }
export function backEaseInOut(...args) { return inout(back, ...args); }

export function elastic(t, p = 5, n = 5) { return expo(t, p) * (1 - sine(t, 4 * n)); }
export function elasticEaseIn(...args) { return elastic(...args); }
export function elasticEaseOut(...args) { return swap(elastic, ...args); }
export function elasticEaseInOut(...args) { return inout(elastic, ...args); }

export function bounce(t, p = 2, n = 2) { return Math.abs(poly(t, p) * (1 - sine(t, 4 * n))); }
export function bounceEaseIn(...args) { return bounce(...args); }
export function bounceEaseOut(...args) { return swap(bounce, ...args); }
export function bounceEaseInOut(...args) { return inout(bounce, ...args); }
