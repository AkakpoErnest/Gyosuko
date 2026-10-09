// Gyosoku backend client: Supabase Auth (email magic link) and REST over fetch.
// Config comes from /public/config.json ({ "supabaseUrl", "supabaseAnonKey" }).
// The anon key is public by design; row-level security protects the data.
// Without config the app stays in local-only mode.

const SESSION_KEY = 'gyosoku.session.v1';
let config = null;
let session = null;
let refreshing = null;
const sessionLost = new Set();
export function onSessionLost(callback) { sessionLost.add(callback); return () => sessionLost.delete(callback); }
function loseSession() {
  const hadSession = !!session; store(null);
  if (hadSession) for (const callback of sessionLost) { try { callback(); } catch {} }
}

export const isConfigured = () => !!config;
export const getSession = () => session;

function store(next) {
  session = next;
  try {
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
}

export async function init() {
  try {
    const res = await fetch('/public/config.json', { cache: 'no-store' });
    if (res.ok) {
      const c = await res.json();
      if (c.supabaseUrl && c.supabaseAnonKey) config = c;
    }
  } catch {}
  if (!config) return;

  // Returning from the magic link: tokens arrive in the URL fragment.
  const frag = new URLSearchParams(location.hash.replace(/^#/, ''));
  if (frag.get('access_token')) {
    const expiresIn = Number(frag.get('expires_in')) || 3600;
    store({
      access_token: frag.get('access_token'),
      refresh_token: frag.get('refresh_token'),
      expires_at: Date.now() + expiresIn * 1000,
    });
    history.replaceState(null, '', location.pathname + location.search);
  } else {
    try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch {}
  }
  if (session && session.expires_at - Date.now() < 60_000 && !(await refresh())) return;
  if (session) {
    const user = await api('/auth/v1/user');
    if (session && user && user.id) store({ ...session, user });
    // A temporary network failure must not erase a stored session.
  }
}

async function refresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    if (!session?.refresh_token) { loseSession(); return false; }
    const previous = session;
    try {
      const res = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST', headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: previous.refresh_token }),
      });
      if (session !== previous) return false; // Ignore a response after sign-out.
      if (!res.ok) { if ([400, 401, 403].includes(res.status)) loseSession(); return false; }
      const j = await res.json();
      if (session !== previous || !j.access_token || !j.refresh_token || !Number.isFinite(j.expires_in)) return false;
      store({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + j.expires_in * 1000, user: previous.user });
      return true;
    } catch { return false; }
  })();
  try { return await refreshing; } finally { refreshing = null; }
}

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  if (!config || !session) return null;
  if (session.expires_at - Date.now() < 60_000 && !(await refresh())) return null;
  async function request() {
    return fetch(config.supabaseUrl + path, {
      method, headers: { apikey: config.supabaseAnonKey, Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  try {
    let res = await request();
    if (res.status === 401) {
      if (!(await refresh())) return null;
      res = await request();
      if (res.status === 401) loseSession();
    }
    if (!res.ok) return null;
    return res.status === 204 ? true : res.json().catch(() => null);
  } catch { return null; }
}

/** Email a one-time sign-in link. Resolves true if the request was accepted. */
export async function sendMagicLink(email) {
  if (!config) return false;
  try {
  const res = await fetch(`${config.supabaseUrl}/auth/v1/otp?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, {
    method: 'POST',
    headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, create_user: true }),
  });
  return res.ok;
  } catch { return false; }
}

export const signOut = () => store(null);

// ------------------------------------------------------------------ profiles

export async function getProfile() {
  if (!session?.user?.id) return null;
  const rows = await api(`/rest/v1/profiles?id=eq.${session.user.id}&select=role,display_name,details`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function saveProfile(role, displayName, details = {}) {
  if (!session?.user?.id) return false;
  const ok = await api('/rest/v1/profiles?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { id: session.user.id, role, display_name: displayName || null, details },
  });
  return !!ok;
}

// ------------------------------------------------------------ catch reports

const toRow = (r) => ({
  species: r.species === 'other' ? r.otherSpecies : r.species,
  quantity_kg: Number(r.quantity),
  arrival_date: r.date,
  arrival_time: r.time || null,
  port: r.port,
  certainty: r.certainty,
  notes: r.notes || null,
});

export async function saveCatch(record) {
  const rows = await api('/rest/v1/catch_reports?on_conflict=id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: { ...toRow(record), id: record.id },
  });
  return Array.isArray(rows) ? rows[0] : null;
}

export async function listCatches() {
  const rows = await api('/rest/v1/catch_reports?select=*&order=arrival_date.desc&limit=200');
  return Array.isArray(rows) ? rows : null;
}

export async function updateCatch(id, record) {
  const rows = await api(`/rest/v1/catch_reports?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: toRow(record) });
  return Array.isArray(rows) && rows.some(row => row.id === id);
}

export const deleteCatch = async (id) => !!(await api(`/rest/v1/catch_reports?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }));

/** Aggregated expected landings (needs >= 3 reporters; otherwise empty). */
export async function expectedLandings(species, until) {
  const rows = await api('/rest/v1/rpc/expected_landings', { method: 'POST', body: { p_species: species, p_until: until } });
  return Array.isArray(rows) ? rows[0] || null : null;
}
