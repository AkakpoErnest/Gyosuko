// Sea extras for Kesennuma from open data, no keys: sea-surface temperature + current (Open-Meteo Marine, CC BY 4.0)
// and the official forecast text for eastern Miyagi (気象庁 JMA, free to use with credit). Cached 15 minutes. No user data involved.
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=900' } });
let cache = null;
const sp = (t) => String(t || '').replace(/[　\s]+/g, ' ').trim();
// JMA warning/advisory kind codes (気象庁 警報・注意報種別). Unknown codes fall back to a generic label.
const KINDS = { '02': '暴風雪警報', '03': '大雨警報', '04': '洪水警報', '05': '暴風警報', '06': '大雪警報', '07': '波浪警報', '08': '高潮警報', '10': '大雨注意報', '12': '大雪注意報', '13': '風雪注意報', '14': '雷注意報', '15': '強風注意報', '16': '波浪注意報', '17': '融雪注意報', '18': '洪水注意報', '19': '高潮注意報', '20': '濃霧注意報', '21': '乾燥注意報', '22': 'なだれ注意報', '23': '低温注意報', '24': '霜注意報', '25': '着氷注意報', '26': '着雪注意報', '32': '暴風雪特別警報', '33': '大雨特別警報', '35': '暴風特別警報', '36': '大雪特別警報', '37': '波浪特別警報', '38': '高潮特別警報' };
// Current state for one municipality from the r8 bulletin array. The array holds many dates, so take the newest bulletin
// that covers the area, and read per-kind status (発表/継続 = active, 解除 = ended). Returns null when the area is not found.
export function parseWarnings(list, areaCode = '0420500') {
  if (!Array.isArray(list)) return null;
  const hit = list.map((b) => ({ b, item: b?.warning?.class20Items?.find((i) => i.areaCode === areaCode) })).filter((x) => x.item && x.b.reportDatetime)
    .sort((a, c) => Date.parse(c.b.reportDatetime) - Date.parse(a.b.reportDatetime))[0];
  if (!hit) return null;
  const active = hit.item.kinds.filter((k) => k.code && (k.status === '発表' || k.status === '継続')).map((k) => KINDS[k.code] || '警報・注意報');
  return { active, reportedAt: hit.b.reportDatetime, office: hit.b.publishingOffice };
}
async function get(url, ms = 9000) { const r = await fetch(url, { signal: AbortSignal.timeout(ms), headers: { 'User-Agent': 'Gyosoku/1.0 (Kesennuma)' } }); if (!r.ok) throw new Error(String(r.status)); return r.json(); }

export default async () => {
  if (cache && Date.now() - cache.t < 900_000) return json(cache.v);
  const out = { retrievedAt: new Date().toISOString(), sea: null, jma: null, warning: null };  // warning: { active: [names], reportedAt } for 気仙沼市, null if it could not be read
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
      const w = parseWarnings(await get('https://www.jma.go.jp/bosai/warning/data/r8/040000.json'));
      if (w) out.warning = w;
    })(),
  ]);
  if (!out.sea && !out.jma) return json({ error: 'unavailable' }, 502);
  cache = { t: Date.now(), v: out };
  return json(out);
};
export const config = { path: '/api/sea' };
