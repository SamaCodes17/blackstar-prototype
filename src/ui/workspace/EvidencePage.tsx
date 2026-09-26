import type { WorkspaceProps } from './types';
import { money } from '../shared';
import { useState } from 'react';
import { LiveSources } from '../executive/LiveSources';
import { pageHelpers } from './pageHelpers';
export function EvidencePage(p: WorkspaceProps) {
  const { org } = p.state;
  const [query, setQuery] = useState('');
  const { heading } = pageHelpers(p);
  return (
    <>
      {heading(
        '01 / OBSERVE',
        'Confidence starts with evidence.',
        'See what was observed, where it came from, and what still needs validation.',
      )}
      <LiveSources
        org={org}
        busy={p.busy}
        offline={p.offline}
        refresh={p.refresh}
        update={p.update}
        shodanConfigured={p.state.integrations?.shodanConfigured}
      />
      <section className="ws-card">
        <div className="ws-section-top">
          <div>
            <h2>Systems in this assessment</h2>
            <p>Modeled systems are a bounded selection, not a complete inventory.</p>
          </div>
          <label className="ws-search">
            Search systems
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Hostname, product or CVE"
            />
          </label>
        </div>
        <div className="ws-table-scroll">
          <table className="ws-table">
            <thead>
              <tr>
                <th>System</th>
                <th>Evidence</th>
                <th>Vulnerability association</th>
                <th>Business records</th>
              </tr>
            </thead>
            <tbody>
              {org.assets
                .filter((a) =>
                  [a.hostname, a.label, a.product, a.cve]
                    .join(' ')
                    .toLowerCase()
                    .includes(query.toLowerCase()),
                )
                .map((a) => (
                  <tr key={a.id}>
                    <td>
                      <strong>{a.label}</strong>
                      <small>{a.hostname}</small>
                    </td>
                    <td>
                      <span className="ws-badge">{a.hostTag}</span>
                      <small>
                        {a.product || 'No verified product fingerprint'}
                        {a.services?.length ? ` · ${a.services.length} indexed services` : ''}
                      </small>
                    </td>
                    <td>
                      {a.cve || 'Not established'}
                      <small>
                        {a.cve
                          ? `${a.findingTag ?? 'PREVIEW'} association · ${a.kev ? 'KEV listed' : 'Review applicability'}`
                          : 'No CVE match is not proof of safety.'}
                      </small>
                    </td>
                    <td>
                      {a.records.value.toLocaleString('en-IN')}
                      <small>Assumed allocation</small>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {!org.assets.some((a) =>
          [a.hostname, a.label, a.product, a.cve]
            .join(' ')
            .toLowerCase()
            .includes(query.toLowerCase()),
        ) && <p role="status">No systems match this search.</p>}
      </section>
      <details className="ws-card">
        <summary>Discovered names · {org.inventory.length}</summary>
        <p>
          Certificate names are historical observations; they do not establish active services or
          ownership.
        </p>
        <div className="ws-inventory">
          {org.inventory.map((name) => (
            <code key={name}>{name}</code>
          ))}
        </div>
      </details>
      <details className="ws-card">
        <summary>Assessment activity · {p.state.timeline.length} events</summary>
        <div className="ws-action-list">
          {p.state.timeline
            .slice()
            .reverse()
            .slice(0, 20)
            .map((t, i) => (
              <div key={i}>
                <span className="ws-badge">{t.tag}</span>
                <span>
                  <strong>{t.event}</strong>
                  <small>{new Date(t.at).toLocaleString('en-IN')}</small>
                </span>
                <b>{money(t.ale)}</b>
              </div>
            ))}
        </div>
      </details>
    </>
  );
}
