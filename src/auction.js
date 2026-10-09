// "For auctions": what a market/auction company would see before the auction, plus a short poll.
// The numbers are clearly labelled examples. Real numbers need fishermen's shared entries (backend not connected yet).
const T = {
  ja: { eyebrow: '競り・市場の方へ', title: '競りの前に、入港の見込みを', lead: '漁師さんが入港前にスマホへ入力した「魚種・量・時間」を、競りの前に一覧で見られます。これは見本の画面です。', sample: '見本データ（実際の入力ではありません）',
    today: '今日の入港見込み', total: '合計の見込み', totalNote: '3人以上の報告が集まった魚種だけ表示します。個別の入力は見えません。', kg: 'kg', boats: '隻', sure: '確認済み', est: '見込み', by: '入港予定', conf: '確認済みの量',
    legend: '濃い部分は漁獲量を確認済み、薄い部分はまだ見込みです。漁師さんの自己申告で、検証された予測ではありません。',
    poll: '見たい情報を教えてください', pollLead: '当てはまるものをすべて選んでください。', want: [['species','魚種ごとの量'],['arrival','入港時間'],['confidence','確認済みか、見込みか'],['boats','入港する船の数'],['port','港ごとの内訳'],['history','過去の水揚げとの比較'],['price','値段の目安'],['weather','天気・海況']],
    more: 'ほかに知りたいこと（任意）', who: '会社名・お名前（任意）', whoPh: '例：○○市場', contact: '連絡先（任意）', send: '送る', sending: '送信中…', fail: '送れませんでした。電波のよい所でもう一度お試しください。', empty: 'どれか1つ選んでください。',
    thanks: 'ありがとうございます！', thanksBody: 'ご意見は魚測チームに届きました。', tryApp: '漁師向けアプリも見てみる', sendNote: '送った内容は魚測チームだけが見ます。', lang: 'English',
    rows: [['カツオ','気仙沼港','15:00',2400,1800,3,'800–2,400'],['サンマ','気仙沼港','17:30',1200,300,2,'900–1,400'],['サバ','気仙沼港','翌 05:00',1000,0,4,'600–1,200']] },
  en: { eyebrow: 'FOR AUCTIONS AND MARKETS', title: 'Know what is arriving, before the auction', lead: 'See what fishermen expect to land (fish, quantity, time), entered on their phones before they reach port. This is a sample screen.', sample: 'Sample data (not real entries)',
    today: 'Expected arrivals today', total: 'Total expected', totalNote: 'Shown only for fish that 3 or more people have reported. Individual entries are never visible.', kg: 'kg', boats: 'boats', sure: 'checked', est: 'estimate', by: 'arrives', conf: 'quantity checked',
    legend: 'Darker part: quantity already checked. Lighter part: still an estimate. These are fishermen’s own estimates, not a validated forecast.',
    poll: 'What would you want to see?', pollLead: 'Select everything that applies.', want: [['species','Quantity by fish'],['arrival','Arrival time'],['confidence','Checked or just an estimate'],['boats','Number of boats'],['port','Breakdown by port'],['history','Compared with past landings'],['price','Price guide'],['weather','Weather and sea conditions']],
    more: 'Anything else you would want? (optional)', who: 'Company / your name (optional)', whoPh: 'e.g. ○○ market', contact: 'Contact (optional)', send: 'Send', sending: 'Sending…', fail: 'Could not send. Please try again with a better signal.', empty: 'Please select at least one.',
    thanks: 'Thank you!', thanksBody: 'Your answers reached the Gyosoku team.', tryApp: 'Also try the fisherman app', sendNote: 'Only the Gyosoku team sees what you send.', lang: '日本語',
    rows: [['Skipjack','Kesennuma','15:00',2400,1800,3,'800–2,400'],['Pacific saury','Kesennuma','17:30',1200,300,2,'900–1,400'],['Mackerel','Kesennuma','05:00 (next day)',1000,0,4,'600–1,200']] },
};
let lang = 'ja';
try { lang = localStorage.getItem('gyosoku.lang') === 'en' ? 'en' : 'ja'; } catch {}
const root = document.getElementById('root');
const t = (k) => T[lang][k];
const num = (n) => new Intl.NumberFormat(lang === 'ja' ? 'ja-JP' : 'en-GB').format(n);
const el = (tag, p = {}, ...k) => { const n = document.createElement(tag); for (const [a, v] of Object.entries(p)) { if (v == null || v === false) continue; if (a === 'on') for (const [e, f] of Object.entries(v)) n.addEventListener(e, f); else if (a === 'class') n.className = v; else n.setAttribute(a, v === true ? '' : v); } for (const c of k.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(c)); return n; };
const setW = (n, pct) => { n.style.width = `${pct}%`; return n; }; // CSSOM, allowed by the strict CSP

