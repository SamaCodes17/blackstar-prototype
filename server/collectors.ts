import { lookupResolvedHosts } from './shodan.js';
import { domainToASCII } from 'node:url';
import { isIP } from 'node:net';
import { cache, cached } from './store.js';
import { assumed, classify } from './seed.js';
import type { Organization, ScanStatus } from '../src/core/types.js';

const allowedHosts = new Set([
  'crt.sh',
  'api.certspotter.com',
  'api.first.org',
  'www.cisa.gov',
  'services.nvd.nist.gov',
  'api.shodan.io',
  'dns.google',
  'internetdb.shodan.io',
]);
const nextRequest = new Map<string, number>();
const queues = new Map<string, Promise<void>>();
export function normalizeDomain(input: unknown) {
  if (typeof input !== 'string') throw new Error('Enter a public domain name');
  if (/[\x00-\x1f\x7f/:?#@\\]/.test(input))
    throw new Error('Use only a domain name, without URL or control characters');
  const domain = domainToASCII(input.trim().toLowerCase().replace(/\.$/, ''));
  if (
    domain.length > 253 ||
    !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(
      domain,
    ) ||
    /\.(localhost|local|internal|test|invalid)$/.test(domain)
  )
    throw new Error('Use a public domain without a scheme, port, path or IP address');
  return domain;
}
export async function publicJson(url: string): Promise<any> {
  const host = new URL(url).hostname;
  const work = (queues.get(host) ?? Promise.resolve()).then(() => fetchPublicJson(url));
  queues.set(
    host,
    work.then(
      () => undefined,
      () => undefined,
    ),
  );
  return work;
}
async function fetchPublicJson(url: string): Promise<any> {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname))
    throw new Error('Collector host not allowed');
  const wait = (nextRequest.get(parsed.hostname) ?? 0) - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  nextRequest.set(
    parsed.hostname,
    Date.now() + (parsed.hostname === 'services.nvd.nist.gov' ? 6500 : 1200),
  );
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8500),
    redirect: 'error',
    headers: {
      'User-Agent': 'BlackStarPrototype/0.1 passive-public-index-research',
      ...(parsed.hostname === 'services.nvd.nist.gov' && process.env.NVD_API_KEY
        ? { apiKey: process.env.NVD_API_KEY }
        : {}),
    },
  });
  if (!response.ok) throw new Error(`Public index responded ${response.status}`);
  if (Number(response.headers.get('content-length') ?? 0) > 16_000_000)
    throw new Error('Index response too large');
  const reader = response.body!.getReader(),
    chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 16_000_000) {
      await reader.cancel();
      throw new Error('Index response too large');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
export async function discover(domain: string): Promise<{ names: string[]; source: string }> {
  domain = normalizeDomain(domain);
  const clean = (names: string[]) =>
    [
      ...new Set(
        names
          .map((n) => n.trim().toLowerCase())
          .filter((n) => !n.includes('*') && (n === domain || n.endsWith('.' + domain))),
      ),
    ]
      .sort()
      .slice(0, 1000);
  try {
    const source = `https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`,
      rows = await publicJson(source);
    const names = clean(rows.flatMap((r: { name_value: string }) => r.name_value.split('\n')));
    if (names.length) return { names, source };
  } catch {
    /* bounded fallback to another passive index */
  }
  const source = `https://api.certspotter.com/v1/issuances?domain=${encodeURIComponent(domain)}&include_subdomains=true&expand=dns_names`,
    rows = await publicJson(source);
  return { names: clean(rows.flatMap((r: { dns_names: string[] }) => r.dns_names)), source };
}
export async function scan(
  input: Organization,
  adapters = { discover, read: publicJson },
): Promise<{ org: Organization; changed: string[] }> {
  if (input.domain.endsWith('.example') || input.domain.endsWith('.invalid'))
    throw new Error('Fictional organizations cannot be scanned');
  const org = structuredClone(input),
    checkedAt = new Date().toISOString(),
    scans: ScanStatus[] = [],
    changed = new Set<string>();
  const status = (
    collector: string,
    state: ScanStatus['status'],
    count: number,
    message: string,
    dataAt?: string,
    issue?: ScanStatus['issue'],
  ) => scans.push({ collector, status: state, count, message, checkedAt, dataAt, issue });
  try {
    const result = await adapters.discover(org.domain);
    await cache(org.id, 'ct', result);
    org.inventory = result.names;
    for (const asset of org.assets)
      if (result.names.includes(asset.hostname)) {
        asset.hostTag = 'CITED';
        asset.source = result.source;
      }
    for (const hostname of result.names
      .filter((h) => !org.assets.some((a) => a.hostname === h))
      .slice(0, Math.max(0, 7 - org.assets.length))) {
      const [label, kind] = classify(hostname),
        id = crypto.randomUUID();
      org.assets.push({
        id,
        label,
        hostname,
        kind,
        source: result.source,
        hostTag: 'CITED',
        records: assumed(
          Math.round(org.size * 0.02),
          'Additional disjoint equivalent record loss allocation; review locally.',
        ),
        baseline: assumed(0.035, 'Annual baseline without verified service evidence.', 0.005, 0.2),
      });
      changed.add(id);
    }
    status(
      'Certificate transparency',
      'LIVE',
      result.names.length,
      'Public certificate names; results may be paginated and are not an exhaustive asset inventory.',
      checkedAt,
    );
  } catch {
    const old = await cached(org.id, 'ct');
    status(
      'Certificate transparency',
      org.inventory.length ? 'SNAPSHOT' : 'UNAVAILABLE',
      org.inventory.length,
      'Indexes unavailable. Retaining the last known inventory; no live discovery is claimed.',
      old?.at ?? input.scans.find((s) => s.collector === 'Certificate transparency')?.dataAt,
    );
  }
  {
    try {
      let data: { matches: any[]; message?: string };
      try {
        if (!process.env.SHODAN_API_KEY?.trim()) throw new Error('Use public IP index');
        data = await adapters.read(
          `https://api.shodan.io/shodan/host/search?key=${encodeURIComponent(process.env.SHODAN_API_KEY)}&query=${encodeURIComponent('hostname:' + org.domain)}`,
        );
      } catch (cause) {
        if (
          !(cause instanceof Error) ||
          !['Public index responded 403', 'Use public IP index'].includes(cause.message)
        )
          throw cause;
        data = await lookupResolvedHosts(org, process.env.SHODAN_API_KEY!, adapters.read);
      }
      if (!Array.isArray(data.matches)) throw new Error('Invalid service-index response');
      let matches = 0;
      for (const asset of org.assets) {
        if (
          !data.message ||
          data.matches.some(
            (service) =>
              service?._resolvedHostname === asset.hostname ||
              service?.hostnames?.includes(asset.hostname),
          )
        )
          asset.services = [];
      }
      for (const service of data.matches ?? []) {
        if (
          !service ||
          typeof service !== 'object' ||
          typeof service.ip_str !== 'string' ||
          !isIP(service.ip_str) ||
          !Number.isInteger(service.port) ||
          service.port < 1 ||
          service.port > 65535
        )
          continue;
        const hostnames = Array.isArray(service.hostnames)
          ? service.hostnames
              .filter((name: unknown): name is string => typeof name === 'string')
              .map((name: string) => name.toLowerCase().replace(/\.$/, ''))
          : [];
        const assets = org.assets.filter(
          (a) =>
            hostnames.includes(a.hostname.toLowerCase()) ||
            service._resolvedHostname === a.hostname,
        );
        const cves = (
          Array.isArray(service.vulns) ? service.vulns : Object.keys(service.vulns ?? {})
        ).filter(
          (c: unknown): c is string => typeof c === 'string' && /^CVE-\d{4}-\d{4,}$/.test(c),
        );
        for (const asset of assets) {
          if (
            typeof service.ip_str === 'string' &&
            isIP(service.ip_str) &&
            Number.isInteger(service.port) &&
            service.port > 0 &&
            service.port <= 65535 &&
            asset.services!.length < 20
          ) {
            asset.services!.push({
              association: hostnames.includes(asset.hostname.toLowerCase())
                ? 'indexed-hostname'
                : 'dns-ip',
              ip: service.ip_str,
              port: service.port,
              transport:
                service._provider === 'internetdb'
                  ? 'unknown'
                  : service.transport === 'udp'
                    ? 'udp'
                    : 'tcp',
              provider: service._provider === 'internetdb' ? 'internetdb' : 'shodan',
              ipCves: service._ipCves,
              product: typeof service.product === 'string' ? service.product : undefined,
              version: typeof service.version === 'string' ? service.version : undefined,
              observedAt:
                typeof service.timestamp === 'string' &&
                Number.isFinite(Date.parse(service.timestamp))
                  ? service.timestamp
                  : undefined,
              retrievedAt: checkedAt,
              cves,
            });
            matches++;
          }
          // Only a third-party exact hostname match and explicit CVE record creates an association.
          const cve = cves[0];
          if (
            cve &&
            hostnames.includes(asset.hostname.toLowerCase()) &&
            typeof service.product === 'string' &&
            service.product &&
            typeof service.version === 'string' &&
            service.version
          ) {
            if (asset.cve !== cve) {
              delete asset.epss;
              delete asset.kev;
              delete asset.cvss;
            }
            asset.cve = cve;
            asset.product = `${service.product} ${service.version}`;
            asset.findingTag = 'CITED';
            changed.add(asset.id);
          }
        }
      }
      status(
        'Service / CVE correlation',
        'LIVE',
        matches,
        data.message ??
          'Shodan indexed services matched to modeled hostnames. Version-backed CVE associations are third-party observations, not independently verified on target. One search page; not an exhaustive inventory.',
        undefined,
      );
    } catch (cause) {
      const httpCode =
        cause instanceof Error
          ? cause.message.match(/^Public index responded (\d{3})$/)?.[1]
          : undefined;
      const issue =
        httpCode === '401' || httpCode === '403'
          ? 'ACCESS_DENIED'
          : httpCode === '429'
            ? 'RATE_LIMITED'
            : undefined;
      status(
        'Service / CVE correlation',
        org.assets.some((a) => a.services?.length || a.findingTag === 'CITED')
          ? 'SNAPSHOT'
          : 'UNAVAILABLE',
        org.assets.reduce((sum, a) => sum + (a.services?.length ?? 0), 0),
        issue === 'ACCESS_DENIED'
          ? 'Shodan rejected search access. Check key validity and account membership/search permissions. A configured key alone does not grant search access. Retaining prior evidence.'
          : issue === 'RATE_LIMITED'
            ? 'Shodan temporarily rate-limited the lookup. Retaining prior evidence; try again later.'
            : 'Third-party service unavailable. Retaining prior findings; no new correlation claimed.',
        undefined,
        issue,
      );
    }
  }
  const cves = [...new Set(org.assets.flatMap((a) => (a.cve ? [a.cve] : [])))];
  if (cves.length) {
    await Promise.all([
      (async () => {
        try {
          const data = await adapters.read(
            `https://api.first.org/data/v1/epss?cve=${cves.join(',')}`,
          );
          await cache(org.id, 'epss', data);
          for (const row of data.data ?? [])
            for (const a of org.assets.filter((a) => a.cve === row.cve)) {
              const value = Number(row.epss);
              if (!Number.isFinite(value) || value < 0 || value > 1)
                throw new Error('Invalid EPSS probability');
              if (a.epss?.value !== value) changed.add(a.id);
              a.epss = {
                value,
                tag: 'CITED',
                reason: `FIRST global exploitation probability; feed date ${row.date}. Asset association has its own independent tag.`,
                source: 'epss',
              };
            }
          status(
            'FIRST EPSS',
            'LIVE',
            data.data?.length ?? 0,
            'Global exploitation probabilities refreshed. Local targeting remains assumed.',
            data.data?.[0]?.date,
          );
        } catch {
          status(
            'FIRST EPSS',
            'SNAPSHOT',
            cves.length,
            'Feed unavailable; keeping previously tagged values.',
            (await cached(org.id, 'epss'))?.at,
          );
        }
      })(),
      (async () => {
        try {
          const data = await adapters.read(
            'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
          );
          await cache(org.id, 'kev', {
            dateReleased: data.dateReleased,
            cves: (data.vulnerabilities ?? []).map((v: any) => v.cveID),
          });
          const known = new Set((data.vulnerabilities ?? []).map((v: any) => v.cveID));
          for (const a of org.assets.filter((a) => a.cve)) {
            if (a.kev !== known.has(a.cve)) changed.add(a.id);
            a.kev = known.has(a.cve);
          }
          status(
            'CISA KEV',
            'LIVE',
            org.assets.filter((a) => a.kev).length,
            'Confirmed global exploitation membership; not evidence of compromise here.',
            data.dateReleased,
          );
        } catch {
          status(
            'CISA KEV',
            'SNAPSHOT',
            0,
            'Catalog unavailable; keeping prior membership with prior scenario status.',
            (await cached(org.id, 'kev'))?.at,
          );
        }
      })(),
      (async () => {
        try {
          const data = await adapters.read(
            `https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${encodeURIComponent(cves[0])}`,
          );
          await cache(org.id, 'nvd', data);
          status(
            'NVD / CVE',
            'LIVE',
            data.totalResults ?? 0,
            'CVE definition refreshed for the first associated vulnerability. Remaining IDs retain their prior evidence.',
            checkedAt,
          );
        } catch {
          status(
            'NVD / CVE',
            'SNAPSHOT',
            0,
            'CVE feed unavailable; retaining existing scenario details.',
            (await cached(org.id, 'nvd'))?.at,
          );
        }
      })(),
    ]);
  } else
    status(
      'Vulnerability intelligence',
      'UNAVAILABLE',
      0,
      'No version-evidenced CVE associations. Risk uses explicit organization baselines.',
    );
  org.scans = scans;
  return { org, changed: [...changed] };
}
