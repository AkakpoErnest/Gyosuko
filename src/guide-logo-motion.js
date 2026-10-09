// Animate only the guide's avatar; keep navigation and brand logos static.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const selector = '.guide-fab img, .guide__head img, .lg-fab img, .lg-head img';
function update() {
  const source = preference.matches ? '/public/logo.png' : '/public/gyosoku-guide.gif';
  for (const image of document.querySelectorAll(selector)) {
    if (image.getAttribute('src') !== source) image.setAttribute('src', source);
  }
}
new MutationObserver(update).observe(document.body, { childList: true, subtree: true });
preference.addEventListener('change', update);
update();
