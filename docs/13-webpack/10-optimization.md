# 10 - 性能优化

## 概念

### 1. 性能优化的两个维度

| 维度 | 核心问题 | 关键指标 |
|------|---------|---------|
| **构建速度** | 改一行代码要等多久才能看到效果？ | 冷启动时间、热更新时间 |
| **产物体积** | 用户要下载多少资源才能看到页面？ | bundle 大小、首屏时间 |

很多优化在这两个维度之间是有**权衡**的（比如代码拆得更细 → 产物体积小 → 但构建更慢），需要根据项目特点做取舍。

### 2. 第一步永远是"测量"

在优化之前，先要知道问题在哪：
- **构建速度**：`time npm run build` 记录基准值
- **产物体积**：webpack-bundle-analyzer 生成可视化报告

没有基准的优化是盲目的——你无法证明你的改动真的有效。

### 3. webpack 5 的默认优化

webpack 5 在 production 模式下已经自动做了很多事：
- 代码压缩（TerserPlugin）
- Tree Shaking
- Scope Hoisting（模块合并）
- 持久化缓存支持（默认关闭，需手动开启）

大多数项目不需要从零调优，打开该开的配置就能解决 80% 的性能问题。

---

## 练习（由浅入深）

### Lv.1 建立基准线

```bash
# 测量构建时间
time npx webpack --mode production

# 记录 dist/ 大小
ls -lh dist/
```

### Lv.2 持久化缓存 —— 最简单但最有效的优化

```js
cache: {
  type: 'filesystem',              // 缓存到 node_modules/.cache/webpack
  buildDependencies: {
    config: [__filename],           // 配置文件变了 → 缓存失效
  },
},
```

连续两次 `npm run build`，第二次应该显著变快（第一次 ~500ms，第二次可能 <100ms）。

### Lv.3 缩小搜索范围

```js
module: {
  rules: [{
    test: /\.js$/,
    include: path.resolve(__dirname, 'src'),  // 只看 src
    exclude: /node_modules/,                   // 排除 node_modules
    use: 'babel-loader',
  }]
},
resolve: {
  extensions: ['.js', '.json'],   // 不要写太多后缀
  alias: {
    '@': path.resolve(__dirname, 'src'),   // 路径别名
  },
},
```

### Lv.4 Bundle Analysis —— 看清产物体积

```bash
npm install -D webpack-bundle-analyzer
```

```js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

plugins: [
  new BundleAnalyzerPlugin({
    analyzerMode: 'static',       // 生成 HTML 文件
    reportFilename: 'bundle-report.html',
    openAnalyzer: false,
  }),
]
```

打开 `dist/bundle-report.html`，看看哪个模块占了最大体积——这决定了你下一步该优化什么。

### Lv.5 多线程 / 更快的 Loader

```bash
npm install -D esbuild-loader
```

把 `babel-loader` 换成 `esbuild-loader`：
```js
{
  test: /\.js$/,
  loader: 'esbuild-loader',
  options: { target: 'es2015' },
}
```

对比替换前后的构建时间差异——esbuild 通常比 babel 快 10-100 倍。

### Lv.6 压缩和 externals

```js
// 生产环境把 console 删掉
optimization: {
  minimize: true,
  minimizer: [
    new TerserPlugin({ terserOptions: { compress: { drop_console: true } } }),
    new CssMinimizerPlugin(),
  ],
},
// CDN 加载的库不要打进 bundle
externals: {
  lodash: '_',               // 假设 lodash 通过 CDN 暴露为全局 _
},
```

---

## 性能优化速查表

| 问题 | 首选方案 | 深入方案 |
|------|---------|---------|
| 构建慢 | `cache: { type: 'filesystem' }` | thread-loader / esbuild-loader |
| 打包体积大 | `BundleAnalyzer` 分析 → 找大头 | splitChunks + externals |
| HMR 慢 | 排除 node_modules 的 loader | 针对性 include |
| 首屏加载慢 | code splitting + prefetch | HTTP/2 优化 |

---

## 预期效果

- 会使用 webpack-bundle-analyzer 定位问题
- 知道缓存 + 缩小搜索范围是最简单且最有效的优化
- 能根据分析结果制定有针对性的优化策略

---

## 面试题

> 📝 待整理，先留位

- [ ] webpack 构建速度慢，你从哪些方面排查和优化？
- [ ] webpack 5 的 filesystem cache 原理是什么？
- [ ] Tree Shaking、Code Splitting、Scope Hoisting 分别解决什么问题？
- [ ] 首屏加载慢，和 webpack 相关的优化手段有哪些？
- [ ] babel-loader 和 esbuild-loader 的性能差异原因？
- [ ] externals 配置的作用和原理？
