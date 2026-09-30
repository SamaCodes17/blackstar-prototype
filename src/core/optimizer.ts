import { exact, modelFor } from './risk.js';
import type { Model, Organization, Portfolio, Response } from './types.js';
import { inferCached } from './incremental.js';

// Strong Stackelberg tie: attacker utility first, then minimum defender loss.
export function bestResponse(responses: Response[]): Response {
  return responses.reduce((best, r) =>
    r.utility > best.utility + 1e-8 ||
    (Math.abs(r.utility - best.utility) <= 1e-8 && r.loss < best.loss)
      ? r
      : best,
  );
}
export function responsesFor(org: Organization, model: Model): Response[] {
  return org.attackers.map((type) => {
    const candidates: Response[] = [];
    const walk = (path: number[], probability: number) => {
      const target = path.at(-1)!;
      // One successful deliberate route per opportunity, then downstream cascade.
      // No independent background entries: this is a separate game objective.
      const conditional = { ...model, e: model.e.map((_, i) => (path.includes(i) ? 1 : 0)) };
      const value = exact(conditional).ale;
      const preferred =
        org.assets.find((a) => a.id === model.ids[target])?.kind === type.preference;
      candidates.push({
        type: type.name,
        path: path.map((i) => model.ids[i]),
        target: model.ids[target],
        probability,
        utility: probability * model.values[target] * (preferred ? type.multiplier : 1),
        loss: probability * value * org.assumptions.opportunity.value,
      });
      for (let next = target + 1; next < model.ids.length; next++) {
        const edge = model.parents[next].find((e) => e.node === target);
        if (edge && edge.p > 0) walk([...path, next], probability * edge.p);
      }
    };
    for (const entry of type.entries) {
      const i = model.ids.indexOf(entry);
      if (i >= 0) walk([i], model.e[i]);
    }
    if (!candidates.length)
      return { type: type.name, path: [], target: '', probability: 0, utility: 0, loss: 0 };
    return bestResponse(candidates);
  });
}
export function score(org: Organization, mask: number, before?: number): Portfolio {
  const model = modelFor(org, mask),
    responses = responsesFor(org, model),
    selected = org.controls.filter((_, i) => mask & (1 << i));
  const weight = org.attackers.reduce((sum, a) => sum + a.prior.value, 0) || 1;
  const gameLoss = responses.reduce(
    (sum, r, i) => sum + (r.loss * org.attackers[i].prior.value) / weight,
    0,
  );
  const ale = inferCached(model, `${org.id}:${mask}:${org.horizon}`).ale,
    cost = selected.reduce((sum, c) => sum + c.cost.value, 0);
  return {
    mask,
    ids: selected.map((c) => c.id),
    cost,
    ale,
    gameLoss,
    responses,
    rosi: cost ? ((before ?? exact(modelFor(org)).ale) - ale - cost) / cost : 0,
  };
}
export function optimize(org: Organization) {
  if (org.controls.length > 6) throw new Error('Demo enumeration supports at most six controls');
  const before = exact(modelFor(org)).ale;
  const portfolios = Array.from({ length: 2 ** org.controls.length }, (_, mask) =>
    score(org, mask, before),
  );
  const feasible = portfolios.filter((p) => p.cost <= org.budget);
  const optimal = [...feasible].sort(
    (a, b) => a.gameLoss - b.gameLoss || a.ale - b.ale || a.cost - b.cost,
  )[0];
  let mask = 0,
    cost = 0;
  for (const { control, i } of org.controls
    .map((control, i) => ({ control, i }))
    .sort((a, b) => b.control.cvss - a.control.cvss))
    if (cost + control.cost.value <= org.budget) {
      cost += control.cost.value;
      mask |= 1 << i;
    }
  return { optimal, naive: portfolios[mask], portfolios };
}
