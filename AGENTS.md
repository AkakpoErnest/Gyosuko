# Gyosoku — agent handoff (Claude ⇄ Codex)

> **Canonical coordination file: [docs/codex-claude-handoff.md](docs/codex-claude-handoff.md).** Ownership: Codex = `src/backend.js`, `supabase/`; Claude = `src/fisherman.*`, `fisherman/`, landing page. This file is background and task list only.

Shared notes between coding agents. **Read this first. Append to the Log at the bottom when you finish a chunk of work.** Keep entries short and factual. Do not rewrite another agent's entries.

## Project

Bilingual (JA/EN) web app, installable on phones (PWA), linking fishermen's expected catches to seafood processors' orders. Pilot: Kesennuma. Plain HTML/CSS/JS, no framework, no bundler (`build.mjs` copies to `dist/`). Node ≥ 18. Run: `PORT=3000 node server.mjs`.

Direction (decided by the user): **real data, not demo.** Open sign-up, role picker on entry (fisherman / captain / processor / other), fishermen enter their own details, Supabase as managed backend, forecast derived from fisherman entries only (labelled unvalidated), public/online data later via an ingest job.

## Layout

| Path | What |
|---|---|
| `index.html`, `src/home.js`, `src/home.css` | Landing page |
| `fisherman/index.html`, `src/fisherman.js`, `src/fisherman.css` | Mobile app: onboarding, profile, catch reports, 7-day arrivals board |
| `app/`, `src/app.js`, `src/data.js`, `src/i18n.js`, `src/styles.css` | Processor workspace (still **synthetic** `data.js`) |
| `src/backend.js` | Supabase client over `fetch` (magic-link auth, profiles, catch reports). Inert unless `public/config.json` has `supabaseUrl` + `supabaseAnonKey` |
| `supabase/schema.sql` | Tables + RLS + `expected_landings()` aggregate (needs ≥ 3 reporters) |
| `docs/plan.md` | Original demo plan (partly superseded) |
| `docs/manus-design-brief.md` | Brief the user gives to Manus for visual designs |
| `server.mjs`, `netlify.toml` | Static server / hosting; both set a strict CSP |

## Rules

- No frameworks or CDN scripts. CSP is `script-src 'self'`; any backend origin must be added to `connect-src` in **both** `server.mjs` and `netlify.toml`.
- Never render user input with `innerHTML`. Use the `el()` helper pattern.
- Every user-visible string needs JA and EN.
- Respect `prefers-reduced-motion`. Tap targets ≥ 48px on mobile.
- Never show individual fishermen's rows to processors; only aggregates (RLS + `expected_landings`).
- Never present estimates as a validated forecast.
- Don't invent data-source endpoints. Ask the user which public sources to use.

## Status (2026-10-09)

Done, unverified in browser unless noted below: backend client, schema, fisherman app rewrite (role → auth → details → today/add/review/saved/me), landing button text "Open app".

## Open tasks

1. ~~Browser-test fisherman flow~~ Done in EN at 390px (Chrome headless via puppeteer-core): welcome → role → details → today → add → review → saved → me all work. **Still untested: JA, 360px, tablet, Supabase-connected path (magic link, sync).**
2. Supabase: user must create a project and provide URL + anon key → `public/config.json`; add its origin to CSP in `server.mjs` and `netlify.toml`.
3. Processor workspace (`src/app.js`) still reads `src/data.js`. Replace with real orders/stock (tables exist) and the `expected_landings` aggregate; add CSV import for orders/stock.
4. Ingest job for public/online data into `external_series` (service role). Source list pending from user.
5. Restyle `src/fisherman.css` to match the landing page brand (paper `#F5F3EE`, navy `#152A3C`, teal, amber; serif display) once Manus designs arrive. Current CSS is dark-navy/orange and off-brand.
6. Landing copy still says "demo / synthetic" — update when real data is live.
7. Update the project video (location unknown; ask the user).
8. `public/config.json`, `manifest.webmanifest` icons and `build.mjs`: confirm they exist and `npm run build` works.

## Log

- **Claude, 2026-10-09:** Added `supabase/schema.sql`, `src/backend.js`; rewrote `src/fisherman.js` and `.css`; renamed landing "Open demo" → "Open app"; wrote `docs/manus-design-brief.md`. Only syntax-checked so far.

- **Claude, 2026-10-09 (later):** Browser-tested fisherman flow in EN. Fixed strict-CSP bug: inline `style=""` attributes are blocked, so `el()` now sets `style` via `style.cssText` (CSSOM). Fixed hero sun overlapping headline and orange stubs on zero-kg bars. Added this file for Codex handoff.

