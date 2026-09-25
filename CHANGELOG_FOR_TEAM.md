# Changes the team should carry into its deck and diagram

## Working prototype

- Standardize the financial headline on **ALE**. Shorter horizons say **expected horizon loss**, not annual loss.
- Marginal noisy-OR is not exact on arbitrary DAGs. This implementation uses **full joint exact inference** on a small DAG, with Monte Carlo for loss outcomes and an explicit approximate-forward comparison.
- A Monte Carlo mean confidence interval, the outcome P90, and the parameter sensitivity band are different quantities. Do not describe any one as the others.
- EPSS is global thirty-day exploitation activity, converted under stationarity and scaled by an assumed organization-targeting factor. It is not direct annual organization compromise probability.
- The default education cost per record is **ASSUMED ₹3,000**, not the unverified ₹3,139 anchor in the brief. The example size is assumed. IBM's verified India per-breach average is benchmark context only.
- Live CT verification succeeded through **Cert Spotter** after crt.sh returned an error. Academia, radius, ilms, alumni and admissions hostnames were observed. Names mentioned in the original brief are not asserted without evidence.
- Hostnames do not prove data-flow or SSO dependencies. All dependency weights and their structural rationale are explicitly scenario assumptions; the supplier relationship is PREVIEW.
- Example CVE associations are PREVIEW. A live global EPSS or KEV update does not turn a sample association into a verified institutional vulnerability.
- MITRE ATT&CK is a behavior taxonomy and reported-procedure knowledge base, not a population prevalence dataset. Attacker priors are editable **ASSUMED** weights. A synthetic Bayesian-update sandbox is separate from the working model.
- The prototype enumerates finite pure defender portfolios with a real adaptive follower and SSE tie-break. It reports the **game objective separately from background ALE**. Do not claim those are identical or that it solves a general mixed-strategy security game.
- Replace “KKT → single-level LP” with “applicable linear inner problem → mixed-integer reformulation.” Binary defender decisions make it a MILP. No exact dependent-cascade-to-QUBO reduction is claimed.
- The working quantum bridge is a **pairwise surrogate**, exact surrogate search, simulated annealing, and an actual shallow QAOA state-vector circuit. There is no hardware, speedup or advantage claim. Postselection and actual approximation quality are visible.
- Economic contagion is an additive PREVIEW scenario with explicit coefficients. It is not an ingested MCA/BSE network or validated market contagion forecast.
- The runtime is a **modular monolith + SQLite**, not multiple deployed services. Typed contracts and persisted outputs preserve separation without operational overhead.
- Scheduled refresh, change detection, alerts and event injection work while the local process runs. The exact engine incrementally recomputes changed conditional distributions and their descendants, preserving the unaffected joint law. Full-state aggregation, Monte Carlo and finite game search are still bounded full-instance operations; no distributed scaling claim is made.
- Legal references are context. The DPDP statutory ceiling is excluded from ALE. No determination of applicability, commencement or legal compliance is made.

## Repository boundary

Development is exclusively for **SamaCodes17/blackstar-prototype**, branch **prototype**. The team's repository is not connected. No push before the user's explicit first-push confirmation.
