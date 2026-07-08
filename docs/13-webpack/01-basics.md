# 01 - 基础打包

## 概念

webpack 本质上是一个**模块打包工具**：它从入口文件出发，递归追踪所有 `import`/`require` 依赖，把所有模块打包成浏览器可执行的静态文件。

### 1. 为什么需要打包？

在 webpack 之前，前端项目通常是一堆 `<script>` 标签手动管理加载顺序，依赖关系靠"全局变量 + 约定"。当项目变大，这种方式的痛点变得不可容忍：变量冲突、加载顺序错误、无法按需加载。

webpack 的核心价值在于：**把分散的模块按依赖关系组织起来，输出成优化过的产物。**

### 2. 核心概念：Entry / Output

这是 webpack 最基础的两个概念，理解了它们就理解了打包的骨架：

- **Entry（入口）**：webpack 构建依赖图的起点。可以是一个，也可以是多个。
- **Output（输出）**：打包后文件放在哪里、叫什么名字。

```js
module.exports = {
  entry: './src/index.js',      // 入口
  output: {                      // 输出
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};
```

### 3. Output 文件名占位符：hash 的三种类型

`output.filename` 支持用方括号占位符来动态命名文件。最常用的除了 `[name]`（entry 的 key），就是三种 hash：

```js
output: {
  filename: '[name].[???].js',
}
```

#### 为什么需要 hash？

浏览器缓存策略：文件名不变 → 浏览器用本地缓存，不发请求。但当你修了 bug 重新部署时，如果文件名没变，用户拿到的还是旧文件。解决方案很简单——**文件名里嵌入内容的 hash**：内容变了 hash 就变，文件名变了浏览器就重新下载。

#### 三种 hash 的对比

| 占位符 | 粒度 | 什么变了会更新 | 典型用途 |
|--------|------|---------------|---------|
| `[hash]` | **整个构建** | 任何一个文件变了，所有文件名全变 | ❌ 基本不用，太粗 |
| `[chunkhash]` | **每个 chunk** | 只有当前 chunk 的代码变了才变 | JS chunk 文件 |
| `[contenthash]` | **文件内容** | 只有文件自身内容变了才变 | 提取的 CSS 文件 |

#### 为什么 `[hash]` 不能用？

```
构建产物：
  main.[hash].js      → hash: abc123
  admin.[hash].js     → hash: abc123   (一样!)
  style.[hash].css    → hash: abc123   (一样!)

问题：改了 main.js 的一行代码 → hash 全变 → 所有文件的缓存全部失效
     包括 admin.js 和 style.css 这些根本没改的文件
```

这就是 `[hash]` 的问题——粒度太粗，**一粒老鼠屎坏了一锅粥**。

#### `[chunkhash]` 怎么解决的？

```
构建产物：
  main.[chunkhash].js      → hash: a1b2c3
  admin.[chunkhash].js     → hash: d4e5f6   (不一样!)

改了 main.js → 只有 main 的 chunkhash 变 → admin 的缓存仍然有效 ✅
```

同一个 chunk 的 JS 和 CSS 共用同一个 `chunkhash`，所以当 JS 变了 CSS 的 chunkhash 也跟着变——对 CSS 来说这是误伤。

**为什么会"连累"？** 看这个配置：

```js
// webpack.config.js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: { main: './src/index.js' },
  output: {
    filename: '[name].[chunkhash].js',       // JS 用 chunkhash
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].css',    // CSS 也用 chunkhash
    }),
  ],
  module: {
    rules: [{ test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader'] }],
  },
};
```

构建后产物：

```
dist/
├── main.a1b2c3.js    ← chunkhash: a1b2c3
└── main.a1b2c3.css   ← chunkhash: a1b2c3（和 JS 一模一样！）
```

为什么一样？因为 `MiniCssExtractPlugin` 虽然把 CSS 抽成了独立**文件**，但这个 CSS 文件仍然属于 `main` 这个 **chunk**。`[chunkhash]` 是拿整个 chunk 的内容来算 hash——CSS 文件只是 chunk 的一份"提取物"，不改变它属于 main chunk 的事实。

现在你改了 `index.js` 的一行逻辑（CSS 完全没碰）：

```
dist/
├── main.d4e5f6.js    ← hash 变了（因为 JS 内容变了）
└── main.d4e5f6.css   ← hash 也变了！但 CSS 内容一个字都没改
```

结果：用户浏览器里缓存的好好的 `main.a1b2c3.css` 失效了，被迫重新下载一份**一模一样**的 CSS。这就是 chunkhash 的误伤。

**换成 `[contenthash]` 就解决了：**