function render(keep) {
  document.documentElement.lang = lang; document.getElementById('lang').textContent = t('lang');
  const rows = t('rows'); const total = rows.reduce((a, r) => a + r[3], 0), max = Math.max(...rows.map((r) => r[3]));
  const list = el('div', {}, rows.map(([fish, port, when, kg, ok, boats, range]) => el('div', { class: 'row' },
    el('strong', {}, fish), el('span', { class: 'kg' }, `${num(kg)} ${t('kg')}`),
    el('span', { class: 'sub' }, `${port} · ${t('by')} ${when} · ${boats} ${t('boats')} · ${range} ${t('kg')}`), el('span', { class: ok ? 'pill' : 'pill est' }, ok ? `${num(ok)} ${t('kg')} ${t('sure')}` : t('est')),
    el('div', { class: 'bar' }, setW(el('i'), (kg / max) * 100), ok ? setW(el('b'), (ok / max) * 100) : null))));
  const err = el('p', { class: 'err', role: 'alert' });
  const btn = el('button', { type: 'submit', class: 'send' }, t('send'));
  const form = el('form', { on: { submit: async (e) => {
    e.preventDefault(); err.textContent = '';
    const f = new FormData(form); const picks = f.getAll('want');
    if (!picks.length && !(f.get('more') || '').trim()) { err.textContent = t('empty'); return; }
    const labels = Object.fromEntries(T[lang].want); btn.disabled = true; btn.textContent = t('sending');
    try {
      const r = await fetch('/api/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, role: 'auction', name: f.get('who'), contact: f.get('contact'), wish: picks.map((k) => labels[k]).join(' / '), comment: f.get('more') }), signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error('x');
      root.replaceChildren(el('div', { class: 'done' }, el('img', { src: '/public/logo.png', alt: '', width: 88, height: 88 }), el('h1', {}, t('thanks')), el('p', { class: 'muted' }, t('thanksBody')), el('a', { class: 'cta', href: '/fisherman/' }, t('tryApp'))));
      window.scrollTo(0, 0);
    } catch { btn.disabled = false; btn.textContent = t('send'); err.textContent = t('fail'); }
  } } },
    el('div', { class: 'choices' }, t('want').map(([k, label]) => el('label', { class: 'choice' }, el('input', { type: 'checkbox', name: 'want', value: k }), label))),
    el('label', { class: 'field', for: 'more' }, t('more')), el('textarea', { id: 'more', name: 'more', maxlength: 1000 }),
    el('label', { class: 'field', for: 'who' }, t('who')), el('input', { id: 'who', name: 'who', type: 'text', maxlength: 60, placeholder: t('whoPh'), autocomplete: 'organization' }),
    el('label', { class: 'field', for: 'contact' }, t('contact')), el('input', { id: 'contact', name: 'contact', type: 'text', maxlength: 80, autocomplete: 'off' }),
    err, btn, el('p', { class: 'legend' }, t('sendNote')));
  root.replaceChildren(el('p', { class: 'eyebrow' }, t('eyebrow')), el('h1', {}, t('title')), el('p', { class: 'muted' }, t('lead')),
    el('section', { class: 'card hero', 'aria-label': t('total') }, el('span', { class: 'sample' }, t('sample')), el('p', {}, t('total')), el('div', { class: 'big' }, num(total), el('small', {}, ` ${t('kg')}`)), el('p', {}, t('totalNote'))),
    el('section', { class: 'card' }, el('h2', {}, t('today')), list, el('p', { class: 'legend' }, t('legend'))),
    el('section', { class: 'card' }, el('h2', {}, t('poll')), el('p', { class: 'muted' }, t('pollLead')), form));
  if (keep) for (const [k, v] of keep) { const f = root.querySelector(`[name="${k}"]`); if (!f) continue; if (f.type === 'checkbox') root.querySelector(`[name="${k}"][value="${v}"]`).checked = true; else f.value = v; }
}
document.getElementById('lang').addEventListener('click', () => { const f = root.querySelector('form'); const keep = f ? [...new FormData(f)] : null; lang = lang === 'ja' ? 'en' : 'ja'; try { localStorage.setItem('gyosoku.lang', lang); } catch {} render(keep); });
render();
