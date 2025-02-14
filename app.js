// 引入 http 模块，用于创建 HTTP 服务器。
const http = require('http');
// 引入 fs 模块，并使用其 promises API 来异步读取文件。
const fs = require('fs').promises;
// 从 'http-proxy' 包中引入 createProxyServer 函数，用于创建反向代理服务器。
const { createProxyServer } = require('http-proxy');

// 定义变量来存储 index.html 和 favicon.ico 文件的内容，稍后将被读取。
let indexData;
let faviconData;

// 设置默认的 HTTP 请求头，这些头部信息将在所有请求中自动添加。
const defaultHeaders = {
  // 默认的 User-Agent 头部，模拟一个通用的浏览器或爬虫。
  'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
};

// 创建一个空的代理服务器实例。
const proxy = createProxyServer({});
// 创建一个 Map 对象来存储代理规则，键为 URL 路径前缀，值为对应的代理配置对象。
const proxyConfigs = new Map([
  // 配置 '/gh/OuOumm/' 开头的路径，代理到指定的目标地址。
  ['/gh/OuOumm/', { target: 'https://gcore.jsdelivr.net/gh/OuOumm/' }],
  // 配置 '/i/' 开头的路径，代理到另一个目标地址，并修改响应头内容类型和 disposition。
  ['/i/', {
    // 目标 URL 的域名部分。
    target: 'https://xxxx.com/img/',
    // 待匹配响应头 Content-Type 为 application/json。
    contentType: 'application/json',
    // 自定义回调函数，在代理响应到来时修改响应头。
    modifyCallback: (proxyRes) => proxyRes.headers['content-disposition'] = 'inline',
  }],
  // 配置 '/proxy/' 开头的路径，留空 target，因为实际目标会根据请求动态设置。
  ['/proxy/', { target: '' }],
]);

// 当有代理响应时触发此事件处理器，可以在此处对响应进行额外处理。
proxy.on('proxyRes', (proxyRes, req, res) => {
  // 如果请求配置中有 modifyCallback，则调用它来修改代理响应。
  req.proxyConfig?.modifyCallback?.(proxyRes, req, res);
  // 如果代理响应状态码不是 200 或者响应内容类型不匹配预期，则调用 handleRequest 进行处理。
  if (proxyRes.statusCode != 200 || (proxyRes.headers['content-type']?.includes(req.proxyConfig?.contentType))) { 
    handleRequest(req, res); 
  }
});

// 定义一个处理请求的函数，用于发送响应给客户端。
const handleRequest = (req, res, statusCode = 404, contentType = 'text/html', content = indexData) => {
  // 向客户端发送状态码和内容类型头部，然后结束响应并发送内容。
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(content);
};

// 创建 HTTP 服务器，监听每个传入的请求。
const server = http.createServer((req, res) => {
  // 如果请求的是根路径或为空，则返回 200 状态码和 index.html 内容。
  if (req.url === '/' || req.url === '') { return handleRequest(req, res, 200, 'text/html', indexData); }
  // 如果请求的是 favicon.ico，则返回 200 状态码和 favicon 数据。
  if (req.url.includes('favicon.ico')) { return handleRequest(req, res, 200, 'image/x-icon', faviconData); }

  // 查找与请求 URL 匹配的最靠前的代理规则。
  const matchingPrefix = [...proxyConfigs.keys()].find(prefix => req.url.startsWith(prefix));
  // 如果没有找到匹配的前缀，则返回 404 错误。
  if (!matchingPrefix) { return handleRequest(req, res); }

  // 将匹配的代理配置赋值给请求对象的 proxyConfig 属性。
  req.proxyConfig = proxyConfigs.get(matchingPrefix);
  // 去掉 URL 中的匹配前缀，以便代理请求到正确的资源。
  req.url = req.url.slice(matchingPrefix.length);

  // 特殊处理 '/proxy/' 路径，允许动态设置目标 URL。
  if (matchingPrefix === '/proxy/') {
    // 检查请求 URL 是否以 "http" 开头，如果不是则返回 404 错误。
    if (!req.url.startsWith('http')) { return handleRequest(req, res); }
    // 根据请求 URL 动态设置目标 URL 的 origin（协议+主机+端口）。
    req.proxyConfig.target = new URL(req.url).origin;
  }

  // 使用代理服务器转发请求到目标服务器，同时传递配置项如 target、secure、changeOrigin、headers 和 referer。
  proxy.web(req, res, {
    target: req.proxyConfig.target,
    secure: req.proxyConfig.secure ?? true, // 默认启用 SSL/TLS 验证
    changeOrigin: req.proxyConfig.changeOrigin ?? true, // 更改原始主机头为目标主机
    headers: { ...defaultHeaders, ...req.proxyConfig.headers }, // 合并默认头部和特定请求头部
    referer: req.proxyConfig.referer || req.proxyConfig.target, // 设置 Referer 头部
  });
});

// 获取环境变量 PORT 的值，如果未设置则使用 23000 作为默认端口。
const port = process.env.PORT || 23000;
// 让服务器开始监听指定端口，并在启动时异步读取 index.html 和 favicon.ico 文件。
server.listen(port, async () => {
  // 异步读取 index.html 文件内容，并将其编码为 UTF-8。
  indexData = await fs.readFile('index.html', 'utf8');
  // 异步读取 favicon.ico 文件内容。
  faviconData = await fs.readFile('favicon.ico');
  // 打印一条消息到控制台，指示服务器正在运行。
  console.log(`Proxy server is running on port http://127.0.0.1:${port}`);
});