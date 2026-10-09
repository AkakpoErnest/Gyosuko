// Gyosoku fisherman app: role onboarding, profile details, catch reports, arrivals board.
// Works offline in local-only mode; syncs to the backend once Supabase is configured and the user is signed in.

import * as backend from './backend.js';
import { askAI } from './guide-ai.js';

const KEY = 'gyosoku.app.v2';
const LANG_KEY = 'gyosoku.fisherman.lang';
const ROLES = ['fisherman', 'captain', 'processor', 'other'];
const FISHERS = ['fisherman', 'captain'];
const SPECIES = ['skipjack', 'tuna', 'saury', 'mackerel'];
const METHODS = ['poleline', 'purse', 'setnet', 'trawl', 'longline', 'gillnet', 'otherMethod'];

const COPY = {
  ja: {
    photoAdd: '写真を追加', photoChange: '写真を変更', photoRemove: '写真を削除', photoLocal: '写真はこの端末だけに保存されます。', photoError: '写真を読み込めませんでした。',
    accessTitle: 'ログインしますか？', accessBody: 'ログインすると、入力がクラウドに保存され、ほかの端末でも使えます。', accessLogin: 'ログインして使う', accessLoginHint: 'メールのリンクだけ。パスワードは不要です。', accessSkip: 'ログインせずに使う', accessSkipHint: 'この端末だけに保存されます。あとからログインもできます。',
    sureTitle: 'よろしいですか？', sureLeave: 'アプリから離れますか？', sureDiscard: '入力した内容は保存されません。破棄して戻りますか？', stay: 'とどまる', leave: '離れる', discard: '破棄して戻る',
    tagline: '気仙沼の港から工場まで、魚の見通しをひとつに。', welcomeBody: '今日の魚、量、入港時間。あなたの入力が、気仙沼の加工会社の「足りるかどうか」を支えます。', place: '宮城県 気仙沼市',
    start: 'はじめる', whoTitle: 'あなたはどなたですか？', whoBody: '役割に合わせて、画面と入力項目を整えます。後から変更できます。',
    fisherman: '漁師', fishermanD: '自分の漁の見込みを記録する', captain: '船長', captainD: '船と乗組員の水揚げをまとめる',
    processor: '加工会社', processorD: '注文と在庫、供給の不足を確認する', other: 'その他', otherD: '市場・研究・行政・関心のある方',
    signinTitle: 'メールでログイン', signinBody: 'パスワードは不要です。届いたメールのリンクを開くだけ。', email: 'メールアドレス', sendLink: 'ログインリンクを送る',
    linkSent: 'メールを送りました', linkSentBody: '受信箱のリンクを開くと、この画面に戻ります。届かない場合は迷惑メールもご確認ください。', badEmail: 'メールアドレスを確認してください。', sendFail: '送信できませんでした。しばらくしてからもう一度お試しください。',
    detailsTitle: 'あなたについて', detailsBody: '加工会社が見込みを理解するために必要な情報です。後から編集できます。',
    whichFish: 'どの魚ですか？', name: 'お名前（呼び名でOK）', vessel: '船の名前', vesselPh: '例：第三海幸丸', reg: '漁船登録番号（任意）', homePort: '母港', homePortPh: '例：気仙沼港',
    method: '主な漁法', species: '主に獲る魚（複数選択可）', capacity: '1回の水揚げの目安（kg）', phone: '電話番号（任意）', phoneHint: '加工会社に直接共有されることはありません。',
    company: '会社名・組織名', location: '所在地', interest: '主に扱う魚', orgPh: '例：気仙沼水産',
    poleline: '一本釣り', purse: '巻き網', setnet: '定置網', trawl: '底引き網', longline: '延縄', gillnet: '刺し網', otherMethod: 'その他',
    skipjack: 'カツオ', tuna: 'マグロ', saury: 'サンマ', mackerel: 'サバ', other: 'その他', otherSpecies: '魚の名前',
    saveProfile: '保存してはじめる', detailsReq: '名前・母港・魚を1つ以上入力してください。', orgReq: '名前を入力してください。',
    hello: 'こんにちは', todayQ: '今日、どんな魚が入りそうですか？', todayBody: '分かる範囲で大丈夫。見込みでも入力できます。',
    board: '今後7日間の入港見込み', boardEmpty: '入力すると、ここに入港のグラフが現れます。', total: '合計', today: '今日', kg: 'kg',
    newCatch: '魚の見通しを入力', myCatches: '入力した見通し', emptyTitle: 'まだ入力はありません', emptyBody: 'まずは魚の種類と量を入れてみましょう。',
    fleet: '全体の見込み', fleetBody: '3人以上の報告があるときだけ、合計が表示されます。個人の入力は見えません。', fleetNone: 'まだ集計できる報告が足りません。',
    fleetKg: 'の入港見込み（確認済み含む）', openProcessor: '加工会社のワークスペースを開く', procBody: '注文と在庫を確認し、供給の不足を見つけます。',
    storedLocal: 'この端末のみに保存されています（ログインするとクラウドに保存）', storedCloud: 'クラウドに保存・同期されています',
    quantity: 'どれくらい？', quantityHint: 'おおよその量でも大丈夫です。', date: '入港日', time: '入港時間（任意）', port: '入港する港', portPlaceholder: '例：気仙沼港', portOther: '他の港は、そのまま入力してください。',
    certainty: '今の状況', expected: 'まだ見込み', confirmed: '漁獲量を確認済み', notes: 'ひとこと（任意）', notesPlaceholder: '例：天候によって時間が変わるかもしれません',
    review: '内容を確認', back: '← 戻る', reviewTitle: 'これで合っていますか？', reviewBody: '保存する前に、魚の種類・量・時間を確認してください。', save: '保存する', edit: '修正する',
    savedTitle: '保存しました', savedBody: 'これは取引や出荷の依頼ではなく、見込みの共有です。', returnToday: '今日の画面へ', addAnother: 'もう1件入力',
    recordTitle: '入力した魚の見通し', arrival: '入港予定', state: '状況', remove: 'この入力を削除', removeConfirm: 'この入力を削除しますか？', cancel: 'やめる', deleteNow: '削除する',
    validation: '魚の名前、量、入港日、港を入力してください。', storageError: '保存できませんでした。', syncFail: 'クラウドに送れませんでした。端末には保存しました。',
    tabPulse: '詳細', tabToday: '今日', tabCatch: '入力', tabMe: '私', profile: 'プロフィール', editProfile: 'プロフィールを編集', signout: 'ログアウト', clear: '端末のデータを消去', clearConfirm: 'この端末の入力をすべて削除しますか？',
    cleared: '消去しました。', language: '言語', feedbackTitle: 'ご意見をください', useful: '仕事で使いたいですか？', yes: '使いたい', maybe: '少し変えれば', no: '今は不要',
    easy: '入力は分かりやすいですか？', easyYes: '分かりやすい', easyMaybe: '少し難しい', easyNo: '難しい', change: '変えてほしいこと（任意）', feedbackSave: '送る', thanks: 'ありがとうございます', feedbackRequired: '2つの質問に回答してください。',
    install: 'ホーム画面に追加', installBody: 'iPhone：Safariの共有 → ホーム画面に追加。Android：Chromeのメニュー → アプリをインストール。', download: 'データを書き出す',
    timezone: '時刻は日本時間です。', change2: '変更', skip: 'あとで',
  },
  en: {
    photoAdd: 'Add a photo', photoChange: 'Change photo', photoRemove: 'Remove photo', photoLocal: 'Your photo stays on this device only.', photoError: 'Could not read that photo.',
    accessTitle: 'Do you want to sign in?', accessBody: 'Signing in saves your entries to the cloud so you can use them on other devices.', accessLogin: 'Sign in and use the app', accessLoginHint: 'Just an email link. No password.', accessSkip: 'Just use the app', accessSkipHint: 'Saved on this device only. You can sign in later.',
    sureTitle: 'Are you sure?', sureLeave: 'Do you want to leave the app?', sureDiscard: 'What you entered will not be saved. Discard it and go back?', stay: 'Stay', leave: 'Leave', discard: 'Discard and go back',
    tagline: 'From Kesennuma’s harbor to the factory, one clear view of the catch.', welcomeBody: 'Today’s fish, quantity and arrival time. What you enter helps Kesennuma processors know whether supply will cover the order.', place: 'Kesennuma, Miyagi',
    start: 'Get started', whoTitle: 'Who are you?', whoBody: 'We’ll shape the screens and questions to fit. You can change this later.',
    fisherman: 'Fisherman', fishermanD: 'Log your own expected catch', captain: 'Captain', captainD: 'Report landings for your vessel and crew',
    processor: 'Processor', processorD: 'Track orders, stock and supply gaps', other: 'Other', otherD: 'Market, research, government or just curious',
    signinTitle: 'Sign in with email', signinBody: 'No password. Just open the link we email you.', email: 'Email address', sendLink: 'Email me a sign-in link',
    linkSent: 'Check your email', linkSentBody: 'Open the link in your inbox and you’ll land back here. If it doesn’t arrive, check spam.', badEmail: 'Please check the email address.', sendFail: 'Could not send. Please try again shortly.',
    detailsTitle: 'About you', detailsBody: 'What a processor needs to understand your outlook. You can edit it any time.',
    whichFish: 'Which fish?', name: 'Your name (a nickname is fine)', vessel: 'Vessel name', vesselPh: 'Example: Daisan Kaiko-maru', reg: 'Vessel registration no. (optional)', homePort: 'Home port', homePortPh: 'Example: Kesennuma',
    method: 'Main fishing method', species: 'Fish you mainly catch (select any)', capacity: 'Typical landing size (kg)', phone: 'Phone (optional)', phoneHint: 'Never shared directly with processors.',
    company: 'Company or organization', location: 'Location', interest: 'Species you handle', orgPh: 'Example: Kesennuma Suisan',
    poleline: 'Pole-and-line', purse: 'Purse seine', setnet: 'Set net', trawl: 'Trawl', longline: 'Longline', gillnet: 'Gillnet', otherMethod: 'Other',
    skipjack: 'Skipjack', tuna: 'Tuna', saury: 'Pacific saury', mackerel: 'Mackerel', other: 'Other', otherSpecies: 'Fish name',
    saveProfile: 'Save and continue', detailsReq: 'Enter your name, home port and at least one fish.', orgReq: 'Please enter a name.',
    hello: 'Hello', todayQ: 'What fish do you expect today?', todayBody: 'Enter what you know. An estimate is fine.',
    board: 'Expected arrivals · next 7 days', boardEmpty: 'Add a catch and your arrivals chart appears here.', total: 'Total', today: 'Today', kg: 'kg',
    newCatch: 'Add a catch estimate', myCatches: 'Your estimates', emptyTitle: 'No entries yet', emptyBody: 'Start with the fish and an approximate quantity.',
    fleet: 'Overall outlook', fleetBody: 'Totals appear only when 3 or more people have reported. Individual entries are never shown.', fleetNone: 'Not enough reports to show a total yet.',
    fleetKg: 'expected to land (incl. confirmed)', openProcessor: 'Open the processor workspace', procBody: 'Review orders and stock, and spot supply gaps.',
    storedLocal: 'Saved on this device only (sign in to save to the cloud)', storedCloud: 'Saved and synced to the cloud',
    quantity: 'How much?', quantityHint: 'An approximate quantity is fine.', date: 'Arrival date', time: 'Arrival time (optional)', port: 'Arrival port', portPlaceholder: 'Example: Kesennuma', portOther: 'For another port, just type its name.',
    certainty: 'How certain is it?', expected: 'Still an estimate', confirmed: 'Catch quantity checked', notes: 'Anything else? (optional)', notesPlaceholder: 'Example: Arrival may change with the weather',
    review: 'Review the details', back: '← Back', reviewTitle: 'Does this look right?', reviewBody: 'Check the fish, quantity and arrival before saving.', save: 'Save', edit: 'Change details',
    savedTitle: 'Saved', savedBody: 'This shares an outlook. It is not a trade or a delivery request.', returnToday: 'Back to today', addAnother: 'Add another',
    recordTitle: 'Your catch estimate', arrival: 'Expected arrival', state: 'Status', remove: 'Delete this entry', removeConfirm: 'Delete this entry?', cancel: 'Cancel', deleteNow: 'Delete entry',
    validation: 'Enter the fish name, quantity, arrival date and port.', storageError: 'Could not save.', syncFail: 'Could not reach the cloud. Saved on this device.',
    tabPulse: 'Details', tabToday: 'Today', tabCatch: 'Add', tabMe: 'Me', profile: 'Profile', editProfile: 'Edit profile', signout: 'Sign out', clear: 'Clear this device’s data', clearConfirm: 'Delete everything saved on this device?',
    cleared: 'Cleared.', language: 'Language', feedbackTitle: 'Tell us what you think', useful: 'Would you use this for work?', yes: 'Yes', maybe: 'With changes', no: 'Not now',
    easy: 'Was it easy to enter a catch?', easyYes: 'Easy', easyMaybe: 'A little hard', easyNo: 'Hard', change: 'What would you change? (optional)', feedbackSave: 'Send', thanks: 'Thank you', feedbackRequired: 'Please answer both questions.',
    install: 'Add to home screen', installBody: 'iPhone: Safari → Share → Add to Home Screen. Android: Chrome menu → Install app.', download: 'Export my data',
    timezone: 'Times are in Japan time.', change2: 'Change', skip: 'Later',
  },
};

