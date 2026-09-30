import fallback from '../fixtures/exchange-rates.json' with { type: 'json' };
import { validRates } from '../src/core/currency.js';
let cached = { rates: validRates(fallback.rates), source: fallback.source, cached: true };
let nextAttempt = 0;
let pending: Promise<typeof cached> | undefined;
export async function exchangeRates() {
  if (Date.now() < nextAttempt) return cached;
  if (pending) return pending;
  pending = (async () => {
    nextAttempt = Date.now() + 60000;
    try {
      const response = await fetch(fallback.source, {
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Rate service unavailable');
      const rates = validRates(await response.json());
      if (!rates.some((r) => r.quote === 'USD')) throw new Error('Incomplete rates');
      cached = { rates, source: fallback.source, cached: false };
      nextAttempt = Date.now() + 3600000;
    } catch {
      cached = { ...cached, cached: true };
    }
    return cached;
  })().finally(() => {
    pending = undefined;
  });
  return pending;
}
