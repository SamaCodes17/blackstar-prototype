import type { Organization, Portfolio, QuboResult } from './types.js';
import { random } from './random.js';
export interface Qubo {
  n: number;
  linear: number[];
  pairs: { i: number; j: number; coefficient: number }[];
  costs: number[];
  budget: number;
  slack: number[];
  penalty: number;
  base: number;
  constant: number;
}
export function formulate(org: Organization, portfolios: Portfolio[]): Qubo {
  const baseline = portfolios[0].gameLoss,
    base = baseline || 1,
    n = org.controls.length;
  const linear = org.controls.map((_, i) => (portfolios[1 << i].gameLoss - baseline) / base);
  const pairs: Qubo['pairs'] = [];
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      pairs.push({
        i,
        j,
        coefficient:
          (portfolios[(1 << i) | (1 << j)].gameLoss - baseline) / base - linear[i] - linear[j],
      });
  // All control prices and budgets use exact 25,000 rupee units (API validates).
  const budget = org.budget / 25000,
    slack: number[] = [];
  let remaining = budget,
    power = 1;
  while (remaining > 0) {
    const w = Math.min(power, remaining);
    slack.push(w);
    remaining -= w;
    power *= 2;
  }
  const penalty =
    1 +
    linear.reduce((s, x) => s + Math.abs(x), 0) +
    pairs.reduce((s, p) => s + Math.abs(p.coefficient), 0);
  return {
    n,
    linear,
    pairs,
    costs: org.controls.map((c) => c.cost.value / 25000),
    budget,
    slack,
    penalty,
    base,
    constant: baseline / base,
  };
}
export function energy(q: Qubo, state: number) {
  let value = q.constant,
    cost = 0;
  for (let i = 0; i < q.n; i++)
    if (state & (1 << i)) {
      value += q.linear[i];
      cost += q.costs[i];
    }
  for (const p of q.pairs) if (state & (1 << p.i) && state & (1 << p.j)) value += p.coefficient;
  q.slack.forEach((w, i) => {
    if (state & (1 << (q.n + i))) cost += w;
  });
  return value + q.penalty * (cost - q.budget) ** 2;
}
export function anneal(q: Qubo) {
  const rng = random(412),
    bits = q.n + q.slack.length;
  let best = 0,
    bestEnergy = energy(q, 0);
  for (let run = 0; run < 24; run++) {
    let state = Math.floor(rng() * 2 ** bits),
      current = energy(q, state);
    for (let t = 0; t < 1800; t++) {
      const candidate = state ^ (1 << Math.floor(rng() * bits)),
        next = energy(q, candidate),
        temperature = 8 * Math.pow(0.0001, t / 1800);
      if (next < current || rng() < Math.exp((current - next) / temperature)) {
        state = candidate;
        current = next;
      }
      if (current < bestEnergy) {
        best = state;
        bestEnergy = current;
      }
    }
  }
  return best;
}
// Actual state-vector p=1 QAOA: |+>^n, exp(-i gamma H_C), exp(-i beta sum X).
// Scaling H_C bounds phase magnitudes; no hardware or speedup claim.
export function qaoaProbabilities(energies: number[], bits: number, gamma: number, beta: number) {
  const length = energies.length,
    re = new Float64Array(length),
    im = new Float64Array(length),
    scale = Math.max(1, ...energies.map(Math.abs));
  for (let s = 0; s < length; s++) {
    const phase = (-gamma * energies[s]) / scale;
    re[s] = Math.cos(phase) / Math.sqrt(length);
    im[s] = Math.sin(phase) / Math.sqrt(length);
  }
  const c = Math.cos(beta),
    sn = Math.sin(beta);
  for (let bit = 0; bit < bits; bit++)
    for (let s = 0; s < length; s++)
      if (!(s & (1 << bit))) {
        const t = s | (1 << bit),
          ar = re[s],
          ai = im[s],
          br = re[t],
          bi = im[t];
        re[s] = c * ar + sn * bi;
        im[s] = c * ai - sn * br;
        re[t] = c * br + sn * ai;
        im[t] = c * bi - sn * ar;
      }
  return Array.from(re, (r, i) => r * r + im[i] * im[i]);
}
export interface SolverInstance {
  org: Organization;
  portfolios: Portfolio[];
  qubo: Qubo;
  energies: number[];
  stateWithSlack: (controlMask: number) => number;
}
export interface BudgetSolver {
  name: string;
  solve: (instance: SolverInstance) => { state: number; probability?: number };
}

