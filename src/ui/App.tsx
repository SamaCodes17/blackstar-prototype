import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  CircleHelp,
  ClipboardCheck,
  Download,
  FlaskConical,
  GitBranch,
  LayoutDashboard,
  Menu,
  Network,
  Plus,
  RefreshCw,
  Search,
  Shield,
  SlidersHorizontal,
  Target,
  X,
} from 'lucide-react';
import type { State } from '../core/types';
import { sources } from '../core/sources';
import {
  Evidence,
  Overview,
  RiskPage,
  Investment,
  Quantum,
  Ecosystem,
  Assumptions,
  Methodology,
  SelfChecks,
  Report,
  type PageProps,
} from './Pages';
import {
  TraceContext,
  Modal,
  Tag,
  NumberValue as N,
  Note,
  fullMoney,
  percent,
  type Trace,
} from './shared';

const navigation = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'evidence', label: 'Evidence intake', icon: DatabaseIcon },
  { id: 'risk', label: 'Risk model', icon: GitBranch },
  { id: 'investment', label: 'Investment plan', icon: Target },
  { id: 'quantum', label: 'Quantum lab', icon: FlaskConical },
  { id: 'ecosystem', label: 'Ecosystem impact', icon: Network },
];
const trust = [
  { id: 'assumptions', label: 'Assumptions', icon: SlidersHorizontal },
  { id: 'methodology', label: 'Methodology & sources', icon: BookOpen },
  { id: 'selfcheck', label: 'Model self-check', icon: ClipboardCheck },
];
function DatabaseIcon({ size }: { size: number }) {
  return <Search size={size} />;
}
const titles: Record<string, [string, string]> = {
  overview: [
    'Cyber risk, in perspective.',
    'Understand your exposure. Make the next investment count.',
  ],
  evidence: [
    'Start with the evidence.',
    'A public footprint, clear sources, and no hidden assumptions.',
  ],
  risk: [
    'Follow the impact.',
    'See how connected assets turn a local incident into financial loss.',
  ],
  investment: [
    'Make every rupee work.',
    'A defensible investment plan against an attacker who adapts.',
  ],
  quantum: [
    'Test the next approach.',
    'Experimental solvers, measured against the exact classical answer.',
  ],
  ecosystem: [
    'Risk reaches beyond you.',
    'A transparent scenario for the wider economic consequences.',
  ],
  assumptions: ['Make the model yours.', 'Challenge an input. Watch the implications change.'],
  methodology: [
    'Nothing behind the curtain.',
    'The methods, sources and boundaries behind every result.',
  ],
  selfcheck: ['Evidence that it works.', 'Run the numerical checks and inspect their results.'],
  report: [
    'A decision you can explain.',
    'An exportable brief grounded in the same model and evidence.',
  ],
};
const pageComponents: Record<string, (p: PageProps) => React.ReactNode> = {
  overview: Overview,
  evidence: Evidence,
  risk: RiskPage,
  investment: Investment,
  quantum: Quantum,
  ecosystem: Ecosystem,
  assumptions: Assumptions,
  methodology: Methodology,
  selfcheck: SelfChecks,
  report: Report,
};
const tourSteps = [
  {
    page: 'overview',
    title: 'The decision in one place',
    text: 'Start with expected loss, tail exposure and the recommended investment. Every financial figure opens its derivation.',
  },
  {
    page: 'evidence',
    title: 'Separate evidence from assumptions',
    text: 'Certificate names are verified public evidence. Sample vulnerability associations are preview scenarios. Collector statuses show what was actually retrieved.',
  },
  {
    page: 'risk',
    title: 'A compromise can cascade',
    text: 'Select an asset to inspect its probability and loss allocation. Enable blast radius to see downstream effects. Try a preview event to recompute the pipeline.',
  },
  {
    page: 'investment',
    title: 'Change the budget; the attacker adapts',
    text: 'Move the budget slider, compare the plans, and switch the route map between before and after. Prices and effectiveness are assumptions you can replace.',
  },
  {
    page: 'report',
    title: 'Leave with a traceable decision',
    text: 'Export the inputs and stored results, print the board report, and use the self-check to verify the numerical engine.',
  },
];
export default function App() {
  const [state, setState] = useState<State>(),
    [page, setPage] = useState('overview'),
    [expert, setExpert] = useState(false),
    [selected, setSelected] = useState('asset-0'),
    [nodeOpen, setNodeOpen] = useState(false),
    [trace, setTrace] = useState<Trace>(),
    [onboarding, setOnboarding] = useState(false),
    [busy, setBusy] = useState(false),
    [offline, setOffline] = useState(false),
    [error, setError] = useState(''),
    [mobile, setMobile] = useState(false),
    [tour, setTour] = useState<number | undefined>();
  const requestVersion = useRef(0),
    currentOrg = useRef(localStorage.getItem('blackstar.active') ?? 'srmist-example');
  const accept = useCallback((data: State) => {
    setState(data);
    currentOrg.current = data.org.id;
    localStorage.setItem('blackstar.active', data.org.id);
    localStorage.setItem(`blackstar.snapshot.${data.org.id}`, JSON.stringify(data));
    setSelected((s) => (data.org.assets.some((a) => a.id === s) ? s : data.org.assets[0].id));
    setOffline(false);
  }, []);
  const load = useCallback(
    async (id = currentOrg.current) => {
      const version = ++requestVersion.current;
      try {
        const r = await fetch(`/api/state?org=${encodeURIComponent(id)}`);
        if (!r.ok) throw new Error('Could not load this organization');
        const data = await r.json();
        if (version === requestVersion.current) accept(data);
      } catch {
        const cached = localStorage.getItem(`blackstar.snapshot.${id}`);
        if (cached) {
          setState(JSON.parse(cached));
          setOffline(true);
        } else setError('The local service is unavailable. Start the app, then retry.');
      }
    },
    [accept],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!state?.org.continuous || busy) return;
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [state?.org.continuous, load, busy]);
  async function action(path: string, body: unknown = {}) {
    if (busy) return false;
    setBusy(true);
    setError('');
    ++requestVersion.current;
    try {
      const r = await fetch(`${path}?org=${encodeURIComponent(currentOrg.current)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'The request could not be completed');
      accept(data);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed');
      return false;
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: string) {
    setPage(next);
    setMobile(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function select(id: string) {
    setSelected(id);
    setNodeOpen(true);
  }
  function tourTo(step: number) {
    if (step >= tourSteps.length) {
      setTour(undefined);
      return;
    }
    setTour(step);
    navigate(tourSteps[step].page);
  }
  if (!state)
    return (
      <div className="app-loading">
        <div className="wordmark">
          BLACK<span>STAR</span>
        </div>
        <p>{error || 'Preparing the evidence and risk model…'}</p>
        {error && (
          <button className="primary-button" onClick={() => void load()}>
            Retry connection
          </button>
        )}
      </div>
    );
  const { org, output } = state,
    CurrentPage = pageComponents[page],
    activeAsset = org.assets.find((a) => a.id === selected) ?? org.assets[0],
    idx = output.blast.findIndex((b) => b.entry === activeAsset.id);
  const props: PageProps = {
    state,
    expert,
    selected,
    select,
    navigate,
    update: (body) => action('/api/update', body),
    action,
    busy,
  };
  return (
    <TraceContext.Provider
      value={(value) => {
        setNodeOpen(false);
        setTrace(value);
      }}
    >
      <div className="app-shell">
        <aside className={`sidebar ${mobile ? 'is-open' : ''}`}>
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate('overview');
            }}
            aria-label="BlackStar overview"
          >
            <div className="logo-window">
              <img src="/blackstar-logo.jpeg" alt="BlackStar · Quantify Predict Optimize" />
            </div>
          </a>
          <div className="workspace-label">RISK INTELLIGENCE</div>
          <nav aria-label="Primary navigation">
            {navigation.map((n) => (
              <button
                className={page === n.id ? 'active' : ''}
                key={n.id}
                onClick={() => navigate(n.id)}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
                {page === n.id && <span className="nav-active-dot" />}
              </button>
            ))}
          </nav>
          <div className="nav-section-label">TRUST & TRANSPARENCY</div>
          <nav aria-label="Methodology navigation">
            {trust.map((n) => (
              <button
                className={page === n.id ? 'active' : ''}
                key={n.id}
                onClick={() => navigate(n.id)}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button
              className="mobile-add-org"
              onClick={() => {
                setMobile(false);
                setOnboarding(true);
              }}
            >
              <Plus size={17} /> Add organization
            </button>
            <button className="tour-button" onClick={() => tourTo(0)}>
              <CircleHelp size={18} />
              <span>Take a guided tour</span>
              <ArrowUpRight size={14} />
            </button>
            <div className="passive-box">
              <Shield size={19} />
              <div>
                <b>Passive by design</b>
                <p>
                  Public evidence.
                  <br />
                  No target-side scanning.
                </p>
              </div>
            </div>
            <div className="local-label">
              <span className="status-dot live" />
              Local prototype <span>BLACKSTAR</span>
            </div>
          </div>
        </aside>
        <div className="workspace">
          <header className="topbar">
            <div className="breadcrumbs">
              <button
                className="icon-button mobile-menu"
                aria-label="Open navigation"
                onClick={() => setMobile(!mobile)}
              >
                <Menu size={20} />
              </button>
              <span>Workspace</span>
              <span>/</span>
              <b>
                {page === 'report'
                  ? 'Board report'
                  : [...navigation, ...trust].find((n) => n.id === page)?.label}
              </b>
            </div>
            <div className="topbar-tools">
              <div className="lens-switch" aria-label="Explanation depth">
                <button className={!expert ? 'active' : ''} onClick={() => setExpert(false)}>
                  Plain
                </button>
                <button className={expert ? 'active' : ''} onClick={() => setExpert(true)}>
                  Expert
                </button>
              </div>
              <span className="avatar">SC</span>
            </div>
          </header>
          <main>
            <div className="organization-bar">
              <div className="organization-mark">
                <Building2 size={20} />
              </div>
              <div className="organization-select">
                <label htmlFor="organization-picker">
                  {org.example ? 'Example organization' : 'My organization'}
                </label>
                <select
                  id="organization-picker"
                  disabled={busy}
                  value={org.id}
                  onChange={(e) => void load(e.target.value)}
                >
                  {state.organizations.map((o) => (
                    <option value={o.id} key={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="text-button add-org"
                disabled={busy}
                onClick={() => setOnboarding(true)}
              >
                <Plus size={15} /> Add organization
              </button>
              <span className="scenario-pill">
                <span />{' '}
                {offline
                  ? 'Saved snapshot'
                  : org.example
                    ? 'Preview scenario'
                    : 'Assumption-based model'}
              </span>
            </div>
            <div className="page-heading">
              <div>
                <p className="eyebrow">
                  {page === 'overview' ? 'Your security decision workspace' : 'BlackStar / ' + page}
                </p>
                <h1>{titles[page][0]}</h1>
                <p>{titles[page][1]}</p>
              </div>
              <div className="heading-actions">
                {page === 'overview' && (
                  <button className="secondary-button" onClick={() => navigate('report')}>
                    <Download size={15} /> Export report
                  </button>
                )}
                <button
                  className="primary-button"
                  disabled={busy}
                  onClick={() => void action(page === 'evidence' ? '/api/scan' : '/api/recompute')}
                >
                  <RefreshCw size={15} className={busy ? 'spin' : ''} />
                  {busy ? 'Updating…' : page === 'evidence' ? 'Re-scan evidence' : 'Recompute'}
                </button>
              </div>
            </div>
            {offline && (
              <Note>
                Saved browser snapshot. The local service is unreachable; reconnect to change the
                scenario.{' '}
                <button className="text-button" onClick={() => void load()}>
                  Retry connection
                </button>
              </Note>
            )}
            {error && (
              <div className="error-banner" role="alert">
                <span>{error}</span>
                <button
                  className="icon-button"
                  aria-label="Dismiss error"
                  onClick={() => setError('')}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <CurrentPage {...props} />
            <footer className="workspace-footer">
              <span>BlackStar · Quantify. Predict. Optimize.</span>
              <span>
                <Tag tag="CITED" />
                <Tag tag="ASSUMED" />
                <Tag />
                <Tag tag="PREVIEW" /> Every number has a story.
              </span>
            </footer>
          </main>
        </div>
      </div>
      {trace && (
        <Modal title={`Trace: ${trace.label}`} close={() => setTrace(undefined)} wide>
          <div className="trace-hero" data-provenance={trace.tag ?? 'COMPUTED'}>
            <strong>
              {trace.format === 'percent'
                ? percent(trace.value)
                : trace.format === 'number'
                  ? trace.value.toLocaleString('en-IN')
                  : fullMoney(trace.value)}
            </strong>
            <Tag tag={trace.tag} />
          </div>
          {trace.formula && (
            <div className="formula-block">
              <span>Derivation</span>
              <p data-provenance="COMPUTED">{trace.formula}</p>
            </div>
          )}
          {trace.note && <Note>{trace.note}</Note>}
          {trace.source && (
            <a
              className="source-link"
              href={sources.find((s) => s.id === trace.source)?.url ?? trace.source}
              target="_blank"
              rel="noreferrer"
            >
              {sources.find((s) => s.id === trace.source)?.title ?? 'Open evidence source'}{' '}
              <ArrowUpRight size={15} />
            </a>
          )}
          {(trace.tag ?? 'COMPUTED') === 'COMPUTED' && (
            <>
              <h3>Model inputs & provenance leaves</h3>
              <p className="muted">
                This result belongs to the current stored scenario. The complete output contract and
                all input leaves are included in the evidence export.
              </p>
              <div className="trace-tree">
                <div>
                  Record-loss allocations <Tag tag="ASSUMED" />
                  <p>
                    Disjoint equivalent records by asset; scaled by the editable record multiplier.
                  </p>
                </div>
                <div>
                  Cost per equivalent record{' '}
                  <span data-provenance="ASSUMED">
                    {fullMoney(org.assumptions.costPerRecord.value)} <Tag tag="ASSUMED" />
                  </span>
                  <p>{org.assumptions.costPerRecord.reason}</p>
                </div>
                <div>
                  Entry probabilities <Tag tag="COMPUTED" />
                  <p>
                    Global EPSS with a separate association tag, time-window conversion and local
                    targeting; otherwise an assumed baseline.
                  </p>
                </div>
                <div>
                  Dependency weights & control effects <Tag tag="ASSUMED" />
                  <p>Explicit scenario edges, timing, annual prices and modeled efficacy.</p>
                </div>
              </div>
              <details>
                <summary>Raw stored values and assumptions</summary>
                <pre data-provenance="COMPUTED">
                  {JSON.stringify(
                    {
                      metric: trace,
                      scenario: org.id,
                      horizon: org.horizon,
                      assumptions: org.assumptions,
                      assets: org.assets,
                      edges: org.edges,
                      exactDerivation: output.derivation,
                      controls: org.controls.filter((c) => output.optimal.ids.includes(c.id)),
                    },
                    null,
                    2,
                  )}
                </pre>
                <Tag />
              </details>
            </>
          )}
          <div className="modal-actions">
            <a className="secondary-button" href={`/api/export?org=${org.id}`}>
              Download full evidence
            </a>
            <button
              className="primary-button"
              onClick={() => {
                setTrace(undefined);
                navigate('assumptions');
              }}
            >
              Inspect assumptions <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
      {nodeOpen && (
        <Modal title={activeAsset.label} close={() => setNodeOpen(false)} wide>
          <div className="asset-detail-head">
            <div>
              <p>{activeAsset.hostname}</p>
              <Tag tag={activeAsset.hostTag} />
            </div>
            <span className="soft-pill">{activeAsset.kind}</span>
          </div>
          <div className="metrics-grid two">
            <div className="metric">
              <p>Compromise probability</p>
              <N
                value={output.risk.probabilities[idx]}
                label={`${activeAsset.label} probability`}
                format="percent"
                formula="Sum of joint Bayesian states where this node is compromised"
              />
            </div>
            <div className="metric">
              <p>Equivalent loss records</p>
              <N
                value={activeAsset.records.value}
                label={`${activeAsset.label} records`}
                format="number"
                tag="ASSUMED"
                note={activeAsset.records.reason}
              />
            </div>
          </div>
          {activeAsset.cve ? (
            <Note>
              <span data-provenance={activeAsset.findingTag}>
                {activeAsset.cve} <Tag tag={activeAsset.findingTag} />
              </span>{' '}
              —{' '}
              {activeAsset.findingTag === 'PREVIEW'
                ? 'Synthetic association for demonstration. This is not a vulnerability claim about the institution.'
                : 'Third-party service-index association. Validate locally before remediation.'}
            </Note>
          ) : (
            <Note>
              No version-evidenced vulnerability is associated. The model uses an editable annual
              entry baseline.
            </Note>
          )}
          <h3>Incoming dependencies</h3>
          <div className="dependency-list">
            {org.edges
              .filter((e) => e.to === selected)
              .map((e) => (
                <div key={e.from}>
                  <strong>
                    {org.assets.find((a) => a.id === e.from)?.label} → {activeAsset.label}
                  </strong>
                  <N
                    value={e.weight.value}
                    label="Dependency strength"
                    format="percent"
                    tag="ASSUMED"
                    note={e.reason}
                  />
                  <p>{e.reason}</p>
                </div>
              ))}
            {!org.edges.some((e) => e.to === selected) && (
              <p className="muted">Entry node; no modeled incoming dependency.</p>
            )}
          </div>
          <div className="modal-actions">
            <button
              className="secondary-button"
              onClick={() => {
                setNodeOpen(false);
                navigate('assumptions');
              }}
            >
              Edit assumptions
            </button>
            <button
              className="primary-button"
              onClick={() => {
                setNodeOpen(false);
                navigate('risk');
              }}
            >
              Explore blast radius <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
      {onboarding && (
        <Onboarding
          close={() => setOnboarding(false)}
          accept={(data) => {
            accept(data);
            setOnboarding(false);
            navigate('overview');
          }}
        />
      )}
      {tour !== undefined && (
        <div className="tour-popover" role="dialog" aria-label="Guided tour">
          <div>
            <span className="eyebrow" data-provenance="COMPUTED">
              Guided tour · {tour + 1} of {tourSteps.length} <Tag />
            </span>
            <button
              className="icon-button"
              aria-label="End tour"
              onClick={() => setTour(undefined)}
            >
              <X size={17} />
            </button>
          </div>
          <h3>{tourSteps[tour].title}</h3>
          <p>{tourSteps[tour].text}</p>
          <div>
            <button className="text-button" onClick={() => tourTo(Math.max(0, tour - 1))}>
              Back
            </button>
            <button className="primary-button" onClick={() => tourTo(tour + 1)}>
              {tour === tourSteps.length - 1 ? 'Finish tour' : 'Continue'}
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}
    </TraceContext.Provider>
  );
}
function Onboarding({ close, accept }: { close: () => void; accept: (state: State) => void }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          domain: form.get('domain'),
          sector: form.get('sector'),
          size: Number(form.get('size')),
          authorized: form.get('authorized') === 'on',
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      accept(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title="Add your organization" close={close}>
      <p className="muted">
        Start with your public footprint. Public indexes discover certificate names; uncertain
        dependencies and loss inputs remain editable.
      </p>
      <form className="onboarding-form" onSubmit={(e) => void submit(e)}>
        <label>
          Organization name
          <input
            name="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="Your institution or business"
          />
        </label>
        <label>
          Primary domain
          <input name="domain" required placeholder="example.org" autoCapitalize="none" />
        </label>
        <div className="two-column">
          <label>
            Sector
            <select name="sector">
              <option value="education">Education</option>
              <option value="government">Government</option>
              <option value="msme">MSME</option>
              <option value="financial">Bank / financial</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label>
            People / students / employees <Tag tag="ASSUMED" />
            <input name="size" type="number" min={1} max={10000000} defaultValue={1000} required />
          </label>
        </div>
        <label className="checkbox-label">
          <input name="authorized" type="checkbox" required />I am authorized to assess this domain.
        </label>
        <Note>
          Only third-party public indexes are queried. No packets are sent to the target
          infrastructure. This local prototype stores no login credentials.
        </Note>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? 'Reading public indexes…' : 'Create assessment'}
          <ArrowRight size={15} />
        </button>
      </form>
    </Modal>
  );
}
