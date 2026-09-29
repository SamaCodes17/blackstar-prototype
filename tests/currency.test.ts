import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, validRates } from '../src/core/currency';
import { explainAssessment } from '../src/core/explainer';
import { demoState } from '../server/demo';
import fallback from '../fixtures/exchange-rates.json';
test('excluded currencies cannot enter saved or refreshed display rates', () => {
  const supported = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD', 'JPY', 'AUD', 'CAD', 'CHF'].sort();
  assert.deepEqual(
    validRates(fallback.rates)
      .map((r) => r.quote)
      .sort(),
    supported,
  );
  assert.ok(fallback.rates.some((r) => r.quote === 'PKR'));
  assert.ok(!validRates(fallback.rates).some((r) => r.quote === 'PKR'));
  const row = { date: '2026-09-29', base: 'INR', quote: 'PKR', rate: 3 };
  assert.deepEqual(
    validRates([row, { ...row, quote: 'XYZ' }, { ...row, quote: 'USD', rate: 0.012 }]),
    [{ ...row, quote: 'USD', rate: 0.012 }],
  );
});
test('a saved excluded preference resets to INR and cannot be reselected', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let saved = 'PKR';
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => saved,
      setItem: (_key: string, value: string) => {
        saved = value;
      },
    },
  });
  try {
    const currency = await import('../src/ui/currency');
    assert.equal(currency.currencySnapshot().code, 'INR');
    assert.equal(saved, 'INR');
    currency.selectCurrency('PKR');
    assert.equal(currency.currencySnapshot().code, 'INR');
    currency.selectCurrency('USD');
    assert.equal(currency.currencySnapshot().code, 'USD');
    currency.selectCurrency('INR');
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
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
