# TypeScript 泛型

## 一、为什么需要泛型？

泛型解决了编程中最核心的挑战之一：**在保证类型安全的前提下编写可复用的代码**。

### 1.1 无泛型时的困境

```typescript
// 场景：实现一个恒等函数（identity function）
// 传入什么类型就返回什么类型

// 方案 1：使用 any — 类型不安全
function identityAny(arg: any): any {
  return arg;
}
const result1 = identityAny("hello");
result1.toFixed(); // 编译通过，运行时崩溃！你无法发现这个错误

// 方案 2：使用重载 — 代码爆炸
function identityOverload(arg: string): string;
function identityOverload(arg: number): number;
function identityOverload(arg: boolean): boolean;
// ... 为每种类型写一个重载？不可能！

// 方案 3：使用联合类型 — 无法保持输入输出类型一致
function identityUnion(arg: string | number): string | number {
  return arg;
}
const result2 = identityUnion("hello");
// result2 的类型是 string | number，失去了具体类型信息
// result2.toUpperCase(); // ❌ 编译错误：number 上不存在 toUpperCase
```

### 1.2 泛型方案

```typescript
// 泛型让你捕获参数的类型，保留类型信息
function identity<T>(arg: T): T {
  return arg;
}

const str = identity("hello");       // str 的类型为 string
const num = identity(42);            // num 的类型为 number
const bool = identity<boolean>(true); // 也可以显式指定类型参数

// 泛型的关键优势：类型可以"穿透"函数
// 输入类型 -> 函数 -> 输出类型，三者保持一致
```

| 方案 | 类型安全 | 可复用 | 保持输入输出关系 |
|------|---------|-------|----------------|
| `any` | 否 | 是 | 否 |
| 重载 | 是 | 否 | 是 |
| 联合类型 | 部分 | 部分 | 否 |
| **泛型** | **是** | **是** | **是** |

> **面试要点**：泛型的核心价值是**保持类型关系**——函数的输入类型和输出类型之间的关联。面试中至少应能说出：泛型避免重复代码、保持类型安全、保留类型信息。

## 二、泛型基础

### 2.1 泛型函数

```typescript
// 最基础的泛型函数
function firstElement<T>(arr: T[]): T | undefined {
  return arr[0];
}

const num = firstElement([1, 2, 3]);       // number | undefined
const str = firstElement(["a", "b"]);      // string | undefined
const el = firstElement([]);               // undefined

// 多个参数使用相同类型参数
function merge<T, U>(a: T, b: U): T & U {
  return { ...a, ...b };
}

const merged = merge({ name: "Alice" }, { age: 30 });
// merged 的类型为 { name: string; } & { age: number; }

// 泛型箭头函数（注意 JSX 中的语法）
const identityArrow = <T,>(arg: T): T => arg;
// 逗号 <T,> 用于避免与 JSX 标签混淆

// 或使用 extends 语法
const identityArrow2 = <T extends unknown>(arg: T): T => arg;
```

### 2.2 泛型接口

```typescript
interface GenericIdentityFn<T> {
  (arg: T): T;
}

const myIdentity: GenericIdentityFn<number> = (arg: number) => arg;

// 更实用：泛型接口描述数据容器
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
  timestamp: Date;
}

interface User {
  id: number;
  name: string;
  email: string;
}

type UserResponse = ApiResponse<User>;
// {
//   data: User;
//   status: number;
//   message: string;
//   timestamp: Date;
// }

const response: UserResponse = {
  data: { id: 1, name: "Alice", email: "alice@example.com" },
  status: 200,
  message: "OK",
  timestamp: new Date(),
};
```

### 2.3 泛型类型别名

```typescript
// 泛型 type 别名
type Result<T> = {
  success: boolean;
  value: T;
  error?: string;
};

const successResult: Result<string> = {
  success: true,
  value: "Operation completed",
};

// 泛型联合类型
type Either<T, U> = { type: "left"; value: T } | { type: "right"; value: U };

const left: Either<string, number> = { type: "left", value: "error" };
const right: Either<string, number> = { type: "right", value: 42 };
```

