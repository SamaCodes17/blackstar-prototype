import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { compute } from '../src/core/pipeline';
import { descendants } from '../src/core/risk';
import { selfcheck } from '../src/core/selfcheck';
import { sources } from '../src/core/sources';
import type { Organization, State, Tag } from '../src/core/types';
import { createOrganization, exampleOrganization } from './seed';
import { getOrg, getOutput, organizations, save, timeline } from './store';
import { discover, normalizeDomain, scan } from './collectors';
import { applyEdits, number } from './validation';

try {
  process.loadEnvFile();
} catch {
  /* optional local environment */
}
const port = Number(process.env.PORT ?? 4173),
  host = process.env.HOST ?? '127.0.0.1';
if (!['127.0.0.1', 'localhost', '::1'].includes(host))
  throw new Error('This prototype has no multi-user authentication. Bind to loopback only.');
function commit(
  org: Organization,
  event: string,
  tag: Tag = 'COMPUTED',
  affected = org.assets.map((a) => a.id),
) {
  let before = 0;
  try {
    before = getOutput(org.id).risk.ale;
  } catch {
    /* new organization */
  }
  const output = compute(org);
  save(org, output, {
    at: output.at,
    event,
    ale: output.risk.ale,
    tag,
    affected,
    alert:
      before > 0 &&
      Math.abs(output.risk.ale - before) / before > org.assumptions.alertThreshold.value,
  });
}
if (!organizations().length)
  commit(exampleOrganization(), 'Verified CT example loaded; modeled loss assumptions', 'PREVIEW');
for (const org of organizations())
  if (!getOutput(org.id).derivation)
    commit(org, 'Output contract refreshed after prototype update');
const state = (id: string): State => ({
  integrations: { shodanConfigured: Boolean(process.env.SHODAN_API_KEY?.trim()) },
  org: getOrg(id),
  output: getOutput(id),
  timeline: timeline(id),
  organizations: organizations().map((o) => ({ id: o.id, name: o.name, example: o.example })),
});
const busy = new Set<string>(),
  lastScan = new Map<string, number>();
async function refresh(id: string, scheduled = false) {
  if (busy.has(id)) throw new Error('This organization is already being updated');
  if (Date.now() - (lastScan.get(id) ?? 0) < 30000)
    throw new Error('Please wait thirty seconds between public-index refreshes');
  busy.add(id);
  lastScan.set(id, Date.now());
  try {
    const { org, changed } = await scan(getOrg(id));
    const affected = [...new Set(changed.flatMap((n) => descendants(org, n)))];
    commit(
      org,
      `${scheduled ? 'Scheduled' : 'Manual'} evidence refresh${changed.length ? ' · evidence changed' : ' · no model-input changes'}`,
      'COMPUTED',
      affected,
    );
  } finally {
    busy.delete(id);
  }
}
async function body(req: IncomingMessage) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100000) throw new Error('Request body too large');
  }
  return JSON.parse(raw || '{}') as Record<string, any>;
}
function json(res: ServerResponse, code: number, value: unknown) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(value));
}
const production = process.argv.includes('--production');
const vite = production
  ? undefined
  : await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
