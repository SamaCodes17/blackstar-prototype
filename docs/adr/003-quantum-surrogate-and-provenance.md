# ADR 003 — Verified surrogate QUBO and explicit provenance

**Decision:** Fit first-order and pairwise game effects, enforce an integer-unit budget with binary slack and a dominating quadratic penalty, compare exact surrogate, annealing and a real complex state-vector QAOA circuit against the exact original game optimum.

**Alternatives:** Branding a random sampler as QAOA would be false. Hardware is unnecessary for verification and requires external accounts. Claiming an exact cascading-game reduction is not mathematically established. A large quantum SDK is unnecessary for this small circuit and would add dependency/installation overhead.

| Criterion | Decision evidence |
|---|---|
| Novelty | Integration of a verifiable surrogate, not a quantum advantage assertion. |
| Feasibility | A small CPU state-vector simulator is available without keys. |
| Scalability | Exponential simulator memory is bounded; backend separation supports later replacement. |
| Impact | The panel reports actual portfolio feasibility and quality, including poor results. |
| Benefit | Reviewers can inspect the energy expression and probability normalization. |
| Innovation | Identical original-objective rescoring exposes approximation error. |
| Uniqueness | No unsupported exclusivity claim. |

**Consequences:** The shallow circuit is experimental. Grid parameter search and feasible modal postselection are disclosed. Budgets and quoted prices use fixed rupee increments. The result ratio is optimum loss / candidate loss for a minimization problem. Global sources, local associations, assumptions, calculations and preview scenarios must not borrow each other's credibility.
