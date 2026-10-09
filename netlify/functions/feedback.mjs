// Collects feedback from the fishermen test. POST stores one answer; GET (with the admin token) shows all answers.
// Stored in Netlify Blobs. No account needed. Only what the person types is stored (plus language and time).
import { getStore } from '@netlify/blobs';

const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hits = new Map();
const limited = (ip) => { const n = Date.now(); const r = (hits.get(ip) || []).filter((t) => n - t < 600_000); r.push(n); hits.set(ip, r); if (hits.size > 5000) hits.clear(); return r.length > 10; };
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const pick = (v, list) => (list.includes(v) ? v : '');

export default async (req, context) => {
  const store = getStore('feedback');
  const url = new URL(req.url);

  if (req.method === 'GET') {
    const token = process.env.FEEDBACK_ADMIN_TOKEN;
    const given = url.searchParams.get('token') || '';
    if (!token || given.length !== token.length || given !== token) return new Response('Not found', { status: 404 });
    const { blobs } = await store.list();
    const rows = (await Promise.all(blobs.map(async (b) => { try { return await store.get(b.key, { type: 'json' }); } catch { return null; } }))).filter(Boolean).sort((a, b) => (b.at || '').localeCompare(a.at || ''));
    if (url.searchParams.get('format') === 'json') return json(rows);
    const th = ['at', 'name', 'role', 'port', 'tried', 'easy', 'useful', 'wish', 'comment', 'contact'];
    const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Gyosoku feedback (${rows.length})</title><style>body{font:14px system-ui;margin:16px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;vertical-align:top;text-align:left}th{background:#eef}</style><h1>Gyosoku feedback · ${rows.length}</h1><table><tr>${th.map((h) => `<th>${h}</th>`).join('')}</tr>${rows.map((r) => `<tr>${th.map((h) => `<td>${esc(r[h])}</td>`).join('')}</tr>`).join('')}</table>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }

  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return json({ error: 'origin' }, 403);
  if (limited(context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon')) return json({ error: 'rate' }, 429);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad' }, 400); }
  const rec = {
    at: new Date().toISOString(),
    lang: pick(b.lang, ['ja', 'en']),
    name: clip(b.name, 60), role: clip(b.role, 40), port: clip(b.port, 60),
    tried: pick(b.tried, ['yes', 'partly', 'no']),
    easy: pick(b.easy, ['easy', 'ok', 'hard']),
    useful: pick(b.useful, ['yes', 'maybe', 'no']),
    wish: clip(b.wish, 600), comment: clip(b.comment, 1000), contact: clip(b.contact, 80),
  };
  if (!rec.tried && !rec.easy && !rec.useful && !rec.wish && !rec.comment) return json({ error: 'empty' }, 400);
  await store.setJSON(`${rec.at}-${crypto.randomUUID().slice(0, 8)}`, rec);
  return json({ ok: true });
};

export const config = { path: '/api/feedback' };