### 2.4 泛型类

```typescript
class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items[this.items.length - 1];
  }

  get size(): number {
    return this.items.length;
  }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
numStack.push(3);
const top = numStack.pop(); // top 的类型为 number | undefined

const stringStack = new Stack<string>();
stringStack.push("hello");
// stringStack.push(42); // ❌ Type 'number' is not assignable to type 'string'

// 类本身的静态方法不能使用类的泛型参数
// 静态方法需要自己的泛型
class Factory {
  static create<T>(item: T): T {
    return item;
  }
}
```

## 三、泛型约束（Generic Constraints）

### 3.1 extends 约束

有时我们需要限制泛型可以接受的类型，以保证函数内部可以执行特定操作：

```typescript
// ❌ 错误：无法保证 arg 上有 length 属性
function logLengthBad<T>(arg: T): T {
  // console.log(arg.length); // ❌ Property 'length' does not exist on type 'T'
  return arg;
}

// ✅ 使用 extends 约束 T 必须有 length 属性
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length); // ✅ T 被约束为必须有 length 属性
  return arg;
}

logLength("hello");            // ✅ string 有 length
logLength([1, 2, 3]);          // ✅ 数组有 length
// logLength(42);              // ❌ number 没有 length

// 通过约束获取属性的类型
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const user = { name: "Alice", age: 30, email: "alice@example.com" };
const userName = getProperty(user, "name"); // string
const userAge = getProperty(user, "age");   // number
// getProperty(user, "nonexistent"); // ❌ 编译错误
```

### 3.2 使用类型参数约束另一个类型参数

```typescript
// 场景：从一个对象中提取指定键对应的值
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// 场景：确保第二个参数是第一个参数的键
interface Person {
  name: string;
  age: number;
  email: string;
}

function updateField<T, K extends keyof T>(obj: T, key: K, value: T[K]): T {
  return { ...obj, [key]: value };
}

const person: Person = { name: "Alice", age: 30, email: "alice@example.com" };
const updated = updateField(person, "age", 31); // ✅
// updateField(person, "age", "31"); // ❌ value 类型应为 number
```

### 3.3 条件类型的约束

```typescript
// 约束类型参数必须在某种条件下
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;

interface Email {
  message: string;
}

interface Dog {
  bark(): void;
}

type EmailMessage = MessageOf<Email>; // string
type DogMessage = MessageOf<Dog>;     // never
```

## 四、多类型参数与参数默认值

### 4.1 多个类型参数

```typescript
// 多个类型参数
function pair<T, U>(first: T, second: U): [T, U] {
  return [first, second];
}

const p1 = pair("hello", 42); // [string, number]
const p2 = pair(1, true);     // [number, boolean]

// 使用多个参数实现更复杂的逻辑
function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
  const length = Math.min(arr1.length, arr2.length);
  const result: [T, U][] = [];
  for (let i = 0; i < length; i++) {
    result.push([arr1[i], arr2[i]]);
  }
  return result;
}

const zipped = zip(["a", "b", "c"], [1, 2, 3]);
// [["a", 1], ["b", 2], ["c", 3]] 类型为 [string, number][]
```

### 4.2 泛型参数默认值

```typescript
// 泛型参数默认值
function createArray<T = string>(length: number, value: T): T[] {
  return Array.from({ length }, () => value);
}

const strArr = createArray(3, "hello"); // string[]（T 推断为 string）
const numArr = createArray<number>(3, 42); // number[]（显式指定）

// 实际应用：配置对象
interface Config<T = "light"> {
  theme: T;
  showSidebar: boolean;
}

type DarkConfig = Config<"dark">;
// { theme: "dark"; showSidebar: boolean; }

type DefaultConfig = Config; // T 默认为 "light"
// { theme: "light"; showSidebar: boolean; }

// 类型参数默认值的规则
// 1. 有默认值的类型参数必须出现在没有默认值的参数之后
function example<T, U = string>(a: T, b?: U): void {} // ✅
// function example2<T = string, U>(a?: T, b: U): void {} // ❌ 编译错误
```

