# Gyosoku architecture: what exists, and what must be done to use it for real

Status as of 9 October 2026. Focus: Kesennuma City, Miyagi.

## 1. What Gyosoku does

Fishermen and captains tell the system what they expect to land (fish, quantity, port, arrival time, how certain). Kesennuma seafood processors see, in aggregate, whether supply will cover their orders and spot a gap early. People decide; the system never orders or sends anything by itself.

## 2. The pieces

```
 Phone / desktop browser
 ┌──────────────────────────────────────────────────────────────┐
 │  Landing page        Fisherman app (PWA)     Processor app   │
 │  /                   /fisherman/             /app/           │
 │                      Predictions board /predictions/         │
 │                                                              │
 │  Gyosoku AI guide (icon on every page)                       │
 │  Service worker (offline shell) · local storage (own data)   │
 └───────┬───────────────────────┬──────────────────────┬───────┘
         │ static files          │ POST /api/guide      │ REST + Auth (not connected yet)
         ▼                       ▼                      ▼
   Netlify CDN          Netlify Function         Supabase (to be created)
   gyosoku.netlify.app  guide.mjs                ├─ Auth (email magic link)
                        │                        ├─ Postgres + row-level security
                        │ OPENAI_API_KEY         ├─ expected_landings() aggregate
                        ▼ (server-only secret)   └─ external_series (public data)
                     OpenAI API                            ▲
                                                           │ scheduled ingest (to be built)
                                              Public / market / partner sources (to be chosen)
```

| Piece | Where | State |
|---|---|---|
| Landing page, fisherman app, processor app, predictions | `index.html`, `fisherman/`, `app/`, `predictions/`, `src/` | **Live**, no framework, no build step beyond copying files |
| Hosting | Netlify (`netlify.toml`, `build.mjs` copies to `dist/`) | **Live** |
| Offline and install | `sw.js`, `manifest.webmanifest` | **Live**; shell works offline, data stays on the phone |
| AI guide | `src/guide-*.js`, `netlify/functions/guide.mjs` | **Live**; OpenAI key stored as a Netlify secret; sends only the question text |
| Backend client | `src/backend.js` | **Written, not connected** (needs a Supabase project) |
| Database and access rules | `supabase/schema.sql` | **Written, never run** |
| Processor data | `src/data.js` | **Still made-up numbers** (one skipjack order) |
| Public data ingest | none | **Not built** |

## 3. How data flows today and when connected

**Today (local-only mode).** A fisherman's profile, photo and catch entries are saved in their own browser (`localStorage`). Nobody else can see them, including you. The Today chart is built from that phone only.

**When Supabase is connected.**
1. Person opens the app, picks a role, chooses to sign in (email link, no password) or use it locally.
2. Profile (role, name, vessel, home port, method, species, capacity) is saved to `profiles`. The photo and phone number stay out of the shared tables where possible.
3. Each catch estimate is saved to `catch_reports` and is readable only by its owner (row-level security).
4. Processors never read individual rows. They call `expected_landings(species, until)`, which returns totals only when **3 or more different people** have reported.
5. Processors enter orders and confirmed stock (`orders`, `stock`), private to their own account. The processor app compares need against stock plus the aggregate and shows the gap, with a human approving any action.
6. A scheduled job writes public series (landings, prices, weather) into `external_series`, which any signed-in user can read.

## 4. What must be done, in order

### A. To run the fisherman test tomorrow (nothing to build)
- Share `https://gyosoku.netlify.app/fisherman/` or the QR code. Works offline on a phone once opened once.
- Collect feedback through the form on the **Me** tab and in conversation. Entries stay on each phone, so you cannot see them centrally yet.
- Phone export: Me tab, "Export my data", if you want a copy of someone's entries.

### B. To use it for real across several people (about 1–2 days)
1. Create a Supabase project (region Tokyo). Run `supabase/schema.sql`.
2. Turn on email sign-in; add `https://gyosoku.netlify.app` as the allowed redirect URL.
3. Put the project URL and anon key into `public/config.json`; add the Supabase origin to `connect-src` in both `netlify.toml` and `server.mjs`.
4. Codex's open backend requests: distinguish failure types (offline, session expired, invalid, server), a real "session lost" signal, accept a client-made id on insert so offline entries can be uploaded safely later, and confirm the access rules by testing with two accounts.
5. In the app: upload entries made before sign-in, show honest "saved on this device / synced" status.
6. Defend the 3-reporter privacy rule: with open sign-up one person can create three accounts. Options: require confirmed email plus rate limits, raise the threshold, or invite-only for the pilot (recommended for Kesennuma).

### C. To make the processor side real (about 1 week)
1. Replace `src/data.js` with orders and stock from Supabase; build entry screens plus CSV import.
2. Show the supply outlook from `expected_landings`, clearly labelled as reported estimates, not a validated forecast.
3. Remove "sample data" labels only after this is real.
4. Decisions (approve, reject, hold) saved with who and when.

### D. Outside data (needs your decisions)
- Decide the sources (fisheries statistics, market prices, ocean and weather data). I will not guess endpoints.
- Build a scheduled function that fetches them and writes `external_series`, using the service key kept only on the server.
- Treat TraceSource as a partner: confirm with them whether an API or data-sharing agreement exists before any connection.

### E. Before a wider launch
- **Privacy and consent:** a short privacy notice in Japanese (what is stored, who sees aggregates, how to delete). Deletion and export already exist on the Me tab; add server-side delete.
- **AI guide:** add a daily spending cap in the OpenAI dashboard; move the in-memory rate limit to something durable; decide whether the AI may ever see app data (today it never does).
- **Security:** keep secrets only in Netlify and Supabase settings; rotate the OpenAI key that was shared in chat; keep the strict content-security policy; never put the Supabase service key in `public/`.
- **Reliability:** error tracking, a backup of the database, and a tested way to roll back a deploy.
- **Forecast honesty:** the predictions board and outlook stay labelled as estimates until compared with real landings over time. A real model needs historical landing data (a separate project).
- **Real-phone testing:** iPhone Safari and Android Chrome, slow signal, one-handed use with wet hands, text size at 200%.
- **Language review:** have a native Japanese speaker check the wording.

## 5. Risks to be aware of

| Risk | Why it matters | Mitigation |
|---|---|---|
| Few reporters | Totals stay hidden below 3 people, so the processor sees nothing early on | Start with a named pilot group; invite-only sign-up |
| Gaming or false entries | Open sign-up | Invite-only pilot, confirmed email, flag outliers |
| Over-trust in estimates | A shortfall call could cost money | Keep "not a validated forecast" labelling; human decides |
| AI misuse and cost | Public endpoint that spends money | Rate limit, spending cap, no personal data sent |
| Connectivity at ports | Weak signal | Offline shell and local saving already in place; add sync queue |
| Single points of failure | One Netlify site, one Supabase project | Backups; document recovery |

## 6. Who does what

| Area | Owner |
|---|---|
| Screens, copy, Japanese and English, visuals, AI guide, deploys | Claude |
| `src/backend.js`, `supabase/`, access rules, backend tests | Codex |
| Supabase project, data sources, partner agreements, real orders and stock, privacy notice | You |
| Visual design direction | Manus (brief in `docs/manus-design-brief.md`) |

Coordination file: `docs/codex-claude-handoff.md`.

## 7. Decisions needed from you

1. Pilot group: invite-only fishermen and one or two processors, or open?
2. Which public data sources, and is there a TraceSource data agreement?
3. Who creates and owns the Supabase project (the account that will pay and hold the data)?
4. Does Kesennuma City need data held in Japan, and is a sign-off needed before real names are stored?
