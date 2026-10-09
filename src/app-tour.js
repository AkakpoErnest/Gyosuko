// "How the app works": real screenshots in two tilted phones; the screens change with the chosen/auto-advancing step.
const root = document.getElementById('app-tour');
if (root) {
  const shots = root.querySelector('.tour-phones').dataset.shots.split(',');
  const imgs = [...root.querySelectorAll('.tscreen img')], btns = [...root.querySelectorAll('.tour-steps button')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => (document.documentElement.lang.startsWith('en') ? 'en' : 'ja');
  const src = (i) => `/public/app-shots/${lang()}-${shots[Math.max(0, Math.min(shots.length - 1, i))]}.jpg`;
  let cur = 0, timer = 0, visible = false, userPaused = false;
  function swap(img, url) { if (img.getAttribute('src') === url) return; img.classList.add('out'); setTimeout(() => { img.src = url; img.onload = () => img.classList.remove('out'); setTimeout(() => img.classList.remove('out'), 400); }, 250); }
  function show(i, instant) {
    cur = (i + shots.length) % shots.length;
    btns.forEach((b, k) => b.setAttribute('aria-pressed', String(k === cur)));
    // front phone shows the current step, back phone shows the previous one (so the pair tells a story)
    if (instant) { imgs[1].src = src(cur); imgs[0].src = src(cur - 1 < 0 ? shots.length - 1 : cur - 1); } else { swap(imgs[1], src(cur)); swap(imgs[0], src(cur - 1 < 0 ? shots.length - 1 : cur - 1)); }
  }
  const tick = () => { clearTimeout(timer); if (reduced || userPaused || !visible || document.hidden) return; timer = setTimeout(() => { show(cur + 1); tick(); }, 4200); };
  btns.forEach((b, k) => b.addEventListener('click', () => { userPaused = true; show(k); }));
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; root.classList.toggle('in-view', visible || root.classList.contains('in-view')); if (visible) { if (!imgs[1].getAttribute('src')) show(0, true); tick(); } }, { threshold: 0.3 }).observe(root);
  document.addEventListener('visibilitychange', tick);
  new MutationObserver(() => show(cur, true)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  show(0, true);
}

