# Data and tab research for Claude

Verified October 10, 2026 (Japan time). Requested research only: no UI changes or deployment. Endpoint success is distinct from data freshness and reuse permission.

## Recommended order for tomorrow's audience

| Rank | Addition | Value / effort | Data dependency |
|---|---|---|---|
| 1 | Log / 記録 within Today or Stats | High value, low effort: find/edit own saved entries | Existing local reports. Estimate-vs-actual comparison needs a separately recorded actual landing; confirmed catch alone is not an actual landing. |
| 2 | Official information links within Sea | High value, low effort | JMA warnings and JCG official pages. A link works without a feed parser. |
| 3 | Offshore surface temperature within Sea | Useful context, modest backend change | Tested Open-Meteo field; source/model/time, offshore grid label and applicable API subscription. |
| 4 | Market / 入港見込み | High value for captain/market/processor; higher effort | Supabase, verified identities, aggregates with >=3 distinct eligible reporters, privacy/RLS. Do not expose individual boat/report rows by default. |
| 5 | Alerts / 警報・注意報 | Valuable, medium-high effort | Correct JMA municipality mapping, active-state parser, cancellation handling, freshness/status UI. No push subscription implied. |
| 6 | Tides / 潮位 | Useful, medium effort | Correct local station, datum, annual text parser. Nearby station must be named explicitly. |
| 7 | Currents / 海流 | Specialist context, moderate effort | Offshore modeled currents; coastal-resolution limitations. Keep as optional Sea detail. |
| 8 | Prices / 価格 | Potentially valuable, presently blocked | No verified free, current Kesennuma daily-price API with reuse terms in this research. Do not add populated price cards yet. |

These rankings are product judgments, not conclusions certified by sources. Keep the present phone navigation compact; use sections within Sea/Stats before adding more bottom tabs. Fishermen need entry/history first; captains benefit from their own fleet scope; markets from anonymous arrivals totals; processors from orders/stock and shortage review.

## Open-Meteo: surface temperature and currents

