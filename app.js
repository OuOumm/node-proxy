import http from 'http';
import https from 'https';
import fs from 'fs/promises';
import httpProxy from 'http-proxy';
import { URL } from 'url';

// 配置中心
const Config = {
  PORT: 23000,
  HEADERS: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36 Edg/138.0.0.0',
  },
  PROXY_RULES: [
    { prefix: '/gh/', target: 'https://gcore.jsdelivr.net/gh/' },
    { prefix: '/imgur/', target: 'https://i.imgur.com/' },
    { prefix: '/proxy/', isDynamic: true }
  ],
};

// 日志工具
const Logger = {
  log(level, message, error) {
    const timestamp = new Date().toISOString();
    const output = `[${level}] ${timestamp} ${message}`;
    error ? console.error(output, error) : console.log(output);
  },
  info: msg => Logger.log('INFO', msg),
  error: (msg, err) => Logger.log('ERROR', msg, err),
  request: (req, status) => Logger.info(`${req.method} ${req.url} - ${status}`),
  proxy: (req, status) => Logger.info(`${req.method} ${req.url} ${status ? `- ${status}` : ''}`)
};

// 创建代理服务器
class ProxyServer {
  constructor() {
    this.proxy = httpProxy.createProxyServer({
      changeOrigin: true, // 保留请求头中的 Host 字段
      secure: false, // 不验证 SSL 证书
      timeout: 30000, // 超时时间
      autoRewrite: true, // 自动重写请求路径
      followRedirects: true, // 跟随重定向
    });

    this.staticResources = {
      html: '<html><body><h1>Proxy Server</h1></body></html>',
      icon: Buffer.from([])
    };
    this.init();
  }

  init() {
    // 设置代理事件监听
    this.proxy.on('proxyRes', (proxyRes, req, res) => {
      Logger.proxy(req, proxyRes.statusCode);
      this.sanitizeHeaders(proxyRes.headers, res);
    });

    this.proxy.on('error', (err, req, res) => {
      Logger.error(`Proxy error for ${req.url}`, err);
      this.sendError(res, 502);
    });
  }

  async start() {
    try {
      const [html, icon] = await Promise.all([
        fs.readFile('index.html', 'utf8'),
        fs.readFile('favicon.ico')
      ]);
      this.staticResources = { html, icon };
      Logger.info('Static resources loaded');

      this.server = http.createServer(this.handleRequest.bind(this));
      this.server.listen(Config.PORT, () => {
        Logger.info(`Server running on port ${Config.PORT}`);
      });
    } catch (err) {
      Logger.error('Server startup failed', err);
      process.exit(1);
    }
  }

  handleRequest(req, res) {
    try {
      if (!req.url) return this.sendError(res, 400);

      // 静态资源服务
      if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(this.staticResources.html);
      }
      if (req.url === '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        return res.end(this.staticResources.icon);
      }

      // 查找代理规则
      const rule = Config.PROXY_RULES.find(rule => req.url.startsWith(rule.prefix));
      if (!rule) return this.sendError(res, 404);

      this.processProxy(req, res, rule);
    } catch (err) {
      Logger.error('Request processing error', err);
      this.sendError(res, 500);
    }
  }

  processProxy(req, res, rule) {
    try {
      const { prefix, target, isDynamic } = rule;
      let url, targetUrl = req.url.slice(prefix.length);
      console.log(targetUrl);

      if (isDynamic) {
        if (!targetUrl?.startsWith('http')) { return this.sendError(res, 400, 'Missing or invalid "url" parameter'); }
        url = new URL(targetUrl);
      } else {
        url = new URL(target + targetUrl);
      }
      req.url = url.pathname + url.search; // 处理路径为转发问题
      // 执行代理请求
      this.proxy.web(req, res, {
        target: url.origin,
        headers: {
          ...Config.HEADERS,
          Referer: url.href,
        },
        agent: url.protocol.startsWith('https:') ? https.globalAgent : http.globalAgent,
      })
    } catch (err) {
      Logger.error('Proxy processing error', err);
      this.sendError(res, 500);
    }
  }

  sanitizeHeaders(headers, res) {
    // 只删除敏感的代理相关头，保留配置中定义的头
    const headersToDelete = ['via', 'x-forwarded-for', 'x-proxy', 'x-powered-by'];
    headersToDelete.forEach(header => delete headers[header]);
    headers['Cache-Control'] = 'public, max-age=86400';

    if (!res.headersSent) {
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }
  }

  sendError(res, code, message = null) {
    const msg = message || 'Server Error';
    res.writeHead(code, { 'Content-Type': 'text/plain' });
    res.end(`Error ${code}: ${msg}`);
  }
}

// 启动服务器
(async () => {
  const server = new ProxyServer();
  await server.start();
})();