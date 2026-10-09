# Gyosoku: next steps for Claude and Codex

Updated October 9, 2026 (Japan time).

This is a concise working brief. The [canonical handoff](codex-claude-handoff.md)
contains the full history and latest coordination. Read it before editing.

## Goal

Prepare the mobile app for fishermen to try at Kesennuma, collect their feedback,
and improve it using actual observations. Public weather data is connected;
shared catch storage still needs Supabase configuration and verification.

## Current status

- Website: https://gyosoku.netlify.app/
- Fisherman app: https://gyosoku.netlify.app/fisherman/
- Shared feedback collector: https://gyosoku.netlify.app/feedback/
- Local trial checklist and feedback export: https://gyosoku.netlify.app/field-test/
- Public conditions endpoint: https://gyosoku.netlify.app/api/conditions
- Codex implementation commit: `f8b9abe`.
- Backend/conditions tests: 12 passed. DOM reliability checks and build passed.
- Real fishermen have not yet tested the app in the checks recorded by Codex.
- The new Me-screen feedback link and feedback precache changes are committed
  but were not published by Codex; manual browser verification remains pending.

## Task split

| Owner | Work |
| --- | --- |
| Codex | Backend, session reliability, catch-save retries, public-data functions, schema and privacy checks |
| Claude | Phone layout, onboarding usability, feedback screens, manual browser flow and frontend copy |
| Together | Review feedback, choose the next improvements, check the full app before publishing |

Announce shared-file edits in the canonical handoff and preserve the other
contributor's work. This file is a request for coordination, not proof that
Claude has read or accepted it.

## Claude: next actions

1. Check the phone layout at 360px and 390px in Japanese and English.
2. Test onboarding → Today → add catch → review → save → edit.
3. Test browser Back confirmation and AI form filling without automatic saving.
4. Test Me → expand feedback → open `/feedback/`.
5. Check offline reload. Feedback can be submitted only when online; failure
   must not be presented as a successful submission.
6. Clarify the old local Me feedback form: its “Send” label currently describes
   a local save. Distinguish it from the shared feedback collector.
7. After these checks, publish a coherent build with the guide, feedback and
   conditions Netlify functions. Record the deploy and results in the handoff.

Keep the fisherman flow stable before the planned field test. Leave the new
auction-role flow for a separately verified update.

## Codex: next backend actions

1. Once a Supabase project is provided, configure the public URL and anon key.
2. Verify sign-in, profile storage, save/update/delete and retries with real accounts.
3. Verify row-level security using two accounts; keep individual catch reports private.
4. Verify aggregate access and the minimum-three-reporters rule.
5. Connect the processor workspace to real orders and stock; synthetic inputs
   must remain clearly identified until replaced.

Do not commit service-role keys or provider secrets.

## Public data already connected

The Today screen shows a three-day Kesennuma outlook from Open-Meteo:
maximum wind speed, total rainfall and maximum offshore significant wave height.
The wave grid is a reference point, not the harbor interior. Source links,
retrieval time and missing/offline labels are shown. These are model forecasts,
not catch predictions or sailing instructions.

No fisherman profile or catch data is sent to the weather provider. The free
endpoint is for noncommercial evaluation; commercial operation needs a licensed
plan or another suitable source. The function supports `OPEN_METEO_API_KEY`
through Netlify environment configuration.

## Field-test questions

Ask fishermen to enter a catch estimate, find and edit it, and inspect the
public outlook. Watch where they need help. Ask whether they would use the app
for work and what they would change.

Use `/feedback/` for shared responses. `/field-test/` stores responses only on
the current device and offers a JSON download. Neither route is evidence of
usability until actual fishermen have tried it.

## Checks

```sh
node --test tests/*.test.mjs
npm run build
PORT=3000 node server.mjs
```

Automated checks do not replace a manual phone/browser test or real-account
cloud verification. Report what was actually tested and any remaining gaps.
