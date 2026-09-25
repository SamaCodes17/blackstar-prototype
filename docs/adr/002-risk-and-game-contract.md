# ADR 002 — Exact small-graph inference and two explicit loss objectives

**Decision:** Enumerate full BN states for exact marginals. Use seeded joint simulation for tail loss. Enumerate defender portfolios and all finite DAG routes for each attacker type. Break equal attacker utility in the defender's favor.

**Alternatives:** Marginal noisy-OR alone loses shared-ancestor dependence. Monte Carlo alone adds optimization noise. A generic numerical optimizer is not a Stackelberg solver. General MILP or game solvers would be excessive for this bounded instance.

| Criterion   | Decision evidence                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Novelty     | Transparent coupling of financial dependency modeling and adaptive portfolio search; no priority claim.          |
| Feasibility | Exact finite reference at the chosen small scale, with no solver license.                                        |
| Scalability | Exponential inference/portfolio costs are explicit and bounded; approximation/worker interfaces are future work. |
| Impact      | Distinguishes attacker-response loss from background expected loss so the decision is not mislabeled.            |
| Benefit     | Independent mathematical fixtures can falsify errors and support explanation.                                    |
| Innovation  | Separates aleatoric outcomes, numerical precision and parameter scenarios.                                       |
| Uniqueness  | Evidence and assumptions are inspectable, without claims about named vendors.                                    |

**Consequences:** Small DAG, no cycle-aware inference or mixed defender strategies. All asset loss allocations are disjoint equivalent records to avoid double-counting copied data. Probability transformations remain assumptions requiring calibration. The game evaluates one route per assumed opportunity followed by cascade; it does not pretend to be the same stochastic experiment as the multi-entry background BN.
