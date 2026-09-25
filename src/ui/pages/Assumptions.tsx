import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { Panel, Tag, money, human } from '../shared';
import type { PageProps } from '../page-types';

export function Assumptions(p: PageProps) {
  const { org, output } = p.state,
    [edits, setEdits] = useState<
      Record<string, { group: string; key: string; id?: string; value: number }>
    >({});
  const field = (
    label: string,
    group: string,
    key: string,
    value: number,
    reason: string,
    id?: string,
  ) => {
    const name = `${group}.${id ?? ''}.${key}`;
    return (
      <label className="assumption-field" key={name}>
        <span>
          {label}
          <Tag tag="ASSUMED" />
        </span>
        <input
          type="number"
          step={key === 'cost' ? 25000 : 'any'}
          value={edits[name]?.value ?? value}
          onChange={(e) =>
            setEdits((prev) => ({
              ...prev,
              [name]: { group, key, id, value: Number(e.target.value) },
            }))
          }
        />
        <small>{reason}</small>
      </label>
    );
  };
  async function save(e: FormEvent) {
    e.preventDefault();
    if (await p.update({ edits: Object.values(edits) })) setEdits({});
  }
  const max = Math.max(...output.sensitivity.map((s) => s.high), 1);
  return (
    <>
      <Panel title="Which assumptions move the result most?" eyebrow="Sensitivity analysis">
        <div className="tornado">
          {output.sensitivity.map((s) => (
            <div key={s.name}>
              <span>{human(s.name)}</span>
              <div>
                <i
                  style={{
                    left: `${(s.low / max) * 90}%`,
                    width: `${Math.max(1, ((s.high - s.low) / max) * 90)}%`,
                  }}
                />
              </div>
              <span data-provenance="COMPUTED">
                {money(s.low)}–{money(s.high)} <Tag />
              </span>
            </div>
          ))}
        </div>
        <div className="panel-bottom">
          One input varies at a time across its stored low/high range. All other inputs stay fixed.
        </div>
      </Panel>
      <form onSubmit={(e) => void save(e)}>
        <Panel
          title="Your assumptions, in the open"
          action={
            <button
              className="primary-button"
              type="submit"
              disabled={p.busy || !Object.keys(edits).length}
            >
              Save & recompute <ArrowRight size={15} />
            </button>
          }
        >
          <div className="assumptions-grid">
            {Object.entries(org.assumptions).map(([key, f]) =>
              field(human(key), 'assumptions', key, f.value, f.reason),
            )}
          </div>
          <details>
            <summary>Asset loss allocations & entry baselines</summary>
            <div className="assumptions-grid">
              {org.assets.flatMap((a) => [
                field(
                  `${a.label} · equivalent records`,
                  'assets',
                  'records',
                  a.records.value,
                  a.records.reason,
                  a.id,
                ),
                field(
                  `${a.label} · annual baseline`,
                  'assets',
                  'baseline',
                  a.baseline.value,
                  a.baseline.reason +
                    (a.epss ? ' EPSS is present, so the baseline is currently inactive.' : ''),
                  a.id,
                ),
              ])}
            </div>
          </details>
          <details>
            <summary>Dependency strengths & timing</summary>
            <div className="assumptions-grid">
              {org.edges.flatMap((e) => [
                field(
                  `${org.assets.find((a) => a.id === e.from)?.label} → ${org.assets.find((a) => a.id === e.to)?.label}`,
                  'edges',
                  'weight',
                  e.weight.value,
                  e.reason,
                  `${e.from}>${e.to}`,
                ),
                field(
                  'Mean cascade waiting time · days',
                  'edges',
                  'days',
                  e.days.value,
                  e.days.reason,
                  `${e.from}>${e.to}`,
                ),
              ])}
            </div>
          </details>
          <details>
            <summary>Control prices & effectiveness</summary>
            <div className="assumptions-grid">
              {org.controls.flatMap((c) => [
                field(
                  `${c.name} · annual price`,
                  'controls',
                  'cost',
                  c.cost.value,
                  c.cost.reason,
                  c.id,
                ),
                field(
                  `${c.name} · efficacy`,
                  'controls',
                  'efficacy',
                  c.efficacy.value,
                  c.efficacy.reason,
                  c.id,
                ),
              ])}
            </div>
          </details>
          <details>
            <summary>Attacker-type priors</summary>
            <p className="panel-copy">
              Weights are normalized before use. These are scenario assumptions informed by ATT&CK
              categories, not observed frequencies.
            </p>
            <div className="assumptions-grid">
              {org.attackers.map((a) =>
                field(a.name, 'attackers', 'prior', a.prior.value, a.prior.reason, a.id),
              )}
            </div>
          </details>
        </Panel>
      </form>
    </>
  );
}
