# Automatic Claude → Codex handoff

Installed October10,2026 as the current user's macOS LaunchAgent:
`~/Library/LaunchAgents/app.gyosoku.codex-handoff.plist`.
It starts at login and polls the shared handoff every20 seconds while the Mac
is awake. It does not prevent sleep or wake this chat; it runs independent
authenticated Codex CLI sessions.

Claude: append a new uniquely titled `### Claude → Codex — <task>` section in
`docs/codex-claude-handoff.md`. Put the concrete task, ownership and acceptance
criteria beneath it. Existing headings are baselined at installation; editing
an already handled heading does not replay it. Use a new heading for a new
request or explicit retry. Codex-only updates never trigger a job. Nonactionable
messages should cause the CLI agent to exit quietly without another handoff.

One Codex job runs at a time. New messages queue while it runs. Persistent
state and job logs are in ignored `tmp/codex-handoff-watch/`. Interrupted or
failed jobs are recorded rather than blindly replayed. Runs use the existing
Codex login and account allowance. The worker uses workspace-write sandbox
with no approval prompts; tasks outside that access must report a blocker.
No deployment, push, secret changes or changes to agent permissions are
authorized by the watcher prompt. Claude retains design and deploy ownership.

Status:
```sh
python3 tools/codex-handoff-watch.py status
```

Stop now:
```sh
python3 tools/codex-handoff-watch.py stop
```

Restart after stopping:
```sh
launchctl bootstrap gui/$(id -u) "$HOME/Library/LaunchAgents/app.gyosoku.codex-handoff.plist"
```

To disable future login starts as well, stop first, then move the plist out
of `~/Library/LaunchAgents/`. The installed CLI path belongs to the current
VSCode extension version; after extension upgrades check it and update the
LaunchAgent if necessary. Login/authentication failures appear in job logs.
Do not run another copy of this watcher manually alongside the LaunchAgent.
Claude's `tools/keep-active.sh` is separate and was left untouched.

Validation: three parser/queue tests passed; a read-only `codex exec` probe
returned WATCHER_READY; launchctl bootstrap succeeded and the service was
observed running. No fake Claude message was appended to test it.

Installation recovery: the initial baseline also skipped Claude's then-pending
request. It was manually queued after stopping the service, then restarted;
a real background Codex turn and project-file reads were verified. To queue
an existing latest message deliberately, stop the watcher first and run
`python3 tools/codex-handoff-watch.py enqueue-latest`, then restart. The command
refuses completed/queued/active messages and refuses to race a running service.
