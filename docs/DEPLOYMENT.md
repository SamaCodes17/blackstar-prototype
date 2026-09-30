# Deploy BlackStar without a laptop dependency

The repository is ready for a provider-hosted Node/Docker service. **No public deployment or managed database has been created yet.** The current preview remains localhost. The first GitHub push requires the owner's explicit confirmation.

## 1. Personal GitHub setup

Use only `SamaCodes17/blackstar-prototype`, branch `prototype`. Do not authorize the team repository. Authenticate the personal account through GitHub's normal sign-in/device flow; do not paste a token into chat. Verify the authenticated account and exact repository, review `PUSH_REVIEW.md`, then obtain first-push confirmation. Local commit authorship is not proof of the authenticated GitHub account.

## 2. Public demo on Vercel

Vercel serves the Vite build from `dist` and routes `/api/*` to `api/[...path].ts`. That entry point uses the same API handler as the local/Docker server, with no Vite server or listening socket inside the function. The public demo needs no database. No Vercel deployment has been verified yet.

1. Sign in to Vercel and import only `SamaCodes17/blackstar-prototype`. Use `prototype` as the production branch, the Vite preset, Node 24, build command `npm run build`, and output directory `dist`.
2. Keep live collection disabled (`ENABLE_LIVE_COLLECTION=false`). Do not upload `.env`, Shodan credentials, local data, or admin credentials for the public demo.
3. Vercel's system variables supply the production and deployment origins. Ensure system environment variables are exposed. If using a custom domain, set `PUBLIC_ORIGIN` to its exact HTTPS origin and redeploy. Request headers cannot add trusted origins.
4. Deploy and check `/api/health`, all three demo organizations, POST scenario/plan updates, report export and currency changes. Confirm private organizations return 404 and unauthenticated organization creation/scan returns 403. Set production deployment access so evaluators can open the public demo without Vercel authentication.
5. Share the production HTTPS URL shown by Vercel. The laptop is no longer involved. An actual cloud build and these checks must succeed before calling the deployment complete.

Function duration is capped at 60 seconds. Rate limits and update locks are per instance, not distributed; this configuration is for the bounded public demo. Private production workloads still need managed PostgreSQL, distributed coordination/rate limits and load testing. Hosting usage and plan eligibility must be checked in the owner's Vercel account before selecting a plan.

References: https://vercel.com/docs/frameworks/frontend/vite and https://vercel.com/docs/functions/runtimes/node-js.

## Alternative: Public demo on Render

1. Create/sign into https://dashboard.render.com/ with your chosen account. You complete password entry, verification and account terms.
2. Grant the GitHub integration access to **only the personal prototype repository**. Review the permission screen before accepting it.
3. Create a Blueprint from this repository's `prototype` branch, or a Docker Web Service with root `Dockerfile`. The blueprint is `render.yaml`. Use the free web-service option for initial evaluation, with automatic deploys off.
4. Set `HOST=0.0.0.0`, `ENABLE_LIVE_COLLECTION=false`, and `PUBLIC_ORIGIN` to the exact HTTPS URL assigned by Render, without a trailing slash. If the final service URL is not known at creation, update this variable before the service is shared. Do not copy your local `.env`, Shodan key or database file.
5. Build and deploy. Verify `/api/health`, all three fictional organizations, plan recalculation, graph branching and pricing. From a signed-out browser, verify that `/api/state?org=srmist-example` and `/api/export?org=srmist-example` return 404, and POST organization creation/scan returns 403.
6. Share the HTTPS address with judges. No login is required. Shut down the laptop to verify there is no workstation dependency.

Render's free service can sleep after 15 minutes of inactivity and take about a minute to restart. For a scheduled demo, open it ahead of time; an always-on paid service is optional and requires a separate spending decision. Current policy: https://render.com/docs/free. No paid resources have been ordered.

## 3. Managed PostgreSQL for private assessments

Public fictional exploration does not need a database. Add managed PostgreSQL when you need to save private admin assessments:

1. Create Render Postgres in the same region as the app (or another managed PostgreSQL provider). Review the price, backup policy and retention before committing. Render's free Postgres expires after 30 days and lacks backups; it is not durable long-term storage.
2. Put the provider's connection URL in the service's secret `DATABASE_URL` environment variable. Use the internal connection within Render; for external hosts use the provider's required TLS configuration, preferably verified certificates. Never commit or share the URL.
3. On startup, the app creates `blackstar_assessments` and `blackstar_evidence`. Use an application-specific database/user. Before production, move schema creation to a migration role with least privilege and test backups/restores.
4. Configure a unique `SESSION_SECRET` of at least 32 characters and `ADMIN_PASSWORD_HASH`. `scripts/admin-password.mjs` consumes a 16–256 character password on stdin and prints a salted scrypt hash; do not place the password in command-line arguments/history. Keep the original password in your password manager, and store only its hash in the provider environment.
5. Restart and use Admin sign in. Public visitors still see only fictional organizations. Add real domains to `ADMIN_APPROVED_DOMAINS` only after independently verifying permission. Enabling `ENABLE_LIVE_COLLECTION=true` is a separate admin deployment decision; keep it false for the judge demo.
6. Verify a private assessment survives a service restart and remains inaccessible signed out. This managed-database integration test is **not yet performed**. Test TLS, backup restore and role restrictions before storing customer data.

Official provider docs: https://render.com/docs/blueprint-spec and https://render.com/docs/postgresql-creating-connecting.

## Provider-neutral Docker option

```sh
docker build -t blackstar .
docker run --rm -p 4173:4173 -e PUBLIC_ORIGIN=http://localhost:4173 blackstar
```

This packages the runtime and public fixtures. For private persistence inject the managed `DATABASE_URL` and admin variables as deployment secrets. No volume or local SQLite is needed. Docker commands have not been executed on this workstation because Docker is unavailable.

## Operations limits

The exact engine is bounded to 12 acyclic nodes and six controls, with seven-node demonstration networks. The current service computes synchronously and has instance-local limits. It needs load testing, a bounded job queue, stronger identity, monitoring and independent security review before multi-user commercial deployment. Proposed pricing is not a capacity/SLA commitment.
