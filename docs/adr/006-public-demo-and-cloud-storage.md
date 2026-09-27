# ADR 006: Fictional public demo, private admin assessments and managed storage

Date: 2026-09-27. Supersedes the local-only access/storage parts of ADRs 001–005.

## Decision and rationale

Keep TypeScript, React and Node. The same typed organization/output contracts serve the UI, exact risk model and API. The bounded engine already has independent mathematical checks. A language rewrite would add inconsistent models and deployment complexity without fixing the actual bottleneck: exponential full-joint inference. Python is used only for a reproducible offline VCDB aggregate import; there is no Python service or inference dependency.

Use one modular HTTP service, with pure `src/core` functions and focused React pages. Keeping the API and browser on one origin simplifies deployment and session/origin policy. This is a prototype modular monolith, not a claim that one process can support enterprise traffic. A worker queue and scalable approximate inference are future work when measurement justifies them.

### Public demo

Bundle three fictional organizations, `.example` domains and documentation-only IPs. Use deterministic code instead of Mockaroo: no account, randomness or accidental live target is needed. Visitors never choose arbitrary domains. Their numeric what-if edits are validated and calculated from a fresh fixture, and the browser carries cumulative edits during the current visit. No shared mutation, browser snapshot cache or database is needed. A new tab/reload/reset returns to the fixture. Keep graph, optimizer, assumptions, reports and guide functional.

### Admin boundary

Only a valid signed, expiring HttpOnly/SameSite cookie grants the admin role. The server checks every private read/export and every organization-creation/scan request. Hiding a button is not the security boundary. Missing credentials disable admin login. Scrypt password hashing, constant-time comparison, request-size limits, origin validation, bounded rate limits and secure cookies for HTTPS are implemented.

Admin access does not itself prove permission to assess a target. The exact domain must also be preapproved in server configuration after an out-of-band authorization check. Collection is disabled by default and requires a separate flag. Demo domains are rejected inside the collector as defense in depth. No scheduled refresh runs.

This is a **single-admin prototype**. Before real customer use: managed identity/MFA, per-user audit identity, tenant-scoped authorization, session revocation, distributed abuse controls, independent security review and operational monitoring are needed. The instance-local limiter deliberately ignores untrusted forwarding headers; proxy deployments should add provider-level limits.

### Persistence

Managed PostgreSQL replaces runtime SQLite. Organization, output and bounded history are atomically saved in one upsert; evidence is separately keyed by organization/source. JSONB preserves the existing typed document shape and avoids a needless schema rewrite during a fast-changing prototype. A pool of five connections bounds DB use. External database connections must use the provider's TLS requirements. The public demo can start without a database; private writes fail closed until a database is configured. Legacy SQLite is retained for recovery/reference, never auto-imported.

Docker contains the code, built assets and aggregate data, and runs as a non-root user. No laptop path, writable local database, local Python installation, external API key or runtime historical-data download is required. The only durable runtime state is in the managed database. A Render blueprint provisions the public web service; PostgreSQL is added separately when needed so a judge demo does not create an expiring database unnecessarily.

### Historical context, Layer 1.5

VCDB is selected because it provides structured, openly licensed public incident records. It is not uniformly anonymized and it is not the whole DBIR underlying dataset. DBIR also includes confidential partner records; raw VCDB frequencies must not be represented as DBIR statistics. PRC can be a future independently defined cross-check; no cross-validation claim is made here. Synthetic Kaggle records cannot demonstrate empirical learning, so they are not used for historical claims.

Only attributed aggregate VCDB counts are shipped. Known preferential selection tags, unconfirmed incidents, duplicate/missing IDs and incidents without external actors are excluded. Ransomware takes precedence, followed by phishing/stolen credentials, followed by other external incidents. The groups are disjoint, but still not representative population incidence.

Five pseudocounts per group produce a smoothed categorical frequency. Demo actor weights blend 25% of this frequency with 75% of the assumed starting weights, and use a matched two-digit sector only with at least 30 records. These smoothing/blending choices are **unvalidated design assumptions**, not learned calibration. They affect the real optimizer's attacker mixture but do not replace annual entry probabilities. Category-to-actor/entry mappings remain assumptions. This is a reproducible historical weighting baseline, not trained AI or a forecast-validation result.

## Verification and remaining external work

The build and API/security/math tests can run locally. PostgreSQL SQL, cloud TLS, provider deployment and Docker image startup still require actual provisioned infrastructure validation; Docker is not installed on this workstation. Do not call those integration checks complete. The public demo needs no database and was browser-tested locally. See `DEPLOYMENT.md` and `IMPLEMENTATION_STATUS.md`.
