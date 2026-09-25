import { useState } from 'react';
import { CheckCircle2, FlaskConical, Play, FileCheck2 } from 'lucide-react';
import type { Check } from '../../core/selfcheck';
import { Panel, Tag, Note } from '../shared';
import type { PageProps } from '../page-types';

export function SelfChecks(p: PageProps) {
  const [checks, setChecks] = useState<Check[]>([]),
    [running, setRunning] = useState(false),
    [error, setError] = useState('');
  async function run() {
    setRunning(true);
    setError('');
    try {
      const r = await fetch(`/api/selfcheck?org=${p.state.org.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setChecks(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setRunning(false);
    }
  }
  return (
    <>
      <div className="research-banner">
        <FileCheck2 size={30} />
        <div>
          <h2>Trust the workings. Inspect the checks.</h2>
          <p>
            Run the same numerical assertions used by the automated engine tests against the current
            model.
          </p>
        </div>
        <button className="primary-button" onClick={() => void run()} disabled={running}>
          <Play size={15} />
          {running ? 'Running checks…' : 'Run self-check'}
        </button>
      </div>
      {error && <Note>{error}</Note>}
      <Panel
        title="Model verification"
        action={
          checks.length ? (
            <span data-provenance="COMPUTED">
              {checks.filter((c) => c.passed).length} / {checks.length} passing <Tag />
            </span>
          ) : (
            <Tag tag="COMPUTED" />
          )
        }
      >
        {checks.length ? (
          <div className="check-list">
            {checks.map((c) => (
              <div key={c.name}>
                <span className={`check-icon ${c.passed ? 'pass' : 'fail'}`}>
                  <CheckCircle2 size={19} />
                </span>
                <div>
                  <h3>{c.name}</h3>
                  <p data-provenance="COMPUTED">
                    {c.detail} <Tag />
                  </p>
                </div>
                <span className="quiet-label" data-provenance="COMPUTED">
                  {c.duration.toFixed(1)} ms
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <FlaskConical size={36} />
            <h3>Ready to verify the model</h3>
            <p>
              Check exact inference, Monte Carlo, budget feasibility, attacker ties, quantum
              normalization and grounded narration.
            </p>
          </div>
        )}
      </Panel>
      <Note>
        The live panel executes numerical model assertions. The command-line suite additionally
        checks domain validation, collector allowlists, malformed edits, and graph invariants. UI
        interaction and numeric-tag audits are separate browser checks.
      </Note>
    </>
  );
}
