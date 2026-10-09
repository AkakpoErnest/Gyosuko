# Gyosoku — Supply-gap decision demo

Gyosoku (魚測) is a bilingual (English / Japanese) static web prototype for a seafood processor. It walks through one operational question: **can this order be covered?**

- An **order** is compared with **confirmed stock** and an **uncertain outlook of expected landings**.
- The difference is shown as a **possible gap**, with the arithmetic traced on screen.
- The app proposes **explainable next-step suggestions**, each with its evidence.
- A human **approves, rejects, or marks for review**; the choice is **recorded locally** in an activity history.

The tagline: *a clearer next move when fish supply is uncertain.*

## Hard boundaries

This is a demonstration, not a production service.

- **Synthetic data only.** Every number is a static scenario input in `src/data.js`, labelled "Synthetic demo scenario". Nothing is a model output or a forecast; forecast accuracy has not been validated.
- **Browser-local state.** Interaction state (language, offer verification, decisions, activity) lives in the page. There is no login, API, or database.
- **No live integrations.** No government, market, supplier, or TraceSource connection. TraceSource is a collaborator in the project, not a data source for this demo.
- **Kesennuma City proposal** is being prepared to explore feasibility. Published aggregate statistics are not evidence of live operational data access.
- **Nothing is executed automatically.** Orders, messages, substitutions, and schedule changes are never sent anywhere. The interface shows how a human would review a proposal.

## Demo scenario

One consistent Skipjack example is used across every screen and both languages.

| Item | Value |
| --- | --- |
| Order | 5,000 kg skipjack, due Friday 9 October |
| Confirmed stock | 1,100 kg |
| Illustrative landings by deadline (P10 / P50 / P90) | 2,500 / 3,150 / 3,800 kg |
| Possible coverage (stock + landings) | 3,600 / 4,250 / 4,900 kg |
| Potential gap (need − coverage) | 1,400 / **750** / 100 kg |
| Supplier offer | 600 kg, offered / unconfirmed |

The offer is shown separately and is never added to coverage until a human marks it verified. Even then it stays visibly distinct from the forecast.

## Run it

Requires Node.js 18 or later. No dependencies to install.

```sh
node server.mjs          # or: npm start
# open http://127.0.0.1:3000
```

Environment variables:

| Variable | Default | Notes |
| --- | --- | --- |
| `HOST` | `127.0.0.1` | Localhost only. Cloud sandboxes / preview proxies can set `HOST=0.0.0.0`. |
| `PORT` | `3000` | Listening port. |

The public homepage is at `/`; the interactive app is at `/app/`.
Both support English and Japanese. App views are selected by URL hash: `#overview`, `#supply`, `#decision`, `#activity`, `#technical`.

## Deploy to Netlify

Run `npm run build` to generate the website in `dist/`. The included
`netlify.toml` sets the build command, publish directory, and security headers.
For a Git-connected Netlify project, select `feat/gyosoku-prototype` as the
production branch. For a manual deployment, run
`netlify deploy --dir=dist --no-build --prod` after linking the Netlify project.

The hosted website uses the same synthetic demo data and browser-local
interactions as the local prototype.

## Project files

The website also supports home-screen installation as a Progressive Web App.
On Android or desktop Chrome, use the browser install command or the app's
Install app button when available. On iPhone/iPad, open in Safari and choose
Share → Add to Home Screen. The demo shell works offline after an initial
online visit; remote fonts may fall back to system fonts. Activity and offer
changes still reset on reload. This does not include App Store distribution.

The AI cover is at `public/gyosoku-cover.png` and is used for link previews.

| Path | Purpose |
| --- | --- |
| `server.mjs` | Static file server, Node standard library only. No business endpoints. |
| `index.html` | Semantic app shell: navigation rail, language toggle, view containers. |
| `src/data.js` | The synthetic scenario object and the `computeCoverage()` arithmetic. |
| `src/i18n.js` | English / Japanese strings, `t()`, language persistence, number and date formatting. |
| `src/app.js` | Hash routing, rendering, offer verification, decision confirm dialog, activity history. |
| `src/styles.css` | Visual system: harbor navy, paper white, teal and amber signals; reduced-motion support. |
| `public/manus-routes.json` | Route declaration for the prototype's single browser route and its hash views. |
| `docs/plan.md` | Product, design, and implementation plan. |

## Security notes

The server is deliberately small and conservative.

- **Localhost bind** by default (`127.0.0.1`), so the demo is not exposed on the network unless `HOST` is set explicitly.
- **Path traversal guard.** The URL path is decoded, resolved against the repo root, and refused (403) if it resolves outside it. Any path segment starting with `.` (such as `.git`) returns 404.
- **Extension allowlist.** Only `html js mjs css json svg png ico webmanifest txt md` are served; anything else is 404. Only `GET` and `HEAD` are accepted (405 otherwise).
- **Headers.** `X-Content-Type-Options: nosniff`, `Cache-Control: no-store`, and a strict Content Security Policy: `default-src 'self'`, scripts from self only, `connect-src 'self'` (for offline app caching), `frame-ancestors 'none'`, fonts allowed from Google Fonts.
- **Zero dependencies.** Nothing in `node_modules`; the server imports only `node:http`, `node:fs/promises`, `node:path`, `node:url`.
- Errors return generic messages and never include filesystem paths.

## Demo vs. pilot

A pilot with a real processor would require, at minimum:

1. **Permissions** from each party to use their operational data.
2. **Data agreements** covering landings, stock, offers, and buyer orders, including retention and access.
3. **Operational feed validation** so that stock, arrivals, and offers reflect what is actually happening.
4. **Forecast calibration** against historical landings before any percentile is shown as more than illustrative.

Until then every value is a demo input and every suggestion requires explicit human approval.

## Activity history

The activity view records each decision (time, suggestion, decision, evidence, gap) in memory. **Reloading the page resets it.** Nothing is persisted and nothing is transmitted.

## Fisherman interview trial

Open `/fisherman/` for a simple mobile trial, with Japanese as the default
language and an English toggle. A nickname signs into a browser-local demo
session; this is not authentication or a real account. Catch entries and
interview feedback are saved in this browser's local storage. They can be
exported as JSON or cleared in Feedback & help. No entries are sent anywhere.
The installed app now starts at the fisherman trial; the processor demo
remains at `/app/`.
