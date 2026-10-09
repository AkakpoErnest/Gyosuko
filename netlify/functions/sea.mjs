// Sea extras for Kesennuma from open data, no keys: sea-surface temperature + current (Open-Meteo Marine, CC BY 4.0)
// and the official forecast text for eastern Miyagi (気象庁 JMA, free to use with credit). Cached 15 minutes. No user data involved.
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' } });
let cache = null;
const sp = (t) => String(t || '').replace(/[　\s]+/g, ' ').trim();
async function get(url, ms = 9000) { const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { 'User-Agent': 'Gyosoku/1.0 (Kesennuma)' } }); if (!r.ok) throw new Error(String(r.status)); return r.json(); }

export default async () => {
  if (cache && Date.now() - cache.t < 900_000) return json(cache.v);
  const out = { retrievedAt: new Date().toISOString(), sea: null, jma: null, warning: null };
  await Promise.allSettled([
    (async () => {
      const m = await get('https://marine-api.open-meteo.com/v1/marine?latitude=38.9&longitude=142.0&hourly=sea_surface_temperature,ocean_current_velocity,ocean_current_direction&timezone=Asia%2FTokyo&forecast_days=1');
      const h = m.hourly || {}, now = new Date(Date.now() + 9 * 3600e3).getUTCHours();
      const pick = (a) => (Array.isArray(a) && Number.isFinite(a[now]) ? Math.round(a[now] * 10) / 10 : null);
      out.sea = { tempC: pick(h.sea_surface_temperature), currentKmh: pick(h.ocean_current_velocity), currentDir: pick(h.ocean_current_direction) };
    })(),
    (async () => {
      const d = await get('https://www.jma.go.jp/bosai/forecast/data/forecast/040000.json'), r = d[0], ts = r.timeSeries[0], a = ts.areas.find((x) => x.area.name === '東部') || ts.areas[0];
      out.jma = { office: r.publishingOffice, reportedAt: r.reportDatetime, area: a.area.name, days: ts.timeDefines.slice(0, 3).map((t, i) => ({ date: t.slice(0, 10), weather: sp(a.weathers?.[i]), wind: sp(a.winds?.[i]), waves: sp(a.waves?.[i]) })) };
    })(),
    (async () => {
      const w = await get('https://www.jma.go.jp/bosai/warning/data/warning/040000.json');
      // the file keeps its last issued text, so only show it when it is recent
      if (w.reportDatetime && Date.now() - Date.parse(w.reportDatetime) < 36 * 3600e3 && w.headlineText) out.warning = { text: sp(w.headlineText), reportedAt: w.reportDatetime };
    })(),
  ]);
  if (!out.sea && !out.jma) return json({ error: 'unavailable' }, 502);
  cache = { t: Date.now(), v: out };
  return json(out);
};
export const config = { path: '/api/sea' };
