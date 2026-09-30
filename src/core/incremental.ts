import type { Model } from './types.js';

// A changed conditional distribution only invalidates itself and descendants.
// Unaffected nodes have the same joint law, even when they are correlated.
export function affectedNodes(before: Model, after: Model): number[] {
  if (before.ids.join('|') !== after.ids.join('|')) return after.ids.map((_, i) => i);
  const affected = new Set<number>();
  for (let i = 0; i < after.ids.length; i++) {
    if (
      before.e[i] !== after.e[i] ||
      JSON.stringify(before.parents[i]) !== JSON.stringify(after.parents[i]) ||
      after.parents[i].some((p) => affected.has(p.node))
    )
      affected.add(i);
  }
  return [...affected];
}

export interface JointResult {
  probabilities: number[];
  ale: number;
  mass: number;
  joint: number[];
  recomputed: number[];
}
export function infer(model: Model, previous?: { model: Model; result: JointResult }): JointResult {
  const n = model.ids.length;
  if (n > 12)
    throw new Error('Exact inference is limited to 12 assets; group or sample larger graphs');
  if (previous?.model.ids.join('|') !== model.ids.join('|')) previous = undefined;
  const recomputed = previous ? affectedNodes(previous.model, model) : model.ids.map((_, i) => i);
  if (previous && !recomputed.length)
    return {
      ...previous.result,
      recomputed,
      ale: previous.result.probabilities.reduce((sum, p, i) => sum + p * model.values[i], 0),
    };
  const keepMask = model.ids.reduce(
    (mask, _, i) => (recomputed.includes(i) ? mask : mask | (1 << i)),
    0,
  );
  const unaffectedMass = Array(2 ** n).fill(0) as number[];
  if (previous)
    previous.result.joint.forEach((p, state) => (unaffectedMass[state & keepMask] += p));
  const joint = Array(2 ** n).fill(0) as number[],
    probabilities = Array(n).fill(0) as number[];
  let mass = 0,
    ale = 0;
  for (let state = 0; state < 2 ** n; state++) {
    let probability = previous ? unaffectedMass[state & keepMask] : 1,
      loss = 0;
    for (const i of recomputed) {
      const p =
        1 -
        (1 - model.e[i]) *
          model.parents[i].reduce(
            (product, parent) => product * (state & (1 << parent.node) ? 1 - parent.p : 1),
            1,
          );
      probability *= state & (1 << i) ? p : 1 - p;
    }
    for (let i = 0; i < n; i++)
      if (state & (1 << i)) {
        loss += model.values[i];
        probabilities[i] += probability;
      }
    joint[state] = probability;
    mass += probability;
    ale += probability * loss;
  }
  return { probabilities, ale, mass, joint, recomputed };
}
const cache = new Map<string, { model: Model; result: JointResult }>();
export function inferCached(model: Model, key: string) {
  const result = infer(model, cache.get(key));
  if (cache.size >= 256 && !cache.has(key)) cache.delete(cache.keys().next().value!);
  cache.set(key, { model: structuredClone(model), result });
  return result;
}
