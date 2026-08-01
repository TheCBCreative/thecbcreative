/**
 * dev-server.mjs — local preview server.
 *
 * Serves public/ as static files AND runs api/contact.mjs for real, so the
 * contact form can be tested end to end locally. A plain static server
 * (python -m http.server, etc.) can't do this — it has no POST handler and
 * no idea the function exists.
 *
 * Environment variables are loaded by Node itself via --env-file, so this
 * doesn't depend on the Vercel CLI, on the project being linked, or on the
 * variables existing in Vercel's Development environment.
 *
 * Run with:  npm run dev
 * (which is: node --env-file=.env.local scripts/dev-server.mjs)
 *
 * Dependency-free, like the rest of the project. This is a convenience for
 * local work only — it is never deployed. In production Vercel serves
 * public/ from its CDN and runs api/contact.mjs as a real function.
 */

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import contactHandler from '../api/contact.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

/** Node IncomingMessage -> web-standard Request, so the same handler code
 *  that runs on Vercel runs here unmodified. */
async function toWebRequest(req) {
  const url = `http://${req.headers.host || 'localhost'}${req.url}`;
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';

  let body;
  if (hasBody) {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    body = Buffer.concat(chunks);
  }

  return new Request(url, {
    method: req.method,
    headers: req.headers,
    body,
  });
}

async function sendWebResponse(res, webResponse) {
  const buffer = Buffer.from(await webResponse.arrayBuffer());
  const headers = {};
  webResponse.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.writeHead(webResponse.status, headers);
  res.end(buffer);
}

/** Resolve a URL path to a file inside public/, with directory -> index.html
 *  and extensionless -> .html fallbacks (matching Vercel's cleanUrls). */
async function resolveStaticFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const safe = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(PUBLIC_DIR, safe);

  // Never let a crafted path escape public/.
  if (!filePath.startsWith(PUBLIC_DIR)) return null;

  const candidates = [filePath, `${filePath}.html`, path.join(filePath, 'index.html')];
  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      /* try the next candidate */
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const urlPath = (req.url || '/').split('?')[0];

  try {
    if (urlPath === '/api/contact') {
      const webRequest = await toWebRequest(req);
      const webResponse = await contactHandler.fetch(webRequest);
      console.log(`${req.method} ${urlPath} -> ${webResponse.status}`);
      return await sendWebResponse(res, webResponse);
    }

    const filePath = await resolveStaticFile(urlPath === '/' ? '/index.html' : urlPath);
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    return res.end(data);
  } catch (err) {
    console.error(`Error handling ${req.method} ${urlPath}:`, err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('500 Internal Server Error');
  }
});

// Without this, a busy port throws an unhandled 'error' event and dumps a
// stack trace that buries the one line that matters.
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  Port ${PORT} is already in use.`);
    console.error('  Something else is running there — often a leftover `vercel dev`.\n');
    console.error(`  Free it:          lsof -ti:${PORT} | xargs kill`);
    console.error(`  Or use another:   PORT=${PORT + 1} npm run dev\n`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  const configured = Boolean(process.env.RESEND_API_KEY);
  console.log(`\n  Serving public/ on http://localhost:${PORT}`);
  console.log(`  Contact form:     http://localhost:${PORT}/contact.html`);
  console.log(
    configured
      ? '  RESEND_API_KEY:   loaded — the form will send real email\n'
      : '  RESEND_API_KEY:   MISSING — check .env.local; the form will return an error\n'
  );
});
