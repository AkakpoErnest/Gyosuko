// Fixed public reference points: no fisherman/profile/location data leaves the app.
export const config = { path: '/api/conditions' };
const LAND = { latitude: 38.90112, longitude: 141.57745 };
const SEA = { latitude: 38.90, longitude: 141.90 };
let cached = null, pending = null;
const TTL = 30 * 60 * 1000;
const value = (array, index) => Number.isFinite(array?.[index]) ? array[index] : null;
export function combine(weather, marine, retrievedAt = new Date().toISOString()) {
  const dates = [...new Set([...(weather?.daily?.time || []), ...(marine?.daily?.time || [])])].filter(v => /^\d{4}-\d{2}-\d{2}$/.test(v)).sort().slice(0,3);
  return { retrievedAt, timezone: 'Asia/Tokyo', location: 'Kesennuma', landPoint: LAND, seaPoint: marine ? {latitude: marine.latitude, longitude: marine.longitude} : SEA,
    days: dates.map(date => {const w=weather?.daily?.time?.indexOf(date)??-1;const m=marine?.daily?.time?.indexOf(date)??-1;return {date, windMaxMs: value(weather?.daily?.wind_speed_10m_max,w), rainMm: value(weather?.daily?.precipitation_sum,w), waveMaxM: value(marine?.daily?.wave_height_max,m)};}),
    weatherAvailable: !!weather, marineAvailable: !!marine };
}
async function load(host, path, parameters) {
  const url = new URL(path, host);
  for (const [key,value] of Object.entries(parameters)) url.searchParams.set(key, String(value));
  if (process.env.OPEN_METEO_API_KEY) url.searchParams.set('apikey', process.env.OPEN_METEO_API_KEY);
  const response = await fetch(url, {signal: AbortSignal.timeout(8000)});
  if (!response.ok) throw Error('Forecast unavailable');
  const data = await response.json();
  if (!Array.isArray(data.daily?.time) || data.timezone !== 'Asia/Tokyo') throw Error('Invalid forecast');
  return data;
}
export default async function handler(request) {
  if (request.method !== 'GET') return new Response(null,{status:405,headers:{Allow:'GET'}});
  if (cached && Date.now()-Date.parse(cached.retrievedAt)<TTL) return reply(cached);
  if (!pending) pending = (async()=>{
    const paid=!!process.env.OPEN_METEO_API_KEY;
    const results=await Promise.allSettled([
      load(paid?'https://customer-api.open-meteo.com':'https://api.open-meteo.com','/v1/forecast',{...LAND,daily:'wind_speed_10m_max,precipitation_sum',wind_speed_unit:'ms',timezone:'Asia/Tokyo',forecast_days:3}),
      load(paid?'https://customer-marine-api.open-meteo.com':'https://marine-api.open-meteo.com','/v1/marine',{...SEA,daily:'wave_height_max',timezone:'Asia/Tokyo',forecast_days:3,models:'gwam'})
    ]);
    const data=combine(...results.map(r=>r.status==='fulfilled'?r.value:null));
    if(!data.days.some(d=>[d.windMaxMs,d.rainMm,d.waveMaxM].some(Number.isFinite)))throw Error('No forecast values');
    cached=data;return data;
  })().finally(()=>pending=null);
  try {return reply(await pending);}catch{return Response.json({error:'Conditions temporarily unavailable'},{status:503,headers:{'Cache-Control':'no-store'}});}
}
function reply(data){return Response.json(data,{headers:{'Cache-Control':'public, max-age=300','Netlify-CDN-Cache-Control':'public, max-age=1800'}});}
