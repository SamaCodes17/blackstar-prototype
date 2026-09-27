# Prototype verification

The calculation tests run with `npm test`; `npm run check` adds strict TypeScript checking and a production build. Development-only Prettier provides `npm run format` and `npm run format:check`.

## Automated coverage

- Known chain marginals and ALE; shared-ancestor diamond exact/approximate comparison.
- EPSS window conversion and probability boundaries.
- Independent recursive portfolio enumeration, zero/unlimited budget and SSE ties.
- QUBO penalty feasibility, zero-loss coefficients, approximation scoring and quantum probability normalization.
- Seeded Monte Carlo repeatability and a known mean interval fixture.
- All-portfolio joint normalization and monotone background control effects.
- Incremental/full inference equivalence, unaffected nodes and loss-only repricing.
- Domain/URL injection rejection, fixed collector allowlist and malformed edits.
- Offline collectors retain last-good evidence; live global feeds do not promote preview associations.
- Empty public-footprint fallback creates no invented service or vulnerability findings.
- Organization-scoped persistence and narrator grounding.

## Interactive checks performed

### Current executive revision

- Reference-inspired charcoal/lime identity and blended original logo checked in the browser. Disconnected seven-node assessments have no overlapping nodes and explicitly state that connections are not established.
- Shodan tests now cover exact hostname matching, CVE arrays, service observations without CVEs, missing version evidence, and access-denied handling. Total automated test count is now 28.
- A real key authenticated successfully with Shodan's account endpoint, but live search returned HTTP 403 requiring membership. Successful service ingestion is covered by fixtures; no live Shodan service findings are claimed for this account. The UI reports access blocked.

- Calculation, collector and persistence tests pass. Added financial reconciliation, zero-loss/zero-budget, and annual cost-versus-benefit cases.
- Browser checks at desktop and narrow mobile widths: one-page layout, no document-level horizontal overflow, and a deliberately scrollable attack map on mobile.
- Current/With plan changes real stored compromise probabilities; scenario and selected-system controls update the graph details.
- Zero-budget submission removes funded actions; changing the budget and period recomputes the financial comparison. Restored the sample to its original annual period and budget after checks.
- Real public-source refresh succeeds; certificate, FIRST, CISA and NVD status rows show actual last-check timestamps, while sample service findings stay illustrative. Outcomes depend on provider availability.
- Source details show certificate inventory and dated results without solver architecture. Automatic-refresh preference survives a reload.
- Board brief uses the same values as the dashboard and omits implementation details. The production bundle has no architecture walkthrough or browser source maps.
- Editing the business impact per record recalculates before/after financial loss; restoring the original input restores the figures. Cost-greater-than-benefit warning was checked on the small example-domain assessment. Browser console has no errors or warnings.

### Earlier research UI checks (historical)

- Desktop and narrow mobile dashboard layout; no document-level horizontal overflow.
- Displayed numeric-text provenance audit across main views.
- Live self-check executes all numerical checks and reports their actual results.
- Budget interaction at zero; reset restores the example portfolio.
- Real public-index refresh: EPSS, KEV and NVD returned live results; CT failures retained the dated verified snapshot.
- Domain URL rejected; a reserved `example.com` test assessment was created successfully through onboarding.
- Organization switching, preview event injection and history recomputation.
- Provenance modal, assumption controls, Plain/Expert views, and report navigation.

External feed success is time-dependent. Offline tests use injected adapters and perform no network requests. No Shodan key was configured, so keyed fingerprint correlation has not been tested against that service. The numerical model is verified against mathematical fixtures, not validated as a forecast of real institutional losses.

## Reproduce the UI number audit

In a browser developer console on the local app, the following read-only check lists visible numeric text without a provenance ancestor. Formula blocks and displayed input JSON are tagged at the enclosing block. Input values have visible adjacent assumption labels.

```js
const missing = [];
for (const element of document.querySelectorAll('body *')) {
  if (element.closest('script,style,option,title') || !element.getClientRects().length) continue;
  for (const text of element.childNodes) {
    if (
      text.nodeType === 3 &&
      /\d/.test(text.textContent || '') &&
      !element.closest('[data-provenance]')
    ) {
      missing.push(text.textContent.trim());
    }
  }
}
console.table(missing.filter(Boolean));
```


## 27 September 2026 — Public demo and admin boundary

- `npm run check`: 42 tests passed, TypeScript and production Vite build passed.
- New checks cover reserved fictional domains/IPs, collector refusal with zero outbound calls, stateless scenario isolation, historical count reconciliation, scrypt passwords, signed-cookie tampering/expiry, HTTP public/private reads, viewer creation/scan denial, origin checks, admin login/logout and fail-closed missing private storage.
- VCDB importer independently checked for category precedence, deduplication, preferential-source exclusion, victim identifier omission and downloaded archive SHA-256 match.
- Browser: public overview and three-company selector loaded without login; no Add organization control; Evidence displayed 4,623 selected incidents with provenance; zero-budget/90-day update produced zero funded actions and equal before/after loss; reset restored the baseline; switching ransomware to credential scenario changed the starting system and branching probabilities; pricing selected MSME in the enquiry form; unconfigured admin sign-in honestly displayed unavailable.
- Build includes no local database dependency. Existing SQLite is not imported. Runtime requires no historical-source network access in public mode.
- Not yet verified: actual managed PostgreSQL connection/schema persistence and TLS, Docker image startup (Docker unavailable), cloud deployment, backup/restore, production load or independent penetration testing. The test storage adapter is in-memory; it does not substitute for a PostgreSQL integration test.
- Email form prepares a `mailto` enquiry for review; no real email was sent during testing.
