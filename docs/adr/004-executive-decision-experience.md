# Executive decision experience

The primary audience is an executive deciding what to fund. The original research-oriented navigation made that decision hard to find. The revised application has one overview with in-page links to the decision, attack graph and live source list, plus a printable board brief.

`src/ui/executive/` contains the customer components. `App.tsx` handles organization selection, persistence and dialogs. The old page modules remain as development reference and are not imported by the customer entry point. The numerical engines and SQLite contracts are unchanged. No new dependencies are required.

`decisionSummary` performs presentation arithmetic over stored results. Before/after loss comes from the risk engine, selected spend comes from the portfolio, and reduction is their difference relative to baseline. A zero baseline produces zero reduction. Annual plans whose spend exceeds modeled loss avoided are explicitly flagged. Shorter periods retain annual control pricing and do not imply an annual return comparison.

The recommendation still minimizes modeled adaptive attacker loss, not background ALE. The interface describes that distinction without publishing solver details. It never claims that the illustrated routes are observed attacks. Node values use the same topological ordering as stored risk probabilities.

Source states are taken from actual collector records. Missing, unavailable, saved, illustrative and live data have distinct labels. Live means successfully retrieved at the displayed last check, not continuously streaming or proof of an organizational vulnerability. Example associations stay illustrative after global feed refresh. Offline snapshots do not display live feed counts.

Architecture, solver comparisons and raw provenance trees belong in internal documentation, not customer navigation. Business assumptions remain reviewable because an executive needs them to assess the decision. Disabling browser source maps removes an unnecessary development artifact from the production build; it is not an access-control boundary.
