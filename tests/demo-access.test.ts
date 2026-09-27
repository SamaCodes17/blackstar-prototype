import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { demoOrganization, demoState, demoCatalog } from '../server/demo';
import { historicalContext } from '../src/core/history';
import { scan } from '../server/collectors';
import { passwordHash, isAdmin, sessionCookie, checkPassword } from '../server/auth';

test('fictional companies use reserved addresses and cannot invoke collectors', async () => {
  for (const { id } of demoCatalog) {
    const org = demoOrganization(id);
    assert.ok(org.domain.endsWith('.example'));
    assert.ok(
      org.assets.every(
        (a) =>
          a.hostTag === 'PREVIEW' &&
          a.hostname.endsWith('.example') &&
          a.services?.every((s) => s.ip.startsWith('192.0.2.')),
      ),
    );
    let requests = 0;
    await assert.rejects(
      scan(org, {
        discover: async () => {
          requests++;
          return { names: [], source: '' };
        },
        read: async () => {
          requests++;
          return {};
        },
      }),
      /cannot be scanned/,
    );
    assert.equal(requests, 0);
  }
});
test('viewer what-if calculations do not mutate shared fixtures or accept arbitrary graphs', () => {
  const baseline = demoState('demo-northstar');
  const changed = demoState('demo-northstar', {
    budget: 0,
    domain: 'victim.org',
    assets: [],
    edits: [{ group: 'assets', id: 'records', key: 'records', value: 100 }],
  });
  assert.equal(changed.org.budget, 0);
  assert.equal(changed.org.domain, 'northstar.example');
  assert.equal(changed.org.assets.length, 7);
  assert.equal(demoState('demo-northstar').org.budget, baseline.org.budget);
  assert.notEqual(changed.output.risk.ale, baseline.output.risk.ale);
  assert.throws(() => demoState('srmist-example'), /not found/);
  assert.throws(() => demoState('demo-northstar', { continuous: true }), /disabled/);
});
test('VCDB aggregate reconciles categories, exclusions and normalized smoothed weights', () => {
  const history = historicalContext('msme');
  assert.equal(history.records, 4623);
  assert.equal(
    Object.values(history.categories).reduce((a, b) => a + b, 0),
    history.records,
  );
  assert.equal(
    Object.values(history.exclusions).reduce((a, b) => a + b, 0) + history.includedRecords,
    history.validatedRecords,
  );
  assert.ok(Math.abs(history.smoothed.reduce((a, b) => a + b, 0) - 1) < 1e-12);
  assert.notEqual(historicalContext('financial').records, history.records);
  const org = demoOrganization('demo-northstar');
  assert.ok(Math.abs(org.attackers.reduce((sum, a) => sum + a.prior.value, 0) - 1) < 1e-12);
  assert.equal(org.attackers[0].prior.value, 0.75 * 0.5 + (0.25 * (930 + 5)) / (4623 + 15));
});
test('admin credentials reject wrong passwords, tampering and expired sessions', () => {
  const oldHash = process.env.ADMIN_PASSWORD_HASH,
    oldSecret = process.env.SESSION_SECRET;
  try {
    process.env.ADMIN_PASSWORD_HASH = passwordHash('a-test-only-long-password');
    process.env.SESSION_SECRET = 'test-only-signing-secret-with-more-than-32-chars';
    assert.ok(checkPassword('a-test-only-long-password'));
    assert.equal(checkPassword('wrong'), false);
    const cookie = sessionCookie(1000000);
    assert.ok(isAdmin(cookie, 1000001));
    assert.equal(isAdmin(cookie, 1000000 + 14400001), false);
    assert.equal(isAdmin(cookie.replace(/blackstar_admin=./, 'blackstar_admin=9'), 1000001), false);
    assert.equal(isAdmin('blackstar_admin=invalid'), false);
  } finally {
    if (oldHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = oldHash;
    if (oldSecret === undefined) delete process.env.SESSION_SECRET;
    else process.env.SESSION_SECRET = oldSecret;
  }
});
test('HTTP boundaries: no private reads, no viewer admin writes, origin checks and admin login', async () => {
  const origin = 'http://127.0.0.1:4189';
  const child = spawn(
    process.execPath,
    [resolve('node_modules/tsx/dist/cli.mjs'), 'server/index.ts', '--production'],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: '4189',
        HOST: '127.0.0.1',
        PUBLIC_ORIGIN: origin,
        DATABASE_URL: '',
        BLACKSTAR_DB: ':memory:',
        SHODAN_API_KEY: '',
        ENABLE_LIVE_COLLECTION: 'false',
        ADMIN_PASSWORD_HASH: passwordHash('integration-test-admin-password'),
        SESSION_SECRET: 'integration-test-secret-at-least-32-characters',
      },
      stdio: 'pipe',
    },
  );
  try {
    await new Promise<void>((resolveReady, reject) => {
      const timer = setTimeout(() => reject(new Error('Test server startup timed out')), 15000);
      child.stdout.on('data', (chunk) => {
        if (String(chunk).includes('BlackStar ready')) {
          clearTimeout(timer);
          resolveReady();
        }
      });
      child.on('error', reject);
      child.on('exit', (code) => {
        clearTimeout(timer);
        reject(new Error(`Test server exited ${code}`));
      });
    });
    const post = (path: string, value: unknown = {}, cookie = '', requestOrigin = origin) =>
      fetch(origin + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: requestOrigin, Cookie: cookie },
        body: JSON.stringify(value),
      });
    for (const path of ['/api/state?org=srmist-example', '/api/export?org=srmist-example'])
      assert.equal((await fetch(origin + path)).status, 404);
    const response = await fetch(origin + '/api/state');
    const state = await response.json();
    assert.equal(state.access.role, 'viewer');
    assert.equal(state.organizations.length, 3);
    assert.ok(state.organizations.every((o: { id: string }) => o.id.startsWith('demo-')));
    assert.equal(state.integrations, undefined);
    assert.equal((await post('/api/organizations', { authorized: true })).status, 403);
    assert.equal((await post('/api/scan')).status, 403);
    assert.equal(
      (await post('/api/update', { budget: 0 }, '', 'https://attacker.example')).status,
      403,
    );
    assert.equal((await post('/api/update?org=demo-northstar', { budget: 0 })).status, 200);
    assert.equal((await (await fetch(origin + '/api/state')).json()).org.budget, 300000);
    assert.equal((await post('/api/login', { password: 'wrong' })).status, 401);
    const login = await post('/api/login', { password: 'integration-test-admin-password' });
    assert.equal(login.status, 200);
    const cookie = login.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.equal(
      (await (await fetch(origin + '/api/state', { headers: { Cookie: cookie } })).json()).access
        .role,
      'admin',
    );
    assert.equal((await post('/api/scan?org=demo-northstar', {}, cookie)).status, 400);
    const creation = await post(
      '/api/organizations',
      { name: 'Test', domain: 'example.com', sector: 'other', size: 20 },
      cookie,
    );
    assert.equal(creation.status, 400); // private persistence fails closed without a managed database
    assert.equal((await post('/api/logout', {}, cookie)).status, 200);
  } finally {
    child.kill();
  }
});
