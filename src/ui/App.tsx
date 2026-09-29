import { CurrencySelector } from './workspace/CurrencySelector';
import { currencySnapshot, subscribeCurrency, loadCurrencyRates, currencyNote } from './currency';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ArrowUpRight, Building2, Plus, SlidersHorizontal, X } from 'lucide-react';
import type { State } from '../core/types';
import { decisionSummary } from '../core/decision';
import { Modal, fullMoney } from './shared';
import { AdminLogin } from './workspace/AdminLogin';
import { PricingPage } from './workspace/PricingPage';
import { Onboarding } from './Onboarding';
import { Workspace, type View, viewFromHash } from './workspace/Workspace';
import { Assistant } from './workspace/Assistant';
import { BusinessInputs } from './executive/BusinessInputs';
import { DecisionBrief } from './executive/DecisionBrief';

export default function App() {
  useSyncExternalStore(subscribeCurrency, currencySnapshot);
  useEffect(() => {
    void loadCurrencyRates();
  }, []);
  const [state, setState] = useState<State>();
  const [view, setView] = useState<View>(viewFromHash);
  const [chat, setChat] = useState<string | null>(null);
  useEffect(() => {
    const sync = () => {
      setView(viewFromHash());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  const [login, setLogin] = useState(false);
  const scenario = useRef<Record<string, any>>({});
  const [onboarding, setOnboarding] = useState(false);
  const [inputs, setInputs] = useState(false);
  const [explain, setExplain] = useState(false);
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState('');
  const requestVersion = useRef(0);
  const currentOrg = useRef('demo-northstar');
  const accept = useCallback((data: State) => {
    setState(data);
    currentOrg.current = data.org.id;
    setOffline(false);
  }, []);
  const load = useCallback(
    async (id = currentOrg.current) => {
      scenario.current = {};
      const version = ++requestVersion.current;
      try {
        const response = await fetch(`/api/state?org=${encodeURIComponent(id)}`);
        if (!response.ok) throw new Error('Could not load this organization');
        const data = await response.json();
        if (version === requestVersion.current) {
          accept(data);
          setError('');
        }
      } catch {
        if (version !== requestVersion.current) return;
        setError('The service is unavailable. Please retry shortly.');
      }
    },
    [accept],
  );
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!state?.org.continuous || busy) return;
    const interval = setInterval(() => void load(), 15000);
    return () => clearInterval(interval);
  }, [state?.org.continuous, load, busy]);
  async function action(path: string, body: unknown = {}) {
    if (busy || offline) return false;
    setBusy(true);
    setError('');
    ++requestVersion.current;
    try {
      let requestBody = body;
      let nextScenario = scenario.current;
      if (state?.access?.demo && path === '/api/update') {
        const incoming = body as Record<string, any>;
        const edits = new Map<string, any>();
        for (const edit of [...(scenario.current.edits ?? []), ...(incoming.edits ?? [])])
          edits.set([edit.group, edit.id, edit.key].join(':'), edit);
        nextScenario = { ...scenario.current, ...incoming, edits: [...edits.values()] };
        requestBody = nextScenario;
      }
      const response = await fetch(`${path}?org=${encodeURIComponent(currentOrg.current)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'The request could not be completed');
      accept(data);
      scenario.current = nextScenario;
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Request failed');
      return false;
    } finally {
      setBusy(false);
    }
  }
  const navigate = (next: View) => {
    window.location.hash = '/' + next;
    setView(next);
  };
  if (!state)
    return (
      <div className="app-loading">
        <div className="wordmark">
          BLACK<span>STAR</span>
        </div>
        <p>{error || 'Preparing your security assessment…'}</p>
        {error && (
          <button className="primary-button" onClick={() => void load()}>
            Retry connection
          </button>
        )}
      </div>
    );
  const { org, output } = state;
  const decision = decisionSummary(org, output);
  return (
    <div className="executive-app">
      <header className="exec-header no-print">
        <a className="exec-brand" href="#/overview" aria-label="BlackStar overview">
          <div className="logo-window">
            <img src="/blackstar-logo.jpeg" alt="BlackStar" />
          </div>
        </a>
        <nav aria-label="Main navigation">
          {(
            [
              ['overview', 'Overview'],
              ['evidence', 'Evidence'],
              ['risk', 'Attack paths'],
              ['investment', 'Investment'],
              ['report', 'Board brief'],
              ['pricing', 'Pricing'],
            ] as const
          ).map(([id, label]) => (
            <a key={id} href={'#/' + id} aria-current={view === id ? 'page' : undefined}>
              {label}
            </a>
          ))}
        </nav>
        <CurrencySelector />
        <button
          className="exec-button secondary"
          onClick={() => setChat('Help me understand this page')}
        >
          ✦ Ask BlackStar
        </button>
      </header>
      <main className="exec-main">
        {view !== 'pricing' && (
          <div className="exec-org-bar no-print">
            <div className="exec-org-picker">
              <Building2 size={20} />
              <div>
                <label htmlFor="organization-picker">ORGANIZATION</label>
                <select
                  id="organization-picker"
                  value={org.id}
                  disabled={busy}
                  onChange={(e) => void load(e.target.value)}
                >
                  {state.organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="exec-org-actions">
              <span className="exec-prototype-pill">
                {state.access?.demo ? 'Fictional demo' : 'Private assessment'}
              </span>
              {state.access?.role === 'admin' && (
                <button
                  className="exec-icon-link"
                  disabled={busy || offline || !state.access?.storageReady}
                  title={
                    state.access?.storageReady
                      ? 'Create a private assessment'
                      : 'Configure managed PostgreSQL to save private assessments'
                  }
                  onClick={() => setOnboarding(true)}
                  aria-label="Add organization"
                >
                  <Plus size={17} />
                  <span>Add organization</span>
                </button>
              )}
              <button
                className="exec-icon-link"
                disabled={busy || offline}
                onClick={() => setInputs(true)}
                aria-label="Business inputs"
                title="Business inputs"
              >
                <SlidersHorizontal size={17} />
                <span>Business inputs</span>
              </button>
            </div>
          </div>
        )}
        {offline && (
          <div className="exec-offline" role="status">
            Showing a saved assessment. Reconnect to change your plan or refresh sources.
            <button onClick={() => void load()}>Retry connection</button>
          </div>
        )}
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button className="icon-button" aria-label="Dismiss error" onClick={() => setError('')}>
              <X size={16} />
            </button>
          </div>
        )}
        {view !== 'pricing' && state.access?.demo && (
          <div className="demo-notice">
            <strong>Explore safely.</strong> These companies, systems and business inputs are
            fictional. Calculations are real model outputs; your what-if changes stay in this visit.{' '}
            <a href="#/evidence">See data sources</a>
            <button onClick={() => void load(org.id)} disabled={busy}>
              Reset scenario
            </button>
          </div>
        )}
        {view === 'pricing' ? (
          <PricingPage />
        ) : view === 'report' ? (
          <DecisionBrief state={state} back={() => navigate('overview')} />
        ) : (
          <Workspace
            key={org.id}
            view={view}
            state={state}
            busy={busy}
            offline={offline}
            navigate={navigate}
            update={(body) => action('/api/update', body)}
            refresh={() => action('/api/scan')}
            inputs={() => setInputs(true)}
            ask={setChat}
            explain={() => setExplain(true)}
          />
        )}
        <footer className="exec-footer no-print">
          <span>
            BLACKSTAR <span>Quantify. Predict. Optimize.</span>
          </span>
          <span>
            {currencyNote()} · Executive risk decisions ·{' '}
            {state.access?.role === 'admin' ? (
              <button className="ws-text-button" onClick={() => void action('/api/logout')}>
                Sign out
              </button>
            ) : (
              <button className="ws-text-button" onClick={() => setLogin(true)}>
                Admin sign in
              </button>
            )}
          </span>
        </footer>
      </main>
      {chat !== null && (
        <Assistant
          key={org.id}
          state={state}
          view={view}
          question={chat}
          close={() => setChat(null)}
          navigate={navigate}
        />
      )}
      {login && (
        <AdminLogin
          configured={Boolean(state.access?.adminConfigured)}
          close={() => setLogin(false)}
          accept={(data) => {
            accept(data);
            scenario.current = {};
            setLogin(false);
          }}
        />
      )}
      {inputs && (
        <BusinessInputs
          org={org}
          busy={busy}
          close={() => setInputs(false)}
          update={(body) => action('/api/update', body)}
        />
      )}
      {onboarding && state.access?.role === 'admin' && (
        <Onboarding
          close={() => setOnboarding(false)}
          accept={(data) => {
            accept(data);
            setOnboarding(false);
            navigate('overview');
          }}
        />
      )}
      {explain && (
        <Modal title="What these estimates mean" close={() => setExplain(false)}>
          <div className="exec-estimate-explainer">
            <p>
              The financial figures are calculated from this assessment’s inputs. They are planning
              estimates, not measured losses or a prediction of your next incident.
            </p>
            <dl data-provenance="COMPUTED">
              <div>
                <dt>Current estimated loss</dt>
                <dd>{fullMoney(decision.before)}</dd>
              </div>
              <div>
                <dt>Estimated loss with the plan</dt>
                <dd>{fullMoney(decision.after)}</dd>
              </div>
              <div>
                <dt>Estimated loss avoided</dt>
                <dd>{fullMoney(decision.avoided)}</dd>
              </div>
              <div>
                <dt>Annual cost of selected actions</dt>
                <dd>{fullMoney(decision.spend)}</dd>
              </div>
            </dl>
            <h3>What needs validation</h3>
            <p>
              Record counts, financial impact, attack connections, targeting, protection costs and
              effectiveness are assumptions. Public sources can verify certificate names and global
              threat information; they do not verify those business inputs.
            </p>
            {org.example && (
              <p>
                The example vulnerability associations are illustrative. They are not findings about
                any real organization.
              </p>
            )}
            <h3>How to use the recommendation</h3>
            <p>
              The plan prioritizes protection against modeled attacker choices within your budget.
              Loss avoided is the difference between the current estimate and the estimate with
              those protections. Validate the inputs and implementation quotes before approving
              spend.
            </p>
            <p className="exec-small" data-provenance="COMPUTED">
              Loss comparison covers {org.horizon === 365 ? 'one year' : `${org.horizon} days`};
              protection prices are annual.
            </p>
            <button
              className="exec-button primary"
              disabled={busy || offline}
              onClick={() => {
                setExplain(false);
                setInputs(true);
              }}
            >
              Review business inputs <ArrowUpRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
