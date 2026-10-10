# Codex task: demo mode QA

Run from repository root: `node artifacts/demo-mode-qa/check.mjs`.

Executes production storage initialization, demo seeding, boot, saveRecord,
analytics suppression and the extracted exit handler in a Node VM. Rendering
and backend dependencies are stubbed; backend init throws if reached in demo.
Normal-record and auth-session sentinel keys must remain unread and unchanged.
Demo entry seeds nine reports, saving creates the tenth, and a parameter-free
reload retains demo isolation. Exit clears the demo marker and the next load
reads the normal sentinel profile/record. Results: results.json.

This is logic verification, not browser or production network verification.
Headless Chrome probe aborted with SIGABRT (-6) before page load, with zero
stdout and empty stderr. A real browser network/storage trace remains pending.
Other page modules can call weather/sea and AI APIs; demo does not promise an
absence of all network traffic. Source inspection found no Supabase or track
calls in those auxiliary modules.
