import { ArrowLeft, Printer } from 'lucide-react';
import type { State } from '../../core/types';
import { decisionSummary } from '../../core/decision';
import { fullMoney, percent } from '../shared';
import { controlCopy } from './DecisionDashboard';
import { feedStatus } from './LiveSources';

export function DecisionBrief({ state, back }: { state: State; back: () => void }) {
  const { org, output } = state;
  const decision = decisionSummary(org, output);
  return (
    <>
      <div className="exec-brief-toolbar no-print">
        <button className="exec-button secondary" onClick={back}>
          <ArrowLeft size={16} /> Back to overview
        </button>
        <button className="exec-button primary" onClick={() => window.print()}>
          <Printer size={16} /> Print / save PDF
        </button>
      </div>
      <article className="exec-brief">
        <header>
          <span className="exec-brief-brand">BLACKSTAR</span>
          <span>SECURITY INVESTMENT BRIEF</span>
        </header>
        <p className="exec-kicker">
          {org.example ? 'FICTIONAL DEMO ASSESSMENT' : 'PLANNING ASSESSMENT'}
        </p>
        <h1>{org.name}</h1>
        {state.access?.demo && (
          <p>
            This fictional company has not been scanned. Financial figures are computed scenario
            estimates, not measured losses. Historical VCDB patterns inform attacker weights;
            company inputs and connections remain assumptions.
          </p>
        )}
        <p data-provenance="COMPUTED">
          Prepared {new Date(output.at).toLocaleString()} ·{' '}
          {org.horizon === 365 ? 'One-year' : `${org.horizon}-day`} planning period
        </p>
        <div className="exec-brief-notice">
          Calculated scenario estimates. Business impact, attack connections, prices and
          effectiveness need your team’s validation.
        </div>
        <h2>The decision</h2>
        <p data-provenance="COMPUTED">
          {decision.controls.length
            ? `Allocate an estimated ${fullMoney(decision.spend)} per year to the actions below, within the ${fullMoney(org.budget)} annual budget. The plan reduces modeled financial loss by ${percent(decision.reduction)} over the selected period.`
            : 'The current budget funds no actions. Review the budget and implementation costs before selecting a plan.'}
        </p>
        <div className="exec-brief-metrics" data-provenance="COMPUTED">
          <div>
            <span>Current estimated loss</span>
            <strong>{fullMoney(decision.before)}</strong>
          </div>
          <div>
            <span>With recommended plan</span>
            <strong>{fullMoney(decision.after)}</strong>
          </div>
          <div>
            <span>Estimated loss avoided</span>
            <strong>{fullMoney(decision.avoided)}</strong>
          </div>
        </div>
        <h2>Actions to fund</h2>
        {decision.annualCostExceedsBenefit && (
          <div className="exec-brief-notice">
            The annual cost exceeds the estimated loss avoided. Revisit the inputs and quotes before
            approving this plan on financial grounds.
          </div>
        )}
        <div className="exec-brief-actions">
          {decision.controls.length ? (
            decision.controls.map((c) => (
              <div key={c.id}>
                <div>
                  <h3>{controlCopy[c.id]?.name ?? c.name}</h3>
                  <p>{controlCopy[c.id]?.benefit ?? c.description}</p>
                </div>
                <strong data-provenance="ASSUMED">{fullMoney(c.cost.value)} / year</strong>
              </div>
            ))
          ) : (
            <p>No actions selected at this budget.</p>
          )}
        </div>
        <h2>Before approval</h2>
        <ul>
          <li>Confirm which business systems and attack connections apply.</li>
          <li>Validate financial impact and record counts with finance.</li>
          <li>Obtain implementation quotes and confirm expected protection with security.</li>
          <li>Assign an accountable owner and delivery date to each funded action.</li>
        </ul>
        <p>
          The plan prioritizes protection against modeled attacker choices. Estimated loss avoided
          is not guaranteed cash savings. Public threat information alone does not establish a
          vulnerability or an active incident at this organization.
        </p>
        <h2>Evidence at the time of assessment</h2>
        <div className="exec-brief-sources">
          {org.scans.map((s) => (
            <div key={s.collector}>
              <strong>{s.collector}</strong>
              <span>{feedStatus(s.status)}</span>
              <time data-provenance="CITED">Checked {new Date(s.checkedAt).toLocaleString()}</time>
            </div>
          ))}
        </div>
        <footer>BLACKSTAR · Quantify. Predict. Optimize.</footer>
      </article>
    </>
  );
}
