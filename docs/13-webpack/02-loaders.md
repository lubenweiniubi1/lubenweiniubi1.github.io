# 02 - Loader

## 概念

### 1. 为什么需要 Loader？

webpack 天生只认识 JavaScript 和 JSON 文件。当你 import 一个 CSS、一张图片、一个 TypeScript 文件时，webpack 不知道该怎么处理。

Loader 就是 webpack 的**翻译官**——把非 JS 文件转换成 webpack 能理解的模块（通常是字符串或 JS 对象），让它们也能加入依赖图。

### 2. Loader 的链式调用

一个文件可以被多个 loader 处理，它们组成一个**管道**，从右往左（从下往上）依次执行：

```js
use: ['style-loader', 'css-loader', 'sass-loader']
//      ↑ 最后执行      ↑            ↑ 最先执行
```

这样设计的原因是：每个 loader 只做一件事，通过组合产生效果——sass-loader 把 SCSS 编译成 CSS → css-loader 把 CSS 转成 JS 模块 → style-loader 把这个模块注入 `<style>` 标签。

### 3. 常用 Loader 一览

| Loader | 做什么 |
|--------|--------|
| `css-loader` | 解析 CSS 中的 `@import` 和 `url()` |
| `style-loader` | 把 CSS 注入 DOM（`<style>` 标签） |
| `babel-loader` | ES6+ → ES5 语法转换 |
| `sass-loader` | SCSS/Sass → CSS |
| `ts-loader` | TypeScript → JavaScript |
| `file-loader` | 文件 → 输出目录 + 返回 URL（webpack 4） |
| `url-loader` | 小文件 → base64 内联（webpack 4） |

> webpack 5 用 **Asset Modules** 替代了 file-loader 和 url-loader。

### 4. Loader 的本质

Loader 就是一个**接收源码、返回转换后源码的函数**：

```js
module.exports = function(source) {
  return source.replace(/foo/g, 'bar');
};
```

#### 4.1 Loader 必须返回 JS 吗？

**最终产物必须是 JS**——因为 webpack 打包的是 JS 模块图。但 loader 链中的每一环不一定要返回 JS：

```
.sass 文件  ──→ sass-loader（→ CSS 字符串）──→ css-loader（→ JS 模块）──→ style-loader（→ JS 注入代码）
                ↑ 返回的是 CSS 文本           ↑ 返回 JS module.exports       ↑ 返回 JS
                不是 JS                       最终是 JS ✅                   最终是 JS ✅
```

- **链中间的 loader**：返回什么格式都行，只要**下一个 loader 能处理**。sass-loader 返回 CSS 字符串 → css-loader 接收 CSS 字符串，转为 JS 模块。
- **链末尾的 loader（最左边）**：必须返回 webpack 能理解的 JS 代码。最终 webpack 会把所有模块注入到产物中执行。

所以 loader 返回值的约束是：**让下一个 loader（或 webpack）看得懂**。中间 loader 是私有的管道格式，链条最后一个 loader 必须是 JS。

### 5. Loader 工作原理

#### 5.1 从一个最简单的 loader 开始

loader 就是一个函数：**吃进源文件内容，吐出转换后的内容**。

```js
// 把源码中所有的 "foo" 替换成 "bar"
module.exports = function(source) {
  return source.replace(/foo/g, 'bar');
};
```

这就是 loader 的全部本质。`source` 是文件内容的字符串，`return` 的值会交给下一个 loader（或 webpack）。

#### 5.2 多个 loader 怎么配合？

webpack 里一个文件经常配置多个 loader，比如处理 `.scss` 文件的三件套：

```js
use: ['style-loader', 'css-loader', 'sass-loader']
```

它们不是同时跑的，而是**一个做完交给下一个**，像流水线：

```
源文件（SCSS）
  → sass-loader  把它编译成 CSS 文本
  → css-loader   把 CSS 文本转成 JS 模块
  → style-loader 拿到 JS 模块，生成一段"把 CSS 插到 DOM"的代码
  → 最终 JS 产物
```

