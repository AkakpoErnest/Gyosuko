// First-party, privacy-friendly analytics. No cookies, no IP addresses, no personal data, no third-party scripts.
// POST /api/track  {e: event, s: source tag, p: path, l: lang, d: device, sid: random per-visit id}  -> stores one small record.
// GET  /api/track?token=...  -> private dashboard (needs FEEDBACK_ADMIN_TOKEN).
import { getStore } from '@netlify/blobs';

const EVENTS = ['page_view', 'app_open', 'video_play', 'role_chosen', 'profile_saved', 'catch_saved', 'ai_asked', 'sea_viewed', 'stats_viewed', 'feedback_sent', 'logout'];
const FUNNEL = [['page_view', '1  Opened a page'], ['app_open', '2  Opened the app'], ['role_chosen', '3  Chose a role'], ['profile_saved', '4  Saved profile'], ['catch_saved', '5  Saved a catch'], ['feedback_sent', '6  Sent feedback']];
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const hits = new Map();
const limited = (ip) => { const n = Date.now(), r = (hits.get(ip) || []).filter((t) => n - t < 60_000); r.push(n); hits.set(ip, r); if (hits.size > 5000) hits.clear(); return r.length > 60; };
const clean = (v, n = 24) => (typeof v === 'string' ? v.replace(/[^\w\-./]/g, '').slice(0, n) : '');
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const jst = (iso) => new Date(new Date(iso).getTime() + 9 * 3600e3).toISOString().slice(0, 10);

export default async (req, context) => {
  const store = getStore('analytics'), url = new URL(req.url);
  if (req.method === 'GET') {
    const token = process.env.FEEDBACK_ADMIN_TOKEN, given = url.searchParams.get('token') || '';
    if (!token || given.length !== token.length || given !== token) return new Response('Not found', { status: 404 });
    const { blobs } = await store.list();
    const rows = (await Promise.all(blobs.map(async (b) => { try { return await store.get(b.key, { type: 'json' }); } catch { return null; } }))).filter(Boolean);
    if (url.searchParams.get('format') === 'json') return json(rows);
    const days = [...new Set(rows.map((r) => jst(r.t)))].sort().reverse();
    const sess = (list) => new Set(list.map((r) => r.sid).filter(Boolean)).size;
    const by = (key, list) => { const m = new Map(); for (const r of list) { const k = r[key] || '(none)'; m.set(k, (m.get(k) || 0) + 1); } return [...m].sort((a, b) => b[1] - a[1]); };
    const day = url.searchParams.get('day') || 'all', list = day === 'all' ? rows : rows.filter((r) => jst(r.t) === day);
    const funnel = FUNNEL.map(([e, label]) => ({ label, n: sess(list.filter((r) => r.e === e)) }));
    const top = Math.max(1, funnel[0].n);
    const table = (title, data) => `<h3>${esc(title)}</h3><table>${data.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="n">${v}</td></tr>`).join('') || '<tr><td>(no data yet)</td></tr>'}</table>`;
    const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Gyosoku analytics</title><style>body{font:15px/1.5 system-ui,'Hiragino Sans';margin:0;padding:16px;background:#f3f7f4;color:#10272b;max-width:720px;margin:auto}h1{font-size:22px;margin:4px 0}h3{margin:22px 0 6px}table{width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden}td{padding:8px 12px;border-bottom:1px solid #e3ece8}.n{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}.bar{height:10px;background:#e3f3ee;border-radius:99px;overflow:hidden;margin-top:4px}.bar i{display:block;height:100%;background:#14786f}.f{background:#fff;padding:10px 12px;border-radius:12px;margin:6px 0}a{color:#14786f}.days a{margin-right:10px}</style><h1>Gyosoku · visits and steps</h1><p>Counts are <b>unique visits (sessions)</b> per step. No cookies, no IPs, no personal data. Times in Japan time. Total events: ${list.length}.</p><p class="days">Day: <a href="?token=${esc(given)}&day=all"><b>all</b></a> ${days.map((d) => `<a href="?token=${esc(given)}&day=${d}">${d}</a>`).join('')}</p><h3>Funnel (${esc(day)})</h3>${funnel.map((f) => `<div class="f"><b>${esc(f.label)}</b> <span style="float:right"><b>${f.n}</b></span><div class="bar"><i style="width:${Math.round((f.n / top) * 100)}%"></i></div></div>`).join('')}${table('Where people came from (source tag)', by('s', list.filter((r) => r.e === 'page_view')))}${table('Pages', by('p', list.filter((r) => r.e === 'page_view')))}${table('Language', by('l', list.filter((r) => r.e === 'page_view')))}${table('Device', by('d', list.filter((r) => r.e === 'page_view')))}${table('All events', by('e', list))}`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const origin = req.headers.get('origin');
  if (origin && new URL(origin).host !== url.host) return json({ error: 'origin' }, 403);
  if (limited(context?.ip || req.headers.get('x-nf-client-connection-ip') || 'anon')) return json({ error: 'rate' }, 429);
  let b; try { b = await req.json(); } catch { return json({ error: 'bad' }, 400); }
  if (!EVENTS.includes(b.e)) return json({ error: 'event' }, 400);
  const rec = { t: new Date().toISOString(), e: b.e, s: clean(b.s) || 'direct', p: clean(b.p, 40), l: b.l === 'en' ? 'en' : 'ja', d: b.d === 'd' ? 'desktop' : 'mobile', sid: clean(b.sid, 16) };
  await store.setJSON(`${rec.t}-${crypto.randomUUID().slice(0, 6)}`, rec);
  return json({ ok: true });
};
export const config = { path: '/api/track' };
