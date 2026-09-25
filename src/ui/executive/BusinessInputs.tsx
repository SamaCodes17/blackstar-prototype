import { useState } from 'react';
import type { Organization } from '../../core/types';
import { Modal } from '../shared';
import { controlCopy } from './DecisionDashboard';

export function BusinessInputs({
  org,
  busy,
  close,
  update,
}: {
  org: Organization;
  busy: boolean;
  close: () => void;
  update: (body: unknown) => Promise<boolean>;
}) {
  const [error, setError] = useState('');
  return (
    <Modal title="Business inputs" close={close} wide>
      <form
        className="exec-inputs-form"
        onSubmit={async (event) => {
          event.preventDefault();
          setError('');
          const form = new FormData(event.currentTarget);
          const edits = [
            {
              group: 'assumptions',
              key: 'costPerRecord',
              value: Number(form.get('costPerRecord')),
              previous: org.assumptions.costPerRecord.value,
            },
            ...org.assets.map((asset) => ({
              group: 'assets',
              id: asset.id,
              key: 'records',
              value: Number(form.get(`records-${asset.id}`)),
              previous: asset.records.value,
            })),
            ...org.controls.flatMap((control) => [
              {
                group: 'controls',
                id: control.id,
                key: 'cost',
                value: Number(form.get(`cost-${control.id}`)),
                previous: control.cost.value,
              },
              {
                group: 'controls',
                id: control.id,
                key: 'efficacy',
                value: Number(form.get(`effect-${control.id}`)) / 100,
                previous: control.efficacy.value,
              },
            ]),
          ]
            .filter((edit) => Math.abs(edit.value - edit.previous) > 1e-10)
            .map((edit) => ({
              group: edit.group,
              key: edit.key,
              value: edit.value,
              ...('id' in edit ? { id: edit.id } : {}),
            }));
          if (!edits.length || (await update({ edits }))) close();
          else setError('The inputs could not be saved. Check the values and try again.');
        }}
      >
        <p>
          Replace the example assumptions with values agreed by your finance and security teams.
          Saving recalculates the plan.
        </p>
        <label className="exec-input-field">
          Estimated financial impact per lost record (₹)
          <input
            name="costPerRecord"
            type="number"
            min="1"
            max="100000"
            required
            defaultValue={org.assumptions.costPerRecord.value}
          />
          <small>
            Include response, recovery and business impact. This is an assumption, not an industry
            benchmark.
          </small>
        </label>
        <details>
          <summary>Records exposed by business system</summary>
          <p>
            Use non-overlapping record allocations so the same loss is not counted twice. These are
            estimated allocations, not a discovered inventory.
          </p>
          <div className="exec-input-grid">
            {org.assets.map((a) => (
              <label className="exec-input-field" key={a.id}>
                {a.label}
                <input
                  name={`records-${a.id}`}
                  type="number"
                  min="0"
                  max="10000000"
                  required
                  defaultValue={a.records.value}
                />
              </label>
            ))}
          </div>
        </details>
        <h3>Protection costs and effectiveness</h3>
        <p>
          Annual cost assumptions use increments of ₹25,000. Effectiveness is the assumed reduction
          in the chance of compromise along the affected access points or paths.
        </p>
        <div className="exec-control-inputs">
          {org.controls.map((c) => (
            <fieldset key={c.id}>
              <legend>{controlCopy[c.id]?.name ?? c.name}</legend>
              <label>
                Annual cost (₹)
                <input
                  name={`cost-${c.id}`}
                  type="number"
                  min="25000"
                  max="1000000"
                  step="25000"
                  required
                  defaultValue={c.cost.value}
                />
              </label>
              <label>
                Effectiveness (%)
                <input
                  name={`effect-${c.id}`}
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  required
                  defaultValue={c.efficacy.value * 100}
                />
              </label>
            </fieldset>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="exec-form-actions">
          <button type="button" className="exec-button secondary" disabled={busy} onClick={close}>
            Cancel
          </button>
          <button className="exec-button primary" disabled={busy}>
            {busy ? 'Updating assessment…' : 'Save and update plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
