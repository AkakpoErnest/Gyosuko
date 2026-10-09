// Gyosoku backend client: Supabase Auth (email magic link) and REST over fetch.
// Config comes from /public/config.json ({ "supabaseUrl", "supabaseAnonKey" }).
// The anon key is public by design; row-level security protects the data.
// Without config the app stays in local-only mode.

const SESSION_KEY = 'gyosoku.session.v1';
let config = null;
let session = null;

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
  if (session && session.expires_at - Date.now() < 60_000) await refresh();
  if (session) {
    const user = await api('/auth/v1/user');
    if (user && user.id) session.user = user;
    else store(null);
  }
}

async function refresh() {
  if (!session?.refresh_token) return store(null);
  const res = await fetch(`${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!res.ok) return store(null);
  const j = await res.json();
  store({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Date.now() + j.expires_in * 1000 });
}

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(config.supabaseUrl + path, {
    method,
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${session?.access_token || config.supabaseAnonKey}`,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.status === 204 ? true : res.json().catch(() => true);
}

/** Email a one-time sign-in link. Resolves true if the request was accepted. */
export async function sendMagicLink(email) {
  const res = await fetch(`${config.supabaseUrl}/auth/v1/otp?redirect_to=${encodeURIComponent(location.origin + location.pathname)}`, {
    method: 'POST',
    headers: { apikey: config.supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, create_user: true }),
  });
  return res.ok;
}

export const signOut = () => store(null);

// ------------------------------------------------------------------ profiles

export async function getProfile() {
  if (!session) return null;
  const rows = await api(`/rest/v1/profiles?id=eq.${session.user.id}&select=role,display_name,details`);
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function saveProfile(role, displayName, details = {}) {
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
  const rows = await api('/rest/v1/catch_reports', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: toRow(record),
  });
  return Array.isArray(rows) ? rows[0] : null;
}

export async function listCatches() {
  const rows = await api('/rest/v1/catch_reports?select=*&order=arrival_date.desc&limit=200');
  return Array.isArray(rows) ? rows : [];
}

export async function updateCatch(id, record) {
  const ok = await api(`/rest/v1/catch_reports?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: toRow(record) });
  return !!ok;
}

export const deleteCatch = (id) => api(`/rest/v1/catch_reports?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });

/** Aggregated expected landings (needs >= 3 reporters; otherwise empty). */
export async function expectedLandings(species, until) {
  const rows = await api('/rest/v1/rpc/expected_landings', { method: 'POST', body: { p_species: species, p_until: until } });
  return Array.isArray(rows) ? rows[0] || null : null;
}