## 五、常用内置工具类型详解

TypeScript 提供了一批基于泛型的内置工具类型。理解它们的实现和用法是 TypeScript 进阶的关键。

### 5.1 Partial\<T\>

将 T 的所有属性变为可选。

```typescript
// 定义（简化版）
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 实际使用
interface User {
  name: string;
  age: number;
  email: string;
}

// 更新用户时，只需要提供部分字段
function updateUser(id: number, updates: Partial<User>): void {
  // 实现更新逻辑
}

updateUser(1, { name: "Alice" }); // ✅ 只需提供需要更新的字段
updateUser(2, { age: 31, email: "new@email.com" }); // ✅
```

### 5.2 Required\<T\>

将所有可选属性变为必选。

```typescript
// 定义
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 使用
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

// 内部处理时，所有配置项都必须存在
function normalizeConfig(config: Required<Config>): Config {
  return config;
}

// normalizeConfig({}); // ❌ 所有属性都是必选的
normalizeConfig({ host: "localhost", port: 3000, debug: false }); // ✅
```

### 5.3 Readonly\<T\>

将 T 的所有属性变为只读。

```typescript
// 定义
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 使用
interface User {
  name: string;
  age: number;
}

const user: Readonly<User> = { name: "Alice", age: 30 };
// user.age = 31; // ❌ Cannot assign to 'age' because it is a read-only property

// 实际场景：不可变状态
type ImmutableState = Readonly<{
  items: string[];
  selectedId: string | null;
}>;
```

### 5.4 Pick\<T, K\>

从 T 中选择一组属性 K 构建新类型。

```typescript
// 定义
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// 使用
interface User {
  name: string;
  age: number;
  email: string;
  password: string;
  createdAt: Date;
}

// 公共用户信息（不包含敏感字段）
type PublicUserInfo = Pick<User, "name" | "email">;
// { name: string; email: string; }

function getPublicUser(user: User): PublicUserInfo {
  return { name: user.name, email: user.email };
}
```

### 5.5 Omit\<T, K\>

从 T 中排除一组属性 K 构建新类型（与 Pick 相反）。

```typescript
// 定义
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// 使用
interface User {
  name: string;
  age: number;
  email: string;
  password: string;
}

// 排除敏感字段
type PublicUser = Omit<User, "password">;
// { name: string; age: number; email: string; }

// 创建用户时不需要 id 和 createdAt
type CreateUserInput = Omit<User, "id" | "createdAt">;
```

### 5.6 Record\<K, V\>

用指定的键类型 K 和值类型 V 构建对象类型。

```typescript
// 定义
type Record<K extends keyof any, V> = {
  [P in K]: V;
};

// 使用
type PageInfo = {
  title: string;
  url: string;
};

type Pages = "home" | "about" | "contact";

const pages: Record<Pages, PageInfo> = {
  home: { title: "Home", url: "/" },
  about: { title: "About", url: "/about" },
  contact: { title: "Contact", url: "/contact" },
};

// 实用场景：枚举映射
enum Color {
  Red = "#ff0000",
  Green = "#00ff00",
  Blue = "#0000ff",
}

type ColorInfo = {
  name: string;
  luminance: number;
};

const colorMap: Record<Color, ColorInfo> = {
  [Color.Red]: { name: "Red", luminance: 0.3 },
  [Color.Green]: { name: "Green", luminance: 0.59 },
  [Color.Blue]: { name: "Blue", luminance: 0.11 },
};
```

### 5.7 Exclude\<T, U\>

从联合类型 T 中排除可以赋值给 U 的类型。

```typescript
// 定义
type Exclude<T, U> = T extends U ? never : T;

// 使用
type T0 = Exclude<"a" | "b" | "c", "a">;               // "b" | "c"
type T1 = Exclude<string | number | boolean, boolean>;  // string | number
type T2 = Exclude<number | null | undefined, null | undefined>; // number
```

### 5.8 Extract\<T, U\>

从联合类型 T 中提取可以赋值给 U 的类型。

