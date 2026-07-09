import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 4173);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function isInsideRoot(path) {
  const localPath = relative(root, path);
  return (
    localPath !== '..' && !localPath.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`)
  );
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
    const requestedPath = resolve(root, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
    if (!isInsideRoot(requestedPath)) {
      response.writeHead(403).end('Forbidden');
      return;
    }

    let filePath = requestedPath;
    try {
      if (!(await stat(filePath)).isFile()) throw new Error('Not a file');
    } catch {
      filePath = join(root, 'index.html');
    }

    const content = await readFile(filePath);
    response.writeHead(200, {
      'Cache-Control': 'no-store',
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    });
    response.end(content);
  } catch {
    if (!response.headersSent) response.writeHead(500);
    response.end('Internal Server Error');
  }
});

server.on('clientError', (_error, socket) => socket.destroy());
server.on('connection', (socket) => socket.on('error', () => socket.destroy()));
server.listen(port, '127.0.0.1');

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
