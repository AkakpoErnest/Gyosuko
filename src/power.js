// "Behind the screen": real, live values fetched from our own server functions. Nothing here is invented; failed fetches show a dash.
const root = document.getElementById('power');
if (root) {
  const $ = (id) => document.getElementById(id), ja = () => document.documentElement.lang.startsWith('ja');
  const stamp = (iso) => { const d = new Date(Date.parse(iso) + 9 * 3600e3); return `${d.getUTCMonth() + 1}/${d.getUTCDate()} ${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`; };
  const mark = (id) => $(id)?.closest('.pl-card')?.classList.add('live');
  let loaded = false;
  async function load() {
    if (loaded) return; loaded = true;
    const [sea, cond, ai] = await Promise.allSettled([
      fetch('/api/sea').then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/conditions').then((r) => (r.ok ? r.json() : Promise.reject())),
      fetch('/api/guide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q: '' }) }).then((r) => r.status),
    ]);
    if (sea.status === 'fulfilled') {
      const d = sea.value;
      if (d.jma) { $('pl-jma').textContent = `${stamp(d.jma.reportedAt)} JST`; mark('pl-jma'); } else $('pl-jma').textContent = '—';
      if (d.sea && d.sea.tempC != null) { $('pl-sst').textContent = `${d.sea.tempC} °C`; mark('pl-sst'); } else $('pl-sst').textContent = '—';
    } else { $('pl-jma').textContent = '—'; $('pl-sst').textContent = '—'; }
    if (cond.status === 'fulfilled' && Array.isArray(cond.value.days)) { const w = Math.max(...cond.value.days.map((x) => x.waveMaxM ?? 0)); $('pl-wave').textContent = `${w.toFixed(1)} m`; mark('pl-wave'); } else $('pl-wave').textContent = '—';
    if (ai.status === 'fulfilled' && ai.value === 400) { $('pl-ai').textContent = ja() ? '稼働中' : 'Online'; mark('pl-ai'); } else $('pl-ai').textContent = ja() ? '準備中' : 'Starting';
  }
  new IntersectionObserver(([e]) => { if (e.isIntersecting) load(); }, { rootMargin: '300px' }).observe(root);
  new MutationObserver(() => { const a = $('pl-ai'); if (a && /稼働|Online/.test(a.textContent)) a.textContent = ja() ? '稼働中' : 'Online'; }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
}
