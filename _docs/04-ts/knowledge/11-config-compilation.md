# TypeScript 配置与编译

## 一、tsconfig.json 基础结构

### 1.1 什么是 tsconfig.json？

`tsconfig.json` 是 TypeScript 项目的配置文件，你第一次用 `tsc` 命令编译 TS 文件，每次都要手动敲 `--strict --outDir dist`。`tsconfig.json` 让你把这些选项写进一个文件，之后只需要跑 `tsc`。它位于项目根目录，定义了编译选项、包含/排除的文件列表、以及项目间的引用关系。

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

### 1.2 顶层配置项

| 配置项 | 说明 | 是否必需 |
|--------|------|---------|
| `compilerOptions` | 编译器行为配置 | 是（核心） |
| `include` | 包含的文件路径模式 | 推荐设置 |
| `exclude` | 排除的文件路径模式 | 可选 |
| `extends` | 继承其他配置文件 | 可选 |
| `references` | 项目引用配置 | 可选 |
| `files` | 显式指定的文件列表 | 不推荐（维护困难） |

### 1.3 include 与 exclude 的匹配规则

```json
{
  "include": ["src/**/*", "tests/**/*"],
  "exclude": [
    "node_modules", 
    "dist", 
    "**/*.spec.ts",
    "**/__mocks__/**"
  ]
}
```

- `include` 中的模式匹配的文件会被编译
- `exclude` 从 `include` 的结果中排除匹配的文件
- 如果 `include` 没有指定，默认包含所有文件（除了 `exclude` 匹配的）
- `node_modules` 即使不写在 `exclude` 中也默认被排除

### 1.4 多环境配置与 extends

```json
// tsconfig.base.json — 公共基础配置
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}

// tsconfig.json — 开发环境
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "sourceMap": true,
    "declaration": true
  },
  "include": ["src"]
}

// tsconfig.prod.json — 生产环境
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "sourceMap": false,
    "declaration": false
  },
  "include": ["src"]
}
```

使用 `extends` 时，子配置中的选项会**覆盖**基础配置中的同名选项。对象类型的选项（如 `paths`、`types`）会被深度合并。

> **面试要点**：tsconfig 的 `extends` 支持从 npm 包继承，如 `"extends": "@tsconfig/node20/tsconfig.json"`。这是一个常见的推荐 Node.js 配置方案，可以避免自己手写大量基础配置。

## 二、compilerOptions 分类详解

### 2.1 严格性相关（Strictness）

这一组选项决定了 TypeScript 类型检查的严格程度，是提升代码质量的关键。

```json
{
  "compilerOptions": {
    "strict": true,
    // 当 strict: true 时，以下所有选项都自动为 true
    // 也可以单独覆盖：
    // "strictNullChecks": true,
    // "strictFunctionTypes": true,
    // "strictBindCallApply": true,
    // "strictPropertyInitialization": true,
    // "noImplicitAny": true,
    // "noImplicitThis": true,
    // "alwaysStrict": true
  }
}
```

#### 各选项详解

**`strictNullChecks`** — 严格空值检查
```typescript
// strictNullChecks: false
const name: string = null; // ✅ 允许（不推荐）

// strictNullChecks: true
const name: string = null; // ❌ Type 'null' is not assignable to type 'string'
```

**`strictFunctionTypes`** — 函数类型参数逆变检查
```typescript
// strictFunctionTypes: false（允许不安全的函数赋值）
type AnimalHandler = (animal: Animal) => void;
type DogHandler = (dog: Dog) => void;

let handler: AnimalHandler = (dog: Dog) => {}; // ✅ 允许，但可能不安全

// strictFunctionTypes: true
// 函数参数是逆变（contravariant）的，更安全
// 简单理解：如果函数 A 能接受 Animal，那它也应该能接受 Dog（因为 Dog 是 Animal）。
// 反过来不行——一个只接受 Dog 的函数，不能替换成接受 Animal 的函数。
// 开了这个选项，TypeScript 就会帮你检查这类错误。
```