**顺序为什么是从右往左？** 因为上面这条流水线用函数嵌套来写就是：

```js
styleLoader(cssLoader(sassLoader(源文件内容)))
//          ←────── 数据流向 ──────←
```

`sass-loader` 先处理，结果传给 `css-loader`，结果再传给 `style-loader`。这就是"从右往左"的直觉——数据从右往左流动。

> **一句话**：每个 loader 只做一件事，链起来就什么都能处理。就像 Unix 管道 `cat file | grep foo | sort`。

#### 5.3 Normal 阶段和 Pitch 阶段

上面讲的"一个做完交给下一个"，叫 **Normal 阶段**。但 loader 还有一个不太直观的阶段叫 **Pitch 阶段**。

先从类比理解：**你去餐厅点菜**。

| | Normal 阶段 | Pitch 阶段 |
|---|---|---|
| **类比** | 菜做好了 → 传菜员端给你 | 你还没看到菜 → 服务员先问你"有什么忌口？" |
| **方向** | 从右往左（数据回流） | 从左往右（请求传递） |
| **文件读了吗？** | 读了 | **还没读** |
| **能做什么？** | 改写文件内容 | 提前拦截，决定"要不要做后面的步骤" |

实际的执行顺序是这样的：

```
① Pitch 阶段（左→右，传递请求）
   loader-1.pitch ──→ loader-2.pitch ──→ loader-3.pitch
                                              │
② 读取源文件（fs.readFile）                    │
                                              ↓
③ Normal 阶段（右→左，处理数据）       源文件内容
   loader-1(source) ←── loader-2(result) ←── loader-3(source)
```

**Pitch 的杀手级能力：提前返回，跳过后续步骤。**

如果某个 loader 的 pitch 方法 `return` 了一个值（而不只是 `undefined`），就相当于说："这事我来搞定，后面的不用管了"：

```
假设链是: loader-1 → loader-2 → loader-3 → 源文件

loader-2.pitch() return "替代内容"
        │
        ├── 右边全部跳过：loader-3.pitch()、读文件、loader-3.normal()、loader-2.normal()
        │                                   （自己的 normal 也跳过了！）
        │
        └── "替代内容" 直接传给 → loader-1.normal("替代内容")
                                 loader-1 不关心输入从哪来的，照常处理
```

关键点：**pitch 返回后，不读文件、不跑右边的 normal，立刻跳到左边，把 pitch 的返回值当作左边 loader 的 normal 阶段输入。**

```js
module.exports = function(source) {
  return source; // ← Normal 阶段。如果自己 pitch 返回了值，这个不会被调用
};

module.exports.pitch = function(remainingRequest) {
  // 如果不 return → 一切照常
  // 如果 return "xxx" → 右边的 loader 全部跳过，左边 loader 的 normal 收到 "xxx"
  return '// 这段内容会直接成为左边 loader.normal() 的输入';
};
```

**remainingRequest 是什么？** 拿你项目里的 CSS 配置来举例：

```js
// webpack.config.js
use: ['style-loader', 'css-loader']   // 处理 src/style.css
```

两个 loader 的 pitch 各自收到的 `remainingRequest`：

```
style-loader.pitch(remainingRequest)
  → remainingRequest = "css-loader!src/style.css"
  → 含义："我右边还有 css-loader，然后才是源文件"

css-loader.pitch(remainingRequest)
  → remainingRequest = "src/style.css"
  → 含义："我右边只剩源文件了，没有其他 loader"
```

`remainingRequest` 就是一个字符串：**用 `!` 把"右边的 loader + 源文件路径"串起来**。`!` 读作"然后"——`css-loader!src/style.css` 就是"用 css-loader 处理，然后拿到 src/style.css 的内容"。

