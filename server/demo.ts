import { createOrganization } from './seed.js';
import { illustrativeNetwork } from '../src/core/attackSimulation.js';
import { compute } from '../src/core/pipeline.js';
import { applyEdits } from './validation.js';
import { applyHistoricalPriors } from '../src/core/history.js';
import type { State, Organization } from '../src/core/types.js';

export const demoCatalog = [
  {
    id: 'demo-northstar',
    name: 'Northstar Works',
    domain: 'northstar.example',
    sector: 'msme',
    size: 240,
    scale: 1,
  },
  {
    id: 'demo-orbit',
    name: 'Orbit Labs',
    domain: 'orbit.example',
    sector: 'other',
    size: 35,
    scale: 0.25,
  },
  {
    id: 'demo-meridian',
    name: 'Meridian Financial',
    domain: 'meridian.example',
    sector: 'financial',
    size: 2400,
    scale: 3,
  },
];
export function isDemo(id: string) {
  return demoCatalog.some((o) => o.id === id);
}
export function demoOrganization(id: string): Organization {
  const spec = demoCatalog.find((o) => o.id === id);
  if (!spec) throw new Error('Organization not found');
  const org = illustrativeNetwork(
    createOrganization(spec.name, spec.domain, spec.sector, spec.size, []),
  );
  Object.assign(org, {
    id: spec.id,
    name: spec.name,
    domain: spec.domain,
    example: true,
    authorized: false,
    continuous: false,
    createdAt: '2026-09-27T00:00:00.000Z',
  });
  org.assets.forEach((a, i) => {
    a.hostname = `${a.id}.${spec.domain}`;
    a.records.value = Math.round(a.records.value * spec.scale);
    a.records.reason =
      'Generated fictional business records, not employee count or observed losses.';
    a.source = 'Bundled fictional scenario v1';
    a.services = [
      {
        ip: `192.0.2.${10 + i}`,
        port: a.id === 'identity' ? 636 : 443,
        transport: 'tcp',
        retrievedAt: org.createdAt,
        cves: [],
      },
    ];
  });
  org.inventory = org.assets.map((a) => a.hostname);
  org.budget = spec.id === 'demo-orbit' ? 100000 : spec.id === 'demo-meridian' ? 600000 : 300000;
  org.scans = [
    {
      collector: 'Fictional demo inventory',
      status: 'PREVIEW',
      checkedAt: org.createdAt,
      count: org.assets.length,
      message:
        'Generated assets and reserved documentation IPs. No organization was contacted or scanned.',
    },
  ];
  applyHistoricalPriors(org);
  return org;
}
const baseline = new Map<string, State>();
export function demoState(id: string, input?: Record<string, any>): State {
  if (!input && baseline.has(id)) return structuredClone(baseline.get(id)!);
  const org = demoOrganization(id);
  // Only whitelisted numeric edits are accepted; never accept a client-supplied topology or domain.
  if (input) {
    if (input.continuous === true)
      throw new Error('Live collection is disabled for fictional organizations');
    if (!Array.isArray(input.edits ?? []) || (input.edits?.length ?? 0) > 100)
      throw new Error('Too many scenario edits');
    applyEdits(org, input);
    org.continuous = false;
  }
  const output = compute(org);
  const state: State = {
    access: { role: 'viewer', demo: true, adminConfigured: false, storageReady: false },
    org,
    output,
    organizations: demoCatalog.map((o) => ({ id: o.id, name: o.name, example: true })),
    timeline: [
      {
        at: output.at,
        event: input ? 'Your isolated what-if calculation' : 'Fictional scenario loaded',
        ale: output.risk.ale,
        tag: 'PREVIEW',
        affected: org.assets.map((a) => a.id),
        alert: false,
      },
    ],
  };
  if (!input) baseline.set(id, structuredClone(state));
  return state;
}
