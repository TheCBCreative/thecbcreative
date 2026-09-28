// Serves the production build (build/client) the way Vercel does — clean URLs, 404.html with a 404 status,
// and Range support (video needs it to seek/buffer) — for `npm run preview` and the accessibility check.
// Dependency-free; the contact form isn't wired up here.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const ROOT = path.resolve('build/client');
const PORT = Number(process.env.PORT) || 4173;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.data': 'text/plain',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function resolve(url) {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const file = path.join(ROOT, pathname);
  if (!file.startsWith(ROOT)) return null;
  for (const candidate of [file, path.join(file, 'index.html'), `${file}.html`]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

// A range request outside the file (or malformed) gets a plain 416 rather than a bogus stream.
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '');
  if (!match) return null;
  const [, startStr, endStr] = match;
  const start = startStr ? Number(startStr) : size - Number(endStr);
  const end = endStr && startStr ? Number(endStr) : size - 1;
  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end >= size || start > end) return 'invalid';
  return { start, end };
}

createServer((req, res) => {
  const file = resolve(req.url ?? '/');
  const served = file ?? path.join(ROOT, '404.html');
  const type = TYPES[path.extname(served)] ?? 'application/octet-stream';
  const size = statSync(served).size;
  const range = req.headers.range ? parseRange(req.headers.range, size) : null;

  if (range === 'invalid') {
    res.writeHead(416, { 'Content-Range': `bytes */${size}` });
    return res.end();
  }
  if (range) {
    res.writeHead(206, {
      'Content-Type': type,
      'Content-Range': `bytes ${range.start}-${range.end}/${size}`,
      'Content-Length': range.end - range.start + 1,
      'Accept-Ranges': 'bytes',
    });
    return createReadStream(served, { start: range.start, end: range.end }).pipe(res);
  }
  res.writeHead(file ? 200 : 404, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  createReadStream(served).pipe(res);
}).listen(PORT, () => console.log(`Serving build/client at http://localhost:${PORT}/`));