// ------------------------------------------------------------------ state

const S = {
  lang: 'ja', screen: 'welcome', role: null, profile: null, records: [], feedback: [],
  draft: null, editingId: null, selected: null, confirmDelete: false, confirmClear: false,
  authSent: false, cloud: false, busy: false,
};
const t = (k) => COPY[S.lang][k] ?? k;
const isFisher = () => FISHERS.includes(S.profile?.role || S.role);

try {
  S.lang = localStorage.getItem(LANG_KEY) || 'ja'; // Japanese first
  const d = JSON.parse(localStorage.getItem(KEY) || '{}');
  S.profile = d.profile || null;
  S.records = Array.isArray(d.records) ? d.records : [];
  S.feedback = Array.isArray(d.feedback) ? d.feedback : [];
} catch {}
if (!COPY[S.lang]) S.lang = 'ja';

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ profile: S.profile, records: S.records, feedback: S.feedback }));
    return true;
  } catch { toast(t('storageError')); return false; }
}

// ------------------------------------------------------------------ helpers

const main = document.getElementById('main');
function el(tag, props = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === false || v == null) continue;
    if (k === 'on') for (const [e, f] of Object.entries(v)) n.addEventListener(e, f);
    else if (k === 'class') n.className = v;
    else if (k === 'style') n.style.cssText = v; // CSSOM, allowed by the strict CSP (unlike a style attribute)
    else n.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}
