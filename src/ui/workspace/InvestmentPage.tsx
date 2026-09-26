import type { WorkspaceProps } from './types';
import { money } from '../shared';
import { DecisionDashboard, controlCopy } from '../executive/DecisionDashboard';
import { pageHelpers } from './pageHelpers';
export function InvestmentPage(p: WorkspaceProps) {
  const { org, output } = p.state;
  const { help } = pageHelpers(p);
  return (
    <>
      <DecisionDashboard
        state={p.state}
        busy={p.busy}
        offline={p.offline}
        update={p.update}
        explain={p.explain}
        inputs={p.inputs}
      />
      <section className="ws-card">
        <div className="ws-section-top">
          <div>
            <h2>Compare the alternatives</h2>
            <p>
              Annual protection costs; modeled loss over {org.horizon} days. The recommendation
              accounts for modeled attacker responses.
            </p>
          </div>
          {help('Why was this plan selected?')}
        </div>
        <div className="ws-comparisons">
          {[
            { name: 'Current position', cost: 0, ale: output.risk.ale, ids: [] },
            { name: 'Severity-first plan', ...output.naive },
            { name: 'Recommended plan', ...output.optimal },
          ].map((c, i) => (
            <div key={c.name} className={i === 2 ? 'recommended' : ''}>
              <span className="ws-eyebrow">{c.name}</span>
              <strong>{money(c.ale)}</strong>
              <p>Estimated loss</p>
              <hr />
              <b>{money(c.cost)} / year</b>
              <p>{c.ids.length} protection actions</p>
            </div>
          ))}
        </div>
      </section>
      <details className="ws-card">
        <summary>All protection options</summary>
        <div className="ws-table-scroll">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Protection</th>
                <th>Annual cost</th>
                <th>Standalone loss avoided</th>
                <th>In plan</th>
              </tr>
            </thead>
            <tbody>
              {org.controls.map((c) => (
                <tr key={c.id}>
                  <td>{controlCopy[c.id]?.name ?? c.name}</td>
                  <td>{money(c.cost.value)}</td>
                  <td>{money(output.interventions.find((i) => i.id === c.id)?.saved ?? 0)}</td>
                  <td>{output.optimal.ids.includes(c.id) ? 'Selected' : 'Not selected'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>Standalone benefits cannot simply be added together because protections can overlap.</p>
      </details>
      <details className="ws-card">
        <summary>Experimental method comparison</summary>
        <p>
          Research tools retained for deeper evaluation. These are classical software simulations,
          including simulated quantum circuits; no quantum hardware or advantage is claimed.
        </p>
        <div className="ws-table-scroll">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Estimated loss</th>
                <th>Within budget</th>
              </tr>
            </thead>
            <tbody>
              {output.quantum.results.map((r, i) => (
                <tr key={i}>
                  <td>{r.backend}</td>
                  <td>{money(r.ale)}</td>
                  <td>{r.feasible ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