```typescript
// 定义
type Extract<T, U> = T extends U ? T : never;

// 使用
type T0 = Extract<"a" | "b" | "c", "a" | "f">; // "a"
type T1 = Extract<string | number | boolean, boolean>; // boolean
```

### 5.9 NonNullable\<T\>

从类型 T 中排除 null 和 undefined。

```typescript
// 定义
type NonNullable<T> = T extends null | undefined ? never : T;

// 使用
type T0 = NonNullable<string | number | undefined>; // string | number
type T1 = NonNullable<null | undefined>; // never

// 实际场景
function processValue<T>(value: T): NonNullable<T> {
  if (value == null) throw new Error("Value is null or undefined");
  return value as NonNullable<T>;
}
```

### 5.10 ReturnType\<T\>

获取函数类型 T 的返回类型。

```typescript
// 定义（简化版）
type ReturnType<T extends (...args: any) => any> = 
  T extends (...args: any) => infer R ? R : any;

// 使用
function createUser(name: string, age: number) {
  return { id: 1, name, age, createdAt: new Date() };
}

type UserType = ReturnType<typeof createUser>;
// { id: number; name: string; age: number; createdAt: Date; }

// 实际场景：保持 API 调用的一致性
async function fetchUser(id: number) {
  const res = await fetch(`/api/users/${id}`);
  return res.json() as Promise<{ id: number; name: string; email: string; }>;
}

type FetchUserReturn = ReturnType<typeof fetchUser>;
// Promise<{ id: number; name: string; email: string; }>
type User = Awaited<FetchUserReturn>;
// { id: number; name: string; email: string; }
```

### 5.11 Parameters\<T\>

获取函数类型 T 的参数类型元组。

```typescript
// 定义
type Parameters<T extends (...args: any) => any> = 
  T extends (...args: infer P) => any ? P : never;

// 使用
function greet(name: string, greeting?: string): string {
  return `${greeting ?? "Hello"}, ${name}!`;
}

type GreetParams = Parameters<typeof greet>;
// [name: string, greeting?: string]

// 实际场景：安全地包装函数
function wrapFunction<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): ReturnType<T> {
  console.log(`Calling ${fn.name} with arguments:`, args);
  return fn(...args);
}

// 使用示例
const result = wrapFunction(greet, "Alice"); // 类型安全
// wrapFunction(greet, "Alice", 42); // ❌ number 不可赋值给 string | undefined
```

### 5.12 所有工具类型速查表

| 工具类型 | 作用 | 示例 |
|---------|------|------|
| `Partial<T>` | 所有属性可选 | `Partial<{a:string,b:number}>` -> `{a?:string,b?:number}` |
| `Required<T>` | 所有属性必选 | `Required<{a?:string}>` -> `{a:string}` |
| `Readonly<T>` | 所有属性只读 | `Readonly<{a:string}>` -> `{readonly a:string}` |
| `Pick<T,K>` | 选取指定属性 | `Pick<{a:string,b:number},'a'>` -> `{a:string}` |
| `Omit<T,K>` | 排除指定属性 | `Omit<{a:string,b:number},'a'>` -> `{b:number}` |
| `Record<K,V>` | 键值对映射 | `Record<'x'\|'y',number>` -> `{x:number,y:number}` |
| `Exclude<T,U>` | 从联合排除 | `Exclude<'a'\|'b','a'>` -> `'b'` |
| `Extract<T,U>` | 从联合提取 | `Extract<'a'\|'b','a'>` -> `'a'` |
| `NonNullable<T>` | 排除 null/undefined | `NonNullable<string\|null>` -> `string` |
| `ReturnType<T>` | 函数返回类型 | `ReturnType<()=>boolean>` -> `boolean` |
| `Parameters<T>` | 函数参数元组 | `Parameters<(a:string)=>void>` -> `[string]` |

> **面试要点**：面试中常见的考察点是让你**手写实现**某个工具类型（特别是 Pick、ReturnType、Exclude 等）。关键不在于死记硬背，而是理解 mapped types、conditional types 和 infer 的使用。

