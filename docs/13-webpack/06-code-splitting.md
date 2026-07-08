# 06 - Code Splitting

## 概念

### 1. 为什么需要拆分代码？

把所有代码打包成一个 `bundle.js` 有两个致命问题：
- **首屏慢**：用户需要下载整个 bundle 才能看到页面
- **缓存浪费**：改一行代码，整个 bundle 缓存全部失效

Code Splitting 把代码拆成多个**更小的 chunk**，按需加载。

### 2. 三种拆分方式

| 方式 | 粒度 | 适用场景 |
|------|------|---------|
| **多入口** | 页面级 | MPA（多页应用），如 `main.js` + `admin.js` |
| **SplitChunks** | 模块级 | 抽离公共依赖（node_modules）、公共业务模块 |
| **动态 import** | 按需加载 | 路由懒加载、条件加载的模块 |

### 3. SplitChunksPlugin 的核心参数

webpack 5 的 `splitChunks` 默认配置已经足够好用。核心参数：

```js
optimization: {
  splitChunks: {
    chunks: 'all',        // async | initial | all
    minSize: 20000,       // 小于 20KB 不拆分
    cacheGroups: {         // 自定义分组规则
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        priority: 10,      // 优先级，越大越先匹配
      },
    },
  },
},
```

### 4. 动态 import —— 按需加载的利器

`import()` 返回 Promise，webpack 会自动把被导入的模块拆成独立 chunk，只有执行到这一行时才去加载。

```js
button.onclick = async () => {
  const module = await import('./heavy-module.js');
  module.doSomething();
};
```

---

## 练习（由浅入深）

### Lv.1 感受动态 import

创建 `src/utils.js`：
```js
export function sayHello(name) { console.log(`Hello, ${name}!`); }
export function add(a, b) { return a + b; }
```

在 `src/index.js` 中用按钮触发：
```js
const btn = document.createElement('button');
btn.textContent = 'Load Utils';
btn.onclick = async () => {
  const { sayHello, add } = await import('./utils.js');
  sayHello('Webpack');
  console.log('2 + 3 =', add(2, 3));
};
document.body.appendChild(btn);
```

运行 `npm run build`，看 `dist/` 下是否多了一个独立的 chunk 文件。打开 DevTools Network 面板，点击按钮——chunk 是在点击时才下载的。

### Lv.2 Magic Comments

```js
const utils = await import(
  /* webpackChunkName: "my-utils" */
  /* webpackPrefetch: true */
  './utils.js'
);
```

- `webpackChunkName`：给 chunk 起名（默认是数字 ID）
- `webpackPrefetch: true`：浏览器空闲时预加载（`<link rel="prefetch">`）
- `webpackPreload: true`：与父 chunk 并行加载（`<link rel="preload">`）

运行 build，在 `dist/index.html` 中找 prefetch/preload 的 `<link>` 标签。

### Lv.3 SplitChunks 分离第三方库

安装一个库来实验：
```bash
npm install lodash
```

在代码中导入并使用：
```js
import _ from 'lodash';
console.log(_.chunk([1, 2, 3, 4], 2));
```

配置 splitChunks：
```js
optimization: {
  splitChunks: {
    chunks: 'all',
    cacheGroups: {
      vendor: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendors',
        chunks: 'all',
      },
    },
  },
},
```

运行 build，确认 lodash 被拆到了 `vendors.*.js`。

### Lv.4 理解 chunks 的三个值

```js
splitChunks: { chunks: 'async' }    // 只对动态 import 生效
splitChunks: { chunks: 'initial' }  // 只对入口 chunk 生效
splitChunks: { chunks: 'all' }      // 两种都生效（推荐）
```

分别用三个值构建，对比产物——`chunks: 'async'` 时动态 import 的 lodash 会拆分，但入口同步 import 的不会。

### Lv.5 业务模块也拆分

不只有 node_modules 值得拆——公共业务模块也可以：
```js
cacheGroups: {
  common: {
    minChunks: 2,          // 被至少 2 个 chunk 引用
    priority: 5,           // 优先级（低于 vendor）
    reuseExistingChunk: true,
  },
}
```

创建两个入口都引用的公共模块，验证它是否被自动抽出。

---

## 预期效果

- 能用 `import()` 实现按需加载
- 理解 splitChunks 的工作原理
- 知道 prefetch/preload 的区别和用法

---

## 面试题

> 📝 待整理，先留位

- [ ] webpack 的 Code Splitting 有哪几种实现方式？
- [ ] `chunks: 'async'` / `'initial'` / `'all'` 的区别？
- [ ] prefetch 和 preload 的区别？
- [ ] splitChunks 的 cacheGroups 是如何工作的？vendor 和 common 的 priority 应该怎么设置？
- [ ] 动态 import 返回的是什么？webpack 是如何在运行时加载这些 chunk 的？
