// Launch animation before the app. Loaded as a plain script in <head> so the cover is up before first paint.
// Plays once per browser session (not on every tab switch or reload inside the visit); tap anywhere to skip.
(function () {
  var KEY = 'gyosoku.splash.v1', seen = false;
  try { seen = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  if (seen) return;
  var root = document.documentElement, ja = !/^en/i.test(root.lang || 'ja');
  try { var saved = localStorage.getItem('gyosoku.fisherman.lang'); if (saved) ja = saved === 'ja'; } catch (e) {}
  root.classList.add('splash-on');
  var NS = 'http://www.w3.org/2000/svg';
  function svg(cls, vb, d) { var s = document.createElementNS(NS, 'svg'); s.setAttribute('class', cls); s.setAttribute('viewBox', vb); s.setAttribute('preserveAspectRatio', 'none'); s.setAttribute('aria-hidden', 'true'); var p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); s.appendChild(p); return s; }
  function el(tag, cls, txt) { var n = document.createElement(tag); n.className = cls; if (txt) n.textContent = txt; return n; }
  function build() {
    var box = el('div', 'splash'); box.setAttribute('role', 'presentation');
    var core = el('div', 'splash__core'), logo = el('img', 'splash__logo'); logo.src = '/public/logo.png'; logo.alt = ''; logo.width = 84; logo.height = 84;
    var name = el('h1', 'splash__name', 'Gyosoku'); name.appendChild(el('small', '', '魚測'));
    core.append(logo, name, el('p', 'splash__tag', ja ? '気仙沼の港から、魚の見通しを。' : 'A clear view of the catch, from Kesennuma’s harbor.'));
    var sea = el('div', 'splash__sea');
    var wave = 'M0 40 Q 100 0 200 40 T 400 40 T 600 40 T 800 40 V100 H0 Z';
    var a = svg('splash__wave splash__wave--a', '0 0 800 100', wave), b = svg('splash__wave splash__wave--b', '0 0 800 100', 'M0 55 Q 100 20 200 55 T 400 55 T 600 55 T 800 55 V100 H0 Z');
    sea.append(a, b);
    var fish = svg('splash__fish', '0 0 64 32', 'M2 16 Q 18 0 40 8 L 52 2 L 48 16 L 52 30 L 40 24 Q 18 32 2 16 Z M 14 13 a2 2 0 1 0 0.01 0');
    fish.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    box.append(el('div', 'splash__sun'), sea, fish, core);
    var done = false;
    function finish() {
      if (done) return; done = true;
      box.classList.add('is-out'); root.classList.remove('splash-on');
      setTimeout(function () { box.remove(); }, 500);
    }
    box.addEventListener('click', finish);
    setTimeout(finish, 2300);
    document.body.appendChild(box);
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
  // safety net: never leave the cover up if something goes wrong
  setTimeout(function () { root.classList.remove('splash-on'); }, 4000);
})();
