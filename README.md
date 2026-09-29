# BLACKSTAR

A public-demo-ready prototype for cyber-risk quantification and security investment planning, with a private admin boundary for approved live assessments. Built for the personal development repository **SamaCodes17/blackstar-prototype**, on branch **prototype**.

## Run

Use **Node.js 22.13+ (24 LTS recommended)**. The deployed runtime does not use SQLite or require a local database.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:4173. Three fictional organizations are available immediately without keys, login, a database or outbound collection. On this Windows workstation, `./scripts/start-local.ps1` can use the already-installed compatible bundled Node runtime. It does not install or change system software.

```sh
npm run check      # numerical/security tests, TypeScript check, production build
npm run build
npm start          # serve built assets using the same local API
```

Optional deployment settings are in `.env.example`. The public demo needs none. Private organizations require `DATABASE_URL` (managed PostgreSQL), `ADMIN_PASSWORD_HASH` and `SESSION_SECRET`. Real collection additionally requires an exact `ADMIN_APPROVED_DOMAINS` allowlist and `ENABLE_LIVE_COLLECTION=true`. A viewer checkbox never grants access. API keys remain server-side. Existing SQLite files are preserved but no longer loaded.

Start with [deployment setup](docs/DEPLOYMENT.md), [architecture rationale](docs/adr/006-public-demo-and-cloud-storage.md), [dataset provenance](fixtures/README.md) and [implementation status](docs/IMPLEMENTATION_STATUS.md).

## Architecture

```text
Fictional organizations + pinned VCDB aggregates → isolated viewer what-if calculations
                                                        │
Admin session + preapproved domain → passive collectors → managed PostgreSQL
                                                        │
                      Shared TypeScript risk / propagation / optimization engine
                                                        │
                      React executive pages + graph + guide + board brief + pricing
```

- `src/core/`: pure numerical model, solver, historical weighting and contracts.
- `server/`: same-origin HTTP API, admin sessions, public demo policy, collectors and PostgreSQL adapter.
- `src/ui/`: React views and SVG graphs; no additional router or chart framework.
- `fixtures/vcdb-aggregate.json`: attributed historical aggregate without victim identifiers.
- `scripts/import_vcdb.py`: optional offline dataset preparation; Python is not a runtime dependency.
- `tests/`: numerical, collector, storage-contract, session and HTTP authorization checks.
- `docs/adr/`: architecture decisions and limitations.

Public changes are stateless, validated numeric scenarios. They never overwrite shared fixtures or saved admin data. Private state is returned only to authenticated admins. PostgreSQL stores the organization, output and bounded event history in one atomic statement. There is no browser snapshot fallback to old real-company data. Docker packages all runtime files, and the app writes no local data files.

## What works

The experience has six focused pages: Overview, Evidence, Attack paths, Investment, Board brief and Pricing. Visitors can explore three fictional businesses, change numerical assumptions and budgets, select a starting breach, inspect branching effects, compare protections, ask the bounded local guide and print a board summary. Pricing presents proposed pilot plans and opens an email enquiry for review; it does not sell a subscription.

Evidence distinguishes generated company data from 4,623 qualifying VCDB incident records. A documented, smoothed historical category mixture contributes 25% of demo attacker weights; the rest is assumed. This is not a trained predictive model.

Admins can sign in once configured. Private organization creation requires PostgreSQL and a preapproved exact domain. Explicit admin refreshes use the existing CT/Shodan/InternetDB/EPSS/KEV/NVD integrations. No background scanning runs. A missing database or credential fails closed.

The previous research pages remain in `src/ui/pages/` for development reference and are not routed in the customer app. Architecture rationale remains in repo documentation.

## Honesty and methodology

The data contract retains **CITED**, **ASSUMED**, **COMPUTED**, and **PREVIEW** provenance. The executive UI uses plain-language estimate notices and source statuses instead of repeating technical badges on every figure. Financial totals, reduction, and graph probabilities are calculated; many inputs are assumed or illustrative. Computation does not make them empirically validated forecasts. Source status is not a finding about the assessed organization. The brief explicitly flags annual plans whose cost exceeds modeled loss avoided.

Certificate evidence demonstrates issuance of a certificate containing a name. It does **not** establish an active service, a dependency, a vendor relationship or a vulnerability. In the public demo, no organization-specific names or services are observed; all are fictional. The default size and cost-per-record values are assumptions, not claimed institutional facts.

EPSS is a global thirty-day exploitation signal. The model uses `1 - (1 - p30)^(days/30)` under stationarity and multiplies by an assumed local targeting factor. No-CVE nodes have editable annual baselines. Edge activation is `weight × (1 - exp(-days/mean_wait))`. These transformations have not been calibrated to institution-specific incidents.

Full-joint enumeration preserves shared-ancestor dependence. The familiar marginal noisy-OR forward pass can be wrong on DAGs with shared ancestors; it is shown only as a comparison. Exact ALE uses `sum(P(v) × V(v))`. Loss allocations are disjoint equivalent records, not repeated copies of the same dataset. Monte Carlo produces joint loss outcomes; its confidence interval is distinct from the outcome percentile and from the assumption sensitivity band.

