import type { Organization, Output } from './types';

// Presentation arithmetic only. Risk estimates and the selected portfolio come
// from the stored engine result, so the dashboard and brief use identical values.
export function decisionSummary(org: Organization, output: Output) {
  const controls = org.controls.filter((control) => output.optimal.ids.includes(control.id));
  const avoided = output.risk.ale - output.after.ale;
  return {
    controls,
    before: output.risk.ale,
    after: output.after.ale,
    avoided,
    reduction: output.risk.ale > 0 ? avoided / output.risk.ale : 0,
    spend: output.optimal.cost,
    annualCostExceedsBenefit: org.horizon === 365 && output.optimal.cost > avoided,
    remaining: org.budget - output.optimal.cost,
    topAsset: [...output.derivation].sort((a, b) => b.contribution - a.contribution)[0],
  };
}
