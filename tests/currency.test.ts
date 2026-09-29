import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, validRates } from '../src/core/currency';
import { explainAssessment } from '../src/core/explainer';
import { demoState } from '../server/demo';
test('display conversions use numeric exchange rates and unambiguous currency codes', () => {
  assert.match(formatCurrency(100000, 'USD', 0.012), /USD\s*1,200\.00/);
  assert.match(formatCurrency(100000, 'EUR', 0.01), /EUR\s*1,000\.00/);
  assert.equal(formatCurrency(100000, 'INR', 1, true), '₹1.00 L');
  assert.match(formatCurrency(0, 'USD', 0.012), /USD\s*0\.00/);
  assert.throws(() => formatCurrency(100, 'USD', 0));
  assert.match(formatCurrency(100, 'JPY', 1.64123), /JPY\s*164$/);
  assert.match(formatCurrency(100, 'KWD', 0.0032), /KWD\s*0\.320$/);
});
test('invalid, duplicate and wrong-base rates cannot cause misleading conversions', () => {
  const good = { date: '2026-09-29', base: 'INR', quote: 'USD', rate: 0.012 };
  assert.deepEqual(
    validRates([
      good,
      good,
      { ...good, rate: 0 },
      { ...good, base: 'EUR' },
      { ...good, quote: 'oops' },
      null,
    ]),
    [good],
  );
  assert.deepEqual(validRates({ rates: [] }), []);
});
test('assistant prices and assessment figures follow selected currency without changing the model', () => {
  const state = demoState('demo-northstar'),
    before = JSON.stringify(state);
  const format = (n: number) => formatCurrency(n, 'USD', 0.012);
  const price = explainAssessment('pricing', state, 'pricing', format);
  assert.ok(price.text.includes(format(4999)));
  assert.ok(!price.text.includes('₹'));
  const loss = explainAssessment('estimated loss', state, 'overview', format);
  assert.ok(loss.text.includes('USD'));
  assert.ok(!loss.text.includes('₹'));
  assert.equal(JSON.stringify(state), before);
});