```js
output: {
  filename: '[name].[contenthash].js',
},
plugins: [
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',   // 改这里
  }),
],
```

现在改了 JS 再构建：

```
dist/
├── main.d4e5f6.js    ← 变了（JS 内容确实改了）
└── main.a1b2c3.css   ← 不变！（CSS 内容没改，contenthash 不变）
```

`[contenthash]` 只看**这个文件自身的内容**，不管它属于哪个 chunk。CSS 文件内容没变，hash 就不变，用户浏览器继续用缓存。✅

#### `[contenthash]` —— 最精确

```
构建产物：
  main.[contenthash].js    → hash: x1y2z3
  main.[contenthash].css   → hash: p7q8r9   (各自独立!)

改了 main.js → 只有 JS 的 contenthash 变 → CSS 缓存丝毫无损 ✅
改了 main.css → 只有 CSS 的 contenthash 变 → JS 缓存丝毫无损 ✅
```

#### 实际用法

```js
// 最佳实践
output: {
  filename: '[name].[contenthash].js',       // JS 用 contenthash
  // ...
},
plugins: [
  new MiniCssExtractPlugin({
    filename: '[name].[contenthash].css',    // 提取的 CSS 用 contenthash
  }),
],
```

#### 一张图总结

```
改了一行 JS 代码——

[hash]:         main.xxx.js ❌变   style.xxx.css ❌变   admin.xxx.js ❌变
                全部缓存失效

[chunkhash]:    main.xxx.js ❌变   style.xxx.css ❌变   admin.yyy.js ✅不变
                CSS 被所属 chunk 连累

[contenthash]:  main.xxx.js ❌变   style.yyy.css ✅不变   admin.zzz.js ✅不变
                只有真正改了的文件才变
```

> **一句话**：`[hash]` 是全局的——牵一发动全身；`[chunkhash]` 是 chunk 级别的——JS 和 CSS 互相牵连；`[contenthash]` 是文件级别的——各自独立，最适合做持久化缓存。

#### 一个关键追问：HTML 不也缓存吗？

你可能会想到：JS/CSS 文件名带 hash 了，但如果 HTML 本身被浏览器缓存了，用户拿到的还是旧 HTML，里面引用的是旧 hash 的文件名——这不就全白费了？

**这确实是个问题，而且很常见。** 所以线上部署时通常会分开设置缓存策略：

| 资源类型 | 缓存策略 | 原因 |
|----------|---------|------|
| **HTML**（入口文件） | `Cache-Control: no-cache` | 每次都要向服务器验证，确保拿到最新版本 |
| **JS / CSS / 图片 / 字体**（带 hash） | `Cache-Control: max-age=31536000, immutable` | 文件名变了就是新资源，没变就放心用缓存 |

```
用户请求流程：

1. 浏览器访问 / → 请求 index.html
   → no-cache：每次都问服务器"这个 HTML 有更新吗？"
   → 服务器：有！新 HTML 引用的是 main.a1b2c3.js

2. 浏览器看到 main.a1b2c3.js
   → 本地缓存里没有 a1b2c3 这个文件 → 下载 ✅

3. 第二次访问 / → 再次请求 index.html
   → 服务器：没变！304 Not Modified
   → 但这次 HTML 引用的还是 main.a1b2c3.js
   → 浏览器：a1b2c3 本地有缓存，直接用 ✅

4. 你修了 bug，重新部署
   → 新 HTML 引用的是 main.x9y8z7.js
   → 浏览器问服务器 → 有更新！拿到新 HTML
   → 新 HTML 指向 x9y8z7 → 本地没有 → 下载新 JS ✅
   → 旧的 a1b2c3.js 没人引用了，一段时间后 CDN 清理掉
```

**核心策略**：HTML **不缓存**（每次验证），静态资源 **永久缓存**（靠 hash 变化来更新）。HTML 就像一张"购物清单"——清单本身要最新，但清单上的东西可以放心用存货。

> 实际部署时通常在 Nginx/CDN 层配置，跟 webpack 无关。但理解这个配合才能明白：**webpack 的 contenthash 解决了一半问题，另一半靠运维配置 HTML 的缓存头**。

### 4. Mode：两种构建模式

webpack 内置了两种优化策略，通过 `mode` 切换：

| Mode | 特点 |
|------|------|
| `development` | 不压缩、有更详细的错误信息、构建更快 |
| `production` | 自动开启压缩、tree shaking、scope hoisting 等优化 |
| `none` | **什么优化都不做**——产物最接近"手写"，适合学习 webpack 内部机制 |

### 5. Source Map：调试的桥梁

打包后的代码和源码看起来完全不同，调错时需要知道报错对应的源码位置。Source map 就是这个映射文件。

