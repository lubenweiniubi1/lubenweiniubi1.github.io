# 04 - 增强开发体验

## 概念

### 1. 开发效率的三个层次

| 方式 | 流程 | 速度 | 原理 |
|------|------|------|------|
| **手动构建** | 改代码 → `npm run build` → 刷新浏览器 | 最慢 | 每次完整走一遍 webpack 全流程 |
| **Watch Mode** | `webpack --watch` → 手动刷新浏览器 | 中 | 文件系统监听 + 增量构建 |
| **DevServer + HMR** | 自动构建 + 自动推送 → 浏览器无感更新 | 最快 | Watch + 内存构建 + WebSocket 推送 |

---

### 2. DevServer 从零开始

#### 2.1 安装和最小配置

```bash
npm install -D webpack-dev-server
```

在 `webpack.config.js` 里加 `devServer` 字段：

```js
// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js',
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {                       // ← 就这一段
    port: 3000,                      // 端口号
    hot: true,                       // 开启 HMR（热模块替换）
    open: true,                      // 启动后自动打开浏览器
  },
};
```

`package.json` 里加启动命令：

```json
{
  "scripts": {
    "dev": "webpack serve --mode development",
    "build": "webpack --mode production"
  }
}
```

> **注意**：devServer 配置只在 `webpack serve` 时生效，`webpack` 或 `webpack --watch` 都会忽略它。

```bash
npm run dev
# 终端输出：Project is running at http://localhost:3000/
# 浏览器自动打开 → 看到页面
```

#### 2.2 它和 `npm run build` 有什么区别？

| | `npm run build` | `npm run dev` |
|---|---|---|
| **产物在哪** | 硬盘 `dist/` 目录 | **内存**（memfs），不写硬盘 |
| **怎么访问** | 手动打开 `dist/index.html` | 浏览器访问 `localhost:3000` |
| **改了代码后** | 需要重新 build | 自动检测 → 自动编译 → 自动推送浏览器 |
| **适用场景** | 部署上线 | 日常开发 |

**关键理解**：`webpack serve` 也是用 webpack 在构建——loader、plugin、rule 全部按 `webpack.config.js` 走。区别只在于产物不落盘，并且编译完成后通过 WebSocket 通知浏览器。

#### 2.3 常用 devServer 配置一览

```js
devServer: {
  // ---- 服务器 ----
  port: 3000,                          // 端口。被占用会自动换，关闭：port: 'auto'
  host: '0.0.0.0',                     // 允许局域网其他设备访问（手机、同事电脑）
  open: true,                           // 启动后自动打开浏览器
  open: ['/page.html'],                 // 打开指定页面
  compress: true,                       // gzip 压缩（加快开发时的传输速度）

  // ---- 静态资源 ----
  static: {
    directory: path.resolve(__dirname, 'public'), // 静态文件目录（不经过 webpack 编译，直接 serve）
    publicPath: '/',                              // 映射到的 URL 路径
  },
  // 比如 public/favicon.ico → 可以直接通过 localhost:3000/favicon.ico 访问

  // ---- SPA 路由 ----
  historyApiFallback: true,            // 所有 404 回退到 index.html（React Router / Vue Router 必需）

  // ---- HMR ----
  hot: true,                           // 开启热模块替换

  // ---- 代理 ----
  proxy: [
    { context: ['/api'], target: 'http://localhost:4000' },
  ],

  // ---- 错误提示 ----
  client: {
    overlay: { errors: true, warnings: false },  // 编译错误时浏览器全屏弹遮罩
    progress: true,                               // 浏览器底部显示构建进度条
  },
}
```

#### 2.4 开发流程对比

```
没有 DevServer 的开发流程：
  改代码 → npm run build（等几秒）→ 切到浏览器 → 按 F5 → 看效果
  每次改动都要手动走一遍

有 DevServer 的开发流程：
  终端开着 npm run dev
  → 改代码 → 保存 → 切到浏览器 → 已经更新好了
  CSS 甚至连人眼都察觉不到刷新
```