## 六、条件类型与泛型

条件类型是 TypeScript 中最强大的高级特性之一。它允许根据条件选择不同的类型。

### 6.1 基本条件类型

```typescript
// 基本语法：T extends U ? X : Y
type IsString<T> = T extends string ? true : false;

type A = IsString<"hello">; // true
type B = IsString<42>;      // false
type C = IsString<string>;  // true

// 条件类型在泛型中的应用
type TypeName<T> = 
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends bigint ? "bigint" :
  T extends symbol ? "symbol" :
  T extends Function ? "function" :
  "object";

type T0 = TypeName<string>;  // "string"
type T1 = TypeName<true>;    // "boolean"
type T2 = TypeName<()=>void>; // "function"
type T3 = TypeName<Date>;    // "object"
```

### 6.2 infer 关键字

`infer` 允许在条件类型的 `extends` 子句中声明一个待推断的类型变量：

```typescript
// 提取函数返回类型
type ReturnTypeOriginal<T> = T extends (...args: any[]) => infer R ? R : never;

type FN = () => number;
type R = ReturnTypeOriginal<FN>; // number

// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : T;

type E1 = ElementType<string[]>; // string
type E2 = ElementType<number[]>; // number
type E3 = ElementType<"hello">;  // "hello"（不是数组，返回自身）

// 提取 Promise 的 resolve 类型
type Unwrap<T> = T extends Promise<infer U> ? U : T;

type P1 = Unwrap<Promise<string>>; // string
type P2 = Unwrap<Promise<Promise<number>>>; // Promise<number>（浅层展开）

// 深层展开
type DeepUnwrap<T> = T extends Promise<infer U> ? DeepUnwrap<U> : T;
type P3 = DeepUnwrap<Promise<Promise<number>>>; // number

// 提取函数第一个参数的类型
type FirstParam<T> = T extends (arg: infer P, ...args: any[]) => any ? P : never;

type F1 = FirstParam<(name: string, age: number) => void>; // string
```

### 6.3 分布式条件类型

当条件类型用于泛型，且类型参数是联合类型时，条件类型会**分布**到联合类型的每个成员上：

```typescript
// 分布式条件类型会自动展开联合类型
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// string[] | number[]（分布后，每个分支独立）
// 等价于：ToArray<string> | ToArray<number>

// 如果不希望分布，可以用元组包装
type ToArrayNonDist<T> = [T] extends [any] ? T[] : never;
type Result2 = ToArrayNonDist<string | number>;
// (string | number)[]（不分布，整个联合作为整体）

// Exclude 的实现利用了分布式特性
type MyExclude<T, U> = T extends U ? never : T;
type Excluded = MyExclude<"a" | "b" | "c", "a">;
// 分布过程：
// "a" extends "a" ? never : "a" -> never
// "b" extends "a" ? never : "b" -> "b"
// "c" extends "a" ? never : "c" -> "c"
// 结果："b" | "c"
```

### 6.4 条件类型实战

```typescript
// 1. 根据配置切换类型
type HTTPResponse<T extends "json" | "text"> = 
  T extends "json" ? Record<string, unknown> : string;

async function fetchData<T extends "json" | "text">(
  url: string,
  format: T
): Promise<HTTPResponse<T>> {
  const res = await fetch(url);
  if (format === "json") {
    return res.json() as HTTPResponse<T>;
  }
  return res.text() as HTTPResponse<T>;
}

// 2. 函数重载替代
type CalcFunction<T extends "add" | "subtract"> = 
  T extends "add" ? (a: number, b: number) => number :
  T extends "subtract" ? (a: number, b: number) => number :
  never;

// 3. 基于输入筛选输出
type FilterString<T> = T extends string ? T : never;
type StringsOnly = FilterString<"hello" | 42 | true | "world">; // "hello" | "world"
```

## 七、泛型的常见陷阱与最佳实践

### 7.1 常见陷阱

