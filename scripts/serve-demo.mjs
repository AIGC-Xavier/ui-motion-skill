import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
const root = path.resolve(fileURLToPath(new URL('../', import.meta.url)));
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.mjs':'text/javascript; charset=utf-8', '.md':'text/plain; charset=utf-8' };

export async function handleDemoRequest(req, res) {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname === '/') {
      res.writeHead(302, { location: '/demo/index.html', 'cache-control':'no-store' });
      res.end();
      return;
    }
    const file = path.resolve(root, '.' + pathname);
    const relative = path.relative(root,file);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => part.startsWith('.'))) { res.writeHead(403); res.end('Forbidden'); return; }
    const body = await readFile(file);
    res.writeHead(200,{'content-type':types[path.extname(file)] || 'text/plain; charset=utf-8','cache-control':'no-store'}); res.end(body);
  } catch { res.writeHead(404); res.end('Not found'); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.DEMO_PORT ?? 8766);
  const server = http.createServer(handleDemoRequest);
  server.listen(port, '127.0.0.1', () => console.log(`Demo: http://127.0.0.1:${server.address().port}/`));
}
