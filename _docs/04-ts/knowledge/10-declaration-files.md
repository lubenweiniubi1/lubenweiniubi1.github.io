# 声明文件：从"TS 又报红了"到自己动手写

## 这篇文章解决什么问题？

你在项目里肯定遇到过这类情况：

- npm 装了个包，import 进去 TS 直接报红："Could not find a declaration file"
- window 上挂了个全局变量，访问它 TS 说 "Property 'xxx' does not exist on type 'Window'"
- 想给 express 的 req 加个 user 字段，发现 Request 类型上没有

**这篇文章按你实际会遇到的频率排序**——从最常见的"装个 @types 搞定"到"自己动手 declare module"，再到"扩展全局 / 扩展第三方库"。最后会提一些你可能在旧代码里见过但不需要手写的东西。

---

## 第一层：npm 装了个包，TS 报红说找不到类型

### 90% 的情况：装 @types

```bash
# 装了个 JS 库
npm install lodash

# 一用就报红
import _ from "lodash"; // ❌ Could not find a declaration file for 'lodash'
```

**先试这个**：

```bash
npm i -D @types/lodash
```

重启编辑器，报红消失。社区维护的类型包都发布在 `@types/*` 下，TS 会自动从 `node_modules/@types` 加载它们。

### 怎么知道有没有 @types？

