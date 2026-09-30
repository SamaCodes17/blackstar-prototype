import { isIP } from 'node:net';
import type { Organization } from '../src/core/types.js';
type Read = (url: string) => Promise<any>;
/** Only send globally routable IPv4 addresses to the passive host index. */
export function publicIPv4(ip: unknown): ip is string {
  if (typeof ip !== 'string' || isIP(ip) !== 4) return false;
  const [a, b, c] = ip.split('.').map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && (b === 168 || b === 0 || (b === 0 && c === 2))) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}
export async function lookupResolvedHosts(org: Organization, key: string | undefined, read: Read) {
  const matches: any[] = [];
  const hosts = [...new Set(org.assets.map((a) => a.hostname))].slice(0, 7);
  const byIP = new Map<string, any>();
  let resolved = 0,
    checked = 0,
    failed = 0,
    internetDB = 0;
  for (const hostname of hosts) {
    if (hostname !== org.domain && !hostname.endsWith('.' + org.domain)) continue;
    try {
      const dns = await read(
        `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A&edns_client_subnet=0.0.0.0%2F0`,
      );
      if (dns.Status !== 0) {
        failed++;
        continue;
      }
      const ips = [
        ...new Set<string>(
          (Array.isArray(dns.Answer) ? dns.Answer : [])
            .filter((r: any) => r.type === 1 && publicIPv4(r.data))
            .map((r: any) => r.data),
        ),
      ].slice(0, 2);
      if (!ips.length) {
        failed++;
        continue;
      }
      resolved++;
      for (const ip of ips) {
        let host = byIP.get(ip);
        if (!byIP.has(ip)) {
          try {
            if (!key) throw new Error('Use public IP index');
            host = await read(
              `https://api.shodan.io/shodan/host/${ip}?key=${encodeURIComponent(key)}`,
            );
          } catch (cause) {
            const reason = cause instanceof Error ? cause.message : '';
            if (!key || reason === 'Public index responded 403') {
              let snapshot;
              try {
                snapshot = await read(`https://internetdb.shodan.io/${ip}`);
              } catch (error) {
                if (error instanceof Error && error.message === 'Public index responded 404')
                  snapshot = { ip, ports: [], hostnames: [], vulns: [] };
                else throw error;
              }
              if (snapshot.ip !== ip || !Array.isArray(snapshot.ports))
                throw new Error('Invalid public IP-index response');
              host = {
                ip_str: ip,
                data: snapshot.ports.map((port: unknown) => ({
                  ip_str: ip,
                  port,
                  hostnames: snapshot.hostnames,
                  transport: 'unknown',
                  _provider: 'internetdb',
                  _ipCves: Array.isArray(snapshot.vulns)
                    ? snapshot.vulns.filter(
                        (c: unknown) => typeof c === 'string' && /^CVE-\d{4}-\d{4,}$/.test(c),
                      )
                    : [],
                })),
              };
              internetDB++;
            } else if (reason === 'Public index responded 404') host = { ip_str: ip, data: [] };
            else throw cause;
          }
          if (host.ip_str !== ip || !Array.isArray(host.data))
            throw new Error('Invalid host-index response');
          byIP.set(ip, host);
        }
        checked++;
        for (const service of host.data.slice(0, 40)) {
          if (!service || typeof service !== 'object' || (service.ip_str && service.ip_str !== ip))
            continue;
          matches.push({ ...service, ip_str: ip, _resolvedHostname: hostname });
        }
      }
    } catch (cause) {
      if (cause instanceof Error && /Public index responded (401|403|429)/.test(cause.message))
        throw cause;
      failed++;
    }
  }
  if (!checked) throw new Error('No usable resolved-host lookup');
  return {
    matches,
    message: `Shodan IP lookups via public DNS: ${resolved}/${hosts.length} hostnames resolved; ${byIP.size} unique IPv4 addresses checked; ${failed} incomplete hostname lookups. ${internetDB} IPs used Shodan InternetDB (weekly public snapshot, no banners); remaining IPs used the authenticated host API. Filtered search was unavailable or not configured. DNS-associated IP services can belong to shared hosting; CVEs are only associated with an asset when an exact indexed hostname and product/version agree. IPv4 only; at most two IPs per hostname.`,
  };
}
