# Gyosoku — implementation and design plan

## Product and boundaries

Build an interactive, bilingual web prototype that demonstrates the operational workflow for a seafood processor: create/review an order, compare it with confirmed stock and uncertain expected landings, identify a possible gap, review explainable next-step suggestions, and record a human decision. The app is a demonstration, not a production service. Use only synthetic local data and browser-local interaction state. No live government, market, supplier, or TraceSource integration; no login, server-side API, or database. TraceSource may be described as an existing collaborator (user-stated), but never as a connected data source. The Kesennuma City proposal is being prepared to explore feasibility; published aggregate statistics are not evidence of live operational data access.

No action may be submitted to an external service. The interface demonstrates how a human would review and approve/reject a proposal; orders, messages, substitutions, and schedule changes are never executed automatically.

## Demonstration flow

Use one consistent, clearly marked synthetic Skipjack example throughout:

- Order: 5,000 kg due Friday, October 9 (demo scenario).
- Confirmed stock: 1,100 kg.
- Illustrative landing outlook by the deadline: P10 2,500 kg, P50 3,150 kg, P90 3,800 kg. With stock, these yield total potential coverage of 3,600 / 4,250 / 4,900 kg and a median possible gap of 750 kg.
- A supplier offer may be shown separately as offered/unconfirmed and is never added to confirmed coverage until a human records it as verified.
- Suggested responses: request another offer, wait for an update, or discuss the gap with the buyer. Selecting one records a local demo event only.

The exact displayed values and times are static synthetic scenario inputs, not a model output or a forecast. Show their source as “Synthetic demo scenario,” an illustrative timestamp, and the unvalidated status.

## Core screens and behavior

1. **Overview:** active order, confirmed stock, forecast range, possible gap, next deadline, and a compact upcoming-arrivals timeline.
2. **Supply plan:** order requirements alongside stock, offers, forecast range, data source, freshness, and an expandable “How this estimate is formed” explanation. Define P10/P50/P90 in plain language. Show a traceable arithmetic breakdown: confirmed stock + illustrative expected landings = possible coverage; order need − possible coverage = potential gap.
3. **Decision review:** a shortage card showing the gap and its inputs, the suggested options, reason/evidence, and explicit Approve / Reject / Review controls. Require an explicit human choice before a suggestion moves to the local activity history.
4. **Activity:** local demo history of the recommendation, evidence, user choice, and displayed time. Explain that this history resets when the demo page is reloaded.
5. **Technical details:** compact, accessible panel for synthetic input provenance, timestamp/data-freshness label, forecast percentiles and their meaning, calculation trace, validation status, and integration state (all not connected). Be useful to technical reviewers without making the primary workflow jargon-heavy.

Add English/Japanese toggle, translated navigation, labels, notices, actions, empty states, and demo content. Include a short “Demo vs. pilot” panel explaining that a pilot would require permissions, data agreements, operational feed validation, and forecast calibration. Clearly state: “Demo data only. Forecast accuracy has not been validated. Human approval required.”

## Design direction

- **Design movement:** contemporary Japanese maritime operations editorial, expressed as a polished, understated control room rather than a generic admin template.
- **Core principles:** legibility first; calm confidence; evidence adjacent to decisions; complexity available on demand.
- **Color philosophy:** deep harbor navy for trust and structure, warm paper-white for readability, sea-glass teal for confirmed/healthy signals, and restrained amber for uncertainty or review. Never use color alone to encode state.
- **Layout paradigm:** a compact persistent navigation rail and a generous task workspace; on wide screens an adjacent “signal” panel keeps provenance and uncertainty beside the decision. Collapse to a single-column mobile flow.
- **Signature elements:** P10–P50–P90 forecast ribbon; small provenance/freshness chips; a distinct human-review stamp on proposed actions.
- **Interaction philosophy:** direct, low-friction actions; important decisions require a deliberate confirmation step; technical detail is expandable rather than imposed on every user.
- **Animation:** brief, subtle fades and state transitions only; respect reduced-motion preferences; no decorative looping motion.
- **Typography system:** sturdy sans-serif for UI headings and numerals, with an accessible Japanese sans-serif fallback. Use consistent tabular numerals for quantities; readable compact labels.
- **Brand essence:** “A clearer next move when fish supply is uncertain” — practical, transparent, collaborative.
- **Brand voice:** concise and evidence-led. Example: “750 kg may be uncovered. Review the estimate before choosing.” / “見込み不足は750 kg。予測を確認してから対応を選んでください。”
- **Wordmark & logo:** compact Gyosoku wordmark paired with a simple fish-and-signal mark made from CSS or inline SVG; no photographic hero art.
- **Signature brand color:** harbor teal, reserved for verified availability and key brand accents.

## Implementation approach and project structure

The initialized project is an empty flexible Web project in `/home/ubuntu/gyosoku`, with runtime port 3000 and server/database capabilities disabled. Implement a dependency-free static single-page prototype with semantic HTML, CSS, vanilla JavaScript modules, and inline SVG for the forecast/range visualization. Serve it through a small Node.js standard-library static server on `0.0.0.0:3000`; use no external APIs or credentials. Keep visible status and evidence driven by one structured synthetic scenario object so the example stays consistent across screens and languages.

- `server.mjs` — minimal static server on the configured port; no business-data endpoints.
- `index.html` — semantic app shell, navigation, language control, and page containers.
- `src/data.js` — synthetic sample order, stock, offer, forecast range, provenance, and local demo activity.
- `src/i18n.js` — English/Japanese UI strings and language selection.
- `src/app.js` — client-side navigation, calculations, review/approval/rejection state, and activity rendering.
- `src/styles.css` — responsive visual system, status treatments, typography, reduced-motion support.
- `public/manus-routes.json` — route declaration for the prototype’s actual browser page route(s).
- `README.md` — prototype behavior, synthetic-data boundary, and what a pilot would need.

No database or server capability is required for the prototype; no live provider credentials or persistent customer data are in scope. The initial handoff is a working Preview link, not a public production deployment. Public publication is a separate step that requires an explicit request.