一个很小的项目，`npm run build` 可能就 500ms，看起来不快也慢不到哪去。但项目大了之后，冷构建 30s-2min 常见——那时候 `npm run build` 完全不可接受，DevServer + HMR 的增量更新可能只要 50ms。

---

### 3. Watch Mode —— 怎么知道文件变了？

`webpack --watch` 背后是 Node.js 的文件监听机制。webpack 使用 **`fs.watch`**（操作系统原生 API）监听所有被依赖的文件。

**`fs.watch` vs `fs.watchFile`（轮询）**：

| | fs.watch | fs.watchFile（polling） |
|---|---------|------------------------|
| **机制** | OS 内核通知（inotify / FSEvents / ReadDirectoryChangesW） | 定时 `fs.stat` 对比 mtime |
| **性能** | 高——事件驱动，不占 CPU | 低——持续轮询，占 CPU |
| **可靠性** | 部分场景丢事件（网络挂载、Docker、虚拟机） | 稳定——扫盘不会漏 |
| **适用** | 本地开发 | CI、Docker、网络文件系统 |

webpack 默认用 `fs.watch`，如果遇到文件变化不触发的问题（常见于 Docker / WSL / Vagrant），加配置切换到轮询：

```js
// webpack.config.js
module.exports = {
  watchOptions: {
    poll: 1000,              // 每 1 秒轮询一次（ms）
    aggregateTimeout: 300,   // 300ms 内的多次变更合并为一次构建
    ignored: /node_modules/, // 不监听的目录
  },
};
```

**Watch Mode 的增量构建**：webpack 不是每次都全量重新编译——它对比文件的 `mtime`，只重新构建**变化的文件和依赖它的文件**。这就是为什么 watch 模式比手动 `npm run build` 快得多。

---

### 4. webpack-dev-server 的架构

`webpack-dev-server` 不是一个独立工具，而是三个东西的组合：

```
webpack-dev-server
  ├── Express 服务器（处理 HTTP 请求）
  ├── webpack-dev-middleware（在内存中运行 webpack，不写硬盘）
  └── WebSocket 服务（推送构建状态到浏览器）
```

**内存构建**：webpack-dev-middleware 把 webpack 的 `outputFileSystem` 替换成了 `memfs`（内存文件系统）。构建产物不落盘，直接在内存中通过 HTTP 返回。两次构建差异：

```
普通构建：webpack → fs.writeFile → dist/ → 从硬盘读

DevServer：webpack → memfs → Express 直接从内存读 → HTTP 响应
                        ↑ 快在这里——没有 IO
```

**完整请求流程**：

```
浏览器请求 localhost:3000/main.js
  → Express 收到请求
  → webpack-dev-middleware 拦截
  → 从 memfs 中读取 main.js
  → 设置 Content-Type: application/javascript
  → 返回给浏览器
```

---

### 5. HMR 完整原理

#### 4.1 从文件变更到浏览器更新，发生了什么？

```
① 你改了 src/a.js 并保存
      │
② webpack --watch 检测到文件变更
      │
③ webpack 增量编译：只重编 a.js 和依赖 a.js 的模块
      │
④ 生成两个特殊文件（存在 memfs 中）：
      │   main.abc123.hot-update.json   → { "c": ["main"], "r": [], "m": [...] }
      │   main.abc123.hot-update.js     → 替换模块的新代码
      │
⑤ WebSocket 推送消息给浏览器：
      │   { "type": "hash", "data": "abc123" }     ← 新 hash
      │   { "type": "ok" }                           ← 编译成功
      │
⑥ 浏览器 HMR runtime 收到消息：
      │   module.hot.check() 被调用
      │   → 下载 main.abc123.hot-update.json（知道哪些模块变了）
      │   → 下载 main.abc123.hot-update.js（拿到新模块代码）
      │   → module.hot.apply() 替换旧模块
      │
⑦ 更新完成，页面不刷新，状态保留
```

**hot-update.json 的内容**：

```json
{
  "c": ["main"],       // 哪些 chunk 被更新了
  "r": [],              // 哪些模块被完全移除
  "m": ["./src/a.js"]   // 哪些模块被替换了（与 hot-update.js 中的模块一一对应）
}
```

**hot-update.js 的内容**：

