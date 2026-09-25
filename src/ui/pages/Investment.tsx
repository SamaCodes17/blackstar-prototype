import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Panel, Tag, NumberValue as N, Note, Term } from '../shared';
import { RiskGraph } from '../visuals';
import type { PageProps } from '../page-types';
import { Budget } from './Budget';

export function Investment(p: PageProps) {
  const { org, output } = p.state,
    [comparePath, setComparePath] = useState(true);
  return (
    <>
      <div className="toolbar-card">
        <div>
          <h3>A defender commits. An attacker adapts.</h3>
          <p>
            Compare feasible portfolios under the same budget and inspect the follower’s response.
          </p>
        </div>
        <Budget org={org} update={p.update} busy={p.busy} />
      </div>
      <div className="comparison-grid">
        {[
          { label: 'Before investment', p: output.portfolios[0] },
          { label: 'Naive severity-first', p: output.naive },
          { label: 'Stackelberg recommendation', p: output.optimal },
        ].map((v, i) => (
          <div className={`comparison-card ${i === 2 ? 'recommended' : ''}`} key={v.label}>
            <span className="eyebrow">{v.label}</span>
            <N
              label={`${v.label} ALE`}
              value={v.p.ale}
              formula="Exact Bayesian expected loss under this control portfolio"
            />
            <p>Modeled loss · selected horizon</p>
            <div>
              <span>Control cost</span>
              <N
                value={v.p.cost}
                label={`${v.label} cost`}
                formula="Sum of annual control cost assumptions"
              />
            </div>
            <div>
              <span>Attacker-response loss</span>
              <N
                value={v.p.gameLoss}
                label={`${v.label} game objective`}
                formula="Σ normalized type prior × opportunity probability × route success probability × conditional path-and-descendant loss"
              />
            </div>
          </div>
        ))}
      </div>
      <Note>
        The exact optimizer minimizes the attacker-response loss. The background ALE is evaluated
        separately for every portfolio. A lower game objective does not guarantee the lowest
        background ALE.
      </Note>
      <Panel
        title="Your recommended controls"
        action={
          <span data-provenance="COMPUTED">
            {output.portfolios.length} portfolios evaluated <Tag />
          </span>
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Security control</th>
                <th>Plan</th>
                <th>Annual cost</th>
                <th>Standalone loss reduction</th>
                <th>
                  <Term>ROSI</Term>
                </th>
              </tr>
            </thead>
            <tbody>
              {org.controls.map((c) => {
                const impact = output.interventions.find((i) => i.id === c.id)!;
                return (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      <small>{c.description}</small>
                    </td>
                    <td>
                      {output.optimal.ids.includes(c.id) ? (
                        <span className="soft-pill green">
                          <CheckCircle2 size={13} /> Selected
                        </span>
                      ) : (
                        <span className="muted">Not selected</span>
                      )}
                    </td>
                    <td>
                      <N
                        value={c.cost.value}
                        label={`${c.name} cost`}
                        tag="ASSUMED"
                        note={c.cost.reason}
                      />
                    </td>
                    <td>
                      <N
                        value={impact.saved}
                        label={`${c.name} standalone savings`}
                        formula="Baseline ALE − ALE with only this control; savings are not additive across controls"
                      />
                    </td>
                    <td>
                      <N
                        value={impact.rosi}
                        format="percent"
                        label={`${c.name} ROSI`}
                        formula="(ALE before − ALE after − control cost) / control cost"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="panel-bottom">
          Control efficacy and prices are editable assumptions. Standalone benefits cannot be added
          because controls interact.
        </div>
        <div className="panel-bottom">
          Portfolio ROSI
          <N
            value={output.optimal.rosi}
            label="Portfolio ROSI"
            format="percent"
            formula="(Baseline ALE − portfolio ALE − total annual control cost) / total annual control cost; reported as zero for an empty portfolio"
          />
        </div>
      </Panel>
      <div className="two-column">
        <Panel
          title="Watch the attacker reroute"
          action={
            <button className="secondary-button" onClick={() => setComparePath(!comparePath)}>
              {comparePath ? 'Show before plan' : 'Show after plan'}
            </button>
          }
        >
          <RiskGraph
            org={org}
            output={output}
            selected={p.selected}
            onSelect={p.select}
            defended={comparePath}
            compact
          />
        </Panel>
        <Panel title="Best responses by attacker type">
          <div className="attacker-list">
            {(comparePath ? output.optimal : output.portfolios[0]).responses.map((r) => (
              <div key={r.type}>
                <h3>{r.type}</h3>
                <p>{r.path.map((id) => org.assets.find((a) => a.id === id)?.label).join(' → ')}</p>
                <div>
                  <span>Route success</span>
                  <N
                    value={r.probability}
                    label={`${r.type} route probability`}
                    format="percent"
                    formula="Entry probability × product of edge propagation probabilities along the chosen path"
                  />
                </div>
                <div>
                  <span>Expected loss</span>
                  <N
                    value={r.loss}
                    label={`${r.type} defender loss`}
                    formula="Opportunity × route success × conditional loss, given the route succeeds"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="panel-bottom">
            <Term>SSE</Term>: equal attacker utilities break in the defender’s favor.
          </div>
        </Panel>
      </div>
      {p.expert && (
        <Panel title="Solver audit">
          <pre data-provenance="COMPUTED">
            {JSON.stringify(
              {
                budget: org.budget,
                objective: 'Minimize type-weighted adaptive attacker-response loss',
                optimal: output.optimal,
                feasiblePortfolios: output.portfolios.filter((x) => x.cost <= org.budget).length,
              },
              null,
              2,
            )}
          </pre>
          <Tag />
        </Panel>
      )}
    </>
  );
}
