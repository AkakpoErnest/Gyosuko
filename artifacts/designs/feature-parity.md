# Design must preserve existing app usage

User requirement, October 10: the redesign must keep the same features and usage as the actual app. Existing source behavior is authoritative; generated text and graphics are visual references only.

Use `02-supply-gap-aligned.png` instead of `02-supply-gap.png`. The aligned concept removes the invented processor Me tab, restores all five menu destinations, the scenario deadline, exact suggestion titles and local-demo history notes. Prompt saved alongside. Read source translations for descriptions: the generated first-option description incorrectly implies a purchase offer to a customer. The existing action asks another supplier for a quote. Do not copy generated descriptions.

| Existing processor feature | Source | Required design behavior |
|---|---|---|
| Overview, Supply plan, Decision review, Activity, Technical details | `app/index.html`, `src/app.js` VIEWS | Preserve all five destinations and existing hash routes. No processor Me/profile tab. |
| Overview plain-language summary, next steps, arrivals and coverage | `renderOverview`, `renderPlainSummary` | Retain information and links to supply/decision. |
| Supply range, arithmetic, supplier offers, verification toggle, percentile and provenance details | `renderSupply`, `toggleOffer` | Keep offered/verified distinction and all disclosures accessible. The decision screenshot is not a replacement for the supply screen. |
| Request another offer, wait for next landing update, discuss gap with buyer | `src/data.js` suggestions, `src/i18n.js` | Exact actions and existing explanations. No added automated messages or orders. |
| Select suggestion → approve/reject/hold → confirmation dialog → record | `renderDecision`, `requestDecision`, `recordDecision`, `renderDialog` | Disable decision buttons until selection; cancellation records nothing; confirmation records the local event. Preserve evidence and status stamps. |
| Activity history | `renderActivity`, `initialActivity` | Include time, suggestion, decision and evidence. Processor demo history resets on reload. |
| Synthetic scenario and unvalidated estimates | `src/data.js`, banner/meta/technical | Keep demo, source, timestamp and validation labels. Current deadline is October 9, 2026; it is historical synthetic data, not a current live order. |
| JA/EN, AI guide, motion pause/splash, reduced motion | existing modules | Preserve controls and accessible behavior in both languages. |

The fisherman app is a separate flow: role/profile, catch entry/review/save, Today, Sea and Me. Do not substitute processor navigation for its tabs. Auction mockup `01-auction-home.png` remains a proposed concept, not proof its features exist in the app. New roles, voice entry and backend import features require separate implementation; don't present them as already working.

Acceptance walkthrough for Claude: visit every existing section in both languages; toggle an offer; select each suggestion; cancel and confirm a decision; inspect Activity; reload to confirm reset; open all evidence details; check 360px/390px scrolling, keyboard focus, AI-guide access and reduced-motion/pause behavior. This document records a source audit; the redesign has not been implemented or browser-tested.
