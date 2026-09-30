import { exact, modelFor } from './risk.js';
import { responsesFor } from './optimizer.js';
import type { Edge, Organization } from './types.js';
export function compromiseImpact(org: Organization, entry: string, mask = 0) {
  const model = modelFor(org, mask);
  if (!model.ids.includes(entry)) throw new Error('Unknown starting system');
  const result = exact({ ...model, e: model.ids.map((id) => (id === entry ? 1 : 0)) });
  const hops: Record<string, number> = { [entry]: 0 };
  for (const id of model.ids) {
    if (id === entry) continue;
    const paths = model.parents[model.ids.indexOf(id)].filter(
      (p) => p.p > 0 && hops[model.ids[p.node]] !== undefined,
    );
    if (paths.length) hops[id] = 1 + Math.min(...paths.map((p) => hops[model.ids[p.node]]));
  }
  return { ...result, ids: model.ids, hops, model };
}
export function scenarioChoices(org: Organization, mask = 0) {
  return responsesFor(org, modelFor(org, mask));
}
export function illustrativeNetwork(source: Organization): Organization {
  const org = structuredClone(source);
  org.name = 'Illustrative branching network';
  const fact = (value: number) => ({
    value,
    tag: 'ASSUMED' as const,
    reason: 'Illustrative scenario input; not discovered.',
  });
  org.assets = [
    ['web', 'Public application', 'public', 2000],
    ['identity', 'Staff identity', 'identity', 1000],
    ['vendor', 'Supplier access', 'vendor', 500],
    ['app', 'Application server', 'portal', 3000],
    ['records', 'Customer records', 'records', 10000],
    ['backup', 'Backup storage', 'records', 4000],
    ['payments', 'Payment service', 'payments', 3000],
  ].map(([id, label, kind, records]) => ({
    id: String(id),
    label: String(label),
    kind: String(kind),
    hostname: String(id) + '.example.invalid',
    hostTag: 'PREVIEW',
    records: fact(Number(records)),
    baseline: fact(0.12),
  }));
  const pairs: [string, string, number][] = [
    ['web', 'app', 0.65],
    ['identity', 'app', 0.7],
    ['identity', 'records', 0.45],
    ['vendor', 'app', 0.5],
    ['vendor', 'backup', 0.35],
    ['app', 'records', 0.7],
    ['app', 'payments', 0.55],
    ['records', 'backup', 0.6],
    ['payments', 'backup', 0.4],
  ];
  org.edges = pairs.map(([from, to, weight]) => ({
    from,
    to,
    weight: fact(weight),
    days: fact(10),
    reason: 'Illustrative dependency; not discovered.',
  }));
  org.attackers = [
    {
      id: 'ransomware',
      name: 'Ransomware actor',
      entries: ['web'],
      preference: 'records',
      multiplier: 3,
      prior: fact(0.5),
    },
    {
      id: 'credentials',
      name: 'Credential actor',
      entries: ['identity'],
      preference: 'identity',
      multiplier: 3,
      prior: fact(0.3),
    },
    {
      id: 'supply-chain',
      name: 'Supply-chain actor',
      entries: ['vendor'],
      preference: 'vendor',
      multiplier: 3,
      prior: fact(0.2),
    },
  ];
  org.controls = source.controls.map((c) => ({
    ...c,
    nodes:
      c.id === 'patch'
        ? ['web', 'app']
        : c.id === 'mfa'
          ? ['identity']
          : c.id === 'vendor'
            ? ['vendor']
            : [],
    edges:
      c.id === 'segment'
        ? ['app>records', 'app>payments', 'records>backup']
        : c.id === 'edr'
          ? ['app>records', 'vendor>backup']
          : [],
  }));
  return org;
}
export function withConnection(org: Organization, edge: Edge) {
  if (!Number.isFinite(edge.weight.value) || edge.weight.value < 0 || edge.weight.value > 1)
    throw new Error('Transmission must be between 0 and 100 percent.');
  if (edge.from === edge.to || org.edges.some((e) => e.from === edge.from && e.to === edge.to))
    throw new Error('Choose two different systems without an existing connection.');
  const next = { ...org, edges: [...org.edges, edge] };
  modelFor(next); // validates endpoints and rejects cycles for the exact prototype model
  return next;
}