你的 `markdown-loader` 同理——链上只有它一个 loader，右边没人，所以打印出来就是纯文件路径：

```js
// use: './src/markdown-loader.js'  → 只有它一个，没有其他 loader 在右边
// markdown-loader.pitch(remainingRequest)
//   → remainingRequest = "d:/workspace/webpack-playground/src/xxx.md"
//   → 纯路径，因为右边什么都没有
```

#### 5.4 Pitch 的实际用途（三个直白例子）

了解了 pitch 的机制，你会想：什么时候真需要用到它？

**例子一：缓存 Loader（最直观的 pitch 场景）**

你有一个转换很慢的 loader（比如压缩图片、编译 TS），想在第二次打包时跳过。Normal 阶段做不到——因为只有文件读完了、前面 loader 都跑完了，数据才到你手上，那时候一切已经晚了。

Pitch 可以在文件被读之前就拦截：

```js
// cache-loader 的 pitch（简化版）
const crypto = require('crypto');
const cache = new Map();

function cacheKey(source, remainingRequest) {
  // 文件名 + loader 链 + 内容 hash → 内容变了 key 就变
  const hash = crypto.createHash('md5').update(source).digest('hex');
  return remainingRequest + '::' + hash;
}

module.exports.pitch = function(remainingRequest) {
  const source = fs.readFileSync(this.resourcePath, 'utf-8'); // pitch 阶段也能读文件
  //                                ↑ 但读了文件 ≠ 右边 loader 跑了
  const key = cacheKey(source, remainingRequest);

  if (cache.has(key)) {
    return cache.get(key); // 👈 命中 → 跳过右边所有 loader
  }
  // 没命中 → 什么都不 return，继续正常流程
};

module.exports = function(source) {
  // Normal 阶段：拼 key，跑转换，存缓存
  const key = cacheKey(source, this.remainingRequest);
  const result = expensiveTransform(source);
  cache.set(key, result);
  return result;
};
```

```
pitch 阶段：读文件内容（轻量）→ 拼 key → 查缓存 → 命中就跳过
  → 虽然读了文件，但跳过了右边所有 loader 的处理，省的是转换的开销
```

> 实际社区中 [cache-loader](https://www.npmjs.com/package/cache-loader) 就是这么工作的——pitch 查缓存，normal 写缓存。

**例子二：环境检测，跳过整条链**

你的 webpack 配置里 ESLint 校验只在 CI 跑，本地开发不需要。在 Normal 阶段做？文件已经读了、loader 链已经开始跑了。Pitch 阶段一句话挡住：

```js
module.exports.pitch = function() {
  // 本地开发 → 直接返回空，跳过所有后续 loader
  if (process.env.SKIP_CHECK === 'true') {
    return 'module.exports = {};';
  }
  // CI 环境 → 什么都不 return，正常执行校验链
};
```

```
本地开发: pitch return "module.exports = {}" → 跳过整条链，不读文件
CI 环境:  pitch 不 return → 正常执行
```

**例子三：注入文件路径到源码**

你的 loader 需要在每个文件开头注入一行 `// file: src/components/Button.tsx`，但 `this.resourcePath` 在 Normal 阶段才能拿到——其实 Pitch 阶段也能拿到，而且可以在读文件前就组装好开头：

```js
module.exports.pitch = function() {
  // this.resourcePath 在 pitch 里一样可用
  const header = `// file: ${this.resourcePath}\n`;

  // 现在不 return——如果 return 会跳过读文件
  // 而是把 header 存到 this 上，让 normal 阶段用
  this._header = header;
};

