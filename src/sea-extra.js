// Sea tab extras: sea temperature + current, official JMA forecast for eastern Miyagi, and a warning headline when one is current.
// Data from /api/sea (open data). Shown only on the Sea tab; hidden quietly if offline. Source credit is shown on the card.
const main = document.getElementById('main');
if (main) {
  const ja = () => document.documentElement.lang.startsWith('ja');
  const card = document.createElement('section'); card.className = 'sea-extra'; card.hidden = true;
  let data = null, busy = false, at = 0;
  const el = (t, c, txt) => { const n = document.createElement(t); if (c) n.className = c; if (txt != null) n.textContent = txt; return n; };
  const compass = (d) => ['北', '北東', '東', '南東', '南', '南西', '西', '北西'][Math.round((d % 360) / 45) % 8];
  const compassEn = (d) => ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.round((d % 360) / 45) % 8];
  // label by the real date, never by position: an old or cached forecast must not be called "today"
  const jstDay = (offset = 0) => new Date(Date.now() + 9 * 3600e3 + offset * 86400e3).toISOString().slice(0, 10);
  const day = (iso) => (iso === jstDay(0) ? (ja() ? '今日' : 'Today') : iso === jstDay(1) ? (ja() ? '明日' : 'Tomorrow') : iso === jstDay(2) ? (ja() ? '明後日' : 'Day after') : `${+iso.slice(5, 7)}/${+iso.slice(8, 10)}`);
  const stamp = (iso) => { const d = new Date(Date.parse(iso) + 9 * 3600e3); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  function draw() {
    if (document.body.dataset.screen !== 'sea') { card.remove(); return; }
    if (!data) return;
    card.replaceChildren();
    const w = el('div', 'sea-extra__warn'), link = el('a', '', ja() ? '気象庁で警報・注意報を確認' : 'Check warnings on JMA'); link.href = 'https://www.jma.go.jp/bosai/warning/#area_type=class20s&area_code=0420500&lang=ja'; link.target = '_blank'; link.rel = 'noopener';
    if (data.warning) {
      const at = new Date(data.warning.reportedAt).toLocaleString(ja() ? 'ja-JP' : 'en-GB', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' });
      const names = data.warning.active.join(ja() ? '、' : ', ');
      w.append(el('b', '', ja() ? '気象庁 気仙沼市の警報・注意報' : 'JMA warnings, Kesennuma'), el('p', '', names ? (ja() ? `発表中：${names}` : `Active: ${names}`) : (ja() ? '発表中の警報・注意報はありません' : 'None active')), el('small', '', ja() ? `${at} 時点の発表` : `As of ${at} JST`));
    } else w.append(el('b', '', ja() ? '警報・注意報' : 'Warnings'), el('p', '', ja() ? '現在の発表状況を取得できませんでした。気象庁のページで確認してください。' : 'Could not load the current warning status. Please check the JMA page.'));
    w.append(link); card.append(w);
    if (data.sea && (data.sea.tempC != null || data.sea.currentKmh != null)) {
      const row = el('div', 'sea-extra__tiles');
      if (data.sea.tempC != null) { const t = el('div', 'tile'); t.append(el('span', '', ja() ? '海面水温' : 'Sea temperature'), el('strong', '', `${data.sea.tempC}`), el('em', '', '°C')); row.append(t); }
      if (data.sea.currentKmh != null) { const t = el('div', 'tile'); t.append(el('span', '', ja() ? '海流（沖合）' : 'Current (offshore)'), el('strong', '', `${data.sea.currentKmh}`), el('em', '', `km/h${data.sea.currentDir != null ? ' · ' + (ja() ? compass(data.sea.currentDir) + 'へ' : '→ ' + compassEn(data.sea.currentDir)) : ''}`)); row.append(t); }
      card.append(row);
    }
    if (data.jma && ja()) {
      const box = el('div', 'sea-extra__jma'); box.append(el('h3', '', `気象庁 宮城県${data.jma.area}の予報`));
      data.jma.days.filter((d) => d.date >= jstDay(-1)).forEach((d) => { const r = el('div', 'jma-row'); r.append(el('b', '', day(d.date)), el('span', '', `${d.weather}`), el('small', '', `風：${d.wind} ／ 波：${d.waves}`)); box.append(r); });
      box.append(el('p', 'sea-extra__src', `発表：${stamp(data.jma.reportedAt)}（${data.jma.office}）`)); card.append(box);
    }
    const cr = el('p', 'sea-extra__src'); cr.textContent = ja() ? '出典：気象庁、Open-Meteo（CC BY 4.0）。予報であり、出航の判断ではありません。' : 'Sources: Japan Meteorological Agency, Open-Meteo (CC BY 4.0). Forecast only, not a sailing decision. JMA text is in Japanese.'; card.append(cr);
    card.hidden = false;
    const anchor = main.querySelector('.ai-brief') || main.querySelector('.field-conditions'); if (anchor) main.insertBefore(card, anchor); else main.append(card);
  }
  async function load() {
    if (document.body.dataset.screen !== 'sea') { card.remove(); return; }
    if (data && Date.now() - at < 600000) return draw();
    if (busy) return; busy = true;
    try { const r = await fetch('/api/sea', { signal: AbortSignal.timeout(14000) }); if (r.ok) { data = await r.json(); at = Date.now(); try { localStorage.setItem('gyosoku.sea.v1', JSON.stringify(data)); } catch {} } }
    catch { try { data = data || JSON.parse(localStorage.getItem('gyosoku.sea.v1') || 'null'); } catch {} }
    finally { busy = false; draw(); }
  }
  new MutationObserver(load).observe(document.body, { attributes: true, attributeFilter: ['data-screen'] });
  new MutationObserver(draw).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  setInterval(() => { if (document.body.dataset.screen === 'sea' && !card.isConnected) draw(); }, 3000);
  load();
}
