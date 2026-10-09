# Japanese copy review — Codex → Claude

The user requested that we jointly check Japanese correctness. Initial source review, October 10, 2026; this is not a native-speaker sign-off or a complete visual review. Please reply in the canonical handoff with the strings you checked and any changes.

## Initial findings

| Location / key | Current wording | Suggested wording / check |
|---|---|---|
| `src/fisherman.js` `savedBody` | これは取引や出荷の依頼ではなく、見込みの共有です。 | In local-only mode this implies sharing that has not happened. Use この端末に保存しました。 for local saving; use a separate successful-sync message only after cloud success. Keep the existing sync-failure message. |
| `src/fisherman.js` guide `hi`; `src/guide-lite.js` `hi` | 細かい質問はせず、そのまま進めます。 | It is grammatical but implies unrestricted automatic action. Prefer 入力のお手伝いや、画面の案内ができます。 Check actual AI behavior; it fills a draft, and the person reviews/saves. |
| `src/fisherman.js` `fleetBody` | 個人の入力は見えません。 | More explicit: 個別の報告内容は表示されません。 Keep the minimum-three-reporters statement and ensure the backend really enforces it. |
| `src/fisherman.js` `fleetKg` | の入港見込み（確認済み含む） | Natural form: の入港見込み（確認済みの報告を含む）. Confirm the assembled sentence and the distinction between confirmed catch and actual landing. |
| `src/i18n.js` `common.coverage` | 想定カバー量 | Easier for nontechnical users: 在庫と水揚げ見込みの合計. This is combined supply, not confirmed stock. |
| `src/i18n.js` `nav.decision` | 意思決定レビュー | Correct but formal. Consider 対応の確認 for older users, if approved as a consistent label across navigation, heading and AI guide. Preserve route/behavior. |
| AI invitation | 魚測AIに話しかける | Natural Japanese. Since input is text, 質問を入力 is clearer for the input placeholder. Do not imply microphone input unless implemented. |

## Joint check

Codex: verify that source labels match the actual behavior, data provenance, local/cloud storage and selected actions. Claude: review all visible Japanese in the actual mobile screens, website tour, dialogs and AI guide, including wrapping at 360px/390px and larger text. Apply approved wording in both JA and corresponding EN; keep generated mockup wording subordinate to source translations.

Use 入港 for reaching port, 水揚げ for landing fish, 漁獲量 for catch quantity, 見込み for an estimate, and 確認済み only for the specific fact checked. These are different concepts and should not be merged for stylistic consistency. Spell the location 気仙沼 consistently. Preserve the chosen brand 魚測 / Gyosoku; do not invent its Japanese reading.

Please inspect: welcome → role → details → catch entry → review → saved → Today → Sea → Me; login/logout/deletion/error sheets; processor's five sections; website app tour; auction preview. Record any remaining native/local-fisherman terminology questions instead of claiming they were verified. No frontend wording was changed by this review.
