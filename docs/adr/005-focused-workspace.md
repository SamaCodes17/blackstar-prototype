# ADR 005: Focused executive workspace and local assessment guide

The customer interface now uses five addressable hash routes: Overview, Evidence, Attack paths, Investment and Board brief. Browser back/forward works without adding a routing dependency. The existing organization-scoped API, persistence and calculation contracts remain unchanged.

The original BlackStar violet-and-ink design takes broad visual inspiration from the supplied SentinelOne reference, without copying its assets, branding or text. The supplied logo is blended using CSS. The overview is a decision summary; detailed evidence, scenario exploration and budget controls belong on dedicated pages. Deeper sensitivity, contagion and experimental comparisons use expandable sections rather than additional primary navigation.

Each page has its own component under `src/ui/workspace`. Existing evidence, graph, investment and report components are reused. No dependencies were added.

Ask BlackStar is a bounded local explainer, explicitly labeled in the UI. It uses current assessment values and known topic explanations, provides relevant page links and declines unsupported questions. It sends no chat text to an external provider, has no API-key access and clears its conversation when the organization changes. It is not a general-purpose LLM. Tests cover numerical grounding, source configuration versus access, disconnected graphs and unsupported requests.

Financial results remain modeled estimates. No UI styling promotes assumed business inputs, hypothetical connections or preview CVE associations into live findings. Public methodology/architecture pages are not added to customer navigation.
