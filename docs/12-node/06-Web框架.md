# 06 — Web 框架

> 学习目标：理解 Express 和 Koa 的中间件机制、洋葱模型、以及鉴权和跨域等常见后端场景的处理方式。

---

## 1. 从 http 模块到框架

Node.js 原生的 `http` 模块功能完整，但开发体验差：

```js
// 原生——每个路由都要手动判断
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/users') {
    // ...
  } else if (req.method === 'POST' && req.url === '/users') {
    // ...
  }
  // 没有中间件、没有错误处理、没有路由分组
});
```

框架解决了三个问题：**路由分发**、**中间件复用**、**错误处理**。

---

## 2. Express 中间件

### 2.1 基本概念

中间件 = 一个函数，签名为 `(req, res, next)`：

```js
const express = require('express');
const app = express();

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // 调用 next() 交给下一个中间件
});

app.get('/hello', (req, res) => {
  res.json({ msg: 'Hello World' });
});
```

### 2.2 中间件类型

| 类型 | 写法 | 说明 |
| --- | --- | --- |
| 应用级 | `app.use(fn)` | 所有请求都经过 |
| 路由级 | `router.use(fn)` | 特定路由前缀 |
| 错误处理 | `app.use((err, req, res, next) => {})` | 四个参数，有 err |
| 内置 | `express.json()` | 解析 JSON body |
| 第三方 | `cors()`、`morgan()` | 社区中间件 |

### 2.3 执行模型

Express 的中间件是**线性管道**：

```
请求 → [中间件1] → [中间件2] → [路由处理] → 响应
                ↓ next()     ↓ next()
```

响应可以在任何环节发出——如果某个中间件调了 `res.send()` 且没调 `next()`，后面的中间件不再执行。

---

## 3. Koa 中间件和洋葱模型

### 3.1 Koa vs Express

Koa 由 Express 原班人马开发，核心改进：

| 方面 | Express | Koa |
| --- | --- | --- |
| 中间件签名 | `(req, res, next)` | `async (ctx, next)` |
| 异步处理 | 回调风格（容易丢失错误） | async/await（错误自动冒泡） |
| 内核大小 | 较大，自带路由/静态文件 | 极简，路由等需要中间件 |
| 洋葱模型 | 手动控制 | async/await 天然支持 |

### 3.2 洋葱模型

```
请求 →
  ┌─────────────────────────────────┐
  │  中间件1: await next()          │
  │  ┌───────────────────────────┐  │
  │  │  中间件2: await next()    │  │
  │  │  ┌─────────────────────┐ │  │
  │  │  │  中间件3: 处理请求    │ │  │
  │  │  └─────────────────────┘ │  │
  │  │   响应返回 ←               │  │
  │  └───────────────────────────┘  │
  │    响应返回 ←                     │
  └─────────────────────────────────┘
                                      → 响应
```

代码示例：

```js
const Koa = require('koa');
const app = new Koa();

// 计时中间件——完美展示洋葱模型
app.use(async (ctx, next) => {
  const start = Date.now();
  console.log('→ 进入');
  await next();                           // 执行后续中间件
  const ms = Date.now() - start;          // 响应返回后执行
  console.log(`← 返回，耗时 ${ms}ms`);
});

app.use(async ctx => {
  ctx.body = 'Hello Koa';
});
```

**关键价值：请求前后逻辑分离。** 同一个中间件里，`await next()` 前处理请求，`await next()` 后处理响应。

### 3.3 `koa-compose` 实现

面试高频手写题：

```js
function compose(middlewares) {
  return function (ctx) {
    let index = -1;

    function dispatch(i) {
      // 防止同一个 next() 被多次调用
      if (i <= index) return Promise.reject(new Error('next() called multiple times'));
      index = i;

      const fn = middlewares[i];
      if (!fn) return Promise.resolve(); // 所有中间件执行完毕

      try {
        // fn(ctx, next) → next 就是 dispatch(i+1)
        return Promise.resolve(fn(ctx, () => dispatch(i + 1)));
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return dispatch(0);
  };
}
```

三个关键点：
1. **递归 `dispatch`**：`dispatch(0)` → 中间件内调 `next()` → `dispatch(1)` → … → 递归返回
2. **`i <= index` 检查**：防止在同一个中间件中多次调用 `next()`
3. **`Promise.resolve` 包装**：确保返回 Promise，兼容同步和异步中间件