```typescript
// 陷阱 1：滥用泛型
// ❌ 没有必要的地方用泛型
function echo<T>(value: T): T { return value; }
// 这等同于 function echo(value: any): any
// 因为没有约束也没有对 T 的操作

// ✅ 只在需要保持类型关系时使用泛型

// 陷阱 2：类型推断不工作
function parseArray<T>(arr: T[]): T[] {
  return arr;
}
// ✅ TypeScript 可以推断
const result1 = parseArray([1, 2, 3]); // number[]

// ❌ 在某些复杂场景下，TypeScript 无法推断
// 这时需要显式指定类型参数
// parseArray<number>([1, 2, 3]);

// 陷阱 3：约束过于宽松
function getLengthBad<T>(arg: T): number {
  // return arg.length; // ❌ 编译错误
  return 0;
}

// ✅ 适当约束
function getLengthGood<T extends { length: number }>(arg: T): number {
  return arg.length;
}

// 陷阱 4：泛型箭头函数在 JSX 中的语法
// 下面代码在 .tsx 文件中会报错
// const foo = <T>(x: T) => x; // ❌ 与 JSX 标签混淆

// ✅ 正确写法
const foo = <T extends unknown>(x: T) => x;
const foo2 = <T,>(x: T) => x;
```

### 7.2 最佳实践

```typescript
// 1. 在类型参数上提供有意义的名称
// ❌ 使用单个字母（简单场景可接受）
function identity<T>(arg: T): T { return arg; }

// ✅ 复杂场景应该用有意义的名称
function createKeyValueStore<Key extends string, Value>(
  initialKey: Key,
  initialValue: Value
): Map<Key, Value> {
  const store = new Map<Key, Value>();
  store.set(initialKey, initialValue);
  return store;
}

// 2. 尽可能让 TypeScript 推断类型，而不是显式指定
// ❌ 显式指定
const arr1 = identity<number[]>([1, 2, 3]);

// ✅ 让 TS 推断
const arr2 = identity([1, 2, 3]);

// 3. 用 extends 做必要约束
// ❌ 约束不足
function processObj<T>(obj: T): string {
  return obj.toString(); // 可以，但不准确
}

// ✅ 明确约束
function processObj2<T extends { name: string }>(obj: T): string {
  return obj.name;
}

// 4. 避免过多类型参数
// ❌ 过多
function complex<T, U, V, W>(a: T, b: U, c: V): W {
  // ...
}

// ✅ 精简
function simple<T, U>(a: T, b: U): [T, U] {
  return [a, b];
}
```

## 八、总结

泛型是 TypeScript 类型系统的核心骨架。理解和掌握泛型是从 TypeScript 初学者到高级开发者最重要的跨越。

### 掌握路线图

```
基础级别
  ├── 泛型函数语法 <T>
  ├── 泛型接口和类型别名
  ├── 泛型类
  └── 基本的 extends 约束

进阶级别
  ├── extends keyof 约束
  ├── 多类型参数和默认值
  ├── 内置工具类型
  └── 泛型参数约束

高级级别
  ├── 条件类型 extends ? :
  ├── infer 类型推断
  ├── 分布式条件类型
  ├── 模板字面量类型
  └── 自定义工具类型
```

### 面试高频题

**Q1: 泛型解决了什么问题？**
A: 在保持类型安全的前提下编写可复用的代码。核心是保持输入类型和输出类型之间的关系。

**Q2: `Partial<T>` 是如何实现的？**
A: `type Partial<T> = { [P in keyof T]?: T[P] }`。使用映射类型遍历 T 的所有属性，加 `?` 使其可选。

**Q3: `ReturnType<T>` 是如何实现的？**
A: `type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any`。使用条件类型和 `infer` 推断函数的返回类型。

**Q4: 什么是分布式条件类型？**
A: 当条件类型的检查类型是泛型且传入联合类型时，条件类型会分布到联合类型的每个成员上分别计算，最后合并结果。

**Q5: `Exclude<T, U>` 的实现原理？**
A: `type Exclude<T, U> = T extends U ? never : T`。利用分布式条件类型，从 T 中移除所有 U 的子类型。
