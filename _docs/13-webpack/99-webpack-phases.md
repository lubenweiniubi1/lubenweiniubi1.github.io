# webpack 编译阶段详解

> 对照源码和官方文档，逐阶段拆解 webpack 从启动到产物的完整过程。每个阶段都标注了对应的 hook、可拿到的数据、以及实战例子。

---

## 一、先分两层：Compiler 生命周期 vs Compilation 生命周期

webpack 的钩子分布在两个对象上，层级不同：

```
Compiler（全生命周期，一次运行只有一个）
  │
  ├── 启动 → 准备 → 开始编译
  │
  ├── Compilation（单次构建，watch 模式下每次文件变动都新建一个）
  │     │
  │     ├── 构建模块 → 优化 → 封装 → 产出 assets
  │     │
  │     └── 销毁
  │
  ├── 产出 → 写盘
  │
  └── 关闭
```

---

## 二、Compiler 级钩子（按发生顺序）

### 阶段 1：启动

| 钩子 | 时机 | 类型 | 说明 |
|------|------|------|------|
| `initialize` | webpack 初始化完成，配置已加载 | SyncHook | 最早的可介入点，此时还没开始编译 |
| `environment` | Node.js 环境准备完毕 | SyncHook | 极少用 |
| `afterEnvironment` | environment 之后 | SyncHook | 插件注册完毕 |
| `beforeRun` | 即将开始第一次构建 | AsyncSeriesHook | 可以在这里做构建前的准备工作 |
| `run` | 构建正式开始 | AsyncSeriesHook | **在读取 entry 和 compiler records 之前** |

此时 `compiler.options` 已就绪（合并后的最终配置），可以读但不能改。

### 阶段 2：编译

| 钩子 | 时机 | 类型 | 说明 |
|------|------|------|------|
| `normalModuleFactory` / `contextModuleFactory` | 创建模块工厂（在 compile 之前触发） | SyncHook | 可以在这里修改模块创建规则 |
| `beforeCompile` | 编译参数准备完毕，即将创建 compilation | AsyncSeriesHook | 最后一次修改编译参数的机会 |
| `compile` | 即将创建 compilation 对象 | SyncHook | |
| `thisCompilation` | **Compilation 对象刚创建**，还没构建模块 | SyncHook | 注册 compilation 级钩子的地方 |
| `compilation` | 和 `thisCompilation` 几乎同时，但也会在子编译时触发 | SyncHook | **最常用**——大部分 plugin 的入口 |

```js
// 最标准的 plugin 入口模式
compiler.hooks.compilation.tap('MyPlugin', (compilation) => {
  // 拿到了 compilation，往它的钩子上挂回调
  compilation.hooks.processAssets.tap('MyPlugin', () => {
    // 在合适的时机做事
  });
});
```

### 阶段 3：构建模块（make）

| 钩子 | 时机 | 类型 | 说明 |
|------|------|------|------|
| `make` | **开始构建模块依赖图** | AsyncParallelHook | 从 entry 出发，递归解析依赖 |
| `finishMake` | 模块构建完毕 | AsyncSeriesHook | 模块图和模块树已确定 |

`compilation.hooks.finishMake` 是确认"所有模块都找完了"的信号——之后不会再新增模块。

**模块构建阶段（compilation 级）：**

| 钩子 | 时机 | 类型 |
|------|------|------|
| `buildModule` | 开始构建某个模块 | SyncHook |
| `normalModuleLoader` | loader 处理模块内容 | SyncHook |
| `succeedModule` | 模块构建成功 | SyncHook |
| `failModule` | 模块构建失败 | SyncHook |
| `finishModules` | **所有模块构建完成** | SyncHook |

### 阶段 4：封装（seal）—— 最重要

`seal` 是构建的"总装阶段"——模块已成，现在要把它们组织成 chunk、放到 assets 中。

