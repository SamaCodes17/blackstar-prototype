// Stable seeds make comparisons reproducible and reduce simulation noise between scenarios.
export function random(seed = 26105) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
export const quantile = (sorted: number[], q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))] ?? 0;
