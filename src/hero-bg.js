// Hero background video with a seamless loop: two copies cross-fade near the end instead of jumping back to the start.
// Plays slightly slower, only while on screen; never for reduced motion or data saver.
const a = document.getElementById('hero-video');
if (a) {
  const saver = navigator.connection && (navigator.connection.saveData || /(^|-)2g$/.test(navigator.connection.effectiveType || ''));
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || saver) { a.remove(); }
  else {
    const RATE = 0.8, FADE = 1.8; // playback speed; seconds (video time) of overlap at the seam
    a.loop = false; a.playbackRate = RATE;
    const b = a.cloneNode(); b.id = 'hero-video-2'; b.removeAttribute('poster'); b.loop = false; b.playbackRate = RATE; b.preload = 'metadata';
    a.parentElement.append(b);
    a.classList.add('on'); b.classList.remove('on');
    let cur = a, other = b, on = true, raf = 0, switching = false;
    const tick = () => {
      raf = 0; if (!on || document.hidden) return;
      const d = cur.duration;
      if (d && !switching && cur.currentTime >= d - FADE) {
        switching = true;
        const from = cur, to = other; // fixed references: cur/other are swapped right below
        cur = to; other = from;
        to.currentTime = 0; to.playbackRate = RATE;
        to.play().catch(() => {});
        to.classList.add('on'); from.classList.remove('on');
        setTimeout(() => { from.pause(); from.currentTime = 0; switching = false; }, (FADE / RATE) * 1000 + 400);
      }
      raf = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (on && !document.hidden) { cur.play().catch(() => {}); if (!raf) raf = requestAnimationFrame(tick); }
      else { a.pause(); b.pause(); if (raf) cancelAnimationFrame(raf); raf = 0; }
    };
    new IntersectionObserver(([e]) => { on = e.isIntersecting; sync(); }, { threshold: 0.05 }).observe(a.parentElement);
    document.addEventListener('visibilitychange', sync);
    a.addEventListener('error', () => { b.remove(); a.remove(); });
    sync();
  }
}