const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, ...kids) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  for (const c of kids) n.append(c);
  return n;
}
const btn = (text, on, cls = 'primary') => el('button', { type: 'button', class: cls, on: { click: on } }, text);
function toast(text) {
  const n = document.getElementById('message');
  n.textContent = text; n.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => { n.classList.remove('show'); n.textContent = ''; }, 3200);
}
const jst = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const addDays = (iso, n) => { const d = new Date(`${iso}T12:00:00+09:00`); d.setDate(d.getDate() + n); return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(d); };
function dateText(v, opts = { month: 'short', day: 'numeric' }) {
  const d = new Date(`${v}T12:00:00+09:00`);
  return Number.isNaN(+d) ? v : new Intl.DateTimeFormat(S.lang === 'ja' ? 'ja-JP' : 'en-GB', { timeZone: 'Asia/Tokyo', ...opts }).format(d);
}
const fishName = (r) => (SPECIES.includes(r.species) ? t(r.species) : r.species);
const num = (n) => new Intl.NumberFormat(S.lang === 'ja' ? 'ja-JP' : 'en-GB').format(n);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function countUp(node, to) {
  if (reduced() || !to) { node.textContent = num(to); return; }
  const start = performance.now(), dur = 900;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / dur);
    node.textContent = num(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ------------------------------------------------------------------ ocean scene (decorative background)
const rnd = (a, b) => a + Math.random() * (b - a);
function oceanScene(bubbles, fish, cls = '') {
  const kids = [];
  for (let i = 0; i < bubbles; i++) {
    kids.push(el('span', { class: 'bubble', style: `--x:${rnd(2, 96).toFixed(1)}%;--s:${rnd(6, 26).toFixed(0)}px;--t:${rnd(7, 16).toFixed(1)}s;--d:${(-rnd(0, 14)).toFixed(1)}s;--w:${rnd(8, 28).toFixed(0)}px` }));
  }
  for (let i = 0; i < fish; i++) {
    const rtl = i % 2 === 1;
    kids.push(el('span', { class: `sfish${rtl ? ' sfish--rtl' : ''}`, style: `--y:${rnd(10, 82).toFixed(0)}%;--s:${rnd(34, 78).toFixed(0)}px;--t:${rnd(16, 34).toFixed(0)}s;--d:${(-rnd(0, 30)).toFixed(0)}s` },
      svg('svg', { viewBox: '0 0 32 32', 'aria-hidden': 'true' }, svg('path', { d: 'M2 16c4-6 10-8.5 17-5l8-5v20l-8-5c-7 3.5-13 1-17-5z', fill: 'currentColor' }))));
  }
  return el('div', { class: `scene ${cls}`, 'aria-hidden': 'true' }, kids);
}

const ICON = {
  pulse: 'M3 12h4l2.5-6 4 12 2.5-6H21',
  today: 'M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  add: 'M12 5v14M5 12h14',
  me: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  fisherman: 'M3 16c3 0 3-2 6-2s3 2 6 2 3-2 6-2M3 20c3 0 3-2 6-2s3 2 6 2 3-2 6-2M12 3l5 8H7z',
  captain: 'M12 3v12M5 15l7 6 7-6M8 7h8',
  processor: 'M3 21V9l6 4V9l6 4V5h6v16z',
  other: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v5M12 16v.01',
};
// Gyosoku role artwork, drawn in the logo's own colors: navy tuna/boat/factory, teal waves, orange sun. Each has its own gentle motion (see CSS).
function roleIcon(name) {
  const NAVY = '#17478f', DEEP = '#0c2c57', TEAL = '#17b3a6', TEAL2 = '#7fdcd2', SUN = '#ff8a4c', PAPER = '#f5f1e6';
  const A = { viewBox: '0 0 40 40', width: 40, height: 40, 'aria-hidden': 'true', class: `ri ri--${name}` };
  const P = (d, fill, cls, extra = {}) => svg('path', { d, fill, ...(cls ? { class: cls } : {}), ...extra });
  const C = (cx, cy, r, fill, cls) => svg('circle', { cx, cy, r, fill, ...(cls ? { class: cls } : {}) });
  const waves = () => svg('g', { class: 'ri__wave' },
    P('M2 30c3.5-3.5 7-3.5 10.5 0s7 3.5 10.5 0 7-3.5 10.5 0 3.5 2 4.5 1V40H2z', TEAL),
    P('M2 34.5c3.5-3 7-3 10.5 0s7 3 10.5 0 7-3 10.5 0 3.5 1.5 4.5.7V40H2z', TEAL2, null, { opacity: '.9' }));
  if (name === 'fisherman') return svg('svg', A,
    C(33, 9, 2.8, SUN, 'ri__sun'),
    svg('g', { class: 'ri__fish' },
      P('M4 19.5c4-7.5 11.5-10.5 20-6.5l9-5v21l-9-5c-8.5 4-16 1-20-4.5z', NAVY),
      P('M15 12.5l3-4.5 3.5 5z', DEEP), P('M9 20.5c5 3.5 12 3.5 17 0', 'none', null, { stroke: TEAL2, 'stroke-width': 1.3, 'stroke-linecap': 'round' }),
      C(9.5, 17, 1.3, PAPER)),
    waves());
  if (name === 'captain') return svg('svg', A,
    C(8, 10, 3, SUN, 'ri__sun'),
    svg('g', { class: 'ri__boat' },
      P('M4 23h32l-4.5 8H8.5z', NAVY), P('M11 23v-7h11v7z', PAPER), P('M13.5 18.5h2.5v2.5h-2.5zM18 18.5h2.5v2.5H18z', NAVY),
      P('M26 23V8l8 11z', PAPER, null, { stroke: NAVY, 'stroke-width': 1.2, 'stroke-linejoin': 'round' }), P('M26 6v17', 'none', null, { stroke: DEEP, 'stroke-width': 1.6, 'stroke-linecap': 'round' })),
    waves());
  if (name === 'processor') return svg('svg', A,
    C(33, 9, 2.8, SUN, 'ri__sun'),
    P('M5 31V17l10 5.5V17l10 5.5V10h5v21z', NAVY),
    P('M26 6.5c0-2 2.5-2 2.5-4.5', 'none', 'ri__steam', { stroke: TEAL2, 'stroke-width': 2, 'stroke-linecap': 'round' }),
    P('M9 25h3v3H9zM15 25h3v3h-3zM21 25h3v3h-3z', PAPER),
    waves());
  return svg('svg', A,
    C(20, 20, 8, SUN, 'ri__sun'),
    P('M6 22c3.4-5 7-5 10.5 0M17 22c3.4-5 7-5 10.5 0M28 22c3.4-5 7-5 6 0', 'none', 'ri__rays', { stroke: NAVY, 'stroke-width': 1.6, 'stroke-linecap': 'round' }),
    waves());
}
const icon = (name) => svg('svg', { viewBox: '0 0 24 24', width: 24, height: 24, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, svg('path', { d: ICON[name] }));

function waves() {
  const w = (cls, d, o) => svg('path', { d, class: cls, fill: 'currentColor', opacity: o });
  const a = 'M0 60 C 120 20 240 100 360 60 S 600 20 720 60 S 960 100 1080 60 S 1320 20 1440 60 V120 H0Z';
  return svg('svg', { class: 'waves', viewBox: '0 0 1440 120', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
    w('wave w1', a, 0.18), w('wave w2', a, 0.3), w('wave w3', a, 1));
}

// ------------------------------------------------------------------ data

function fromRow(r) {
  return { id: r.id, remote: true, species: r.species, quantity: Number(r.quantity_kg), date: r.arrival_date, time: (r.arrival_time || '').slice(0, 5), port: r.port, certainty: r.certainty, notes: r.notes || '' };
}

function weekBuckets() {
  const start = jst();
  const days = Array.from({ length: 7 }, (_, i) => ({ date: addDays(start, i), kg: 0, confirmed: 0 }));
  for (const r of S.records) {
    const d = days.find((x) => x.date === r.date);
    if (!d) continue;
    d.kg += Number(r.quantity);
    if (r.certainty === 'confirmed') d.confirmed += Number(r.quantity);
  }
  return days;
}

function boardView() {
  const days = weekBuckets();
  const total = days.reduce((a, d) => a + d.kg, 0);
  const max = Math.max(...days.map((d) => d.kg), 1);
  const totalNode = el('span', { class: 'count' }, '0');
  const bars = days.map((d, i) => {
    const h = Math.max(d.kg ? 8 : 3, Math.round((d.kg / max) * 100));
    const conf = d.kg ? Math.round((d.confirmed / d.kg) * 100) : 0;
    return el('div', { class: `bar${i === 0 ? ' now' : ''}`, role: 'img', 'aria-label': `${dateText(d.date)} ${num(d.kg)} kg` },
      el('span', { class: 'bar__v' }, d.kg ? num(d.kg) : ''),
      el('div', { class: 'bar__track' }, d.kg ? el('div', { class: 'bar__fill', style: `--h:${h}%;--d:${i * 70}ms` }, conf ? el('i', { style: `height:${conf}%` }) : null) : null),
      el('span', { class: 'bar__l' }, i === 0 ? t('today') : dateText(d.date, { day: 'numeric' })));
  });
  queueMicrotask(() => countUp(totalNode, total));
  return el('section', { class: 'board' },
    el('img', { class: 'board__logo', src: '/public/logo.png', alt: '', width: 44, height: 44 }),
    el('p', { class: 'eyebrow' }, t('board')),
    el('p', { class: 'board__total' }, totalNode, el('small', {}, ` ${t('kg')}`)),
    total ? el('div', { class: 'bars' }, bars) : el('p', { class: 'board__empty' }, t('boardEmpty')),
    waves());
}

// ------------------------------------------------------------------ screens

function welcomeView() {
  return [el('section', { class: 'hero' },
    oceanScene(16, 0), el('div', { class: 'hero__sun', 'aria-hidden': 'true' }),
    el('img', { class: 'hero-logo', src: '/public/logo.png', alt: 'Gyosoku', width: 104, height: 104 }), el('p', { class: 'eyebrow' }, 'GYOSOKU · 魚測'), el('p', { class: 'place' }, el('img', { src: '/public/logo.png', alt: '', width: 20, height: 20 }), t('place')),
    el('h1', { tabindex: '-1' }, t('tagline')),
    el('p', { class: 'lead' }, t('welcomeBody')),
    btn(t('start'), () => go('role'), 'primary glow'),
    waves())];
}

function roleView() {
  return [el('h1', { tabindex: '-1' }, t('whoTitle')), el('p', { class: 'muted' }, t('whoBody')),
    el('div', { class: 'roles' }, ROLES.map((r, i) => el('button', { type: 'button', class: 'role', style: `--i:${i}`, on: { click: () => chooseRole(r) } },
      el('span', { class: 'role__icon' }, roleIcon(r)), el('strong', {}, t(r)), el('span', {}, t(`${r}D`)))))];
}

function accessView() {
  return [el('h1', { tabindex: '-1' }, t('accessTitle')), el('p', { class: 'muted' }, t('accessBody')),
    el('div', { class: 'access' },
      el('button', { type: 'button', class: 'choice-card choice-card--main', on: { click: () => go('auth') } }, el('strong', {}, t('accessLogin')), el('span', {}, t('accessLoginHint'))),
      el('button', { type: 'button', class: 'choice-card', on: { click: () => go('details') } }, el('strong', {}, t('accessSkip')), el('span', {}, t('accessSkipHint'))))];
}

function authView() {
  const form = el('form', { on: { submit: async (e) => {
    e.preventDefault();
    const email = new FormData(form).get('email').trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return toast(t('badEmail'));
    S.busy = true; render();
    const ok = await backend.sendMagicLink(email);
    S.busy = false;
    if (!ok) { render(); return toast(t('sendFail')); }
    S.authSent = true; render();
  } } },
    el('label', { for: 'email' }, t('email')),
    el('input', { id: 'email', name: 'email', type: 'email', required: true, autocomplete: 'email', inputmode: 'email' }),
    el('div', { class: 'actions' }, el('button', { type: 'submit', class: 'primary glow', disabled: S.busy }, t('sendLink'))));
  if (S.authSent) return [el('div', { class: 'card sent' }, el('img', { class: 'envelope', src: '/public/logo.png', alt: '', width: 84, height: 84 }), el('h2', { tabindex: '-1' }, t('linkSent')), el('p', { class: 'muted' }, t('linkSentBody')))];
  return [btn(t('back'), () => go('access'), 'quiet back'), el('h1', { tabindex: '-1' }, t('signinTitle')), el('p', { class: 'muted' }, t('signinBody')), form];
}

const KESENNUMA_PORTS = ['気仙沼港'];
function portList() { return el('datalist', { id: 'ports' }, KESENNUMA_PORTS.map((v) => el('option', { value: v }))); }
const field = (label, name, p = {}, value = '') => [el('label', { for: name }, label), el('input', { id: name, name, value, ...p })];
function chips(name, keys, selected, single = false) {
  return el('div', { class: 'choices' }, keys.map((k) => el('label', { class: 'choice' },
    el('input', { type: single ? 'radio' : 'checkbox', name, value: k, checked: selected.includes(k) }), t(k))));
}

function detailsView() {
  const role = S.profile?.role || S.role;
  const p = S.profile || {};
  const fisher = FISHERS.includes(role);
  const form = el('form', { on: { submit: async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const g = (k) => (f.get(k) || '').toString().trim();
    const species = f.getAll('species');
    if (fisher && (!g('name') || !g('homePort') || !species.length)) return toast(t('detailsReq'));
    if (!fisher && !g('name')) return toast(t('orgReq'));
    S.profile = { photo: p.photo || '', role, name: g('name'), vessel: g('vessel'), reg: g('reg'), homePort: g('homePort'), method: g('method'), species, capacity: Number(g('capacity')) || null, phone: g('phone'), company: g('company'), location: g('location') };
    if (!persist()) return;
    if (backend.getSession()) {
      const { name, role: _r, photo: _photo, ...details } = S.profile; // the photo stays on this device
      if (!(await backend.saveProfile(role, name, details))) toast(t('syncFail'));
    }
    go(role === 'processor' ? 'today' : 'today');
  } } },
    field(t('name'), 'name', { required: true, maxlength: 40, autocomplete: 'nickname' }, p.name || ''),
    fisher ? [
      field(t('vessel'), 'vessel', { maxlength: 60, placeholder: t('vesselPh') }, p.vessel || ''),
      field(t('reg'), 'reg', { maxlength: 30, autocapitalize: 'characters' }, p.reg || ''),
      field(t('homePort'), 'homePort', { required: true, maxlength: 80, placeholder: t('homePortPh'), list: 'ports' }, p.homePort || '' ), portList(),
      el('fieldset', {}, el('legend', {}, t('method')), el('div', {}, el('select', { name: 'method', id: 'method' }, el('option', { value: '' }, '—'), METHODS.map((m) => el('option', { value: m, selected: p.method === m }, t(m)))))),
      el('fieldset', {}, el('legend', {}, t('species')), chips('species', SPECIES, p.species || [])),
      el('label', { for: 'capacity' }, t('capacity')),
      el('div', { class: 'unit-input' }, el('input', { id: 'capacity', name: 'capacity', type: 'number', inputmode: 'numeric', min: 1, max: 1000000, value: p.capacity || '' }), el('span', {}, 'kg')),
      field(t('phone'), 'phone', { type: 'tel', maxlength: 30, autocomplete: 'tel' }, p.phone || ''),
      el('p', { class: 'hint' }, t('phoneHint')),
    ] : [
      field(t('company'), 'company', { maxlength: 80, placeholder: t('orgPh') }, p.company || ''),
      field(t('location'), 'location', { maxlength: 80 }, p.location || ''),
      el('fieldset', {}, el('legend', {}, t('interest')), chips('species', SPECIES, p.species || [])),
    ],
    el('div', { class: 'actions' }, el('button', { type: 'submit', class: 'primary glow' }, t('saveProfile'))));
  return [el('h1', { tabindex: '-1' }, t('detailsTitle')), el('p', { class: 'muted' }, t('detailsBody')), form];
}

function fleetCard() {
  const node = el('div', { class: 'card fleet' }, el('p', { class: 'eyebrow dark' }, t('fleet')), el('p', { class: 'muted small' }, t('fleetBody')));
  if (backend.getSession()) {
    const sp = S.profile?.species?.[0] || 'skipjack';
    backend.expectedLandings(sp, addDays(jst(), 7)).then((r) => {
      node.append(r ? el('p', { class: 'big' }, `${num(Math.round(r.expected_kg))} kg`, el('small', {}, ` ${t(sp)} · ${t('fleetKg')}`)) : el('p', { class: 'hint' }, t('fleetNone')));
    });
  } else node.append(el('p', { class: 'hint' }, t('fleetNone')));
  return node;
}

function todayView() {
  const p = S.profile || {};
  const nodes = [
    el('p', { class: 'eyebrow dark' }, dateText(jst(), { month: 'long', day: 'numeric', weekday: 'short' })),
    el('div', { class: 'hello' }, p.photo ? avatarNode(p, 'mini') : null, el('h1', { tabindex: '-1' }, `${t('hello')}${S.lang === 'ja' ? '、' : ', '}${p.name || ''}`)),
    el('p', { class: 'muted' }, isFisher() ? t('todayQ') : t('procBody')),
  ];
  if (isFisher()) {
    nodes.push(boardView(), btn(t('newCatch'), startCatch, 'primary glow'));
    nodes.push(S.records.length
      ? el('div', {}, el('h2', { class: 'section' }, t('myCatches')), S.records.slice().sort((a, b) => b.date.localeCompare(a.date)).map((r, i) =>
        el('button', { class: 'record', style: `--i:${i}`, type: 'button', on: { click: () => { S.selected = r.id; go('detail'); } } },
          el('strong', {}, `${fishName(r)} · ${num(r.quantity)} kg`), el('span', {}, `${dateText(r.date)} ${r.time || ''} · ${r.port}`), el('span', { class: `pill ${r.certainty}` }, t(r.certainty)))))
      : el('div', { class: 'card empty' }, el('img', { class: 'empty__logo', src: '/public/logo.png', alt: '', width: 72, height: 72 }), el('h2', {}, t('emptyTitle')), el('p', { class: 'muted' }, t('emptyBody'))));
  } else {
    nodes.push(el('a', { class: 'primary glow linkbtn', href: '/app/' }, t('openProcessor') + ' ↗'));
  }
  nodes.push(fleetCard(), el('p', { class: 'hint' }, backend.getSession() ? t('storedCloud') : t('storedLocal')));
  return nodes;
}

function startCatch() {
  S.editingId = null;
  S.draft = { species: S.profile?.species?.[0] || 'skipjack', otherSpecies: '', quantity: '', date: jst(), time: '', port: S.profile?.homePort || '気仙沼港', certainty: 'expected', notes: '' };
  go('catch');
}

function catchView() {
  const d = S.draft;
  const other = el('div', {}, ...field(t('otherSpecies'), 'otherSpecies', { maxlength: 50 }, d.otherSpecies));
  const sel = el('select', { id: 'species', name: 'species' }, [...SPECIES, 'other'].map((k) => el('option', { value: k, selected: d.species === k }, t(k))));
  const sync = () => { other.hidden = sel.value !== 'other'; other.querySelector('input').required = !other.hidden; };
  sel.addEventListener('change', sync); sync();
  const form = el('form', { id: 'catch-form', on: { submit: (e) => {
    e.preventDefault();
    S.draft = Object.fromEntries(new FormData(form));
    S.draft.port = S.draft.port.trim(); S.draft.otherSpecies = S.draft.otherSpecies.trim();
    if (!S.draft.port || (S.draft.species === 'other' && !S.draft.otherSpecies) || !(Number(S.draft.quantity) > 0)) return toast(t('validation'));
    go('review');
  } } },
    el('label', { for: 'species' }, t('whichFish')), sel, other,
    el('label', { for: 'quantity' }, t('quantity')),
    el('div', { class: 'unit-input' }, el('input', { id: 'quantity', name: 'quantity', type: 'number', inputmode: 'decimal', min: '0.1', max: '1000000', step: '0.1', required: true, value: d.quantity, placeholder: '800' }), el('span', {}, 'kg')),
    el('p', { class: 'hint' }, t('quantityHint')),
    el('div', { class: 'row' }, el('div', {}, ...field(t('date'), 'date', { type: 'date', required: true }, d.date)), el('div', {}, ...field(t('time'), 'time', { type: 'time' }, d.time))),
    el('p', { class: 'hint' }, t('timezone')),
    ...field(t('port'), 'port', { required: true, maxlength: 80, placeholder: t('portPlaceholder'), list: 'ports' }, d.port), portList(), el('p', { class: 'hint' }, t('portOther')),
    el('fieldset', {}, el('legend', {}, t('certainty')), chips('certainty', ['expected', 'confirmed'], [d.certainty], true)),
    el('label', { for: 'notes' }, t('notes')), el('textarea', { id: 'notes', name: 'notes', maxlength: 500, placeholder: t('notesPlaceholder') }, d.notes),
    el('div', { class: 'actions' }, el('button', { type: 'submit', class: 'primary glow' }, t('review'))));
  return [btn(t('back'), backFromCatch, 'quiet back'), el('h1', { tabindex: '-1' }, t('newCatch')), el('p', { class: 'muted' }, t('todayBody')), form];
}

function summary(r) {
  return el('div', { class: 'card ticket' }, el('span', { class: `pill ${r.certainty}` }, t(r.certainty)), el('h2', {}, fishName(r)), el('p', { class: 'big' }, `${num(r.quantity)} kg`),
    el('dl', { class: 'summary' }, [[t('arrival'), `${dateText(r.date)} ${r.time || ''}`], [t('port'), r.port], ...(r.notes ? [[t('notes'), r.notes]] : [])].map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))),
    el('p', { class: 'hint' }, t('timezone')));
}