---

## 4. 鉴权方案

### 4.1 三种方案对比

| 方案 | 原理 | 有状态 | 适合 |
| --- | --- | --- | --- |
| **Cookie** | 浏览器自动携带，服务端直接读 | 无（数据在 Cookie 中） | 简单偏好存储 |
| **Session** | 服务端存数据，Cookie 只传 sessionId | **有状态** | 传统 Web 应用 |
| **JWT** | 服务端签发加密 token，客户端自行存储和携带 | **无状态** | 前后端分离、微服务 |

### 4.2 Session 方案

```
用户登录 → 服务端验证 → 创建 session → 存 Redis/DB
                     → 返回 Set-Cookie: sessionId=xxx
后续请求 → Cookie 自动带 sessionId → 服务端查 session
```

**优点：** 安全（数据在服务端），可随时失效。
**缺点：** 服务端有状态，分布式需要共享存储（Redis）。

### 4.3 JWT 方案

```
用户登录 → 服务端验证 → 签发 JWT（含用户信息 + 签名）
                     → 返回 token
后续请求 → Authorization: Bearer <token>
         → 服务端验签 → 从 token 中读用户信息（不需要查数据库）
```

**JWT 结构：** `Header.Payload.Signature`

```json
// Header:   {"alg": "HS256", "typ": "JWT"}
// Payload:  {"userId": 123, "exp": 1234567890}  ← 仅 base64 编码，非加密！
// Signature: HMAC-SHA256(Header + "." + Payload, secret)
```

**优点：** 无状态，天然适合分布式。
**缺点：** 无法主动失效（需配合 Redis 黑名单）；payload 可被解码，不能存敏感信息。

### 4.4 怎么选

| 场景 | 推荐 |
| --- | --- |
| 传统 MVC Web 应用 | Session + Cookie |
| SPA + API / 移动端 | JWT |
| 需要即时失效（支付等） | Session，或 JWT + Redis 黑名单 |
| 微服务网关 | JWT（无状态，不查用户中心） |

---

## 5. CORS（跨域）

### 5.1 原理

浏览器的同源策略阻止跨域请求。CORS 是服务端通过响应头告诉浏览器"谁可以跨域访问我"。

**简单请求 vs 预检请求：**

| 类型 | 条件 | 行为 |
| --- | --- | --- |
| 简单请求 | GET/HEAD/POST + 特定 Content-Type | 直接发请求，检查响应头 |
| 预检请求 | 其他 method / 自定义头 | 先发 OPTIONS 请求，通过后才发正式请求 |

### 5.2 Node.js 原生处理

```js
// 简单 CORS
res.setHeader('Access-Control-Allow-Origin', 'https://example.com');
res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
res.setHeader('Access-Control-Allow-Credentials', 'true'); // 允许带 Cookie

// 预检请求
if (req.method === 'OPTIONS') {
  res.writeHead(204);  // No Content
  return res.end();
}
```

### 5.3 关键限制

- `Access-Control-Allow-Origin` 和 `Access-Control-Allow-Credentials: true` 同时使用时，origin **必须是具体域名**，不能是 `*`
- 生产环境用成熟的中间件（Express 用 `cors`，Koa 用 `@koa/cors`），不要手写

```js
// Express
const cors = require('cors');
app.use(cors({ origin: 'https://example.com', credentials: true }));

// Koa
const cors = require('@koa/cors');
app.use(cors({ origin: 'https://example.com', credentials: true }));
```

---

## 6. 快速回顾

1. Express：`(req, res, next)`，线性管道；Koa：`async (ctx, next)`，洋葱模型
2. 洋葱模型的核心价值：`await next()` 前后分别处理请求和响应
3. `koa-compose`：递归 `dispatch` + `i <= index` 防多次 `next()` + Promise 包装
4. 鉴权选型：传统 Web → Session；SPA/微服务 → JWT；需即时失效 → JWT + Redis
5. CORS：服务端响应头声明 + OPTIONS 预检 + credentials 时 origin 不能是 `*`

---

## 上一篇 / 下一篇

[← 05-核心模块](05-核心模块.md) | [07-多进程与部署 →](07-多进程与部署.md)