**`strictPropertyInitialization`** — 属性初始化检查
```typescript
class User {
  name: string;        // ❌ strictPropertyInitialization: true 时报错
  age!: number;        // ✅ 使用 ! 断言（non-null assertion）绕过
  email: string = '';  // ✅ 显式初始化
  title?: string;      // ✅ 可选属性不需要初始化
}
```

**`noUncheckedIndexedAccess`** — 索引访问的安全检查
```typescript
interface StringMap {
  [key: string]: string;
}

// noUncheckedIndexedAccess: false
const map: StringMap = {};
const value = map['key']; // 类型为 string

// noUncheckedIndexedAccess: true
const value = map['key']; // 类型为 string | undefined
// 这更安全，因为访问不存在的键会返回 undefined
```

**`useUnknownInCatchVariables`** — catch 变量类型
```typescript
// useUnknownInCatchVariables: false
try { /* ... */ } catch (e) {
  console.log(e.message); // ✅ e 是 any
}

// useUnknownInCatchVariables: true
try { /* ... */ } catch (e) {
  if (e instanceof Error) {
    console.log(e.message); // ✅ 需要先收窄类型
  }
}
```

> **面试要点**：面试中常问"`strict: true` 包含哪些选项？"至少需要能说出 `strictNullChecks`、`strictFunctionTypes`、`noImplicitAny` 这几个核心选项。`useUnknownInCatchVariables` 是 TypeScript 4.4 引入的，是相对较新的严格选项。

### 2.2 模块解析相关（Module）

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@utils/*": ["src/utils/*"]
    },
    "rootDir": "./src",
    "rootDirs": ["src", "generated"],
    "types": ["node", "jest"],
    "typeRoots": ["./node_modules/@types", "./src/types"]
  }
}
```

**`module`** — 生成哪种模块格式
- `ESNext` / `ES2020` — 使用 ESM import/export（推荐前端项目）
- `CommonJS` — 使用 require/module.exports（Node.js 传统项目）
- `NodeNext` — 根据 package.json 的 type 字段决定（推荐 Node.js 新项目）
- `UMD` / `AMD` — 兼容旧模块系统

**`module` 不是控制类型——是控制"编译后 JS 里的 import/export 长什么样"**。类型会擦除，但模块语法不会消失，它会被**转换**：

```typescript
// ===== 源码：index.ts =====
import { helper } from "./utils";
export const result: string = helper();

// ===== module: "ESNext" → index.js =====
import { helper } from "./utils";
export const result = helper();           // 类型擦除，import/export 保留

// ===== module: "CommonJS" → index.js =====
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
exports.result = (0, utils_1.helper)();   // 类型擦除，import→require, export→exports.xxx
```

可以看到：`: string` 确实被干掉了，但 `import`/`export` 的**形式**取决于 `module` 的值。这就是为什么：
- 前端项目（Webpack/Vite 打包）用 `"ESNext"`——打包工具自己处理 ESM
- Node.js 项目用 `"CommonJS"`——Node 原生认识 `require`
- 库作者用合适的值——消费方可能是 CJS 也可能是 ESM

**`moduleResolution`** — 模块查找策略
- `node` — Node.js 经典解析（require.resolve）
- `node16` / `nodenext` — 支持 ESM 和 CJS 的混合解析
- `bundler` — 模拟打包工具的解析（webpack、esbuild），比 node 更宽松
- `classic` — 旧的 TypeScript 解析方式（不推荐）

**`paths` 和 `baseUrl`** — 路径别名
```json
{
  "baseUrl": ".",
  "paths": {
    "@/*": ["src/*"]
  }
}
```
```typescript
// 使用路径别名
import { UserService } from '@/services/user';
// 而不是
import { UserService } from '../../services/user';
```

> **关键**：`paths` 只在 `baseUrl` 存在时才生效。且 `paths` 只是类型层面的映射，运行时需要通过 webpack 的 `resolve.alias` 或 Node.js 的 `tsconfig-paths` 配合。

**`types` 与 `typeRoots`**
```json
{
  "compilerOptions": {
    "types": ["node", "jest"] // 只加载 @types/node 和 @types/jest
  }
}
```
- `typeRoots`：指定查找 `@types/` 包的目录
- `types`：白名单，只加载指定的 `@types/*` 包
- 如果 `types` 未指定，所有 `@types/*` 包都会自动加载

### 2.3 输出相关（Output）

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "outDir": "./dist",
    "outFile": "./dist/bundle.js",   // 仅支持 AMD/SystemJS
    "declaration": true,
    "declarationMap": true,
    "declarationDir": "./dist/types",
    "sourceMap": true,
    "sourceRoot": "../src",
    "emitDeclarationOnly": true,
    "noEmit": true,
    "noEmitOnError": true
  }
}
```

**`target`** — 编译输出到哪个 ES 版本
```typescript
// target: "ES5" 时
const arrow = () => {};    // 编译为 function () {}
const { a, b } = obj;     // 编译为临时变量
async function foo() {}    // 编译为 generator + co

// target: "ES2020" 时
const arrow = () => {};    // 保留箭头函数
const { a, b } = obj;     // 保留解构
async function foo() {}    // 保留 async/await
```

**`declaration` 与 `declarationMap`**
- `declaration: true`：生成 `.d.ts` 文件
- `declarationMap: true`：生成 `.d.ts.map` 源映射文件，IDE 可以从 `.d.ts` 跳转到原始 `.ts` 源码
- `emitDeclarationOnly: true`：只生成声明文件，不生成 JS 文件

**`noEmit` 的两种用途**
```json
// 1. 仅用于类型检查（不输出文件）
{ "noEmit": true }

// 2. 与其他工具配合（Babel/ESBuild 负责转译）
// tsc 只负责类型检查，转译交给 babel
```

### 2.4 JS 支持相关

```json
{
  "compilerOptions": {
    "allowJs": true,           // 允许编译 JS 文件
    "checkJs": true,           // 对 JS 文件做类型检查
    "maxNodeModuleJsDepth": 2  // JS 检查的深度
  }
}
```

```typescript
// allowJs + checkJs 让渐进式迁移成为可能
// 可以在 TS 项目中混用 JS 文件
// TypeScript 会根据 JSDoc 注释推断类型

// utils.js
/**
 * @param {string} name
 * @returns {string}
 */
