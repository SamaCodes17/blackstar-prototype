import { useState } from 'react';
import { Play } from 'lucide-react';
import { Panel, Tag, NumberValue as N, Note, money } from '../shared';
import { RiskGraph, Distribution } from '../visuals';
import type { PageProps } from '../page-types';
import { Metric } from './Metric';

export function RiskPage(p: PageProps) {
  const { org, output } = p.state,
    [defended, setDefended] = useState(false),
    [blast, setBlast] = useState(false);
  return (
    <>
      <div className="toolbar-card">
        <div>
          <h3>From exposure to financial impact</h3>
          <p>Explore the dependency graph and the uncertainty around its inputs.</p>
        </div>
        <div className="segmented">
          {[30, 90, 365].map((h) => (
            <button
              key={h}
              data-provenance="ASSUMED"
              className={org.horizon === h ? 'active' : ''}
              onClick={() => void p.update({ horizon: h })}
            >
              {h === 365 ? 'Annual' : `${h} days`}
            </button>
          ))}
        </div>
      </div>
      <div className="metrics-grid three">
        <Metric
          label={org.horizon === 365 ? 'Annualized loss expectancy' : 'Horizon expected loss'}
          value={output.risk.ale}
          caption="Exact joint inference"
          formula="Σ P(v) × V(v)"
        />
        <Metric
          label="Tail loss threshold"
          value={output.risk.p90}
          caption="Monte Carlo ninetieth percentile"
          formula="Quantile(loss samples, 0.9)"
        />
        <Metric
          label="Conditional blast exposure"
          value={output.blast.find((b) => b.entry === p.selected)?.loss ?? 0}
          caption="Selected entry forced compromised; other entry rates zero"
          formula="Σ P(v | do(selected entry = compromised), other entries = 0) × V(v)"
        />
      </div>
      <Panel
        title="Cascading Bayesian Risk Propagation"
        action={
          <div className="inline-controls">
            <label>
              <input
                type="checkbox"
                checked={defended}
                onChange={(e) => setDefended(e.target.checked)}
              />{' '}
              Apply plan
            </label>
            <label>
              <input type="checkbox" checked={blast} onChange={(e) => setBlast(e.target.checked)} />{' '}
              Blast radius
            </label>
          </div>
        }
      >
        <RiskGraph
          org={org}
          output={output}
          selected={p.selected}
          onSelect={p.select}
          defended={defended}
          blast={blast}
        />
      </Panel>
      <div className="two-column">
        <Panel title="Loss distribution">
          <Distribution risk={defended ? output.after : output.risk} />
          <div className="panel-bottom" data-provenance="COMPUTED">
            {output.risk.trials.toLocaleString()} joint forward samples. Fixed seed for comparisons.{' '}
            <Tag />
          </div>
        </Panel>
        <Panel title="Uncertainty, kept separate">
          <div className="uncertainty-row">
            <b>Monte Carlo confidence interval</b>
            <p>Precision of the simulated mean. More samples narrow this interval.</p>
            <span data-provenance="COMPUTED">
              {money(output.risk.ci[0])} – {money(output.risk.ci[1])} <Tag />
            </span>
          </div>
          <div className="uncertainty-row">
            <b>Parameter sensitivity band</b>
            <p>
              Alternative ALE outcomes when the main assumptions vary independently over their
              stated ranges. Not a calibrated confidence interval.
            </p>
            <span data-provenance="COMPUTED">
              {money(output.risk.parameterBand[0])} – {money(output.risk.parameterBand[1])} <Tag />
            </span>
          </div>
          <div className="uncertainty-row">
            <b>Tail sensitivity band</b>
            <span data-provenance="COMPUTED">
              {money(output.risk.p90Band[0])} – {money(output.risk.p90Band[1])} <Tag />
            </span>
          </div>
        </Panel>
      </div>
      {p.expert && (
        <Panel title="Exact inference versus marginal approximation">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Exact joint marginal</th>
                  <th>Forward noisy-OR approximation</th>
                </tr>
              </thead>
              <tbody>
                {output.blast.map((b, i) => (
                  <tr key={b.entry}>
                    <td>{org.assets.find((a) => a.id === b.entry)?.label}</td>
                    <td>
                      <N
                        value={output.risk.probabilities[i]}
                        format="percent"
                        label="Exact compromise probability"
                        formula="Sum of joint BN states in which this asset is compromised"
                      />
                    </td>
                    <td>
                      <N
                        value={output.risk.approximate[i]}
                        format="percent"
                        label="Forward approximation"
                        formula="1 − (1 − e_v) × ∏(1 − P(parent) × w)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>
            Shared ancestors correlate parent events. The marginal forward formula is not exact on
            general DAGs; the exact joint calculation determines ALE here.
          </Note>
        </Panel>
      )}
      <Panel title="Replay a change in the threat landscape">
        <div className="demo-injection">
          <div>
            <b>Simulate active exploitation</b>
            <p>
              Inject a preview exploitation signal into the selected asset. The model, portfolio and
              history recompute together.
            </p>
            <Tag tag="PREVIEW" />
          </div>
          <button
            className="primary-button"
            disabled={p.busy}
            onClick={() => void p.action('/api/simulate', { asset: p.selected })}
          >
            <Play size={15} /> Inject demo event
          </button>
          {org.example && (
            <button
              className="secondary-button"
              onClick={() => void p.action('/api/reset-example')}
            >
              Reset example
            </button>
          )}
        </div>
      </Panel>
    </>
  );
}
