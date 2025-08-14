# Node-Proxy

这是一个基于 Node.js 和 `http-proxy` 库构建的简单 HTTP 代理服务器。它允许根据 URL 前缀将请求代理到不同的目标服务器，并提供了自定义请求头、动态目标解析等功能。

---

## 功能

- **基于 URL 前缀的路由**：根据 URL 前缀将请求代理到不同的目标服务器。
- **动态目标解析**：动态解析 `/proxy/` 路径的目标服务器。
- **自定义请求头**：为代理请求添加自定义请求头。
- **静态文件服务**：提供 `index.html` 和 `favicon.ico` 等静态文件。
- **错误处理**：提供友好的错误信息和状态码。
- **日志记录**：记录请求和代理操作的日志。

---

## 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/your-username/node-proxy.git
   cd node-proxy
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

代理服务器通过 `Config` 对象进行配置，包含端口设置和代理规则数组。

### 示例配置

```javascript
const Config = {
  PORT: 23000,
  PROXY_RULES: [
    { prefix: '/p/', target: 'https://example.com/p/', headers: { 'x-test': 'proxy' } },
    { prefix: '/proxy/', isDynamic: true },
  ],
};
```

### 配置选项

- **`PORT`**：服务器监听的端口号。
- **`PROXY_RULES`**：代理规则数组，每个规则包含：
  - **`prefix`**：URL 前缀，用于匹配请求。
  - **`target`**：目标服务器的 URL（静态代理时使用）。
  - **`headers`**：包含在代理请求中的自定义请求头。
  - **`isDynamic`**：是否为动态代理（为 `true` 时，目标服务器从请求 URL 中解析）。

---

## 使用

### 启动服务器

运行以下命令启动服务器：

```bash
node app.js
```

服务器将运行在 `http://localhost:23000`。

### 代理请求

- **静态文件**：
  - 访问 `http://localhost:23000/` 以提供 `index.html`。
  - 访问 `http://localhost:23000/favicon.ico` 以提供 `favicon.ico`。

- **静态代理**：
  - 访问 `http://localhost:23000/p/` 以将请求代理到 `https://example.com/p/`。

- **动态代理**：
  - 访问 `http://localhost:23000/proxy/http://example.com/` 以动态将请求代理到 `http://example.com/`。

---

## 代码概述

### 关键组件

1. **`Config`**：
   - 配置对象，包含端口设置和代理规则数组。

2. **`Logger`**：
   - 日志工具，用于记录请求、响应和错误信息。

3. **`ProxyServer` 类**：
   - 代理服务器的核心类，负责创建代理、处理请求和响应。

4. **`handleRequest` 方法**：
   - 处理传入的请求，提供静态文件或代理响应。

5. **`processProxy` 方法**：
   - 处理代理请求，根据规则确定目标服务器。

---

## 示例请求

### 提供静态文件

- **首页**：
  ```bash
  curl http://localhost:23000/
  ```

- **Favicon**：
  ```bash
  curl http://localhost:23000/favicon.ico
  ```

### 代理请求

- **静态代理**：
  ```bash
  curl http://localhost:23000/p/some-path
  ```

- **动态代理**：
  ```bash
  curl http://localhost:23000/proxy/http://example.com/
  ```

---

## 自定义

### 添加新的代理路由

要添加新的代理路由，修改 `Config.PROXY_RULES` 数组：

```javascript
Config.PROXY_RULES.push({
  prefix: '/new-route/',
  target: 'https://new-target.com/',
  headers: { 'X-Custom-Header': 'value' },
});
```

### 添加动态代理路由

```javascript
Config.PROXY_RULES.push({
  prefix: '/dynamic/',
  isDynamic: true,
});
```

---

## 许可证

本项目基于 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

---

## 贡献

欢迎贡献！如有任何改进或 bug 修复，请提交 issue 或 pull request。

---

尽情使用 Node-Proxy 服务器吧！🚀