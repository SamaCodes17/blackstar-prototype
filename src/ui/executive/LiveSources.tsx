import { useState } from 'react';
import { ArrowUpRight, Check, Clock3, Database, Radio, RefreshCw } from 'lucide-react';
import type { Organization, ScanStatus } from '../../core/types';
import { Modal, percent } from '../shared';

const feeds = [
  {
    key: 'Certificate transparency',
    name: 'Certificate records',
    detail: 'Public domains & hostnames',
    url: 'https://crt.sh/',
  },
  {
    key: 'FIRST EPSS',
    name: 'Exploitation likelihood',
    detail: 'FIRST · global threat signals',
    url: 'https://www.first.org/epss/',
  },
  {
    key: 'CISA KEV',
    name: 'Known exploited threats',
    detail: 'CISA · confirmed exploitation',
    url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  },
  {
    key: 'NVD / CVE',
    name: 'Vulnerability catalog',
    detail: 'NIST · vulnerability context',
    url: 'https://nvd.nist.gov/',
  },
  {
    key: 'Service / CVE correlation',
    name: 'Shodan service intelligence',
    detail: 'Indexed ports, software & versions',
    url: 'https://www.shodan.io/',
  },
];
export function feedStatus(status?: ScanStatus['status']) {
  return status === 'LIVE'
    ? 'Live'
    : status === 'SNAPSHOT'
      ? 'Saved'
      : status === 'PREVIEW'
        ? 'Demo'
        : status === 'UNAVAILABLE'
          ? 'Unavailable'
          : 'Not checked';
}
export function LiveSources({
  org,
  busy,
  offline,
  refresh,
  update,
  shodanConfigured,
}: {
  org: Organization;
  busy: boolean;
  offline: boolean;
  refresh: () => Promise<boolean>;
  update: (body: unknown) => Promise<boolean>;
  shodanConfigured?: boolean;
}) {
  const [detail, setDetail] = useState<(typeof feeds)[number]>();
  const [refreshing, setRefreshing] = useState(false);
  const live = offline
    ? 0
    : feeds.filter(
        (feed) =>
          !(feed.key === 'Service / CVE correlation' && shodanConfigured === false) &&
          org.scans.some((s) => s.collector === feed.key && s.status === 'LIVE'),
      ).length;
  const record = org.scans.find((s) => s.collector === detail?.key);
  const needsKey = (key: string) =>
    key === 'Service / CVE correlation' && shodanConfigured === false;
  const noMatches = org.scans.some((s) => s.collector === 'Vulnerability intelligence');
  const noMatchFor = (key: string) =>
    noMatches && ['FIRST EPSS', 'CISA KEV', 'NVD / CVE'].includes(key);
  const explanation =
    detail && needsKey(detail.key)
      ? 'Shodan is not connected. The organization administrator needs to configure the server-side API key. No live Shodan findings are claimed; any stored example associations remain illustrative.'
      : detail?.key === 'Service / CVE correlation' && record?.issue
        ? record.message
        : !record
          ? detail && noMatchFor(detail.key)
            ? 'No matched vulnerabilities are available to look up for this assessment. Your security team should verify software versions first.'
            : 'This source has not been checked for this assessment. Refresh sources to request current public information.'
          : record.status === 'LIVE'
            ? 'Public information was retrieved successfully at the time below. This is a source check, not evidence of an incident at your organization.'
            : record.status === 'SNAPSHOT'
              ? 'Using previously saved information. A current source response is unavailable; retained values can include example assumptions.'
              : record.status === 'PREVIEW'
                ? 'Only illustrative findings are available. No verified service vulnerability is claimed. Ask your security team to validate the systems and software versions.'
                : 'This source currently has no usable information for the assessment. Risk estimates still rely on the stated assumptions.';
  return (
    <section className="exec-sources exec-card" id="sources" aria-labelledby="sources-heading">
      <header className="exec-section-head">
        <div>
          <p className="exec-kicker">
            <Radio size={14} /> EVIDENCE MONITOR
          </p>
          <h2 id="sources-heading">Live source list</h2>
        </div>
        <span className="exec-count" data-provenance="COMPUTED">
          {live}/{feeds.length} live
        </span>
      </header>
      <p className="exec-source-intro">Public signals informing this assessment.</p>
      <div className="exec-feed-list">
        {feeds.map((feed) => {
          const scan = org.scans.find((s) => s.collector === feed.key);
          const status = offline && scan?.status === 'LIVE' ? 'SNAPSHOT' : scan?.status;
          return (
            <button key={feed.key} className="exec-feed" onClick={() => setDetail(feed)}>
              <span className={`exec-feed-icon ${status?.toLowerCase() ?? 'unchecked'}`}>
                {status === 'LIVE' ? (
                  <Check size={17} />
                ) : status === 'SNAPSHOT' ? (
                  <Clock3 size={17} />
                ) : (
                  <Database size={17} />
                )}
              </span>
              <span className="exec-feed-copy">
                <strong>{feed.name}</strong>
                <small>{feed.detail}</small>
                {scan && (
                  <time dateTime={scan.checkedAt} data-provenance="CITED">
                    {scan.status === 'PREVIEW' ? 'Status' : 'Checked'}{' '}
                    {new Date(scan.checkedAt).toLocaleString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                )}
              </span>
              <span className={`exec-feed-status ${status?.toLowerCase() ?? ''}`}>
                {scan?.issue === 'ACCESS_DENIED'
                  ? 'Access blocked'
                  : needsKey(feed.key)
                    ? 'Key needed'
                    : feed.key === 'Service / CVE correlation' &&
                        shodanConfigured &&
                        scan?.status === 'PREVIEW'
                      ? 'Not checked'
                      : !scan && noMatchFor(feed.key)
                        ? 'No match'
                        : feedStatus(status)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="exec-source-footer">
        <p>
          Live means retrieved at the last check. It does not confirm a vulnerability in your
          systems.
        </p>
        <button
          className="exec-button secondary"
          disabled={busy || offline}
          onClick={async () => {
            setRefreshing(true);
            try {
              await refresh();
            } finally {
              setRefreshing(false);
            }
          }}
        >
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Checking public sources…' : 'Refresh sources'}
        </button>
        <label className="exec-auto-refresh">
          <input
            type="checkbox"
            checked={org.continuous}
            disabled={busy || offline}
            onChange={(event) => void update({ continuous: event.target.checked })}
          />{' '}
          Automatic refresh
        </label>
        {shodanConfigured && (
          <small className="exec-credit-note">
            Shodan searches may use your account’s query credits.
          </small>
        )}
      </div>
      {detail && (
        <Modal title={detail.name} close={() => setDetail(undefined)}>
          <div className="exec-source-detail">
            <span className={`exec-feed-status ${record?.status.toLowerCase() ?? ''}`}>
              {record?.issue === 'ACCESS_DENIED'
                ? 'Access blocked'
                : needsKey(detail.key)
                  ? 'Key needed'
                  : offline && record?.status === 'LIVE'
                    ? 'Saved offline'
                    : !record && noMatchFor(detail.key)
                      ? 'No match'
                      : feedStatus(record?.status)}
            </span>
            <p>{explanation}</p>
            {record && (
              <dl data-provenance="CITED">
                <div>
                  <dt>Last checked</dt>
                  <dd>{new Date(record.checkedAt).toLocaleString()}</dd>
                </div>
                {record.dataAt && (
                  <div>
                    <dt>Source data dated</dt>
                    <dd>{new Date(record.dataAt).toLocaleString()}</dd>
                  </div>
                )}
                <div>
                  <dt>Relevant items recorded</dt>
                  <dd>{record.count.toLocaleString('en-IN')}</dd>
                </div>
              </dl>
            )}
            {detail.key === 'Certificate transparency' && org.inventory.length > 0 && (
              <div className="exec-source-evidence">
                <h3>Public certificate names</h3>
                <p>
                  Names in certificates do not prove an active service or a vulnerability. The
                  inventory may be incomplete.
                </p>
                <ul data-provenance="CITED">
                  {org.inventory.slice(0, 20).map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
                {org.inventory.length > 20 && (
                  <small data-provenance="COMPUTED">
                    Showing the first 20 of {org.inventory.length} names.
                  </small>
                )}
              </div>
            )}
            {detail.key === 'FIRST EPSS' && org.assets.some((a) => a.epss) && (
              <div className="exec-source-evidence">
                <h3>Global exploitation signals</h3>
                <p>
                  These scores describe exploitation activity worldwide. Sample associations remain
                  illustrative even when scores refresh.
                </p>
                <ul>
                  {org.assets
                    .filter((a) => a.epss)
                    .map((a) => (
                      <li key={a.id} data-provenance={a.epss!.tag}>
                        {a.cve}: {percent(a.epss!.value)} ·{' '}
                        {a.findingTag === 'PREVIEW' ? 'Example association' : 'Indexed association'}
                        {a.epss!.tag !== 'CITED' && ' · Sample score'}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {detail.key === 'Service / CVE correlation' && (
              <div className="exec-source-evidence">
                <h3>Indexed services</h3>
                <p>
                  Only exact hostname matches for systems in this assessment are included. These are
                  Shodan observations, not a fresh scan of your systems. Unlisted systems have not
                  been proved safe.
                </p>
                {org.assets.some((a) => a.services?.length) ? (
                  <ul>
                    {org.assets.flatMap((a) =>
                      (a.services ?? []).map((service, i) => (
                        <li key={`${a.id}-${i}`} data-provenance="CITED">
                          <strong>{a.hostname}</strong>
                          <br />
                          {service.ip}:{service.port} · {service.transport}
                          <br />
                          {service.product ?? 'Product not identified'} {service.version ?? ''}
                          <br />
                          {service.observedAt
                            ? `Observed ${new Date(service.observedAt).toLocaleString()}`
                            : 'Observation date not supplied'}
                          {service.cves.length > 0 && (
                            <>
                              <br />
                              Indexed CVEs: {service.cves.join(', ')}
                            </>
                          )}
                        </li>
                      )),
                    )}
                  </ul>
                ) : (
                  <p>No indexed service observations have been saved for this assessment.</p>
                )}
              </div>
            )}
            <a className="exec-button secondary" href={detail.url} target="_blank" rel="noreferrer">
              Open public source <ArrowUpRight size={16} />
            </a>
          </div>
        </Modal>
      )}
    </section>
  );
}
