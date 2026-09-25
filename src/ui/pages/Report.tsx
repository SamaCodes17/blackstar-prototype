import { useState } from 'react';
import { Download } from 'lucide-react';
import { Tag, fullMoney } from '../shared';
import { ControlList } from '../visuals';
import type { PageProps } from '../page-types';
import { Metric } from './Metric';

export function Report(p: PageProps) {
  const { org, output } = p.state,
    [role, setRole] = useState('Leadership / audit');
  return (
    <>
      <div className="toolbar-card no-print">
        <div className="segmented">
          {['IT / security', 'Finance / registrar', 'Leadership / audit'].map((r) => (
            <button key={r} className={role === r ? 'active' : ''} onClick={() => setRole(r)}>
              {r}
            </button>
          ))}
        </div>
        <div className="inline-controls">
          <a className="secondary-button" href={`/api/export?org=${org.id}`}>
            <Download size={15} /> Evidence JSON
          </a>
          <button className="primary-button" onClick={() => window.print()}>
            Print board report
          </button>
        </div>
      </div>
      <section className="board-report">
        <div className="report-header">
          <div className="wordmark">
            BLACK<span>STAR</span>
          </div>
          <span>Cyber risk decision brief</span>
        </div>
        <p className="eyebrow">
          {role} · {org.example ? 'Example organization' : 'Authorized local assessment'}
        </p>
        <h1>{org.name}</h1>
        <p data-provenance="COMPUTED">
          Prepared {new Date(output.at).toLocaleString()} <Tag />
        </p>
        <div className="report-alert">
          <Tag tag="PREVIEW" /> Scenario estimates. Certificate evidence is public; dependencies,
          loss allocations, targeting, prices and effectiveness require local validation.
        </div>
        <div className="metrics-grid three">
          <Metric
            label="Expected loss"
            value={output.risk.ale}
            caption="Selected horizon"
            formula="Stored exact Bayesian loss"
          />
          <Metric
            label="Recommended spend"
            value={output.optimal.cost}
            caption="Annual control price assumptions"
            formula="Sum of selected control costs"
          />
          <Metric
            label="Residual exposure"
            value={output.optimal.ale}
            caption="After recommended controls"
            formula="Stored post-control exact Bayesian loss"
          />
        </div>
        <p className="report-narration" data-provenance="COMPUTED">
          {output.narration}
        </p>
        <h2>Recommended actions</h2>
        <ControlList org={org} output={output} />
        {role === 'IT / security' && (
          <>
            <h2>Adaptive attacker routes</h2>
            {output.optimal.responses.map((r) => (
              <p key={r.type}>
                {r.type}:{' '}
                {r.path.map((id) => org.assets.find((a) => a.id === id)?.label).join(' → ')}
              </p>
            ))}
          </>
        )}
        <h2>Uncertainty & provenance</h2>
        <p data-provenance="COMPUTED">
          Tail loss threshold: {fullMoney(output.risk.p90)}. Simulation mean interval:{' '}
          {fullMoney(output.risk.ci[0])}–{fullMoney(output.risk.ci[1])}. Parameter sensitivity band:{' '}
          {fullMoney(output.risk.parameterBand[0])}–{fullMoney(output.risk.parameterBand[1])}.{' '}
          <Tag />
        </p>
        <p>
          Annual control ROSI accounts for control costs. The adaptive game objective is distinct
          from background ALE. Preview economic effects are excluded from the direct risk totals
          above. This model has not been validated against institution-specific breach outcomes.
        </p>
        <h2>Evidence sources</h2>
        {org.scans.map((s) => (
          <p key={s.collector} data-provenance="CITED">
            {s.collector}: {s.status.toLowerCase()} · checked{' '}
            {new Date(s.checkedAt).toLocaleString()} <Tag tag="CITED" />
          </p>
        ))}
        <p className="muted">
          Export the evidence JSON for complete inputs, model outputs, source tags and the local
          risk timeline.
        </p>
      </section>
    </>
  );
}