function greet(name) {
  return `Hello, ${name}`;
}

// app.ts
import { greet } from './utils'; // ✅ 类型安全
```

### 2.5 编辑器体验相关

```json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true
  }
}
```

```typescript
// noUnusedLocals: true
function example() {
  const unused = 42; // ❌ 编译错误：unused 被声明但从未使用
  const used = 10;
  console.log(used);
}

// noFallthroughCasesInSwitch: true
switch (x) {
  case 1:
    console.log('one');
    // ❌ 编译错误：case 2 会穿透到这里
  case 2:
    console.log('two');
    break;
}
```

### 2.6 兼容性相关

```json
{
  "compilerOptions": {
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  }
}
```

**`esModuleInterop`** — ESM 与 CJS 互操作
```typescript
// esModuleInterop: false
import * as express from 'express';      // 需要 import *
const app = express();

// esModuleInterop: true
import express from 'express';           // 可以使用默认导入
const app = express();

// 原理：当 esModuleInterop 启用时，TS 会生成辅助函数
// 使 CJS 模块的 module.exports 可以像 ESM 的 default export 一样使用
```

**`skipLibCheck`**
```json
{
  "skipLibCheck": true  // 跳过对 .d.ts 文件的类型检查
}
```
- 设置为 `true` 可以显著加快编译速度
- 但可能会隐藏第三方依赖中的类型错误
- 一般项目推荐设置为 `true`，库项目可能需要设置为 `false`

### 2.7 高级选项

```json
{
  "compilerOptions": {
    "isolatedModules": true,
    "resolveJsonModule": true,
    "composite": true,
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo"
  }
}
```

**`isolatedModules`**
```typescript
// 确保每个文件可以独立编译（不依赖跨文件的类型信息）
// 某些工具（Babel、esbuild、swc）是单文件编译的

