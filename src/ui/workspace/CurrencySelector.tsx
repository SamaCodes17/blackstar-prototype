import { useSyncExternalStore } from 'react';
import { currencySnapshot, subscribeCurrency, selectCurrency, currencyNote } from '../currency';
export function CurrencySelector() {
  const { code, rates } = useSyncExternalStore(subscribeCurrency, currencySnapshot);
  const names = new Intl.DisplayNames(['en'], { type: 'currency' });
  const codes = [...new Set(['INR', ...rates.map((r) => r.quote)])].sort();
  return (
    <label className="currency-picker" title={currencyNote()}>
      Currency
      <select
        aria-label="Display currency"
        value={code}
        onChange={(e) => selectCurrency(e.target.value)}
      >
        {codes.map((c) => (
          <option key={c} value={c}>
            {c} — {names.of(c) ?? c}
          </option>
        ))}
      </select>
    </label>
  );
}