function solveQaoa({ org, portfolios, qubo: q, energies, stateWithSlack }: SolverInstance) {
  const bits = q.n + q.slack.length;
  let probabilities: number[] = [],
    expectation = Infinity;
  for (let g = 1; g <= 8; g++)
    for (let b = 1; b <= 8; b++) {
      const p = qaoaProbabilities(energies, bits, (g * Math.PI) / 2, (b * Math.PI) / 16);
      const e = p.reduce((sum, value, i) => sum + value * energies[i], 0);
      if (e < expectation) {
        expectation = e;
        probabilities = p;
      }
    }
  const controlP = Array(2 ** q.n).fill(0) as number[];
  probabilities.forEach((p, state) => {
    controlP[state & (2 ** q.n - 1)] += p;
  });
  const mode = portfolios
    .filter((p) => p.cost <= org.budget)
    .sort((a, b) => controlP[b.mask] - controlP[a.mask])[0].mask;
  return { state: stateWithSlack(mode), probability: controlP[mode] };
}
export const solverBackends: BudgetSolver[] = [
  {
    name: 'Exact Stackelberg',
    solve: ({ org, portfolios, stateWithSlack }) => {
      const best = portfolios
        .filter((p) => p.cost <= org.budget)
        .sort((a, b) => a.gameLoss - b.gameLoss || a.ale - b.ale || a.cost - b.cost)[0];
      return { state: stateWithSlack(best.mask) };
    },
  },
  {
    name: 'Exact QUBO surrogate',
    solve: ({ energies }) => {
      let state = 0;
      for (let s = 1; s < energies.length; s++) if (energies[s] < energies[state]) state = s;
      return { state };
    },
  },
  { name: 'Simulated annealing', solve: ({ qubo }) => ({ state: anneal(qubo) }) },
  { name: 'QAOA · state-vector', solve: solveQaoa },
];
export function verifyQuantum(
  org: Organization,
  portfolios: Portfolio[],
  optimal: Portfolio,
  backends: BudgetSolver[] = solverBackends,
) {
  const q = formulate(org, portfolios),
    bits = q.n + q.slack.length,
    energies = Array.from({ length: 2 ** bits }, (_, s) => energy(q, s));
  const row = (backend: string, state: number, probability?: number): QuboResult => {
    const mask = state & (2 ** q.n - 1),
      p = portfolios[mask];
    return {
      backend,
      mask,
      ids: p.ids,
      ale: p.ale,
      gameLoss: p.gameLoss,
      ratio: p.cost > org.budget ? 0 : p.gameLoss ? optimal.gameLoss / p.gameLoss : 1,
      feasible: p.cost <= org.budget,
      energy: energy(q, state),
      probability,
    };
  };
  const stateWithSlack = (mask: number) => {
    let best = mask;
    for (let s = mask; s < 2 ** bits; s += 2 ** q.n) if (energies[s] < energies[best]) best = s;
    return best;
  };
  return {
    results: backends.map((backend) => {
      const result = backend.solve({ org, portfolios, qubo: q, energies, stateWithSlack });
      if (!Number.isInteger(result.state) || result.state < 0 || result.state >= energies.length)
        throw new Error('Solver returned an invalid bit state');
      return row(backend.name, result.state, result.probability);
    }),
    linear: q.linear,
    pairs: q.pairs,
    penalty: q.penalty,
    slack: q.slack,
    qubits: bits,
    circuit:
      'H on every qubit → exp(−iγ H_QUBO) → Rx(2β) on every qubit → feasible modal control measurement (slack marginalized)',
  };
}
