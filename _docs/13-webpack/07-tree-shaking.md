# 07 - Tree Shaking

## 概念

### 1. 什么是 Tree Shaking？

Tree Shaking 字面意思是"摇树"——把枯枝烂叶（未使用的代码）摇下来。在 webpack 里，它的作用是**移除打包中未被引用的代码**。

```js
// math.js —— 导出了 4 个函数
export function add(a, b) { return a + b; }
export function sub(a, b) { return a - b; }
export function mul(a, b) { return a * b; }
export function div(a, b) { return a / b; }

// index.js —— 只用了 add
import { add } from './math.js';
console.log(add(1, 2));

// 打包后：sub、mul、div 三个函数不应该出现在产物中
```

### 2. Tree Shaking 的前提条件

Tree Shaking 必须同时满足两个条件：

| 条件 | 为什么 |
|------|--------|
| **使用 ES Module**（`import`/`export`） | ESM 是静态的——导入导出关系在编译时就能确定。CommonJS（`require`）是动态的，运行时才知道导入了什么 |
| **开启 production mode** | 需要 `usedExports`（标记） + `minimize`（删除）配合 |

#### 为什么 ESM 是 Tree Shaking 的基础？

Tree Shaking 的核心问题是：**在不执行代码的前提下，知道哪些导出被使用了、哪些没有**。这要求模块的导入导出关系必须在编译期就能确定——而这正是 ESM 的设计特性。

**ESM 为什么能做到？**

ESM 的 `import` / `export` 是**顶层静态声明**，语法层面强制了以下约束：

```js
// ✅ ESM — import 只能是顶层静态字面量
import { add } from './math.js';        // 编译时就知道导入了 math.js 的 add

// ❌ ESM 不允许这样做——
import something from getPath();         // 语法错误：不能是函数调用
import { someName } from `./${name}`;   // 语法错误：不能是模板字符串
if (condition) { import ... }           // 语法错误：不能在条件里
```

这意味着 webpack 只需要**解析源码文本**（不需要运行），就能 100% 精确地知道：
- 每个文件导出了哪些标识符
- 每个文件导入了哪些标识符
- 每个导入标识符对应哪个文件的哪个导出

有了这张精确的"引用关系图"，`usedExports` 就能标记出那些**导出了但没有箭头指向它的**死分支——就像编译器做死代码消除一样。

**CommonJS 为什么做不到？**

CJS 的 `require()` 是一个**运行时函数调用**，没有语法约束：

```js
// 以下全都是合法的 CJS 代码
const mod = require('./math.js');              // 静态——但这只是特例
const mod = require('./' + dynamicPath);       // 动态路径——运行时才知道
const mod = require(condition ? a : b);        // 条件导入——运行时才知道
const mod = require(compute(whatever));        // 表达式——运行时才知道

// 甚至可以这样——解构也是运行时的
const { something } = require('./lib');        // 运行时解构，不是编译时解析
```

webpack 面对 `require(variable)` 时根本无法判断变量是什么——因为**这段代码还没运行**。它只能保守地把整个模块打包进来，以防运行时真的用到了。这就是 CommonJS 无法可靠 Tree Shake 的根本原因。

**一句话总结**：ESM 把导入导出关系写进了**语法层**，编译器不需要运行代码就能分析；CJS 的导入导出是**执行层**行为，不运行就不知道。Tree Shaking 需要"不运行就知道"，所以 ESM 是前提。

### 3. sideEffects 是什么？

`package.json` 中的 `sideEffects` 字段告诉 webpack："标记为 sideEffects 的文件，即使没有导出被使用，也**不能删除**"。

```json
// 所有文件都无副作用 → 没被引用的导出全可删
{ "sideEffects": false }

// CSS 文件有副作用（插入样式），不能删
{ "sideEffects": ["*.css", "*.scss"] }

// 某个特定文件有全局注册的副作用
{ "sideEffects": ["./src/polyfills.js"] }
```

**什么算"副作用"？** 模块执行时对全局状态产生了影响——修改 `window`、写入 `localStorage`、`console.log`、CSS 注入等。

### 4. Tree Shaking 的完整流程

Tree Shaking 分两步，各自由不同的配置控制：

```
1. 编译阶段：分析 import/export，标记未使用的导出（usedExports: true）
2. 优化阶段：基于标记，删除未使用的代码（minimize: true）
```

`usedExports` 只做标记（注释形式），真正删除靠 Terser/esbuild 等压缩工具。

#### 第一步：`usedExports` — 标记

Webpack 在编译时分析 ESM 的 `import` / `export` 语句，构建模块依赖图。对于每个模块，它能精确知道哪些导出被其他模块引用了、哪些没有。没被引用的导出会被加上 `/* unused harmony export xxx */` 注释。

