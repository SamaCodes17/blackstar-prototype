import { useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  GitBranch,
  FileCheck2,
  BookOpen,
  ChevronRight,
  Network,
  Database,
  Target,
} from 'lucide-react';
import { sources } from '../../core/sources';
import { Panel, Tag, NumberValue as N, Note, percent, human } from '../shared';
import type { PageProps } from '../page-types';

export function Methodology(p: PageProps) {
  const [tab, setTab] = useState('methodology'),
    [node, setNode] = useState('Evidence Intake'),
    [observations, setObservations] = useState('ransomware');
  const { org, output } = p.state;
  const nodes = [
    {
      title: 'Evidence Intake',
      icon: Database,
      page: 'evidence',
      plain:
        'Public indexes identify certificate names and, where available, service evidence. Unknowns remain visible.',
      expert:
        'Allowlisted third-party endpoints → organization-scoped evidence snapshots → dated source statuses. Domain names are never used as request destinations.',
    },
    {
      title: 'Cascading Bayesian Risk Propagation',
      icon: GitBranch,
      page: 'risk',
      plain:
        'The graph models how compromise can spread and converts the result into a financial loss distribution.',
      expert:
        'Full-joint exact enumeration for the bounded DAG; joint Monte Carlo for tail loss and precision. EPSS time conversion, targeting and edge hazard assumptions remain separate.',
    },
    {
      title: 'Stackelberg Investment Optimizer',
      icon: Target,
      page: 'investment',
      plain: 'Each affordable defense is tested against an attacker who responds to it.',
      expert:
        'Enumerated binary portfolios; finite DAG path search per attacker type; defender-favorable SSE ties. Optimize type-weighted conditional route loss.',
    },
    {
      title: 'Outputs & Cyber Contagion Extension',
      icon: Network,
      page: 'ecosystem',
      plain:
        'Stored results become an investment plan, a board report and a broader economic scenario.',
      expert:
        'Read-only reporting consumes persisted output contracts. Preview contagion applies explicit incremental partner, sector and customer coefficients.',
    },
  ];
  const active = nodes.find((n) => n.title === node)!;
  return (
    <>
      <div className="page-tabs">
        {['methodology', 'architecture', 'references', 'why BlackStar'].map((t) => (
          <button className={tab === t ? 'active' : ''} onClick={() => setTab(t)} key={t}>
            {human(t)}
          </button>
        ))}
      </div>
      {tab === 'methodology' && (
        <>
          <Panel title="What is computed, and what is assumed">
            <div className="method-grid">
              <div>
                <Tag tag="CITED" />
                <h3>Observed or published</h3>
                <p>
                  Named, dated public sources. A source supports its specific field, not everything
                  associated with that asset.
                </p>
              </div>
              <div>
                <Tag tag="ASSUMED" />
                <h3>Open to challenge</h3>
                <p>
                  Loss allocations, targeting, dependencies, control effects and attacker priors are
                  editable scenario inputs.
                </p>
              </div>
              <div>
                <Tag />
                <h3>Derived, never invented</h3>
                <p>
                  Risk and portfolio outputs come from deterministic code and seeded sampling of the
                  stored model.
                </p>
              </div>
              <div>
                <Tag tag="PREVIEW" />
                <h3>Demonstration evidence</h3>
                <p>
                  Sample vulnerability associations, simulated events and the economic network run
                  through the real formulas.
                </p>
              </div>
            </div>
          </Panel>
          <Panel title="Model contract & boundaries">
            <div className="method-list">
              <div>
                <h3>Exploitation is not compromise</h3>
                <p>
                  EPSS measures global exploitation activity. A stationary time-window conversion is
                  multiplied by an assumed local targeting factor. It is not an empirically
                  calibrated organization forecast.
                </p>
                <code data-provenance="COMPUTED">e = [1 − (1 − EPSS)^(days/30)] × targeting</code>
              </div>
              <div>
                <h3>Joint probability matters</h3>
                <p>
                  Full joint inference preserves shared-ancestor dependencies. The graph is a DAG;
                  real lateral movement can contain cycles. The prototype caps the modeled graph and
                  retains the larger public inventory separately.
                </p>
                <code data-provenance="COMPUTED">
                  P(v | parents) = 1 − (1 − e_v) × ∏active parents (1 − w_uv)
                </code>
              </div>
              <div>
                <h3>Loss, tail loss, and precision are different</h3>
                <p>
                  ALE is the expected annual loss. Shorter horizons are labeled horizon loss. The
                  tail percentile describes outcomes; the Monte Carlo confidence interval describes
                  sampling precision. The outer parameter band explores assumptions, not a
                  calibrated posterior.
                </p>
                <code>
                  Expected loss = Σ P(v) × disjoint equivalent records(v) × cost per record
                </code>
              </div>
              <div>
                <h3>Two explicit objectives</h3>
                <p>
                  The Bayesian model allows multiple independent entry attempts and cascading
                  compromise over the chosen horizon. The game models one selected deliberate route
                  per assumed opportunity, followed by downstream cascade. It uses additive
                  negative-log edge costs to compare route success, with target preferences and
                  defender-favorable ties. Both outputs are shown; neither is mislabeled as the
                  other.
                </p>
              </div>
              <div>
                <h3>Scale & continuous operation</h3>
                <p>
                  Scheduled public-index refresh and demo events recompute stored results. Changed
                  conditional probabilities invalidate only their descendants. The exact engine
                  reuses the unaffected joint law; changing only loss values reuses all
                  probabilities. Joint-state aggregation, Monte Carlo and the finite game search
                  still run over the small full instance. Worker queues and large cyclic models
                  remain future scale work.
                </p>
              </div>
            </div>
          </Panel>
          <Panel title="Context, not validation">
            <div className="benchmark">
              <div>
                <p>IBM India mean cost per breach</p>
                <N
                  value={255000000}
                  label="IBM India mean cost per breach"
                  tag="CITED"
                  source="ibm"
                  note="Per-incident benchmark, not annualized loss."
                />
              </div>
              <p>
                Published breach averages describe a different population and unit of analysis. They
                do not validate an institution’s annual loss estimate. No public institution-level
                outcome dataset was used for backtesting.
              </p>
            </div>
            <div className="compliance-grid">
              <div>
                <h3>Data protection context</h3>
                <p>
                  The DPDP Act’s security-safeguard penalty ceiling is{' '}
                  <N
                    value={2500000000}
                    label="DPDP statutory maximum"
                    tag="CITED"
                    source="dpdp"
                    note="Statutory maximum, not expected loss. Excluded from every ALE calculation."
                  />
                  . It is not included as an expected cost; this application does not determine
                  legal applicability.
                </p>
              </div>
              <div>
                <h3>Incident reporting context</h3>
                <p>
                  Under the cited CERT-In directions, covered entities report specified incidents
                  within{' '}
                  <span data-provenance="CITED">
                    6 hours <Tag tag="CITED" />
                  </span>{' '}
                  of notice. Follow the linked directions and current applicable requirements.
                </p>
              </div>
            </div>
          </Panel>
          <Panel title="Bayesian prior update · research preview">
            <p className="panel-copy">
              This sandbox demonstrates a Dirichlet-style update from a synthetic event. It is not
              connected to incidents and does not silently change the working model.
            </p>
            <label className="inline-controls">
              Synthetic observation{' '}
              <select value={observations} onChange={(e) => setObservations(e.target.value)}>
                {org.attackers.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <Tag tag="PREVIEW" />
            </label>
            <div className="prior-bars">
              {org.attackers.map((a) => {
                const weights = output.priorPreview
                    .find((x) => x.observation === observations)!
                    .weights.find((x) => x.id === a.id)!,
                  prior = weights.prior,
                  posterior = weights.posterior;
                return (
                  <div key={a.id}>
                    <span>{a.name}</span>
                    <div>
                      <i style={{ width: `${posterior * 100}%` }} />
                    </div>
                    <span data-provenance="PREVIEW">
                      {percent(prior)} → {percent(posterior)} <Tag tag="PREVIEW" />
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>
        </>
      )}
      {tab === 'architecture' && (
        <>
          <div className="architecture-nodes">
            {nodes.map((n) => (
              <button
                key={n.title}
                className={n.title === node ? 'selected' : ''}
                onClick={() => setNode(n.title)}
              >
                <n.icon size={26} />
                <b>{n.title}</b>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
          <Panel title={active.title}>
            <p className="large-copy">{p.expert ? active.expert : active.plain}</p>
            <button className="primary-button" onClick={() => p.navigate(active.page)}>
              Open live panel <ArrowRight size={15} />
            </button>
          </Panel>
          <Note>
            The application is a modular monolith: one local API, one SQLite store and separate pure
            calculation modules. This is a practical prototype, not a claim of distributed
            production scale.
          </Note>
        </>
      )}
      {tab === 'references' && (
        <Panel title="Sources & technical references">
          <div className="references">
            {sources.map((s) => (
              <a key={s.id} href={s.url} target="_blank" rel="noreferrer">
                <div>
                  <BookOpen size={20} />
                  <h3>{s.title}</h3>
                  <ExternalLink size={15} />
                </div>
                <p>{s.note}</p>
                <small data-provenance="CITED">
                  Source / access date: {s.date} <Tag tag="CITED" />
                </small>
              </a>
            ))}
          </div>
        </Panel>
      )}
      {tab === 'why BlackStar' && (
        <Panel title="Why BlackStar · evidence, not self-scores">
          <div className="why-grid">
            {[
              [
                'Novelty',
                'Combines source-tagged loss inference and a responding attacker in one inspectable workflow. Novelty against all existing products has not been established.',
              ],
              [
                'Feasibility',
                'Runs locally with public certificate indexes and no target-side agent. API-key gaps have explicit fallback behavior.',
              ],
              [
                'Scalability',
                'A small exact model is the reference implementation. Larger inference, queues and stronger solvers are documented extension points, not benchmarked claims.',
              ],
              [
                'Impact',
                'The budget slider changes an actual feasible portfolio and shows the resulting rupee exposure alongside a severity-first baseline.',
              ],
              [
                'Benefit',
                'Finance sees costs and uncertainty. Security staff see evidence, entry probabilities, paths and control assumptions.',
              ],
              [
                'Innovation',
                'A Bayesian dependency model, adversarial budget search and verified quantum surrogate share the same stored scenario.',
              ],
              [
                'Uniqueness',
                'Compared with scanner severity rankings and outside-in score categories, this prototype exposes its financial assumptions and allocation logic. It makes no unsupported claim of commercial exclusivity.',
              ],
            ].map(([title, text]) => (
              <div key={title}>
                <FileCheck2 size={22} />
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}