| devtool 值 | 速度 | 质量 | 适用场景 |
|-----------|------|------|---------|
| `eval` | 最快 | 差 | 纯开发不在乎调试时 |
| `eval-source-map` | 快 | 好 | **开发推荐** |
| `source-map` | 慢 | 最好 | 生产环境需要定位错误时 |

---

## 产物解剖：webpack 打包出的代码长什么样

运行 `npm run build:none`（mode 为 `none`，不做任何优化，代码最干净可读），我们来看产物 `dist/esmodule.bundle.js` 的每一层都在做什么。

> **源码回顾** —— 两个文件，极其简单：
> - `index.mjs`：`import { usedFunc } from './a.mjs'; usedFunc();`
> - `a.mjs`：导出 `usedFunc` 和 `unusedFunc` 两个函数

下面是产物逐段拆解。

### 第一层：IIFE 外壳

```js
/******/ (() => { // webpackBootstrap
/******/   "use strict";
// ... 所有代码 ...
/******/ })();
```

整个 bundle 被包在一个 **IIFE**（立即执行函数）里。为什么？因为 webpack 内部有很多变量和函数，它们不能泄露到全局作用域污染用户环境。IIFE 就是那个隔离墙——里面的 `__webpack_modules__`、`__webpack_require__` 都是私有的。

### 第二层：模块数组 —— 依赖图的物理形态

```js
var __webpack_modules__ = ([
/* 0 */,       // 空位！模块 ID 从 1 开始，0 是占位符
/* 1 */        // 这个模块就是 a.mjs
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);           // 标记为 ESM
__webpack_require__.d(__webpack_exports__, {          // 给 exports 挂 getter
  unusedFunc: () => (/* binding */ unusedFunc),
  usedFunc:   () => (/* binding */ usedFunc)
});

const usedFunc = () => console.log('used');            // ← 你的源码
const unusedFunc = () => console.log('unused');        // ← 你的源码

/***/ })
]);
```

webpack 把每个被依赖的文件编上 ID，存入 `__webpack_modules__` 数组。数组下标就是模块 ID —— ID 1 就是 `a.mjs`。注意：

- 每个模块被包在一个**工厂函数**里，接收三个参数：`module`、`exports`、`require`
- **没有合并你的代码**——你的 `usedFunc`、`unusedFunc` 原样保留
- 导出 (`export`) 被转换成 `__webpack_require__.d()` 在 `exports` 上挂 getter —— webpack 实现了 ESM 语义

### 第三层：模块缓存 + require 函数

```js
const __webpack_module_cache__ = {};

function __webpack_require__(moduleId) {
  const cachedModule = __webpack_module_cache__[moduleId];  // 1. 查缓存
  if (cachedModule !== undefined) {
    return cachedModule.exports;                              //   命中 → 直接返回
  }
  const module = __webpack_module_cache__[moduleId] = {      // 2. 缓存里没有
    exports: {}                                               //   创建新 module 对象
  };
  __webpack_modules__[moduleId](                             // 3. 执行模块的工厂函数
    module, module.exports, __webpack_require__
  );
  return module.exports;                                      // 4. 返回 exports
}
```

这就是 webpack **模块系统的核心**——一个自实现的 CommonJS 风格的 `require`。流程：

```
require(1)
  → 检查缓存 → 没有
  → 创建 { exports: {} }
  → 执行 a.mjs 的工厂函数，把导出挂到 exports 上
  → 返回 exports
  → 下次再 require(1) → 直接走缓存
```

这就是为什么用了 `import`，产物里却是 `require` 函数——**webpack 在编译时解析 ESM 的静态依赖关系，在运行时用 CJS 风格的模块加载器来执行**。

### 第四层：Runtime 助手函数

webpack 注入了三个小工具，用来在 CJS 的 `exports` 对象上模拟 ESM 行为：

```js
// 1. d — define property getters（实现 export）
__webpack_require__.d = (exports, definition) => {
  for(var key in definition) {
    if(!__webpack_require__.o(exports, key)) {
      Object.defineProperty(exports, key,
        { enumerable: true, get: definition[key] }
      );
    }
  }
};

// 2. o — hasOwnProperty 快捷方式
__webpack_require__.o = (obj, prop) =>
  (Object.prototype.hasOwnProperty.call(obj, prop));

// 3. r — 标记此 exports 为 ESM 模块
__webpack_require__.r = (exports) => {
  if(Symbol.toStringTag) {
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
  }
  Object.defineProperty(exports, '__esModule', { value: true });
};
```

**重点理解 `r` 和 `d`**：