```js
// 源码 math.js
export function add(a, b) { return a + b; }
export function sub(a, b) { return a - b; }  // 没人 import

// index.js 只 import { add }
import { add } from './math.js';

// 打包产物中（只开 usedExports，不开 minimize）
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   add: function() { return /* binding */ add; }
/* harmony export */ });
/* unused harmony export sub */   // ← Webpack 打上的标记

// sub 的函数体还在，但已经被"贴了标签"
var sub = function sub(a, b) { return a - b; };
```

**关键点**：`usedExports` 只是打标记，**不删除任何代码**。如果你只开 `usedExports` 不开 `minimize`，死代码仍然留在产物里。

#### 第二步：`minimize` — 删除

Terser（webpack 默认压缩工具）读取上一步的标记，把标记为 `unused` 的代码**物理删除**。Terser 自己的 `unused` 选项（默认开启）还会做**级联删除**：

```js
// 接上例——Terser 的处理过程：
// 1. sub 被标记为 unused → 删除 sub 函数体
// 2. 删除 sub 后，如果 sub 内部引用了某个其他模块的函数 foo
//    且 foo 没有其他地方使用 → foo 也变成 unused → 也删除
// 3. 一直级联，直到没有新的死代码产生
```

这就是为什么 **`usedExports` + `minimize` 必须同时开启**才能完整 Tree Shake：

| 配置组合 | 效果 |
|----------|------|
| `usedExports: false` + `minimize: false` | 什么都不做，所有代码保留 |
| `usedExports: true` + `minimize: false` | 标记了 `/* unused harmony export */`，但代码全在 |
| `usedExports: false` + `minimize: true` | Terser 自己也能识别部分死代码，但不如有标记精准 |
| `usedExports: true` + `minimize: true` | ✅ 完整 Tree Shaking——标记精准 + 删除彻底 |

> **实际工程中**：`mode: "production"` 默认同时开启两者，一般不需要手动配置。只有在 development 下调试 Tree Shaking 时才需要显式控制这两项。

---

## 练习（由浅入深）

### Lv.1 验证 Tree Shaking 是否生效

创建 `src/math.js`，导出 4 个函数。在 `src/index.js` 中只 `import { add }`。

运行 `npm run build`，在 `dist/bundle.js` 中搜索 `subtract`、`multiply`、`divide`——它们不应该出现。

### Lv.2 对比 production vs development

分别运行 `npm run build` 和 `npm run build:dev`，对比产物：
- **production**：未使用的函数被删除
- **development**：所有代码都在

### Lv.3 理解 sideEffects

在 `package.json` 设 `"sideEffects": false`。然后在 JS 中 `import './style.css'`。

**没有 sideEffects 声明 CSS** → CSS 可能被 Tree Shaking 误删（因为 CSS 没有被 JS 变量引用，webpack 以为它是死代码）。

加上 `"sideEffects": ["*.css"]` → CSS 安全保留。

### Lv.4 副作用的代价

在 `src/math.js` 中添加一行：
```js
window.MATH_LOADED = true;
```

即使你没有 import 任何 math.js 的函数，这行代码也会保留。因为 webpack 看到全局副作用，不敢删除。比较有/无副作用时产物体积的差异。

### Lv.5 分步观察：标记 vs 删除

做三组对比实验，理解 `usedExports` 和 `minimize` 各自的作用：

**实验 A — 两者都关**
```js
optimization: {
  usedExports: false,
  minimize: false,
}
```
产物中没有任何标记，所有代码原样保留。

**实验 B — 只开 usedExports（标记）**
```js
optimization: {
  usedExports: true,
  minimize: false,
}
```
产物中搜索 `/* unused harmony export`——webpack 给未使用的导出打上了标记注释，但**函数体还在**。这就是"只标记不删除"。

**实验 C — 两者都开（完整 Tree Shaking）**
```js
optimization: {
  usedExports: true,
  minimize: true,
}
```
产物中搜索之前未被引用的函数名——**整个函数体消失了**。对比实验 B 的产物大小，明显变小。

> **提示**：观察实验 B 的产物时，注意 Terser 的级联删除不会发生。例如 `sayHi` 被标记 unused，但 `sayHi` 内部引用的 `greet` 仍然保留（因为 `greet` 还被其他模块使用）。只有开启 `minimize` 后，Terser 才会在删除 `sayHi` 后检查：`greet` 还有别人用吗？没有则一并删除。

---

## 预期效果

- 理解 Tree Shaking 依赖 ESM 的静态结构
- 知道 `sideEffects` 的作用和配置方式
- 能判断哪些代码会被摇掉、哪些不会

---

## 面试题

> 📝 待整理，先留位

- [ ] Tree Shaking 的原理是什么？为什么 CommonJS 不能 Tree Shake？
- [ ] `sideEffects` 的作用？什么文件应该标记为有副作用？
- [ ] `usedExports` 和 `minimize` 在 Tree Shaking 中分别起什么作用？
- [ ] 如何验证 Tree Shaking 是否真的生效了？
- [ ] CSS 文件和 polyfill 文件的 sideEffects 应该怎么处理？
