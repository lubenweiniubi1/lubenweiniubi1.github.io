# TypeScript 模块：从 import 报错到游刃有余

## 这篇文章解决什么问题？

假设你刚学 TS，写了两个文件：

```
src/
├── index.ts    ← 想在这里用 User
└── user.ts     ← 这里定义了 User 类
```

`user.ts` 里明明有 `User`，但 `index.ts` 里的 `import { User } from "./user"` 就是报红。或者 npm 装了个包，`import` 进去 TS 说"找不到类型声明"。

**这篇文章就解决这类问题**——从最基础的"两个文件怎么互引用"，到"第三方包没类型怎么办"，按你实际会踩坑的顺序展开。最后会提一嘴 namespace（但你大概率用不到）。

---

## 第一层：两个 `.ts` 文件之间怎么 import？

### 1.1 导出的一方 `export`

```typescript
// user.ts — 把想让别人用的东西打上 export
export interface User {
  name: string;
  age: number;
}

export function createUser(name: string, age: number): User {
  return { name, age };
}

// 没写 export 的东西，外面看不到
const INTERNAL_SECRET = "xxx"; // user.ts 内部用的
```

### 1.2 导入的一方 `import`

```typescript
// index.ts — 从 user.ts 拿需要的东西
import { User, createUser } from "./user";

const alice: User = createUser("Alice", 30);
```

**关键规则**：路径以 `./` 或 `../` 开头 = 相对路径，从当前文件所在目录开始找。不带 `./` 的裸名字（如 `"react"`）去 `node_modules` 里找。

### 1.3 写完能跑吗？

如果你用 Webpack/Vite，能。如果你直接用 `node index.js` 跑编译产物，取决于 `tsconfig.json` 里的 `module` 设置（后面会讲）。**但第一步——让 TS 不报红——只需要上面的代码就够了。**

> 到这里，你已经能写两个互引用的 `.ts` 文件了。

---

## 第二层：`import` 为什么会报 "Cannot find module"？

TS 找文件有一套固定流程。假设 `src/index.ts` 里写了 `import { User } from "./user"`：

```
TS 的查找顺序：
src/index.ts 所在目录 = src/
  → 1. src/user.ts        ✅ 找到了，停
  → 2. src/user.tsx       (1 没找到才试)
  → 3. src/user.d.ts
  → 4. src/user/index.ts  (把 user 当文件夹)
  → 5. src/user/index.d.ts
  → 都没找到 → 报红 "Cannot find module './user'"
```

**90% 的 import 报错，查这三个地方就够了：**

| 症状 | 检查 |
|---|---|
| `Cannot find module './User'` | 文件名大小写？路径拼写？扩展名省略了？ |
| `Could not find declaration file for 'xxx'` | 这个包是纯 JS，没有类型 → 看第四层 |
| 编译好了但运行报错 | `moduleResolution` 配错了 → 看第三层 |

---

## 第三层：`module` 和 `moduleResolution` 是什么？

### 3.1 先看一个实验

同一份 `.ts` 源码，改 `tsconfig.json` 的 `module` 值，编译出来的 JS 不一样：

```typescript
// ===== 源码 index.ts =====
import { helper } from "./utils";
export const msg: string = helper("hello");
```

```javascript
// module: "ESNext" → 输出
import { helper } from "./utils";
export const msg = helper("hello");       // import/export 原样保留
```

```javascript
// module: "CommonJS" → 输出
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
exports.msg = utils_1.helper("hello");    // import→require, export→exports
```

**类型（`: string`）确实被擦掉了，但 `import`/`export` 没消失——`tsc` 根据 `module` 决定把它们翻译成什么格式。**

### 3.2 `moduleResolution` — 控制"怎么找到那个文件"

`module` 管的是**编译后 JS 长什么样**。`moduleResolution` 管的是**编译前 TS 怎么找到 `"./utils"` 这个文件**。

用一个实验说明区别。假设目录结构：

```
src/
├── index.ts     ← import { helper } from "./utils"
└── utils.ts     ← 不写扩展名
```

```typescript
// index.ts — 故意不加 .ts 后缀
import { helper } from "./utils"; // TS 能不能找到 utils.ts？
```

不同 `moduleResolution` 下：

```
moduleResolution: "bundler"
  → TS 尝试: ./utils.ts → ./utils.tsx → ./utils/index.ts → 找到了 ✅

moduleResolution: "node16" / "nodenext"
  → TS 尝试: ./utils.ts → ./utils.tsx → ./utils/index.ts → 找到了 ✅
  → 但注意：对于 ESM 文件，node16 要求写 .js 后缀！
  → import { helper } from "./utils.js" ← 必须这样写

moduleResolution: "classic"
  → 旧算法，按目录逐层往上翻，基本没人用了
```

