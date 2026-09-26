import type { WorkspaceProps } from './types';
import { money } from '../shared';
import { useState } from 'react';
import { AttackMap } from '../executive/AttackMap';
import { Distribution } from '../visuals';
import { pageHelpers } from './pageHelpers';
export function RiskExplorer(p: WorkspaceProps) {
  const { org, output } = p.state;
  const [entry, setEntry] = useState(org.assets[0]?.id ?? '');
  const conditional = output.blast.find((b) => b.entry === entry);
  const { heading, help } = pageHelpers(p);
  return (
    <>
      {heading(
        '02 / UNDERSTAND',
        'See where exposure could lead.',
        'Explore modeled attack routes and their business consequences. These are scenarios, not detected attacks.',
      )}
      <AttackMap key={org.id} org={org} output={output} />
      <div className="ws-overview-grid">
        <section className="ws-card">
          <div className="ws-section-top">
            <h2>What if a system is compromised?</h2>
            {help('What does conditional impact mean?')}
          </div>
          <p>
            Force one entry to be compromised and turn off other initial entries. Connections
            determine the modeled spread.
          </p>
          <label className="ws-field">
            Starting system
            <select value={entry} onChange={(e) => setEntry(e.target.value)}>
              {org.assets.map((a) => (
                <option value={a.id} key={a.id}>
                  {a.label} · {a.hostname}
                </option>
              ))}
            </select>
          </label>
          <strong className="ws-large-number">{money(conditional?.loss ?? 0)}</strong>
          <p>Conditional expected loss · hypothetical scenario</p>
        </section>
        <section className="ws-card">
          <div className="ws-section-top">
            <h2>A range of possible outcomes</h2>
            {help('Explain P90 and uncertainty')}
          </div>
          <Distribution risk={output.risk} />
          <p>
            In this simulation, 90% of outcomes are at or below{' '}
            <strong>{money(output.risk.p90)}</strong>. This depends on the assumed inputs; it is not
            a guarantee.
          </p>
        </section>
      </div>
      <details className="ws-card">
        <summary>Explore assumptions and wider impact</summary>
        <p>
          These estimates illustrate how assumed relationships affect loss. They do not measure
          actual partner or sector exposure.
        </p>
        <div className="ws-stats">
          {(['direct', 'partner', 'sector', 'downstream'] as const).map((k) => (
            <div className="ws-stat" key={k}>
              <span>{k} impact</span>
              <strong>{money(output.contagion[k])}</strong>
              <small>Modeled estimate</small>
            </div>
          ))}
        </div>
        <h3>Which inputs change the result?</h3>
        <div className="ws-table-scroll">
          <table className="ws-table">
            <thead>
              <tr>
                <th>Input varied</th>
                <th>Low scenario</th>
                <th>High scenario</th>
              </tr>
            </thead>
            <tbody>
              {output.sensitivity.map((s) => (
                <tr key={s.name}>
                  <td>{s.name}</td>
                  <td>{money(s.low)}</td>
                  <td>{money(s.high)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="exec-button secondary" onClick={p.inputs}>
          Review business inputs
        </button>
      </details>
    </>
  );
}
