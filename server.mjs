// Gyosoku — minimal static server (Node standard library only).
//
// Serves the repository root as static files for the prototype. There are no
// business endpoints, no API, and no database: everything the demo shows is
// synthetic data bundled in the client (src/data.js).
//
// Defaults to binding 127.0.0.1 so the demo is reachable only from this machine.
// Cloud sandboxes / preview environments that proxy traffic into the container
// can set HOST=0.0.0.0 explicitly.

import http from 'node:http';
import { stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const CSP = [
  "default-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",
  "script-src 'self'",
  "connect-src 'none'",
  "frame-ancestors 'none'",
].join('; ');

const BASE_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Cache-Control': 'no-store',
  'Content-Security-Policy': CSP,
  'Referrer-Policy': 'no-referrer',
};

function log(req, status) {
  const ts = new Date().toISOString();
  process.stdout.write(`${ts} ${req.method} ${req.url} -> ${status}\n`);
}

function send(req, res, status, body, extraHeaders = {}) {
  const headers = { ...BASE_HEADERS, ...extraHeaders };
  if (!headers['Content-Type']) headers['Content-Type'] = 'text/plain; charset=utf-8';
  if (body !== undefined) headers['Content-Length'] = Buffer.byteLength(body);
  res.writeHead(status, headers);
  log(req, status);
  if (req.method === 'HEAD' || body === undefined) res.end();
  else res.end(body);
}

// Resolve a request path to a file inside ROOT, or return a status code to refuse it.
// Returns { file } or { status }.
function resolveRequest(rawUrl) {
  // Strip query/hash from the raw request target, then percent-decode it.
  // Deliberately NOT using `new URL()` here: the WHATWG parser silently
  // collapses `..` segments, which would hide traversal attempts from the
  // guards below. We want to see the path exactly as the client sent it.
  const rawPath = rawUrl.split(/[?#]/, 1)[0];
  let pathname;
  try {
    pathname = decodeURIComponent(rawPath);
  } catch {
    return { status: 400 };
  }

  if (!pathname.startsWith('/') || pathname.includes('\0') || pathname.includes('\\')) {
    return { status: 400 };
  }

  // Containment guard: resolved path must stay inside ROOT (traversal -> 403).
  const resolved = path.resolve(ROOT, '.' + pathname);
  const rel = path.relative(ROOT, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return { status: 403 };

  // Dotfile / dot-directory guard (.git, .env, .DS_Store, ...) -> 404.
  const segments = pathname.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.'))) return { status: 404 };

  return { pathname, resolved };
}

async function fileInfo(p) {
  try {
    const s = await stat(p);
    return s;
  } catch {
    return null;
  }
}

async function serveFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext];
  if (!type) return send(req, res, 404, 'Not found');
  try {
    const body = await readFile(filePath);
    send(req, res, 200, body, { 'Content-Type': type });
  } catch {
    send(req, res, 404, 'Not found');
  }
}

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(req, res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
  }

  const r = resolveRequest(req.url || '/');
  if (r.status) {
    const text = r.status === 403 ? 'Forbidden' : r.status === 404 ? 'Not found' : 'Bad request';
    return send(req, res, r.status, text);
  }

  const indexPath = path.join(ROOT, 'index.html');
  let target = r.resolved;

  if (r.pathname === '/' || r.pathname === '') {
    target = indexPath;
  } else {
    const info = await fileInfo(target);
    if (info && info.isDirectory()) {
      target = path.join(target, 'index.html');
    } else if (!info) {
      // SPA fallback only for extensionless paths; asset-looking paths 404.
      if (path.extname(r.pathname) === '') target = indexPath;
      else return send(req, res, 404, 'Not found');
    }
  }

  // Extension allowlist applies to whatever we ended up with.
  const ext = path.extname(target).toLowerCase();
  if (!MIME[ext]) return send(req, res, 404, 'Not found');

  const info = await fileInfo(target);
  if (!info || !info.isFile()) return send(req, res, 404, 'Not found');

  return serveFile(req, res, target);
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => {
    // Never leak internal details (paths, stack traces) to the client.
    try {
      send(req, res, 500, 'Internal server error');
    } catch {
      res.destroy();
    }
  });
});

server.on('error', (err) => {
  process.stderr.write(`Server error: ${err.code || err.message}\n`);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  const shownHost = HOST === '0.0.0.0' || HOST === '::' ? '127.0.0.1' : HOST;
  process.stdout.write(`Gyosoku demo listening on http://${shownHost}:${PORT} (bound to ${HOST})\n`);
});