function reviewView() {
  return [el('h1', { tabindex: '-1' }, t('reviewTitle')), el('p', { class: 'muted' }, t('reviewBody')), summary(S.draft),
    el('div', { class: 'actions' }, el('button', { type: 'button', class: 'primary glow', disabled: S.busy, on: { click: saveRecord } }, t('save')), btn(t('edit'), () => go('catch'), 'secondary'))];
}

async function saveRecord() {
  S.busy = true; render();
  const rec = { ...S.draft, quantity: Number(S.draft.quantity), id: S.editingId || crypto.randomUUID(), createdAt: new Date().toISOString() };
  if (backend.getSession()) {
    const existing = S.records.find((r) => r.id === S.editingId);
    if (existing?.remote) { if (await backend.updateCatch(existing.id, rec)) rec.remote = true; else toast(t('syncFail')); }
    else {
      const row = await backend.saveCatch(rec);
      if (row) { rec.id = row.id; rec.remote = true; } else toast(t('syncFail'));
    }
  }
  S.busy = false;
  S.records = S.editingId ? S.records.map((r) => (r.id === S.editingId ? rec : r)) : [...S.records, rec];
  if (persist()) { S.selected = rec.id; go('saved'); } else render();
}

function detailView(saved) {
  const r = S.records.find((x) => x.id === S.selected);
  if (!r) return todayView();
  return [el('h1', { tabindex: '-1' }, t(saved ? 'savedTitle' : 'recordTitle')), saved ? el('div', { class: 'check', 'aria-hidden': 'true' }, '✓') : null, saved ? el('p', { class: 'muted' }, t('savedBody')) : null, summary(r),
    el('div', { class: 'actions' }, btn(t('returnToday'), () => go('today')), saved ? btn(t('addAnother'), startCatch, 'secondary') : btn(t('edit'), () => { S.editingId = r.id; S.draft = { ...r, otherSpecies: SPECIES.includes(r.species) ? '' : r.species, species: SPECIES.includes(r.species) ? r.species : 'other' }; go('catch'); }, 'secondary')),
    saved ? null : S.confirmDelete
      ? el('div', { class: 'card' }, el('p', {}, t('removeConfirm')), btn(t('deleteNow'), async () => {
        if (r.remote) await backend.deleteCatch(r.id);
        S.records = S.records.filter((x) => x.id !== r.id);
        if (persist()) go('today');
      }, 'secondary'), btn(t('cancel'), () => { S.confirmDelete = false; render(); }, 'quiet'))
      : btn(t('remove'), () => { S.confirmDelete = true; render(); }, 'quiet')];
}