- `r`（"make namespace object"）——给 exports 打上 `__esModule: true` 标签，告诉使用方"这是 ESM 模块"
- `d`（"define property getters"）——用 `Object.defineProperty` + `get` 方式定义导出。为什么是 getter 而不是直接赋值？因为 **ESM 的 `export` 是动态绑定**——如果模块内部改变了导出的值，导入方能看到这个变化。getter 实现了这个语义。

### 第五层：入口模块执行

```js
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be
// isolated against other modules in the chunk.
(() => {
__webpack_require__.r(__webpack_exports__);                    // 标记为 ESM
var _a_mjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1); // import a.mjs
(0,_a_mjs__WEBPACK_IMPORTED_MODULE_0__.usedFunc)();            // 调用 usedFunc
})();
```

这里就是你的入口文件 `index.mjs` 的编译结果。逐行看：

1. **`import { usedFunc }` → `__webpack_require__(1)`**：webpack 把 `import` 变成了 `require(1)`。因为它在编译时已经分析好了依赖关系：`a.mjs` 的模块 ID 是 1
2. **`usedFunc()` → `(0, _a_mjs__.usedFunc)()`**：调用通过 `__webpack_require__.d` 注册的 getter，拿到真实的 `usedFunc` 函数
3. 入口本身也是 ESM，所以先调 `r()` 打标记

### 全景图

把上面五层拼在一起，就是 webpack 产物的完整结构：

```
┌─ IIFE 外壳 ────────────────────────────────────────┐
│                                                     │
│  ┌─ __webpack_modules__[] ──────────────────────┐  │
│  │ [empty, 工厂函数(a.mjs), ...]                 │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ __webpack_require__(moduleId) ──────────────┐  │
│  │ 核心加载器：查缓存 → 建 module → 执行工厂函数  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ Runtime 助手 ───────────────────────────────┐  │
│  │ r() = 打 ESM 标记 / d() = defineProperty     │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌─ 入口执行 ───────────────────────────────────┐  │
│  │ import { usedFunc } → require(1) → usedFunc() │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 关键理解

| 思考 | 答案 |
|------|------|
| webpack 产物的本质是什么？ | 一个**带模块系统的自执行函数**，webpack 自己实现了一套 CJS 模块加载器 |
| ESM 的 `export` 怎么实现？ | 通过 `Object.defineProperty` + getter 模拟动态绑定 |
| `import` 怎么变成 `require`？ | webpack 在编译时已经解析了所有静态依赖关系，把 `import` 替换成了 `require(moduleId)` |
| 为什么需要 `__webpack_require__.r()`？ | CJS 的 exports 只是一个普通对象，`__esModule: true` 告诉消费者"我其实是 ESM 模块"，防止对默认导出做额外包装 |
| 同一个模块被多次 import 会发生什么？ | 第一次执行后缓存到 `__webpack_module_cache__`，后续直接返回缓存——保证模块单例 |

---

## 练习（由浅入深）

### Lv.1 跑起来

```bash
npm run build          # production 模式
npm run build:dev      # development 模式
```

对比 `dist/` 下两次产物的**文件大小和可读性**差异。

### Lv.2 玩转 output

```js
output: {
  path: path.resolve(__dirname, 'build'),  // 换个目录
  filename: 'app.js',                       // 换个名字
  clean: true,                              // 自动清理旧文件
}
```

运行 `npm run build`，检查 `dist/`（或 `build/`）下的文件。

### Lv.3 改入口、多入口

把入口从 `./src/index.js` 改成另一个文件，观察结果。

然后试试多入口：
```js
entry: {
  main: './src/index.js',
  admin: './src/admin.js',    // 自己创建这个文件
},
output: {
  filename: '[name].bundle.js',   // [name] 会被替换为 entry 的 key
}
```

### Lv.4 Source Map 实战

```js
devtool: 'eval-source-map',
```

在代码里故意写一句 `console.log(nonexistentVar)`，看浏览器控制台报错时指向的是哪个文件。然后改成 `devtool: false`，再看报错指向——理解 source map 的价值。

### Lv.5 构建过程发生了什么？

运行 `npx webpack --mode production --stats verbose`，观察控制台输出的完整构建信息——模块依赖图、loader 调用链、plugin 执行时机等。不必全部理解，先建立印象。

---

## 预期效果

- 理解 entry/output 是 webpack 的骨架
- 能区分 production 和 development 产物的差异
- 知道 source map 如何帮助定位问题

---

## 面试题

> 📝 待整理，先留位

- [ ] webpack 的构建流程是怎样的？
- [ ] entry 的三种写法及使用场景？
- [ ] hash、chunkhash、contenthash 的区别？
