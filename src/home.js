const translated = [...document.querySelectorAll('[data-ja]')];
for (const element of translated) element.dataset.en = element.innerHTML;
const toggle = document.getElementById('language');
let language = 'ja'; // Japanese first; the toggle switches to English and the choice is remembered
try { language = localStorage.getItem('gyosoku.lang') === 'en' ? 'en' : 'ja'; } catch {}
function renderLanguage() {
  document.documentElement.lang = language;
  for (const element of translated) {
    if (language === 'ja') element.textContent = element.dataset.ja;
    else element.innerHTML = element.dataset.en;
  }
  toggle.textContent = language === 'ja' ? 'English' : '日本語';
  toggle.setAttribute('aria-label', language === 'ja' ? 'Switch to English' : '日本語に切り替え');
  window.__gyoWords?.();
}
toggle.addEventListener('click', () => {
  language = language === 'en' ? 'ja' : 'en';
  try { localStorage.setItem('gyosoku.lang', language); } catch {}
  renderLanguage();
});
// Preserve older links that opened app views at the root URL.
if (['#overview', '#supply', '#decision', '#activity', '#technical'].includes(location.hash)) {
  location.replace(`/app/${location.hash}`);
}
renderLanguage();
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

// Intro video: the file lives at /public/gyosoku-video.mp4. Until it exists, the dialog says "coming soon".
const VIDEO_SRC = '/public/gyosoku-video.mp4';
const dialog = document.getElementById('video-dialog');
const video = document.getElementById('video');
const videoEmpty = document.getElementById('video-empty');
async function openVideo() {
  let found = false;
  try { const r = await fetch(VIDEO_SRC, { method: 'HEAD', cache: 'no-store' }); found = r.ok && (r.headers.get('content-type') || '').startsWith('video/'); } catch {}
  video.hidden = !found; videoEmpty.hidden = found;
  if (found && !video.getAttribute('src')) video.src = VIDEO_SRC;
  if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
  if (found) video.play().catch(() => {});
}
function closeVideo() { video.pause(); if (dialog.close) dialog.close(); else dialog.removeAttribute('open'); }
document.getElementById('play-video')?.addEventListener('click', openVideo);
document.getElementById('video-close')?.addEventListener('click', closeVideo);
dialog?.addEventListener('click', (e) => { if (e.target === dialog) closeVideo(); });
dialog?.addEventListener('close', () => video.pause());

// Word-by-word text animation, left to right: hero text plays on load, section headings play as they scroll into view.
(() => {
  if (document.documentElement.classList.contains('no-intro') || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = [...document.querySelectorAll('.hero h1, .hero .lead')];
  const others = [...document.querySelectorAll('.section h2, .closing h2')];
  [...hero, ...others].forEach((el) => el.setAttribute('data-words', ''));
  document.documentElement.classList.add('js-words');
  const seg = (lang) => (typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(lang, { granularity: 'word' }) : null);
  function split(el, step, base) {
    let n = 0;
    const lang = document.documentElement.lang || 'en';
    const sg = seg(lang);
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const text = child.textContent;
          if (!text.trim()) continue;
          const frag = document.createDocumentFragment();
          const parts = sg ? [...sg.segment(text)].map((x) => ({ t: x.segment, w: x.isWordLike })) : text.split(/(\s+)/).filter(Boolean).map((t) => ({ t, w: /\S/.test(t) }));
          for (const part of parts) {
            if (!part.w && !/\S/.test(part.t)) { frag.append(document.createTextNode(part.t)); continue; }
            const span = document.createElement('span');
            span.className = 'w'; span.textContent = part.t;
            // punctuation arrives together with the word before it
            const at = part.w ? n : Math.max(0, n - 1);
            span.style.setProperty('--wd', `${base + at * step}ms`);
            if (part.w) n++;
            frag.append(span);
          }
          child.replaceWith(frag);
        } else if (child.nodeType === 1 && !child.classList.contains('w')) walk(child);
      }
    };
    walk(el);
    return base + n * step;
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.3 });
  let first = true;
  window.__gyoWords = () => {
    // hero: one after another — headline words, then the paragraph words, then the buttons
    let t = 150;
    hero.forEach((el, i) => { t = split(el, i === 0 ? 120 : 36, t) + 200; });
    document.querySelectorAll('.hero-actions, .hero .caption').forEach((el) => { el.style.animationDelay = `${t}ms`; });
    others.forEach((el) => split(el, 110, 120));
    requestAnimationFrame(() => {
      hero.forEach((el) => { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); });
      others.forEach((el) => { if (el.classList.contains('in')) { el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); } else if (first) io.observe(el); });
      first = false;
    });
  };
  window.__gyoWords();
})();

// Scroll reveal: text and cards fade up as each section comes into view. Content stays visible if JS or motion is unavailable.
(() => {
  if (document.documentElement.classList.contains('no-intro') || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = [...document.querySelectorAll('.section .eyebrow, .section h2, .section h3, .section > div > p, .section > p, .section li, .section .caption, .steps article, .views a, .ledger > div, .faq details, .section .text-link, .closing > *')];
  const targetsAll = targets; targets.splice(0, targets.length, ...targetsAll.filter((el) => !el.matches('[data-words]')));
  document.documentElement.classList.add('js-reveal');
  const groups = new Map();
  for (const el of targets) {
    el.classList.add('rv');
    const parent = el.parentElement;
    const n = groups.get(parent) || 0;
    groups.set(parent, n + 1);
    el.style.setProperty('--rv-d', `${Math.min(n, 8) * 170}ms`);
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }, { threshold: 0.2, rootMargin: '0px 0px -12% 0px' });
  targets.forEach((el) => io.observe(el));
})();

// Landing background: faint bubbles rising and slow waves along the bottom of the screen.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = (a, b) => a + Math.random() * (b - a);
  const layer = document.createElement('div');
  layer.className = 'bgfx'; layer.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 7; i++) {
    const b = document.createElement('span');
    b.className = 'bgb';
    b.style.cssText = `--x:${r(2, 97).toFixed(1)}%;--s:${r(8, 30).toFixed(0)}px;--t:${r(12, 26).toFixed(1)}s;--d:${(-r(0, 24)).toFixed(1)}s;--w:${r(10, 36).toFixed(0)}px`;
    layer.append(b);
  }
  const wave = (cls) => `<svg class="bgw ${cls}" viewBox="0 0 2880 160" preserveAspectRatio="none"><path d="M0 80c240-70 480-70 720 0s480 70 720 0 480-70 720 0 480 70 720 0V160H0z"/></svg>`;
  layer.insertAdjacentHTML('beforeend', wave('bgw1') + wave('bgw2'));
  document.body.prepend(layer);
})();
