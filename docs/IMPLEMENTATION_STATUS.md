# Three-layer implementation status

## Current assessment — 27 September 2026

**Working end-to-end demonstration, not a finished commercial platform.** A percentage would hide the difference between implemented calculations and externally validated/security-reviewed capabilities.

| Area                        | Implemented now                                                                                                                           | Remaining                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Public evaluator experience | Three fictional companies, no login, isolated assumptions/budgets, branching graph, optimizer, report, local guide, pricing/enquiry       | Public cloud launch and evaluation on hosted hardware                                                          |
| Layer 1: intake             | Generated inventory; retained collectors behind admin, exact-domain allowlist and deployment flag                                         | Verified internal topology, exhaustive discovery and mature evidence reconciliation                            |
| Layer 1.5: history          | Reproducible VCDB aggregate; 4,623 qualifying incidents; smoothed category weights affect demo optimizer                                  | Validated calibration, temporal holdouts, independent-source checks, automatic refresh and predictive training |
| Layer 2: risk               | Exact small-DAG inference, branching forced-breach propagation, Monte Carlo loss and sensitivity                                          | Cyclic/large enterprise graphs and real-world forecast validation                                              |
| Layer 3: investment         | Budget-constrained enumeration of 64 portfolios and attacker responses; calculations drive UI                                             | Enterprise-scale solver, validated control costs/effectiveness and performance                                 |
| Access                      | Backend-gated single admin, salted hash, expiring signed cookie, origin/rate checks; public cannot create/scan/read private organizations | SSO/MFA, per-user identities, tenant roles, session revocation and independent security review                 |
| Storage/deployment          | PostgreSQL adapter, atomic document/history writes, Docker and Render configuration; public demo needs no writable storage                | Managed DB provision, integration/backup-restore tests, Docker/cloud runtime verification, monitoring          |
| Commercial                  | Proposed Startup ₹4,999 / MSME ₹14,999 / Business ₹49,999 monthly INR; Enterprise enquiry to provided email                               | Validated packaging/cost model, contracts, billing, provisioning and SLA                                       |

The runtime does not load legacy SQLite or expose the old real-company fixture. No hosting account, managed database, paid subscription or first GitHub push has been created. Setup is in `DEPLOYMENT.md`.

The descriptions below refer to retained capabilities. In the public demo **all organization-specific data is fictional** and live collection is disabled. Historical incident aggregates are real source data and contain no victim identifiers.

## Layer 1 — Evidence intake: partial production integration

Certificate-transparency discovery, optional Shodan indexed-service matching, FIRST EPSS, CISA KEV and a bounded NVD lookup have executable collectors. Authenticated Shodan requests use server-side keys and endpoint-specific permissions; denied searches can fall back to host/InternetDB lookups. Missing credentials, denied access, unavailable feeds, retained snapshots and demonstration associations are not treated as live observations. Keys stay in the ignored local `.env`; the browser receives only a configured/not-configured boolean.

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