// ❌ 违反 isolatedModules 的写法
export default enum Color { Red, Blue } // default export 枚举

// ✅ 正确写法
enum Color { Red, Blue }
export default Color;
```

**`resolveJsonModule`**
```typescript
// 允许直接导入 JSON 文件
import config from './config.json';
console.log(config.port); // 类型安全！

// 需要配合 resolveJsonModule: true
// 还推荐配置 "esModuleInterop": true
```

**`composite` + `incremental`**
```json
{
  "composite": true,
  "incremental": true,
  "tsBuildInfoFile": "./.tsbuildinfo"
}
```
- `composite`：启用项目引用所需的功能
- `incremental`：增量编译，只重新编译变化的部分
- `tsBuildInfoFile`：指定增量编译文件的存储位置

## 三、项目引用（Project References）

### 3.1 什么是项目引用？

什么时候需要这个？当你发现 `tsc` 编译越来越慢，而且你的项目明显分成几个独立模块（比如 packages/core、packages/web）时。

项目引用是 TypeScript 3.0 引入的功能，允许将一个大型项目拆分成多个小的子项目，每个子项目有独立的 `tsconfig.json`，并且可以相互引用。

```
big-project/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   ├── tsconfig.json    # composite: true
│   │   └── package.json
│   └── app/
│       ├── src/
│       ├── tsconfig.json    # references: [{ path: "../core" }]
│       └── package.json
└── tsconfig.json            # 根配置，引用所有子项目
```

### 3.2 配置项目引用

```json
// core/tsconfig.json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true,
    "declarationMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}

// app/tsconfig.json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "references": [
    { "path": "../core", "prepend": false }
  ],
  "include": ["src/**/*"]
}

// 根 tsconfig.json
{
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/app" }
  ]
}
```

### 3.3 构建模式（tsc -b）

```bash
# 使用构建模式编译所有引用的项目
tsc -b

# 等同于
tsc --build

# 清理所有构建产物
tsc -b --clean

# 强制重新构建
tsc -b --force

# 只构建某个项目及其依赖
tsc -b packages/app

# 静默模式（仅输出错误）
tsc -b --verbose
```

### 3.4 项目引用的优势

1. **构建速度提升**：只重新编译变更的部分
2. **关注点分离**：不同团队维护不同项目
3. **更好的组织**：明确的项目边界和依赖关系
4. **增量构建**：与 `incremental` 配合效果更好

### 3.5 项目引用的注意事项

- 被引用的项目必须设置 `composite: true`
- 被引用的项目必须生成 `.d.ts` 文件（`declaration: true`）
- 引用关系不能形成循环
- 需要搭配 monorepo 工具（Lerna、Nx、Turborepo）使用效果更佳

## 四、tsc 编译流程

### 4.1 编译管道

理解编译流程不是为了背诵——而是搞清楚为什么 `tsc --noEmit` 不生成 JS 但还能检查类型，以及为什么 Babel 编译比 tsc 快。

TypeScript 编译器的核心流程分为四个阶段：

```
源代码 (.ts/.tsx)
    │
    ▼
解析（Parsing）
    │ 词法分析 → 语法分析 → AST（抽象语法树）
    ▼
绑定（Binding）
    │ 符号创建 → 作用域解析 → 符号表
    ▼
类型检查（Type Checking）
    │ 类型推断 → 类型兼容性检查 → 错误报告
    ▼
发射（Emitting）
    │ 类型擦除 → 代码生成 → sourcemap → 声明文件
    │
    ▼
目标代码 (.js/.jsx/.d.ts)
```

### 4.2 各阶段详解

**阶段一：解析**
```typescript
// 源代码
const greeting: string = "Hello, World!";

