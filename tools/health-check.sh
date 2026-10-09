#!/usr/bin/env bash
# health-check.sh: checks every connection Gyosoku depends on and prints OK / FAIL with timing. Safe: read-only, no cost, no secrets.
B="${1:-https://gyosoku.netlify.app}"
ok=0; bad=0
chk() { # name url [expect]
  local out code t; out=$(curl -s -o /tmp/hc.out -w "%{http_code} %{time_total}" --max-time 20 "$2" 2>/dev/null); code=${out% *}; t=${out#* }
  if [ "$code" = "${3:-200}" ]; then printf "  OK    %-34s %s  %.2fs\n" "$1" "$code" "$t"; ok=$((ok+1)); else printf "  FAIL  %-34s %s  (wanted %s)\n" "$1" "$code" "${3:-200}"; bad=$((bad+1)); fi
}
echo "== Website pages ($B)"
for p in / /fisherman/ /app/ /feedback/ /auction/ /predictions/ /field-test/; do chk "page $p" "$B$p"; done
echo "== Files"
for f in /public/gyosoku-video.mp4 /public/Gyosoku_Flyer_JA.pdf /public/gyosoku-hero.mp4 /public/js/harbor-story.bundle.js /sw.js /manifest.webmanifest; do chk "file $f" "$B$f"; done
echo "== Our server functions"
for f in /api/sea /api/ocean /api/conditions; do chk "api $f" "$B$f"; done
printf "  "; code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$B/api/guide" -H 'content-type: application/json' -H "origin: $B" -d '{"q":""}'); [ "$code" = 400 ] && { echo "OK    AI helper key is set (empty question refused, no cost)"; ok=$((ok+1)); } || { echo "FAIL  AI helper returned $code (400 expected when the key is set; 503 = key missing)"; bad=$((bad+1)); }
printf "  "; code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$B/api/feedback" -H 'content-type: application/json' -H "origin: $B" -d '{}'); [ "$code" = 400 ] && { echo "OK    feedback collector alive (empty form refused)"; ok=$((ok+1)); } || { echo "FAIL  feedback returned $code"; bad=$((bad+1)); }
printf "  "; code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$B/api/track" -H 'content-type: application/json' -H "origin: $B" -d '{"e":"nope"}'); [ "$code" = 400 ] && { echo "OK    analytics alive (bad event refused)"; ok=$((ok+1)); } || { echo "FAIL  analytics returned $code"; bad=$((bad+1)); }
echo "== Open data sources (outside providers)"
chk "JMA forecast Miyagi" "https://www.jma.go.jp/bosai/forecast/data/forecast/040000.json"
chk "JMA warnings Miyagi" "https://www.jma.go.jp/bosai/warning/data/warning/040000.json"
chk "Open-Meteo marine" "https://marine-api.open-meteo.com/v1/marine?latitude=38.9&longitude=142.0&hourly=sea_surface_temperature&forecast_days=1"
chk "Open-Meteo weather" "https://api.open-meteo.com/v1/forecast?latitude=38.9&longitude=141.6&daily=wind_speed_10m_max&forecast_days=1"
echo "== Not connected yet (expected)"
code=$(curl -s -o /dev/null -w "%{http_code}" "$B/public/config.json"); [ "$code" = 200 ] && echo "  Supabase config present (sign-in and shared database are on)" || echo "  --    Supabase: no public/config.json -> shared database and sign-in are OFF (entries stay on each phone)"
echo "== Certificate"
exp=$(echo | openssl s_client -servername "${B#https://}" -connect "${B#https://}:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2); echo "  expires: ${exp:-unknown}"
echo; echo "RESULT: $ok ok, $bad failed"; [ "$bad" = 0 ]
