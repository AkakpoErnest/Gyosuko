// Runs before first paint. The entrance animations play on every load, including refreshes (user's choice).
// To make them play once per visit instead, add the .no-intro class to <html> here when sessionStorage has 'gyosoku.intro.seen'.
try { sessionStorage.removeItem('gyosoku.intro.seen'); } catch {}
// Web fonts load in the background so they never block the first paint (text shows at once in a fallback font, then swaps).
(function () { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Instrument+Serif&family=BIZ+UDPGothic:wght@400;700&display=swap'; document.head.appendChild(l); })();