// ↓ 词法分析（Lexical Analysis）
// 分解为 Token 流：
// const(关键字) greeting(标识符) :(冒号) string(关键字) =(等号) "Hello, World!"(字符串) ;(分号)

// ↓ 语法分析（Syntax Analysis）
// 构建 AST（简略表示）：
// VariableStatement
//   ├── Keyword: const
//   ├── Name: greeting
//   ├── Type: string
//   └── Initializer: "Hello, World!"
```

**阶段二：绑定**
- 为每个标识符创建符号（Symbol）
- 解析作用域和引用关系
- 构建符号表供类型检查使用

**阶段三：类型检查**
- 使用内置类型检查器（TypeChecker）
- 推断表达式类型
- 验证类型兼容性
- 报告类型错误

**阶段四：发射**
- 擦除所有类型注解
- 根据 `target` 转换语法（降级）
- 根据 `module` 生成模块代码
- 生成 source maps 和 declaration files

### 4.3 实际编译示例

```typescript
// 源码 app.ts
interface User {
  id: number;
  name: string;
}

async function fetchUser(id: number): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  const user: User = await response.json();
  return user;
}

export default fetchUser;
```

编译目标 `ES5` + `CommonJS` 的输出：
```javascript
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    // ... async 运行时辅助代码
};
Object.defineProperty(exports, "__esModule", { value: true });
function fetchUser(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("/api/users/" + id);
        const user = yield response.json();
        return user;
    });
}
exports.default = fetchUser;
```

编译目标 `ES2020` + `ESNext` 的输出：
```javascript
async function fetchUser(id) {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    return user;
}
export default fetchUser;
```

> **面试要点**："TypeScript 编译器是如何工作的？"——核心回答四个阶段：解析（Parsing）→ 绑定（Binding）→ 类型检查（Type Checking）→ 发射（Emitting），并简要说明每个阶段的作用。

## 五、tsc 和 Babel：它俩什么关系？

### 5.1 一句话说清

**tsc 做了两件事，Babel 只做其中一件。**

```
          ┌─ ① 类型检查：interface、:string、泛型对不对？
tsc ──────┤
          └─ ② 转译：把 TS 语法变成 JS 语法，输出 .js

Babel ─────── 只做 ②（把 TS 语法变成 JS），不检查类型
```

### 5.2 一个实验看区别

同一份源码：

```typescript
// src/hello.ts
const greet = (name: string): string => {
  return `Hello, ${name}`;
};
const result: number = greet("Alice"); // ← 类型错误！返回值是 string 却标了 number
```

**跑 tsc**：类型检查 + 转译一起做。

```bash
$ tsc
# ❌ 报错：Type 'string' is not assignable to type 'number'
# 同时也不输出 hello.js（因为 noEmitOnError 默认行为）
```

**跑 Babel**：只剥离类型，不检查对错。

```bash
$ babel src/ --out-dir dist
# ✅ 编译通过，静默输出 hello.js
```

```javascript
// dist/hello.js — Babel 的输出
const greet = (name) => {
  return `Hello, ${name}`;
};
const result = greet("Alice"); // 类型错了但 Babel 不管
```

**这就是核心区别**：Babel 把 `: string` 直接删掉，不关心 `result: number` 接了个 `string` 对不对。tsc 会报错阻止你。

### 5.3 为什么要分开用？

**因为类型检查很慢。** tsc 要分析整个项目的类型关系才能判断 `result: number` 是否正确。Babel 只改语法，一个文件一个文件处理，快很多。

所以大项目的经典做法是**拆分**：

```
开发时（保存文件即刷新）：
  不跑 tsc（太慢）→ 用 Babel/Vite/esbuild 剥离类型，秒级热更新
  编辑器里的红线 = tsc 在后台实时检查，告诉你类型错了但不会阻塞运行

提交前 / CI 里：
  tsc --noEmit  → 只跑类型检查，不产出文件
  如果类型有错，CI 直接挂掉，不给合入
