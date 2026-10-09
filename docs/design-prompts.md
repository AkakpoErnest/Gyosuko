# Design prompts for Manus / GPT (images that fit the Gyosoku app)

Give the generator `artifacts/mockups/gyosoku-mockups-ja.png` (or `-en.png`) as the **style reference**: it shows the real screens. Then paste one prompt below. Always ask for a **390×844 phone screen, flat UI design, no device frame, no placeholder lorem text**, and for Japanese text to be real Japanese.

## Brand rules (put these in every prompt)
Kesennuma, Miyagi fishing and seafood trade app. Calm, trustworthy, maritime. Paper white `#F3F7F4`, deep harbor navy `#0B3A45`, sea teal `#14786F`, sunrise orange `#FF8A4C` (primary buttons only), warm sand accents. Rounded 16px cards, soft shadows, big tap targets (min 48px), clear Japanese type (system Hiragino / Noto Sans JP), bottom tab bar with 4 tabs: Today / Add / Sea / Me. Logo: a navy tuna over teal waves with a small orange sun.

## 1. New screens to design (one prompt each)
1. **Auction / market home ("競り・市場")**: "Design the home screen for an auction company user. Top: greeting and date. A dark navy summary card with the expected total landing for today in kg and a 7-day bar chart. Below it, a list of species cards (skipjack, saury, mackerel) with quantity, confidence ('checked' vs 'estimate' pill), and arrival time. A note: totals show only when 3 or more fishermen reported. Tab bar: Today, Outlook, Sea, Me."
2. **Processor supply-gap screen**: "A phone screen for a seafood processor: order need (5,000 kg skipjack due Friday), confirmed stock, expected landings range as a ribbon (low, middle, high), and the possible gap in red. Three suggested next steps with Approve / Reject / Hold buttons and a 'human decides' stamp."
3. **Voice entry**: "A big microphone button screen for fishermen with wet hands: 'Say it: skipjack 800 kg, tomorrow 3 pm'. Show the recognized sentence and the filled-in form below, with a large Save button."
4. **Port arrivals board**: "A simple list of today's expected arrivals at Kesennuma port, sorted by time, each row: boat name, fish, kg, time, status."
5. **Notifications / alerts**: "A screen listing three alerts: a weather warning, an arrival delay, and a supply gap, each with a colored icon and a time."
6. **Onboarding illustration set**: "Four small flat illustrations in the same style (fisherman with phone, fishing boat, auction hall with crates, factory with steam) on transparent background, navy and teal with a single orange accent."

## 2. Assets I can use directly
- App icon set: the existing logo on navy, 1024×1024, rounded.
- Empty-state illustrations: boat on calm sea, crate of tuna on a dock, phone showing a bar chart.
- Wide hero image (16:9) of Kesennuma harbor at dawn in the same woodblock-watercolor style as the landing page.

## 3. How to hand results back
Put the images in `artifacts/designs/` (PNG, 2x), name them `01-auction-home.png`, `02-supply-gap.png` and so on. Tell Claude which screens to build. Claude will recreate them in the real app (plain HTML/CSS/JS) and keep Japanese first.
