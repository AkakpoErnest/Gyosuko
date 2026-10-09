#!/usr/bin/env bash
# keep-active.sh: keeps this Mac awake and watches the shared Markdown files so Claude and Codex keep passing work to each other.
#
#   tools/keep-active.sh              watch + notify (safe default). Mac stays awake while it runs.
#   tools/keep-active.sh --run        also start Claude headlessly when it is Claude's turn (edits files only; never deploys).
#   tools/keep-active.sh --once       check once, print what it would do, exit (good for testing).
#   options: --interval 60  seconds between checks   --max 12  most automatic Claude runs per session
#
# Turn logic: the LAST "### " heading in docs/codex-claude-handoff.md says who spoke last.
#   "### Codex → Claude ..."  -> it is Claude's turn.     "### Claude → Codex ..." -> it is Codex's turn.
# Codex is not startable from here (no CLI), so for Codex's turn the script notifies you and prints the line to paste.
# Stop with Ctrl-C. Log: tmp/keep-active.log

set -u
cd "$(dirname "$0")/.." || exit 1
RUN=0; ONCE=0; INTERVAL=60; MAX=12
while [ $# -gt 0 ]; do case "$1" in --run) RUN=1;; --once) ONCE=1;; --interval) INTERVAL="${2:-60}"; shift;; --max) MAX="${2:-12}"; shift;; *) echo "unknown option $1"; exit 2;; esac; shift; done

HANDOFF="docs/codex-claude-handoff.md"; TASKS="docs/codex-tasks-now.md"; LOG="tmp/keep-active.log"; mkdir -p tmp
log() { printf '%s  %s\n' "$(date '+%F %T')" "$*" | tee -a "$LOG"; }
notify() { osascript -e "display notification \"$2\" with title \"$1\" sound name \"Glass\"" >/dev/null 2>&1; printf '\a'; }
sig() { stat -f '%m' "$HANDOFF" "$TASKS" 2>/dev/null | tr '\n' ':'; }
last_heading() { grep -E '^### ' "$HANDOFF" | tail -1; }
whose_turn() { case "$(last_heading)" in *"Codex → Claude"*) echo claude;; *"Claude → Codex"*) echo codex;; *) echo none;; esac; }
claude_bin() { for c in "$(command -v claude 2>/dev/null)" "$HOME"/.nvm/versions/node/*/bin/claude "$HOME/.claude/local/claude" /opt/homebrew/bin/claude; do [ -x "$c" ] && { echo "$c"; return; }; done; }

CLAUDE_PROMPT="You are Claude on the Gyosoku project (cwd = repo). Read docs/codex-tasks-now.md and the end of docs/codex-claude-handoff.md. Codex just reported. Apply Codex's must-fix findings that touch files you own (index.html, src/fisherman.js, src/home.*, flyer), run 'node --test tests' and the browser checks you already know, and append a '### Claude → Codex' note describing what you did. Do NOT deploy, do NOT git push, do NOT touch secrets. If nothing is actionable, append a short '### Claude → Codex' note saying so."
CODEX_PASTE="Read docs/codex-tasks-now.md, then the end of docs/codex-claude-handoff.md. Do the next unfinished task in section A, and report in the handoff file as '### Codex → Claude'. Do not deploy; do not edit Claude's design files."

runs=0; prev=""; handled=""
log "keep-active started (run=$RUN once=$ONCE interval=${INTERVAL}s max=$MAX)"
# stay awake as long as this script lives (-i idle, -m disk, -s system on AC, -d display)
caffeinate -dims -w $$ &

while true; do
  now="$(sig)"; turn="$(whose_turn)"; head="$(last_heading)"
  if [ "$now" != "$prev" ] || [ "$ONCE" = 1 ]; then
    log "files changed or checked; last note: ${head:-none}; turn: $turn"
    key="$head"
    if [ "$key" != "$handled" ] || [ "$ONCE" = 1 ]; then
      case "$turn" in
        claude)
          if [ "$RUN" = 1 ] && [ "$runs" -lt "$MAX" ] && [ "$ONCE" = 0 ]; then
            CB="$(claude_bin)"
            if [ -n "$CB" ]; then
              log "starting Claude headlessly (run $((runs+1))/$MAX)"; notify "Gyosoku" "Claude is starting on Codex's report"
              "$CB" -p "$CLAUDE_PROMPT" --permission-mode acceptEdits >>"$LOG" 2>&1 && log "Claude run finished" || log "Claude run failed (see log)"
              runs=$((runs+1)); handled="$(last_heading)"
            else log "claude CLI not found; open Claude Code and say: continue"; notify "Gyosoku" "Your turn, Claude: open Claude Code and say continue"; handled="$key"; fi
          else log "[dry] would start Claude now (use --run to enable)"; notify "Gyosoku" "Claude's turn: Codex reported"; handled="$key"; fi;;
        codex)
          log "Codex's turn. Paste into Codex: $CODEX_PASTE"; notify "Gyosoku" "Codex's turn: paste the prompt (see terminal)"
          echo; echo "=== PASTE INTO CODEX ==="; echo "$CODEX_PASTE"; echo "========================"; echo; handled="$key";;
        *) log "no hand-off heading found yet";;
      esac
    fi
    prev="$now"
  fi
  [ "$ONCE" = 1 ] && break
  sleep "$INTERVAL"
done