[Official marine documentation](https://open-meteo.com/en/docs/marine-weather-api) documents `sea_surface_temperature`, `ocean_current_velocity`, `ocean_current_direction`, `sea_level_height_msl`. A real GET returned HTTP200 with non-null values for all four at the public offshore point, and actual grid 38.875 / 141.87502:

```text
https://marine-api.open-meteo.com/v1/marine?latitude=38.90&longitude=141.90&hourly=sea_surface_temperature,ocean_current_velocity,ocean_current_direction,sea_level_height_msl&forecast_days=3&timezone=Asia%2FTokyo
```

First non-null values in the test were 20.8°C, 0.6km/h, direction162°, sea-level0.21m. These are response examples, not values to hard-code or assert as current. Match the requested/current hour in Asia/Tokyo. Direction means where the current flows toward. These variables were tested with best-match selection; do not assume the existing `models=gwam` wave request supports them. Use a separate ocean request or verified compatible model.

Recommendation: extend the server-side conditions adapter with a separate request, 30-minute shared cache, 8-second timeout and last-good response marked stale on failure. Return value, unit, valid time, grid, model/source and retrieval time; preserve nulls. Temperature label: 沖合の海面水温（予測）. Currents: 沖合の海流（予測）. Provider says tides/currents have roughly8km resolution and coastal limitations. `sea_level_height_msl` is relative to global mean sea level and includes other effects: do not present it as a local tide-table height or berth depth.

[API terms](https://open-meteo.com/en/terms): the free endpoint is noncommercial only, with 10,000/day, 5,000/hour and600/minute limits; CC BY4.0 data attribution. Commercial products/promotional use need an appropriate paid API plan and customer endpoint. Attribution to Open-Meteo and applicable upstream provider(s); the marine page explicitly requests DWD credit. Model-specific ocean attribution needs checking when pinning the ocean model. No paid subscription was purchased.

## JMA tides: machine-readable, but station matters

[Official tide station selector](https://www.data.jma.go.jp/kaiyou/db/tide/suisan/index.php) links station AY, [Ayukawa](https://www.data.jma.go.jp/kaiyou/db/tide/suisan/suisan.php?stn=AY), in Ishinomaki at38°18′N/141°30′E. It is not Kesennuma. No Kesennuma-named tide-table station was verified in this pass.

Following the official station download link yielded HTTP200, 365 fixed-width daily rows (~50KB):

```text
https://www.data.jma.go.jp/kaiyou/data/db/tide/suisan/txt/2026/AY.txt
```

This is predicted tide-table data. The page gives its station datum andcm units. Do not substitute the observed-tide archive parser without checking the tide-table format. Validate parsed hourly and high/low entries against the official displayed day; distinguish missing/sentinel values from zero. Cache annual files for24h, handle year change and missing next-year data, and show station name, JST, prediction label and datum. Link to the official station for tomorrow rather than silently using Ayukawa as a Kesennuma tide forecast.

## JMA warnings: discovered JSON and official XML alternative

Fetched official warning-page source, which currently references `/warning/data/r8/`. Tested HTTP200:

```text
https://www.jma.go.jp/bosai/warning/data/r8/040000.json
https://www.jma.go.jp/bosai/common/const/area.json
```

Area dictionary maps Miyagi office040000 and Kesennuma city `class20s`0420500, parent region040014. Warning JSON is an array of bulletins with `reportDatetime`, `publishingOffice`, `headlineText`, `warning.class20Items[].areaCode` and `kinds` code/status/properties. It contains older entries as well as newer ones: test dates ran September15 through October9; the latest tested Kesennuma entry was October9 21:11JST. **My earlier progress note mentioned the first September entry; the full response also includes October entries.** Never take array[0] as the present state. Interpret per-kind cancellations/continuations and official code definitions; do not infer absence from a failed fetch or stale response. This website-internal JSON is not a guaranteed stable public API contract.

[Official PULL XML documentation](https://xml.kishou.go.jp/xmlpull.html) provides an alternative. `https://www.data.jma.go.jp/developer/xml/feed/extra.xml` returned200; feed updated October10 01:00:23JST in the test. The short feed is a moving window, not complete active-warning state: persist and process issued/updated/cancelled bulletins, bootstrap from the long feed, deduplicate IDs, and validate schemas. JMA notes possible delivery delays and blocks excessive downloads above10GB/day.

Proposed implementation: same-origin server adapter, fetch/cache1–5min with deduplication and conditional requests; municipality and phenomenon labels from official definitions; preserve report time separately from fetch time; explicit unavailable/stale state and official link. A currently active warning can legitimately have an older issuance time: distinguish transport/feed freshness from bulletin age, rather than clearing it solely because it is old. Do not use AI to invent warning status.

[JMA terms](https://www.jma.go.jp/jma/kishou/info/coment.html) currently apply Public Data License1.0 unless exceptions are marked; credit JMA and indicate processing. Logos and separately governed material are excluded; forecast/warning use has additional restrictions noted there. This is source reporting, not legal clearance for a new forecasting service.

## JCG and FRA

[JCG Sea Safety map](https://www6.kaiho.mlit.go.jp/sp/map.html) has warnings, weather observations, construction/navigation notices and reference links. [Terms page](https://www6.kaiho.mlit.go.jp/sp/terms.html) loads `https://www6.kaiho.mlit.go.jp/sp/policy.html`; both were read through HTTP. Policy uses Government Standard Terms2.0/CC BY4-compatible reuse with attribution and exceptions, and says this is not an electronic nautical chart. No documented stable data API was verified. Recommend an ordinary external link, not an iframe or unreviewed scraper.

[FRA-ROMSII](https://fra-roms.fra.go.jp/fra-roms/) offers regional ocean analysis/forecast maps. [Its specific copyright notice](https://fra-roms.fra.go.jp/fra-roms/static/public_doc/FRA-ROMSII_COPYRIGHT.pdf?ver=20260205) prohibits unauthorized reuse/distribution and asks users to contact the operator before research/education/publicity uses. Linking to its top page is allowed; framing is prohibited. Do not ingest/embed images or claim an open commercial licence. No public machine-readable ingestion endpoint was verified. Its Japan Sea bulletins are not automatically relevant to Kesennuma on the Pacific coast.

## Landings and prices

[Miyagi fisheries portal](https://suisan-navi.pref.miyagi.jp/mizuage_top) exposes daily-report browsing and CSV downloads of ten-day-period landings, filterable by market, fishery and species. It asks for attribution to Miyagi Suisan NAVI. CSV is machine-readable but is not a daily-price API. Automated endpoint, full commercial reuse terms and latest Kesennuma daily report were not verified: shell certificate verification failed and web fetches timed out for detailed pages. Do not bypass TLS or guess a POST endpoint. Next step: inspect a real user-exported CSV and confirm reuse terms before an importer.

[Kesennuma fish market's data page](https://kesennuma-uoichiba.jp/fishmarket/data/) is readable and links the cooperative; its WordPress/oEmbed metadata is not a landings API. Cooperative HTTPS had a hostname-certificate mismatch in this test. No verified free, within-days, machine-readable Kesennuma daily landings/prices feed with clear reuse rights was established. This does not mean no such source exists.

[MAFF distribution-statistics index](https://www.maff.go.jp/j/tokei/kouhyou/suisan_ryutu/) and [e-Stat collection](https://www.e-stat.go.jp/stat-search/files?iroha=13&page=1&result_page=1&toukei=00502005) are useful historical/context data, not tomorrow's auction prices. The listed e-Stat collection has file tables rather than database tables; account/API app IDs do not magically make every file an API series. MAFF's old consumption-market survey was discontinued in2006; don't use its monthly-price description as a current feed. Current production-side market statistics require finding the exact published table/provider and its terms. Government sources have their own attribution/exception rules; no market-data republication permission was obtained here.

## Handoff

Claude should start with existing records and official source links, then add verified offshore temperature if terms fit deployment. Keep Market and Prices empty until backend/source requirements are met. All integrations need source/date/unit and failed-fetch states. Do not overwrite fisherman/landing UI during this research. Event video, fisherman GLB, flyer QR QA and full Japanese review remain separate outstanding tasks; this brief completes the latest data/tabs research request only.
