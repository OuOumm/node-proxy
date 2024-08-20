const http = require('http');
const fs = require('fs').promises;
const { createProxyServer } = require('http-proxy');

// 预加载文件并设置全局变量
let indexData;
let faviconData;

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

// 创建并配置代理服务器
const proxy = createProxyServer({});
const proxyConfigs = new Map([
  ['/gh/OuOumm/', { target: 'https://gcore.jsdelivr.net/gh/OuOumm/' }],
  ['/i/', {
    target: 'https://expload.com/img/',
    modifyCallback: (proxyRes) => {
      proxyRes.headers['content-disposition'] = 'inline';
    },
  }]
]);

proxy.on('proxyRes', (proxyRes, req, res) => {
  req.proxyConfig?.modifyCallback?.(proxyRes, req, res);
});

const handleRequest = (req, res, statusCode = 404, contentType = 'text/plain', content = '404 Not Found') => {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
};

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '') { return handleRequest(req, res, 200, 'text/html', indexData); }
  if (req.url.includes('favicon.ico')) { return handleRequest(req, res, 200, 'image/x-icon', faviconData); }

  const matchingPrefix = [...proxyConfigs.keys()].find(prefix => req.url.startsWith(prefix));
  if (matchingPrefix) {
    req.proxyConfig = proxyConfigs.get(matchingPrefix);
    req.url = req.url.slice(matchingPrefix.length);

    if (matchingPrefix === '/proxy/') {
      try {
        const { origin, pathname } = new URL(req.url);
        req.proxyConfig.target = origin;
        req.url = pathname;
      } catch {
        return handleRequest(req, res);
      }
    }

    return proxy.web(req, res, {
      target: req.proxyConfig.target,
      secure: req.proxyConfig.secure || true,
      changeOrigin: req.proxyConfig.changeOrigin || true,
      headers: { ...defaultHeaders, ...req.proxyConfig.headers },
      referer: req.proxyConfig.referer || req.proxyConfig.target
    });
  }

  return handleRequest(req, res);
});

const port = process.env.PORT || 23000;
server.listen(port, async () => {
  indexData = await fs.readFile('index.html', 'utf8');
  faviconData = await fs.readFile('favicon.ico');
  console.log(`Proxy server is running on port ${port}`);
});