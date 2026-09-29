import fallback from '../../fixtures/exchange-rates.json';
import { formatCurrency, validRates } from '../core/currency';
let code = 'INR';
try {
  code = localStorage.getItem('blackstar.currency') ?? 'INR';
} catch {
  /* Optional preference. */
}
let rates = validRates(fallback.rates);
if (code !== 'INR' && !rates.some((r) => r.quote === code)) code = 'INR';
let snapshot = { code, rates, cached: true };
const listeners = new Set<() => void>();
export const currencySnapshot = () => snapshot;
export const subscribeCurrency = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
function emit() {
  snapshot = { ...snapshot };
  listeners.forEach((listener) => listener());
}
export function selectCurrency(value: string) {
  if (value !== 'INR' && !snapshot.rates.some((r) => r.quote === value)) return;
  snapshot.code = value;
  try {
    localStorage.setItem('blackstar.currency', value);
  } catch {
    /* Preference is optional. */
  }
  emit();
}
export function selectedRate() {
  return snapshot.rates.find((r) => r.quote === snapshot.code);
}
export const money = (n: number) =>
  formatCurrency(n, snapshot.code, selectedRate()?.rate ?? 1, true);
export const fullMoney = (n: number) => formatCurrency(n, snapshot.code, selectedRate()?.rate ?? 1);
export function currencyNote() {
  if (snapshot.code === 'INR') return 'INR · base currency';
  const rate = selectedRate();
  return rate
    ? `${snapshot.code} · indicative FX dated ${rate.date} · ${snapshot.cached ? 'Frankfurter saved rates' : 'Frankfurter reference rates'}`
    : 'INR · base currency';
}
let loading: Promise<void> | undefined;
export function loadCurrencyRates() {
  if (loading) return loading;
  loading = (async () => {
    try {
      const response = await fetch('/api/exchange-rates');
      if (!response.ok) return;
      const data = await response.json(),
        next = validRates(data.rates);
      if (!next.length) return;
      // Preserve the selected quote if a refreshed response omits it; do not silently use 1:1.
      if (snapshot.code !== 'INR' && !next.some((r) => r.quote === snapshot.code)) return;
      snapshot = { ...snapshot, rates: next, cached: Boolean(data.cached) };
      emit();
    } catch {
      /* Keep attributed saved rates. */
    }
  })();
  return loading;
}
