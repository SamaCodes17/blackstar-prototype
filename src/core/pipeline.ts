import { exact, modelFor, riskFor } from './risk';
import { optimize } from './optimizer';
import { verifyQuantum } from './quantum';
import type { Organization, Output } from './types';
export const rupees = (value: number) => '₹' + Math.round(value).toLocaleString('en-IN');
export function compute(org: Organization): Output {
  const { optimal, naive, portfolios } = optimize(org),
    risk = riskFor(org),
    after = riskFor(org, optimal.mask),
    model = modelFor(org);
  const sensitivity = (['costPerRecord', 'exposure', 'recordScale', 'edgeScale'] as const)
    .map((key) => {
      const copy = structuredClone(org),
        f = copy.assumptions[key];
      f.value = f.min ?? f.value * 0.8;
      const low = exact(modelFor(copy)).ale;
      f.value = f.max ?? f.value * 1.2;
      return { name: key, low, high: exact(modelFor(copy)).ale };
    })
    .sort((a, b) => b.high - b.low - (a.high - a.low));
  const direct = risk.ale,
    partner = direct * org.assumptions.partner.value,
    sector = direct * org.assumptions.sector.value,
    downstream = direct * org.assumptions.downstream.value;
  const narrationValues = [
    rupees(risk.ale),
    rupees(optimal.cost),
    rupees(optimal.ale),
    rupees(risk.ale - optimal.ale),
  ];
  const narration = `The model estimates ${narrationValues[0]} in loss over the selected horizon. The recommended plan costs ${narrationValues[1]} and leaves ${narrationValues[2]} of modeled exposure, a reduction of ${narrationValues[3]}. Start with ${optimal.ids.length ? org.controls.find((c) => c.id === optimal.ids[0])!.name.toLowerCase() : 'reviewing the assumptions before allocating a budget'}. These are scenario estimates, not a breach forecast.`;
  return {
    at: new Date().toISOString(),
    risk,
    after,
    optimal,
    naive,
    portfolios,
    quantum: verifyQuantum(org, portfolios, optimal),
    sensitivity,
    contagion: {
      direct,
      partner,
      sector,
      downstream,
      total: direct + partner + sector + downstream,
    },
    narration,
    narrationValues,
    derivation: model.ids.map((id, i) => ({
      id,
      entry: model.e[i],
      value: model.values[i],
      probability: risk.probabilities[i],
      contribution: model.values[i] * risk.probabilities[i],
      parents: model.parents[i],
    })),
    priorPreview: org.attackers.map((observation) => ({
      observation: observation.id,
      weights: org.attackers.map((actor) => {
        const prior = actor.prior.value / org.attackers.reduce((s, x) => s + x.prior.value, 0);
        return {
          id: actor.id,
          prior,
          posterior: (prior * 10 + Number(actor.id === observation.id)) / 11,
        };
      }),
    })),
    interventions: org.controls.map((c, i) => ({
      id: c.id,
      saved: risk.ale - portfolios[1 << i].ale,
      rosi: portfolios[1 << i].rosi,
    })),
    blast: model.ids.map((entry, i) => {
      const result = exact({ ...model, e: model.e.map((_, j) => (i === j ? 1 : 0)) });
      return { entry, probabilities: result.probabilities, loss: result.ale };
    }),
  };
}
