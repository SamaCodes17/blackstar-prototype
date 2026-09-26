import { useEffect, useId, useMemo, useState } from 'react';
import {
  Database,
  Globe2,
  KeyRound,
  Server,
  ShieldCheck,
  Network,
  Play,
  RotateCcw,
  Plus,
  Trash2,
} from 'lucide-react';
import type { Organization, Output, Edge } from '../../core/types';
import {
  compromiseImpact,
  illustrativeNetwork,
  scenarioChoices,
  withConnection,
} from '../../core/attackSimulation';
import { money, percent } from '../shared';
const shortScenario: Record<string, string> = {
  'Ransomware actor': 'Ransomware',
  'Credential actor': 'Stolen credentials',
  'Supply-chain actor': 'Third-party access',
};
const scenarioText: Record<string, string> = {
  'Ransomware actor': 'Models an attacker seeking valuable data and operational disruption.',
  'Credential actor': 'Models an attacker starting through permitted identity entry points.',
  'Supply-chain actor': 'Models an attacker using permitted third-party entry points.',
};
export function AttackMap({ org, output }: { org: Organization; output: Output }) {
  const [demo, setDemo] = useState(false);
  const [sandbox, setSandbox] = useState<Edge[] | null>(null);
  const [defended, setDefended] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [step, setStep] = useState(99);
  const [playing, setPlaying] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [weight, setWeight] = useState(50);
  const [error, setError] = useState('');
  const marker = useId().replace(/:/g, '');
  const network = useMemo(
    () => (demo ? illustrativeNetwork(org) : { ...org, edges: sandbox ?? org.edges }),
    [org, demo, sandbox],
  );
  const mask = defended ? output.optimal.mask : 0;
  const responses = useMemo(() => scenarioChoices(network, mask), [network, mask]);
  const response = responses[scenario] ?? responses[0];
  const entry = chosen ?? response?.path[0] ?? network.assets[0]?.id;
  const impact = useMemo(
    () => (entry ? compromiseImpact(network, entry, mask) : null),
    [network, entry, mask],
  );
  const before = useMemo(() => (entry ? compromiseImpact(network, entry) : null), [network, entry]);
  const maxStep = Math.max(0, ...Object.values(impact?.hops ?? {}));
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      setStep((s) => Math.min(maxStep, s + 1));
      if (step >= maxStep) setPlaying(false);
    }, 900);
    return () => clearTimeout(timer);
  }, [playing, step, maxStep]);
  const resetView = () => {
    setChosen(null);
    setStep(99);
    setPlaying(false);
    setError('');
  };
  if (!impact || !before)
    return (
      <section className="ws-card">
        <h2>No systems available</h2>
        <p>Add evidence before exploring attack impact.</p>
      </section>
    );
  const asset = network.assets.find((a) => a.id === entry)!;
  // A spatial network rather than a single path: branches stay visible when nodes are selected.
  const slots = [
    [125, 160],
    [335, 65],
    [320, 330],
    [560, 190],
    [795, 75],
    [825, 345],
    [565, 455],
    [105, 440],
    [1050, 180],
    [1040, 430],
    [580, 50],
    [340, 530],
  ];
  const points = new Map(
    network.assets.map((a, i) => [
      a.id,
      { x: slots[i % slots.length][0], y: slots[i % slots.length][1] },
    ]),
  );
  const affected = impact.ids.filter((id, i) => id !== entry && impact.probabilities[i] > 0);
  const name = (id: string) => network.assets.find((a) => a.id === id)?.label ?? id;
  const sharedScenarios = responses
    .filter((r, i) => i !== scenario && r.path.join('>') === response?.path.join('>'))
    .map((r) => shortScenario[r.type] ?? r.type);
  const preview = demo || sandbox !== null;
  return (
    <section
      className="exec-map exec-card cascade-map"
      id="attack-map"
      aria-labelledby="map-heading"
    >
      <header className="exec-section-head">
        <div>
          <p className="exec-kicker">
            <Network size={15} /> ATTACK PROPAGATION
          </p>
          <h2 id="map-heading">One breach. Every affected branch.</h2>
        </div>
        <div className="exec-map-switch" aria-label="Compare attack map">
          <button
            aria-pressed={!defended}
            onClick={() => {
              setDefended(false);
              setStep(99);
              setPlaying(false);
            }}
          >
            Current
          </button>
          <button
            aria-pressed={defended}
            onClick={() => {
              setDefended(true);
              setStep(99);
              setPlaying(false);
            }}
          >
            <ShieldCheck size={14} /> With plan
          </button>
        </div>
      </header>
      <div className="cascade-controls">
        <label>
          Network
          <select
            aria-label="Network model"
            value={demo ? 'demo' : 'assessment'}
            onChange={(e) => {
              setDemo(e.target.value === 'demo');
              setScenario(0);
              resetView();
            }}
          >
            <option value="assessment">This assessment</option>
            <option value="demo">Illustrative branching network</option>
          </select>
        </label>
        <label>
          Attack scenario
          <select
            aria-label="Attack scenario"
            value={scenario}
            onChange={(e) => {
              setScenario(Number(e.target.value));
              resetView();
            }}
          >
            {responses.map((r, i) => (
              <option key={r.type} value={i}>
                {shortScenario[r.type] ?? r.type}
              </option>
            ))}
          </select>
        </label>
        <button
          className="exec-button secondary"
          onClick={() => {
            setStep(0);
            setPlaying(true);
          }}
          disabled={playing || maxStep === 0}
        >
          <Play size={14} />
          {playing ? 'Playing…' : 'Replay spread'}
        </button>
        <button className="ws-text-button" onClick={resetView}>
          <RotateCcw size={14} /> Reset selection
        </button>
      </div>
      <div className="cascade-scenario" role="status">
        <strong>{shortScenario[response?.type] ?? response?.type ?? 'Custom compromise'}</strong>
        <span>
          {scenarioText[response?.type] ??
            'A modeled attacker choice using the permitted entry points.'}{' '}
          Preferred entry: {response?.path[0] ? name(response.path[0]) : 'none'}. Target:{' '}
          {response?.target ? name(response.target) : 'none'}. Route success estimate:{' '}
          {percent(response?.probability ?? 0)}.
        </span>
        {sharedScenarios.length > 0 && (
          <small>
            This scenario currently chooses the same route as {sharedScenarios.join(' and ')} under
            the available inputs. The model does not invent different connections for different
            scenario names.
          </small>
        )}
        {chosen && (
          <small>
            Manual what-if: {asset.label} is forced compromised. Scenario preference does not change
            downstream transmission assumptions.
          </small>
        )}
      </div>
      {(preview || !network.edges.length) && (
        <div className="cascade-notice">
          <strong>
            {demo
              ? 'Illustrative network'
              : sandbox
                ? 'Unsaved connection sandbox'
                : 'No internal connections mapped'}
          </strong>
          <span>
            {preview
              ? 'Connections and impact below are hypothetical. Your saved evidence, investment plan and board brief are unchanged.'
              : 'Public host evidence does not reveal internal trust relationships. Add assumed connections below or explore the illustrative network to see branching propagation.'}
          </span>
          {!preview && (
            <button
              className="ws-text-button"
              onClick={() => {
                setDemo(true);
                setScenario(0);
                resetView();
              }}
            >
              Explore branching example →
            </button>
          )}
        </div>
      )}
      <div className="cascade-canvas" tabIndex={0} aria-label="Scrollable branching attack graph">
        <svg
          viewBox={`0 0 ${network.assets.length > 7 ? 1180 : 960} 560`}
          style={{ minWidth: 900 }}
          role="group"
          aria-label="Attack propagation graph. Choose a node to simulate its compromise."
        >
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10z" fill="context-stroke" />
            </marker>
          </defs>
          {network.edges.map((e) => {
            const a = points.get(e.from)!,
              b = points.get(e.to)!;
            const dx = b.x - a.x,
              dy = b.y - a.y,
              len = Math.hypot(dx, dy) || 1;
            const active =
              (impact.hops[e.from] ?? Infinity) < step &&
              impact.probabilities[impact.ids.indexOf(e.from)] > 0 &&
              (impact.model.parents[impact.ids.indexOf(e.to)]?.find(
                (p) => impact.ids[p.node] === e.from,
              )?.p ?? 0) > 0;
            const prob =
              impact.model.parents[impact.ids.indexOf(e.to)]?.find(
                (p) => impact.ids[p.node] === e.from,
              )?.p ?? 0;
            return (
              <g key={e.from + '>' + e.to}>
                <path
                  className={`cascade-edge ${active ? 'affected' : ''} ${defended ? 'defended' : ''}`}
                  d={`M${a.x + (dx / len) * 32},${a.y + (dy / len) * 32} L${b.x - (dx / len) * 37},${b.y - (dy / len) * 37}`}
                  markerEnd={`url(#${marker})`}
                />
                <text className="cascade-edge-label" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 9}>
                  {Math.round(prob * 100)}%
                </text>
              </g>
            );
          })}
          {network.assets.map((a) => {
            const pos = points.get(a.id)!;
            const i = impact.ids.indexOf(a.id);
            const reached = (impact.hops[a.id] ?? Infinity) <= step;
            const source = a.id === entry;
            const chance = reached ? impact.probabilities[i] : 0;
            const Icon =
              a.kind === 'records'
                ? Database
                : a.kind === 'identity'
                  ? KeyRound
                  : a.kind === 'public'
                    ? Globe2
                    : a.kind === 'vendor'
                      ? Network
                      : Server;
            return (
              <g
                key={a.id}
                transform={`translate(${pos.x},${pos.y})`}
                className={`cascade-node ${source ? 'source' : chance > 0 ? 'reached' : 'unaffected'} ${defended ? 'defended' : ''}`}
                role="button"
                tabIndex={0}
                aria-pressed={source}
                aria-label={`Compromise ${a.label} (${a.hostname}); conditional chance ${percent(chance)}`}
                onClick={() => {
                  setChosen(a.id);
                  setStep(99);
                  setPlaying(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setChosen(a.id);
                    setStep(99);
                    setPlaying(false);
                  }
                }}
              >
                <circle r="33" />
                <Icon x={-14} y={-14} width={28} height={28} />
                <text y="55" textAnchor="middle" className="cascade-node-name">
                  {a.label.slice(0, 25)}
                </text>
                <text y="73" textAnchor="middle" className="cascade-node-prob">
                  {source ? 'COMPROMISED · 100%' : `${percent(chance)} conditional chance`}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="cascade-replay-state" role="status">
        {step < 99
          ? `Propagation step ${Math.min(step, maxStep)} of ${maxStep}. `
          : 'Showing all reachable branches. '}
        The impact table shows the final conditional result.
      </div>
      <div className="cascade-legend">
        <span>
          <i className="red" /> Starting breach
        </span>
        <span>
          <i className={defended ? 'green' : 'amber'} />{' '}
          {defended ? 'Affected despite plan' : 'Potentially affected'}
        </span>
        <span>
          <i className="purple" /> No modeled spread
        </span>
        <span>Arrow = assumed direction · % on line = transmission chance</span>
      </div>
      <div className="cascade-summary" aria-live="polite">
        <div>
          <small>STARTING SYSTEM</small>
          <strong>{asset.label}</strong>
          <span>{demo ? 'Illustrative system' : asset.hostname}</span>
        </div>
        <div>
          <small>DOWNSTREAM SYSTEMS</small>
          <strong>{affected.length}</strong>
          <span>with nonzero conditional exposure</span>
        </div>
        <div>
          <small>CONDITIONAL EXPECTED LOSS</small>
          <strong>{money(impact.ale)}</strong>
          <span>
            {defended
              ? `${money(before.ale - impact.ale)} lower with plan`
              : 'If the selected system is already compromised'}
          </span>
        </div>
      </div>
      {defended && Math.abs(before.ale - impact.ale) < 0.01 && (
        <p className="exec-map-note" role="status">
          The selected plan does not change downstream transmission from this already-compromised
          node. Entry-prevention controls do not reverse the starting breach in this what-if.
        </p>
      )}
      <details className="cascade-details" open>
        <summary>Impact on each connected system</summary>
        <div className="ws-table-scroll">
          <table className="ws-table">
            <thead>
              <tr>
                <th>System</th>
                <th>Current</th>
                <th>{defended ? 'With plan' : 'State'}</th>
                <th>How it is reached</th>
              </tr>
            </thead>
            <tbody>
              {impact.ids
                .filter((id) => id !== entry)
                .map((id, i) => {
                  const idx = impact.ids.indexOf(id);
                  return (
                    <tr key={i}>
                      <td>{name(id)}</td>
                      <td>{percent(before.probabilities[before.ids.indexOf(id)])}</td>
                      <td>
                        {defended
                          ? percent(impact.probabilities[idx])
                          : impact.probabilities[idx] > 0
                            ? 'Potentially affected'
                            : 'No modeled spread'}
                      </td>
                      <td>
                        {network.edges
                          .filter(
                            (e) =>
                              e.to === id && impact.probabilities[impact.ids.indexOf(e.from)] > 0,
                          )
                          .map((e) => name(e.from))
                          .join(', ') || 'No reachable parent'}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </details>
      {!demo && (
        <details className="cascade-details">
          <summary>Map assumed connections · local sandbox</summary>
          <p>
            Add the business relationships your team knows. These connections stay in this page
            session and are not treated as discovered evidence. Cycles are not supported by this
            prototype’s calculation model.
          </p>
          <form
            className="cascade-controls"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                const fact = {
                  value: weight / 100,
                  tag: 'ASSUMED' as const,
                  reason: 'User-entered connection sandbox',
                };
                const next = withConnection(network, {
                  from,
                  to,
                  weight: fact,
                  days: { ...fact, value: 10 },
                  reason: 'User-entered sandbox dependency',
                });
                setSandbox(next.edges);
                setError('');
                resetView();
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : 'Invalid connection');
              }
            }}
          >
            <label>
              From
              <select
                aria-label="Connection from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              >
                <option value="">Choose system</option>
                {org.assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} · {a.hostname}
                  </option>
                ))}
              </select>
            </label>
            <label>
              To
              <select aria-label="Connection to" value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">Choose system</option>
                {org.assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label} · {a.hostname}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Transmission %
              <input
                aria-label="Connection transmission percent"
                type="number"
                min={0}
                max={100}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
              />
            </label>
            <button className="exec-button secondary" disabled={!from || !to}>
              <Plus size={14} /> Add connection
            </button>
          </form>
          {error && <p role="alert">{error}</p>}
          <div className="cascade-connection-list">
            {network.edges.map((e) => (
              <div key={e.from + '>' + e.to}>
                <span>
                  {name(e.from)} → {name(e.to)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove connection ${name(e.from)} to ${name(e.to)}`}
                  onClick={() => setSandbox(network.edges.filter((x) => x !== e))}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          {sandbox && (
            <button
              className="ws-text-button"
              onClick={() => {
                setSandbox(null);
                resetView();
              }}
            >
              Discard sandbox connections
            </button>
          )}
        </details>
      )}
      <p className="exec-map-note">
        Click any node to simulate its compromise. All downstream branches are evaluated, including
        paths that merge. This is a hypothetical impact model, not a detected attack. The starting
        node stays at 100% even with protection because the scenario assumes it has already been
        breached.
      </p>
    </section>
  );
}