```js
// 本质就是 webpack 的模块定义，只包含变更的模块
"use strict";
self["webpackHotUpdate"]("main", {
  "./src/a.js": ((module, __webpack_exports__, __webpack_require__) => {
    // ... 新的模块代码 ...
  })
});
```

#### 4.2 `module.hot.accept()` 到底干了什么？

HMR runtime 内置在 webpack 打包产物中（看 bundle 开头有一段 webpack 注入的 runtime 代码）。关键 API：

```js
// ① 声明"我可以热替换"（最常用）
module.hot.accept();                    // 接受自身更新
module.hot.accept('./dep.js');          // 只接受特定依赖的更新
module.hot.accept(['./a.js', './b.js'], () => {
  // 回调：被依赖的模块更新后执行（重新渲染等）
});

// ② 声明"我不能热替换，但我能清理自己"（比如卸载事件监听）
module.hot.dispose((data) => {
  // 旧模块被替换前调用
  data.cleanup = () => { /* ... */ };
  clearInterval(timer);
});

// ③ 声明"这个模块完全不能热替换"——回退到 Live Reload
module.hot.decline('./legacy.js');

// ④ 查看 HMR 状态
module.hot.status(); // "idle" | "check" | "prepare" | "ready" | "dispose" | "apply" | "abort" | "fail"
```

**为什么 CSS 自动 HMR 而 JS 不行？**

CSS 模块没有"状态"——它就是一个字符串。style-loader 在内部调了 `module.hot.accept()`，自动处理了替换逻辑：

```js
// style-loader 内部（简化）
if (module.hot) {
  module.hot.accept();  // 自动接受更新
  // 更新时：拿到新 CSS 字符串 → 替换 <style> 的 innerHTML
}
```

JS 模块不一样——它可能有闭包变量、事件监听器、组件状态等运行时状态。webpack 不知道"替换这个模块后怎么把状态接上"，所以需要你手动 `module.hot.accept()` 并提供恢复逻辑。

#### 4.3 原生 JS 如何开启 HMR

CSS 的 HMR 是"自动"的——style-loader 内部调了 `module.hot.accept()`，你零配置就能用。但 **JS 模块不一样**，webpack 不知道你的模块有没有运行时状态、怎么恢复，所以需要你手动标记"更新边界"。

**核心规则**：依赖树上必须有**至少一个**模块调用 `module.hot.accept()`，否则 HMR 找不到承接点，降级为全量 `location.reload()`。

**原生 JS 的做法**——在入口文件加一行：

```js
// src/index.js（入口）
import { shout } from './a.js';

console.log(shout('hello'));

// 把入口标记为"更新边界"——所有子模块的改动冒泡到这里被接受
if (module.hot) {
  module.hot.accept();
}
```

依赖链上的冒泡逻辑：

```
math.js 改动 → math.js 没有 accept → 冒泡到父模块 index.js
  → index.js 有 module.hot.accept() ✅ → 原地热替换，页面不刷新

index.js 自己改动
  → index.js 有 module.hot.accept() ✅ → 原地热替换
```

**只需要在入口加一处就够了**，子模块（`a.js`、`math.js` 等）不需要重复加。

**React / Vue / Svelte 等框架的做法**——框架的 loader/plugin 替你做了这件事：

| 框架 | HMR 方案 | 原理 |
|------|----------|------|
| **React** | `react-refresh` + `@pmmmwh/react-refresh-webpack-plugin` | 保留组件状态，只替换变化组件的 render 逻辑 |
| **Vue 3** | `vue-loader` 内置 | 组件级 HMR，template/style/script 独立更新 |
| **Vue 2** | `vue-loader` + `vue-template-compiler` | 同上 |
| **Svelte** | `svelte-loader` 内置 | 编译时注入 HMR accept |
| **Preact** | `@prefresh/webpack` | 类似 react-refresh 机制 |
| **Lit** | `@lit-labs/hot-module-replacement` | Web Component 的 HMR 支持 |

它们的 loader/plugin 本质也是在编译产物里自动注入 `module.hot.accept()`——你装好对应的 loader 就行，不需要手写。

