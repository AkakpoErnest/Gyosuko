// The entrance animations play on every load, including refreshes (user's choice). This flag script is kept so index.html stays unchanged;
// to make animations play only once per visit again, set the .no-intro class here when sessionStorage has 'gyosoku.intro.seen'.
try { sessionStorage.removeItem('gyosoku.intro.seen'); } catch {}
