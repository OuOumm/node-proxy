const http = require('http');
const fs = require('fs').promises;
const { createProxyServer } = require('http-proxy');

// 定义配置参数
let indexData = 'hello world';
let faviconData;
let proxyConfig;
let matchingPrefix;
const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
};

// 创建代理对象
const proxy = createProxyServer({});

// 定义反代配置
const proxyConfigs = new Map([
  ['/gh/', { target: 'https://gcore.jsdelivr.net/gh/', headers: {} }],
  ['/i/', {
    target: 'https://expload.com/i/',
    headers: {},
    modifyResponse: true,
    modifyCallback: (proxyRes, req, res) => {
      delete proxyRes.headers['content-disposition'];
      const fileExtension = req.url.split('.').pop().toLowerCase();
      const mimeTypes = {'webp': 'image/webp'};
      if(fileExtension in mimeTypes){
        proxyRes.headers['content-type'] = mimeTypes[fileExtension];
      }
    }
  }],
  ['/proxy/', { target: '', headers: {} }]
]);

proxy.on('proxyRes', (proxyRes, req, res) => {
  if (matchingPrefix) {
    if (proxyConfig.modifyResponse && typeof proxyConfig.modifyCallback === 'function') {
      proxyConfig.modifyCallback(proxyRes, req, res);
    }
  }
});

const server = http.createServer((req, res) => {
  matchingPrefix = [...proxyConfigs.keys()].find(prefix => req.url.startsWith(prefix));

  if (matchingPrefix) {
    proxyConfig = proxyConfigs.get(matchingPrefix);
    req.url = req.url.substring(matchingPrefix.length);

    if (matchingPrefix === '/proxy/') {
      try {
        const parsedUrl = new URL(req.url);
        proxyConfig.target = parsedUrl.origin;
        req.url = parsedUrl.pathname;
      } catch (e) {
        handleRequest(req, res);
        return;
      }
    }

    const proxyOptions = {
      target: proxyConfig.target,
      secure: true,
      changeOrigin: true,
      headers: { ...defaultHeaders, ...proxyConfig.headers },
      referer: proxyConfig.target
    };

    proxy.web(req, res, proxyOptions);
  } else {
    handleRequest(req, res);
  }
});

const handleRequest = (req, res) => {
  if (req.url.includes('favicon.ico')) {
    res.writeHead(200, { 'Content-Type': 'image/x-icon' });
    res.end(faviconData);
  } else if (req.url === '/' || req.url === '') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexData);
  } else {
    res.writeHead(404);
    res.end('404 Not Found');
  }
};

const port = process.env.PORT || 23000;
server.listen(port, async () => {
  try {
    indexData = await fs.readFile('./index.html', 'utf8');
    faviconData = await fs.readFile('./favicon.ico');
  } catch (e) {
    console.error('Error reading files:', e);
  }
  console.log(`Proxy server is running on port ${port}`);
});