**`moduleResolution` 的核心工作就是那 6 步文件匹配**（第二层讲的）：给定一个路径字符串 `"./utils"`，按优先级试 `.ts` → `.tsx` → `.d.ts` → `/index.ts`，或者去 `node_modules` 爬。不同的策略在这 6 步上有微调（要不要强制写后缀？要不要看 `package.json` 的 `exports` 字段？）。

### 3.3 `module` 和 `moduleResolution` 的关系

这两个选项**独立但需要配对**，否则会翻车：

| `module` | `moduleResolution` 搭配 | 场景 |
|---|---|---|
| `ESNext` | `bundler` | 前端 Webpack/Vite 项目 |
| `NodeNext` | `nodenext` | Node.js ESM 项目 |
| `CommonJS` | `node` | 老 Node.js 项目 |

**经典翻车现场**：`module: "ESNext"` + `moduleResolution: "node"`。`module` 说"输出 ESM"，但 `moduleResolution` 用 Node 老算法找文件——TS 可能找到了，但运行时 Node.js 不认识输出格式，直接炸。

**一句话**：`module` 决定开口说什么话（ESM 还是 CJS），`moduleResolution` 决定耳朵怎么听（怎么找到别人说的话）。前端用 `bundler`，Node 用 `nodenext`。不要混搭。

---

## 第四层：npm 装了包，TS 说不认识

```bash
npm install some-js-lib   # 这个包只有 .js，没有 .d.ts
```

```typescript
import lib from "some-js-lib"; // ❌ Could not find declaration file
```

**三级解决方案，按优先级用：**

### 方案一：社区类型包（90% 的情况）

```bash
npm i -D @types/some-js-lib   # DefinitelyTyped 上大概率有
```

### 方案二：自己写声明（内部包 / 冷门包）

```typescript
// src/types.d.ts — 放在 src 下，TS 自动加载
declare module "some-js-lib" {
  export function doStuff(input: string): number;
  export const version: string;
}
// 之后 import 进去就有类型了
```

### 方案三：保底方案

```typescript
declare module "some-js-lib"; // 不写具体类型，导入全变 any
```

---

## 第五层：路径别名——告别 `../../../`

```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

配置后：

```typescript
// ❌ 之前——深层路径噩梦
import Button from "../../../components/Button";

// ✅ 之后——从 src 根开始的绝对路径
import Button from "@/components/Button";
```

**关键陷阱**：`paths` 只在 TS 编译时生效。运行时（Node.js / 浏览器）不认识 `@/`。你还需要在打包工具里配一份：

```javascript
// vite.config.js
resolve: { alias: { "@": "/src" } }

// webpack.config.js
resolve: { alias: { "@": path.resolve(__dirname, "src") } }
```

**两边都要配，漏一边就一边绿一边红。**

---

## 第六层：`import type`——给打包工具省点事

```typescript
// 普通 import：打包工具不确定你是只要类型还是也要值
import { User } from "./user";      // User 是 interface，运行时不存在

// import type：明确告诉打包工具"这只在编译时用，帮我删掉"
import type { User } from "./user"; // 编译后这行直接消失
```

`import type` 的好处：打包产物更小、避免循环依赖。TS 5.0+ 建议凡是只用于类型标注的东西都用 `import type`。

---

## 第七层：namespace——博物馆展品

```typescript
// 你在旧代码或 .d.ts 里可能看到这个
namespace MyApp {
  export class User { }
}
/// <reference path="myapp.ts" />
// 然后用 MyApp.User
```

**namespace 是什么**：ES6 模块标准（2015 年）出来之前，TS 用来组织代码的方案。把东西放到一个全局对象下面，通过 `/// <reference>` 手动排文件顺序。

**现在还有人用吗**：只在 `.d.ts` 声明文件里偶尔出现，比如扩展第三方全局类型：

```typescript
declare namespace Express {
  interface Request { user?: { id: string } }
}
```

**你的代码里永远不要写 `namespace`**。用 `export`/`import`。

---

## 总结：按场景速查

| 你遇到的情况 | 翻到哪层 |
|---|---|
| 两个 `.ts` 文件怎么互引用 | 第一层 |
| `import` 报红找不到文件 | 第二层 |
| 编译出来的 JS 运行时报模块错误 | 第三层 |
| npm 包没有类型声明 | 第四层 |
| `../../../` 路径太深想简化 | 第五层 |
| 打包产物太大 / 循环依赖 | 第六层 |
| 看到 `namespace` 不知道是什么 | 第七层 |