// Profile photo: picked from the camera or gallery, cropped to a square and shrunk, stored on this device only.
async function pickPhoto(file) {
  if (!file || !file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) return toast(t('photoError'));
  try {
    const bmp = await createImageBitmap(file);
    const size = 256, c = document.createElement('canvas'); c.width = c.height = size;
    const m = Math.min(bmp.width, bmp.height);
    c.getContext('2d').drawImage(bmp, (bmp.width - m) / 2, (bmp.height - m) / 2, m, m, 0, 0, size, size);
    S.profile = { ...(S.profile || {}), photo: c.toDataURL('image/jpeg', 0.82) };
    if (persist()) render();
  } catch { toast(t('photoError')); }
}
const avatarNode = (p, cls = 'avatar') => (p.photo ? el('img', { class: `${cls} ${cls}--img`, src: p.photo, alt: '' }) : el('div', { class: cls, 'aria-hidden': 'true' }, (p.name || '?').slice(0, 1).toUpperCase()));

function meView() {
  const p = S.profile || {};
  const rows = [[t('name'), p.name], [t('vessel'), p.vessel], [t('homePort'), p.homePort], [t('method'), p.method && t(p.method)], [t('species'), (p.species || []).map(t).join(' · ')], [t('company'), p.company], [t('location'), p.location]].filter(([, v]) => v);
  const fb = el('form', { on: { submit: (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(fb));
    if (!data.useful || !data.easy) return toast(t('feedbackRequired'));
    S.feedback = [...S.feedback, { ...data, createdAt: new Date().toISOString() }];
    if (persist()) { toast(t('thanks')); fb.reset(); }
  } } },
    el('fieldset', {}, el('legend', {}, t('useful')), el('div', { class: 'choices' }, ['yes', 'maybe', 'no'].map((k) => el('label', { class: 'choice' }, el('input', { type: 'radio', name: 'useful', value: k, required: true }), t(k))))),
    el('fieldset', {}, el('legend', {}, t('easy')), el('div', { class: 'choices' }, ['easyYes', 'easyMaybe', 'easyNo'].map((k) => el('label', { class: 'choice' }, el('input', { type: 'radio', name: 'easy', value: k, required: true }), t(k))))),
    el('label', { for: 'change' }, t('change')), el('textarea', { id: 'change', name: 'change', maxlength: 1000 }),
    el('div', { class: 'actions' }, el('button', { type: 'submit', class: 'primary' }, t('feedbackSave'))));
  const file = el('input', { type: 'file', accept: 'image/*', class: 'sr-file', 'aria-label': p.photo ? t('photoChange') : t('photoAdd'), on: { change: () => { pickPhoto(file.files[0]); file.value = ''; } } });
  return [el('div', { class: 'photo' }, el('label', { class: 'photo__pick' }, avatarNode(p), el('span', { class: 'photo__badge', 'aria-hidden': 'true' }, '+'), file),
      el('div', { class: 'photo__text' }, el('strong', {}, p.photo ? t('photoChange') : t('photoAdd')), el('span', {}, t('photoLocal')),
        p.photo ? el('button', { type: 'button', class: 'quiet photo__rm', on: { click: () => { S.profile = { ...S.profile, photo: '' }; if (persist()) render(); } } }, t('photoRemove')) : null)),
    el('h1', { tabindex: '-1' }, p.name || t('profile')), el('span', { class: 'pill' }, t(p.role || S.role || 'other')),
    el('div', { class: 'card' }, el('dl', { class: 'summary' }, rows.map(([k, v]) => el('div', {}, el('dt', {}, k), el('dd', {}, v)))), btn(t('editProfile'), () => go('details'), 'secondary')),
    el('details', { class: 'card' }, el('summary', {}, t('feedbackTitle')), fb),
    el('details', { class: 'card' }, el('summary', {}, t('install')), el('p', { class: 'hint' }, t('installBody'))),
    el('div', { class: 'actions' }, btn(t('download'), exportData, 'secondary'),
      backend.getSession() ? btn(t('signout'), () => { backend.signOut(); S.records = []; S.profile = null; S.role = null; persist(); go('welcome'); }, 'quiet') : null,
      S.confirmClear ? el('div', { class: 'card' }, el('p', {}, t('clearConfirm')), btn(t('clear'), () => { S.records = []; S.feedback = []; S.profile = null; S.confirmClear = false; persist(); toast(t('cleared')); go('welcome'); }, 'secondary'), btn(t('cancel'), () => { S.confirmClear = false; render(); }, 'quiet')) : btn(t('clear'), () => { S.confirmClear = true; render(); }, 'quiet'))];
}

