# Gyosoku (魚測) — design brief for Manus

Design the screens for **Gyosoku**, a bilingual (Japanese / English) web app, installable on phones, that links fishermen's expected catches to seafood processors' orders. Deliver high-fidelity screens, a small component kit, and tokens a developer can implement in plain HTML/CSS/JS.

## 1. What it does

- **Fishermen and captains** log what they expect to land (species, kg, port, arrival time, how certain). It takes under a minute, on a phone, often outdoors, often with wet or gloved hands.
- **Processors** see their orders and confirmed stock next to the *aggregated* landing outlook, and spot a possible supply gap in time to act.
- **Others** (market, research, government, curious visitors) get a read-only outlook.
- The app never places orders or messages anyone automatically. A human always makes the decision.

**Everything is focused on Kesennuma City (気仙沼市), Miyagi.** The app is for Kesennuma's fishermen, captains and processors, not a generic seafood tool. Show it in the visuals: the Kesennuma harbor and hills in the cover illustration, 気仙沼港 as the default port, a "Kesennuma, Miyagi / 宮城県 気仙沼市" badge on the welcome screen and in the processor header, and Kesennuma-region copy and sample data. Do not use other regions' names, ports or landmarks. Headline species: skipjack (カツオ), tuna (マグロ), Pacific saury (サンマ), mackerel (サバ).

## 2. Brand (match the existing landing page)

The landing page is the reference. Keep its character in the app.

- **Feel:** a calm, editorial maritime control room. Warm and trustworthy, like a well-made harbor almanac rather than an admin dashboard.
- **Palette:** warm paper background `#F5F3EE`; deep harbor navy `#152A3C` for text and primary buttons; sea-glass teal `#2F6B5E` for confirmed/healthy; restrained amber `#C98A12` for uncertainty/review; one warm sunrise accent `#E8863F` used sparingly (sun, key highlights). Never encode state by color alone: pair it with an icon or label.
- **Type:** tall condensed serif for display headlines (as on the landing page), a clean grotesque sans for UI (IBM Plex Sans), BIZ UDPGothic for Japanese. Tabular numerals for all quantities.
- **Imagery:** the watercolor / ukiyo-e-influenced harbor illustration (skipjack leaping, fishing boat, dawn light) from the landing cover. Use cropped fragments of it as hero/empty-state art; do not use stock photography or generic fish icons.
- **Motion (spec only):** short fades and bar-growth on load; a slow wave or sun drift on the welcome screen; everything off under reduced-motion.
- **Shape:** soft 16–22px radii, generous spacing, one clear primary button per screen.

## 3. Platforms

1. **Mobile first (390×844)** — the fisherman/captain app. Also design a small-phone check at 360×740.
2. **Desktop (1440×900)** — the processor workspace. Also a tablet breakpoint (820 wide).
3. Both **Japanese and English** for every key screen. Japanese strings run roughly 1.3× longer in some labels and shorter in others, so show both for the onboarding, today and add-catch screens at minimum.
4. Light theme is the main deliverable. A dark "night at sea" variant of the mobile Today screen is a bonus.

## 4. Mobile screens (fisherman / captain)

Design each with its states.

1. **Welcome** — full-bleed illustration, one-line promise, one big "Get started" button, language toggle (日本語 / English).
2. **Choose your role** — four large cards: Fisherman, Captain, Processor, Other. Each has an icon, a title and a one-line description.
3. **Sign in** — email only (no password). States: empty, sending, "check your email" confirmation, error.
4. **About you (profile details)** — fields:
   - Name (nickname is fine) *required*
   - Vessel name
   - Vessel registration number (optional)
   - Home port *required*
   - Main fishing method: pole-and-line (一本釣り), purse seine (巻き網), set net (定置網), trawl (底引き網), longline (延縄), gillnet (刺し網), other
   - Species you mainly catch: multi-select chips *at least one required*
   - Typical landing size, in kg
   - Phone (optional, with the note "Never shared directly with processors")

   Show a validation-error state. Processor and Other variants of this screen ask for company/organization, location and species handled.
