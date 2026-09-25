import test from 'node:test';
import assert from 'node:assert/strict';
import { exampleOrganization } from '../server/seed';
import { selfcheck } from '../src/core/selfcheck';
import { compute } from '../src/core/pipeline';
import { descendants, exact, modelFor, topological } from '../src/core/risk';
import { normalizeDomain, publicJson } from '../server/collectors';
import { applyEdits } from '../server/validation';
import { infer, affectedNodes } from '../src/core/incremental';
import { formulate } from '../src/core/quantum';
import { optimize } from '../src/core/optimizer';
const org = exampleOrganization();
test('zero game loss produces a constant-zero risk surrogate', () => {
  const noOpportunity = structuredClone(org);
  noOpportunity.assumptions.opportunity.value = 0;
  const q = formulate(noOpportunity, optimize(noOpportunity).portfolios);
  assert.equal(q.constant, 0);
  assert.ok(q.linear.every((x) => x === 0));
  assert.ok(q.pairs.every((x) => x.coefficient === 0));
});
for (const c of selfcheck(org)) test(c.name, () => assert.ok(c.passed, c.detail));
test('domain normalization rejects injection, target URLs and local addresses', () => {
  assert.equal(normalizeDomain('  EXAMPLE.ORG. '), 'example.org');
  assert.match(normalizeDomain('उदाहरण.भारत'), /^xn--[a-z0-9-]+\.xn--[a-z0-9-]+$/);
  for (const s of [
    'localhost',
    '127.0.0.1',
    'https://example.com',
    'example.com:443',
    'example.com/path',
    'example.com?x',
    'foo.internal',
    'x\r\nheader:value',
  ])
    assert.throws(() => normalizeDomain(s));
});
test('collector allowlist rejects requests to target infrastructure and redirects by policy', async () => {
  await assert.rejects(publicJson('https://srmist.edu.in'));
  await assert.rejects(publicJson('http://crt.sh/'));
  await assert.rejects(publicJson('https://crt.sh.evil.example/'));
});
test('graph invariants reject cycles and unknown nodes', () => {
  assert.throws(() =>
    topological({
      ...org,
      edges: [...org.edges, { ...org.edges[0], from: org.edges[0].to, to: org.edges[0].from }],
    }),
  );
  assert.throws(() => topological({ ...org, edges: [{ ...org.edges[0], to: 'missing' }] }));
});
test('all portfolios preserve valid joint mass and nonnegative loss', () => {
  for (let mask = 0; mask < 64; mask++) {
    const r = exact(modelFor(org, mask));
    assert.ok(Math.abs(r.mass - 1) < 1e-9);
    assert.ok(r.ale >= 0);
    assert.ok(r.probabilities.every((p) => p >= 0 && p <= 1 + 1e-9));
  }
});
test('interventions never increase background loss', () => {
  const base = exact(modelFor(org)).ale;
  for (let mask = 0; mask < 64; mask++) assert.ok(exact(modelFor(org, mask)).ale <= base + 1e-6);
});
test('validation rejects malformed model edits', () => {
  for (const body of [
    { budget: -1 },
    { budget: 1 },
    { horizon: 7 },
    { edits: [{ group: 'assumptions', key: 'exposure', value: 2 }] },
    { edits: [{ group: 'controls', id: 'mfa', key: 'cost', value: 25001 }] },
  ])
    assert.throws(() => applyEdits(structuredClone(org), body));
});
test('affected set follows descendants without unrelated nodes', () => {
  const result = descendants(org, 'asset-1');
  assert.ok(result.includes('asset-2'));
  assert.ok(!result.includes('vendor'));
});
test('incremental joint inference matches full recomputation and preserves unrelated nodes', () => {
  const before = modelFor(org),
    after = structuredClone(before),
    changed = before.ids.indexOf('asset-1');
  after.e[changed] = 0.9;
  const previous = infer(before),
    incremental = infer(after, { model: before, result: previous }),
    full = infer(after);
  assert.ok(!affectedNodes(before, after).includes(before.ids.indexOf('vendor')));
  incremental.joint.forEach((p, i) => assert.ok(Math.abs(p - full.joint[i]) < 1e-12));
  assert.ok(Math.abs(incremental.ale - full.ale) < 1e-6);
  assert.ok(incremental.recomputed.length < before.ids.length);
  const repriced = { ...after, values: after.values.map((v) => v * 2) },
    reused = infer(repriced, { model: after, result: incremental });
  assert.equal(reused.recomputed.length, 0);
  assert.ok(Math.abs(reused.ale - full.ale * 2) < 1e-6);
});
test('pipeline narrates stored values and computes additive preview contagion', () => {
  const output = compute(org);
  assert.ok(selfcheck(org, output).every((c) => c.passed));
  assert.equal(
    output.contagion.total,
    output.contagion.direct +
      output.contagion.partner +
      output.contagion.sector +
      output.contagion.downstream,
  );
  assert.ok(output.risk.p90 >= 0);
});