| 钩子 | 时机 | 说明 |
|------|------|------|
| `seal` | 开始封装 | 入口 |
| `optimizeDependencies` | 优化依赖 | |
| `afterOptimizeDependencies` | | |
| `beforeChunks` | 即将创建 chunk | |
| `afterChunks` | chunk 已创建 | **此时能看到 chunk 和模块的分组关系** |
| `optimize` | 开始优化阶段 | 一系列优化钩子的起点 |
| `optimizeModules` | 优化模块（压缩、合并等） | |
| `afterOptimizeModules` | | |
| `optimizeChunks` | 优化 chunk（拆分、合并） | |
| `afterOptimizeChunks` | | |
| `optimizeTree` | 优化模块树 | |
| `afterOptimizeTree` | | |
| `optimizeChunkModules` | 优化 chunk 内的模块 | |
| `afterOptimizeChunkModules` | | |
| `shouldRecord` | 是否记录模块信息 | |

### 阶段 5：处理产物（processAssets）—— 操作 assets 的唯一窗口

这是 webpack 5 引入的钩子，替代了旧的 `optimizeAssets` 等钩子。**所有对最终产物的增删改都应该在这里完成。**

```js
compilation.hooks.processAssets.tap(
  {
    name: 'MyPlugin',
    stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONS, // ← 指定阶段
  },
  (assets) => {
    // assets 就是 compilation.assets
  }
);
```

**stage 参数决定了你的回调在第几轮执行**（按顺序）：

| stage 常量 | 执行顺序 | 典型用途 |
|-----------|---------|---------|
| `PROCESS_ASSETS_STAGE_ADDITIONAL` | 1 | 从已有 assets 衍生出新文件（如 source map） |
| `PROCESS_ASSETS_STAGE_PRE_PROCESS` | 2 | 预处理，比如读取 assets 做分析 |
| `PROCESS_ASSETS_STAGE_DERIVED` | 3 | 从 assets 计算派生内容 |
| `PROCESS_ASSETS_STAGE_ADDITIONS` | 4 | **往 assets 里加新文件**（HtmlWebpackPlugin 在这） |
| `PROCESS_ASSETS_STAGE_OPTIMIZE` | 5 | 优化已有 assets（如压缩 JS/CSS） |
| `PROCESS_ASSETS_STAGE_OPTIMIZE_COUNT` | 6 | |
| `PROCESS_ASSETS_STAGE_OPTIMIZE_COMPATIBILITY` | 7 | 兼容性优化 |
| `PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE` | 8 | 体积优化 |
| `PROCESS_ASSETS_STAGE_DEV_TOOLING` | 9 | 开发工具（source map 相关） |
| `PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE` | 10 | 内联优化 |
| `PROCESS_ASSETS_STAGE_OPTIMIZE_HASH` | 11 | hash 计算 |
| `PROCESS_ASSETS_STAGE_OPTIMIZE_TRANSFER` | 12 | 传输优化 |
| `PROCESS_ASSETS_STAGE_ANALYSE` | 13 | 分析 |
| `PROCESS_ASSETS_STAGE_REPORT` | 14 | **最后一步**——生成分析报告 |

### 阶段 6：输出

| 钩子 | 时机 | 类型 | 说明 |
|------|------|------|------|
| `afterSeal` | 封装完成 | AsyncSeriesHook | |
| `shouldEmit` | 是否应该写盘（return false 可阻止） | SyncBailHook | **唯一的"拦截"点** |
| `emit` | 即将写盘 | AsyncSeriesHook | 最后修改 assets 的机会 |
| `afterEmit` | 写盘完成 | AsyncSeriesHook | 可以做部署、上传等操作 |
| `done` | 构建完全结束 | AsyncSeriesHook | **最常用**——输出统计、发送通知 |
| `failed` | 构建失败 | SyncHook | 错误处理 |
| `shutdown` | webpack 即将关闭 | AsyncSeriesHook | 清理资源 |

---

## 三、完整钩子时序图（一图纵览）

