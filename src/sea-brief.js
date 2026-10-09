// AI weather brief on the Sea tab. Uses only the public forecast already stored by field-conditions.js (no personal data).
// Quietly does nothing if the AI is off or offline.
const main = document.getElementById('main');
if (main) {
  const ja = () => document.documentElement.lang.startsWith('ja');
  const card = document.createElement('section'); card.className = 'ai-brief'; card.hidden = true;
  const tag = document.createElement('span'); tag.className = 'ai-brief__tag';
  const body = document.createElement('p'); card.append(tag, body);
  let busy = false;
  const read = () => { try { const d = JSON.parse(localStorage.getItem('gyosoku.conditions.v1') || 'null'); return d && Array.isArray(d.days) && d.days.length ? d : null; } catch { return null; } };
  async function show() {
    if (document.body.dataset.screen !== 'sea') { card.remove(); return; }
    const data = read(); if (!data) return;
    const lang = ja() ? 'ja' : 'en', ck = `gyosoku.brief.${lang}.${data.retrievedAt}`;
    tag.textContent = ja() ? 'AIによる要約' : 'AI summary';
    let text = null; try { text = localStorage.getItem(ck); } catch {}
    if (!text && !busy) {
      busy = true;
      try {
        const r = await fetch('/api/brief', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang, days: data.days.map((d) => ({ date: d.date, windMaxMs: d.windMaxMs, rainMm: d.rainMm, waveMaxM: d.waveMaxM })) }), signal: AbortSignal.timeout(18000) });
        if (r.ok) { text = (await r.json()).text; try { localStorage.setItem(ck, text); } catch {} }
      } catch {} finally { busy = false; }
    }
    if (!text || document.body.dataset.screen !== 'sea') return;
    body.textContent = text; card.hidden = false;
    const target = main.querySelector('.field-conditions'); if (target && card.nextSibling !== target) main.insertBefore(card, target); else if (!card.isConnected) main.append(card);
  }
  new MutationObserver(show).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  new MutationObserver(() => { card.hidden = true; show(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  window.addEventListener('storage', show); setInterval(() => { if (document.body.dataset.screen === 'sea' && card.hidden) show(); }, 4000);
  show();
}
