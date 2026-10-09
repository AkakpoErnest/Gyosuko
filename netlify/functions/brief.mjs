// AI weather brief: turns the public 3-day forecast numbers into two plain sentences (JA or EN).
// Receives ONLY public forecast numbers (no profile, no catch data). Needs OPENAI_API_KEY; otherwise 503 and the app just hides the card.
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const hits = new Map(), cache = new Map();
const limited = (ip) => { const n = Date.now(), r = (hits.get(ip) || []).filter((t) => n - t < 60_000); r.push(n); hits.set(ip, r); if (hits.size > 5000) hits.clear(); return r.length > 6; };
const num = (v, lo, hi) => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? Math.round(v * 10) / 10 : null);

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host) return json({ error: 'origin' }, 403);
  const key = process.env.OPENAI_API_KEY; if (!key) return json({ error: 'ai-off' }, 503);
  if (limited(context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon')) return json({ error: 'rate' }, 429);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad' }, 400); }
  const lang = b.lang === 'en' ? 'en' : 'ja';
  const days = Array.isArray(b.days) ? b.days.slice(0, 3).map((d) => ({ date: /^\d{4}-\d{2}-\d{2}$/.test(d?.date) ? d.date : null, windMaxMs: num(d?.windMaxMs, 0, 80), rainMm: num(d?.rainMm, 0, 1000), waveMaxM: num(d?.waveMaxM, 0, 30) })) : [];
  if (!days.length || days.some((d) => !d.date)) return json({ error: 'bad' }, 400);
  const k = lang + JSON.stringify(days), hit = cache.get(k);
  if (hit && Date.now() - hit.t < 600_000) return json({ text: hit.text });
  const system = `You write a short weather note for fishermen in Kesennuma, Japan, from forecast numbers (max wind m/s, rain mm, max offshore wave height m for up to 3 days). Write exactly 2 short plain sentences in ${lang === 'ja' ? 'Japanese' : 'English'}: say which day looks calmest and which looks roughest, with the numbers. Never say whether to sail or fish, never give safety advice, never invent numbers or warnings. If a value is null say it is unavailable.`;
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ model: process.env.AI_MODEL || 'gpt-4o-mini', max_tokens: 160, temperature: 0.2, messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify(days) }] }) });
    if (!r.ok) return json({ error: 'upstream' }, 502);
    const text = ((await r.json()).choices?.[0]?.message?.content || '').trim().slice(0, 400);
    if (!text) return json({ error: 'empty' }, 502);
    cache.set(k, { t: Date.now(), text }); if (cache.size > 200) cache.clear();
    return json({ text });
  } catch { return json({ error: 'upstream' }, 502); }
};
export const config = { path: '/api/brief' };
