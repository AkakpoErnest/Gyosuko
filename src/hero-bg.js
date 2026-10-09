// Hero background video: plays while on screen, pauses when hidden/offscreen, never for reduced motion or data saver.
const v = document.getElementById('hero-video');
if (v) {
  const saver = navigator.connection && (navigator.connection.saveData || /(^|-)2g$/.test(navigator.connection.effectiveType || ''));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || saver) { v.remove(); }
  else {
    let on = true;
    const sync = () => { if (on && !document.hidden) v.play().catch(() => {}); else v.pause(); };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; sync(); }, { threshold: 0.05 }).observe(v.parentElement);
    document.addEventListener('visibilitychange', sync);
    v.addEventListener('error', () => v.remove());
    sync();
  }
}
