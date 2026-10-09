// Gyosoku guide: answers free-form questions with an AI model. Inert (503) until a key is set in Netlify's environment:
//   OPENAI_API_KEY     -> OpenAI GPT   [used first]
//   ANTHROPIC_API_KEY  -> Claude       [only if no OpenAI key is set]
// The key never reaches the browser. Only the question text and language are sent; no profile or catch data.
// Optional overrides: AI_MODEL (model id).

const PROVIDERS = {
  openai: { env: 'OPENAI_API_KEY', model: 'gpt-4o-mini', url: 'https://api.openai.com/v1/chat/completions' },
  anthropic: { env: 'ANTHROPIC_API_KEY', model: 'claude-haiku-5-5' },
};
const pick = () => { for (const [name, p] of Object.entries(PROVIDERS)) if (process.env[p.env]) return { name, key: process.env[p.env], model: process.env.AI_MODEL || p.model, url: p.url }; return null; };
const SYSTEM = `You are Gyosoku AI, the assistant inside a bilingual (Japanese/English) web app for Kesennuma City, Miyagi, Japan.
Gyosoku lets fishermen and captains share expected catches (fish, quantity, arrival time, port) so Kesennuma seafood processors can see whether supply will cover an order. A human always decides; nothing is ordered or sent automatically.
Facts you may state: estimates come from what fishermen report and are NOT a validated forecast; totals are shown only when 3 or more people have reported; entries are private to their owner.
You guide people through the app and you ACT: do not ask clarifying questions unless something essential is impossible to guess. Make sensible assumptions (arrival today, port Kesennuma, estimate not confirmed) and go ahead, then confirm in ONE short sentence what you did. Reply in the interface language given below unless the user clearly writes in another language. Do not invent data, prices, forecasts or partnerships. No legal, financial or safety advice. Never ask for personal details.
Respond with ONLY a JSON object: {"reply": string, "action": null | one of
 {"type":"navigate","to":"today"|"catch"|"me"|"role"|"overview"|"supply"|"decision"}
 {"type":"fill_catch","species":"skipjack"|"tuna"|"saury"|"mackerel"|"other","speciesName":string,"quantityKg":number,"day":"today"|"tomorrow"}
 {"type":"language","to":"ja"|"en"}
 {"type":"open","to":"app"|"processor"|"video"|"how"} }.
Use fill_catch when the user states a fish and an amount; navigate/open when they want to go somewhere; otherwise action is null.`;

const SPECIES = ['skipjack', 'tuna', 'saury', 'mackerel', 'other'];
const NAV = ['today', 'catch', 'me', 'role', 'overview', 'supply', 'decision'];
const OPEN = ['app', 'processor', 'video', 'how'];
// Only these shapes ever reach the browser, whatever the model returns.
function cleanAction(a) {
  if (!a || typeof a !== 'object') return null;
  if (a.type === 'navigate' && NAV.includes(a.to)) return { type: 'navigate', to: a.to };
  if (a.type === 'language' && (a.to === 'ja' || a.to === 'en')) return { type: 'language', to: a.to };
  if (a.type === 'open' && OPEN.includes(a.to)) return { type: 'open', to: a.to };
  if (a.type === 'fill_catch') {
    const q = Number(a.quantityKg);
    if (!SPECIES.includes(a.species) || !(q > 0 && q <= 1_000_000)) return null;
    return { type: 'fill_catch', species: a.species, speciesName: String(a.speciesName || '').slice(0, 50), quantityKg: q, day: a.day === 'tomorrow' ? 'tomorrow' : 'today' };
  }
  return null;
}
function parseModel(text) {
  const t = (text || '').trim();
  const m = t.match(/\{[\s\S]*\}/);
  if (m) { try { const j = JSON.parse(m[0]); if (typeof j.reply === 'string') return { answer: j.reply.trim().slice(0, 600), action: cleanAction(j.action) }; } catch {} }
  return { answer: t.slice(0, 600), action: null };
}

const hits = new Map();
const limited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 60_000);
  recent.push(now); hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 8;
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export default async (req, context) => {
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(req.url).host) return json({ error: 'origin' }, 403);
  const ai = pick();
  if (!ai) return json({ error: 'ai-off' }, 503);
  if (limited(context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon')) return json({ error: 'rate' }, 429);

  let body;
  try { body = await req.json(); } catch { return json({ error: 'bad' }, 400); }
  const q = typeof body.q === 'string' ? body.q.trim().slice(0, 300) : '';
  if (!q) return json({ error: 'empty' }, 400);
  const lang = body.lang === 'en' ? 'English' : 'Japanese';

  const system = `${SYSTEM}\nThe interface language is ${lang}. Reply in ${lang}.`;
  try {
    let r, answer = '';
    if (ai.name === 'openai') {
      r = await fetch(ai.url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ai.key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: ai.model, max_tokens: 400, temperature: 0.2, response_format: { type: 'json_object' }, messages: [{ role: 'system', content: system }, { role: 'user', content: q }] }),
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) return json({ error: 'upstream' }, 502);
      const j = await r.json();
      answer = (j.choices?.[0]?.message?.content || '').trim();
    } else {
      r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': ai.key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: ai.model, max_tokens: 400, system, messages: [{ role: 'user', content: q }] }),
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) return json({ error: 'upstream' }, 502);
      const j = await r.json();
      answer = (j.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
    }
    const out = parseModel(answer);
    return out.answer ? json(out) : json({ error: 'empty-answer' }, 502);
  } catch {
    return json({ error: 'upstream' }, 502);
  }
};

export const config = { path: '/api/guide' };
