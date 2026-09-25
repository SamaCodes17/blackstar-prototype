import { ArrowRight, FlaskConical } from 'lucide-react';
import { Panel, Tag, NumberValue as N, Note, percent } from '../shared';
import type { PageProps } from '../page-types';
import { Metric } from './Metric';

export function Quantum(p: PageProps) {
  const { output, org } = p.state;
  return (
    <>
      <div className="research-banner">
        <FlaskConical size={28} />
        <div>
          <h2>Experimental optimization, with a classical reference.</h2>
          <p>
            A real state-vector circuit evaluates a pairwise QUBO surrogate. No quantum speedup or
            advantage is claimed.
          </p>
        </div>
        <Tag tag="COMPUTED" />
      </div>
      <div className="metrics-grid three">
        <Metric
          label="Exact game optimum"
          value={output.optimal.gameLoss}
          caption="Ground truth for this finite game"
          formula="Minimum adaptive attacker-response objective among feasible portfolios"
        />
        <div className="metric">
          <p>Simulated qubits</p>
          <N
            value={output.quantum.qubits}
            label="Qubit count"
            format="number"
            formula="Control bits + budget slack bits"
          />
          <span>Includes budget slack variables</span>
        </div>
        <div className="metric">
          <p>Surrogate order</p>
          <span className="big-word">Pairwise</span>
          <span>Higher-order interactions are omitted</span>
        </div>
      </div>
      <Panel title="Same instance. Independently scored results.">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Backend</th>
                <th>Selected controls</th>
                <th>Game loss</th>
                <th>Background ALE</th>
                <th>Quality ratio</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {output.quantum.results.map((r) => (
                <tr key={r.backend}>
                  <td>
                    <strong>{r.backend}</strong>
                    {r.probability !== undefined && (
                      <small data-provenance="COMPUTED">
                        Outcome mass {percent(r.probability)} <Tag />
                      </small>
                    )}
                  </td>
                  <td>
                    {r.ids.map((id) => org.controls.find((c) => c.id === id)?.name).join(', ') ||
                      'Empty portfolio'}
                  </td>
                  <td>
                    <N
                      value={r.gameLoss}
                      label={`${r.backend} game loss`}
                      formula="Selected portfolio rescored with the original full adaptive game"
                    />
                  </td>
                  <td>
                    <N
                      value={r.ale}
                      label={`${r.backend} ALE`}
                      formula="Selected portfolio rescored with the original Bayesian model"
                    />
                  </td>
                  <td>
                    <N
                      value={r.ratio}
                      label={`${r.backend} approximation quality`}
                      format="percent"
                      formula="Exact optimal game loss / candidate game loss. One is optimal; lower is worse. Both zero gives one."
                    />
                  </td>
                  <td>
                    <span className={`soft-pill ${r.feasible ? 'green' : 'amber'}`}>
                      {r.feasible ? 'Feasible' : 'Exceeded'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="two-column">
        <Panel title="The circuit actually executed">
          <div className="circuit-steps">
            <span>Equal superposition</span>
            <ArrowRight />
            <span>QUBO cost phase</span>
            <ArrowRight />
            <span>Mixer rotation</span>
            <ArrowRight />
            <span>Measurement</span>
          </div>
          <p className="panel-copy">
            A shallow QAOA circuit is simulated using complex amplitudes. A deterministic parameter
            grid minimizes expected surrogate energy. The reported result is the most probable
            feasible control portfolio after slack probabilities are combined.
          </p>
          <Note>
            Feasibility postselection can discard probability mass. A shallow circuit can perform
            poorly; the comparison shows its actual result.
          </Note>
        </Panel>
        <Panel title="Where the approximation enters">
          <p className="panel-copy">
            Single-control effects and pairwise interactions are fitted to the full game objective.
            A quadratic penalty with binary slack enforces the exact budget units. The surrogate’s
            optimum can differ from the game’s optimum.
          </p>
          <p className="panel-copy">
            Duality reductions for linear shortest-path inner problems do not establish a reduction
            for dependent Bayesian cascades. With binary defender decisions, such reformulations are
            mixed-integer programs. An exact cascading-game-to-QUBO reduction remains a research
            question.
          </p>
        </Panel>
      </div>
      {p.expert && (
        <Panel title="Surrogate coefficients & execution contract">
          <pre data-provenance="COMPUTED">{JSON.stringify(output.quantum, null, 2)}</pre>
          <Tag />
        </Panel>
      )}
    </>
  );
}