**如果某个子模块就是不能热替换**（比如它有全局副作用）：

```js
module.hot.decline('./legacy.js');  // 强制降级：这个文件变了就全量刷新
```

#### 4.4 HMR 的边界情况

**HMR 退化为 Live Reload 的场景**：

1. **整条依赖链上没有任何 `module.hot.accept()`**——这是最常见的"为什么我的 HMR 不生效"原因
2. **新增/删除文件**——模块依赖图变了，需要完整重新编译
3. **node_modules 变化**——依赖变更，全量重建
4. **配置文件变化**——webpack 配置变了，需要重启 DevServer
5. **handleModuleNotFound**——模块解析失败（import 了不存在的文件），无法增量

---

### 6. Source Map —— 深入

#### 5.1 devtool 完整对照表

| devtool | 构建速度 | 重建速度 | 生产可用？ | 产物说明 |
|---------|:---:|:---:|:---:|------|
| `false` | ⚡⚡⚡ | ⚡⚡⚡ | — | 纯 JS，无任何映射 |
| `eval` | ⚡⚡⚡ | ⚡⚡⚡ | ❌ | 每个模块 `eval("...//# sourceURL=...")` |
| `eval-cheap-source-map` | ⚡⚡ | ⚡⚡⚡ | ❌ | eval + 行级映射（合并 loader 源） |
| `eval-cheap-module-source-map` | ⚡ | ⚡⚡ | ❌ | eval + 行级映射（保留 loader 前的原始源码） |
| `eval-source-map` | ⚡ | ⚡⚡ | ❌ | eval + 完整行/列映射 |
| `cheap-source-map` | ⚡⚡ | ⚡ | ❌ | 独立 .map 文件，行级，合并 loader 源 |
| `cheap-module-source-map` | ⚡ | ⚡ | ❌ | 独立 .map，行级，保留原始源码 |
| `source-map` | ⚡ | ⚡ | ✅ | 独立 .map，完整行/列映射 |
| `inline-source-map` | ⚡ | ⚡ | ❌ | .map 用 base64 内嵌在 bundle 里 |
| `hidden-source-map` | ⚡ | ⚡ | ✅ | 独立 .map，但 JS 里不写 `//# sourceMappingURL` |
| `nosources-source-map` | ⚡ | ⚡ | ✅ | 独立 .map，但不包含 `sourcesContent`（看不到源码） |

**名字解析**：

```
eval-cheap-module-source-map
 │    │     │      │     └── 生成 source map
 │    │     │      └── 不生成列映射（只到行），减少体积
 │    │     └── 显示 loader 转换前的原始源码
 │    └── 每个模块用 eval() 包裹（快速重建）
 └── 用 eval 执行代码
```

**推荐组合**：

```js
// webpack.config.js
module.exports = {
  devtool: process.env.NODE_ENV === 'production'
    ? 'hidden-source-map'              // 生产：外部 .map，不回传到浏览器
    : 'eval-cheap-module-source-map',  // 开发：快 + 能看到原始源码
};
```

#### 5.2 VLQ 编码 —— `mappings` 字段怎么把几百 KB 的映射压成几十 KB？

source map 的 `mappings` 字段用的是 **VLQ（Variable-Length Quantity）编码**，一种变长整数编码。核心思路：**用尽可能少的字符表示大的数字**。

一个映射条目包含 5 段信息：

```
[生成代码列] [源文件索引] [源行号] [源列号] [名称索引]
```

示例映射：`"AAAA"` 在 VLQ 下解码后 → `[0, 0, 0, 0]` → "生成代码第 0 列，映射到第 0 个源文件的第 0 行第 0 列"。下一段只存和上一段的**增量**，大部分增量是 0 或用很少几个字符表示——这就是压缩的秘诀。

> 日常不需要手动处理 VLQ，但面试时能讲出"增量编码 + 变长整数"就很加分。

#### 5.3 生产环境 Source Map 的安全考量

