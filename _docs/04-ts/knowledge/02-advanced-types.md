# TypeScript 高级类型：从"这类型怎么拼"到条件类型

刚写完你的第一个 TS 函数，发现一个问题：`function hello(name)` 接收一个参数，但这个参数有时候是字符串有时候是数字——你不想写两个函数。或者你从后端接了两个接口，想拼成一个完整的配置类型。又或者你看到同事代码里既有 `type` 又有 `interface`，不知道哪个该用。

**这篇文章就解决这类问题**——从你会遇到的第一类窘境（"一个值可能有两种类型"）开始，按你实际写代码会踩坑的顺序递进。

---

## 第一层：一个变量可能是 string 也可能是 number，怎么办？

### 问题的根源

假设你写了个函数，接收一个"标识符"，有时候是字符串有时候是数字：

```typescript
// 幼稚写法：给一个宽泛的类型
function getById(id: any) {
  return fetch(`/api/${id.toString()}`);
}
// any 一用，整条链路的类型保护全丢了
```

```typescript
// 另一个极端：写两个函数
function getByIdStr(id: string) { return fetch(`/api/${id}`); }
function getByIdNum(id: number) { return fetch(`/api/${id}`); }
// 调用端还得自己判断类型，烦
```

### 解法——联合类型

```typescript
type ID = string | number;

function getById(id: ID) {
  // id 可以是 string 或 number
  // 但只能调用两者的公共方法
  return fetch(`/api/${id.toString()}`);
}
```

**但没完——** 假如你需要对 string 和 number 做不同的处理呢？这时就需要**类型收窄**了：

```typescript
function processId(id: ID): string {
  // ❌ id.toUpperCase() 报错：number 没有 toUpperCase
  // ❌ id.toFixed() 报错：string 没有 toFixed

  if (typeof id === "string") {
    return id.toUpperCase();  // ✅ 这里 TS 知道 id 是 string
  }
  return id.toFixed(0);       // ✅ 这里 TS 知道 id 是 number
}
```

### 用联合字面量替代枚举

你可能会在代码里写很多"状态值"：

```typescript
// 不用 magic string
type Status = "active" | "inactive" | "pending";

function setStatus(s: Status) { /* ... */ }

setStatus("active");    // ✅
setStatus("deleted");   // ❌ "deleted" 不在联合里
```

联合字面量比枚举好在哪？它不需要编译，没有运行时开销，而且写法直观。后面第五层会详细对比。

### 可辨识联合——最常见的联合模式

当你有一组对象，它们有相同的字段但不同的内容结构时：

```typescript
// 问题：一个形状可能是圆也可能是正方形，怎么统一处理？
interface Circle {
  kind: "circle";
  radius: number;
}
interface Square {
  kind: "square";
  sideLength: number;
}
type Shape = Circle | Square;

function calculateArea(shape: Shape): number {
  // 利用共同的 kind 字段收窄
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;   // shape 被收窄为 Circle
    case "square":
      return shape.sideLength ** 2;          // shape 被收窄为 Square
    default:
      const exhaustive: never = shape;       // 加了新类型没处理？编译报错
      throw new Error(`Unknown shape`);
  }
}
```

这个模式在你处理 API 返回的不同状态时极其常见：`{ status: "loading" } | { status: "success", data: T } | { status: "error", message: string }`。

---

## 第二层：想把两个类型拼在一起

### 什么时候需要拼类型？

你从后端拿了个用户信息，又从前端配置里拿了个权限信息，想把它们合并成一个完整的"用户配置"类型——而不是重写一遍所有字段。

### 幼稚做法：手写一个新接口

```typescript
interface UserInfo { name: string; age: number; }
interface UserPermissions { role: string; permissions: string[]; }

// 把两个接口的字段全抄一遍
interface FullUser { name: string; age: number; role: string; permissions: string[]; }
// 这样 UserInfo 或 UserPermissions 改一个字段，FullUser 就不同步了
```

### 解法——交叉类型 &

```typescript
interface UserInfo { name: string; age: number; }
interface UserPermissions { role: string; permissions: string[]; }

type FullUser = UserInfo & UserPermissions;

// FullUser 自动等于 { name: string; age: number; role: string; permissions: string[]; }
// 源类型改了，FullUser 自动跟着改
```

### 冲突问题——同名但不兼容的属性

```typescript
interface A { id: string; }
interface B { id: number; }

type AB = A & B;
// 此时 AB 的 id 类型是 string & number → never
// 这意味着你几乎不可能给 id 赋任何值
```

**规则**：交叉类型中的同名属性取**交集**。简单类型的交集通常是 `never`，对象类型的交集则合并属性。

### 实际应用：Mixin 式组合

