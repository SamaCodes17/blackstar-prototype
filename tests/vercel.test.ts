import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';

test('Vercel adapter accepts parsed edits while enforcing deployment origins and private access', async () => {
  process.env.PUBLIC_ORIGIN = 'https://blackstar-test.vercel.app';
  process.env.VERCEL_URL = 'blackstar-preview-test.vercel.app';
  process.env.DATABASE_URL = '';
  process.env.ADMIN_PASSWORD_HASH = '';
  process.env.SESSION_SECRET = '';
  const { default: handler } = await import('../api/[...path]');
  async function request(
    path: string,
    value: unknown,
    origin = process.env.PUBLIC_ORIGIN!,
    host = 'blackstar-test.vercel.app',
  ) {
    let status = 0,
      result = '';
    const req = {
      url: path,
      method: 'POST',
      body: value,
      headers: { host, origin, 'content-type': 'application/json' },
      socket: { remoteAddress: '127.0.0.1' },
    } as unknown as IncomingMessage;
    const res = {
      setHeader() {},
      writeHead(code: number) {
        status = code;
      },
      end(content: string) {
        result = content;
      },
    } as unknown as ServerResponse;
    await handler(req, res);
    return { status, data: JSON.parse(result) };
  }
  const updated = await request('/api/update?org=demo-northstar', { budget: 0 });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.org.budget, 0);
  const preview = await request(
    '/api/update',
    { budget: 100000 },
    'https://blackstar-preview-test.vercel.app',
    'blackstar-preview-test.vercel.app',
  );
  assert.equal(preview.status, 200);
  assert.equal(preview.data.org.budget, 100000);
  assert.equal((await request('/api/update', {}, 'https://attacker.example')).status, 403);
  assert.equal(
    (await request('/api/update', {}, process.env.PUBLIC_ORIGIN, 'attacker.example')).status,
    403,
  );
  assert.equal((await request('/api/organizations', {})).status, 403);
  assert.equal((await request('/api/update?org=private-org', {})).status, 404);
  assert.equal((await request('/api/update', [])).status, 400);
  assert.equal((await request('/api/update', { text: 'x'.repeat(100001) })).status, 400);
});
