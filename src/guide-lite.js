// Gyosoku guide for the website and the processor workspace: quick links, language switch, and the AI for free questions.
import { askAI } from './guide-ai.js';

const T = {
  ja: { name: '魚測AI', hi: 'こんにちは！魚測AIです。サイトとアプリの案内をします。\nやりたいことを書いてください。細かい質問はせず、そのまま進めます。', ph: '質問を入力…', send: '送る', open: 'ガイドを開く', close: '閉じる', thinking: '考え中…', note: '自由な質問はAIに送られることがあります。個人情報は入力しないでください。', fallback: 'すみません、うまく答えられませんでした。下のボタンをお試しください。', hint: '魚測AIに話しかける', done: '開きました。' },
  en: { name: 'Gyosoku AI', hi: 'Hello! I’m Gyosoku AI. I can guide you around the site and the app.\nJust tell me what you want. I won’t ask lots of questions, I’ll go ahead.', ph: 'Ask a question…', send: 'Send', open: 'Open guide', close: 'Close', thinking: 'Thinking…', note: 'Free-form questions may be sent to an AI service. Please don’t type personal details.', fallback: 'Sorry, I couldn’t answer that. Try the buttons below.', hint: 'Talk to Gyosoku AI', done: 'Opened.' },
};
const onApp = location.pathname.startsWith('/app');
const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'ja');
const L = (ja, en) => (lang() === 'ja' ? ja : en);

const ACTIONS = () => onApp
  ? [[L('概要', 'Overview'), () => { location.hash = 'overview'; }], [L('供給計画', 'Supply plan'), () => { location.hash = 'supply'; }], [L('意思決定', 'Decision review'), () => { location.hash = 'decision'; }], [L('アプリを開く', 'Open app'), () => { location.href = '/fisherman/'; }], [L('English / 日本語', 'English / 日本語'), () => document.querySelector('.lang-toggle')?.click()]]
  : [[L('アプリを開く', 'Open app'), () => { location.href = '/fisherman/'; }], [L('動画を見る', 'Play video'), () => document.getElementById('play-video')?.click()], [L('仕組みを見る', 'How it works'), () => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })], [L('English / 日本語', 'English / 日本語'), () => document.getElementById('language')?.click()]];

const KEYWORDS = () => [
  [/アプリ|開く|始め|はじめ|open|start|app/i, 0], [/動画|ビデオ|video|play/i, 1], [/仕組み|使い方|how/i, 2], [/加工|processor|demo|デモ/i, 3], [/english|英語|日本語|japanese/i, 4],
];

// The AI can open pages, play the video, scroll to a section and switch language (fixed list; the server also validates).
function runAction(a) {
  if (!a || typeof a !== 'object') return;
  if (a.type === 'language') return void (onApp ? document.querySelector('.lang-toggle') : document.getElementById('language'))?.click();
  if (a.type === 'open') {
    if (a.to === 'app') location.href = '/fisherman/';
    else if (a.to === 'processor') location.href = '/app/';
    else if (a.to === 'video') document.getElementById('play-video')?.click();
    else if (a.to === 'how') document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  if (a.type === 'navigate') {
    if (onApp && ['overview', 'supply', 'decision'].includes(a.to)) location.hash = a.to;
    else if (['today', 'catch', 'me', 'role'].includes(a.to)) location.href = '/fisherman/';
  }
  if (a.type === 'fill_catch') location.href = '/fisherman/';
}

let open = false, hinted = false;
const msgs = [];
const el = (tag, props = {}, ...kids) => { const n = document.createElement(tag); for (const [k, v] of Object.entries(props)) { if (v === false || v == null) continue; if (k === 'on') for (const [e, f] of Object.entries(v)) n.addEventListener(e, f); else if (k === 'class') n.className = v; else n.setAttribute(k, v === true ? '' : v); } for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c)); return n; };

const fab = el('button', { class: 'lg-fab', type: 'button', on: { click: toggle } }, el('img', { src: '/public/logo.png', alt: '', width: 46, height: 46, draggable: 'false' }));
const hint = el('button', { class: 'lg-hint', type: 'button', hidden: true, on: { click: toggle } });
const panel = el('section', { class: 'lg-panel', role: 'dialog', hidden: true });
document.body.append(fab, hint, panel);

function toggle() { open = !open; if (open) everOpened = true; hint.hidden = true; if (open && !msgs.length) msgs.push({ from: 'bot', text: T[lang()].hi }); draw(); if (open) panel.querySelector('input')?.focus({ preventScroll: true }); }
function say(text, from = 'bot') { msgs.push({ from, text }); }

async function ask(raw) {
  const text = raw.trim(); if (!text) return;
  say(text, 'me');
  const hit = text.length <= 10 ? KEYWORDS().find(([re]) => re.test(text)) : null; // short commands only; real questions go to the AI
  if (hit) { say(T[lang()].done); draw(); ACTIONS()[hit[1]][1](); return; }
  say(T[lang()].thinking); const i = msgs.length - 1; draw();
  const res = await askAI(text, lang());
  msgs[i] = { from: 'bot', text: res ? res.answer : T[lang()].fallback }; draw();
  if (res) runAction(res.action);
}

function draw() {
  const t = T[lang()];
  fab.setAttribute('aria-label', t.open); fab.setAttribute('aria-expanded', String(open)); fab.classList.toggle('on', open);
  hint.textContent = t.hint;
  panel.hidden = !open; if (!open) return;
  panel.setAttribute('aria-label', t.name);
  const form = el('form', { class: 'lg-form', on: { submit: (e) => { e.preventDefault(); const i = form.elements.q; const v = i.value; i.value = ''; ask(v); } } },
    el('input', { name: 'q', type: 'text', maxlength: 200, autocomplete: 'off', placeholder: t.ph, 'aria-label': t.ph }), el('button', { type: 'submit' }, t.send));
  const chips = el('div', { class: 'lg-chips' }, ACTIONS().map(([label, fn]) => el('button', { type: 'button', on: { click: () => { say(label, 'me'); say(t.done); draw(); fn(); } } }, label)));
  const log = el('div', { class: 'lg-log', 'aria-live': 'polite' }, msgs.map((m) => el('p', { class: `lg-msg lg-msg--${m.from}` }, m.text)), chips);
  panel.replaceChildren(
    el('header', { class: 'lg-head' }, el('img', { src: '/public/logo.png', alt: '', width: 30, height: 30 }), el('strong', {}, t.name), el('button', { type: 'button', 'aria-label': t.close, on: { click: toggle } }, '✕')),
    log, form);
  log.scrollTop = log.scrollHeight;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && open) toggle(); });
new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
// The speech bubble pops up for a few seconds, goes away, and comes back every ~14 s (6 times at most). It stops once the guide has been opened.
let pops = 0, everOpened = false;
function popHint() {
  if (everOpened || pops >= 6) return;
  pops++;
  if (!open) { hint.textContent = T[lang()].hint; hint.hidden = false; setTimeout(() => { hint.hidden = true; }, 3200); }
  setTimeout(popHint, 14000);
}
setTimeout(popHint, 1500);
draw();
