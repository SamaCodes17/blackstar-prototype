import test from 'node:test';
import assert from 'node:assert/strict';
import { exampleOrganization } from '../server/seed';
import { compute } from '../src/core/pipeline';
import { explainAssessment } from '../src/core/explainer';
import type { State } from '../src/core/types';
const org = exampleOrganization();
const state: State = {
  org,
  output: compute(org),
  timeline: [],
  organizations: [],
  integrations: { shodanConfigured: true },
};
test('explainer uses the active assessment numbers and distinguishes annual prices from horizon losses', () => {
  const result = explainAssessment('Are these numbers genuine?', state, 'overview');
  assert.ok(result.text.includes(Math.round(state.output.risk.ale).toLocaleString('en-IN')));
  assert.ok(result.text.includes(Math.round(state.output.optimal.cost).toLocaleString('en-IN')));
  assert.match(result.text, /not observed losses or guaranteed savings/);
  const changed = structuredClone(state);
  changed.org.name = 'Another organization';
  changed.output.risk.ale = 123456;
  const fresh = explainAssessment('Are these numbers genuine?', changed, 'overview');
  assert.match(fresh.text, /Another organization/);
  assert.match(fresh.text, /1,23,456/);
});
test('configured Shodan key does not imply successful live search', () => {
  const denied = structuredClone(state);
  denied.org.scans = [
    {
      collector: 'Service / CVE correlation',
      status: 'UNAVAILABLE',
      issue: 'ACCESS_DENIED',
      checkedAt: new Date().toISOString(),
      count: 0,
      message: 'blocked',
    },
  ];
  assert.match(explainAssessment('Is Shodan working?', denied, 'evidence').text, /blocked/);
  denied.integrations!.shodanConfigured = false;
  assert.match(explainAssessment('Is Shodan working?', denied, 'evidence').text, /not configured/);
});
test('explainer handles disconnected graphs, unsupported questions and page-specific help honestly', () => {
  const disconnected = structuredClone(state);
  disconnected.org.edges = [];
  assert.match(explainAssessment('Explain the graph', disconnected, 'risk').text, /No connections/);
  assert.match(
    explainAssessment('What is the weather?', state, 'overview').text,
    /cannot answer unrelated/,
  );
  assert.match(
    explainAssessment('Help me understand this page', state, 'investment').text,
    /Update plan/,
  );
  assert.match(
    explainAssessment('Explain P90 and uncertainty', state, 'risk').text,
    /not a promise/,
  );
});