The game is an explicitly finite, pure-defense Stackelberg scenario. For each defender portfolio, attacker types choose entry/path/target by expected target utility. Among equal attacker utilities, the lower defender loss is selected. Defender loss includes the successful route and subsequent downstream compromise, weighted by an assumed attack opportunity and normalized type priors. **This game objective is distinct from background Bayesian ALE.** The executive UI reports background expected loss before/after the selected plan and explains that the plan prioritizes modeled attacker choices; it does not claim to minimize background ALE or guarantee financial savings. Enumeration is exact for this finite specified game, not for every possible real attack or mixed-strategy game.

The QUBO is a second-order surrogate of the game objective, not an exact reduction of dependent Bayesian cascades. Prices/budgets are integer ₹25,000 units. A slack-bit penalty enforces the budget. QAOA uses an actual shallow state-vector circuit with a deterministic parameter search and feasible modal postselection. Quality is `exact game loss / candidate game loss`; larger is better, with one meaning optimum. There is **no quantum hardware, speedup or advantage claim**.

## Limits and scale path

- Public/private authorization is implemented for a single admin role. Customer accounts, tenant isolation, SSO/MFA and enterprise access management remain future work.
- Modeled graph selection is bounded to seven assets by intake; the exact engine rejects more than twelve. The larger certificate inventory is retained, capped and explicitly non-exhaustive. CT results can be paginated. This is not a complete asset-discovery product.
- No fingerprint key means no real vulnerability correlation. Preview data never becomes a verified institution finding merely because its global EPSS score refreshes.
- Graph dependencies, loss allocations, targeting, control effectiveness and prices remain assumptions; demo attacker weights blend assumed and historical category frequencies. MITRE ATT&CK does not supply population-level attacker frequencies.
- The stored parameter band explores four leading uncertain parameters with uniform draws; it is not a full uncertainty posterior or an empirically validated interval.
- Background collection is disabled. The exact engine recomputes changed conditional distributions and their descendants while reusing the unaffected joint law. Joint-state aggregation, Monte Carlo and game search still traverse the bounded full instance. This is not a distributed inference engine.
- The contagion extension is an additive preview transmission model. No MCA/BSE/NSE corporate network has been ingested and there is no causal stock-price model.
- Scaling needs authenticated tenancy, a durable job queue, incremental inference, cyclic-graph handling and larger mixed-integer/sampling solvers. See the decision records.

## Security and Git workflow

Collectors only request fixed allowlisted public index hosts over HTTPS, reject redirects, limit response sizes and use timeouts. Domains are validated and encoded as index query parameters; no target probing occurs. Mutations require same-origin JSON requests, the server validates the Host header, and API keys stay on the server. The optional Shodan key is used only for its service-index request and never persisted or returned.

The sole configured Git remote must remain `https://github.com/SamaCodes17/blackstar-prototype.git`. Development stays on `prototype`. There is no automatic push or deployment workflow. Verify the authenticated account and exact remote, review the commits, and obtain the user's confirmation **before the first push**. Never force-push or push directly to `main` without explicit authorization. See `docs/GITHUB_HANDOFF.md`.

## Current interface

The executive workspace has separate Overview, Evidence, Attack paths, Investment, Board brief and Pricing pages. Deeper analyses are expandable within the relevant page. Ask BlackStar is a local topic-based explainer grounded in the current assessment, not an external AI integration. See [the workspace decision](docs/adr/005-focused-workspace.md).

## Attack propagation and free-access Shodan path

On Attack paths, selecting a node forces its compromise and calculates all downstream effects using the existing exact model. Replay is a visual sequence of graph hops, not a calibrated timeline. The model currently supports directed acyclic graphs. Incoming protection cannot prevent a starting breach that is already assumed; edge protections can reduce subsequent spread. Missing relationships are not inferred from hostnames. The illustrative network and connection sandbox are explicitly hypothetical and do not modify saved assessments.

The collector now tries filtered Shodan search, then bounded public-DNS-to-IP lookups when access is denied. Restricted host lookups fall back to [Shodan InternetDB](https://internetdb.shodan.io/), which returns fewer details and is refreshed weekly. InternetDB needs no API key and is free for non-commercial use; commercial use requires Shodan's applicable license. Individual services retain their provider, retrieval time, match basis and supplied observation time. DNS associations can point to shared infrastructure, so IP-level CVEs are not treated as confirmed hostname vulnerabilities. [Shodan host API](https://developer.shodan.io/api) and [Google DNS API](https://developers.google.com/speed/public-dns/docs/doh/json) document the underlying endpoints.

## Display currency and contact

Project contact: **projectblackstar57@gmail.com**. Pricing enquiries use this address.

The header currency selector converts displayed financial values, pricing, graph/chart labels, business inputs, board briefs and the local guide. Only the currency preference is saved in the browser; assessment data remains isolated. The risk engine, API and optimizer keep INR as the canonical unit so a display switch cannot change portfolio selection. Control prices retain the existing INR 25,000 grid, presented as converted choices.

Rates come from [Frankfurter v2](https://frankfurter.dev/) through a fixed server endpoint. Successful responses are cached for one hour, requests time out after five seconds, and failures use a dated bundled/last-good snapshot. The UI identifies saved rates and the quote date. These are indicative conversions, not guaranteed billing or executable market rates. No company or assessment information is sent to the exchange-rate provider. Available currencies follow the validated rate dataset and the shared product availability policy in `src/core/currency.ts`. Only INR, USD, EUR, GBP, AED, SGD, JPY, AUD, CAD and CHF are available in both saved and refreshed rates at the project owner's request; any previously saved unsupported preference resets to INR. Currency availability is not a legal determination about trade or individual transactions.
