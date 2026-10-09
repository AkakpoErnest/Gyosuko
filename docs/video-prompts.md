# Video prompts for Gyosoku

Two videos. Paste each prompt into your video generator (Veo, Sora, Runway, Kling, Pika, or similar). Ask for 16:9, 1080p. Generate 3 versions and pick the best.

## 1. Website background loop (no sound, 10–12 seconds, seamless)

> A seamless looping background video, 16:9, 1920×1080, 24 fps, 12 seconds. Japanese woodblock-print and watercolor illustration style: warm cream paper texture, navy and teal ink, soft amber sunrise. Kesennuma harbor at dawn: a calm bay, low green hills with a small fishing town and harbor cranes, a white fishing boat gliding slowly in from the right edge. A pale sun rises behind the hills and golden light glints on the water. In the foreground, gentle waves roll and a school of skipjack tuna leaps and dives through the spray. Slow, steady camera drift to the left. No cuts, no people, no text, no logos, no watermark. Calm, hopeful, premium mood. The last frame must match the first so it loops without a jump. Keep the left 40% of the frame lighter and quieter so website text can sit on top.

Variants (add one line to the end):
- **Night:** "Make it dark navy night: moonlit water, soft teal glow, lantern lights on the boat."
- **Mobile:** "Compose for a vertical 9:16 crop: keep the main action in the center."

Tips: save as MP4 (H.264), under 8 MB (compress with HandBrake: Web Optimized, RF 28). Name it `public/gyosoku-bg.mp4` and tell me; I will place it behind the landing page and pause it for people who use reduced motion.

## 2. Intro video for the "Play video" button (30–45 seconds, with captions)

Generate these 6 shots, each 5–7 seconds, then join them in a video editor (CapCut, iMovie) and add the captions below. Style for every shot: Japanese woodblock and watercolor illustration, navy, teal and amber, warm paper texture, no text in the image.

1. **Dawn at the harbor.** Wide shot of Kesennuma bay at sunrise, fishing boats heading out. Caption: 「毎朝、港に入る魚は、ちがいます。」 / "Every morning, the catch is different."
2. **A fisherman's phone.** Close-up of a fisherman's weathered hands holding a phone on a boat deck, a simple screen with big buttons, tuna in the background. Caption: 「漁師さんが、入港前にスマホで見込みを入力。」 / "Fishermen enter what they expect, before reaching port."
3. **Arrival chart.** The phone screen turns into a simple 7-day bar chart, an orange bar growing for today. Caption: 「量・魚種・入港時間が、ひと目でわかる。」 / "Fish, quantity and arrival time, at a glance."
4. **The auction hall.** Morning at a fish market, crates of tuna on ice, a buyer glancing at their phone. Caption: 「競りの前に、準備ができる。」 / "Prepare before the auction starts."
5. **The processor.** A factory floor with fish being processed; a manager checks a screen that shows a small gap. Caption: 「加工会社は、足りない分に早く気づける。」 / "Processors spot a shortfall early."
6. **Together.** Boat, market and factory in one wide sunrise view, the logo (a navy tuna over teal waves with an orange sun) appears. Caption: 「魚測 — 気仙沼の、次の一手を。」 / "Gyosoku: a clearer next move for Kesennuma."

Voice-over (optional, calm, in Japanese; generate with any text-to-speech tool): read the six captions in order.

Music: soft acoustic or koto, low volume, royalty-free.

Keep the final video under 20 MB. Name it `public/gyosoku-video.mp4`; the Play video button already looks for that file.
