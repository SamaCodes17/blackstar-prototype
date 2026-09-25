import snapshot from '../fixtures/ct-srmist.json';
import type { Asset, Fact, Organization, Tag } from '../src/core/types';
export const assumed = (
  value: number,
  reason: string,
  min = value * 0.7,
  max = value * 1.3,
): Fact => ({ value, tag: 'ASSUMED', reason, min, max });
export function classify(host: string): [string, string] {
  const first = host.split('.')[0];
  if (/radius|sso|auth|login|mail/.test(first)) return ['Identity & access', 'identity'];
  if (/academia|erp|records|evarsity/.test(first)) return ['Academic records', 'records'];
  if (/lms|learn|skill/.test(first)) return ['Learning platform', 'learning'];
  if (/pay|fee/.test(first)) return ['Payment services', 'payments'];
  if (/alumni/.test(first)) return ['Alumni portal', 'portal'];
  if (/jee|admission/.test(first)) return ['Admissions portal', 'portal'];
  return [first === 'www' || host.split('.').length <= 3 ? 'Public web' : first, 'web'];
}
export function createOrganization(
  name: string,
  domain: string,
  sector: string,
  size: number,
  names: string[],
  example = false,
): Organization {
  const verified = names.filter(
    (h) => !h.includes('*') && (h === domain || h.endsWith('.' + domain)),
  );
  const preferred = example
    ? [
        'srmist.edu.in',
        'radius.srmist.edu.in',
        'academia.srmist.edu.in',
        'ilms.srmist.edu.in',
        'srmjee.srmist.edu.in',
        'alumni.srmist.edu.in',
      ].filter((h) => verified.includes(h))
    : verified.slice(0, 7);
  const selected = preferred.length ? preferred : [domain];
  const assets: Asset[] = selected.map((hostname, i) => {
    const [label, kind] = classify(hostname);
    return {
      id: `asset-${i}`,
      label,
      hostname,
      kind,
      hostTag: verified.includes(hostname) ? 'CITED' : 'ASSUMED',
      source: example ? snapshot.source : undefined,
      records: assumed(
        Math.round(size * (kind === 'records' ? 0.65 : kind === 'identity' ? 0.18 : 0.04)),
        'Disjoint equivalent loss records allocated from stated organization size; prevents treating repeated copies of the same records as independent full losses.',
      ),
      baseline: assumed(
        kind === 'identity' ? 0.12 : 0.035,
        'Annual organization-specific compromise baseline without a verified vulnerability.',
        0.005,
        0.2,
      ),
    };
  });
  if (example) {
    assets.push({
      id: 'vendor',
      label: 'External service',
      hostname: 'Hypothetical vendor integration',
      kind: 'vendor',
      hostTag: 'PREVIEW',
      records: assumed(
        size * 0.015,
        'Illustrative disjoint vendor exposure; no real supplier relationship asserted.',
      ),
      baseline: assumed(0.09, 'Illustrative annual supplier compromise baseline.', 0.01, 0.2),
    });
    // Sample associations are deliberately PREVIEW, even when the CVE itself is real.
    Object.assign(assets[0], {
      cve: 'CVE-2021-44228',
      epss: {
        value: 0.18,
        tag: 'PREVIEW' as Tag,
        reason: 'Illustrative EPSS input; sample CVE association, not a finding about SRMIST.',
      },
      kev: true,
      cvss: 10,
      findingTag: 'PREVIEW',
      product: 'Example Log4j scenario',
    });
  }
  // Dependencies cannot be inferred reliably from certificate names alone.
  // These are explicit scenario assumptions, never observed data flows.
  const edge = (from: string, to: string, weight: number) => ({
    from,
    to,
    weight: assumed(
      weight,
      'Hypothetical access/data dependency; certificate evidence does not prove this edge.',
      0.05,
      0.8,
    ),
    days: assumed(90, 'Assumed mean waiting time for cascade activation in days.', 1, 730),
    reason: 'Scenario dependency for risk exploration; validate with an asset owner.',
  });
  const edges = example
    ? [
        edge('asset-0', 'asset-1', 0.4),
        edge('asset-0', 'asset-4', 0.32),
        edge('asset-1', 'asset-2', 0.65),
        edge('asset-1', 'asset-3', 0.45),
        edge('asset-4', 'asset-2', 0.36),
        edge('asset-2', 'asset-5', 0.23),
        edge('vendor', 'asset-3', 0.45),
      ]
    : assets.slice(1).map((a, i) => edge(assets[i].id, a.id, 0.25));
  const node = (kind: string, fallback = 0) =>
    assets.find((a) => a.kind === kind)?.id ?? assets[fallback % assets.length].id;
  const definitions: [string, string, string, number, number, string[], string[], number][] = [
    [
      'patch',
      'Patch exposed services',
      'Validate versions, then prioritize confirmed exploited vulnerabilities and EPSS.',
      75000,
      0.78,
      [assets[0].id],
      [],
      10,
    ],
    [
      'mfa',
      'Enforce phishing-resistant MFA',
      'Protect identity entry points and reduce session compromise.',
      150000,
      0.8,
      [node('identity')],
      [],
      8.1,
    ],
    [
      'segment',
      'Segment critical records',
      'Restrict access paths into systems with the highest loss exposure.',
      125000,
      0.7,
      [],
      edges.filter((e) => e.to === node('records')).map((e) => `${e.from}>${e.to}`),
      7.5,
    ],
    [
      'vendor',
      'Restrict vendor access',
      'Limit third-party permissions and isolate integrations.',
      100000,
      0.65,
      [node('vendor')],
      edges.filter((e) => e.from === node('vendor')).map((e) => `${e.from}>${e.to}`),
      8.8,
    ],
    [
      'training',
      'Strengthen account hygiene',
      'Target phishing resistance and recovery procedures.',
      50000,
      0.25,
      [node('identity'), node('portal')],
      [],
      6.5,
    ],
    [
      'edr',
      'Harden critical workloads',
      'Improve prevention on records and learning workloads.',
      200000,
      0.6,
      [node('records'), node('learning')],
      [],
      9.8,
    ],
  ];
  const controls = definitions.map(
    ([id, name, description, cost, efficacy, nodes, edges, cvss]) => ({
      id,
      name,
      description,
      cost: assumed(
        cost,
        'Illustrative annual implementation price in rupees; replace with a quote.',
        25000,
        1000000,
      ),
      efficacy: assumed(
        efficacy,
        'Assumed proportional reduction in affected entry/edge probabilities.',
        0,
        0.95,
      ),
      nodes,
      edges,
      cvss,
    }),
  );
  return {
    id: example ? 'srmist-example' : crypto.randomUUID(),
    name,
    domain,
    sector,
    size,
    example,
    authorized: true,
    createdAt: new Date().toISOString(),
    assets,
    edges,
    controls,
    attackers: [
      {
        id: 'ransomware',
        name: 'Ransomware actor',
        prior: assumed(0.4, 'Scenario prior, not an empirical MITRE frequency.', 0, 1),
        entries: [assets[0].id, node('vendor')],
        preference: 'records',
        multiplier: 1.6,
      },
      {
        id: 'phishing',
        name: 'Credential actor',
        prior: assumed(0.35, 'Scenario prior motivated by credential attack techniques.', 0, 1),
        entries: [node('identity'), node('portal')],
        preference: 'identity',
        multiplier: 2,
      },
      {
        id: 'supply',
        name: 'Supply-chain actor',
        prior: assumed(0.25, 'Scenario prior for third-party access.', 0, 1),
        entries: [node('vendor'), assets[0].id],
        preference: 'learning',
        multiplier: 1.5,
      },
    ],
    assumptions: {
      costPerRecord: assumed(
        3000,
        'Illustrative rupee cost per equivalent lost record. The brief’s education-specific IBM figure could not be independently verified and is not cited.',
        1000,
        6000,
      ),
      exposure: assumed(
        0.2,
        'Scale global exploitation activity to this organization; uncalibrated scenario factor.',
        0.05,
        0.4,
      ),
      recordScale: assumed(
        1,
        'Scale the disjoint record-loss allocation to reflect local scope.',
        0.5,
        1.5,
      ),
      edgeScale: assumed(1, 'Multiplier for uncertain dependency strengths.', 0.5, 1.5),
      opportunity: assumed(
        0.5,
        'Probability of one deliberate attack opportunity in the selected horizon; game objective only.',
        0,
        1,
      ),
      alertThreshold: assumed(0.1, 'Relative ALE change that triggers an in-app alert.', 0.01, 1),
      partner: assumed(
        0.18,
        'PREVIEW economic network: non-overlapping partner disruption / direct loss.',
        0,
        1,
      ),
      sector: assumed(
        0.08,
        'PREVIEW network: incremental peer reputation loss / direct loss.',
        0,
        1,
      ),
      downstream: assumed(
        0.12,
        'PREVIEW network: incremental customer disruption / direct loss.',
        0,
        1,
      ),
    },
    scans: [
      {
        collector: 'Certificate transparency',
        status: example ? 'SNAPSHOT' : verified.length ? 'LIVE' : 'UNAVAILABLE',
        checkedAt: new Date().toISOString(),
        dataAt: example ? snapshot.fetchedAt : undefined,
        message: example
          ? 'Verified public CT snapshot. Only hostnames are observed; dependencies and loss assumptions are modeled.'
          : verified.length
            ? 'Public certificate names discovered.'
            : 'No certificate evidence available. Only the user-supplied domain is modeled.',
        count: verified.length,
      },
      {
        collector: 'Service / CVE correlation',
        status: 'PREVIEW',
        checkedAt: new Date().toISOString(),
        message:
          'No service key configured. Example findings are synthetic; real organizations retain baseline assumptions.',
        count: example ? 1 : 0,
      },
    ],
    inventory: verified,
    budget: 300000,
    horizon: 365,
    continuous: false,
  };
}
export const exampleOrganization = () =>
  createOrganization(
    'SRM Institute of Science and Technology',
    'srmist.edu.in',
    'education',
    60000,
    snapshot.names,
    true,
  );
