import { ArrowRight, GitBranch, Shield, Activity } from 'lucide-react';
import { Panel, Tag, NumberValue as N, money } from '../shared';
import { RiskGraph, Distribution, ControlList, TimelineChart } from '../visuals';
import type { PageProps } from '../page-types';
import { Metric } from './Metric';
import { Budget } from './Budget';

export function Overview(p: PageProps) {
  const { org, output, timeline } = p.state;
  return (
    <>
      <div className="metrics-grid">
        <Metric
          label={
            org.horizon === 365 ? 'Annualized loss expectancy' : 'Expected loss · selected horizon'
          }
          value={output.risk.ale}
          caption="Modeled exposure before controls"
          formula="Σ exact P(asset compromised) × disjoint record allocation × cost per record"
          accent
        />
        <Metric
          label="Tail loss exposure"
          value={output.risk.p90}
          caption="Loss threshold in nine out of ten trials"
          formula="Empirical 90th percentile of joint Monte Carlo loss outcomes"
        />
        <Metric
          label="Exposure after investment"
          value={output.optimal.ale}
          caption="With the recommended control portfolio"
          formula="Exact Bayesian ALE with selected controls applied"
        />
        <Metric
          label="Recommended investment"
          value={output.optimal.cost}
          caption="Within your available security budget"
          formula="Sum of assumed annual costs for selected controls"
        />
      </div>
      <div className="dashboard-grid">
        <Panel
          title="See how risk travels"
          eyebrow="Cascading risk map"
          action={
            <button className="text-button" onClick={() => p.navigate('risk')}>
              Explore model <ArrowRight size={15} />
            </button>
          }
        >
          <RiskGraph org={org} output={output} selected={p.selected} onSelect={p.select} compact />
          <div className="panel-bottom">
            <GitBranch size={16} />
            <span>Dependencies are assumptions. Select an asset to inspect the evidence.</span>
          </div>
        </Panel>
        <section className="investment-card">
          <div className="card-overline">
            <Shield size={17} />
            <span>Your next security decision</span>
          </div>
          <h2>
            Put your budget <br />
            where it matters.
          </h2>
          <Budget org={org} update={p.update} busy={p.busy} />
          <div className="investment-divider" />
          <div className="recommended-label">
            Recommended portfolio <Tag />
          </div>
          <ControlList org={org} output={output} />
          <button className="light-button" onClick={() => p.navigate('investment')}>
            Review investment plan <ArrowRight size={16} />
          </button>
          <p className="muted-light">
            The attacker responds to each portfolio before a plan is selected.
          </p>
        </section>
        <Panel
          title="A range of outcomes"
          eyebrow="Loss distribution"
          action={<span className="quiet-label">Joint simulation</span>}
        >
          <Distribution risk={output.risk} />
          <div className="split-stat">
            <div>
              <small>Simulation mean</small>
              <N
                value={output.risk.mean}
                label="Monte Carlo mean"
                formula="Sum of simulated joint losses / trial count"
              />
            </div>
            <div>
              <small>Precision of the estimated mean</small>
              <span className="range" data-provenance="COMPUTED">
                {money(output.risk.ci[0])} – {money(output.risk.ci[1])}
                <Tag />
              </span>
            </div>
          </div>
        </Panel>
        <Panel title="The decision, explained" eyebrow="Grounded in your model">
          <div className="narrator-icon">
            <Activity size={20} />
          </div>
          <p className="narrator" data-provenance="COMPUTED">
            {output.narration}
          </p>
          <div className="narrator-footer">
            <Tag />
            <span>Generated from stored results</span>
            <button className="text-button" onClick={() => p.navigate('report')}>
              Board report <ArrowRight size={14} />
            </button>
          </div>
          <div className="context-warning">
            Scenario estimates include preview evidence. Review assumptions before making an
            investment decision.
          </div>
        </Panel>
      </div>
      <Panel
        title="Risk over time"
        action={
          <button className="text-button" onClick={() => p.navigate('evidence')}>
            View evidence activity <ArrowRight size={14} />
          </button>
        }
      >
        <div className="timeline-overview">
          <TimelineChart events={timeline} />
          <div>
            <p className="eyebrow">Latest model event</p>
            <strong>{timeline.at(-1)?.event}</strong>
            <p className="muted" data-provenance="COMPUTED">
              {new Date(timeline.at(-1)?.at ?? output.at).toLocaleString()} <Tag />
            </p>
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={org.continuous}
                onChange={(e) => void p.update({ continuous: e.target.checked })}
              />{' '}
              Scheduled public-index refresh
            </label>
          </div>
        </div>
      </Panel>
    </>
  );
}
