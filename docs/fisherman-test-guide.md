# Fisherman test, Saturday morning (Kesennuma auction)

For: you, in the field. Japanese first, read aloud if needed.

## Before you leave (5 minutes, with signal)
1. Open https://gyosoku.netlify.app/fisherman/ on **your** phone once, so it is saved for offline use.
2. Print or save these two QR codes: `artifacts/gyosoku-app-qr.png` (the app) and `artifacts/gyosoku-feedback-qr.png` (feedback).
3. Charge your phone. Bring a power bank.
4. Read answers any time at: https://gyosoku.netlify.app/api/feedback?token=dbb409af3dc3583d77a1c8e4f2bdbdb6
   (private link, keep it to yourself; do not post it anywhere)

## What each fisherman does (about 3 minutes)
1. Scan the app QR code (or open the link). Tap **はじめる**.
2. Pick **漁師** or **船長**. Enter name (a nickname is fine), home port, fish. No password, no sign-in.
3. Tap **魚の見通しを入力**. Pick the fish, type the kilos (e.g. 800), check the port, tap **内容を確認**, then **保存する**.
4. Look at the chart on the Today screen: their catch appears as a bar for the day.
5. Ask them to say out loud what they expect to happen at each step. Do not help unless they are stuck 10 seconds. Note where they hesitate.
6. At the end, they scan the feedback QR code and answer the 3 questions (or you read the questions and tap for them).

Tip: the round logo button is the AI helper. They can type or say "カツオ800kg 明日" and it fills the form; they still press save.

## What to expect (be honest with them)
- **Their entries stay on their own phone** for now. Nobody else sees them, not you, not a processor. The app is a trial of how it feels and whether it is easy.
- The app works with no signal once opened. The AI helper needs signal.
- It does **not** place orders, set prices or send anything to a buyer. It is only a shared view of expected catches.
- The numbers are the fisherman's own estimates, not a forecast.
- Totals across many fishermen only show when 3 or more people report; that part is not switched on yet.

## What should make them happy
- No password or sign-up. Done in under a minute.
- Big buttons, Japanese first, works one-handed.
- Their catch appears as a bar for the day straight away.
- The AI helper lets them type naturally.
- Their data is theirs: "端末のデータを消去" on the Me screen deletes it.

## Questions to ask (and write down)
1. Would you enter this every day? At which moment (before leaving, at sea, at the port)?
2. What do you already use (paper, LINE, phone calls)? What would it have to replace?
3. Who would you be happy to share it with: the processor, the cooperative, other boats?
4. What is missing: weather, prices, voice input, bigger text, a different screen?
5. What worries you (who sees it, prices, being tracked)?

## If something goes wrong
- Page will not open: use the QR code again, or open the link in Safari/Chrome (not inside LINE).
- Looks old: close and reopen the app once with signal.
- AI does not answer: normal without signal; the buttons still work.
- Someone cannot type: use voice typing on the phone keyboard (microphone key).

## After the day
- Open the feedback link above, copy the answers, and send me the notes. I will turn the top requests into changes.
- Next step for real shared data: create the Supabase project (see `docs/architecture.md`, section 4B).