module.exports = function(source) {
  // Normal 阶段拿到源文件，拼接 pitch 存好的 header
  return this._header + source;
};
```

```
pitch: 算出 header，挂到 this._header 上（还没读文件）
读文件: 拿到 source
normal: this._header + source → 合并输出
```

这样各个 loader 的 pitch 可以各自准备数据，Normal 阶段直接组装，互不干扰。

**总结：什么时候需要 pitch？**

| 需求 | 用 pitch 还是 normal |
|------|---------------------|
| 改写文件内容 | normal |
| **在文件被读之前就拦截**（缓存、权限检查、环境跳过） | pitch |
| **多个 loader 之间共享预处理数据** | pitch 存 `this.xxx`，normal 取 |

#### 5.5 什么时候需要写 pitch？

对你来说，**绝大多数情况下不需要写 pitch**。但了解它能做什么有助于理解 webpack 生态：

| 场景 | 说明 |
|------|------|
| **拦截请求** | 在文件被读之前做判断——比如"这个文件我缓存过了，跳过处理直接返回上次结果" |
| **改变执行顺序** | 某些情况下想让某个 loader 的结果"跳级"交给更左边的 loader |
| **挂共享数据** | pitch 里算一次，挂到 `this` 上，Normal 阶段直接取，避免重复计算 |

Lv.6 那个 `md-to-html-loader` 不需要 pitch——它只是做简单的内容转换，用 Normal 阶段就够了。

#### 5.6 Loader 里的 `this` 是什么？

loader 函数里的 `this` 不是你导出的模块对象，而是 **webpack 给每个 loader 注入的上下文对象**。你可以把它理解成 webpack 递给你的"工具箱"——通过它能拿到当前文件的信息、loader 的配置、以及一些工具方法。

先看一个 loader 里 `this` 长什么样：

```js
// loaders/debug-loader.js —— 打印 this 看看里面有什么
module.exports = function(source) {
  console.log('当前文件路径:', this.resourcePath);
  // → "d:/workspace/webpack-playground/src/index.js"

  console.log('loader 配置:', this.getOptions());
  // → { presets: ['@babel/preset-env'] }

  console.log('webpack 版本:', this.version);
  // → 5

  return source;
};
```

常用属性 / 方法一览：

| `this.xxx` | 类型 | 干什么的 |
|------------|------|---------|
| `this.resourcePath` | 属性 | **当前处理的文件**的绝对路径（最常用） |
| `this.getOptions()` | 方法 | 获取 webpack.config.js 里传给这个 loader 的 options（webpack 5 标准方式） |
| `this.callback(err, result)` | 方法 | 代替 `return`——当你需要同时返回多个值（如 sourceMap）时用 |
| `this.async()` | 方法 | 声明"我是异步 loader"，返回一个 callback。调了它就不能 `return` |
| `this.emitFile(name, content)` | 方法 | 额外输出一个文件到 dist（如 file-loader 内部就用它输出图片） |
| `this.mode` | 属性 | webpack 当前的 mode：`'development'` / `'production'` / `'none'` |
| `this.loaders` | 属性 | 当前 loader 链上的所有 loader 信息 |
| `this.context` | 属性 | webpack 配置的根目录（通常是项目根目录） |
| `this.request` | 属性 | loader 链 + 文件路径的完整请求字符串 |

**为什么是 `this` 而不是函数参数？**

因为 loader 就是一个普通函数，webpack 用 `.call()` 来调用它，把上下文绑到 `this` 上。等价于：

```js
// webpack 内部大概是这样调 loader 的：
const loaderContext = { resourcePath: '...', getOptions() {...}, ... };
const result = loaderModule.call(loaderContext, source);
//                               ↑ 把 loaderContext 当 this 绑进去
```

**最重要的三个，写 loader 必用到：**

```js
module.exports = function(source) {
  // ① 知道在处理哪个文件
  if (this.resourcePath.includes('vendor')) {
    return source; // vendor 下的文件跳过处理
  }

  // ② 拿到用户在 webpack.config.js 里配的 options
  const options = this.getOptions();
  // { enableXxx: true, threshold: 100 }

  // ③ 异步场景：声明异步，拿 callback
  const callback = this.async();
  fetchData().then(extra => {
    callback(null, source + extra);
  });
};
```

#### 5.7 Loader 是怎么被找到的？

写 loader 时有三种方式告诉 webpack "这个 loader 在哪"：

```js
// webpack.config.js
module.exports = {
  resolveLoader: {
    // 扩展查找目录：除了 node_modules，也到 loaders/ 下找
    modules: ['node_modules', 'loaders'],
  },
  module: {
    rules: [
      {
        test: /\.md$/,
        // ① 直接写名字 → 从 resolveLoader.modules 里找
        use: ['md-to-html-loader'],

        // ② 写路径 → 直接用这个文件（不需要 resolveLoader 配置）
        // use: [path.resolve(__dirname, 'loaders/md-to-html-loader.js')],
      },
    ],
  },
};
```

#### 5.8 同步 vs 异步 Loader

大部分 loader 直接 `return` 就行。如果你需要做异步操作（比如调 API、读数据库）：

```js
module.exports = function(source) {
  const callback = this.async(); // 告诉 webpack："别急，我还没好"

  fetchSomething().then(data => {
    const result = source + data;
    callback(null, result); // 第一个参数是错误，第二个是结果
  });
};
```

调了 `this.async()` 之后就不能再 `return` 了——用 `callback` 代替。

#### 5.9 一次完整的请求，发生了什么？

```
webpack 发现 import './style.scss'
        │
        ├─① 匹配 rules ─→ 得到 loader 链：style-loader → css-loader → sass-loader
        │
        ├─② Pitch 阶段（左→右）：依次调用每个 loader 的 .pitch()
        │     如果某个 pitch return 了值 → 跳转到④，右边全部跳过
        │
        ├─③ 读取源文件（如果②没有熔断）
        │
        ├─④ Normal 阶段（右→左）：倒序执行每个 loader(source)
        │     sass-loader: SCSS → CSS
        │     css-loader:  CSS → JS module
        │     style-loader: JS → 注入 DOM 的代码
        │
        └─⑤ 最终产物作为 JS 模块进入 webpack 依赖图
