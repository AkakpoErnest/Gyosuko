# Gyosoku app + field footage demo

`gyosoku-app-research-demo.mp4`:84.42 seconds,1280×720,24fps,H.264,
approximately8.03MB, silent with burned-in Japanese and English captions.
Published version uses `public/gyosoku-video.mp4`, the existing Play URL.

## Edit

- 0–18.4s: user harbor/market clips and first photograph, describing the real-work context.
- 18.4–53.4s: Claude's recorded Japanese app workflow: role/profile, entry, review/save, own-entry charts and Sea. Sample entries clearly identified. Original recording backed up as `app-walkthrough-original.mp4`.
- 53.4–70.4s: source research and data-validation cards.
- 70.4–78.4s: actual features and the next-stage sharing limitation.
- 78.4–84.4s: second user photograph and app link.

All three videos and two photos supplied in Downloads were included:
`WhatsApp Video 2026-10-10 at 07.54.07.mp4`, `...07.54.11.mp4`,
`...07.54.07 (1).mp4`, `WhatsApp Image 2026-10-10 at 07.54.07.jpeg`,
`...07.54.07 (1).jpeg`. Originals were not edited or moved.

Research source references: [Open-Meteo marine documentation](https://open-meteo.com/en/docs/marine-weather-api),
[JMA forecasts/warnings](https://www.jma.go.jp/bosai/),
project `docs/claude-data-research.md`, `docs/japanese-research.md`,
`docs/presentation-copy-review.md` and ocean/weather tests.
No claim of catch prediction, shared backend, verified fisherman usability,
official endorsement or autonomous orders is made.

Rebuild: `python3 tools/edit-app-demo.py` (requires the original local sources,
Pillow, ffmpeg and system Japanese font). Frames/segments live in ignored
`tmp/demo-edit/`. The script renders the review artifact first; it does not
deploy. `contact-sheet.jpg` and `gyosoku-demo-poster.jpg` provide local previews.

QA: keyframes visually inspected; all video frames decoded by ffmpeg with
no errors; ffprobe verified duration/resolution/codec and no audio track;
16tests pass; pre-deployment health check23/23. No user conversations/audio
from the source footage are included. Real app behavior was recorded by
Claude; this edit reused that recording rather than generating fake screens.

## Custom motion-design edition

User authorized original designs. `gyosoku-app-research-demo-designed.mp4`
adds a5s branded title with wave motion and an8s explanatory data-flow
animation. Total97.42s,8.45MB. Original app/field/research edit remains preserved
as its own84s master. Diagram labels distinguish local records, forecast APIs
and AI assistance, with people deciding and no shared-backend claim.
Rebuild motion edition: `python3 tools/add-demo-motion.py`, after base segments
have been generated. Custom keyframes visually reviewed; full decode passed.

## Japanese narrated edition (current Play video)

`gyosoku-demo-narrated-ja.mp4` adds scene-aligned Japanese narration to the
97.42s motion edition. Installed macOS Kyoko voice, rate 175; AAC 48kHz mono.
Exact script and timings: `narration-ja.json`. Rebuild:
`python3 tools/narrate-app-demo.py`. Video is copied without reencoding;
full audio/video decode passed. Silent masters remain available.

Japanese wording revised to everyday, conversational explanations at the user’s request.
