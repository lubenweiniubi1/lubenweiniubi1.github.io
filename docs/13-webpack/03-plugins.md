# 03 - Plugin

## 概念

### 1. Plugin 和 Loader 的区别

这是 webpack 学习中最关键的区分：

| | Loader | Plugin |
|---|--------|--------|
| **作用范围** | 单个文件/模块的**转换** | 整个构建流程的**介入** |
| **工作时机** | 模块被加载时 | 通过钩子（hooks）在各个构建阶段执行 |
| **本质** | 一个函数 | 一个带有 `apply` 方法的类 |
| **典型场景** | CSS → JS、TS → JS | 生成 HTML、压缩、提取 CSS、注入变量 |

一句话：**Loader 管模块内容转换，Plugin 管构建流程控制。**

### 2. Plugin 的工作原理（深入）

#### 2.1 先从一段最简 plugin 说起

一个 plugin 就是一个类，上面有个 `apply` 方法。webpack 在启动时会调用它，把 `compiler` 对象传进来：

```js
class MyPlugin {
  apply(compiler) {
    // compiler 是 webpack 的"总引擎"，整个构建过程它都在
    // 通过 compiler.hooks 上的各种钩子，在任意环节插入你的逻辑
  }
}
```

所以 plugin 的本质就一句话：**webpack 给你一个 `compiler`，你往它的钩子上挂回调，webpack 在对应时机帮你调用。**

#### 2.2 钩子系统：Tapable

webpack 的钩子底层是一个叫 **Tapable** 的库。它的核心概念很简单——**在某个时机，依次调用你注册的回调函数**。但不同的钩子，回调的"传播方式"不同：

| 钩子类型 | 回调之间怎么交互 | 常见用途 |
|---------|-----------------|---------|
| `SyncHook` | 依次执行，互不干扰 | 通知类——"我要做 XXX 了，你们看着办" |
| `SyncBailHook` | 某个回调 `return` 了非 `undefined` → 后面全跳过 | 拦截类——"只要有一个不同意，这事就黄" |
| `SyncWaterfallHook` | 上一个回调的返回值 → 下一个回调的入参 | 管道类——"你的输出是我的输入" |
| `AsyncSeriesHook` | 依次异步执行，上一个完成才到下一个 | 异步通知 |
| `AsyncParallelHook` | 同时异步执行，互不等待 | 并行处理 |

日常开发 90% 用的都是 `SyncHook` 和 `AsyncSeriesHook`。

#### 2.3 往钩子上挂回调：tap / tapAsync / tapPromise

三种注册方式对应三种回调写法：

```js
class MyPlugin {
  apply(compiler) {
    // ① 同步回调 → 用 tap
    compiler.hooks.done.tap('MyPlugin', (stats) => {
      console.log('构建完成！', stats.hash);
    });

    // ② 异步回调（callback 风格）→ 用 tapAsync
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      setTimeout(() => {
        console.log('异步操作完成');
        callback(); // 必须调！否则 webpack 一直等
      }, 1000);
    });

    // ③ 异步回调（Promise 风格）→ 用 tapPromise
    compiler.hooks.emit.tapPromise('MyPlugin', (compilation) => {
      return fetch('/api/foo').then(res => {
        console.log('API 调用完成');
      });
    });
  }
}
```

#### 2.4 两个核心对象：Compiler 和 Compilation

这是理解 webpack plugin 最关键的区分：

| | Compiler | Compilation |
|---|---------|-------------|
| **比喻** | 发动机——整个 webpack 运行期间只有一个 | 一次做工的完整记录——每次构建都新建 |
| **生命周期** | webpack 启动 → 关闭，贯穿始终 | 一次构建（make → seal → emit） |
| **上面有什么** | 全局配置、构建流程钩子 | 模块依赖图、chunk 信息、产物资源 |
| **从哪里拿到** | `apply(compiler)` 的参数 | 通过 compiler 钩子的回调参数 |
| **典型用途** | 构建入口/出口级别的操作 | 操作具体模块、chunk、产物 |

**Compilation 是真正干活的地方**——它掌握着：

```
compilation.modules      → 所有模块（依赖图里的每个文件）
compilation.chunks       → 所有 chunk（模块分组）
compilation.assets       → 最终产物（{ 'main.js': { source(), size() } }）
compilation.hooks        → 更细粒度的钩子（模块优化、chunk 优化、资源处理等）
```

**怎么从 Compiler 拿到 Compilation？** 通过 `compiler.hooks.compilation`：

