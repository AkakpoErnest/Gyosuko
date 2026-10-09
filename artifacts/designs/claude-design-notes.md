# Mobile supply screen: implementation handoff

**Superseded for feature behavior:** read `feature-parity.md` and use `02-supply-gap-aligned.png`. Existing app routes, action labels, confirmation and history behavior take precedence over this original visual brief.

Reference: `02-supply-gap.png`, generated with built-in imagegen from your processor brief and existing Japanese app collage. Full prompt: `02-supply-gap-prompt.txt`. This is a visual concept; no live screens changed.

## Build priorities

- Lead with the question, deadline and required quantity. Put confirmed stock and additional expected landings beside one another only when both remain readable; stack at narrow widths.
- Keep confirmed stock a check-marked teal metric and expected landings a separately labelled estimate. All sample numbers must disappear when real data is unavailable; show an empty state instead.
- Use 16px minimum body text, 32–40px key numbers, 16px horizontal phone padding, 16px card corners and controls at least 48px tall. Test 360px and 390px with Japanese wrapping and enlarged text.
- Use the real logo. Render every label as selectable HTML, not a screenshot. Use tabular numeric digits and explicit kg units.
- The range in the mockup is schematic. Build a correctly scaled chart with an accessible text equivalent; place the 5,000 kg requirement on the same numeric scale. Do not copy the generated marker positions.
- Sample arithmetic reviewed: 1,100 + 3,150 = 4,250; 5,000 − 4,250 = 750; gap range 100–1,400 follows combined totals 4,900–3,600.
- Choose an action before deciding. Separate approval, hold and rejection states; confirmation must explain the result. Approval does not place an order automatically.
- The generated screen is long: let content scroll, keep navigation fixed and reserve bottom padding so the decision buttons remain reachable. Preserve existing desktop navigation and routes rather than treating mockup tabs as new functional requirements.
- JA first, EN translations for every label. Sample badge: デザイン用サンプル / Design sample. Stock: 確定在庫 / Confirmed stock. Estimate: 追加の入港見込み / Additional expected landings. Gap: 中央の見込みでは750 kg不足 / Estimated median gap: 750 kg.
- Animate card entrances gently, with reduced-motion support and pause controls retained. Keep chart values and approval controls stable during animation.

The sample design was visually reviewed for Japanese text and arithmetic. Real phone usability and an implemented accessible chart still need checking. No backend connection or deployment is included.
