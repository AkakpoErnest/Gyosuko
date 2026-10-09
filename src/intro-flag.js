// Runs before first paint (classic blocking script): the entrance animations play once per visit.
// A refresh in the same visit shows the finished page immediately.
try {
  if (sessionStorage.getItem('gyosoku.intro.seen')) document.documentElement.classList.add('no-intro');
  else sessionStorage.setItem('gyosoku.intro.seen', '1');
} catch {}
