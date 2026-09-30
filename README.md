# BLACKSTAR

**Quantify · Predict · Optimize**

BlackStar helps business leaders explore cyber risk and decide where to invest in protection. It connects a possible attack to its business impact, then compares security choices within a budget.

This repository contains the working public-demo prototype. It is designed for founders, executives and evaluators—not only cybersecurity specialists.

## Try the demo

**[Open the live BlackStar demo](https://blackstar-prototype.vercel.app/)**

Hosted on Vercel. Open the link on any device; no local installation is needed.

The demo opens without a login. Choose one of three fictional organizations:

| Organization | Demo profile |
| --- | --- |
| Northstar Works | A growing business |
| Orbit Labs | A small startup |
| Meridian Financial | A larger financial organization |

No real organization is scanned in the public demo. Visitors can explore scenarios, but cannot add organizations or run live scans. Changes apply to their current exploration rather than overwriting shared company data.

## A five-minute walkthrough

1. **Overview:** choose a company and review its estimated exposure and recommended next step.
2. **Evidence:** see the sources and assumptions behind the assessment.
3. **Attack paths:** select a starting breach and explore how its effects branch through connected assets.
4. **Investment:** adjust the budget and compare protection options and modeled outcomes.
5. **Board brief:** review and print a summary for a business decision.

Use **Ask BlackStar** for explanations of the current page and assessment. It is a built-in guide, not a general-purpose AI chatbot. **Pricing** shows proposed plans and an enterprise enquiry option; no payment or subscription is taken.

## What the numbers mean

BlackStar calculates risk estimates, attack propagation and portfolio comparisons from the selected inputs. **Calculated does not mean observed or guaranteed.**

| Information | What it represents |
| --- | --- |
| Demo companies, assets and connections | Fictional examples for exploration |
| Historical incident patterns | Attributed aggregates from the VERIS Community Database |
| Financial losses and risk reductions | Model estimates based on evidence and assumptions |
| Budgets and protection costs | Editable planning inputs, not supplier quotations |
| Exchange rates | Dated reference conversions, with a labeled saved-rate fallback |

Historical patterns inform scenario weights; the prototype is not a trained predictor of an individual company's next attack. The graph shows modeled dependencies, and its replay is illustrative—not a forecast of attack timing.

Display currencies: **INR, USD, EUR, GBP, AED, SGD, JPY, AUD, CAD and CHF**. Currency changes affect presentation, not the underlying investment calculation.

## Prototype status

**Available now:** three demo organizations, branching attack scenarios, budget-based investment comparisons, source explanations, a contextual guide, printable board briefs and currency switching.

**Still to validate or build:** production-scale workloads, independently calibrated forecasts, customer accounts and tenant isolation, enterprise identity controls, and operational monitoring. Private live assessments require separate administrator configuration and managed storage.

See the [implementation status](docs/IMPLEMENTATION_STATUS.md) for the detailed scope. This is a decision-support prototype, not a production security monitoring service.

## Run locally

Requires **Node.js 22.13 or later**; Node.js 24 is recommended.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:4173**. The fictional demo needs no API key, database or login.

```sh
npm run check   # tests, type checking and production build
npm run build
npm start       # serve the production build locally
```

## Developer documentation

The app uses **React and TypeScript**, a shared **Node.js API and calculation engine**, and **Vite** for the frontend build. The public demo requires no persistent database; private assessments use managed PostgreSQL when configured.

- [Deployment guide](docs/DEPLOYMENT.md) — Vercel and Docker/Render setup
- [Architecture decisions](docs/adr/006-public-demo-and-cloud-storage.md) — technology choices and public/private boundaries
- [Data sources and attribution](fixtures/README.md) — fictional fixtures and historical incident aggregates
- [Technical reference](docs/TECHNICAL_REFERENCE.md) — model assumptions, calculations and limitations
- [Verification](docs/VERIFICATION.md) — validation approach

Development takes place on the `prototype` branch of this personal repository. Do not commit credentials or local environment files.

## Contact

For feedback, pilot discussions or enterprise requirements: **[projectblackstar57@gmail.com](mailto:projectblackstar57@gmail.com)**.
