# TASKS FOR CODEX (read this first, then docs/codex-claude-handoff.md)

Updated: October 10, 2026. The user presents on October 11. Design, copy and deploys stay with Claude. You do verification, research, backend and Blender production. Report each finished item at the bottom of `docs/codex-claude-handoff.md` as `### Codex → Claude — <title>`; do not deploy, tell Claude.

## A. Must do before the presentation (in this order)
1. **Japanese and English review** (user request). Check, as a native-level Japanese reader, and list **must-fix** (wrong/misleading) vs **polish**, each as `file · old → new · why`:
   - landing page text: `index.html` (`data-ja` attributes vs the English beside them)
   - app strings: `COPY.ja` and `COPY.en` in `src/fisherman.js` (184 keys each)
   - `/feedback/` (`src/feedback.js`), `/auction/` (`src/auction.js`), `src/guide-lite.js`, `src/app-tour.js`
   - printed sheet: `artifacts/flyer/flyer.html` (JA page). The credit line is 「気仙沼ハッカツオン2026 から生まれたアプリ」; it must not imply official endorsement.
   - AI replies: `netlify/functions/guide.mjs` and `brief.mjs` prompts and sample outputs.
2. **QR codes on the printed sheet**: decode both QR codes in `artifacts/flyer/Gyosoku-flyer-JA.pdf` (rasterise at 200 dpi, then zbarimg or jsQR) and confirm they resolve to `https://gyosoku.netlify.app/fisherman/?s=flyer` and `https://gyosoku.netlify.app/?s=flyer`, and both URLs return 200. (Already-printed copies use the same URLs without `?s=flyer`; confirm those load too.)
3. **Event loop video** (silent, 30–40 s, 1280×720 H.264, under 6 MB), saved as `public/gyosoku-video.mp4` (the Play video button already uses it). Three scenes: boat arrives at a Kesennuma-style dock; fisherman in orange waders lands a tuna crate and taps a phone; phone screen shows a 7-day arrivals bar chart growing. Burn in large Japanese captions (min 48 px, high contrast, bottom third): 「入港前に、スマホで見込みを入力。」 / 「水揚げ。見込みと実際を、あとで比べる。」 / 「みんなの見込みが、ひと目でわかる。」 No other text, no logos, loops cleanly.

## B. Next (after the presentation)
4. **Fisherman model for the 3D story**: low-poly, orange waders, navy cap, separable `armL armR legL legR head`, `public/models/fisherman.glb` under 300 KB. Claude will load it with GLTFLoader.
5. **Open-data research** (continue from what Claude verified, see the last note in the handoff): tide tables (JMA suisan, find the machine-readable format and the Kesennuma/Ishinomaki station), any free current fish-market landing or price data (say plainly if none exists). Report endpoints, fields, licence.
6. **Auction role** (spec in the handoff) and **Supabase wiring + two-account RLS test** once the user creates the project (`public/config.json`).
7. **Processor workspace** on real data (replace `src/data.js`).

## Rules
- Do not edit `src/fisherman.js`, `index.html`, `src/home.*`, `artifacts/flyer/*` or any visual file; propose changes in your report and Claude applies them.
- Keep `node --test tests` at 12/12.
- Never commit secrets. The OpenAI key lives only in Netlify env.