```js
class MyPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
      // 这里面拿到的是 Compilation 对象
      // compilation 有自己的钩子，可以挂更细粒度的回调
    });
  }
}
```

#### 2.5 一次构建中，关键的钩子发生顺序

```
webpack 启动
  │
  ├── compiler.hooks.initialize
  ├── compiler.hooks.beforeRun
  ├── compiler.hooks.run
  │       │
  │       ├── compiler.hooks.compilation  ← 创建 Compilation 对象
  │       │       │
  │       │       ├── compilation.hooks.buildModule   ← 构建每个模块
  │       │       ├── compilation.hooks.optimize      ← 优化阶段
  │       │       ├── compilation.hooks.processAssets ← 处理产物（一个特殊钩子）
  │       │       │
  │       │       └── compilation.hooks.afterSeal
  │       │
  │       ├── compiler.hooks.emit         ← 产物准备好，即将写入硬盘
  │       ├── compiler.hooks.afterEmit
  │       └── compiler.hooks.done         ← 构建完成
  │
  └── compiler.hooks.shutdown
```

**最常用的三个**：

| 钩子 | 时机 | 能干什么 |
|------|------|---------|
| `compiler.hooks.compilation` | 每次构建开始，Compilation 刚创建 | 往 compilation.hooks 上挂子钩子，操作模块 |
| `compilation.hooks.processAssets` | 产物处理阶段 | **增删改 `compilation.assets`**，比如加文件、压缩内容 |
| `compiler.hooks.done` | 构建结束 | 输出统计、发通知、部署 |

#### 2.6 用 HtmlWebpackPlugin 倒推 Plugin 是怎么做的

用你最熟悉的 `HtmlWebpackPlugin` 来还原它内部做了什么：

```js
// HtmlWebpackPlugin 的简化骨架
class HtmlWebpackPlugin {
  constructor(options) {
    this.options = options; // { template, title, ... }
  }

  apply(compiler) {
    // 第 1 步：在 compilation 钩子上注册——每次构建开始时执行
    compiler.hooks.compilation.tap('HtmlWebpackPlugin', (compilation) => {
      // 第 2 步：在编译过程的 processAssets 阶段介入
      //         ——此时所有模块打包完成，产物就在 compilation.assets 里
      compilation.hooks.processAssets.tap(
        { name: 'HtmlWebpackPlugin', stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS },
        () => {
          // 第 3 步：收集所有打包出来的 JS/CSS 文件名
          const entries = Object.keys(compilation.assets)
            .filter(name => name.endsWith('.js'));
          // → ['main.a1b2c3.js', 'vendors.d4e5f6.js']

          // 第 4 步：根据 template 和收集到的资源，拼出 HTML 字符串
          const html = this.generateHTML(entries, this.options);

          // 第 5 步：把 HTML 作为新的产物文件挂到 compilation.assets 上
          compilation.assets['index.html'] = {
            source: () => html,
            size: () => html.length,
          };
        }
      );
    });
  }

  generateHTML(entries, options) {
    const scripts = entries.map(e => `<script src="${e}"></script>`).join('\n');
    return `<!DOCTYPE html><html><head><title>${options.title}</title></head><body>${scripts}</body></html>`;
  }
}
```

**每一步都要看懂**：

1. `constructor` 收配置 → `apply` 拿 compiler → 挂 `compilation` 钩子拿 compilation
2. 在 `processAssets` 阶段（产物已就绪）拿到 `compilation.assets`——所有打包产物都在这里
3. 遍历产物找 JS/CSS 文件名，根据模板拼 HTML
4. 把 HTML 作为新的 key 塞进 `compilation.assets`——建一条"新产物"
5. webpack 在 emit 阶段会把 `compilation.assets` 里所有东西写入硬盘

#### 2.7 Compilation.assets 是什么？

它就是一个 `{ 文件名: 文件对象 }` 的映射：

```js
compilation.assets = {
  'main.js':   { source: () => javascriptString, size: () => 1234 },
  'style.css': { source: () => cssString,        size: () => 567  },
  // HtmlWebpackPlugin 往里塞了一条：
  'index.html': { source: () => htmlString,       size: () => 890  },
};
```

**大部分 plugin 做的事都是操作 `compilation.assets`**：往里加文件（HtmlWebpackPlugin）、改已有文件内容（压缩 plugin）、删文件——资产表就是最终产物的"清单"，你改它，产物就跟着变。