- **Codex, 2026-10-09:** Read Claude’s status and inspected the latest frontend files. Separate coordination lives in `docs/codex-claude-handoff.md` (backend: Codex; frontend: Claude). Please reply there with browser-test results and deployment readiness. No code or deployment changed during this status check.

- **Codex, 2026-10-09 (Markdown audit):** Read all six project Markdown files and Claude’s acknowledgment. Recorded outdated README/plan details, design-vs-live distinctions, test gaps, and received backend requests in the canonical handoff. No code or deployment changed.

- **Claude, 2026-10-09 (update 2):** Deployed to production twice (local-only mode). Processor Overview got a plain-language summary + next steps (EN/JA); JA line-breaking and label fixes in the fisherman app. Full details in `docs/codex-claude-handoff.md`.

- **Codex, 2026-10-09 (fish animation):** Added homepage scroll-driven fish, touch/keyboard splash and section waves in `src/harbor-motion.*`; respects reduced motion. Published and checked live hooks/assets. Interaction checks passed; visual phone review pending. Details in canonical handoff.

- **Codex, 2026-10-09 (realistic fish):** Replaced flat SVG fish with a realistic transparent fish asset; added water-first content entrances to every homepage section. Published and verified; desktop JA visual check and interaction/reduced-motion tests passed. Offline cache deduplicated and updated.

- **Codex, 2026-10-09 (Blender 3D):** Built editable Blender fish + GLB, self-hosted interactive Three.js underwater scene. Published and verified assets; desktop rendering/keyboard rotation checked. Physical-phone touch/performance review pending. Details in canonical handoff.

- **Codex, 2026-10-09 (restore/board):** User preferred illustrated fish; restored it with section entrances. Added and published `/predictions/`, local-only JA/EN catch estimates/confidence and actual comparison. Interaction/build/live-asset checks passed. Preserved latest Claude deployment. Shared backend and phone QA pending; canonical handoff has details.

- **Codex, 2026-10-09 (realistic image restored):** User clarified earlier lifelike image preference. Restored cutout fish in harbor scene; scroll/section animations retained, no 3D. Build/live assets verified; cache v13. Latest Claude changes preserved.

- **Codex, 2026-10-09 (animated guide):** User's animated logo GIF now serves as guide avatar on landing, processor and fisherman pages. Reduced-motion static fallback. Guide behavior unchanged; production assets/hooks verified. Details in canonical handoff.

- **Codex, 2026-10-09 (TraceSource details):** Added JA/EN details card inside fisherman app linking directly to user's HarborPulse URL. Opens new tab; no data transfer. Build, DOM checks and live assets/hooks verified. Core app unchanged.

- **Codex, 2026-10-09 (partners):** Added homepage partners: TraceSource, cKash, KesenMemento with supplied/local logos and HarborPulse link. Responsive JA/EN section published; build/assets/live hooks verified.

- **Codex, 2026-10-09 (market photo):** Added user's fish-market photo to main website before partners, bilingual responsive section. Original image preserved; build/live assets verified.

- **Codex, 2026-10-09 (photo removed):** User rejected market photo as not Gyosoku. Removed homepage photo section/style hook and precache entries; live removal verified, partners retained.

- **Codex, 2026-10-09 (mobile fish sizing):** Replaced 140px side-by-side mobile scene with full-width stacked layout. Larger caption/button, reduced motion retained. Published; build/live CSS verified.

- **Codex, 2026-10-09 (reliability):** Published catch save/retry/load/delete safety fixes, session refresh/loss handling, sign-in access from Me, JA/shared language for prediction board. 9 backend tests + DOM flows/build/live assets pass. Cloud tested with mocks; real Supabase configuration/testing remains pending. See canonical handoff.

- **Codex, 2026-10-09 (live public data / trial):** Published Today wind/rain/offshore-wave forecasts via Open-Meteo/DWD and `/field-test/` tasks/local anonymous feedback export. Live provider/API, unit DOM, build/assets verified. Real fishermen usability testing remains to be done; commercial data licensing noted in handoff.

- **Codex, 2026-10-09 (Claude coordination):** Read Claude's test freeze/requests; committed reliability/public-data/trial work f8b9abe, added Me feedback link and offline feedback paths. 12 tests + DOM/build pass. Manual browser interrupted; new feedback hooks remain unpublished for Claude QA. Full handoff updated.

- **Codex, 2026-10-10 (processor animation):** Claude completed interactive 3D/hero; Codex added/published processor harbor motion, wave/pause controls, card/chart entrances and hover effects. JA browser pause/layout and DOM/build/live checks passed. Scenario values unchanged; phone QA pending.
