// Landing page: interactive 3D harbor scene (three.js, self-hosted). Loads only when scrolled near; falls back to the video/poster
// if WebGL is unavailable or the scene fails. Pauses off-screen and in hidden tabs. Honors reduced motion.
const fig = document.querySelector('.harbor-story');
if (fig) {
  const host = fig.querySelector('.harbor-3d'), video = fig.querySelector('.harbor-fallback'), button = fig.querySelector('.harbor-story-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ja = () => document.documentElement.lang.startsWith('ja');
  let api = null, visible = false, failed = false;
  const label = () => {
    button.textContent = ja() ? '↺ 元の向きに戻す' : '↺ Reset view';
    host.setAttribute('aria-label', ja() ? host.dataset.jaLabel : 'Interactive 3D concept scene: fishing boat, dock, landed tuna and Gyosoku on a phone. Drag or use the arrow keys to turn it.');
  };
  const fallback = () => { failed = true; host.hidden = true; button.hidden = true; video.hidden = false; video.controls = true; };
  const update = () => { if (!api) return; if (visible && !document.hidden) api.start(); else api.stop(); };
  const webgl = () => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } };
  async function load() {
    if (api || failed) return;
    if (!webgl()) return fallback();
    try {
      const { mountHarbor } = await import('/public/js/harbor-story.bundle.js');
      api = mountHarbor(host, { reducedMotion: reduced.matches });
      host.addEventListener('harbor:lost', fallback);
      button.hidden = false; button.addEventListener('click', () => api.reset());
      host.classList.add('ready'); label(); update();
    } catch { fallback(); }
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) load(); update(); }, { rootMargin: '200px', threshold: 0.05 }).observe(fig);
  document.addEventListener('visibilitychange', update);
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] }); label();
}