| 策略 | 做法 | 适用 |
|------|------|------|
| **不上传 .map** | `devtool: false` 或不部署 .map 文件 | 完全不暴露源码 |
| **隐藏引用** | `hidden-source-map` → .map 存在但不在 bundle 里引用 | 内部错误追踪时手动加载 .map |
| **私有存储** | .map 上传到 Sentry / 私有服务器，不在 CDN 暴露 | 监控系统用 |

Sentry 等错误追踪服务依赖 .map 文件来还原生产错误的堆栈——上传到它们而不是公开 CDN。

---

### 7. DevServer Proxy —— 怎么转发的？

webpack-dev-server 的 proxy 底层用的是 **`http-proxy-middleware`**。当一个请求到达 DevServer：

```
浏览器 fetch('/api/users')  →  DevServer (localhost:3000)
                                      │
                                      ├── 路径匹配 /api ？
                                      │    ├── 是 → 不自己处理，转发给 target
                                      │    └── 否 → DevServer 自己处理（返回 HTML/JS/CSS）
                                      │
                                      ↓
                                http://localhost:4000/users
                                      │
                                      ↓
                                后端响应 → 原路返回给浏览器
```

```js
devServer: {
  proxy: [
    {
      context: ['/api', '/auth'],              // 匹配这些路径
      target: 'http://localhost:4000',
      changeOrigin: true,                       // 改 Host 头为 target 的域名
      secure: false,                            // 允许自签名 HTTPS 证书
      pathRewrite: { '^/api': '' },             // 重写路径
      logLevel: 'debug',                        // 开发时开启，看请求详情
      onProxyReq: (proxyReq, req, res) => {
        // 自定义：往转发请求上加头（如开发用 token）
        proxyReq.setHeader('X-Dev-Token', 'dev-secret');
      },
    },
  ],
}
```

**`changeOrigin: true` 为什么重要？**

如果后端有基于 Host 头做校验（如防盗链、虚拟主机），不改 Host 后端会收到 `Host: localhost:3000`（DevServer 地址），可能导致拒绝请求。`changeOrigin: true` 把它改成 `Host: localhost:4000`（后端地址）。

---

### 8. 错误提示与调试体验

#### 7.1 stats —— 控制终端输出的详细程度

```js
module.exports = {
  stats: 'errors-warnings',  // webpack 5 默认，只显示错误和警告
  // 可选值：'none' | 'summary' | 'errors-only' | 'errors-warnings' | 'minimal' | 'normal' | 'detailed' | 'verbose'
};
```

也可以精确控制每个维度的输出：

```js
stats: {
  colors: true,              // 彩色输出
  modules: false,            // 不列出所有模块（太多，乱）
  children: false,           // 不显示子编译信息
  chunks: false,             // 不显示 chunk 列表
  chunkModules: false,
  assets: true,              // 显示产物文件
  entrypoints: true,         // 显示入口点
  errors: true,
  warnings: true,
  builtAt: true,             // 构建时间
  timings: true,             // 各阶段耗时
}
```

#### 7.2 overlay —— 浏览器全屏错误提示

```js
devServer: {
  client: {
    overlay: {
      errors: true,           // 编译错误 → 浏览器全屏弹红框
      warnings: false,        // 警告不弹（避免开发时太频繁打断）
      runtimeErrors: true,    // 运行时错误也弹
    },
    progress: true,           // 浏览器底部显示构建进度条
  },
}
```

#### 7.3 热更新进度反馈

`webpackbar` 插件可以在终端显示构建进度条，比默认的日志输出直观得多：

```bash
npm install -D webpackbar
```

```js
const WebpackBar = require('webpackbar');
plugins: [new WebpackBar()],
```

效果：终端出现一个彩色进度条，显示模块数量、构建耗时、各阶段进度。

---

## 练习（由浅入深）

### Lv.1 感受 DevServer

```bash
npm run dev
```

浏览器自动打开 `localhost:3000`。修改 `src/style.css` 的背景色，保存——页面**不刷新**但颜色变了（HMR）。再删除 `src/index.js` 中的 `module.hot.accept()`，改 JS——观察页面是否整个刷新（变为 Live Reload）。

### Lv.2 对比 Watch 和 DevServer