#### 2.8 一句话总结 Plugin 工作流

```
写一个类，带 apply(compiler)
  → apply 里找到合适的钩子
  → 用 tap / tapAsync 注册回调
  → 在回调里操作 compilation（主要是 compilation.assets）
  → webpack 在 emit 阶段把 compilation.assets 写进 dist/
```

### 3. 常用 Plugin

| Plugin | 功能 | 本质 |
|--------|------|------|
| `HtmlWebpackPlugin` | 自动生成 HTML 并注入打包资源 | 在 `processAssets` 阶段往 `compilation.assets` 里塞 `index.html` |
| `DefinePlugin` | 在编译时替换代码中的常量 | 类似文本替换，但作用于 AST |
| `MiniCssExtractPlugin` | 把 CSS 提取成独立文件 | 替代 style-loader，处理 CSS 模块 |
| `CleanWebpackPlugin` | 构建前清除输出目录 | webpack 5 已内置 `output.clean` |

---

## 练习（由浅入深）

### Lv.1 玩转 HtmlWebpackPlugin

已配置好基础版。试试加参数：
```js
new HtmlWebpackPlugin({
  template: './public/index.html',
  title: 'My App',
  minify: {                        // 仅 production 生效
    removeComments: true,
    collapseWhitespace: true,
  },
})
```

运行 `npm run build`，看 `dist/index.html` 的变化：title 是否变了？HTML 是否被压缩了？

### Lv.2 DefinePlugin —— 编译时常量

```js
const webpack = require('webpack');

plugins: [
  new webpack.DefinePlugin({
    'process.env.APP_VERSION': JSON.stringify('2.0.0'),
    'BUILD_DATE': JSON.stringify(new Date().toISOString()),
  }),
]
```

在 `src/index.js` 中打印这些变量：`console.log(process.env.APP_VERSION)`。

**关键点**：DefinePlugin 在**编译时**做文本替换，这些值在打包后的文件中是写死的字符串。运行 `npm run build`，搜索 `dist/bundle.js` 中 `APP_VERSION` 变成了什么。

### Lv.3 MiniCssExtractPlugin —— CSS 独立输出

```bash
npm install -D mini-css-extract-plugin
```

把 `style-loader` 替换为 `MiniCssExtractPlugin.loader`：
```js
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module: {
  rules: [{
    test: /\.css$/,
    use: [MiniCssExtractPlugin.loader, 'css-loader'],
  }]
},
plugins: [
  new MiniCssExtractPlugin({ filename: '[name].[contenthash].css' }),
]
```

运行 `npm run build`，看 `dist/` 下是否生成了独立的 CSS 文件。理解为什么生产环境要这样做（缓存、并行加载、避免闪烁）。

### Lv.4 对比 style-loader vs MiniCssExtractPlugin

分别用两种方式构建，打开 dist 产物对比：
- **style-loader**：CSS 在 JS bundle 里，运行时通过 JS 注入 `<style>` → 适合开发
- **MiniCssExtractPlugin**：CSS 是独立文件，通过 `<link>` 加载 → 适合生产

### Lv.5 探究 Plugin 执行时机

看 webpack 官方文档的 [Compiler Hooks](https://webpack.js.org/api/compiler-hooks/) 列表。对照 2.5 节的钩子流程图，思考：为什么 `HtmlWebpackPlugin` 必须等到 `processAssets` 阶段才能执行，而不是在 `compilation` 钩子触发时就立刻拼 HTML？

---

## 预期效果

- 清楚 loader 和 plugin 的本质区别（函数 vs 类，模块转换 vs 流程介入）
- 理解 Tapable 钩子系统的几种类型和 tap/tapAsync/tapPromise 三种注册方式
- 能区分 Compiler 和 Compilation 两个核心对象
- 知道 `compilation.assets` 是最终产物的"清单"，大多数 plugin 都是在操作它
- 能用 HtmlWebpackPlugin 的骨架代码讲清楚一个 plugin 的内部工作流

---

## 面试题

> 📝 待整理，先留位

- [ ] loader 和 plugin 有什么区别？从原理、执行时机、使用方式三方面回答
- [ ] webpack 的构建流程分为哪几个阶段？每个阶段有哪些常见 hook？
- [ ] DefinePlugin 是如何工作的？和 Node.js 的 `process.env` 有什么关系？
- [ ] 如果要写一个在文件列表末尾加时间戳的 plugin，应该 hook 到哪个阶段？
