// Privacy-friendly analytics (first-party). No cookies, no IP, no personal data. Honors Do Not Track.
// Window API: gyTrack('catch_saved'). Source tag comes from ?s=flyer in the URL (kept for the visit).
(() => {
  let demo = false; try { demo = new URLSearchParams(location.search).get('demo') === '1' || sessionStorage.getItem('gy.demo') === '1'; } catch {}
  if (demo || navigator.doNotTrack === '1' || window.doNotTrack === '1') { window.gyTrack = () => {}; return; }
  let sid = '', src = '';
  try {
    sid = sessionStorage.getItem('gy.sid') || Math.random().toString(36).slice(2, 12); sessionStorage.setItem('gy.sid', sid);
    const q = new URLSearchParams(location.search).get('s'); if (q) sessionStorage.setItem('gy.src', q);
    src = sessionStorage.getItem('gy.src') || '';
  } catch {}
  const send = (e) => {
    const body = JSON.stringify({ e, s: src, p: location.pathname, l: document.documentElement.lang === 'en' ? 'en' : 'ja', d: matchMedia('(max-width:820px)').matches ? 'm' : 'd', sid });
    try { fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {}); } catch {}
  };
  window.gyTrack = send;
  send('page_view');
  document.addEventListener('click', (ev) => {
    const a = ev.target.closest && ev.target.closest('a[href^="/fisherman/"], #play-video');
    if (!a) return; send(a.id === 'play-video' ? 'video_play' : 'app_open');
  }, true);
})();