function exportData() {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ app: 'Gyosoku', exportedAt: new Date().toISOString(), profile: S.profile, records: S.records, feedback: S.feedback }, null, 2)], { type: 'application/json' }));
  const a = el('a', { href: url, download: `gyosoku-${jst()}.json` }); a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ------------------------------------------------------------------ navigation

async function chooseRole(role) {
  S.role = role;
  if (S.profile) S.profile.role = role;
  // Offer sign-in only when the backend exists; without it the choice would be a dead end, so go straight on.
  go(backend.isConfigured() && !backend.getSession() ? 'access' : 'details');
}

function go(screen) {
  if (S.screen === 'catch') captureDraft();
  S.screen = screen; S.confirmDelete = false; S.confirmClear = false;
  render(); window.scrollTo(0, 0); main.scrollTop = 0; main.querySelector('h1, h2')?.focus({ preventScroll: true });
}
function captureDraft() {
  const f = document.getElementById('catch-form');
  if (f) S.draft = { ...S.draft, ...Object.fromEntries(new FormData(f)) };
}

const VIEWS = { welcome: welcomeView, role: roleView, access: accessView, auth: authView, details: detailsView, today: todayView, catch: catchView, review: reviewView, saved: () => detailView(true), detail: () => detailView(false), me: meView };
const HARBORPULSE_URL = 'https://app.dev.tracesource.co/apps/6ac7f781714a8f4d47c2595c/harborpulse';
const TABS = [['today', 'tabToday'], ['catch', 'tabCatch'], ['pulse', 'tabPulse'], ['me', 'tabMe']];

function render() {
  document.documentElement.lang = S.lang;
  document.body.dataset.screen = S.screen;
  document.getElementById('language').textContent = S.lang === 'ja' ? 'English' : '日本語';
  const logout = document.getElementById('logout'); logout.hidden = true;
  document.querySelector('footer').hidden = true;
  document.getElementById('trial').hidden = true;
  const inApp = !!S.profile && ['today', 'catch', 'review', 'saved', 'detail', 'me'].includes(S.screen);
  const tabs = document.getElementById('tabs');
  tabs.hidden = !inApp;
  tabs.replaceChildren(...TABS.filter(([k]) => k !== 'catch' || isFisher()).map(([k, label]) => el('button', {
    type: 'button', class: S.screen === k || (k === 'today' && ['saved', 'detail'].includes(S.screen)) ? 'active' : '', 'aria-label': t(label),
    on: { click: () => { if (k === 'pulse') window.open(HARBORPULSE_URL, '_blank', 'noopener,noreferrer'); else if (k === 'catch') startCatch(); else go(k); } },
  }, icon(k === 'catch' ? 'add' : k), el('span', {}, t(label) + (k === 'pulse' ? ' ↗' : '')))));
  const view = (VIEWS[S.screen] || todayView)();
  main.replaceChildren(...view.flat(Infinity).filter(Boolean));
  guideRender();
}

function setLanguage(lang) {
  captureDraft();
  S.lang = lang;
  try { localStorage.setItem(LANG_KEY, S.lang); } catch {}
  render();
}
document.querySelector('header .brand')?.addEventListener('click', (e) => {
  // The logo goes to the app's home screen instead of leaving the app (which would trigger the leave prompt).
  e.preventDefault();
  go(S.profile ? 'today' : 'welcome');
});
document.getElementById('language').addEventListener('click', () => setLanguage(S.lang === 'ja' ? 'en' : 'ja'));

// ------------------------------------------------------------------ guide (rule-based assistant)
// Asks what the user wants, answers, and drives the app (navigation, language, pre-filling a catch).
// It is NOT a language model: it matches keywords and numbers. A real AI would need a server-side API key.

