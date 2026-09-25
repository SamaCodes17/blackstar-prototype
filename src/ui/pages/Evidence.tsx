import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Panel, Tag, NumberValue as N, Note, Term, money } from '../shared';
import type { PageProps } from '../page-types';

export function Evidence(p: PageProps) {
  const { org, timeline } = p.state,
    [query, setQuery] = useState('');
  const assets = org.assets
    .filter((a) => (a.hostname + a.label).toLowerCase().includes(query.toLowerCase()))
    .sort(
      (a, b) =>
        Number(b.kev ?? false) - Number(a.kev ?? false) ||
        (b.epss?.value ?? 0) - (a.epss?.value ?? 0),
    );
  return (
    <>
      <Note>
        Passive by design. Collectors contact public third-party indexes only. No scans, probes, or
        requests go to the assessed domain.
      </Note>
      <div className="source-grid">
        {org.scans.map((s) => (
          <div className="source-card" key={s.collector}>
            <div>
              <span className={`status-dot ${s.status === 'LIVE' ? 'live' : ''}`} />
              <b>{s.collector}</b>
              <span className={`status-pill ${s.status.toLowerCase()}`}>
                {s.status.toLowerCase()}
              </span>
            </div>
            <p>{s.message}</p>
            <small data-provenance="COMPUTED">
              Checked {new Date(s.checkedAt).toLocaleTimeString()} · {s.count} records <Tag />
            </small>
            {s.dataAt && (
              <small data-provenance="CITED">
                Data timestamp: {new Date(s.dataAt).toLocaleString()} <Tag tag="CITED" />
              </small>
            )}
          </div>
        ))}
      </div>
      <Panel
        title="Asset & vulnerability evidence"
        action={
          <input
            className="search-field"
            aria-label="Search assets"
            placeholder="Search assets…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Asset / public hostname</th>
                <th>Association</th>
                <th>
                  <Term>EPSS</Term> · global
                </th>
                <th>
                  <Term>KEV</Term>
                </th>
                <th>Equivalent records</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.label}</strong>
                    <small>
                      {a.hostname} <Tag tag={a.hostTag} />
                    </small>
                  </td>
                  <td>
                    {a.cve ? (
                      <>
                        <span data-provenance={a.findingTag}>
                          {a.cve} <Tag tag={a.findingTag} />
                        </span>
                        <small data-provenance={a.findingTag}>
                          {a.product ?? 'Injected scenario'}
                        </small>
                      </>
                    ) : (
                      <span className="muted">No verified CVE</span>
                    )}
                  </td>
                  <td>
                    {a.epss ? (
                      <N
                        value={a.epss.value}
                        label={`EPSS for ${a.label}`}
                        tag={a.epss.tag}
                        format="percent"
                        source={a.epss.source}
                        note={a.epss.reason}
                      />
                    ) : (
                      <span className="muted">Assumed baseline</span>
                    )}
                  </td>
                  <td>
                    {a.cve ? (
                      <span className={`soft-pill ${a.kev ? 'amber' : ''}`}>
                        {a.kev ? 'Listed' : 'Not listed'}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <N
                      value={a.records.value}
                      label={`Records: ${a.label}`}
                      tag="ASSUMED"
                      format="number"
                      note={a.records.reason}
                    />
                  </td>
                  <td>
                    <button
                      className="icon-button"
                      aria-label={`Inspect ${a.label}`}
                      onClick={() => p.select(a.id)}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel-bottom">
          Prioritized by known exploitation, then EPSS. Example CVE associations are hypothetical,
          even when global feed values are cited.
        </div>
      </Panel>
      <div className="two-column">
        <Panel title="Public footprint inventory">
          <p className="panel-copy">
            Certificate names are evidence of certificate issuance, not proof of active services.
            The small risk graph covers a selected subset.
          </p>
          <div className="hostname-list">
            {org.inventory.length ? (
              org.inventory.map((h) => (
                <div key={h}>
                  {h}
                  <Tag tag="CITED" />
                </div>
              ))
            ) : (
              <p>No public-index results are available. The model uses the domain you supplied.</p>
            )}
          </div>
        </Panel>
        <Panel
          title="Continuous evidence activity"
          action={
            <label className="toggle-line">
              <input
                type="checkbox"
                checked={org.continuous}
                onChange={(e) => void p.update({ continuous: e.target.checked })}
              />{' '}
              Auto-refresh
            </label>
          }
        >
          <div className="event-list">
            {[...timeline]
              .reverse()
              .slice(0, 8)
              .map((t, i) => (
                <div key={i}>
                  <span className={`event-dot ${t.alert ? 'alert' : ''}`} />
                  <div>
                    <b>{t.event}</b>
                    <small data-provenance={t.tag}>
                      {new Date(t.at).toLocaleString()} · {money(t.ale)} <Tag tag={t.tag} />
                    </small>
                    {t.alert && (
                      <span className="soft-pill amber">
                        ALE change exceeded your alert threshold
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