```

```bash
# package.json 里的两个独立命令
npm run dev         # vite/webpack — 用 esbuild/babel 转译，秒启
npm run typecheck   # tsc --noEmit — 只检查类型，不吐文件
```

### 5.4 三种工具有什么不同

| | tsc | Babel | esbuild / swc |
|---|---|---|---|
| 类型检查 | ✅ | ❌ 只删类型 | ❌ 只删类型 |
| 转译速度 | 慢（类型检查拖累） | 快 | 极快（Go/Rust 写的） |
| 生成 .d.ts | ✅ | ❌ | ❌ |
| 插件生态 | 有限 | 极其丰富 | 有限 |
| 什么时候用 | 类型检查 | 转译 + 丰富插件 | 转译（追求极速） |

### 5.5 实际项目怎么选

| 项目 | 方案 |
|---|---|
| 个人小项目 / CLI 工具 | `tsc` 全包，简单省事 |
| React/Vue 前端应用 | Vite（内部用 esbuild）转译 + `tsc --noEmit` 类型检查 |
| Next.js 项目 | Next 内置 SWC 转译 + IDE 实时类型检查 |
| 大型 Node.js 服务 | `tsc` 或 `tsc -b`（项目引用加速） |
| 需要 Babel 插件（如按需加载） | Babel 转译 + `tsc --noEmit` 类型检查 |

> **面试要点**：Babel 和 tsc 的区别不是"哪个好"——它们是分工关系。tsc 做类型检查（慢但必要），Babel/esbuild 做转译（快）。现代项目的标准做法是分离：转译工具负责速度，tsc 负责安全。

## 六、lib 选项详解

### 6.1 什么是 lib

`lib` 选项指定编译器应包含哪些内置类型声明文件（即 JS 运行时和环境的类型定义）：

```json
{
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

### 6.2 常用 lib 值

| lib 值 | 包含的环境类型 |
|--------|--------------|
| `ES5` | 基本 ES5 类型 |
| `ES2015` | Promise、Map、Set、Symbol 等 |
| `ES2016` | Array.includes、** 操作符 |
| `ES2017` | async/await、Object.values |
| `ES2018` | 异步迭代器、Promise.finally |
| `ES2019` | Array.flat、Object.fromEntries |
| `ES2020` | BigInt、globalThis、Promise.allSettled |
| `ES2021` | Promise.any、String.replaceAll |
| `ES2022` | Array.at、Error Cause、Object.hasOwn |
| `DOM` | 浏览器 API（document、window、HTMLElement 等） |
| `DOM.Iterable` | DOM 可迭代类型（NodeList 可 for...of 等） |
| `WebWorker` | Web Worker API |
| `ScriptHost` | Windows Script Host 类型 |

### 6.3 不指定 lib 时的默认值

```text
// target 与默认 lib 的对应关系
target: "ES5"     → lib: ["DOM", "ES5", "ScriptHost"]
target: "ES6"     → lib: ["DOM", "ES6", "DOM.Iterable", "ScriptHost"]
target: "ES2020"  → lib: ["DOM", "ES2020", "DOM.Iterable"]
target: "ES2022"  → lib: ["DOM", "ES2022", "DOM.Iterable"]
target: "ESNext"  → lib: ["DOM", "ESNext", "DOM.Iterable"]
```

### 6.4 常见的 lib 错误

```typescript
// ❌ 只指定了 ES5 但使用了 Promise
{
  "target": "ES5",
  "lib": ["ES5", "DOM"]  // 缺少 "ES2015"（或 "ES2015.Promise"）
}

// 在代码中：
const promise = new Promise((resolve) => resolve(42));
// ❌ 找不到 Promise 类型

// ✅ 解决方案：显式添加需要的 lib
{
  "target": "ES5",
  "lib": ["ES5", "DOM", "ES2015.Promise"]
}
```

```typescript
// ❌ 在 Node.js 环境中未添加 DOM 类型
{
  "lib": ["ES2022"]  // 没有 DOM，但代码中使用了 console
}
// console 在某些目标中其实可用，但具体类型可能缺失

// Node.js 环境更推荐：
// @types/node 自动包含 Node.js 的类型
// 此时不需要额外的 lib 配置（除非需要特定 ES 特性）
```

## 七、Watch 模式与增量构建

### 7.1 监听模式

```bash
# 基础监听
tsc --watch

# 或
tsc -w
```

```bash
# 使用项目引用的监听
tsc -b --watch

# 指定配置文件
tsc -p tsconfig.prod.json --watch
```

### 7.2 增量编译

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsbuildinfo/app"
  }
}
```

- 首次编译：全量编译，生成 `.tsbuildinfo` 文件
- 增量编译：只重新编译变更的文件及其依赖
- `--watch` 模式隐式启用增量行为

### 7.3 文件监听策略

```bash
# Windows 上使用轮询监听（适合网络驱动器）
tsc --watch --watchFile UseFsEvents --watchDirectory UseFsEvents

