import http from "http";
import fs from "fs/promises";
import httpProxy from "http-proxy";
import { URL } from "url";

// 配置中心
const Config = {
  PORT: 23000,
  PROXY_RULES: [
    { prefix: "/p/", target: "https://example.com/p/", headers: { "x-test": "proxy" } },
    { prefix: "/proxy/", isDynamic: true },
  ],
};

// 日志工具
const Logger = {
  log(level, message, error) {
    const timestamp = new Date().toISOString();
    const output = `[${level}] ${timestamp} ${message}`;
    error ? console.error(output, error) : console.log(output);
  },
  info: (msg) => Logger.log("INFO", msg),
  error: (msg, err) => Logger.log("ERROR", msg, err),
  request: (req, status) => Logger.info(`${req.method} ${req.url} - ${status}`),
  proxy: (req, status) =>
    Logger.info(`${req.method} ${req.url} ${status ? `- ${status}` : ""}`),
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
      html: "<html><body><h1>Proxy Server</h1></body></html>",
      icon: Buffer.from([]),
    };
    this.init();
  }

  init() {
    // 设置代理事件监听
    this.proxy.on("proxyRes", (proxyRes, req, res) => {
      Logger.proxy(req, proxyRes.statusCode);
    });

    this.proxy.on("error", (err, req, res) => {
      Logger.error(`Proxy error for ${req.url}`, err);
      this.sendError(res, 502);
    });
  }

  async start() {
    try {
      const [html, icon] = await Promise.all([
        fs.readFile("index.html", "utf8"),
        fs.readFile("favicon.ico"),
      ]);
      this.staticResources = { html, icon };
      Logger.info("Static resources loaded");

      this.server = http.createServer(this.handleRequest.bind(this));
      this.server.listen(Config.PORT, () => {
        Logger.info(`Server running on port http://localhost:${Config.PORT}`);
      });
    } catch (err) {
      Logger.error("Server startup failed", err);
      process.exit(1);
    }
  }

  handleRequest(req, res) {
    try {
      if (!req.url) return this.sendError(res, 400);

      // 静态资源服务
      if (req.url === "/" || req.url === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end(this.staticResources.html);
      }
      if (req.url === "/favicon.ico") {
        res.writeHead(200, { "Content-Type": "image/x-icon" });
        return res.end(this.staticResources.icon);
      }

      // 查找代理规则
      const rule = Config.PROXY_RULES.find((rule) =>
        req.url.startsWith(rule.prefix)
      );
      if (!rule) return this.sendError(res, 404);

      this.processProxy(req, res, rule);
    } catch (err) {
      Logger.error("Request processing error", err);
      this.sendError(res, 500);
    }
  }

  processProxy(req, res, rule) {
    try {
      const { prefix, target, isDynamic, headers } = rule;
      let url, targetUrl = req.url.slice(prefix.length);

      if (isDynamic) {
        if (!targetUrl?.startsWith("http")) {
          return this.sendError(res, 400, 'Missing or invalid "url" parameter');
        }
        url = new URL(targetUrl);
        req.url = url.href; // 处理/proxy前缀
      } else {
        url = new URL(target + targetUrl);
      }

      // 执行代理请求
      this.proxy.web(req, res, {
        target: url.origin,
        headers: {
          ...req.headers,
          ...headers,
          Referer: url.origin,
        },
      });
    } catch (err) {
      Logger.error("Proxy processing error", err);
      this.sendError(res, 500);
    }
  }

  sendError(res, code, message = null) {
    const msg = message || "Server Error";
    res.writeHead(code, { "Content-Type": "text/plain" });
    res.end(`Error ${code}: ${msg}`);
  }
}

// 启动服务器
(async () => {
  const server = new ProxyServer();
  await server.start();
})();
