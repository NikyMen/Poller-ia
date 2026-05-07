const fs = require('fs');
const http = require('http');
const path = require('path');
const { exec } = require('child_process');

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || 'localhost';

loadEnv(path.join(root, '.env'));
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const apiRoutes = {
  '/api/login': './api/login.js',
  '/api/logout': './api/logout.js',
  '/api/session': './api/session.js',
  '/api/phones': './api/phones.js',
  '/api/clientes-bot': './api/clientes-bot.js',
  '/api/toggle-ai': './api/toggle-ai.js'
};

const pageRoutes = {
  '/': 'index.html',
  '/login': 'index.html',
  '/panel': 'dashboard.html'
};

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host}`);
    const route = requestUrl.pathname;

    if (apiRoutes[route]) {
      await runApi(apiRoutes[route], req, res);
      return;
    }

    await serveStatic(pageRoutes[route] || route.replace(/^\/+/, ''), res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Error local', detail: error.message }));
  }
});

server.listen(port, host, () => {
  const url = `http://${host}:${port}`;
  console.log(`Servidor local listo: ${url}`);
  if (process.env.NO_OPEN !== '1') openBrowser(url);
});

async function runApi(routePath, req, res) {
  const modulePath = path.join(root, routePath);
  delete require.cache[require.resolve(modulePath)];
  const handler = require(modulePath);
  await handler(req, res);
}

async function serveStatic(target, res) {
  const filePath = path.resolve(root, target || 'index.html');
  const rootPath = root.endsWith(path.sep) ? root : root + path.sep;

  if (!filePath.startsWith(rootPath)) {
    res.statusCode = 403;
    res.end('Forbidden');
    return;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', getContentType(filePath));
  fs.createReadStream(filePath).pipe(res);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml'
  }[ext] || 'application/octet-stream';
}

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const index = trimmed.indexOf('=');
    if (index === -1) continue;

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function openBrowser(url) {
  const command = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;

  exec(command, () => {});
}
