import { domainToASCII } from 'node:url';
import { cache, cached } from './store';
import { assumed, classify } from './seed';
import type { Organization, ScanStatus } from '../src/core/types';

const allowedHosts = new Set(['crt.sh', 'api.certspotter.com', 'api.first.org', 'www.cisa.gov', 'services.nvd.nist.gov', 'api.shodan.io']);
const nextRequest = new Map<string, number>();
export function normalizeDomain(input: unknown) {
  if (typeof input !== 'string') throw new Error('Enter a public domain name');
  if (/[\x00-\x1f\x7f/:?#@\\]/.test(input)) throw new Error('Use only a domain name, without URL or control characters');
  const domain = domainToASCII(input.trim().toLowerCase().replace(/\.$/, ''));
  if (domain.length > 253 || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(domain) || /\.(localhost|local|internal|test|invalid)$/.test(domain)) throw new Error('Use a public domain without a scheme, port, path or IP address');
  return domain;
}
export async function publicJson(url: string): Promise<any> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname)) throw new Error('Collector host not allowed');
  const wait = (nextRequest.get(parsed.hostname) ?? 0) - Date.now();
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
  nextRequest.set(parsed.hostname, Date.now() + (parsed.hostname === 'services.nvd.nist.gov' ? 6500 : 1200));
  const response = await fetch(url, { signal: AbortSignal.timeout(8500), redirect: 'error', headers: { 'User-Agent': 'BlackStarPrototype/0.1 passive-public-index-research', ...(parsed.hostname === 'services.nvd.nist.gov' && process.env.NVD_API_KEY ? { apiKey: process.env.NVD_API_KEY } : {}) } });
  if (!response.ok) throw new Error(`Public index responded ${response.status}`);
  if (Number(response.headers.get('content-length') ?? 0) > 16_000_000) throw new Error('Index response too large');
  const reader = response.body!.getReader(), chunks: Uint8Array[] = []; let bytes = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 16_000_000) { await reader.cancel(); throw new Error('Index response too large'); } chunks.push(value); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function discover(domain: string): Promise<{ names: string[]; source: string }> {
  domain = normalizeDomain(domain);
  const clean = (names: string[]) => [...new Set(names.map(n => n.trim().toLowerCase()).filter(n => !n.includes('*') && (n === domain || n.endsWith('.' + domain))))].sort().slice(0, 1000);
  try {
    const source = `https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`, rows = await publicJson(source);
    const names = clean(rows.flatMap((r: { name_value: string }) => r.name_value.split('\n')));
    if (names.length) return { names, source };
  } catch { /* bounded fallback to another passive index */ }
  const source = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names`, rows = await publicJson(source);
  return { names: clean(rows.flatMap((r: { dns_names: string[] }) => r.dns_names)), source };
}
export async function scan(input: Organization): Promise<{ org: Organization; changed: string[] }> {
  const org = structuredClone(input), checkedAt = new Date().toISOString(), scans: ScanStatus[] = [], changed = new Set<string>();
  const status = (collector: string, state: ScanStatus['status'], count: number, message: string, dataAt?: string) => scans.push({ collector, status: state, count, message, checkedAt, dataAt });
  try {
    const result = await discover(org.domain); cache(org.id, 'ct', result);
    org.inventory = result.names;
    for (const asset of org.assets) if (result.names.includes(asset.hostname)) { asset.hostTag = 'CITED'; asset.source = result.source; }
    for (const hostname of result.names.filter(h => !org.assets.some(a => a.hostname === h)).slice(0, Math.max(0, 7 - org.assets.length))) {
      const [label, kind] = classify(hostname), id = crypto.randomUUID();
      org.assets.push({ id, label, hostname, kind, source: result.source, hostTag: 'CITED', records: assumed(Math.round(org.size * .02), 'Additional disjoint equivalent record loss allocation; review locally.'), baseline: assumed(.035, 'Annual baseline without verified service evidence.', .005, .2) }); changed.add(id);
    }
    status('Certificate transparency', 'LIVE', result.names.length, 'Public certificate names; results may be paginated and are not an exhaustive asset inventory.', checkedAt);
  } catch {
    const old = cached(org.id, 'ct');
    status('Certificate transparency', org.inventory.length ? 'SNAPSHOT' : 'UNAVAILABLE', org.inventory.length, 'Indexes unavailable. Retaining the last known inventory; no live discovery is claimed.', old?.at ?? input.scans.find(s => s.collector === 'Certificate transparency')?.dataAt);
  }
  if (process.env.SHODAN_API_KEY) {
    try {
      const data = await publicJson(`https://api.shodan.io/shodan/host/search?key=${encodeURIComponent(process.env.SHODAN_API_KEY)}&query=${encodeURIComponent('hostname:' + org.domain)}`);
      let matches = 0;
      for (const service of data.matches ?? []) {
        const asset = org.assets.find(a => service.hostnames?.includes(a.hostname));
        // Only a third-party exact hostname match and explicit CVE record creates an association.
        const cve = Object.keys(service.vulns ?? {}).find(c => /^CVE-\d{4}-\d{4,}$/.test(c));
        if (asset && cve && service.product && service.version) { asset.cve = cve; asset.product = `${service.product} ${service.version}`; asset.findingTag = 'CITED'; changed.add(asset.id); matches++; }
      }
      status('Service / CVE correlation', 'LIVE', matches, 'Third-party indexed hostname, product and version association; not independently verified on target.', checkedAt);
    } catch { status('Service / CVE correlation', 'SNAPSHOT', 0, 'Third-party service unavailable. Retaining prior findings; no new correlation claimed.'); }
  } else status('Service / CVE correlation', 'PREVIEW', org.assets.filter(a => a.findingTag === 'PREVIEW').length, 'Optional Shodan key absent. Example associations remain PREVIEW; no CVEs inferred from hostnames.');
  const cves = [...new Set(org.assets.flatMap(a => a.cve ? [a.cve] : []))];
  if (cves.length) {
    await Promise.all([
      (async () => { try {
        const data = await publicJson(`https://api.first.org/data/v1/epss?cve=${cves.join(',')}`); cache(org.id, 'epss', data);
        for (const row of data.data ?? []) for (const a of org.assets.filter(a => a.cve === row.cve)) { if (a.epss?.value !== Number(row.epss)) changed.add(a.id); a.epss = { value: Number(row.epss), tag: 'CITED', reason: `FIRST global exploitation probability; feed date ${row.date}. Asset association has its own independent tag.`, source: 'epss' }; }
        status('FIRST EPSS', 'LIVE', data.data?.length ?? 0, 'Global exploitation probabilities refreshed. Local targeting remains assumed.', data.data?.[0]?.date);
      } catch { status('FIRST EPSS', 'SNAPSHOT', cves.length, 'Feed unavailable; keeping previously tagged values.', cached(org.id, 'epss')?.at); } })(),
      (async () => { try {
        const data = await publicJson('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json'); cache(org.id, 'kev', { dateReleased: data.dateReleased, cves: (data.vulnerabilities ?? []).map((v: any) => v.cveID) });
        const known = new Set((data.vulnerabilities ?? []).map((v: any) => v.cveID));
        for (const a of org.assets.filter(a => a.cve)) { if (a.kev !== known.has(a.cve)) changed.add(a.id); a.kev = known.has(a.cve); }
        status('CISA KEV', 'LIVE', org.assets.filter(a => a.kev).length, 'Confirmed global exploitation membership; not evidence of compromise here.', data.dateReleased);
      } catch { status('CISA KEV', 'SNAPSHOT', 0, 'Catalog unavailable; keeping prior membership with prior scenario status.', cached(org.id, 'kev')?.at); } })(),
      (async () => { try {
        const data = await publicJson(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cves[0])}`); cache(org.id, 'nvd', data);
        status('NVD / CVE', 'LIVE', data.totalResults ?? 0, 'CVE definition refreshed for the first associated vulnerability. Remaining IDs retain their prior evidence.', checkedAt);
      } catch { status('NVD / CVE', 'SNAPSHOT', 0, 'CVE feed unavailable; retaining existing scenario details.', cached(org.id, 'nvd')?.at); } })()
    ]);
  } else status('Vulnerability intelligence', 'UNAVAILABLE', 0, 'No version-evidenced CVE associations. Risk uses explicit organization baselines.');
  org.scans = scans;
  return { org, changed: [...changed] };
}