const GUIDE_KEY = 'gyosoku.guide.seen';
const GT = {
  ja: {
    name: '魚測AI', hint: '魚測AIに話しかける', hi: 'こんにちは！魚測AIです。アプリの案内をします。\nやりたいことを書いてください。細かい質問はせず、そのまま進めます。\n例：「カツオ800kg 明日」', ph: '例：カツオ800kg 明日', send: '送る', open: 'ガイドを開く', close: '閉じる',
    chips: { start: 'はじめる', catch: '魚を入力する', today: '今日の見込み', me: 'プロフィール', lang: 'English', help: '使い方' },
    needRole: 'まず、あなたの役割を選びましょう。', needFisher: 'この役割では魚の入力は使いません。「今日」で全体の見込みを見られます。',
    ok: '開きました。', filled: (f) => `入力しました：${f}。内容を確認して、下のボタンを押してください。`, askQty: '何kgですか？例：「カツオ800kg」',
    help: '使い方：\n1) 役割を選ぶ\n2) 名前・母港・魚を入力\n3)「魚を入力」で、魚・量・入港日を保存\n「カツオ800kg 明日」のように話しかけると、入力欄を埋めます。',
    fallback: 'すみません、まだよく分かりません。次のことができます：', thinking: '考え中…', aiNote: '自由な質問はAIに送られることがあります。個人情報は入力しないでください。', toEn: '英語にしました。', toJa: '日本語にしました。', today: '今日の画面を開きました。', me: 'プロフィールを開きました。',
    tomorrow: '明日', todayW: '今日',
  },
  en: {
    name: 'Gyosoku AI', hint: 'Talk to Gyosoku AI', hi: 'Hello! I’m Gyosoku AI. I can guide you through the app.\nJust tell me what you want. I won’t ask lots of questions, I’ll go ahead.\nExample: “skipjack 800 kg tomorrow”', ph: 'e.g. skipjack 800 kg tomorrow', send: 'Send', open: 'Open guide', close: 'Close',
    chips: { start: 'Get started', catch: 'Add a catch', today: 'Today’s outlook', me: 'My profile', lang: '日本語', help: 'How it works' },
    needRole: 'First, choose your role.', needFisher: 'Catch entry isn’t used for this role. “Today” shows the overall outlook.',
    ok: 'Opened.', filled: (f) => `Filled in: ${f}. Please check it and press the button below.`, askQty: 'How many kg? e.g. “skipjack 800 kg”',
    help: 'How it works:\n1) Choose your role\n2) Enter name, home port and fish\n3) “Add a catch” saves fish, quantity and arrival\nSay “skipjack 800 kg tomorrow” and I’ll fill the form.',
    fallback: 'Sorry, I didn’t catch that. I can:', thinking: 'Thinking…', aiNote: 'Free-form questions may be sent to an AI service. Please don’t type personal details.', toEn: 'Switched to English.', toJa: 'Switched to Japanese.', today: 'Opened Today.', me: 'Opened your profile.',
    tomorrow: 'tomorrow', todayW: 'today',
  },
};
const gt = () => GT[S.lang];
const G = { open: false, msgs: [], built: false };
const SPECIES_WORDS = { skipjack: /カツオ|鰹|skipjack|katsuo/i, tuna: /マグロ|鮪|tuna|maguro/i, saury: /サンマ|秋刀魚|saury|sanma/i, mackerel: /サバ|鯖|mackerel|saba/i };

function gSay(text, from = 'bot') { G.msgs.push({ from, text }); }
function parseCatch(text) {
  const tons = text.match(/(\d+(?:\.\d+)?)\s*(?:トン|tons?\b|t\b)/i);
  const kg = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:kg|ｋｇ|㎏|キロ)/i);
  const qty = kg ? Number(kg[1].replace(/,/g, '')) : tons ? Number(tons[1]) * 1000 : null;
  const species = Object.keys(SPECIES_WORDS).find((k) => SPECIES_WORDS[k].test(text)) || null;
  const tomorrow = /明日|あした|tomorrow/i.test(text);
  return { qty, species, tomorrow };
}
function guideAct(text) {
  const g = gt();
  const needsProfile = () => { if (S.profile) return false; gSay(g.needRole); go(S.role ? 'details' : 'role'); return true; };
  const c = parseCatch(text);
  const question = !c.qty && (text.length > 14 || /[?？]$/.test(text.trim())); // real questions go to the AI, not to keyword shortcuts
  if (question) return askGuide(text, g);
  if (c.qty || c.species) {
    if (needsProfile()) return;
    if (!isFisher()) return gSay(g.needFisher);
    if (!c.qty) { startCatch(); S.draft.species = c.species; render(); return gSay(g.askQty); }
    startCatch();
    S.draft = { ...S.draft, species: c.species || S.draft.species, quantity: String(c.qty), date: c.tomorrow ? addDays(jst(), 1) : jst() };
    render(); // re-render with the pre-filled draft (go() would capture the old, empty form over it)
    return gSay(g.filled(`${t(S.draft.species)} ${num(c.qty)} kg, ${c.tomorrow ? g.tomorrow : g.todayW}`));
  }
  if (/english|英語/i.test(text)) { setLanguage('en'); return gSay(GT.en.toEn); }
  if (/日本語|japanese/i.test(text)) { setLanguage('ja'); return gSay(GT.ja.toJa); }
  if (/はじめ|始め|start|begin|get started/i.test(text)) { go(S.profile ? 'today' : 'role'); return gSay(g.ok); }
  if (/入力|追加|登録|記録|catch|add|log|record/i.test(text)) { if (needsProfile()) return; if (!isFisher()) return gSay(g.needFisher); startCatch(); return gSay(g.ok); }
  if (/今日|ホーム|見込み|グラフ|today|home|outlook|arrival|board/i.test(text)) { if (needsProfile()) return; go('today'); return gSay(g.today); }
  if (/プロフィール|設定|私|profile|account|settings|\bme\b/i.test(text)) { if (needsProfile()) return; go('me'); return gSay(g.me); }
  if (/使い方|ヘルプ|助け|help|how/i.test(text)) return gSay(g.help);
  askGuide(text, g);
}
function askGuide(text, g) {
  // Not a command: ask the AI (if the server has it enabled), otherwise offer the built-in options.
  const lang = S.lang;
  gSay(g.thinking); const idx = G.msgs.length - 1;
  askAI(text, lang).then((res) => {
    if (res) { G.msgs[idx] = { from: 'bot', text: res.answer }; runAIAction(res.action); }
    else { G.msgs[idx] = { from: 'bot', text: GT[lang].fallback }; G.showChips = true; }
    guideRender(true);
  });
}
// The AI "just goes ahead": it can navigate, switch language and pre-fill a catch. Nothing is saved or sent; the user still reviews and presses save.
function runAIAction(a) {
  if (!a || typeof a !== 'object') return;
  const need = () => { if (S.profile) return false; go(S.role ? 'details' : 'role'); return true; };
  if (a.type === 'language' && (a.to === 'ja' || a.to === 'en')) return setLanguage(a.to);
  if (a.type === 'open' && a.to === 'processor') { location.href = '/app/'; return; }
  if (a.type === 'navigate' && ['today', 'catch', 'me', 'role'].includes(a.to)) {
    if (a.to === 'role') return go('role');
    if (need()) return;
    if (a.to === 'catch') { if (isFisher()) startCatch(); else go('today'); return; }
    return go(a.to);
  }
  if (a.type === 'fill_catch') {
    const qty = Number(a.quantityKg);
    if (!SPECIES.includes(a.species) && a.species !== 'other') return;
    if (!(qty > 0 && qty <= 1_000_000) || need() || !isFisher()) return;
    startCatch();
    S.draft = { ...S.draft, species: a.species, otherSpecies: a.species === 'other' ? String(a.speciesName || '').slice(0, 50) : '', quantity: String(qty), date: a.day === 'tomorrow' ? addDays(jst(), 1) : jst() };
    render();
  }
}

function guideInput(text) {
  const v = text.trim();
  if (!v) return;
  gSay(v, 'me'); G.showChips = false;
  guideAct(v);
  guideRender(true);
}
function guideChip(key) {
  const g = gt();
  const map = { start: g.chips.start, catch: g.chips.catch, today: g.chips.today, me: g.chips.me, help: g.chips.help };
  if (key === 'lang') { guideInput(S.lang === 'ja' ? 'English' : '日本語'); return; }
  guideInput(map[key]);
}