5. **Today (home)** — greeting with the date; a hero **arrivals board** with a big animated total (kg) and a 7-day bar chart (today highlighted, confirmed portion shaded inside each bar); a primary "Add a catch estimate" button; the list of the user's entries; a card for the *overall outlook* (shown only when 3 or more people have reported, with a privacy note). States: empty (first visit), populated, offline.
6. **Add catch** — species select (+ free-text for "other"), a large quantity field with a kg suffix, arrival date and time, port (prefilled from the profile), certainty toggle (still an estimate / quantity checked), optional note. Thumb-reachable primary button. States: default, validation error, keyboard open.
7. **Review** — a "ticket"-style summary card, with Save and Edit.
8. **Saved** — a success moment (check mark, short copy: "This shares an outlook. It is not a trade or a delivery request.").
9. **Entry detail** — the summary card, edit, and delete with inline confirmation.
10. **Me** — avatar, role pill, profile summary, edit profile, feedback form, add-to-home-screen help, export data, sign out, clear data.
11. **Persistent bottom tab bar** — Today / Add / Me. Clear active state.

## 5. Desktop screens (processor workspace)

A left navigation rail plus a workspace. Beside the main task, a "signal" panel keeps provenance and uncertainty next to the decision.

1. **Overview** — active order, confirmed stock, landing outlook range, possible gap, next deadline, and an arrivals timeline.
2. **Supply plan** — a table of order need vs stock vs offers vs outlook. A **P10–P50–P90 forecast ribbon** is the signature visual. Includes an expandable "How this estimate is formed" panel with the arithmetic: stock + expected landings = coverage; need − coverage = gap.
3. **Decision review** — a shortage card with its inputs, three suggested next steps (request another offer / wait for an update / discuss with the buyer) with evidence for each, and explicit **Approve / Reject / Hold** controls. Include a distinct "human review" stamp.
4. **Activity** — a history of recommendations and the human choices made.
5. **Data & sources** — where each number comes from, how fresh it is, and the validation status. Connected sources (fisherman reports, public data) vs not-connected ones.
6. **Orders & stock entry** — add an order (species, kg, due date, buyer) and confirmed stock, with CSV import.

## 6. Components to include in the kit

Primary / secondary / quiet buttons · text input, select, chips, segmented toggle · role card · stat tile with count-up number · 7-day bar chart · P10–P50–P90 ribbon · provenance and freshness chips ("Reported 14 min ago", "Public data · Fisheries Agency") · status chips (confirmed, estimate, offered, review) with icon + label · human-review stamp · ticket card · empty state with illustration fragment · toast · bottom tab bar · side rail.

## 7. Content and tone

Plain, calm, respectful. For the fisherman app, short sentences, large type (≥17px body), tap targets ≥ 48px. Avoid jargon (say "estimate", not "forecast distribution"). Use these exact strings where given.

- Tagline: **EN** "From harbor to factory, one clear view of the catch." / **JA** 港から工場まで、魚の見通しをひとつに。
- Add button: "Add a catch estimate" / 魚の見通しを入力
- Certainty: "Still an estimate" / まだ見込み · "Catch quantity checked" / 漁獲量を確認済み
- Privacy: "Totals appear only when 3 or more people have reported. Individual entries are never shown." / 3人以上の報告があるときだけ、合計が表示されます。個人の入力は見えません。

Sample data for mockups (clearly realistic but fictional): skipjack 800 kg, Kesennuma port, arriving 15:00; saury 1,200 kg; vessel 第三海幸丸 (Daisan Kaiko-maru); a processor order of 5,000 kg skipjack due Friday.

## 8. Accessibility and constraints

- WCAG AA contrast; focus rings visible; states never rely on color alone.
- Works at 200% text size; Japanese line-breaking must not clip.
- Must be implementable without heavy frameworks, so avoid effects that need WebGL or video.
- Do not show fake logos, government seals or TraceSource branding as if connected.
- Do not imply forecast accuracy: label the outlook as "reported estimates, not a validated forecast".

## 9. Deliverables

1. All screens in section 4 in JA and EN (key ones), plus the desktop screens in section 5.
2. A one-page style guide: color tokens, type scale, spacing, radii, elevation.
3. The component kit from section 6, with states.
4. A short clickable flow: Welcome → Role → Sign in → About you → Today → Add catch → Review → Saved.
5. Export assets (SVG/PNG) and a Figma-style file or a link I can hand to a developer.