```

---

## 练习（由浅入深）

### Lv.1 感受已配置的 CSS Loader

项目已配好 `style-loader` + `css-loader`。在 `src/style.css` 中随便写点样式，在 `src/index.js` 中 `import './style.css'`，运行 `npm run dev` 确认样式生效。

打开 DevTools Elements 面板，找到 webpack 注入的 `<style>` 标签——这就是 style-loader 的工作成果。

### Lv.2 加 Babel

```bash
npm install -D babel-loader @babel/core @babel/preset-env
```

```js
{
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: { presets: ['@babel/preset-env'] },
  },
}
```

在代码里用 `const`、箭头函数、`?.`、`??` 等语法，运行 `npm run build`，检查 `dist/bundle.js` 是否被转成了 ES5。

> **⚠️ 注意**：如果 browserslist 默认值为 `defaults`（现代浏览器），`@babel/preset-env` 不会转译箭头函数和 `const`——这些浏览器已经原生支持了。要看到 ES5 转译效果，先在 `package.json` 中配置 `"browserslist": ["> 0.25%", "not dead"]` 或直接写 `targets: "ie 11"`。详见 [11-跨浏览器兼容.md](./11-跨浏览器兼容.md#L81-L87)。

### Lv.3 加 Sass

```bash
npm install -D sass-loader sass
```

```js
{
  test: /\.s[ac]ss$/i,
  use: ['style-loader', 'css-loader', 'sass-loader'],
}
```

创建 `src/theme.scss`，用 SCSS 的变量和嵌套：
```scss
$primary: #667eea;

