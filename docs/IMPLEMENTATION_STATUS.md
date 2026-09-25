# Three-layer implementation status

## Layer 1 — Evidence intake: partial production integration

Certificate-transparency discovery, optional Shodan indexed-service matching, FIRST EPSS, CISA KEV and a bounded NVD lookup have executable collectors. Shodan requires a server-side key and search access. Missing credentials, denied access, unavailable feeds, retained snapshots and demonstration associations are not treated as live observations. Keys stay in the ignored local `.env`; the browser receives only a configured/not-configured boolean.

Shodan observations retain valid IP/port, product/version, provider observation time, retrieval time and indexed CVEs, matched to exact modeled hostnames. A version-backed indexed CVE can enter the risk model; a hostname or open port alone cannot establish a vulnerability. The model handles a bounded subset of assets, one selected CVE per asset, one Shodan search page and up to twenty retained service observations per asset. This is not exhaustive discovery or a vulnerability scan.

Automatic, verified internal dependency discovery is not implemented. Connections, vendor relationships and control effectiveness remain assumptions. MITRE/CERT-In references are context, not live frequency/advisory collectors. The full intake specification is therefore not complete.

## Layer 2 — Cascading risk: working bounded prototype

Exact joint inference on a small acyclic graph, incremental recomputation, seeded joint Monte Carlo, expected loss, tail threshold and sensitivity estimates are implemented and tested. Probabilities and rupee outputs are calculated, not typed into the dashboard. They remain model estimates because targeting, dependencies, record allocations and financial impact are uncalibrated assumptions.

## Layer 3 — Investment optimization: working bounded prototype

The engine enumerates up to sixty-four portfolios, enforces the budget, evaluates attacker best responses with explicit tie-breaking, and selects a plan. The recommendation and financial comparison genuinely change when inputs change. The attacker-response objective is distinct from background expected loss. This is not a general enterprise-scale mixed-strategy optimizer.

## Adjacent capabilities

The quantum path is a tested QUBO surrogate and circuit simulation, not quantum hardware. Economic contagion is an illustrative additive extension. The customer UI deliberately omits the architecture walkthrough and laboratory pages.

## What “genuine” means here

- **Observed:** dated responses actually retrieved from a named external source.
- **Calculated:** numerical results produced by the model, which can still depend on assumptions.
- **Assumed or illustrative:** costs, records, local targeting, dependencies, effectiveness and sample vulnerability associations unless independently supported.

Mathematical tests verify implementation consistency; they do not validate a real-world breach forecast. Screenshot labels from another prototype cannot establish that its displayed risk scores or confidence percentages were calculated.

Shodan endpoint requirements: https://developer.shodan.io/api
