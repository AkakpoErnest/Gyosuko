# Japanese terminology and usability research

Codex research, October 10, 2026. Requested joint research with Claude; Claude's independent review is pending. Sources below support terminology and interface principles, not certification of every Gyosoku translation.

## Fisheries terminology

[Kesennuma City's fisheries notice](https://www.kesennuma.miyagi.jp/sec/s002/020/030/050/020/070/3007/2018-07-20_suisannka.pdf) directs readers to the cooperative's 入船情報 for vessel arrival status. This is a historical document used only as evidence of local terminology. Our recommendation: keep understandable 入港予定 for a planned arrival, and consider 入船情報 when describing an official vessel-information board. Do not automatically replace every 入港 label.

[Miyagi Prefecture's fisheries data portal](https://suisan-navi.pref.miyagi.jp/mizuage_top) uses market, fish species and landed quantities in its public-data search. Search-index content was available; the direct page timed out during this review. Recommendation: use 魚種 for formal species headings, with どの魚ですか？ retained as the friendlier entry question. 水揚げ量 should describe quantities actually landed; user-entered expected quantities remain 水揚げ見込み or 入港見込み according to the field's actual meaning. These are editorial recommendations from source terminology, not a requirement stated by the source.

## Weather wording

[JMA's marine-information directory](https://www.jma.go.jp/jma/menu/bunyasea.html) separates marine warnings, forecasts and wave observations. Recommendation: Gyosoku's Sea view should clearly identify 天気・波の予報, distinguish forecasts from observations, show data timestamp/source, and keep links to official warnings. Do not label a model forecast 実測 or imply it decides whether sailing is safe. The app's Open-Meteo/DWD numbers are not JMA forecasts.

## Mobile labels and readability

[Digital Agency button accessibility guidance](https://design.digital.go.jp/dads/components/button/accessibility/) favors text labels, accessible names for icon-only controls, sufficient contrast, and more than color alone to communicate differences. Recommendation: keep a clear AI label alongside the fish icon when space permits, retain a meaningful accessible name, and make 保存 / 削除 / 保留 distinguishable through labels and shape.

[Digital Agency horizontal-menu guidance](https://design.digital.go.jp/dads/components/horizontal-menu/) says menu labels should use destination page names. Recommendation: align processor navigation labels with actual section headings; do not rename one menu entry while leaving its page and AI shortcut with different terms.

## Proposed copy for behavior accuracy

These are our editorial suggestions, not quotations from external sources:

- Local save: この端末に保存しました。 / Saved on this device.
- Confirmed cloud sync only: クラウドに同期しました。 / Synced to the cloud.
- AI greeting: 入力のお手伝いや、画面の案内ができます。 / I can help with entries and guide you around the app.
- Aggregate privacy: 個別の報告内容は表示されません。 / Individual report details are not shown.
- Combined supply: 在庫と水揚げ見込みの合計 / Stock plus expected landings.

Claude: independently check sources, full Japanese strings, screen headings, JA/EN meaning, and actual 360px/390px wrapping. Prioritize savedBody, AI greeting, local/cloud status and estimate/confirmed distinctions noted in japanese-copy-review.md. Reply in the canonical handoff with sources consulted, findings and changes. Local fishermen should still confirm terminology and comprehension in the field test. No text changes or deployment are part of this research document.
