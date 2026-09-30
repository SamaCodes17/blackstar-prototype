import './config.js';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createServer as createViteServer } from 'vite';
import { handleApi } from './app.js';
import { closeStore } from './store.js';
import { publicOrigin, allowedOrigins } from './config.js';
const port = Number(process.env.PORT ?? 4173),
  host = process.env.HOST ?? '127.0.0.1';
if (!['127.0.0.1', 'localhost', '::1'].includes(host) && !process.env.PUBLIC_ORIGIN)
  throw new Error('Set PUBLIC_ORIGIN for a public deployment');
const production = process.argv.includes('--production');
const vite = production
  ? undefined
  : await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
const server = createServer(async (req, res) => {
  if (!allowedOrigins.some((origin) => new URL(origin).host === req.headers.host)) {
    res.writeHead(403);
    res.end('Unrecognized host');
    return;
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  const url = new URL(req.url ?? '/', publicOrigin);
  if (!url.pathname.startsWith('/api/')) {
    if (vite) return vite.middlewares(req, res);
    try {
      const root = resolve('dist'),
        requested = resolve(root, '.' + decodeURIComponent(url.pathname));
      if (
        !requested.startsWith(root + '\\') &&
        !requested.startsWith(root + '/') &&
        requested !== root
      )
        throw new Error('Invalid path');
      let file = requested;
      try {
        if (!(await stat(file)).isFile()) file = resolve(root, 'index.html');
      } catch {
        file = resolve(root, 'index.html');
      }
      const content = await readFile(file);
      const types: Record<string, string> = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      res.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
    return;
  }
  await handleApi(req, res);
});
server.listen(port, host, () => console.log(`BlackStar ready at http://${host}:${port}`));
server.requestTimeout = 15000;
for (const signal of ['SIGTERM', 'SIGINT'] as const)
  process.on(signal, () => {
    server.close();
    void vite?.close();
    void closeStore();
  });
