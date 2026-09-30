import './config';
import { exchangeRates } from './exchange';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { compute } from '../src/core/pipeline';
import { selfcheck } from '../src/core/selfcheck';
import type { Organization, State, Tag } from '../src/core/types';
import { createOrganization } from './seed';
import {
  getOrg,
  getOutput,
  organizations,
  save,
  timeline,
  initializeStore,
  persistentStorage,
} from './store';
import { normalizeDomain, scan } from './collectors';
import { applyEdits, number } from './validation';
import { demoState, demoCatalog, isDemo } from './demo';
import { configured, checkPassword, isAdmin, sessionCookie, logoutCookie, allowed } from './auth';
import { publicOrigin, allowedOrigins } from './config';

let initialization: Promise<void> | undefined;
async function commit(org: Organization, event: string, tag: Tag = 'COMPUTED') {
  let before = 0;
  try {
    before = (await getOutput(org.id)).risk.ale;
  } catch {
    /* New assessment. */
  }
  const output = compute(org);
  await save(org, output, {
    at: output.at,
    event,
    ale: output.risk.ale,
    tag,
    affected: org.assets.map((a) => a.id),
    alert:
      before > 0 &&
      Math.abs(output.risk.ale - before) / before > org.assumptions.alertThreshold.value,
  });
}
async function state(id: string, admin: boolean, input?: Record<string, any>): Promise<State> {
  if (!isDemo(id) && !admin) throw new Error('Organization not found');
  const result: State = isDemo(id)
    ? demoState(id, input)
    : {
        org: await getOrg(id),
        output: await getOutput(id),
        timeline: await timeline(id),
        organizations: [],
        integrations: { shodanConfigured: Boolean(process.env.SHODAN_API_KEY?.trim()) },
      };
  result.access = {
    role: admin ? 'admin' : 'viewer',
    demo: isDemo(id),
    adminConfigured: configured(),
    storageReady: persistentStorage,
    collectionEnabled: admin && !isDemo(id) && process.env.ENABLE_LIVE_COLLECTION === 'true',
  };
  result.organizations = [
    ...demoCatalog.map((o) => ({ id: o.id, name: o.name, example: true })),
    ...(admin
      ? (await organizations()).map((o) => ({ id: o.id, name: o.name, example: false }))
      : []),
  ];
  return result;
}
function approvedDomain(domain: string) {
  const approved = (process.env.ADMIN_APPROVED_DOMAINS ?? '')
    .split(',')
    .map((d) => d.trim().toLowerCase());
  if (!approved.includes(domain))
    throw new Error(
      'An administrator must preapprove this exact domain in the server configuration after verifying permission',
    );
}
async function body(req: IncomingMessage) {
  const parsed = (req as IncomingMessage & { body?: unknown }).body;
  if (parsed !== undefined) {
    if (Buffer.byteLength(JSON.stringify(parsed)) > 100000)
      throw new Error('Request body too large');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error('JSON object required');
    return parsed as Record<string, any>;
  }
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > 100000) throw new Error('Request body too large');
  }
  const value = JSON.parse(raw || '{}');
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('JSON object required');
  return value as Record<string, any>;
}
function json(res: ServerResponse, code: number, value: unknown) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(JSON.stringify(value));
}
const busy = new Set<string>();
export async function handleApi(req: IncomingMessage, res: ServerResponse) {
  const requestHost = req.headers.host ?? '';
  if (!allowedOrigins.some((origin) => new URL(origin).host === requestHost))
    return json(res, 403, { error: 'Unrecognized host' });
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const url = new URL(req.url ?? '/', publicOrigin);
  try {
    await (initialization ??= initializeStore().catch((error) => {
      initialization = undefined;
      throw error;
    }));
    if (url.pathname === '/api/health' && req.method === 'GET')
      return json(res, 200, { status: 'ok', demo: true });
    if (req.method === 'GET' && url.pathname === '/api/exchange-rates')
      return json(res, 200, await exchangeRates());
    const admin = isAdmin(req.headers.cookie);
    const id = url.searchParams.get('org') ?? demoCatalog[0].id;
    if (req.method === 'GET' && ['/api/state', '/api/export'].includes(url.pathname)) {
      if (!isDemo(id) && !admin) return json(res, 404, { error: 'Organization not found' });
      if (url.pathname === '/api/export')
        res.setHeader('Content-Disposition', 'attachment; filename="blackstar-assessment.json"');
      return json(res, 200, await state(id, admin));
    }
    if (req.method !== 'POST') return json(res, 404, { error: 'Route not found' });
    if (!allowedOrigins.includes(req.headers.origin ?? ''))
      return json(res, 403, { error: 'Same-origin request required' });
    if (!req.headers['content-type']?.startsWith('application/json'))
      return json(res, 415, { error: 'JSON required' });
    const client = req.socket.remoteAddress ?? 'unknown'; // Do not trust arbitrary forwarding headers.
    if (!allowed('requests:' + client, 120) || !allowed('global-compute', 600))
      return json(res, 429, { error: 'Too many requests; please retry in a minute' });
    const input = await body(req);
    if (url.pathname === '/api/login') {
      if (!allowed('login-global', 20, 900000) || !allowed('login:' + client, 5, 900000))
        return json(res, 429, { error: 'Too many login attempts. Retry in 15 minutes' });
      if (!checkPassword(input.password))
        return json(res, 401, { error: 'Admin sign-in unavailable or credentials incorrect' });
      res.setHeader('Set-Cookie', sessionCookie());
      return json(res, 200, await state(demoCatalog[0].id, true));
    }
    if (url.pathname === '/api/logout') {
      res.setHeader('Set-Cookie', logoutCookie);
      return json(res, 200, await state(demoCatalog[0].id, false));
    }
    if (['/api/organizations', '/api/scan'].includes(url.pathname) && !admin)
      return json(res, 403, { error: 'Administrator access required' });
    if (!isDemo(id) && !admin) return json(res, 404, { error: 'Organization not found' });
    if (url.pathname === '/api/organizations') {
      if (!persistentStorage)
        throw new Error('Configure managed PostgreSQL before adding organizations');
      const domain = normalizeDomain(input.domain);
      approvedDomain(domain);
      if (typeof input.name !== 'string' || input.name.trim().length < 2 || input.name.length > 100)
        throw new Error('Name must contain 2 to 100 characters');
      if (!['education', 'government', 'msme', 'financial', 'other'].includes(input.sector))
        throw new Error('Invalid sector');
      number(input.size, 1, 10000000);
      if (!Number.isInteger(input.size)) throw new Error('Size must be an integer');
      if ((await organizations()).length >= 20)
        throw new Error('Prototype is limited to 20 private assessments');
      const org = createOrganization(input.name.trim(), domain, input.sector, input.size, []);
      await commit(org, 'Admin created a private assessment. No collection performed.', 'ASSUMED');
      return json(res, 201, await state(org.id, true));
    }
    if (isDemo(id)) {
      if (url.pathname === '/api/scan')
        throw new Error('Fictional organizations cannot be scanned');
      if (['/api/update', '/api/recompute', '/api/reset-example'].includes(url.pathname))
        return json(
          res,
          200,
          await state(id, admin, url.pathname === '/api/update' ? input : undefined),
        );
      if (url.pathname === '/api/selfcheck') {
        const data = demoState(id);
        return json(res, 200, selfcheck(data.org, data.output));
      }
      return json(res, 404, { error: 'Route not found' });
    }
    if (busy.has(id)) return json(res, 409, { error: 'Assessment update already in progress' });
    busy.add(id);
    try {
      const org = await getOrg(id);
      if (url.pathname === '/api/scan') {
        approvedDomain(org.domain);
        if (process.env.ENABLE_LIVE_COLLECTION !== 'true')
          throw new Error('Live collection is disabled by the deployment administrator');
        if (!allowed('scan:' + id, 1, 30000))
          return json(res, 429, { error: 'Wait thirty seconds before refreshing' });
        const result = await scan(org);
        await commit(result.org, 'Admin refreshed approved public evidence');
      } else if (url.pathname === '/api/update') {
        if (input.continuous)
          throw new Error('Background scanning is disabled; use an explicit admin refresh');
        applyEdits(org, input);
        org.continuous = false;
        await commit(org, 'Admin updated private assessment');
      } else if (url.pathname === '/api/recompute')
        await commit(org, 'Recomputed private assessment');
      else return json(res, 404, { error: 'Route not found' });
      return json(res, 200, await state(id, true));
    } finally {
      busy.delete(id);
    }
  } catch (error) {
    // Do not serialize database errors, connection strings or request URLs.
    const message = error instanceof Error ? error.message : 'Request failed';
    const safe = /password|postgres|database|connect|ECONN|relation|syntax|query/i.test(message)
      ? 'Storage unavailable; administrator review required'
      : message;
    return json(res, 400, { error: safe });
  }
}
