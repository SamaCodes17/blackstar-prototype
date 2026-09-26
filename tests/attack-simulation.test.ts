import test from 'node:test';
import assert from 'node:assert/strict';
import { exampleOrganization } from '../server/seed';
import {
  compromiseImpact,
  illustrativeNetwork,
  scenarioChoices,
  withConnection,
} from '../src/core/attackSimulation';
const org = illustrativeNetwork(exampleOrganization());
test('a selected breach reaches both branches and their shared descendants without affecting upstream nodes', () => {
  const result = compromiseImpact(org, 'app');
  const p = (id: string) => result.probabilities[result.ids.indexOf(id)];
  assert.equal(p('app'), 1);
  assert.equal(p('web'), 0);
  assert.equal(p('identity'), 0);
  assert.equal(p('vendor'), 0);
  assert.ok(p('records') > 0);
  assert.ok(p('payments') > 0);
  assert.ok(p('backup') > 0);
  const model = result.model;
  const weight = (to: string, from: string) =>
    model.parents[result.ids.indexOf(to)].find((p) => model.ids[p.node] === from)!.p;
  const viaRecords = weight('records', 'app') * weight('backup', 'records');
  const viaPayments = weight('payments', 'app') * weight('backup', 'payments');
  assert.ok(Math.abs(p('backup') - (1 - (1 - viaRecords) * (1 - viaPayments))) < 1e-9);
});
test('protections reduce downstream propagation but cannot undo the forced breach', () => {
  const mask = org.controls.reduce((m, c, i) => (c.id === 'segment' ? m | (1 << i) : m), 0);
  const before = compromiseImpact(org, 'app');
  const after = compromiseImpact(org, 'app', mask);
  assert.equal(after.probabilities[after.ids.indexOf('app')], 1);
  assert.ok(after.ale < before.ale);
});
test('scenario entry points change in the illustrative network and disconnected graphs stay disconnected', () => {
  assert.deepEqual(
    scenarioChoices(org).map((r) => r.path[0]),
    ['web', 'identity', 'vendor'],
  );
  const disconnected = { ...org, edges: [] };
  const result = compromiseImpact(disconnected, 'app');
  assert.equal(result.probabilities.filter((p) => p > 0).length, 1);
  assert.throws(
    () => withConnection(org, { ...org.edges[0], from: 'backup', to: 'web' }),
    /Cycles/,
  );
  assert.throws(
    () => withConnection(org, { ...org.edges[0], weight: { ...org.edges[0].weight, value: NaN } }),
    /Transmission/,
  );
});