```typescript
type WithTimestamp = { createdAt: Date; updatedAt: Date; };
type WithAuthor   = { createdBy: string; updatedBy: string; };

type AuditLog = WithTimestamp & WithAuthor;

// 或者用来扩展第三方组件 props
type ButtonProps = {
  variant: "primary" | "secondary";
  size: "small" | "medium" | "large";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;
```

---

## 第三层：type 和 interface 我该用哪个？

你开始在项目里写类型了，发现有两种方式声明对象形状——`interface` 和 `type`。两个都能用，到底该选哪个？

### 简版决策树

```
需要声明合并（给第三方类型加字段）？     → interface
需要联合/元组/映射类型/原始类型别名？    → type
其他情况（普通的对象类型）？               → 都可以，团队定个规矩就行
```

### 差别速查表

| 场景 | interface | type |
|---|---|---|
| 同名声明自动合并 | 支持 | 不支持（重复报错） |
| 扩展语法 | `extends`（有属性兼容检查） | `&`（同名取交集） |
| 原始类型别名 (`type ID = string`) | 不支持 | 支持 |
| 联合类型 (`A \| B`) | 不支持 | 支持 |
| 元组 (`[number, string]`) | 只能模拟 | 支持 |
| 映射类型 (`{ [K in keyof T]: ... }`) | 不支持 | 支持 |
| 声明函数类型 | 调用签名语法 | 箭头语法 |
| 社区惯例 | 公共 API / 库类型 | 应用内部组合类型 |

### 代码对比

```typescript
// 声明合并——interface 的独门绝技
interface Request { url: string; }
interface Request { method: "GET" | "POST"; }  // 自动合并
const r: Request = { url: "/api", method: "GET" }; // ✅

// type —— 联合、元组、映射类型的场景
type Status = "active" | "inactive";   // 联合
type Point = [number, number];         // 元组
type Readonly<T> = { readonly [K in keyof T]: T[K] }; // 映射

// 两者可以互相引用
interface User extends Record<string, unknown> { name: string; }
type Admin = User & { role: string; };
```

**一句话**：不确定的时候先用 `interface`，发现接口需要联合/元组/映射的时候再换成 `type`。别在选谁上纠结超过 30 秒。

---

## 第四层：怎么让一个值不可变？

### 问题

你定义了一个常量配置对象，希望后面没人能改它：

```typescript
const CONFIG = {
  api: "https://api.example.com",
  timeout: 5000,
};

CONFIG.timeout = 9999; // 一不小心被改了，没人报错
```

### 分别理解 const 和 readonly

`const` 管的是"这个变量不能再指向别的东西"，但不管对象内部。

```typescript
const arr = [1, 2, 3];
arr.push(4);  // ✅ 内容可以改
arr = [];     // ❌ 重新赋值不行（const 管这个）
```

`readonly` 管的是"这个属性不能赋值"，但只在编译时检查。

```typescript
interface Config {
  readonly apiKey: string;
  readonly endpoint: string;
}

const config: Config = { apiKey: "abc", endpoint: "..." };
config.apiKey = "new"; // ❌ 编译报错：readonly 属性不能赋值
```

### as const——字面量推导的钥匙

你想要的"把对象里所有属性都变成只读且精确到字面量"：

```typescript
const ROUTES = {
  home: "/home",
  about: "/about",
} as const;

// 加了 as const 的效果：
// ROUTES.home 的类型是 "/home"（字面量，不是 string）
// 整个对象都是 readonly

// 不加 as const 时：
// ROUTES.home 的类型是 string
// 你可以写 ROUTES.home = "/other" 而不报错

// 实用场景：从一个对象推导出联合类型
type RoutePaths = (typeof ROUTES)[keyof typeof ROUTES];
// 结果等同于 "/home" | "/about"
// 路由改了，类型自动跟着变，不会出现改了路由值忘了改类型的情况
```

---

## 第五层：枚举 vs 联合字面量 vs const object

同一个问题有"三种解法"，都是定义一组固定的值，初学者看到同事写法各不相同会晕。

### 场景：定义一个状态码集合

```typescript
// 方式 1：联合字面量
type Status = "active" | "inactive" | "pending";

// 方式 2：普通枚举
enum StatusEnum {
  Active = "active",
  Inactive = "inactive",
  Pending = "pending",
}

// 方式 3：const object + as const
const StatusObj = {
  Active: "active",
  Inactive: "inactive",
  Pending: "pending",
} as const;
type StatusObjType = (typeof StatusObj)[keyof typeof StatusObj];
```

### 怎么选？

| 需求 | 联合字面量 | 普通枚举 | const object + as const |
|---|---|---|---|
| 零运行时开销 | 是 | 否（编译为 JS 对象） | 是 |
| 反向映射（值→名字） | 需要自己写 | 内置 | 需要自己写 |
| 自动补全可遍历 | 一般 | 一般 | 用 `Object.values` |
| 与外部系统交互（如后端 API） | 字符串直接传 | 需要 `.value` 或直接传 | 用 `.值` 或直接传 |
| 新旧项目兼容性 | ES2015+ | ES2015+ | ES2015+ |

