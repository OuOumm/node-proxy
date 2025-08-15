# 🚀 Node-Proxy - 轻量级HTTP代理服务器

欢迎来到 Node-Proxy 的世界！这是一个基于 Node.js 和 `http-proxy` 库构建的轻量级 HTTP 代理服务器。它允许根据 URL 前缀将请求代理到不同的目标服务器，并提供了自定义请求头、动态目标解析等强大功能。🚀

> ⚠️ **重要提示**：本项目需要 Node.js 22 或更高版本才能运行。

---

## 🌟 功能亮点

- **基于 URL 前缀的路由**：根据 URL 前缀将请求智能路由到不同的目标服务器。
- **动态目标解析**：通过 `/proxy/` 路径动态解析目标服务器，灵活应对各种场景。
- **自定义请求头**：为代理请求添加自定义请求头，满足个性化需求。
- **静态文件服务**：内置静态文件服务，轻松提供 `index.html` 和 `favicon.ico` 等文件。
- **优雅的错误处理**：提供友好的错误信息和状态码，便于调试和问题排查。

---

## 🚀 快速开始

### 环境要求

- Node.js 22 或更高版本
- npm（通常随 Node.js 一起安装）

### 安装步骤

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

服务器将运行在 `http://localhost:23000`。

---

## ⚙️ 配置指南

Node-Proxy 通过简单的配置对象来定义代理规则，让您可以轻松自定义代理行为。

### 示例配置

```javascript
const PORT = 23000;
const PROXY_RULES = [
  { prefix: '/i/', target: 'https://example.com/p/', headers: { 'x-test': 'test' } },
  { prefix: '/proxy/', isDynamic: true },
];
```

### 配置选项详解

- **`PORT`**：服务器监听的端口号。
- **`PROXY_RULES`**：代理规则数组，每个规则包含：
  - **`prefix`**：URL 前缀，用于匹配请求。
  - **`target`**：目标服务器的 URL（静态代理时使用）。
  - **`headers`**：包含在代理请求中的自定义请求头。
  - **`isDynamic`**：是否为动态代理（为 `true` 时，目标服务器从请求 URL 中解析）。

---

## 📖 使用说明

### 启动服务器

运行以下命令启动服务器：

```bash
node app.js
```

服务器将运行在 `http://localhost:23000`。

### 代理请求示例

- **静态文件**：
  - 访问 `http://localhost:23000/` 以提供 `index.html`。
  - 访问 `http://localhost:23000/favicon.ico` 以提供 `favicon.ico`。

- **静态代理**：
  - 访问 `http://localhost:23000/i/` 以将请求代理到 `https://example.com/p/`。

- **动态代理**：
  - 访问 `http://localhost:23000/proxy/http://example.com/` 以动态将请求代理到 `http://example.com/`。

---

## 🧠 代码解析

### 核心组件

1. **全局配置**：
   - `PORT`：定义服务器监听的端口号。
   - `PROXY_RULES`：定义代理规则数组。

2. **代理服务器**：
   - 使用 `http-proxy` 库创建代理服务器实例。

3. **请求处理器**：
   - `handleRequest` 函数处理所有传入的请求，提供静态文件或代理响应。

---

## 🛠️ 自定义配置

### 添加新的代理路由

要添加新的代理路由，只需修改 `PROXY_RULES` 数组：

```javascript
PROXY_RULES.push({
  prefix: '/new-route/',
  target: 'https://new-target.com/',
  headers: { 'X-Custom-Header': 'value' },
});
```

### 添加动态代理路由

```javascript
PROXY_RULES.push({
  prefix: '/dynamic/',
  isDynamic: true,
});
```

---

## 📄 许可证

本项目基于 MIT 许可证。详情请参阅 [LICENSE](LICENSE) 文件。

---

## 🤝 贡献

欢迎贡献！如有任何改进或 bug 修复，请提交 issue 或 pull request。

---

尽情使用 Node-Proxy 服务器吧！🚀