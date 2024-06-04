const url = require('url');
const http = require('http');
const fs = require('fs');
const { createProxyServer } = require('http-proxy');

// 定义文件缓存
let indexData;
let faviconData;

// 定义白名单
// const whitelist = [''];

// 创建代理对象
const proxy = createProxyServer({});

// 定义反代配置
const proxyConfigs = new Map([
  ['/gh/OuOumm/', {
    target: 'https://gcore.jsdelivr.net/gh/OuOumm/' // 目标地址
  }],
  ['/i/', {
    target: 'https://expload.cn/i/', // 目标地址
    modifyResponse: true, // 是否修改响应
    modifyCallback: (proxyRes, req, res) => {
      // 添加自定义响应头，其它任何响应头操作都可以定义在这里
      delete proxyRes.headers['content-disposition'];

      // 获取文件名后缀
      const fileExtension = req.url.split('.').pop().toLowerCase();

      // MIME 类型映射，图片格式
      const mimeTypes = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'ico': 'image/x-icon',
        'bmp': 'image/bmp',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        'heic': 'image/heic',
        'heif': 'image/heif',
        'avif': 'image/avif'
      };

      // 设置响应头，默认类型为 image/jpeg
      proxyRes.headers['Content-Type'] = mimeTypes[fileExtension] || 'image/jpeg';
    }
  }],
  ['/proxy/', {
    target: '' // 目标地址
  }],
]);

// 定义响应修改回调函数
const modifyProxyResponse = function (config, proxyRes, req, res) {
  if (config.modifyResponse && typeof config.modifyCallback === 'function') {
    config.modifyCallback(proxyRes, req, res);
  }
  proxyRes.headers['x-server'] = 'https://www.warhut.cn/'; // 添加自定义响应头
};

// 创建代理服务器
const server = http.createServer(function (req, res) {
  // 检查 Referer 是否在白名单中
  // const referer = req.headers.referer || '';
  // if (!whitelist.includes(referer)) {
  //   res.writeHead(403); // 白名单校验失败，返回 403 Forbidden
  //   res.end('Forbidden');
  //   return;
  // }

  // 查找匹配的代理配置
  try {
    const matchingPrefix = [...proxyConfigs.keys()].find(prefix => req.url.startsWith(prefix));

    if (matchingPrefix) {
      const config = proxyConfigs.get(matchingPrefix);
      req.url = req.url.substring(matchingPrefix.length);

      // 判断matchingPrefix = /porxy/
      if (matchingPrefix == '/proxy/') {
        // 取出req.url的域名，例如 https://expload.com/static/bg.jpg 取https://expload.com
        const parsedUrl = new URL(req.url);
        config.target = parsedUrl.origin;
        // 获取url路径 /static/bg.jpg
        req.url = parsedUrl.pathname;
      }

      proxy.web(req, res, {
        target: config.target, // 设置目标地址
        secure: true,
        changeOrigin: true,
        headers: {
          'x-post-server': 'serv02'
        }
      });

      // 如果需要修改响应，则进行处理
      proxy.once('proxyRes', (proxyRes, req, res) => modifyProxyResponse(config, proxyRes, req, res));
    } else {
      // ico
      if (req.url == '/favicon.ico') {
        res.writeHead(200, { 'Content-Type': 'image/x-icon' });
        res.end(faviconData);
      }

      // 判断路径是不是/或者空，如果是就返回indexData
      if (req.url == '/' || req.url == '') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexData);
      } else {
        res.writeHead(404);
        res.end('404 Not Found');
      }
    }
  } catch (e) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(indexData);
  }
});


// 监听端口
const port = process.env.PORT || 23000;
server.listen(port, () => {
  // 读取首页缓存,不存在则使用默认首页
  try {
    indexData = fs.readFileSync('./index.html', 'utf8');
    faviconData = fs.readFileSync('./favicon.ico');
  } catch (e) {
    indexData = 'hello world';
  }
  console.log(`Proxy server is running on port ${port}`); // 输出启动信息
});