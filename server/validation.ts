import type { Fact, Organization } from '../src/core/types.js';
export function number(value: unknown, min: number, max: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new Error(`Value must be between ${min} and ${max}`);
  return value;
}
export function applyEdits(org: Organization, body: Record<string, any>) {
  if (body.budget !== undefined) {
    org.budget = number(body.budget, 0, 1000000);
    if (org.budget % 25000) throw new Error('Budget must use increments of ₹25,000');
  }
  if (body.horizon !== undefined) {
    if (![30, 90, 365].includes(body.horizon)) throw new Error('Unsupported horizon');
    org.horizon = body.horizon;
  }
  if (body.continuous !== undefined) {
    if (typeof body.continuous !== 'boolean') throw new Error('Continuous must be boolean');
    org.continuous = body.continuous;
  }
  const set = (f: Fact, value: unknown, min: number, max: number) => {
    f.value = number(value, min, max);
    f.tag = 'ASSUMED';
    f.source = undefined;
    f.reason = 'User override. ' + f.reason.replace(/^User override\. /, '');
    if (f.min !== undefined) f.min = Math.min(f.min, f.value);
    if (f.max !== undefined) f.max = Math.max(f.max, f.value);
  };
  for (const edit of body.edits ?? []) {
    if (edit.group === 'assumptions' && Object.hasOwn(org.assumptions, edit.key)) {
      const key = edit.key as keyof typeof org.assumptions;
      const max =
        key === 'costPerRecord' ? 100000 : ['recordScale', 'edgeScale'].includes(key) ? 3 : 1;
      set(org.assumptions[key], edit.value, key === 'costPerRecord' ? 1 : 0, max);
    } else if (edit.group === 'assets') {
      const asset = org.assets.find((a) => a.id === edit.id);
      if (!asset) throw new Error('Asset not found');
      if (edit.key === 'records') set(asset.records, edit.value, 0, 10000000);
      else if (edit.key === 'baseline') set(asset.baseline, edit.value, 0, 1);
      else throw new Error('Unknown editable asset field');
    } else if (edit.group === 'edges') {
      const edge = org.edges.find((e) => `${e.from}>${e.to}` === edit.id);
      if (!edge) throw new Error('Edge not found');
      if (edit.key === 'weight') set(edge.weight, edit.value, 0, 1);
      else if (edit.key === 'days') set(edge.days, edit.value, 1, 3650);
      else throw new Error('Unknown edge field');
    } else if (edit.group === 'controls') {
      const control = org.controls.find((c) => c.id === edit.id);
      if (!control) throw new Error('Control not found');
      if (edit.key === 'cost') {
        number(edit.value, 25000, 1000000);
        if (edit.value % 25000) throw new Error('Control prices use ₹25,000 increments');
        set(control.cost, edit.value, 25000, 1000000);
      } else if (edit.key === 'efficacy') set(control.efficacy, edit.value, 0, 1);
      else throw new Error('Unknown control field');
    } else if (edit.group === 'attackers') {
      const actor = org.attackers.find((a) => a.id === edit.id);
      if (!actor || edit.key !== 'prior') throw new Error('Unknown actor');
      set(actor.prior, edit.value, 0, 1);
    } else throw new Error('Unknown assumption');
  }
  if (org.attackers.every((a) => a.prior.value === 0))
    throw new Error('At least one attacker prior must be positive');
}
