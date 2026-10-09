// Gyosoku UI strings and language selection.
// Flat dot-path keys. Every key exists in both languages.
// No document/localStorage access at import time — all guarded and lazy.

export const LANGS = ['en', 'ja'];
const DEFAULT_LANG = 'en';
const STORAGE_KEY = 'gyosoku.lang';
const TZ = 'Asia/Tokyo';

const en = {
  // App shell
  'app.name': 'Gyosoku',
  'app.tagline': 'A clearer next move when fish supply is uncertain',
  'app.demoBanner': 'Demo data only. Forecast accuracy has not been validated. Human approval required.',
  'app.langToggle': '日本語',
  'app.scenario': 'Synthetic Skipjack scenario',

  // Navigation
  'nav.overview': 'Overview',
  'nav.supply': 'Supply plan',
  'nav.decision': 'Decision review',
  'nav.activity': 'Activity',
  'nav.technical': 'Technical details',

  // Shared labels
  'common.need': 'Order need',
  'common.stock': 'Confirmed stock',
  'common.landings': 'Expected landings (illustrative)',
  'common.coverage': 'Possible coverage',
  'common.gap': 'Potential gap',
  'common.verifiedOffers': 'Verified offers',
  'common.offeredUnconfirmed': 'Offered, unconfirmed (not counted)',
  'common.p10': 'P10 (low)',
  'common.p50': 'P50 (median)',
  'common.p90': 'P90 (high)',
  'common.asOf': 'As of {date}',
  'common.kg': 'kg',

  // Overview
  'overview.title': 'Overview',
  'overview.activeOrder': 'Active order',
  'overview.confirmedStock': 'Confirmed stock',
  'overview.forecastRange': 'Landing outlook (P10–P90)',
  'overview.possibleGap': 'Possible gap (median)',
  'overview.nextDeadline': 'Next deadline',
  'overview.arrivals': 'Upcoming arrivals',
  'overview.due': 'Due {date}',
  'overview.orderMeta': '{species} · {buyer}',
  'overview.stockMeta': '{location} · verified {date}',

  // Supply plan
  'supply.title': 'Supply plan',
  'supply.requirements': 'Order requirements',
  'supply.stock': 'Confirmed stock',
  'supply.offers': 'Supplier offers',
  'supply.colSupplier': 'Supplier',
  'supply.colQuantity': 'Quantity',
  'supply.colEta': 'ETA',
  'supply.colStatus': 'Status',
  'supply.colAction': 'Action',
  'supply.forecast': 'Landing outlook',
  'supply.source': 'Data source',
  'supply.freshness': 'As of',
  'supply.howFormed': 'How this estimate is formed',
  'supply.percentilesIntro': 'The outlook is shown as three percentiles. They describe a range of outcomes, not a prediction of a single number.',
  'supply.p10': 'P10: A low outcome. There is roughly a 1-in-10 chance landings fall below this.',
  'supply.p50': 'P50: The median. Landings are as likely to come in above this as below it.',
  'supply.p90': 'P90: A high outcome. There is roughly a 1-in-10 chance landings exceed this.',
  'supply.trace': 'Calculation trace',
  'supply.traceStep1': 'Confirmed stock + illustrative expected landings = possible coverage',
  'supply.traceStep2': 'Order need − possible coverage = potential gap',
  'supply.offeredNotCounted': 'Offered quantities are not counted toward coverage until a person marks them verified.',
  'supply.markVerified': 'Mark verified',
  'supply.unmarkVerified': 'Undo verified',
  'supply.offerLine': '{supplier} · {kg} · ETA {date}',

  // Decision review
  'decision.title': 'Decision review',
  'decision.shortage': 'Possible shortage',
  'decision.shortageLead': '{gap} may be uncovered. Review the estimate before choosing.',
  'decision.gapInputs': 'Inputs to this gap',
  'decision.suggestions': 'Suggested next steps',
  'decision.reason': 'Reason',
  'decision.evidence': 'Evidence',
  'decision.approve': 'Approve',
  'decision.reject': 'Reject',
  'decision.review': 'Hold for review',
  'decision.confirmTitle': 'Confirm your decision',
  'decision.confirmBody': 'Record "{decision}" for "{suggestion}". This is stored in the browser for the demo only. Nothing is sent anywhere.',
  'decision.confirmYes': 'Record decision',
  'decision.confirmNo': 'Cancel',
  'decision.needChoice': 'Select a suggestion before recording a decision.',
  'decision.recorded': 'Decision recorded in Activity.',
  'decision.humanRequired': 'No action is taken automatically. A person records every decision.',

  // Suggestions
  'suggest.request-offer': 'Request another offer',
  'suggest.request-offer.desc': 'Ask an additional supplier for a quote to cover the median gap.',
  'suggest.wait-update': 'Wait for the next landing update',
  'suggest.wait-update.desc': 'Hold the decision until the next arrival is confirmed. The high-side outlook leaves only a small gap.',
  'suggest.discuss-buyer': 'Discuss the gap with the buyer',
  'suggest.discuss-buyer.desc': 'Raise the possible shortfall with the buyer before the deadline to agree on quantity or timing.',

  // Evidence
  'ev.gap-median': 'Median possible gap is {gap}.',
  'ev.offer-exists': 'An unconfirmed offer of {offerKg} from {supplier} exists.',
  'ev.next-landing': 'Next landing expected {date}: about {kg}.',
  'ev.p90-covers': 'At the high-side outlook (P90), the remaining gap is {p90Gap}.',
  'ev.deadline': 'Order is due {date}.',

  // Activity
  'activity.title': 'Activity',
  'activity.empty': 'No decisions recorded yet.',
  'activity.resetsNote': 'This history is kept in memory for the demo and resets when the page reloads.',
  'activity.time': 'Time',
  'activity.suggestion': 'Suggestion',
  'activity.decision': 'Decision',
  'activity.evidence': 'Evidence',
  'activity.columns.time': 'Time',
  'activity.columns.suggestion': 'Suggestion',
  'activity.columns.decision': 'Decision',
  'activity.columns.evidence': 'Evidence',
  'activity.gapAtTime': 'Gap at the time: {gap}',

  // Technical details
  'tech.title': 'Technical details',
  'tech.provenance': 'Input provenance',
  'tech.provenanceNote': 'All figures come from one synthetic scenario object (src/data.js). They are static inputs, not model output.',
  'tech.freshness': 'Data freshness',
  'tech.freshnessNote': 'The timestamp is illustrative and does not reflect a live feed.',
  'tech.percentiles': 'Forecast percentiles',
  'tech.percentilesNote': 'P10 / P50 / P90 are illustrative scenario values. No forecasting model has been run or validated.',
  'tech.trace': 'Calculation trace',
  'tech.validation': 'Validation status',
  'tech.integrations': 'Integration state',
  'tech.integration.government': 'Government data',
  'tech.integration.market': 'Market data',
  'tech.integration.supplier': 'Supplier systems',
  'tech.integration.tracesource': 'TraceSource',
  'tech.notConnected': 'Not connected',
  'tech.notValidated': 'Not validated',
  'tech.integrationsNote': 'TraceSource is a collaborator on this work, not a connected data source. No government, market, supplier, or TraceSource systems are connected.',
  'tech.notEvidence': 'Published aggregate statistics are not evidence of live operational data access.',
  'tech.noNetwork': 'The prototype makes no network requests for business data and submits nothing to external services.',

  // Demo vs. pilot
  'pilot.title': 'Demo vs. pilot',
  'pilot.body': 'This demo runs on synthetic data in the browser. A pilot would require permissions from participating organizations, data agreements covering each source, validation of operational feeds against actual landings, and calibration of the forecast against observed outcomes before any figure is used for a decision.',

  // Statuses
  'status.offered': 'Offered (unconfirmed)',
  'status.verified': 'Verified',
  'status.declined': 'Declined',
  'status.expected': 'Expected',
  'status.uncertain': 'Uncertain',
  'status.approved': 'Approved',
  'status.rejected': 'Rejected',
  'status.review': 'Under review',

  // Entities
  'provenance.synthetic': 'Synthetic demo scenario',
  'species.skipjack': 'Skipjack',
  'buyer.buyer-a': 'Buyer A',
  'location.cold-store-1': 'Cold store 1',
  'supplier.supplier-b': 'Supplier B',
  'vessel.vessel-1': 'Vessel 1',
  'vessel.vessel-2': 'Vessel 2',
  'vessel.vessel-3': 'Vessel 3',

  // Accessibility
  'a11y.skipToContent': 'Skip to content',
  'a11y.navLabel': 'Main navigation',
  'a11y.menuToggle': 'Toggle menu',
  'a11y.closeDialog': 'Close dialog',
  'a11y.langToggle': 'Switch language',
  'a11y.ribbon': 'Forecast ribbon showing P10 {p10}, P50 {p50}, and P90 {p90} against an order need of {need}',
};

