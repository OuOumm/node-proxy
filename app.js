const http = require('http');
const fs = require('fs').promises;
const { createProxyServer } = require('http-proxy');

let indexData;
let faviconData;
const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

const proxy = createProxyServer({});
const proxyConfigs = new Map([
  ['/gh/OuOumm/', { target: 'https://gcore.jsdelivr.net/gh/OuOumm/' }],
  ['/i/', {
    target: 'https://xxxx.com/img/',
    contentType: 'application/json',
    modifyCallback: (proxyRes) => proxyRes.headers['content-disposition'] = 'inline',
  }],
  ['/proxy/', { target: '' }],
]);

proxy.on('proxyRes', (proxyRes, req, res) => {
  req.proxyConfig?.modifyCallback?.(proxyRes, req, res);
  if (proxyRes.statusCode != 200 || (proxyRes.headers['content-type']?.includes(req.proxyConfig?.contentType))) { handleRequest(req, res); }
});

const handleRequest = (req, res, statusCode = 404, contentType = 'text/html', content = indexData) => {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
};

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '') { return handleRequest(req, res, 200, 'text/html', indexData); }
  if (req.url.includes('favicon.ico')) { return handleRequest(req, res, 200, 'image/x-icon', faviconData); }

  const matchingPrefix = [...proxyConfigs.keys()].find(prefix => req.url.startsWith(prefix));
  if (!matchingPrefix) { return handleRequest(req, res); }

  req.proxyConfig = proxyConfigs.get(matchingPrefix);
  req.url = req.url.slice(matchingPrefix.length);

  if (matchingPrefix === '/proxy/') {
    if (!req.url.startsWith('http')) { return handleRequest(req, res); }
    req.proxyConfig.target = new URL(req.url).origin;
  }

  proxy.web(req, res, {
    target: req.proxyConfig.target,
    secure: req.proxyConfig.secure ?? true,
    changeOrigin: req.proxyConfig.changeOrigin ?? true,
    headers: { ...defaultHeaders, ...req.proxyConfig.headers },
    referer: req.proxyConfig.referer || req.proxyConfig.target,
  });
});

const port = process.env.PORT || 23000;
server.listen(port, async () => {
  indexData = await fs.readFile('index.html', 'utf8');
  faviconData = await fs.readFile('favicon.ico');
  console.log(`Proxy server is running on port http://127.0.0.1:${port}`);
});