export interface ExchangeRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}
// Product availability policy, not a determination of transaction legality.
const supportedCurrencies = new Set([
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SGD',
  'JPY',
  'AUD',
  'CAD',
  'CHF',
]);
export function validRates(input: unknown): ExchangeRate[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  return input.filter((row): row is ExchangeRate => {
    if (
      !row ||
      row.base !== 'INR' ||
      !/^[A-Z]{3}$/.test(row.quote) ||
      !supportedCurrencies.has(row.quote) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
      !Number.isFinite(row.rate) ||
      row.rate <= 0 ||
      seen.has(row.quote)
    )
      return false;
    seen.add(row.quote);
    return true;
  });
}
export function formatCurrency(inr: number, code = 'INR', rate = 1, compact = false) {
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid exchange rate');
  const amount = inr * rate;
  if (code === 'INR' && compact && Math.abs(amount) >= 100000)
    return `₹${(amount / (Math.abs(amount) >= 10000000 ? 10000000 : 100000)).toFixed(2)} ${Math.abs(amount) >= 10000000 ? 'Cr' : 'L'}`;
  return new Intl.NumberFormat(code === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency: code,
    currencyDisplay: code === 'INR' ? 'symbol' : 'code',
    notation: compact && Math.abs(amount) >= 10000 ? 'compact' : 'standard',
    ...(code === 'INR'
      ? { maximumFractionDigits: 0 }
      : compact
        ? { maximumFractionDigits: 2 }
        : {}),
  }).format(amount);
}
