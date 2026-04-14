/**
 * Development Static File Server with API Proxy
 * - Serves frontend from /client on port 3000
 * - Proxies /api/* and /uploads/* to Express backend on port 5000
 *
 * Usage:
 *   1. Start backend:  cd server && npm run dev   (port 5000)
 *   2. Start frontend: node serve.js              (port 3000)
 *   3. Open: http://localhost:3000
 *
 * Note: In production, the Express server itself serves the frontend
 * from /client via express.static — you only need one server.
 */

const http = require('http');
const fs   = require('fs');
const path = require('path');

const FRONTEND_DIR  = path.join(__dirname, 'client');
const BACKEND_PORT  = 5000;
const FRONTEND_PORT = 3000;

const MIME = {
  '.html': 'text/html',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.woff2':'font/woff2',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  // ── Proxy /api/* and /uploads/* to Express backend ──────
  if (req.url.startsWith('/api') || req.url.startsWith('/uploads')) {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    const proxy = http.request(options, (backendRes) => {
      res.writeHead(backendRes.statusCode, backendRes.headers);
      backendRes.pipe(res);
    });

    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        message: `Backend not running. Start it with: cd "back end" && npm run dev`
      }));
    });

    req.pipe(proxy);
    return;
  }

  // ── Serve static files ────────────────────────────────────
  let urlPath = req.url.split('?')[0];

  // SPA fallback: non-file URLs → index.html
  if (!path.extname(urlPath)) {
    urlPath = '/index.html';
  }

  const filePath    = path.join(FRONTEND_DIR, urlPath);
  const contentType = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Try index.html as SPA fallback
        fs.readFile(path.join(FRONTEND_DIR, 'index.html'), (e2, fb) => {
          if (e2) { res.writeHead(404); res.end('Not Found'); }
          else    { res.writeHead(200, { 'Content-Type': 'text/html' }); res.end(fb); }
        });
      } else {
        res.writeHead(500); res.end('Server Error: ' + err.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    }
  });
});

server.listen(FRONTEND_PORT, () => {
  console.log(`\n🌐 Frontend:  http://localhost:${FRONTEND_PORT}`);
  console.log(`🔌 API proxy: → http://localhost:${BACKEND_PORT}/api/*`);
  console.log(`\n💡 Make sure the backend is running: cd "back end" && npm run dev\n`);
});

