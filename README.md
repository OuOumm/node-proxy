# Node-Proxy

这是一个基于 Node.js 和 `http-proxy` 库构建的简单 HTTP 代理服务器。它允许根据 URL 前缀将请求代理到不同的目标服务器，并提供了自定义请求头、动态目标解析和响应修改等功能。

---

## 功能

- **基于 URL 前缀的路由**：根据 URL 前缀将请求代理到不同的目标服务器。
- **动态目标解析**：动态解析 `/proxy/` 路径的目标服务器。
- **自定义请求头**：为代理请求添加自定义请求头。
- **响应修改**：根据配置修改响应头或内容。
- **静态文件服务**：提供 `index.html` 和 `favicon.ico` 等静态文件。

---

## 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/http-proxy-server.git
   cd http-proxy-server
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 添加静态文件：
   - 在根目录下放置 `index.html` 文件。
   - 在根目录下放置 `favicon.ico` 文件。

4. 启动服务器：
   ```bash
   node app.js
   ```

---

## 配置

代理服务器通过 `proxyConfigs` 这个 `Map` 进行配置。每个条目指定一个 URL 前缀及其对应的目标服务器配置。

### 示例配置

```javascript
const proxyConfigs = new Map([
  ['/gh/OuOumm/', { target: 'https://gcore.jsdelivr.net/gh/OuOumm/' }],
  ['/p/', {
    target: 'https://example.com/p/',
    contentType: 'application/json',
    modifyCallback: (proxyRes) => { proxyRes.headers['content-disposition'] = 'inline' },
  }],
  ['/proxy/', { target: '' }],
]);
```

### 配置选项

- **`target`**：目标服务器的 URL。
- **`contentType`**：期望的响应内容类型。
- **`modifyCallback`**：用于修改响应头或内容的回调函数。
- **`headers`**：包含在代理请求中的自定义请求头。

---

## 使用

### 启动服务器

运行以下命令启动服务器：

```bash
node app.js
```

服务器将运行在 `http://127.0.0.1:23000`。

### 代理请求

- **静态文件**：
  - 访问 `http://127.0.0.1:23000/` 以提供 `index.html`。
  - 访问 `http://127.0.0.1:23000/favicon.ico` 以提供 `favicon.ico`。

- **代理请求**：
  - 访问 `http://127.0.0.1:23000/gh/OuOumm/` 以将请求代理到 `https://gcore.jsdelivr.net/gh/OuOumm/`。
  - 访问 `http://127.0.0.1:23000/p/` 以将请求代理到 `https://example.com/p/`。

- **动态代理**：
  - 访问 `http://127.0.0.1:23000/proxy/http://example.com/` 以动态将请求代理到 `http://example.com/`。

---

## 代码概述

### 关键组件

1. **`proxyConfigs`**：
   - 一个 `Map`，定义了 URL 前缀及其对应的目标服务器配置。

2. **`proxy.on('proxyRes')`**：
   - 监听代理响应，并根据配置应用修改（例如，修改响应头）。

3. **`handleRequest`**：
   - 处理传入的请求，并提供静态文件或代理响应。

4. **动态目标解析**：
   - 对于 `/proxy/` 路径，目标服务器从请求 URL 中动态解析。

5. **静态文件服务**：
   - 为根路径和 favicon 请求提供 `index.html` 和 `favicon.ico`。

---

## 示例请求

### 提供静态文件

- **首页**：
  ```bash
  curl http://127.0.0.1:23000/
  ```

- **Favicon**：
  ```bash
  curl http://127.0.0.1:23000/favicon.ico
  ```

### 代理请求

- **代理到 jsDelivr**：
  ```bash
  curl http://127.0.0.1:23000/gh/OuOumm/
  ```

- **动态代理**：
  ```bash
  curl http://127.0.0.1:23000/proxy/http://example.com/
  ```

---

## 自定义

### 添加新的代理路由

要添加新的代理路由，更新 `proxyConfigs` 映射：

```javascript
proxyConfigs.set('/new-route/', {
  target: 'https://new-target.com/',
  headers: { 'X-Custom-Header': 'value' },
});
```

### 修改响应头

使用 `modifyCallback` 函数修改响应头：

```javascript
proxyConfigs.set('/p/', {
  target: 'https://example.com/p/',
  modifyCallback: (proxyRes) => {
    proxyRes.headers['content-disposition'] = 'inline';
  },
});
```

---

## 许可证

本项目基于 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

---

## 贡献

欢迎贡献！如有任何改进或 bug 修复，请提交 issue 或 pull request。

---

尽情使用 HTTP 代理服务器吧！🚀