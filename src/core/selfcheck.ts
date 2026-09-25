import { exact, epssToHorizon, simulate, forward } from './risk';
import { bestResponse, optimize, score } from './optimizer';
import { energy, formulate, qaoaProbabilities, verifyQuantum } from './quantum';
import type { Model, Organization, Output, Response } from './types';
export interface Check {
  name: string;
  passed: boolean;
  detail: string;
  duration: number;
}
export function selfcheck(org: Organization, output?: Output): Check[] {
  const checks: Check[] = [];
  const check = (name: string, run: () => string) => {
    const start = performance.now();
    try {
      checks.push({ name, passed: true, detail: run(), duration: performance.now() - start });
    } catch (e) {
      checks.push({ name, passed: false, detail: String(e), duration: performance.now() - start });
    }
  };
  const assert = (condition: boolean, message: string) => {
    if (!condition) throw new Error(message);
  };
  const near = (a: number, b: number, tolerance = 1e-9) =>
    assert(Math.abs(a - b) < tolerance, `Expected ${b}; received ${a}`);
  const chain: Model = {
    ids: ['A', 'B'],
    labels: ['A', 'B'],
    e: [0.2, 0.1],
    values: [100, 1000],
    parents: [[], [{ node: 0, p: 0.5 }]],
  };
  const diamond: Model = {
    ids: ['A', 'B', 'C', 'D'],
    labels: ['A', 'B', 'C', 'D'],
    e: [0.5, 0, 0, 0],
    values: [0, 0, 0, 100],
    parents: [
      [],
      [{ node: 0, p: 1 }],
      [{ node: 0, p: 1 }],
      [
        { node: 1, p: 1 },
        { node: 2, p: 1 },
      ],
    ],
  };
  check('Chain · exact marginals and ALE', () => {
    const r = exact(chain);
    near(r.probabilities[0], 0.2);
    near(r.probabilities[1], 0.19);
    near(r.ale, 210);
    near(r.mass, 1);
    return 'P(A)=0.2 · P(B)=0.19 · ALE=210 · total probability=1';
  });
  check('Diamond · shared ancestor dependence', () => {
    near(exact(diamond).probabilities[3], 0.5);
    near(forward(diamond)[3], 0.75);
    near(simulate(diamond, 30000).probabilities[3], 0.5, 0.015);
    return 'Exact P(D)=0.5; marginal approximation=0.75; sampling agrees with exact.';
  });
  check('EPSS · window conversion', () => {
    near(epssToHorizon(0.1), 1 - 0.9 ** (365 / 30));
    near(epssToHorizon(0.1, 30), 0.1);
    near(epssToHorizon(0), 0);
    near(epssToHorizon(1), 1);
    return 'Conversion uses 365/30 and preserves zero/one boundaries.';
  });
  const base = { ...org, budget: 300000 },
    solved = optimize(base);
  check('Optimizer · independent recursive feasible search', () => {
    let best = Infinity;
    const visit = (i: number, mask: number, spent: number) => {
      if (spent > base.budget) return;
      if (i === base.controls.length) {
        best = Math.min(best, score(base, mask).gameLoss);
        return;
      }
      visit(i + 1, mask, spent);
      visit(i + 1, mask | (1 << i), spent + base.controls[i].cost.value);
    };
    visit(0, 0, 0);
    near(solved.optimal.gameLoss, best);
    return 'Enumeration agrees with an independent recursively generated feasible set.';
  });
  check('Optimizer · budget boundaries', () => {
    assert(optimize({ ...base, budget: 0 }).optimal.mask === 0, 'Zero budget chose a control');
    const unlimited = optimize({ ...base, budget: 10000000 });
    assert(
      unlimited.portfolios.every((p) => p.gameLoss >= unlimited.optimal.gameLoss - 1e-8),
      'Unlimited optimum is dominated',
    );
    return 'Zero budget selects empty; unlimited budget finds the global minimum.';
  });
  check('Strong Stackelberg · defender-favorable tie', () => {
    const a: Response = {
      type: 'test',
      path: ['A'],
      probability: 0.5,
      utility: 100,
      loss: 200,
      target: 'A',
    };
    const b = { ...a, path: ['B'], loss: 140 };
    assert(bestResponse([a, b]).loss === 140, 'Wrong tie-break');
    return 'Equal attacker utility selects the response with lower defender loss.';
  });
  check('QAOA · unitary normalization', () => {
    const p = qaoaProbabilities([0, 1, 2, 3], 2, 1.2, 0.4);
    near(
      p.reduce((a, b) => a + b, 0),
      1,
    );
    assert(
      p.every((x) => x >= 0),
      'Negative probability',
    );
    return 'The state-vector circuit conserves probability mass.';
  });
  check('QUBO · penalty feasibility and exact comparison', () => {
    const q = formulate(base, solved.portfolios);
    let state = 0;
    for (let s = 1; s < 2 ** (q.n + q.slack.length); s++)
      if (energy(q, s) < energy(q, state)) state = s;
    assert(
      solved.portfolios[state & (2 ** q.n - 1)].cost <= base.budget,
      'Penalty minimum infeasible',
    );
    const verification = verifyQuantum(base, solved.portfolios, solved.optimal);
    assert(
      verification.results.every((r) => r.ratio >= -1e-8 && r.ratio <= 1 + 1e-8),
      'Invalid approximation ratio',
    );
    return 'Surrogate minimum is feasible; every backend is scored against the exact game optimum.';
  });
  check('Monte Carlo · reproducibility and confidence interval', () => {
    const a = simulate(chain, 20000),
      b = simulate(chain, 20000);
    near(a.mean, b.mean);
    assert(a.ci[0] < 210 && a.ci[1] > 210, 'Known mean outside fixed-seed interval');
    return 'Seeded samples reproduce exactly; known chain mean lies within this run’s confidence interval.';
  });
  if (output)
    check('Narrator · numeric grounding', () => {
      const amounts = output.narration.match(/₹[\d,]+/g) ?? [];
      assert(
        amounts.every((x) => output.narrationValues.includes(x)),
        'Narrator invented an amount',
      );
      assert(amounts.length === 4, 'Missing expected values');
      return 'Every rupee amount appears in stored output values.';
    });
  return checks;
}