# Linux/macOS 默认使用文件系统事件
# 可选策略：
--watchFile: FixedPollingInterval | PriorityPollingInterval | DynamicPriorityPolling | UseFsEvents
--watchDirectory: UseFsEvents | FixedPollingInterval | DynamicPriorityPolling
```

## 八、常见陷阱与最佳实践

### 陷阱 1：moduleResolution 不匹配导致导入失败

```typescript
// ❌ 问题：module: "ESNext" 但 moduleResolution: "node"
// 在 TypeScript 4.7+，某些 mode 组合会导致模块解析失败

// ✅ 推荐组合
// 1. 前端项目（使用打包工具）
{
  "module": "ESNext",
  "moduleResolution": "bundler"  // TypeScript 5.0+
}

// 2. Node.js 项目（使用 ESM）
{
  "module": "NodeNext",
  "moduleResolution": "NodeNext"
}

// 3. Node.js 项目（使用 CommonJS）
{
  "module": "CommonJS",
  "moduleResolution": "node"
}
```

### 陷阱 2：paths 配置了但不生效

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["src/*"]
    }
    // 缺少 baseUrl!
  }
}
```

**问题**：`paths` 必须与 `baseUrl` 配合使用。在 TypeScript 5.0+ 中，可以通过 `"paths"` 配合 `"moduleResolution": "bundler"` 使用。

**解决方案**：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**注意**：`paths` 只在类型检查阶段生效。运行时（Node.js）需要额外的处理：
```bash
npm install tsconfig-paths
node -r tsconfig-paths/register dist/app.js
```

### 陷阱 3：缺少 lib 导致 API 类型无法使用

```typescript
// ❌ 错误
{
  "target": "ES5",
  "lib": ["ES5", "DOM"]
  // 缺少 "ES2015" 导致 Promise、Map 等类型未定义
}
```