body {
  .button { background: $primary; }
}
```

在 `index.js` 中 `import './theme.scss'`，验证效果。

### Lv.4 Asset Modules

webpack 5 内置四种资源模块类型：

| type | 行为 |
|------|------|
| `asset/resource` | 发射文件到输出目录，导出 URL |
| `asset/inline` | 转成 base64 data URI |
| `asset` | 自动选择：小于 8KB → inline，否则 → resource |
| `asset/source` | 导出源码字符串 |

```js
{
  test: /\.(png|jpe?g|gif|svg)$/i,
  type: 'asset',
  parser: { dataUrlCondition: { maxSize: 4 * 1024 } },  // 4KB 阈值
}
```

在 JS 中 import 一张图片，分别用 `<4KB` 和 `>4KB` 图片测试，观察 Network 面板——小图应该变成 base64 内联、大图作为独立请求。

### Lv.5 理解 Loader 执行顺序

为同一个 `.css` 文件写三条规则，分别输出日志，验证执行顺序是否确实是"从右往左/从下往上"。

### Lv.6 编写自定义 Loader

#### 背景

你想在 JS 里 `import` 一个 `.md` 文件，在页面上渲染成 HTML。`marked` 负责 Markdown → HTML 的转换本身，你自己的 loader 负责把它集成到 webpack 里——接收 `.md` 文件内容、调用 `marked` 转换、输出 JS 模块。

#### Step 1：创建 loader 文件

```bash
mkdir loaders
```

```js
// loaders/md-to-html-loader.js
const { marked } = require('marked');  // npm install marked

module.exports = function(source) {
  // source 就是 .md 文件的原始内容
  const html = marked.parse(source);

  // 导出为 JS 字符串模块，方便在代码中 import
  return `module.exports = ${JSON.stringify(html)};`;
};
```

#### Step 2：配置 webpack 找到本地 loader

```js
// webpack.config.js
const path = require('path');

module.exports = {
  // ...
  resolveLoader: {
    modules: ['node_modules', path.resolve(__dirname, 'loaders')],
  },
  module: {
    rules: [
      {
        test: /\.md$/,
        use: ['md-to-html-loader'],  // 自动从 loaders/ 目录解析
      },
    ],
  },
};
```

#### Step 3：在代码中使用

```js
// src/index.js
import readmeHTML from '../README.md';
document.body.innerHTML = readmeHTML;
```

#### Step 4：进阶——用 `this.getOptions()` 传参

```js
// loaders/md-to-html-loader.js（增强版）
const { marked } = require('marked');

module.exports = function(source) {
  const options = this.getOptions();  // webpack 5 标准方式获取 options

  // 允许在 webpack.config.js 中配置 marked 选项
  const html = marked.parse(source, options);

  return `module.exports = ${JSON.stringify(html)};`;
};
```

```js
// webpack.config.js 中传参
{
  test: /\.md$/,
  use: {
    loader: 'md-to-html-loader',
    options: { breaks: true, gfm: true },
  },
},
```

#### Step 5：验证

```bash
npm install -D marked
npm run build
```

在 `dist/` 中搜索 Markdown 转换后的 HTML 字符串，确认 loader 已生效。

#### 拓展练习

| 想法 | 思路 |
|------|------|
| **i18n loader** | 读取 JSON 翻译文件，替换源码中的 `t('key')` 调用 |
| **env-replace loader** | 构建时将 `__API_URL__` 等占位符替换为环境变量 |
| **debug-remover loader** | 生产构建时自动移除 `console.log`、`debugger` |

---

## 预期效果

- 理解 loader 是"把非 JS 转成 JS 模块"的翻译官
- 掌握链式调用的执行顺序和 Pitch/Normal 双阶段模型
- 能独立配置 babel、sass、asset 等常见 loader
- 能从零编写一个自定义 loader 并在项目中配置使用

---

## 面试题

> 📝 待整理，先留位

- [ ] loader 和 plugin 的本质区别？
- [ ] css-loader 和 style-loader 各自做了什么？
- [ ] webpack 5 的 Asset Modules 相比 file-loader/url-loader 有什么优势？
- [ ] loader 的执行顺序为什么是从右往左？
