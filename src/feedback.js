// Feedback page for the fishermen test. Posts to /api/feedback; no account, no tracking.
const T = {
  ja: { title: 'ご意見をください', lead: '使ってみて、どうでしたか？1分で終わります。答えられるところだけでOKです。', tried: 'アプリを使ってみましたか？', yes: 'はい', partly: '少しだけ', no: 'いいえ',
    easy: '入力は分かりやすかったですか？', easy_easy: '分かりやすい', easy_ok: 'ふつう', easy_hard: '難しい',
    useful: '仕事で使いたいですか？', u_yes: '使いたい', u_maybe: '少し変えれば', u_no: '今は不要',
    wish: 'あったらいい機能は？（任意）', wishPh: '例：音声で入力、市場の値段、天気', comment: 'そのほか気づいたこと（任意）', name: 'お名前（任意）', role: '立場（任意）', rolePh: '漁師 / 船長 / 加工会社 / 市場', port: '港（任意）', contact: '連絡先（任意）', contactPh: '電話やメール。お返事が必要なときだけ',
    send: '送る', sending: '送信中…', fail: '送れませんでした。電波のよい所でもう一度お試しください。', empty: 'どれか1つ答えてください。', thanks: 'ありがとうございます！', thanksBody: 'ご意見は魚測チームに届きました。これからの改善に使います。', back: 'アプリにもどる', note: '送った内容は魚測チームだけが見ます。', lang: 'English' },
  en: { title: 'Tell us what you think', lead: 'How was it? It takes one minute. Answer only what you like.', tried: 'Did you try the app?', yes: 'Yes', partly: 'A little', no: 'No',
    easy: 'Was it easy to enter a catch?', easy_easy: 'Easy', easy_ok: 'OK', easy_hard: 'Hard',
    useful: 'Would you use this for work?', u_yes: 'Yes', u_maybe: 'With changes', u_no: 'Not now',
    wish: 'What would you like it to do? (optional)', wishPh: 'e.g. voice input, market prices, weather', comment: 'Anything else? (optional)', name: 'Your name (optional)', role: 'Your role (optional)', rolePh: 'Fisherman / Captain / Processor / Market', port: 'Port (optional)', contact: 'Contact (optional)', contactPh: 'Phone or email, only if you want a reply',
    send: 'Send', sending: 'Sending…', fail: 'Could not send. Please try again with a better signal.', empty: 'Please answer at least one question.', thanks: 'Thank you!', thanksBody: 'Your feedback reached the Gyosoku team. We will use it to improve the app.', back: 'Back to the app', note: 'Only the Gyosoku team sees what you send.', lang: '日本語' },
};
let lang = 'ja';
try { lang = localStorage.getItem('gyosoku.fisherman.lang') === 'en' ? 'en' : 'ja'; } catch {}
const root = document.getElementById('root');
const t = (k) => T[lang][k];
const el = (tag, p = {}, ...k) => { const n = document.createElement(tag); for (const [a, v] of Object.entries(p)) { if (v == null || v === false) continue; if (a === 'on') for (const [e, f] of Object.entries(v)) n.addEventListener(e, f); else if (a === 'class') n.className = v; else n.setAttribute(a, v === true ? '' : v); } for (const c of k.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c)); return n; };
const choices = (name, opts) => el('fieldset', {}, el('legend', {}, t(name)), el('div', { class: 'choices' }, opts.map(([val, key]) => el('label', { class: 'choice' }, el('input', { type: 'radio', name, value: val }), t(key)))));
const text = (name, label, ph, area) => [el('label', { class: 'field', for: name }, label), area ? el('textarea', { id: name, name, maxlength: 1000, placeholder: ph || '' }) : el('input', { id: name, name, type: 'text', maxlength: 80, placeholder: ph || '', autocomplete: 'off' })];

function render() {
  document.documentElement.lang = lang; document.getElementById('lang').textContent = t('lang');
  const err = el('p', { class: 'err', role: 'alert' });
  const btn = el('button', { type: 'submit', class: 'send' }, t('send'));
  const form = el('form', { on: { submit: async (e) => {
    e.preventDefault(); err.textContent = '';
    const d = Object.fromEntries(new FormData(form)); d.lang = lang;
    if (!d.tried && !d.easy && !d.useful && !(d.wish || '').trim() && !(d.comment || '').trim()) { err.textContent = t('empty'); return; }
    btn.disabled = true; btn.textContent = t('sending');
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d), signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error('x'); window.gyTrack?.('feedback_sent');
      root.replaceChildren(el('div', { class: 'done' }, el('img', { src: '/public/logo.png', alt: '', width: 88, height: 88 }), el('h1', {}, t('thanks')), el('p', { class: 'muted' }, t('thanksBody')), el('a', { href: '/fisherman/' }, t('back'))));
      window.scrollTo(0, 0);
    } catch { btn.disabled = false; btn.textContent = t('send'); err.textContent = t('fail'); }
  } } },
    choices('tried', [['yes', 'yes'], ['partly', 'partly'], ['no', 'no']]),
    choices('easy', [['easy', 'easy_easy'], ['ok', 'easy_ok'], ['hard', 'easy_hard']]),
    choices('useful', [['yes', 'u_yes'], ['maybe', 'u_maybe'], ['no', 'u_no']]),
    text('wish', t('wish'), t('wishPh'), true), text('comment', t('comment'), '', true),
    text('name', t('name')), text('role', t('role'), t('rolePh')), text('port', t('port')), text('contact', t('contact'), t('contactPh')),
    err, btn, el('p', { class: 'note' }, t('note')));
  root.replaceChildren(el('h1', {}, t('title')), el('p', { class: 'muted' }, t('lead')), form);
}
document.getElementById('lang').addEventListener('click', () => { const keep = root.querySelector('form') ? Object.fromEntries(new FormData(root.querySelector('form'))) : null; lang = lang === 'ja' ? 'en' : 'ja'; try { localStorage.setItem('gyosoku.fisherman.lang', lang); } catch {} render(); if (keep) for (const [k, v] of Object.entries(keep)) { const f = root.querySelector(`[name="${k}"]`); if (!f) continue; if (f.type === 'radio') root.querySelector(`[name="${k}"][value="${v}"]`).checked = true; else f.value = v; } });
render();
