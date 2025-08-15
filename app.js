import http from "http";
import { URL } from "url";
import fs from "fs/promises";
import httpProxy from "http-proxy";

// 配置项
const PORT = 23000;
const PROXY_RULES = [
  { prefix: "/i/", target: "https://example.com/p/", headers: { "x-test": "test" } },
  { prefix: "/proxy/", isDynamic: true },
];

// 初始化代理服务器
const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  secure: false,
  timeout: 30000,
  followRedirects: true,
});

// 静态资源缓存
const html = await fs.readFile("index.html", "utf8").catch(() => "<h1>Proxy Server</h1>");
const icon = await fs.readFile("favicon.ico").catch(() => Buffer.alloc(0));

// 错误处理
proxy.on("error", (_, __, res) => res.writeHead(502).end("Proxy Error"));

// 请求处理
const handleRequest = (req, res) => {
  const { url } = req;

  // 处理静态资源
  if (url === "/") { return res.writeHead(200, { "Content-Type": "text/html" }).end(html); }
  if (url === "/favicon.ico") { return res.writeHead(200, { "Content-Type": "image/x-icon" }).end(icon); }

  // 匹配代理规则
  const rule = PROXY_RULES.find(r => url.startsWith(r.prefix));
  if (!rule) { return res.writeHead(404).end("Not Found") };

  try {
    const path = url.slice(rule.prefix.length);
    const targetUrl = rule.isDynamic
      ? new URL(path) // 动态代理
      : new URL(path, rule.target); // 静态代理

    req.url = targetUrl.pathname + targetUrl.search;

    proxy.web(req, res, {
      target: targetUrl.origin,
      headers: {
        ...req.headers,
        ...rule.headers,
        host: targetUrl.host,
        referer: targetUrl.href,
      },
    });
  } catch {
    res.writeHead(400).end("Bad Request");
  }
};

// 启动服务
http.createServer(handleRequest).listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);