const ja = {
  // App shell
  'app.name': 'Gyosoku',
  'app.tagline': '魚の供給が不確かなときに、次の一手を明確にする',
  'app.demoBanner': 'デモデータのみ。予測精度は未検証です。人による承認が必要です。',
  'app.langToggle': 'English',
  'app.scenario': 'カツオの合成デモシナリオ',

  // Navigation
  'nav.overview': '概要',
  'nav.supply': '供給計画',
  'nav.decision': '意思決定レビュー',
  'nav.activity': '履歴',
  'nav.technical': '技術詳細',

  // Shared labels
  'common.need': '注文数量',
  'common.stock': '確定在庫',
  'common.landings': '水揚げ見込み（例示）',
  'common.coverage': '想定カバー量',
  'common.gap': '不足見込み',
  'common.verifiedOffers': '確認済みオファー',
  'common.offeredUnconfirmed': 'オファー中・未確認（集計対象外）',
  'common.p10': 'P10（低位）',
  'common.p50': 'P50（中央値）',
  'common.p90': 'P90（高位）',
  'common.asOf': '{date} 時点',
  'common.kg': 'kg',

  // Overview
  'overview.title': '概要',
  'overview.activeOrder': '進行中の注文',
  'overview.confirmedStock': '確定在庫',
  'overview.forecastRange': '水揚げ見込み（P10〜P90）',
  'overview.possibleGap': '不足見込み（中央値）',
  'overview.nextDeadline': '次の期限',
  'overview.arrivals': '入港予定',
  'overview.due': '期限 {date}',
  'overview.orderMeta': '{species} · {buyer}',
  'overview.stockMeta': '{location} · {date} 確認',

  // Supply plan
  'supply.title': '供給計画',
  'supply.requirements': '注文要件',
  'supply.stock': '確定在庫',
  'supply.offers': '仕入先オファー',
  'supply.colSupplier': '仕入先',
  'supply.colQuantity': '数量',
  'supply.colEta': '到着予定',
  'supply.colStatus': '状態',
  'supply.colAction': '操作',
  'supply.forecast': '水揚げ見込み',
  'supply.source': 'データ出所',
  'supply.freshness': '基準時刻',
  'supply.howFormed': 'この見込みの算出方法',
  'supply.percentilesIntro': '見込みは3つのパーセンタイルで示します。単一の予測値ではなく、起こり得る範囲を表します。',
  'supply.p10': 'P10：低めの結果です。水揚げがこれを下回る可能性はおよそ10回に1回です。',
  'supply.p50': 'P50：中央値です。水揚げがこれを上回る可能性と下回る可能性は同程度です。',
  'supply.p90': 'P90：高めの結果です。水揚げがこれを上回る可能性はおよそ10回に1回です。',
  'supply.trace': '計算の内訳',
  'supply.traceStep1': '確定在庫 + 水揚げ見込み（例示）= 想定カバー量',
  'supply.traceStep2': '注文数量 − 想定カバー量 = 不足見込み',
  'supply.offeredNotCounted': 'オファー数量は、人が確認済みにするまでカバー量に含めません。',
  'supply.markVerified': '確認済みにする',
  'supply.unmarkVerified': '確認済みを取り消す',
  'supply.offerLine': '{supplier} · {kg} · 到着予定 {date}',

  // Decision review
  'decision.title': '意思決定レビュー',
  'decision.shortage': '不足の可能性',
  'decision.shortageLead': '見込み不足は{gap}。予測を確認してから対応を選んでください。',
  'decision.gapInputs': '不足見込みの内訳',
  'decision.suggestions': '提案される次の対応',
  'decision.reason': '理由',
  'decision.evidence': '根拠',
  'decision.approve': '承認',
  'decision.reject': '却下',
  'decision.review': '保留',
  'decision.confirmTitle': '判断の確認',
  'decision.confirmBody': '「{suggestion}」を「{decision}」として記録します。デモ用にブラウザ内のみ保存され、外部には送信されません。',
  'decision.confirmYes': '記録する',
  'decision.confirmNo': 'キャンセル',
  'decision.needChoice': '判断を記録する前に、対応を1つ選んでください。',
  'decision.recorded': '判断を履歴に記録しました。',
  'decision.humanRequired': '自動で実行される操作はありません。すべての判断は人が記録します。',

  // Suggestions
  'suggest.request-offer': '追加オファーを依頼する',
  'suggest.request-offer.desc': '中央値の不足見込みを補うため、別の仕入先に見積を依頼します。',
  'suggest.wait-update': '次の水揚げ更新を待つ',
  'suggest.wait-update.desc': '次の入港が確定するまで判断を保留します。高位の見込みでは不足はわずかです。',
  'suggest.discuss-buyer': '買い手と不足について協議する',
  'suggest.discuss-buyer.desc': '期限前に不足の可能性を買い手に伝え、数量または納期を調整します。',

  // Evidence
  'ev.gap-median': '不足見込みの中央値は{gap}です。',
  'ev.offer-exists': '{supplier}から{offerKg}の未確認オファーがあります。',
  'ev.next-landing': '次の水揚げは{date}、約{kg}の見込みです。',
  'ev.p90-covers': '高位の見込み（P90）でも{p90Gap}の不足が残ります。',
  'ev.deadline': '注文の期限は{date}です。',

  // Activity
  'activity.title': '履歴',
  'activity.empty': 'まだ判断は記録されていません。',
  'activity.resetsNote': 'この履歴はデモ用にメモリ上で保持され、ページを再読み込みするとリセットされます。',
  'activity.time': '時刻',
  'activity.suggestion': '提案',
  'activity.decision': '判断',
  'activity.evidence': '根拠',
  'activity.columns.time': '時刻',
  'activity.columns.suggestion': '提案',
  'activity.columns.decision': '判断',
  'activity.columns.evidence': '根拠',
  'activity.gapAtTime': '記録時点の不足見込み：{gap}',

  // Technical details
  'tech.title': '技術詳細',
  'tech.provenance': '入力データの出所',
  'tech.provenanceNote': 'すべての数値は1つの合成シナリオ（src/data.js）に由来します。静的な入力値であり、モデルの出力ではありません。',
  'tech.freshness': 'データの鮮度',
  'tech.freshnessNote': 'タイムスタンプは例示であり、ライブフィードを反映したものではありません。',
  'tech.percentiles': '予測パーセンタイル',
  'tech.percentilesNote': 'P10 / P50 / P90 は例示用のシナリオ値です。予測モデルは実行も検証もされていません。',
  'tech.trace': '計算の内訳',
  'tech.validation': '検証状況',
  'tech.integrations': '連携状況',
  'tech.integration.government': '行政データ',
  'tech.integration.market': '市場データ',
  'tech.integration.supplier': '仕入先システム',
  'tech.integration.tracesource': 'TraceSource',
  'tech.notConnected': '未接続',
  'tech.notValidated': '未検証',
  'tech.integrationsNote': 'TraceSourceは本件の協力者であり、接続されたデータソースではありません。行政・市場・仕入先・TraceSourceのいずれのシステムにも接続していません。',
  'tech.notEvidence': '公表されている集計統計は、稼働中の業務データへのアクセスを示す根拠にはなりません。',
  'tech.noNetwork': 'このプロトタイプは業務データのネットワーク通信を行わず、外部サービスへの送信もしません。',

  // Demo vs. pilot
  'pilot.title': 'デモとパイロットの違い',
  'pilot.body': 'このデモはブラウザ内の合成データで動作します。パイロットでは、参加組織の許可、各データ出所との利用契約、実際の水揚げに対する業務フィードの検証、実績に基づく予測の較正が必要です。これらが完了するまで、数値を判断に用いることはできません。',

  // Statuses
  'status.offered': 'オファー中（未確認）',
  'status.verified': '確認済み',
  'status.declined': '辞退',
  'status.expected': '入港予定',
  'status.uncertain': '不確定',
  'status.approved': '承認',
  'status.rejected': '却下',
  'status.review': '保留',

  // Entities
  'provenance.synthetic': '合成デモシナリオ',
  'species.skipjack': 'カツオ',
  'buyer.buyer-a': '買い手A',
  'location.cold-store-1': '冷蔵庫1',
  'supplier.supplier-b': '仕入先B',
  'vessel.vessel-1': '漁船1',
  'vessel.vessel-2': '漁船2',
  'vessel.vessel-3': '漁船3',

  // Accessibility
  'a11y.skipToContent': '本文へ移動',
  'a11y.navLabel': 'メインナビゲーション',
  'a11y.menuToggle': 'メニューを開閉',
  'a11y.closeDialog': 'ダイアログを閉じる',
  'a11y.langToggle': '言語を切り替える',
  'a11y.ribbon': '予測リボン：注文数量{need}に対して P10 {p10}、P50 {p50}、P90 {p90}',
};