**实际建议**：

- **后端 API 返回值 / 表单项状态**：用联合字面量。最轻量，字符串直接传，不需要额外转换。
- **需要遍历所有值**（如下拉选项）：用 `const object + as const`。既可以拿到类型，又可以拿到运行时数据。
- **已存在枚举的旧项目**：继续用枚举，别混用。
- **请勿使用** `const enum`：它本意是进一步压缩体积，但库作者用了之后，消费者无法内联就会炸。

```typescript
// const object + as const 的典型用法
const HttpStatus = {
  OK: 200,
  NotFound: 404,
  ServerError: 500,
} as const;

type HttpStatusCode = (typeof HttpStatus)[keyof typeof HttpStatus];
// 200 | 404 | 500

// 想遍历？用 Object.values
Object.values(HttpStatus); // [200, 404, 500]
```

---

## 第六层：interface 不只是描述对象

初学者以为 `interface` 就是用来写对象的——其实 `interface` 还能描述"长得像函数的对象"和"长得像字典的对象"。

### 场景一：函数也可以带属性（调用签名）

假设你在写一个类似 jQuery 的库：`$("#app")` 是函数调用，`$.version` 是访问属性。TS 怎么描述这种类型？

```typescript
// 幼稚做法：把函数和属性分开两段声明
function query(selector: string) { /* ... */ }
query.version = "1.0"; // 但你的类型没法表达"这个函数上挂了个 version"

// 解法：用 interface 的调用签名
interface JQueryLike {
  (selector: string): HTMLElement | null;  // 调用签名——说明这是个可调用的东西
  version: string;                          // 普通属性
  ajax(url: string): Promise<unknown>;      // 方法
}

// 然后再实现
function createJQuery(): JQueryLike {
  const fn = ((selector: string) => document.querySelector(selector)) as JQueryLike;
  fn.version = "1.0";
  fn.ajax = async (url: string) => fetch(url).then(r => r.json());
  return fn;
}
```

**实际场景**：Redux 中间件、Express 中间件、工厂函数——在调用之后返回一个带方法的对象，或者函数本身挂载了额外属性。

### 场景二：不知道属性名但知道值类型（索引签名）

你从后端收到一个动态对象，属性名是字符串（提前不知道叫什么），但值都是数字：

```typescript
// 假设后端返回：{ "user_001": 100, "user_002": 85, "user_003": 92 }
// 属性名未知，但值一定是数字

type ScoreMap = { [userId: string]: number };

function sumScores(scores: ScoreMap): number {
  return Object.values(scores).reduce((a, b) => a + b, 0);
}
// ✅ 不需要预先知道属性名
```

再比如实现一个通用缓存或配置管理器：

```typescript
interface ConfigStore {
  [key: string]: string | number | boolean;  // 任何属性都能存
  debug: boolean;   // 已知属性：必须有，且类型符合索引签名
  port: number;     // 已知属性：必须有
  // host: string[];  ❌ 错误：数组类型不符合索引签名
}
```

**索引签名的一大限制**：所有已知属性必须是索引签名的子类型。如果你需要更灵活的类型，考虑用 `Map<K, V>`。

### 场景三：描述一个类本身（构造签名）

你需要写一个工厂函数，接收一个类（构造函数）并创建实例——但类的类型怎么描述？

```typescript
// 问题：下面这个函数，参数 ctor 的类型应该是什么？
function createInstance(ctor, ...args) {
  return new ctor(...args);
}

// 解法：构造签名
interface PointConstructor {
  new (x: number, y: number): { x: number; y: number };
}

class Point {
  constructor(public x: number, public y: number) {}
}

function createPoint(ctor: PointConstructor): { x: number; y: number } {
  return new ctor(1, 2);
}

const p = createPoint(Point); // ✅ Point 满足 PointConstructor
```

**实际场景**：依赖注入容器、对象池、ORM 的实体工厂——你需要在运行时动态创建实例，但创建逻辑（构造函数参数）是调用端决定的。

---

## 按场景速查

| 你遇到的情况 | 翻到哪层 |
|---|---|
| 一个值可能是多种类型之一 | 第一层：联合类型 |
| 想通过共同字段区分联合成员 | 第一层：可辨识联合 |
| 想把两个已有的类型合并 | 第二层：交叉类型 |
| 不知道该用 type 还是 interface | 第三层：速查表 |
| 希望对象变成完全不可变 | 第四层：`as const` |
| 想定义一组常量值 | 第五层：文字对比 |
| 函数本身还带属性 | 第六层：调用签名 |
| 动态属性名的对象 | 第六层：索引签名 |
| 把类作为参数传进去 | 第六层：构造签名 |