去 [npm](https://www.npmjs.com/) 搜 `@types/包名`，或者在命令行看：

```bash
npm info @types/lodash  # 不返回 404 就有
```

**常见有 @types 的包**：lodash、express、react、react-dom、node、jquery、axios、qs……

> 先查 @types，这是最快方案。

---

## 第二层：没有 @types 的冷门包怎么办

### 2.1 保底：让 TS 闭嘴

```typescript
// src/declarations.d.ts — 放在 src 下，TS 自动加载
declare module "some-obscure-lib";
```

写完这句之后 `import` 不再报红，但导入的东西全是 `any` 类型。**临时用可以，别长期依赖。**

### 2.2 正经写：带上类型

翻一下这个包的文档或者源码，挑几个你常用的 API 写上类型：

```typescript
// src/declarations.d.ts
declare module "obscure-lib" {
  export function init(config: { apiKey: string }): void;
  export function track(event: string, data?: Record<string, unknown>): void;
  export const VERSION: string;
}
```

几个要点：
- `declare module "包名"` 里的包名要和 `import` 里写的一模一样
- 支持的语法：`export function`、`export const`、`export interface`、`export class`、`export default`
- 不需要写实现，只写类型签名

### 2.3 如果它既有默认导出又有命名导出

```typescript
declare module "hybrid-lib" {
  const main: (opts: Options) => void;
  export default main;
  export function helper(): void;
  export interface Options { debug: boolean }
}
```

> 够用就行，不用把整个库的 API 都写一遍——只写你项目里用到的。

---

## 第三层：想给 window / process.env 加点东西

### 3.1 场景：window 上挂了全局变量

你的 HTML 里可能这样注入了数据：

```html
<script>
  window.__INITIAL_STATE__ = { user: { id: 1, name: "Alice" } };
</script>
```

TS 不认识 `window.__INITIAL_STATE__`，一访问就报红。

**解决办法——declare global**：

```typescript
// src/global.d.ts
export {}; // 不加这行，TS 认为这是全局文件，declare global 不生效

declare global {
  interface Window {
    __INITIAL_STATE__: { user: { id: number; name: string } };
    gtag: (command: string, ...args: unknown[]) => void;
  }
}
```

写完之后 `window.__INITIAL_STATE__` 和 `window.gtag(...)` 都有类型了。

**关键是**：`Window` 是一个 interface，同名的 interface 会自动合并——你在 `declare global` 里往 `Window` 上加字段，等于在原版 `Window` 上追加了新字段。

### 3.2 场景：自定义 process.env

```typescript
// src/env.d.ts（如果是 Node 项目）
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production" | "test";
    API_BASE_URL: string;
    SENTRY_DSN?: string;
  }
}
```

之后 `process.env.NODE_ENV` 的类型就是 `"development" | "production" | "test"`，打错字母会报错。

### 要点总结

| 你要扩展什么 | 写法 |
|---|---|
| window 属性 | `declare global { interface Window { ... } }` |
| process.env | `declare namespace NodeJS { interface ProcessEnv { ... } }` |
| 其他全局接口 | 搜一下那个接口叫什么名字，用同名 interface 合并 |

**注意**：`declare global` 只能在模块文件（有 `import`/`export` 的文件）里用。如果没有 `import`/`export`，加一行 `export {};` 把文件变成模块。

---

## 第四层：想给第三方库加个字段

### 场景：express 的 req 上没有 user

```typescript
// 你登录中间件给 req 挂了 user，但 TS 不知道
app.get("/profile", (req, res) => {
  console.log(req.user?.name); // ❌ Property 'user' does not exist on type 'Request'
});
```

**用模块增强（Module Augmentation）**：

```typescript
// src/express-augment.d.ts
import "express";

declare module "express" {
  interface Request {
    user?: {
      id: number;
      name: string;
      role: "admin" | "user";
    };
  }
}
```

原理和 `Window` 扩展一样：`express` 的 `Request` 是 interface，module augmentation 就是在它的原始定义上合并你加的新字段。

### 写模块增强的三个前提

1. 文件要是模块（有 `import` 或 `export`）
2. `declare module "包名"` 里的包名要和 `package.json` 里的名字一致
3. 扩展的对象必须是 interface（`type` 别名不能合并）

---

## 第五层：通配符声明——让 TS 认识 .css / .png / .svg

```typescript
// 项目里 import 了一个 CSS 模块或图片
import styles from "./index.module.css";   // ❌
import logo from "./logo.png";             // ❌
```

TS 只看 .ts/.tsx，不认识 .css、.png、.vue 等文件。要写通配符声明：

```typescript
// src/asset-declarations.d.ts
declare module "*.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module "*.png" {
  const src: string;
  export default src;
}

declare module "*.svg" {
  const src: string;
  export default src;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
```

**原理**：`declare module "*.css"` 里的 `*` 是通配符，所有以 `.css` 结尾的路径都匹配到这个声明。

常见的前端框架一般自带这些声明（Vite 的 `vite/client.d.ts`、Create React App 的 `react-app-env.d.ts`），但如果你自己配项目或写库，需要手动加上。

---

## 第六层：声明合并是什么

前面几层里你其实已经在用声明合并了——只是没意识到。

### 6.1 interface 会自动合并

```typescript
interface Box {
  width: number;
}

// 再来一个同名的
interface Box {
  height: number;
}

// 结果等价于：
interface Box {
  width: number;
  height: number;
}
```

**这就是为什么你在 `declare global` 里往 `Window` 上加字段能生效**——TS 把两个同名的 interface 合并成了一个。

### 6.2 不能合并的情况

```typescript
interface Box {
  width: number;
}
interface Box {
  // width: string; // ❌ 同名属性类型必须一致
}
```

`type` 别名不能重复声明（会直接编译错误），所以只有 interface 能用来做扩展。

---

## 第七层：你可能看到但不需要关心的

### 三斜线指令（Triple-Slash Directives）

```typescript
/// <reference types="node" />
/// <reference path="./other-types.d.ts" />
```

你在旧项目或一些 `.d.ts` 文件头部可能看到这种三斜线注释。它是 ES6 模块出现之前的引用机制，用来声明文件依赖。

**现在不用写这个**——用 `import` 就行了。只有极少数场景（如全局 .d.ts 文件的依赖）仍会用到。

### 命名空间合并

```typescript
// 你可能在旧代码或 .d.ts 里看到
namespace Animals {
  export class Dog {}
}

namespace Animals {
  export class Cat {}
}
```

namespace 也能同名合并，这是 TS 早期设计的机制。**你的业务代码里不要写 namespace**，用 `export`/`import`。

### 往 DefinitelyTyped 贡献类型

如果你发现某个 npm 包没有 `@types`，而且你有精力为社区做贡献，可以去 [DefinitelyTyped 仓库](https://github.com/DefinitelyTyped/DefinitelyTyped) 提交 PR——在 `types/` 目录下创建包的声明文件。这是深度贡献者的工作，绝大多数开发者不需要做。

---

## 总结：按场景速查

| 你遇到的情况 | 翻到哪层 |
|---|---|
| 主流 npm 包没有类型 | 第一层：装 @types |
| 冷门 npm 包没有类型 | 第二层：declare module |
| 访问 window 属性报红 | 第三层：declare global |
| process.env 没有提示 | 第三层：declare namespace NodeJS |
| 扩展第三方库的 interface | 第四层：Module Augmentation |
| import .css/.png 报红 | 第五层：通配符声明 |
| 看到 interface 同名不报错 | 第六层：声明合并 |
| 看到 `/// <reference />` | 第七层：忽略它 |
