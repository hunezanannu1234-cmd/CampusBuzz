const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT || 8765);
const appPages = new Set([
  'teaser.html',
  'events.html',
  'passes.html',
  'summary.html',
  'payment.html',
  'confirmation.html',
  'blog.html'
]);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

const server = http.createServer((req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' });
    res.end('Method not allowed');
    return;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  if (pathname === '/' || pathname === '/index' || pathname === '/index/') {
    pathname = '/index.html';
  }

  const page = path.posix.basename(pathname);
  if (appPages.has(page) && pathname === `/${page}`) {
    res.writeHead(302, { Location: `/index.html#go-${page}` });
    res.end();
    return;
  }

  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(`${root}${path.sep}`)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(file, (statError, stat) => {
    const target = !statError && stat.isDirectory() ? path.join(file, 'index.html') : file;
    fs.stat(target, (targetError, targetStat) => {
      if (targetError || !targetStat.isFile()) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(target).toLowerCase()] || 'application/octet-stream',
        'Content-Length': targetStat.size
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      fs.createReadStream(target).pipe(res);
    });
  });
});

server.listen(port, '127.0.0.1', () => {
  console.log(`CampusBuzz listening at http://127.0.0.1:${port}`);
});

server.on('error', (error) => {
  console.error('CampusBuzz server failed:', error);
  process.exitCode = 1;
});
