# BLACKSTAR

A working local prototype for passive cyber-risk quantification and security investment planning. Built for the personal development repository **SamaCodes17/blackstar-prototype**, on branch **prototype**.

## Run

Use **Node.js 22.13+ (24 LTS recommended)**. Node 20 cannot run the built-in SQLite module.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. The example is available immediately without keys or internet. On this Windows workstation, `./scripts/start-local.ps1` can use the already-installed compatible bundled Node runtime. It does not install or change system software.

```sh
npm run check      # numerical/security tests, TypeScript check, production build
npm run build
npm start          # serve built assets using the same local API
```

Optional settings are documented in `.env.example`. Copy it to `.env` for optional third-party keys. `.env`, SQLite databases, logs and browser test artifacts are excluded from Git.

## Architecture

```text
Public third-party indexes ─► evidence collectors ─► organization-scoped SQLite snapshots
                                                      │
                         Layer 2: exact Bayesian inference + joint Monte Carlo
                                                      │
                         Layer 3: finite Stackelberg portfolio enumeration
                                  ├─ pairwise QUBO surrogate
                                  ├─ simulated annealing
                                  └─ QAOA state-vector circuit simulation
                                                      │
                          persisted Output contract ─► React reporting / export
```

- `src/core/`: pure numerical model, solver, sources and shared contracts.
- `server/`: one local HTTP entry point, input validation, passive collectors, SQLite persistence and scheduler.
- `src/ui/`: React views and custom SVG graphs. No charting framework or microservices required.
- `fixtures/ct-srmist.json`: public CT snapshot with original source and retrieval timestamp.
- `tests/`: repeatable model and safety checks.
- `docs/adr/`: architecture decisions and their tradeoffs.

The same API serves Vite during development and the compiled application in production mode. SQLite transactions persist the organization, computed output and history together. There is no frontend secret or credential store.

## What works

- Authorized domain onboarding with passive certificate discovery; cached fallback and explicit unavailable states.
- Verified example hostnames from Cert Spotter; separate preview CVE associations and a hypothetical supplier node.
- Optional Shodan service/version evidence, NVD lookup, live FIRST EPSS and CISA KEV refresh.
- Exact inference on the bounded acyclic graph; Monte Carlo loss distribution, tail percentile, mean confidence interval and separate parameter sensitivity bands.
- Finite portfolio enumeration, adaptive attacker paths, defender-favorable ties, severity-first baseline and standalone control ROSI.
- Real QUBO construction with budget slack, exact surrogate enumeration, seeded simulated annealing and a small complex-amplitude QAOA simulator.
- Computed preview economic contagion, editable assumptions, sensitivity chart, Plain/Expert lenses, provenance dialogs, guided tour and interactive architecture explorer.
- Scheduled refresh while the local service runs, change history, threshold alerts and preview event injection.
- Live numerical self-check, board report print view, organization-scoped JSON evidence export and browser snapshot fallback.

## Honesty and methodology

Every quantitative display uses one of **CITED**, **ASSUMED**, **COMPUTED**, or **PREVIEW**. A computed result can depend on preview inputs. Source status is not a finding about the assessed organization.

Certificate evidence demonstrates issuance of a certificate containing a name. It does **not** establish an active service, a dependency, a vendor relationship or a vulnerability. In the example, only names are observed; CVE associations and supplier relationships are preview scenarios. The default size and cost-per-record values are assumptions, not claimed institutional facts.

EPSS is a global thirty-day exploitation signal. The model uses `1 - (1 - p30)^(days/30)` under stationarity and multiplies by an assumed local targeting factor. No-CVE nodes have editable annual baselines. Edge activation is `weight × (1 - exp(-days/mean_wait))`. These transformations have not been calibrated to institution-specific incidents.

Full-joint enumeration preserves shared-ancestor dependence. The familiar marginal noisy-OR forward pass can be wrong on DAGs with shared ancestors; it is shown only as a comparison. Exact ALE uses `sum(P(v) × V(v))`. Loss allocations are disjoint equivalent records, not repeated copies of the same dataset. Monte Carlo produces joint loss outcomes; its confidence interval is distinct from the outcome percentile and from the assumption sensitivity band.

The game is an explicitly finite, pure-defense Stackelberg scenario. For each defender portfolio, attacker types choose entry/path/target by expected target utility. Among equal attacker utilities, the lower defender loss is selected. Defender loss includes the successful route and subsequent downstream compromise, weighted by an assumed attack opportunity and normalized type priors. **This game objective is distinct from background Bayesian ALE.** The UI reports both. Enumeration is exact for this finite specified game, not for every possible real attack or mixed-strategy game.

The QUBO is a second-order surrogate of the game objective, not an exact reduction of dependent Bayesian cascades. Prices/budgets are integer ₹25,000 units. A slack-bit penalty enforces the budget. QAOA uses an actual shallow state-vector circuit with a deterministic parameter search and feasible modal postselection. Quality is `exact game loss / candidate game loss`; larger is better, with one meaning optimum. There is **no quantum hardware, speedup or advantage claim**.

## Limits and scale path

- Small local prototype, not an authenticated multi-tenant service. It deliberately refuses non-loopback binding. Organization scoping prevents accidental mixing; it is not an authorization boundary against another local OS user.
- Modeled graph selection is bounded to seven assets by intake; the exact engine rejects more than twelve. The larger certificate inventory is retained, capped and explicitly non-exhaustive. CT results can be paginated. This is not a complete asset-discovery product.
- No fingerprint key means no real vulnerability correlation. Preview data never becomes a verified institution finding merely because its global EPSS score refreshes.
- Graph dependencies, loss allocations, targeting, control effectiveness, prices and attacker priors remain assumptions. MITRE ATT&CK does not supply population-level attacker frequencies.
- The stored parameter band explores four leading uncertain parameters with uniform draws; it is not a full uncertainty posterior or an empirically validated interval.
- The scheduler runs only while this process runs. The exact engine recomputes changed conditional distributions and their descendants while reusing the unaffected joint law. Joint-state aggregation, Monte Carlo and game search still traverse the bounded full instance. This is not a distributed inference engine.
- The contagion extension is an additive preview transmission model. No MCA/BSE/NSE corporate network has been ingested and there is no causal stock-price model.
- Scaling needs authenticated tenancy, a durable job queue, incremental inference, cyclic-graph handling and larger mixed-integer/sampling solvers. See the decision records.

## Security and Git workflow

Collectors only request fixed allowlisted public index hosts over HTTPS, reject redirects, limit response sizes and use timeouts. Domains are validated and encoded as index query parameters; no target probing occurs. Mutations require same-origin JSON requests, the server validates the Host header, and API keys stay on the server. The optional Shodan key is used only for its service-index request and never persisted or returned.

The sole configured Git remote must remain `https://github.com/SamaCodes17/blackstar-prototype.git`. Development stays on `prototype`. There is no automatic push or deployment workflow. Verify the authenticated account and exact remote, review the commits, and obtain the user's confirmation **before the first push**. Never force-push or push directly to `main` without explicit authorization. See `docs/GITHUB_HANDOFF.md`.
