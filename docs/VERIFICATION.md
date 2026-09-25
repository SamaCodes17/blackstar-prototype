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

- All 26 calculation, collector and persistence tests pass. Added financial reconciliation, zero-loss/zero-budget, and annual cost-versus-benefit cases.
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