**解决方案**：确保 `lib` 包含所有需要的内置类型。或者如果你的目标环境（如 Node.js 18+）已经原生支持这些 API，只需添加对应的 lib 值：
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"]
    // 或直接使用 target 的默认 lib
  }
}
```

### 陷阱 4：noEmit 配置遗忘导致无输出

```json
{
  "compilerOptions": {
    "strict": true,
    "outDir": "./dist"
    // 等等，noEmit 忘了关？
  }
}
```

**典型场景**：从仅类型检查的项目（`"noEmit": true`）复制 tsconfig 到需要编译输出的项目中，忘了移除 `noEmit`，导致运行 `tsc` 后没有文件输出。

### 陷阱 5：skipLibCheck 掩盖了类型错误

```json
{
  "skipLibCheck": true
}
```

虽然 `skipLibCheck` 大大加快了编译速度，但它也会隐藏 `@types/*` 包中的类型错误。如果遇到莫名其妙的类型问题，尝试暂时关闭 `skipLibCheck` 看看是否暴露了根本原因。

### 陷阱 6：esModuleInterop 的行为误解

```typescript
// 很多人以为 esModuleInterop 只影响 import 语法
// 实际上它还会影响生成代码中的 __importStar / __importDefault 辅助函数

// esModuleInterop: false
import express from 'express';
// 编译为：const express_1 = require("express");

// esModuleInterop: true
import express from 'express';
// 编译为：const express_1 = __importDefault(require("express"));

// 后者在 CJS 模块有 default export 行为时更符合预期
```

### 陷阱 7：isolatedModules 与 const enum 冲突

```typescript
// ❌ const enum 在 isolatedModules 模式下不可用
const enum Color { Red, Green, Blue }
// 因为 const enum 需要跨文件信息来内联值
// Babel/esbuild 等单文件编译器无法处理

// ✅ 解决方案
// 1. 使用普通 enum
enum Color { Red, Green, Blue }
// 2. 使用联合类型字面量
type Color = 'Red' | 'Green' | 'Blue';
```

## 九、面试高频题

### Q1：tsconfig.json 中的 target 和 lib 有什么区别？

`target` 控制输出的 JS 语法版本（如箭头函数 → 普通函数），`lib` 控制编译器可用的内置类型声明（如 Promise、Map 等类型定义）。`target` 不会自动添加对应的 `lib`，需要显式配置。

### Q2：什么是 project references？有什么好处？

Project References 将大型项目拆分为多个子项目，通过 `references` 字段引用。好处：加速构建（只编译变更部分）、明确模块边界、支持增量构建。使用 `tsc -b` 命令进行构建。

### Q3：strict: true 包含了哪些配置？

包含：strictNullChecks、strictFunctionTypes、strictBindCallApply、strictPropertyInitialization、noImplicitAny、noImplicitThis、alwaysStrict。TypeScript 4.4+ 新增 useUnknownInCatchVariables，TypeScript 4.7+ 新增 noUncheckedIndexedAccess。

### Q4：tsc --noEmit 有什么作用？

`--noEmit` 告诉编译器只进行类型检查，不输出任何文件。常用于 CI/CD 流水线中的类型检查步骤，或与 Babel/esbuild 配合使用（tsc 负责类型检查，工具负责转译）。

### Q5：esModuleInterop 的作用是什么？

启用 `esModuleInterop` 后，TypeScript 会生成辅助函数，使得可以像 ESM 默认导入一样使用 CJS 模块（`import foo from 'foo'` vs `import * as foo from 'foo'`）。通常与 `allowSyntheticDefaultImports` 一起使用。

### Q6：outDir 和 rootDir 的关系是什么？

`outDir` 是输出目录，`rootDir` 是源代码根目录。编译时，TypeScript 会保留 `rootDir` 下的目录结构到 `outDir` 中。例如 `src/app.ts` → `outDir/app.js`。

### Q7：paths 配置为什么在运行时不起作用？

`paths` 只是 TypeScript 编译器在类型检查阶段的路径映射，运行时的模块加载器（Node.js require 或浏览器）并不知道这个映射，需要额外的运行时工具（如 `tsconfig-paths`、`module-alias`、或打包工具的 resolve alias 配置）。

---

## 总结

| 配置类别 | 关键配置 | 重要性 |
|---------|---------|--------|
| 严格性 | `strict` + 相关子选项 | ⭐⭐⭐⭐⭐ |
| 模块 | `module` + `moduleResolution` + `paths` | ⭐⭐⭐⭐⭐ |
| 输出 | `target` + `outDir` + `declaration` | ⭐⭐⭐⭐ |
| 兼容性 | `esModuleInterop` + `skipLibCheck` | ⭐⭐⭐⭐ |
| JS 支持 | `allowJs` + `checkJs` | ⭐⭐⭐ |
| 编辑器 | `noUnusedLocals` + `noUnusedParameters` | ⭐⭐⭐ |
| 高级 | `isolatedModules` + `composite` + `incremental` | ⭐⭐⭐ |
| 项目引用 | `references` + `tsc -b` | ⭐⭐⭐（大型项目） |
