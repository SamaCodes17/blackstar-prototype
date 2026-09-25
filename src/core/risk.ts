import type { Model, Organization, Risk } from './types';
import { quantile, random } from './random';
import { infer, inferCached } from './incremental';
export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const epssToHorizon = (p: number, days = 365) => 1 - Math.pow(1 - clamp(p), days / 30);

export function topological(org: Pick<Organization, 'assets' | 'edges'>): string[] {
  const ids = org.assets.map((a) => a.id),
    result: string[] = [];
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate asset IDs');
  for (const e of org.edges)
    if (!ids.includes(e.from) || !ids.includes(e.to)) throw new Error('Unknown edge endpoint');
  while (result.length < ids.length) {
    const next = ids.find(
      (id) =>
        !result.includes(id) &&
        org.edges.filter((e) => e.to === id).every((e) => result.includes(e.from)),
    );
    if (!next) throw new Error('Cycles are outside the prototype DAG model');
    result.push(next);
  }
  return result;
}

export function modelFor(org: Organization, mask = 0, horizon = org.horizon): Model {
  const ids = topological(org),
    selected = org.controls.filter((_, i) => mask & (1 << i));
  const assets = ids.map((id) => org.assets.find((a) => a.id === id)!);
  return {
    ids,
    labels: assets.map((a) => a.label),
    values: assets.map(
      (a) =>
        a.records.value * org.assumptions.recordScale.value * org.assumptions.costPerRecord.value,
    ),
    e: assets.map((a) => {
      const base = a.epss
        ? epssToHorizon(a.epss.value, horizon) * org.assumptions.exposure.value
        : 1 - Math.pow(1 - a.baseline.value, horizon / 365);
      return clamp(
        selected
          .filter((c) => c.nodes.includes(a.id))
          .reduce((p, c) => p * (1 - c.efficacy.value), base),
      );
    }),
    parents: ids.map((id) =>
      org.edges
        .filter((e) => e.to === id)
        .map((edge) => ({
          node: ids.indexOf(edge.from),
          p: clamp(
            selected
              .filter((c) => c.edges.includes(`${edge.from}>${edge.to}`))
              .reduce(
                (p, c) => p * (1 - c.efficacy.value),
                edge.weight.value *
                  org.assumptions.edgeScale.value *
                  (1 - Math.exp(-horizon / edge.days.value)),
              ),
          ),
        })),
    ),
  };
}

// Sum the BN's full joint distribution. Unlike marginal noisy-OR, this preserves
// shared-ancestor dependence. Exact up to the explicitly enforced small-graph cap.
export function exact(model: Model) {
  return infer(model);
}
export function forward(model: Model) {
  const p: number[] = [];
  for (let i = 0; i < model.ids.length; i++)
    p[i] = 1 - (1 - model.e[i]) * model.parents[i].reduce((r, e) => r * (1 - p[e.node] * e.p), 1);
  return p;
}
export function simulate(model: Model, trials = 12000, seed = 26105) {
  const rng = random(seed),
    losses: number[] = [],
    hits = Array(model.ids.length).fill(0) as number[];
  for (let t = 0; t < trials; t++) {
    const active: boolean[] = [];
    let loss = 0;
    for (let i = 0; i < model.ids.length; i++) {
      const p =
        1 -
        (1 - model.e[i]) * model.parents[i].reduce((r, e) => r * (active[e.node] ? 1 - e.p : 1), 1);
      active[i] = rng() < p;
      if (active[i]) {
        loss += model.values[i];
        hits[i]++;
      }
    }
    losses.push(loss);
  }
  losses.sort((a, b) => a - b);
  const mean = losses.reduce((a, b) => a + b, 0) / trials;
  const variance = losses.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, trials - 1);
  const half = 1.96 * Math.sqrt(variance / trials),
    max = model.values.reduce((a, b) => a + b, 0) || 1;
  const histogram = Array.from({ length: 16 }, (_, i) => ({
    low: (max * i) / 16,
    high: (max * (i + 1)) / 16,
    count: 0,
  }));
  for (const loss of losses) histogram[Math.min(15, Math.floor((loss / max) * 16))].count++;
  return {
    mean,
    p90: quantile(losses, 0.9),
    ci: [Math.max(0, mean - half), mean + half] as [number, number],
    probabilities: hits.map((n) => n / trials),
    histogram,
  };
}
export function riskFor(org: Organization, mask = 0, trials = 12000): Risk {
  const model = modelFor(org, mask),
    ex = inferCached(model, `${org.id}:${mask}:${org.horizon}`),
    mc = simulate(model, trials),
    rng = random(831),
    means: number[] = [],
    tails: number[] = [];
  // Outer parameter draws are sensitivity scenarios, not posterior credible intervals.
  for (let i = 0; i < 32; i++) {
    const variant = structuredClone(org);
    for (const key of ['costPerRecord', 'exposure', 'recordScale', 'edgeScale'] as const) {
      const f = variant.assumptions[key];
      f.value =
        (f.min ?? f.value * 0.8) + rng() * ((f.max ?? f.value * 1.2) - (f.min ?? f.value * 0.8));
    }
    const m = modelFor(variant, mask);
    means.push(exact(m).ale);
    tails.push(simulate(m, 500, i + 99).p90);
  }
  means.sort((a, b) => a - b);
  tails.sort((a, b) => a - b);
  return {
    ...mc,
    ale: ex.ale,
    probabilities: ex.probabilities,
    approximate: forward(model),
    parameterBand: [quantile(means, 0.05), quantile(means, 0.95)],
    p90Band: [quantile(tails, 0.05), quantile(tails, 0.95)],
    trials,
    horizon: org.horizon,
  };
}
export function descendants(org: Pick<Organization, 'edges'>, start: string) {
  const seen = new Set([start]);
  let size = 0;
  while (seen.size !== size) {
    size = seen.size;
    for (const e of org.edges) if (seen.has(e.from)) seen.add(e.to);
  }
  return [...seen];
}
