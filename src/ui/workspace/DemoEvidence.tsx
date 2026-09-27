import { historicalContext } from '../../core/history';
import type { Organization } from '../../core/types';
export function DemoEvidence({ org }: { org: Organization }) {
  const history = historicalContext(org.sector);
  return (
    <section className="ws-card">
      <div className="ws-section-top">
        <div>
          <p className="ws-eyebrow">DEMO DATA / REAL HISTORICAL CONTEXT</p>
          <h2>Know what is real.</h2>
          <p>
            Your organization is fictional. The historical incident counts below come from VCDB.
          </p>
        </div>
        <span className="ws-badge">No live collection</span>
      </div>
      <div className="demo-source-grid">
        <article>
          <h3>Fictional business</h3>
          <strong>
            {org.size.toLocaleString('en-IN')} employees · {org.assets.length} systems
          </strong>
          <p>
            Generated company, assets, reserved IP addresses and business inputs. Connections and
            losses are scenario assumptions.
          </p>
        </article>
        <article>
          <h3>Historical incidents</h3>
          <strong>{history.records.toLocaleString('en-IN')} selected records</strong>
          <p>
            {history.scope}. Included from {history.includedRecords.toLocaleString('en-IN')}{' '}
            qualifying external-actor incidents across the pinned dataset.
          </p>
          <a href={history.url} target="_blank" rel="noreferrer">
            Open VCDB source revision ↗
          </a>
        </article>
      </div>
      <h3>Patterns informing this scenario</h3>
      <p>
        The recommendation uses a blend of assumed attacker weights (75%) and smoothed
        incident-category frequencies (25%). This is a prototype evidence-informed weighting step,
        not trained forecasting AI.
      </p>
      <div className="ws-table-scroll">
        <table className="ws-table">
          <thead>
            <tr>
              <th>Incident category</th>
              <th>Historical count</th>
              <th>Scenario weight</th>
            </tr>
          </thead>
          <tbody>
            {['Ransomware', 'Phishing / stolen credentials', 'Other external incidents'].map(
              (name, i) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>
                    {[
                      history.categories.ransomware,
                      history.categories.credentials,
                      history.categories.other,
                    ][i].toLocaleString('en-IN')}
                  </td>
                  <td>
                    {(
                      (100 * org.attackers[i].prior.value) /
                      org.attackers.reduce((sum, a) => sum + a.prior.value, 0)
                    ).toFixed(1)}
                    %<small>Computed mixture · may be overridden</small>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
      <p className="exec-small">{history.limitation}</p>
      <details>
        <summary>Data provenance and selection</summary>
        <p>{history.method}</p>
        <p>
          Five pseudocounts per category; sector-specific counts require at least 30 records.
          Business size is not inferred from a sector code. Categories are assigned in the order
          shown, so records are counted once.
        </p>
        <p>
          {history.validatedRecords.toLocaleString('en-IN')} validated files;{' '}
          {history.exclusions.preferentialSampling} preferentially selected,{' '}
          {history.exclusions.noExternalActor} without an external actor,{' '}
          {history.exclusions.notConfirmed} unconfirmed, and{' '}
          {history.exclusions.missingOrDuplicateId} missing/duplicate IDs excluded.
        </p>
        <p>
          Attribution: {history.source}. Modified into aggregate counts by BlackStar.{' '}
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0
          </a>
          . Snapshot retrieved {history.retrievedAt}. Source records are public reports, not a
          promise of full anonymization. The shipped aggregate contains no victim names.
        </p>
      </details>
    </section>
  );
}
