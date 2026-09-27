import data from '../../fixtures/vcdb-aggregate.json';
import type { Organization } from './types';

export function historicalContext(sector: string) {
  const code = ({ financial: '52', education: '61', government: '92' } as Record<string, string>)[
    sector
  ];
  const groups: Record<
    string,
    {
      records: number;
      categories: { ransomware: number; credentials: number; other: number };
      actions: Record<string, number>;
      assets: Record<string, number>;
    }
  > = data.groups;
  const matched = code && groups[code]?.records >= 30;
  const group = groups[matched ? code : 'all'];
  const counts = group.categories;
  const total = group.records + 15; // Five pseudocounts per category; avoid zero-weight actors.
  return {
    ...group,
    scope: matched ? `NAICS ${code} sector` : 'All sectors (no reliable sector match)',
    source: data.source,
    url: data.url,
    revision: data.revision,
    license: data.license,
    retrievedAt: data.retrievedAt,
    validatedRecords: data.validatedRecords,
    includedRecords: data.groups.all.records,
    exclusions: data.exclusions,
    method: data.method,
    limitation: data.limitation,
    smoothed: [counts.ransomware, counts.credentials, counts.other].map((n) => (n + 5) / total),
    blend: 0.25,
  };
}
export function applyHistoricalPriors(org: Organization) {
  const history = historicalContext(org.sector);
  const starting = [0.5, 0.3, 0.2];
  org.attackers.forEach((actor, index) => {
    actor.prior = {
      value: 0.75 * starting[index] + 0.25 * history.smoothed[index],
      tag: 'COMPUTED',
      source: history.url,
      reason: `Scenario mixture: 75% assumed starting weight plus 25% smoothed VCDB incident category frequency (${history.records} selected records). Not an annual attack probability. Category-to-entry mapping remains assumed.`,
    };
    if (index === 2) {
      actor.name = 'Other external actor';
      actor.entries = ['vendor', 'web'];
    }
  });
  return history;
}