const server = createServer(async (req, res) => {
  const requestHost = req.headers.host ?? '';
  if (
    ![`${host}:${port}`, `localhost:${port}`, `127.0.0.1:${port}`, `[::1]:${port}`].includes(
      requestHost,
    )
  )
    return json(res, 403, { error: 'Unrecognized host' });
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  const url = new URL(req.url ?? '/', `http://${requestHost}`);
  if (!url.pathname.startsWith('/api/')) {
    if (vite) return vite.middlewares(req, res);
    try {
      const root = resolve('dist'),
        requested = resolve(root, '.' + decodeURIComponent(url.pathname));
      if (
        !requested.startsWith(root + '\\') &&
        !requested.startsWith(root + '/') &&
        requested !== root
      )
        throw new Error('Invalid path');
      let file = requested;
      try {
        if (!(await stat(file)).isFile()) file = resolve(root, 'index.html');
      } catch {
        file = resolve(root, 'index.html');
      }
      const content = await readFile(file);
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }
  try {
    if (req.method === 'POST') {
      if (req.headers.origin && req.headers.origin !== `http://${requestHost}`)
        return json(res, 403, { error: 'Cross-origin write rejected' });
      if (!req.headers['content-type']?.startsWith('application/json'))
        return json(res, 415, { error: 'JSON required' });
    }
    const id = url.searchParams.get('org') ?? 'srmist-example';
    if (req.method === 'GET' && url.pathname === '/api/state') return json(res, 200, state(id));
    if (req.method === 'GET' && url.pathname === '/api/export') {
      const data = { org: getOrg(id), output: getOutput(id), timeline: timeline(id) };
      res.setHeader('Content-Disposition', 'attachment; filename="blackstar-evidence-report.json"');
      return json(res, 200, {
        ...data,
        references: sources,
        methodology:
          'Exact small DAG inference. Scenario estimates, not validated forecasts. See README.',
        exportedAt: new Date().toISOString(),
      });
    }
    if (req.method !== 'POST') return json(res, 404, { error: 'Route not found' });
    const input = await body(req);
    if (url.pathname === '/api/organizations') {
      const domain = normalizeDomain(input.domain);
      if (input.authorized !== true)
        throw new Error('Confirm authorization before creating an assessment');
      if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.length > 100)
        throw new Error('Organization name must contain between two and one hundred characters');
      if (!['education', 'government', 'msme', 'financial', 'other'].includes(input.sector))
        throw new Error('Select a valid sector');
      number(input.size, 1, 10000000);
      if (!Number.isInteger(input.size)) throw new Error('Size must be an integer');
      if (organizations().length >= 20)
        throw new Error('Local prototype supports twenty saved organizations');
      let names: string[] = [],
        source: string | undefined;
      try {
        const found = await discover(domain);
        names = found.names;
        source = found.source;
      } catch {
        /* honest one-domain baseline fallback */
      }
      const org = createOrganization(input.name.trim(), domain, input.sector, input.size, names);
      org.assets.forEach((a) => {
        a.source = source;
      });
      commit(org, 'Authorized organization created', names.length ? 'COMPUTED' : 'ASSUMED');
      return json(res, 201, state(org.id));
    }
    if (url.pathname === '/api/scan') {
      await refresh(id);
      return json(res, 200, state(id));
    }
    if (url.pathname === '/api/selfcheck')
      return json(res, 200, selfcheck(getOrg(id), getOutput(id)));
    if (busy.has(id))
      return json(res, 409, { error: 'Evidence refresh in progress; retry after it completes' });
    if (url.pathname === '/api/update') {
      const org = getOrg(id);
      applyEdits(org, input);
      commit(org, input.edits?.length ? 'Assumptions updated' : 'Budget or horizon updated');
      return json(res, 200, state(id));
    }
    if (url.pathname === '/api/recompute') {
      commit(getOrg(id), 'Simulation recomputed with fixed comparison seed');
      return json(res, 200, state(id));
    }
    if (url.pathname === '/api/simulate') {
      const org = getOrg(id),
        asset = org.assets.find((a) => a.id === input.asset);
      if (!asset) throw new Error('Choose an asset');
      asset.epss = {
        value: 0.85,
        tag: 'PREVIEW',
        reason: 'Injected demonstration event; no real vulnerability finding.',
      };
      asset.cve = 'CVE-2021-44228';
      asset.kev = true;
      asset.findingTag = 'PREVIEW';
      commit(
        org,
        `PREVIEW: exploit scenario on ${asset.label}`,
        'PREVIEW',
        descendants(org, asset.id),
      );
      return json(res, 200, state(id));
    }
    if (url.pathname === '/api/reset-example' && id === 'srmist-example') {
      commit(exampleOrganization(), 'Example scenario reset', 'PREVIEW');
      return json(res, 200, state(id));
    }
    return json(res, 404, { error: 'Route not found' });
  } catch (error) {
    return json(res, 400, { error: error instanceof Error ? error.message : 'Request failed' });
  }
});
server.listen(port, host, () => console.log(`BlackStar ready at http://${host}:${port}`));
const interval = Math.max(1, Number(process.env.SCAN_INTERVAL_MINUTES) || 60) * 60000;
const timer = setInterval(() => {
  for (const org of organizations().filter((o) => o.continuous))
    void refresh(org.id, true).catch(() => undefined);
}, interval);
timer.unref();
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => {
    clearInterval(timer);
    server.close();
    void vite?.close();
  });
