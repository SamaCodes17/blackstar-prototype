import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleHelp,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { State } from '../../core/types';
import { decisionSummary } from '../../core/decision';
import { fullMoney, money, percent } from '../shared';
import { AttackMap } from './AttackMap';
import { LiveSources } from './LiveSources';

export const controlCopy: Record<string, { name: string; benefit: string }> = {
  patch: {
    name: 'Fix exposed software',
    benefit: 'Close known weaknesses in public-facing services.',
  },
  mfa: {
    name: 'Protect staff sign-ins',
    benefit: 'Require stronger identity checks to reduce account takeovers.',
  },
  segment: {
    name: 'Isolate sensitive records',
    benefit: 'Limit how far an intruder can reach inside the organization.',
  },
  vendor: {
    name: 'Limit third-party access',
    benefit: 'Reduce the access available through external providers.',
  },
  training: {
    name: 'Strengthen account security',
    benefit: 'Improve phishing awareness and account recovery practices.',
  },
  edr: {
    name: 'Protect critical systems',
    benefit: 'Improve attack prevention on essential business services.',
  },
};
export function DecisionDashboard({
  state,
  busy,
  offline,
  update,
  refresh,
  explain,
  inputs,
}: {
  state: State;
  busy: boolean;
  offline: boolean;
  update: (body: unknown) => Promise<boolean>;
  refresh: () => Promise<boolean>;
  explain: () => void;
  inputs: () => void;
}) {
  const { org, output } = state;
  const decision = decisionSummary(org, output);
  const [budget, setBudget] = useState(org.budget);
  const [period, setPeriod] = useState(org.horizon);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    setBudget(org.budget);
    setPeriod(org.horizon);
  }, [org.id, org.budget, org.horizon]);
  const pending = budget !== org.budget || period !== org.horizon;
  const topAsset = org.assets.find((a) => a.id === decision.topAsset?.id);
  return (
    <>
      <section className="exec-page-title" id="decision">
        <div>
          <p className="exec-kicker">YOUR EXECUTIVE BRIEF</p>
          <h1>A clear next step for your security.</h1>
          <p>See the financial exposure, choose a budget, and know what to fund.</p>
        </div>
        <div className="exec-assessment-date" data-provenance="COMPUTED">
          <span>Assessment updated</span>
          <time dateTime={output.at}>
            {new Date(output.at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </time>
        </div>
      </section>
      <div className="exec-confidence-bar">
        <span className="exec-demo-dot" />
        <p>
          <strong>{org.example ? 'Example assessment.' : 'Planning estimate.'}</strong> Financial
          impact and protection costs use assumptions that need your team’s validation.
        </p>
        <button onClick={explain}>
          About these estimates <ArrowUpRight size={14} />
        </button>
      </div>
      <section className="exec-decision-grid" aria-label="Recommended security investment">
        <div className="exec-recommendation">
          <div className="exec-recommendation-top">
            <span className="exec-dark-kicker">
              <ShieldCheck size={16} /> RECOMMENDED PLAN
            </span>
            <span className="exec-outline-pill">Within your budget</span>
          </div>
          <h2>
            {decision.controls.length
              ? decision.annualCostExceedsBenefit
                ? 'Review the cost before investing.'
                : 'Fund these protections first.'
              : 'Your current budget funds no actions.'}
          </h2>
          <div className="exec-investment-amount" data-provenance="COMPUTED">
            <strong>{money(decision.spend)}</strong>
            <span>estimated annual investment</span>
          </div>
          <p className="exec-plan-intro">
            {decision.controls.length
              ? decision.annualCostExceedsBenefit
                ? 'This plan costs more than the estimated annual loss it avoids. Validate the assumptions and quotes before committing.'
                : 'Prioritize these actions to reduce the impact of modeled attack routes.'
              : 'Increase the budget to compare a funded plan. Exposure remains until protections are added.'}
          </p>
          <div className="exec-action-list">
            {decision.controls.map((control) => (
              <div className="exec-action" key={control.id}>
                <span className="exec-action-check">
                  <Check size={16} />
                </span>
                <div>
                  <h3>{controlCopy[control.id]?.name ?? control.name}</h3>
                  <p>{controlCopy[control.id]?.benefit ?? control.description}</p>
                </div>
                <strong
                  data-provenance="ASSUMED"
                  title="Assumed annual cost; validate with a quote"
                >
                  {money(control.cost.value)}
                </strong>
              </div>
            ))}
          </div>
          <div className="exec-recommendation-bottom">
            <span data-provenance="COMPUTED">{money(decision.remaining)} budget unallocated</span>
            <button onClick={inputs}>
              Review costs <ArrowRight size={15} />
            </button>
          </div>
        </div>
        <div className="exec-impact exec-card">
          <div className="exec-section-head">
            <div>
              <p className="exec-kicker">THE BUSINESS CASE</p>
              <h2>Less exposure. A focused plan.</h2>
            </div>
            <button
              className="exec-help"
              aria-label="Understand the financial estimates"
              onClick={explain}
            >
              <CircleHelp size={20} />
            </button>
          </div>
          <div className="exec-impact-headline" data-provenance="COMPUTED">
            <span className="exec-reduction-icon">
              <ArrowDownRight size={27} />
            </span>
            <div>
              <strong>
                {decision.reduction > 0 ? `${percent(decision.reduction)} lower` : 'No change'}
              </strong>
              <span>estimated financial loss with this plan</span>
            </div>
          </div>
          <div className="exec-loss-comparison" data-provenance="COMPUTED">
            <div>
              <div>
                <span>Current exposure</span>
                <strong>{money(decision.before)}</strong>
              </div>
              <div className="exec-loss-track">
                <span style={{ width: decision.before > 0 ? '100%' : '0%' }} />
              </div>
            </div>
            <div className="after">
              <div>
                <span>With recommended plan</span>
                <strong>{money(decision.after)}</strong>
              </div>
              <div className="exec-loss-track">
                <span
                  style={{
                    width: `${decision.before > 0 ? Math.min(100, (decision.after / decision.before) * 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <p className="exec-avoided" data-provenance="COMPUTED">
            <strong>{money(decision.avoided)}</strong> estimated loss avoided over{' '}
            {org.horizon === 365 ? 'the next year' : `the next ${org.horizon} days`}. This is a
            scenario estimate, not guaranteed savings.
          </p>
          <form
            className="exec-budget-form"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              const ok = await update({ budget, horizon: period });
              setSaving(false);
              setSaved(ok);
            }}
          >
            <div className="exec-budget-label">
              <label htmlFor="executive-budget">
                <SlidersHorizontal size={15} /> Set your annual budget
              </label>
              <output htmlFor="executive-budget" data-provenance="ASSUMED">
                {fullMoney(budget)}
              </output>
            </div>
            <input
              id="executive-budget"
              aria-label="Annual security budget"
              type="range"
              min="0"
              max="1000000"
              step="25000"
              value={budget}
              disabled={busy || offline}
              onChange={(e) => {
                setBudget(Number(e.target.value));
                setSaved(false);
              }}
            />
            <div className="exec-range-labels" data-provenance="ASSUMED">
              <span>₹0</span>
              <span>₹10 lakh</span>
            </div>
            <div className="exec-budget-bottom">
              <label>
                Compare loss over
                <select
                  aria-label="Planning period"
                  value={period}
                  disabled={busy || offline}
                  onChange={(e) => {
                    setPeriod(Number(e.target.value));
                    setSaved(false);
                  }}
                >
                  <option value={365}>Next year</option>
                  <option value={90}>Next 90 days</option>
                  <option value={30}>Next 30 days</option>
                </select>
              </label>
              <button
                type="submit"
                className="exec-button primary"
                disabled={busy || offline || !pending}
              >
                {saving ? 'Updating plan…' : 'Update plan'}
                <ArrowRight size={15} />
              </button>
            </div>
            <p className="exec-budget-feedback" role="status">
              {saving
                ? 'Recalculating the recommendation and attack map…'
                : pending
                  ? 'Budget or period changed. Update the plan to see the effect.'
                  : saved
                    ? 'Plan updated. The recommendation and map use your new settings.'
                    : 'Adjust the budget to compare your options. Costs are annual.'}
            </p>
          </form>
        </div>
      </section>
      <div className="exec-evidence-grid">
        <AttackMap key={org.id} org={org} output={output} />
        <LiveSources org={org} busy={busy} offline={offline} refresh={refresh} update={update} />
      </div>
      <section className="exec-next-step">
        <div className="exec-next-icon">
          <ShieldCheck size={26} />
        </div>
        <div>
          <p className="exec-kicker">BEFORE YOU COMMIT</p>
          <h2>Validate the plan with your team.</h2>
          <p>
            {topAsset ? `${topAsset.label} has the largest share of modeled loss. ` : ''}Confirm the
            exposure, get implementation quotes, and agree who owns each action.
          </p>
        </div>
        <button className="exec-button secondary" onClick={inputs}>
          Review business inputs <ArrowUpRight size={16} />
        </button>
      </section>
    </>
  );
}