```bash
# 先跑 watch 模式
npx webpack --watch --mode development

# 浏览器手动打开 dist/index.html，改代码观察区别：
# - 改完是否自动刷新？（不会——需要手动刷）
# - 产物在哪？（硬盘 dist/ —— 和 DevServer 的内存构建不同）
```

用 Network 面板看 `main.bundle.js` 的加载时间——`watch` 模式从硬盘读，DevServer 从内存读，速度差多少。

### Lv.3 HMR —— `module.hot.accept()` 的三种粒度

```js
// src/index.js

// 粒度 1：接受自身更新
if (module.hot) {
  module.hot.accept();
}

// 粒度 2：只接受特定依赖的更新
if (module.hot) {
  module.hot.accept('./a.js', () => {
    console.log('a.js 更新了');
  });
}

// 粒度 3：拒绝热替换，强制降级到 Live Reload
if (module.hot) {
  module.hot.decline('./a.js');
}
```

分别试三种，改 `a.js` 观察行为差异。

### Lv.4 看 HMR 的 WebSocket 消息

DevTools → Network → WS → 找到 `ws://localhost:3000/ws` → Messages 面板。修改文件后：

1. 看到 `{"type":"hash","data":"..."}` ——新构建 hash
2. 看到 `{"type":"ok"}` ——构建成功
3. 浏览器发起两个请求：`xxx.hot-update.json` 和 `xxx.hot-update.js`
4. 页面更新

### Lv.5 Source Map 对比

在 `webpack.config.js` 中分别配置：

```js
devtool: false
devtool: 'eval'
devtool: 'eval-cheap-module-source-map'
devtool: 'source-map'
```

每次改完跑 `npm run build`，在 `src/index.js` 里故意写 `console.log(undefined.foo)`，打开生成的 HTML，看 Console 报错堆栈：

- `false` 时指向哪里？（bundle.js 第几行？）
- `eval` 时指向哪里？（能看到源码文件名吗？）
- `source-map` 时指向哪里？（能看到源文件和精确行号吗？）

### Lv.6 devtool 构建速度对比

用一个较大的项目（或者多复制几个 js 文件制造体积），分别用 `false`、`eval`、`source-map` 构建，对比构建时间——体会"开发用 eval 系列"的原因。

### Lv.7 Proxy 调试

让 DevServer 同时代理两个不同后端：

```js
proxy: [
  { context: ['/api'], target: 'http://localhost:4000' },
  { context: ['/ws'],  target: 'ws://localhost:4000', ws: true },
]
```

打开 `logLevel: 'debug'`，在终端看代理日志。

---

## 预期效果

- 理解 Watch / DevServer / HMR 的工作原理，而不仅仅是会用
- 能手动画出 HMR 的完整流程：文件变更 → 增量编译 → hot-update 文件 → WebSocket 推送 → 浏览器替换模块
- 能分辨 `module.hot.accept()` / `.dispose()` / `.decline()` 的各自用途
- 能从 devtool 全表中根据场景选出合适的值，并解释为什么
- 理解 proxy 的转发机制和 `changeOrigin` 的作用
- 能独立配置一个完整的开发环境（端口、proxy、HMR、overlay、进度条）

---

## 面试题

- [ ] HMR 的原理是什么？从文件变更到浏览器更新发生了什么？能画出流程图吗？
- [ ] `module.hot.accept()` 有几个重载？`.dispose()` 是干什么的？
- [ ] webpack-dev-server 由哪三部分组成？webpack-dev-middleware 的职责是什么？
- [ ] 为什么 CSS 可以自动 HMR 而 JS 需要手动 `module.hot.accept()`？
- [ ] `eval-cheap-module-source-map` 每个词分别代表什么含义？
- [ ] Source Map 的 `mappings` 字段用什么编码？为什么不用 JSON 数组直接存行列？
- [ ] production 环境应该用哪种 devtool？为什么不用 inline-source-map？
- [ ] devServer 的 proxy 原理？底层用了什么库？`changeOrigin` 有什么用？
- [ ] Watch Mode 的 `poll` 和 `fs.watch` 的区别？什么场景需要切到 poll？
- [ ] `hot-update.json` 和 `hot-update.js` 分别包含什么内容？