export const strings = { en, ja };

const LOCALE = { en: 'en-US', ja: 'ja-JP' };

let current = null;

function isLang(x) {
  return LANGS.includes(x);
}

function readStored() {
  try {
    if (typeof localStorage !== 'undefined') {
      const v = localStorage.getItem(STORAGE_KEY);
      if (isLang(v)) return v;
    }
  } catch {
    /* storage unavailable */
  }
  return null;
}

function applyDocumentLang(lang) {
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }
  } catch {
    /* no DOM */
  }
}

export function getLang() {
  if (current === null) {
    current = readStored() || DEFAULT_LANG;
  }
  return current;
}

export function setLang(lang) {
  const next = isLang(lang) ? lang : DEFAULT_LANG;
  current = next;
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable */
  }
  applyDocumentLang(next);
  return next;
}

export function t(key, vars) {
  const lang = getLang();
  let s = strings[lang] && strings[lang][key];
  if (s === undefined) s = en[key];
  if (s === undefined) return key;
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) && vars[name] !== undefined ? String(vars[name]) : m,
  );
}

export function fmtKg(n) {
  const num = Number(n);
  const locale = LOCALE[getLang()] || LOCALE.en;
  const body = Number.isFinite(num) ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(num) : '—';
  return `${body} kg`;
}

function toDate(iso) {
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function fmtDate(iso) {
  const d = toDate(iso);
  if (!d) return '';
  const locale = LOCALE[getLang()] || LOCALE.en;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    timeZone: TZ,
  }).format(d);
}

export function fmtDateTime(iso) {
  const d = toDate(iso);
  if (!d) return '';
  const locale = LOCALE[getLang()] || LOCALE.en;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(d);
}
