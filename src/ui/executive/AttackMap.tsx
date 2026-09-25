import { useId, useState } from 'react';
import { ArrowRight, GitBranch, ShieldCheck } from 'lucide-react';
import type { Organization, Output } from '../../core/types';
import { money, percent } from '../shared';

const scenarioName: Record<string, string> = {
  'Ransomware actor': 'Ransomware',
  'Credential actor': 'Stolen credentials',
  'Supply-chain actor': 'Third-party access',
};
const businessRole: Record<string, string> = {
  public: 'The public-facing entry point into your organization.',
  identity: 'Accounts that give people access to business systems.',
  records: 'Sensitive records with a direct financial impact if compromised.',
  learning: 'A service people rely on for everyday operations.',
  portal: 'A public-facing service that handles user information.',
  vendor: 'An illustrative external connection to your systems.',
};
function labelLines(label: string) {
  if (label.length <= 20) return [label];
  const words = label.split(' ');
  let first = words.shift() ?? '';
  while (words.length > 1 && (first + ' ' + words[0]).length <= 20) first += ' ' + words.shift();
  return [first, words.join(' ')];
}
export function AttackMap({ org, output }: { org: Organization; output: Output }) {
  const [defended, setDefended] = useState(false);
  const [scenario, setScenario] = useState(0);
  const [selected, setSelected] = useState(
    output.derivation.slice().sort((a, b) => b.contribution - a.contribution)[0]?.id,
  );
  const marker = useId().replace(/:/g, '');
  const ids = output.derivation.map((d) => d.id);
  const depth: Record<string, number> = {};
  for (const id of ids)
    depth[id] = Math.max(0, ...org.edges.filter((e) => e.to === id).map((e) => depth[e.from] + 1));
  const maxDepth = Math.max(0, ...Object.values(depth));
  const width = Math.max(740, (maxDepth + 1) * 190);
  const positions = new Map(
    ids.map((id) => {
      const group = ids.filter((x) => depth[x] === depth[id]);
      return [
        id,
        {
          x: maxDepth ? 94 + depth[id] * ((width - 188) / maxDepth) : width / 2,
          y: 58 + ((group.indexOf(id) + 0.5) / group.length) * 228,
        },
      ];
    }),
  );
  const baseline = output.portfolios.find((p) => p.mask === 0)!;
  const responses = defended ? output.optimal.responses : baseline.responses;
  const route = responses[scenario]?.path ?? [];
  const asset = org.assets.find((a) => a.id === selected) ?? org.assets[0];
  const index = ids.indexOf(asset.id);
  const probability = (defended ? output.after : output.risk).probabilities[index];
  const contribution = output.derivation[index]?.value * probability;
  const risk = defended ? output.after : output.risk;
  const affected = new Set(
    org.controls
      .filter((c) => output.optimal.ids.includes(c.id))
      .flatMap((c) => [...c.nodes, ...c.edges.map((e) => e.split('>')[1])]),
  );
  return (
    <section className="exec-map exec-card" id="attack-map" aria-labelledby="map-heading">
      <header className="exec-section-head">
        <div>
          <p className="exec-kicker">
            <GitBranch size={14} /> SEE THE EXPOSURE
          </p>
          <h2 id="map-heading">How an attack could spread</h2>
        </div>
        <div className="exec-map-switch" aria-label="Compare attack map">
          <button aria-pressed={!defended} onClick={() => setDefended(false)}>
            Current
          </button>
          <button aria-pressed={defended} onClick={() => setDefended(true)}>
            <ShieldCheck size={14} /> With plan
          </button>
        </div>
      </header>
      <div className={`exec-map-stage ${defended ? 'is-defended' : ''}`}>
        <div className="exec-map-toolbar">
          <label>
            Attack scenario{' '}
            <select
              aria-label="Attack scenario"
              value={scenario}
              onChange={(e) => setScenario(Number(e.target.value))}
            >
              {responses.map((r, i) => (
                <option key={r.type} value={i}>
                  {scenarioName[r.type] ?? r.type}
                </option>
              ))}
            </select>
          </label>
          <span className="exec-map-legend">
            <i />
            {defended ? 'Route after investment' : 'Modeled attack route'}
          </span>
        </div>
        <div className="exec-map-scroll" tabIndex={0} aria-label="Scrollable attack graph">
          <svg
            viewBox={`0 0 ${width} 344`}
            style={{ minWidth: width }}
            role="group"
            aria-label={`${defended ? 'With recommended plan' : 'Current'} attack graph. Select a system to see its business impact.`}
          >
            <defs>
              <marker
                id={marker}
                viewBox="0 0 8 8"
                refX="7"
                refY="4"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 7 4 L 0 7" fill="none" stroke="context-stroke" strokeWidth="1.5" />
              </marker>
            </defs>
            {org.edges.map((edge) => {
              const from = positions.get(edge.from)!,
                to = positions.get(edge.to)!;
              const active = route.some((id, i) => id === edge.from && route[i + 1] === edge.to);
              const start = from.x + 80,
                end = to.x - 82,
                mid = (start + end) / 2;
              return (
                <path
                  key={`${edge.from}-${edge.to}`}
                  d={`M${start},${from.y} C${mid},${from.y} ${mid},${to.y} ${end},${to.y}`}
                  className={`exec-map-edge ${active ? 'active' : ''}`}
                  markerEnd={`url(#${marker})`}
                />
              );
            })}
            {ids.map((id, i) => {
              const a = org.assets.find((node) => node.id === id)!;
              const { x, y } = positions.get(id)!;
              const lines = labelLines(a.label);
              return (
                <g
                  key={id}
                  className={`exec-map-node ${route.includes(id) ? 'on-route' : ''} ${asset.id === id ? 'selected' : ''} ${defended && affected.has(id) ? 'protected' : ''}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Inspect ${a.label} (${a.hostname}), modeled compromise chance ${percent(risk.probabilities[i])}`}
                  aria-pressed={asset.id === id}
                  onClick={() => setSelected(id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(id);
                    }
                  }}
                  transform={`translate(${x},${y})`}
                >
                  <rect x="-80" y="-42" width="160" height="84" rx="12" />
                  <circle cx="-62" cy="-24" r="3" />
                  <text x="-52" y="-20" className="exec-node-category">
                    {depth[id] === 0 ? 'ENTRY POINT' : 'BUSINESS SYSTEM'}
                  </text>
                  <text x="-62" y={lines.length > 1 ? -2 : 5} className="exec-node-name">
                    {lines.map((line, n) => (
                      <tspan x="-62" dy={n ? 14 : 0} key={n}>
                        {line}
                      </tspan>
                    ))}
                  </text>
                  <text x="-62" y="30" className="exec-node-value" data-provenance="COMPUTED">
                    {percent(risk.probabilities[i])}{' '}
                    <tspan className="exec-node-label">modeled chance</tspan>
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="exec-route-caption">
          <span>SCENARIO ROUTE</span>
          <p>
            {route.length
              ? route.map((id, i) => (
                  <span key={id}>
                    {i > 0 && <ArrowRight size={12} />}
                    {org.assets.find((a) => a.id === id)?.label}
                  </span>
                ))
              : 'No available route in this scenario.'}
          </p>
        </div>
      </div>
      <div className="exec-map-detail">
        <div>
          <span className="exec-kicker">SELECTED SYSTEM</span>
          <h3>{asset.label}</h3>
          <p className="exec-selected-host" data-provenance={asset.hostTag}>
            {asset.hostname}
          </p>
          <p>{businessRole[asset.kind] ?? 'A business service included in this assessment.'}</p>
        </div>
        <div data-provenance="COMPUTED">
          <strong>{money(contribution)}</strong>
          <span>share of estimated loss{defended ? ' with plan' : ''}</span>
        </div>
      </div>
      <p className="exec-map-note">
        Illustrative paths, not a detected attack. Connections and probabilities need validation
        with your team. Select any system to explore.
      </p>
    </section>
  );
}
