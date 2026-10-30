/**
 * Serves the exported site.
 *
 *   node scripts/serve-static.mjs [folder] [port]
 *
 * The export in `out/` is plain files, but it still has to be served over
 * http:// rather than opened from the disk — the page loads its JavaScript and
 * fonts from absolute paths like /_next/..., and a file:// page cannot resolve
 * those. This is the smallest thing that serves them. No dependencies.
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'out');
const port = Number(process.argv[3] ?? 3211);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

/** Resolves a URL to a file inside `root`, or null if it escapes. */
async function resolve(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  const target = path.resolve(root, '.' + decoded);

  // Never serve anything outside the folder, whatever the URL says.
  if (target !== root && !target.startsWith(root + path.sep)) return null;

  for (const candidate of [target, path.join(target, 'index.html'), `${target}.html`]) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {
      // Try the next shape.
    }
  }
  return null;
}

const server = createServer(async (req, res) => {
  const file = await resolve(req.url ?? '/');

  if (!file) {
    const notFound = await resolve('/404.html');
    if (notFound) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      createReadStream(notFound).pipe(res);
      return;
    }
    res.writeHead(404, { 'content-type': TYPES['.txt'] });
    res.end('Not found');
    return;
  }

  res.writeHead(200, {
    'content-type': TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream',
    // The build fingerprints its assets, so they can be cached hard; the
    // HTML must not be, or a redeploy would not reach anyone.
    'cache-control': file.endsWith('.html') ? 'no-cache' : 'public, max-age=31536000, immutable',
  });
  createReadStream(file).pipe(res);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\nPort ${port} is already in use. Try: npm start -- out ${port + 1}\n`);
    process.exit(1);
  }
  throw error;
});

server.listen(port, () => {
  console.log(`\n  Serving ${root}`);
  console.log(`  http://localhost:${port}\n`);
  console.log('  Ctrl+C to stop.\n');
});
