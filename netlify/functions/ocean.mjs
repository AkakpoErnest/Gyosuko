// Offshore model context, not harbor measurements or navigation advice.
export const config = { path: '/api/ocean' };
const POINT = { latitude: 38.90, longitude: 141.90 };
const TTL = 30 * 60 * 1000;
const FIELDS = { temperatureC: ['sea_surface_temperature', '°C'], currentKmh: ['ocean_current_velocity', 'km/h'], currentDirectionDeg: ['ocean_current_direction', '°'] };

export function normalizeOcean(raw, now = Date.now()) {
  if (raw?.timezone !== 'Asia/Tokyo' || raw.utc_offset_seconds !== 32400 ||
      !Number.isFinite(raw.latitude) || !Number.isFinite(raw.longitude) ||
      !Array.isArray(raw.hourly?.time)) throw Error('Invalid ocean response');
  for (const [field, unit] of Object.values(FIELDS)) {
    if (raw.hourly_units?.[field] !== unit || !Array.isArray(raw.hourly[field]) ||
        raw.hourly[field].length !== raw.hourly.time.length) throw Error('Invalid ocean units or series');
  }
  const hours = raw.hourly.time.slice(0, 72).map((time, index) => {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(time)) throw Error('Invalid forecast time');
    const timestamp = `${time}+09:00`;
    if (!Number.isFinite(Date.parse(timestamp))) throw Error('Invalid forecast time');
    const row = { time: timestamp };
    for (const [key, [field]] of Object.entries(FIELDS)) {
      const v = raw.hourly[field][index];
      row[key] = Number.isFinite(v) ? v : null;
    }
    if (row.currentKmh < 0) row.currentKmh = null;
    if (row.currentDirectionDeg !== null && (row.currentDirectionDeg < 0 || row.currentDirectionDeg > 360)) row.currentDirectionDeg = null;
    return row;
  }).sort((a, b) => Date.parse(a.time) - Date.parse(b.time));
  if (!hours.some(row => Object.keys(FIELDS).some(key => Number.isFinite(row[key])))) throw Error('No ocean values');
  const currentHour = hours.find(row => Date.parse(row.time) <= now && now < Date.parse(row.time) + 3600000) || null;
  if (!currentHour) throw Error('Forecast does not cover current hour');
  return {
    retrievedAt: new Date(now).toISOString(), timezone: 'Asia/Tokyo', location: 'Kesennuma offshore',
    requestedPoint: POINT, gridPoint: { latitude: raw.latitude, longitude: raw.longitude },
    kind: 'model-forecast', currentHour, hours,
    units: { temperatureC: '°C', currentKmh: 'km/h', currentDirectionDeg: '°' },
    source: { name: 'Open-Meteo / Météo-France ocean model', url: 'https://open-meteo.com/en/docs/marine-weather-api', modelSelection: 'best_match' },
    attribution: 'Open-Meteo; Météo-France / Copernicus Marine; DWD (marine API attribution)',
    limitations: { coastalNavigation: false, observed: false, currentDirection: 'towards', approximateResolutionKm: 8 },
  };
}

export function createOceanHandler({ fetcher = fetch, clock = Date.now, apiKey = process.env.OPEN_METEO_API_KEY } = {}) {
  let cached = null, pending = null;
  const reply = data => Response.json(data, { headers: { 'Cache-Control': 'public, max-age=300', 'Netlify-CDN-Cache-Control': 'public, max-age=1800' } });
  return async request => {
    if (request.method !== 'GET') return new Response(null, { status: 405, headers: { Allow: 'GET' } });
    if (cached && clock() - Date.parse(cached.retrievedAt) < TTL) return reply(cached);
    if (!pending) pending = (async () => {
      const url = new URL('/v1/marine', apiKey ? 'https://customer-marine-api.open-meteo.com' : 'https://marine-api.open-meteo.com');
      for (const [key, value] of Object.entries({ ...POINT, hourly: Object.values(FIELDS).map(([field]) => field).join(','), timezone: 'Asia/Tokyo', forecast_days: 3 })) url.searchParams.set(key, value);
      if (apiKey) url.searchParams.set('apikey', apiKey);
      const response = await fetcher(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) throw Error('Ocean source unavailable');
      cached = normalizeOcean(await response.json(), clock());
      return cached;
    })().finally(() => { pending = null; });
    try { return reply(await pending); }
    catch { return Response.json({ error: 'Ocean data temporarily unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } }); }
  };
}
export default createOceanHandler();