```
webpack(options)
  │
  ├── compiler.hooks.initialize
  ├── compiler.hooks.environment
  ├── compiler.hooks.afterEnvironment
  ├── compiler.hooks.beforeRun
  ├── compiler.hooks.run
  │       │
  │       ├── compiler.hooks.normalModuleFactory
  │       ├── compiler.hooks.beforeCompile
  │       ├── compiler.hooks.compile
  │       │
  │       ├── compiler.hooks.thisCompilation  ──┐
  │       ├── compiler.hooks.compilation       ─┤ 创建 Compilation 对象
  │       │                                     │
  │       ├── compiler.hooks.make               │   ┌─────────────────────────┐
  │       │   │                                 │   │ Compilation 内部：       │
  │       │   ├── compilation.hooks.buildModule │   │                         │
  │       │   ├── ...每个模块...                 │   │ buildModule → succeed   │
  │       │   └── compilation.hooks.finishModules│  │ → seal → optimize →     │
  │       │                                     │   │ processAssets →        │
  │       ├── compiler.hooks.finishMake          │   │ afterSeal               │
  │       │                                     │   └─────────────────────────┘
  │       ├── compilation.hooks.seal            ─┘
  │       │   ├── optimize 系列
  │       │   └── processAssets（按 stage 分轮次）
  │       │
  │       ├── compilation.hooks.afterSeal
  │       ├── compiler.hooks.shouldEmit  ← return false 可阻止写盘
  │       ├── compiler.hooks.emit        ← assets 写盘前最后机会
  │       ├── compiler.hooks.afterEmit   ← 写盘完毕
  │       │
  │       └── compiler.hooks.done        ← 构建完成 ✅
  │
  ├── compiler.hooks.watchRun（watch 模式）
  ├── compiler.hooks.watchClose（watch 模式）
  │
  └── compiler.hooks.shutdown
```

---

## 四、怎么选钩子——实战速查表

| 你想做什么 | 用哪个钩子 | 原因 |
|-----------|-----------|------|
| **往产物里加一个文件** | `compilation.hooks.processAssets` + `ADDITIONS` stage | assets 已就绪，直接往里塞 |
| **压缩 JS / CSS** | `compilation.hooks.processAssets` + `OPTIMIZE_SIZE` stage | 在优化阶段改 assets 内容 |
| **生成分析报告** | `compilation.hooks.processAssets` + `REPORT` stage | 最后一步，所有优化已完成 |
| **修改模块内容** | `compilation.hooks.buildModule` | 模块构建时拦截 |
| **监听整个构建完成** | `compiler.hooks.done` | 构建结束，拿 stats |
| **在模块依赖图构建完后做分析** | `compilation.hooks.finishModules` | 所有模块已找齐，依赖图完整 |
| **在构建开始前做准备工作** | `compiler.hooks.beforeRun` 或 `run` | 清理、初始化 |
| **部署产物到 CDN** | `compiler.hooks.afterEmit` | 文件已写盘，可以上传 |
| **阻止产物写盘**（如只做校验不输出） | `compiler.hooks.shouldEmit` return false | SyncBailHook——return 非 undefined 即拦截 |
| **修改 webpack 内部模块创建规则** | `compiler.hooks.normalModuleFactory` | 可以改 loader 匹配、模块解析 |

---

## 五、和 webpack 4 的区别

webpack 5 做了两个关键改进：

1. **`processAssets` 替代了旧钩子**：`optimizeAssets`、`additionalAssets`、`optimizeChunkAssets` 等在 webpack 5 中已被标记为废弃，统一用 `processAssets` + stage 参数
2. **`compilation.hooks` 类型更丰富**：新增 `assetPath`、`chunkAsset` 等更细粒度的钩子

---

## 六、和 Loader 的衔接点

loader 在 **模块构建阶段** 执行，具体位置：

```
compiler.hooks.compilation
  └── compilation.hooks.buildModule
        │
        ├── ① 匹配 rules，确定 loader 链
        ├── ② Pitch 阶段（左→右）
        ├── ③ 读取源文件
        ├── ④ Normal 阶段（右→左）← 你的 loader 函数在这里执行
        │
        └── compilation.hooks.succeedModule
```

loader 处理完的结果作为模块加入 `compilation.modules`，之后进入 seal 阶段。

---

## 七、和 03-plugins.md 的关系

- [03-plugins.md](./03-plugins.md) 讲了 **Plugin 怎么工作**——Tapable、tap/tapAsync、Compiler vs Compilation、如何操作 assets
- 本文讲了 **什么时候工作**——每个阶段发生什么、有哪些钩子、怎么选

两篇配合阅读：先看 03 理解怎么挂，再查本篇找到挂哪。
