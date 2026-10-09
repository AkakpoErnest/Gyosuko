// Asks the server-side AI. Returns { answer, action } or null when the AI is off/unavailable (caller falls back).
// `action` is one of a small fixed set (navigate / fill_catch / language / open) already validated on the server;
// callers must still check it before acting.
export async function askAI(q, lang) {
  try {
    const r = await fetch('/api/guide', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ q, lang }), signal: AbortSignal.timeout(22000) });
    if (!r.ok) return null;
    const j = await r.json();
    if (typeof j.answer !== 'string' || !j.answer) return null;
    return { answer: j.answer, action: j.action && typeof j.action === 'object' ? j.action : null };
  } catch { return null; }
}