// The guide icon can be dragged anywhere inside the phone; its position is remembered.
const FAB_POS = 'gyosoku.guide.pos';
function placeFab(fab, phone, x, y) {
  const r = phone.getBoundingClientRect(), n = fab.offsetWidth || 46;
  const cx = Math.min(Math.max(8, x), Math.max(8, r.width - n - 8));
  const cy = Math.min(Math.max(8, y), Math.max(8, r.height - n - 8));
  Object.assign(fab.style, { left: `${cx}px`, top: `${cy}px`, right: 'auto', bottom: 'auto' });
  return { x: cx, y: cy };
}
function enableFabDrag(fab, phone) {
  try { const p = JSON.parse(localStorage.getItem(FAB_POS) || 'null'); if (p) placeFab(fab, phone, p.x, p.y); } catch {}
  let d = null;
  fab.addEventListener('pointerdown', (e) => {
    const r = phone.getBoundingClientRect(), f = fab.getBoundingClientRect();
    d = { sx: e.clientX, sy: e.clientY, ox: f.left - r.left, oy: f.top - r.top, moved: false, pos: null };
    try { fab.setPointerCapture(e.pointerId); } catch {}
  });
  fab.addEventListener('pointermove', (e) => {
    if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true; fab.classList.add('drag'); G.hint = false;
    const h = document.getElementById('guide-hint'); if (h) h.hidden = true;
    d.pos = placeFab(fab, phone, d.ox + dx, d.oy + dy);
  });
  const end = () => {
    if (d?.moved) {
      fab.dataset.dragged = '1'; setTimeout(() => { delete fab.dataset.dragged; }, 50);
      if (d.pos) { try { localStorage.setItem(FAB_POS, JSON.stringify(d.pos)); } catch {} }
    }
    fab.classList.remove('drag'); d = null;
  };
  fab.addEventListener('pointerup', end); fab.addEventListener('pointercancel', end);
  window.addEventListener('resize', () => { try { const p = JSON.parse(localStorage.getItem(FAB_POS) || 'null'); if (p) placeFab(fab, phone, p.x, p.y); } catch {} });
}

function guideRender(scroll) {
  const phone = document.querySelector('.phone');
  if (!phone) return;
  let fab = document.getElementById('guide-fab');
  let panel = document.getElementById('guide');
  const g = gt();
  if (!fab) {
    fab = el('button', { id: 'guide-fab', type: 'button', class: 'guide-fab', title: '↔', on: { click: () => { if (fab.dataset.dragged) return; G.hint = false; G.open = !G.open; if (G.open && !G.msgs.length) { gSay(gt().hi); G.showChips = true; } try { localStorage.setItem(GUIDE_KEY, '1'); } catch {} guideRender(true); } } },
      el('img', { src: '/public/logo.png', alt: '', width: 46, height: 46, draggable: 'false' }));
    panel = el('section', { id: 'guide', class: 'guide', role: 'dialog', 'aria-label': 'guide', hidden: true });
    phone.append(fab, panel);
    enableFabDrag(fab, phone);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && G.open) { G.open = false; guideRender(); fab.focus(); } });
  }
  let hint = document.getElementById('guide-hint');
  if (!hint) { hint = el('button', { id: 'guide-hint', type: 'button', class: 'guide-hint', on: { click: () => fab.click() } }); phone.append(hint); }
  hint.hidden = !(G.hint && !G.open); hint.textContent = g.hint;
  fab.setAttribute('aria-label', g.open); fab.setAttribute('aria-expanded', String(G.open));
  fab.classList.toggle('on', G.open);
  panel.hidden = !G.open;
  panel.setAttribute('aria-label', g.name);
  if (!G.open) return;
  const form = el('form', { class: 'guide__form', on: { submit: (e) => { e.preventDefault(); const i = form.elements.q; const v = i.value; i.value = ''; guideInput(v); form.elements.q.focus(); } } },
    el('input', { name: 'q', type: 'text', autocomplete: 'off', maxlength: 200, placeholder: g.ph, 'aria-label': g.ph }),
    el('button', { type: 'submit', class: 'guide__send' }, g.send));
  const chips = G.showChips ? el('div', { class: 'guide__chips' }, Object.keys(g.chips).filter((k) => k !== 'start' || !S.profile).map((k) => el('button', { type: 'button', on: { click: () => guideChip(k) } }, g.chips[k]))) : null;
  const log = el('div', { class: 'guide__log', 'aria-live': 'polite' }, G.msgs.map((m) => el('p', { class: `guide__msg guide__msg--${m.from}` }, ...m.text.split('\n').flatMap((ln, i) => (i ? [el('br'), ln] : [ln])))), chips);
  panel.replaceChildren(
    el('header', { class: 'guide__head' }, el('img', { src: '/public/logo.png', alt: '', width: 32, height: 32 }), el('strong', {}, g.name),
      el('button', { type: 'button', class: 'guide__x', 'aria-label': g.close, on: { click: () => { G.open = false; guideRender(); } } }, '✕')),
    log, form);
  if (scroll) log.scrollTop = log.scrollHeight;
}
// First visit: a small speech bubble beside the guide icon (never covers the main buttons).
try { if (!localStorage.getItem(GUIDE_KEY)) setTimeout(() => { G.hint = true; guideRender(); setTimeout(() => { G.hint = false; guideRender(); }, 9000); }, 900); } catch {}

// ------------------------------------------------------------------ "are you sure?" on the way out
function confirmBox({ title, body, yes, no }) {
  return new Promise((resolve) => {
    const phone = document.querySelector('.phone');
    const prev = document.activeElement;
    const done = (v) => { overlay.remove(); document.removeEventListener('keydown', onKey, true); prev?.focus?.({ preventScroll: true }); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); done(false); } };
    const stayBtn = el('button', { type: 'button', class: 'secondary', on: { click: () => done(false) } }, no);
    const overlay = el('div', { class: 'sure', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'sure-t', on: { click: (e) => { if (e.target === overlay) done(false); } } },
      el('div', { class: 'sure__card' }, el('h2', { id: 'sure-t' }, title), el('p', { class: 'muted' }, body),
        el('div', { class: 'actions' }, stayBtn, el('button', { type: 'button', class: 'quiet sure__yes', on: { click: () => done(true) } }, yes))));
    phone.append(overlay); document.addEventListener('keydown', onKey, true); stayBtn.focus({ preventScroll: true });
  });
}
function formDirty() {
  const f = document.getElementById('catch-form');
  if (!f) return false;
  const d = new FormData(f);
  return !!(String(d.get('quantity') || '').trim() || String(d.get('notes') || '').trim() || String(d.get('otherSpecies') || '').trim());
}
async function backFromCatch() {
  if (formDirty() && !(await confirmBox({ title: t('sureTitle'), body: t('sureDiscard'), yes: t('discard'), no: t('stay') }))) return;
  S.draft = null; go('today');
}
// Phone/browser Back: keep a sentinel history entry so the system Back asks before leaving the app.
history.replaceState({ gy: 0 }, ''); history.pushState({ gy: 1 }, '');
let leaving = false;
window.addEventListener('popstate', async () => {
  if (leaving) return;
  const dirty = S.screen === 'catch' && formDirty();
  const ok = await confirmBox({ title: t('sureTitle'), body: dirty ? t('sureDiscard') : t('sureLeave'), yes: dirty ? t('discard') : t('leave'), no: t('stay') });
  if (ok) { leaving = true; history.back(); } else history.pushState({ gy: 1 }, '');
});
window.addEventListener('beforeunload', (e) => { if (S.screen === 'catch' && formDirty()) { e.preventDefault(); e.returnValue = ''; } });

async function boot() {
  render();
  await backend.init();
  if (backend.getSession()) {
    const prof = await backend.getProfile();
    if (prof) S.profile = { role: prof.role, name: prof.display_name, ...(prof.details || {}) };
    S.records = (await backend.listCatches()).map(fromRow);
    persist();
  }
  S.screen = S.profile ? 'today' : backend.getSession() && S.role ? 'details' : S.screen === 'welcome' && !S.profile ? 'welcome' : S.screen;
  if (backend.getSession() && !S.profile) S.screen = S.role ? 'details' : 'role';
  render();
}
// Page-wide backdrop behind the phone frame (desktop) — bubbles and swimming tuna.
document.body.prepend(oceanScene(26, 0, 'scene--page'));
boot();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
