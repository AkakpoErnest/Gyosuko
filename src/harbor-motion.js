// A scroll-driven harbor illustration. Decorative motion never controls navigation.
const host = document.querySelector('.harbor-motion');
if (host) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = (tag, attrs = {}, ...children) => {
    const node = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
    node.append(...children.flat(Infinity));
    return node;
  };
  const fish = (className, size) => svg('g', { class: className },
    svg('g', { class: 'fish-shape', transform: `scale(${size})` },
      svg('image', { class: 'fish-real', href: '/public/skipjack-real.png', x: -85, y: -42, width: 170, height: 84, preserveAspectRatio: 'xMidYMid meet' })));
  const scene = svg('svg', { viewBox: '0 0 400 290', class: 'harbor-scene', 'aria-hidden': 'true', focusable: 'false' },
    svg('circle', { cx: 297, cy: 67, r: 31, class: 'harbor-sun' }),
    svg('path', { class: 'harbor-horizon', d: 'M18 123H382 M28 115L79 91L102 106L128 85L169 115 M261 115V100H276V115 M301 115V92H319V115' }),
    svg('path', { class: 'harbor-boat', d: 'M31 108H97L86 122H43Z M60 106V65L87 102H60 M56 72L34 102H56' }),
    svg('path', { class: 'harbor-water water-back', d: 'M0 160Q50 142 100 160T200 160T300 160T400 160V290H0Z' }),
    svg('path', { class: 'harbor-water water-front', d: 'M0 219Q50 199 100 219T200 219T300 219T400 219V290H0Z' }),
    svg('path', { class: 'harbor-current', d: 'M15 244Q70 221 126 244T237 244T348 244 M38 263Q89 250 140 263T242 263' }),
    fish('harbor-fish fish-main', 1), fish('harbor-fish fish-companion', .52),
    svg('g', { class: 'harbor-bubbles' }, [0, 1, 2].map((i) => svg('circle', { cx: 0, cy: 0, r: 3 + i * 1.5 }))));
  host.prepend(scene);
  const section = host.closest('section');
  const mainFish = scene.querySelector('.fish-main');
  const companion = scene.querySelector('.fish-companion');
  const bubbles = [...scene.querySelectorAll('.harbor-bubbles circle')];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, burst = 0, lastScroll = window.scrollY, direction = 1;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  function paint(now = 0) {
    frame = 0;
    const rect = section.getBoundingClientRect();
    const progress = reduce.matches ? .42 : clamp((innerHeight * .9 - rect.top) / (innerHeight * .7 + rect.height));
    const wave = Math.sin(progress * Math.PI * 2);
    const splash = !reduce.matches && burst ? Math.sin(clamp((now - burst) / 1000) * Math.PI) : 0;
    const x = 88 + progress * 210;
    const y = 180 - wave * 17 - splash * 57;
    mainFish.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(-wave * 9 - splash * 14).toFixed(1)})`);
    companion.setAttribute('transform', `translate(${(x - 51).toFixed(1)} ${(y + 51 + wave * 6).toFixed(1)})`);
    mainFish.querySelector('.fish-shape').style.transform = reduce.matches ? '' : `skewY(${Math.sin(progress * 30) * 2.5}deg)`;
    bubbles.forEach((bubble, i) => {
      bubble.setAttribute('cx', (x - 90 - i * 14).toFixed(1));
      bubble.setAttribute('cy', (y + 5 - i * 11 - splash * (12 + i * 5)).toFixed(1));
      bubble.style.opacity = String(reduce.matches ? .45 : .3 + splash * .6);
    });
    host.dataset.direction = String(direction);
    if (burst && now - burst < 1000 && !reduce.matches) frame = requestAnimationFrame(paint);
    else burst = 0;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  addEventListener('scroll', () => {
    direction = window.scrollY >= lastScroll ? 1 : -1;
    lastScroll = window.scrollY;
    schedule();
  }, { passive: true });
  addEventListener('resize', schedule);
  document.getElementById('language')?.addEventListener('click', schedule);
  reduce.addEventListener('change', schedule);
  host.querySelector('button')?.addEventListener('click', () => {
    if (reduce.matches) return;
    burst = performance.now(); schedule();
  });
  // Water leads; content follows. Text stays available without JavaScript.
  const sections = [...document.querySelectorAll('main > section')];
  const show = (item) => { item.classList.add('harbor-arrived'); observers.unobserve(item); };
  const observers = new IntersectionObserver((entries) => {
    for (const entry of entries) if (entry.isIntersecting) show(entry.target);
  }, { threshold: .04 });
  for (const item of sections) {
    const tide = document.createElement('div');
    tide.className = 'section-tide'; tide.setAttribute('aria-hidden', 'true');
    tide.append(svg('svg', { viewBox: '0 0 1000 100', preserveAspectRatio: 'none' },
      svg('path', { class: 'tide-back', d: 'M0 43Q125 8 250 43T500 43T750 43T1000 43V100H0Z' }),
      svg('path', { d: 'M0 66Q125 32 250 66T500 66T750 66T1000 66V100H0Z' })));
    const children = [...item.children];
    children.forEach((child, i) => child.style.setProperty('--reveal-delay', `${280 + Math.min(i, 4) * 65}ms`));
    item.prepend(tide); item.classList.add('harbor-section', 'harbor-prepared');
    if (reduce.matches) item.classList.add('harbor-arrived'); else observers.observe(item);
    // Keyboard users never need to wait for decorative effects.
    item.addEventListener('focusin', () => {
      item.classList.add('harbor-immediate'); show(item);
    });
  }
  reduce.addEventListener('change', () => {
    if (reduce.matches) for (const item of sections) { item.classList.add('harbor-immediate'); show(item); }
  });
  // A direct section link must reveal its target even during a fast scroll.
  function revealTarget() {
    const target = sections.find((item) => `#${item.id}` === location.hash);
    if (target) show(target);
  }
  addEventListener('hashchange', revealTarget);
  revealTarget();
  schedule();
}
