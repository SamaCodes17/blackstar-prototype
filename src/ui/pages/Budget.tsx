import { useState } from 'react';
import type { Organization } from '../../core/types';
import { Tag, money } from '../shared';
import type { PageProps } from '../page-types';

export function Budget({
  org,
  update,
  busy,
}: {
  org: Organization;
  update: PageProps['update'];
  busy: boolean;
}) {
  const [draft, setDraft] = useState<number | undefined>();
  return (
    <div className="budget-control">
      <div>
        <label htmlFor="budget-range">Available budget</label>
        <span data-provenance="ASSUMED">
          {money(draft ?? org.budget)} <Tag tag="ASSUMED" />
        </span>
      </div>
      <input
        id="budget-range"
        aria-label="Security budget"
        type="range"
        min="0"
        max="1000000"
        step="25000"
        value={draft ?? org.budget}
        disabled={busy}
        onChange={(e) => setDraft(Number(e.target.value))}
        onPointerUp={(e) => {
          const value = Number(e.currentTarget.value);
          if (value !== org.budget)
            void update({ budget: value }).finally(() => setDraft(undefined));
        }}
        onKeyUp={(e) => {
          if (
            [
              'ArrowLeft',
              'ArrowRight',
              'ArrowUp',
              'ArrowDown',
              'PageUp',
              'PageDown',
              'Home',
              'End',
            ].includes(e.key)
          ) {
            const value = Number(e.currentTarget.value);
            void update({ budget: value }).finally(() => setDraft(undefined));
          }
        }}
      />
      <div className="range-limits" data-provenance="ASSUMED">
        <span>₹0</span>
        <span>₹10 lakh</span>
      </div>
    </div>
  );
}
