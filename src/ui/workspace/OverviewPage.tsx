import type { WorkspaceProps } from './types';
import { money } from '../shared';
import {
  CircleHelp,
  ArrowRight,
  ShieldCheck,
  Activity,
  Globe2,
  Network,
  Wallet,
  ChevronRight,
} from 'lucide-react';
import { decisionSummary } from '../../core/decision';
import { percent } from '../shared';
import { controlCopy } from '../executive/DecisionDashboard';
export function OverviewPage(p: WorkspaceProps) {
  const { org, output } = p.state;
  const d = decisionSummary(org, output);
  const top = org.assets.find((a) => a.id === d.topAsset?.id);
  const sourceCount = org.scans.filter((s) => s.status === 'LIVE').length;
  return (
    <>
      <section className="ws-hero">
        <div className="ws-hero-content">
          <p className="ws-eyebrow">
            <span className="ws-dot" /> DECISION INTELLIGENCE
          </p>
          <h1>
            Clarity in a world
            <br />
            of cyber risk.
          </h1>
          <p>
            Your exposure. Your priorities. A plan you can act on.
            <br />
            Understand the business impact before committing your budget.
          </p>
          <div className="ws-actions">
            <button className="exec-button primary" onClick={() => p.navigate('investment')}>
              Review your plan <ArrowRight size={17} />
            </button>
            <button className="ws-text-button" onClick={() => p.navigate('risk')}>
              Explore attack paths <ChevronRight size={16} />
            </button>
          </div>
          <span className="ws-hero-note">
            {org.example ? 'Fictional assessment' : 'Planning assessment'} · Updated{' '}
            {new Date(output.at).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="ws-orbit" aria-hidden="true">
          <div className="ws-orbit-ring one" />
          <div className="ws-orbit-ring two" />
          <div className="ws-star">✦</div>
          <span className="ws-orbit-label label-one">OBSERVE</span>
          <span className="ws-orbit-label label-two">UNDERSTAND</span>
          <span className="ws-orbit-label label-three">DECIDE</span>
        </div>
      </section>
      <div className="ws-stats">
        <button className="ws-stat" onClick={p.explain}>
          <span>Estimated loss · {org.horizon === 365 ? '1 year' : org.horizon + ' days'}</span>
          <strong>{money(d.before)}</strong>
          <small>
            Modeled from current inputs <CircleHelp size={14} />
          </small>
        </button>
        <button className="ws-stat" onClick={() => p.navigate('investment')}>
          <span>With recommended protections</span>
          <strong className="ws-positive">{money(d.after)}</strong>
          <small>
            {percent(d.reduction)} lower modeled loss <ArrowRight size={14} />
          </small>
        </button>
        <button className="ws-stat" onClick={() => p.navigate('evidence')}>
          <span>Evidence coverage</span>
          <strong>
            {org.assets.length}
            <em> modeled systems</em>
          </strong>
          <small>
            {p.state.access?.demo
              ? 'Fictional inventory + VCDB history'
              : p.offline
                ? 'Saved source results'
                : sourceCount + ' live source results'}{' '}
            · View provenance <ArrowRight size={14} />
          </small>
        </button>
      </div>
      <div className="ws-overview-grid">
        <section className="ws-card ws-priority">
          <div className="ws-card-label">
            <ShieldCheck size={18} /> YOUR NEXT DECISION
          </div>
          <h2>
            {d.controls.length ? 'Turn insight into protection.' : 'Start with validated inputs.'}
          </h2>
          <p>
            {d.controls.length
              ? `${d.controls.length} recommended actions fit your annual budget of ${money(org.budget)}. Review the trade-offs before approving spend.`
              : 'No protections were selected within this budget. Review your budget and the assumptions with your team.'}
          </p>
          <div className="ws-action-list">
            {d.controls.map((c, i) => (
              <div key={c.id}>
                <span className="ws-step">0{i + 1}</span>
                <div>
                  <strong>{controlCopy[c.id]?.name ?? c.name}</strong>
                  <small>{controlCopy[c.id]?.benefit ?? c.description}</small>
                </div>
                <b>{money(c.cost.value)}</b>
              </div>
            ))}
          </div>
          <button className="ws-text-button" onClick={() => p.navigate('investment')}>
            Compare investment options <ArrowRight size={16} />
          </button>
        </section>
        <section className="ws-card">
          <div className="ws-card-label">
            <Activity size={18} /> WHAT DESERVES ATTENTION
          </div>
          <h2>{top?.label ?? 'Review your exposure'}</h2>
          <p>
            {top
              ? `${top.hostname} has the largest contribution to this assessment’s estimated loss.`
              : 'Add an organization to establish a planning baseline.'}
          </p>
          <div className="ws-insight">
            <strong>Evidence is not certainty.</strong>
            <p>
              Business impact, connection strengths and protection costs need your team’s
              validation. Calculated figures are estimates, not measured losses.
            </p>
          </div>
          <button className="ws-text-button" onClick={p.inputs}>
            Review business inputs <ArrowRight size={16} />
          </button>
        </section>
      </div>
      <div className="ws-journey">
        {(
          [
            {
              view: 'evidence',
              title: 'See the evidence',
              text: 'Sources, systems and findings',
              icon: Globe2,
            },
            {
              view: 'risk',
              title: 'Follow the risk',
              text: 'Attack paths and potential impact',
              icon: Network,
            },
            {
              view: 'report',
              title: 'Brief your board',
              text: 'A clear, shareable decision summary',
              icon: Wallet,
            },
          ] as const
        ).map((c) => (
          <button key={c.view} onClick={() => p.navigate(c.view)}>
            <c.icon size={23} />
            <span>
              <strong>{c.title}</strong>
              <small>{c.text}</small>
            </span>
            <ArrowRight size={18} />
          </button>
        ))}
      </div>
    </>
  );
}
