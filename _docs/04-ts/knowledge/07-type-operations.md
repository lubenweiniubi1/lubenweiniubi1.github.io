# 类型操作与工具类型

## 一、引言

你有一个 User 类型，你的更新函数只接受 User 的部分字段。你不想把 20 个字段都写成可选的——怎么让 TypeScript 自动生成一个新类型？这就是 `Partial<T>` 做的事情，而它的背后就是类型操作。

---

## 二、keyof 操作符

当你需要限制一个参数为某个对象的所有键时，手工写 `'name' | 'age' | 'email'` 很蠢——加个字段就得改。`keyof` 自动帮你干这件事。

### 2.1 基础用法

`keyof` 操作符返回一个类型上所有公共属性键的联合类型（union）。它是 TypeScript 类型查询的核心操作之一。

```typescript
interface Person {
  name: string;
  age: number;
  email: string;
}

// type PersonKeys = "name" | "age" | "email"
type PersonKeys = keyof Person;

function getProperty(obj: Person, key: PersonKeys): unknown {
  return obj[key];
}
```

对于数组类型，`keyof` 返回数组的方法和属性名（如 `"length"`、`"push"`、`"pop"` 等）。

```typescript
type ArrayKeys = keyof any[];  // number | "length" | "toString" | "push" | ...
```

### 2.2 与泛型结合

`keyof` 最常见的用途是与泛型约束结合，实现类型安全的属性访问函数：

```typescript
function getValue<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const person: Person = { name: "Alice", age: 30, email: "alice@example.com" };
const name = getValue(person, "name"); // 类型为 string
const age = getValue(person, "age");   // 类型为 number
// getValue(person, "invalid"); // ❌ 编译错误
```

### 2.3 映射类型中的 keyof

`keyof` 在映射类型中用于遍历对象的所有键：

```typescript
type Readonly<T> = {
  readonly [K in keyof T]: T[K];
};

type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};
```

### 2.4 条件类型中的 keyof

```typescript
// 提取所有函数类型的属性名
type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? K : never;
}[keyof T];

interface Example {
  id: number;
  getName: () => string;
  setName: (name: string) => void;
}

type ExampleFunctionKeys = FunctionKeys<Example>; // "getName" | "setName"
```

> **面试提示**：理解 `{ [K in keyof T]: ... }[keyof T]` 这个模式是掌握高级类型体操的关键。它先创建一个映射类型，然后用 `[keyof T]` 索引获取所有值的联合。

---

## 三、typeof 操作符

你在 JavaScript 里用过 `typeof`，但 TypeScript 在类型层面也有 `typeof`——它能从已有的变量反推出类型。写测试的时候，如果手动声明一个和变量结构一样的类型，改了一处忘了改另一处就会不一致。

### 3.1 获取值的类型

`typeof` 在类型上下文中用于获取一个值的 TypeScript 类型：

```typescript
const person = { name: "Bob", age: 25 };
type PersonType = typeof person; // { name: string; age: number; }

const greet = (name: string) => `Hello, ${name}`;
type GreetType = typeof greet; // (name: string) => string
```

### 3.2 获取类类型

对于类，`typeof` 获取的是构造函数类型，而非实例类型：

```typescript
class User {
  constructor(public name: string, public age: number) {}
}

type UserInstance = User;       // 实例类型
type UserConstructor = typeof User; // typeof User（构造函数类型）

function createUser(ctor: typeof User, name: string, age: number) {
  return new ctor(name, age);
}
```

### 3.3 与 keyof 组合

这是实际开发中非常高频的实用模式 —— 获取一个对象的键的联合类型：

```typescript
const CONFIG = {
  api: "https://api.example.com",
  timeout: 5000,
  retryCount: 3,
  debug: false,
} as const;

type ConfigKeys = keyof typeof CONFIG; // "api" | "timeout" | "retryCount" | "debug"
type ConfigValues = typeof CONFIG[keyof typeof CONFIG]; // "https://api.example.com" | 5000 | 3 | false
```

```typescript
// 实际应用：类型安全的国际化键
const i18n = {
  title: "欢迎",
  description: "这是一个示例",
  button: { submit: "提交", cancel: "取消" },
} as const;

type I18nKeys = keyof typeof i18n;  // "title" | "description" | "button"
type I18nValue = typeof i18n[keyof typeof i18n]; // string | { readonly submit: string; readonly cancel: string }
```

> **常见陷阱**：`typeof obj` 获取的是对象当前的类型结构。如果对象有可选属性或动态属性，`typeof` 会精确反映。搭配 `as const` 可以获得最精确的字面量类型。

---

## 四、索引访问类型（Indexed Access Types）

keyof 拿到了键，那怎么拿到键对应的值的类型？用索引访问。它是类型版的 `obj[key]`，让你从类型中提取某个属性的类型。

### 4.1 基础语法

索引访问类型允许我们通过索引来获取类型的某个属性的类型：

```typescript
interface Person {
  name: string;
  age: number;
  address: {
    city: string;
    zip: string;
  };
}

type NameType = Person["name"];       // string
type AddressType = Person["address"]; // { city: string; zip: string }
type ZipType = Person["address"]["zip"]; // string
```

### 4.2 联合索引

使用联合类型进行索引，可以一次性获取多个属性的类型：

```typescript
type NameOrAge = Person["name" | "age"]; // string | number
type AllValues = Person[keyof Person];    // string | number | { city: string; zip: string }
```

### 4.3 与泛型结合

```typescript
function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): void {
  obj[key] = value;
}

const p: Person = { name: "Alice", age: 30, address: { city: "北京", zip: "100000" } };
setProperty(p, "name", "Bob");    // 正确
setProperty(p, "age", 31);        // 正确
// setProperty(p, "name", 123);   // ❌ 类型错误：number 不能赋值给 string
```

### 4.4 数组元素的索引访问

```typescript
type StringArray = string[];
type ItemType = StringArray[number]; // string

type Tuple = [string, number, boolean];
type First = Tuple[0]; // string
type Length = Tuple["length"]; // 3
type All = Tuple[number]; // string | number | boolean
```

> **面试提示**：面试中常问 `T[K]` 中 K 是联合类型时的行为。理解 `T["a" | "b"]` 等价于 `T["a"] | T["b"]` 是基础，进阶问题会考察 `T[keyof T]` 在复杂类型中的应用。

---

## 五、类型断言

索引访问能安全地提取类型，但有时你比 TypeScript 更清楚一个值的具体类型——比如 `document.getElementById` 返回 `HTMLElement | null`，但你确定它存在且是输入框。类型断言就是你的"我确认，相信我"手段。

### 5.1 两种语法

```typescript
// 语法 1：as 语法（推荐）
const value = someFunction();
const len = (value as string).length;

// 语法 2：尖括号语法（JSX 中不可用）
const len2 = (<string>value).length; // 在 .tsx 文件中会报错
```

### 5.2 何时使用类型断言

```typescript
// 场景 1：明确比 TypeScript 更了解类型
const input = document.getElementById("myInput") as HTMLInputElement;
input.value = "Hello";

// 场景 2：缩小联合类型的范围
const event = { type: "click", x: 100, y: 200 } as const;
type EventType = typeof event["type"]; // "click"

// 场景 3：处理 JSON.parse 的返回类型
const data = JSON.parse('{"name":"Alice"}') as { name: string };
```

### 5.3 双重断言

```typescript
// 特殊情况：先断言为 unknown/any，再断言为目标类型
const value: string = "123";
const num = value as unknown as number; // 双重断言

// 直接断言会报错：
// const num2 = value as number; // ❌ 错误：类型 "string" 到类型 "number" 的转换可能是错误的
```

### 5.4 断言的风险

```typescript
// ❌ 危险：类型断言会绕过类型检查
const userInput = "not a number";
const age = userInput as unknown as number;
// age 在运行时是字符串，但 TypeScript 认为它是 number

// ❌ 危险：过度断言隐藏真实问题
function fetchData(): Promise<any> {
  return fetch("/api/data").then(res => res.json());
}

// 错误的断言
const data = await fetchData() as { id: number; name: string };
// 如果返回的数据中 name 不存在，运行时还是 undefined
```

> **最佳实践**：类型断言应作为"告诉 TypeScript 我知道得更多"的手段，而不是"绕过类型检查"的捷径。能用类型注解解决的问题就不要用断言。

---

## 六、as const 断言

类型断言的问题在于它不做检查——你说是什么就是什么。那有没有一种方式，既保留字面量信息，又不需要手动标注？`as const` 就是答案。

### 6.1 字面量类型收窄

`as const` 将值的类型收窄到最精确的字面量类型：

```typescript
// 没有 as const
const greeting1 = "hello"; // type: string

// 有 as const
const greeting2 = "hello" as const; // type: "hello"

// 对象
const person = {
  name: "Alice",
  role: "admin",
} as const;
// type: { readonly name: "Alice"; readonly role: "admin"; }
```

### 6.2 数组转元组

```typescript
// 普通数组
const arr1 = [1, 2, 3]; // type: number[]

// as const 数组 → readonly 元组
const arr2 = [1, 2, 3] as const; // type: readonly [1, 2, 3]

// 实际应用
const COLORS = ["red", "green", "blue"] as const;
type Color = typeof COLORS[number]; // "red" | "green" | "blue"

// 函数参数使用元组
function paint(color: Color): void {
  console.log(`Painting ${color}`);
}
paint("red");   // 正确
// paint("yellow"); // ❌ 错误
```

### 6.3 深度只读

```typescript
const config = {
  server: {
    host: "localhost",
    port: 8080,
  },
  debug: true,
} as const;

// config.server.host = "newhost"; // ❌ 只读错误
// config.debug = false;           // ❌ 只读错误

// 类型等价于：
// {
//   readonly server: { readonly host: "localhost"; readonly port: 8080; };
//   readonly debug: true;
// }
```

> **常见陷阱**：`as const` 作用于对象时是**深度**只读。如果只想要浅层字面量推断，需要手动定义类型。

---

## 七、satisfies 关键字（TS 4.9+）

`as const` 保留了字面量类型，但如果你还想验证这个值是否符合某个接口呢？类型注解会拓宽类型，`as` 又跳过检查。`satisfies` 完美填补了这个缺口——既检查类型，又保留最精确的推断。

### 7.1 解决的问题

`satisfies` 检查一个值的类型是否符合某个类型，但**不会改变值的推断类型**：

```typescript
// 没有 satisfies 的问题：
type Color = "red" | "green" | "blue";
type Config = Record<string, string>;

const palette1: Record<string, Color> = {
  primary: "red",
  secondary: "blue",
};
// palette1.primary.toUpperCase(); // ❌ palette1.primary 是 string 类型（被拓宽了）

// 使用 satisfies：
const palette2 = {
  primary: "red",
  secondary: "blue",
} satisfies Record<string, Color>;

palette2.primary.toUpperCase(); // ✅ primary 类型是 "red"，有 toUpperCase()
// palette2.tertiary = "yellow"; // ❌ 如果 "yellow" 不是 Color 则会报错
```

### 7.2 实际场景

```typescript
// 场景 1：保留精确的字面量类型
const routes = {
  home: "/",
  about: "/about",
  contact: "/contact",
} satisfies Record<string, string>;

// routes.home 类型是 "/"，不是 string
// 同时确保所有值都是 string

// 场景 2：检查对象结构但不丢失类型信息
interface Person {
  name: string;
  age: number;
  address?: string;
}

const alice = {
  name: "Alice",
  age: 30,
  address: "123 Street",
  // extraProp: "test", // ❌ satisfies 会检查多余属性（像类型注解一样）
} satisfies Person;

// 场景 3：映射类型检查
type StringMap<T> = { [K in keyof T]: string };

const config = {
  name: "app",
  version: "1.0",
  env: "production",
} satisfies StringMap<typeof config>;
```

### 7.3 satisfies vs 类型注解 vs as 对比

| 特性 | 类型注解 `: Type` | `satisfies Type` | `as Type` |
|------|------------------|-----------------|-----------|
| 类型检查 | 检查值是否符合类型 | 检查值是否符合类型 | 不检查（断言） |
| 改变推断类型 | 是（拓宽为注解类型） | 否（保留原始推断） | 是（断言为指定类型） |
| 多余属性检查 | 是 | 是 | 否 |
| 运行时影响 | 无 | 无 | 无 |
| 适用场景 | 变量类型声明 | 需要类型检查但不拓宽类型 | 比 TS 更了解类型时 |

```typescript
const obj = { name: "hello", extra: true };

// 类型注解：obj1 的类型是 { name: string }
const obj1: { name: string } = obj; // ✅ 但 extra 可赋值，只是不能通过 obj1.extra 访问

// satisfies：obj2 的类型是 { name: string; extra: boolean }
const obj2 = obj satisfies { name: string }; // ✅

// as：obj3 的类型是 { name: string }，但未检查 extra
const obj3 = obj as { name: string }; // ✅ 不检查，但 obj3.extra 访问不安全
```

> **面试提示**：`satisfies` 是 TS 4.9 引入的重要特性，面试中可能会问它解决了什么问题。核心答案是：它让你在保留最精确推断类型的同时，进行类型验证。

---

## 八、索引签名（Index Signatures）

以上都是针对已知属性的操作。那如果一个对象你不知道具体的键是什么，只知道值的类型呢？索引签名就是为这种"动态字典"场景准备的。

### 8.1 基础语法

```typescript
// 字符串索引签名
interface StringDictionary {
  [key: string]: string;
}

const dict: StringDictionary = {
  hello: "你好",
  world: "世界",
};
dict.foo = "bar"; // 正确
// dict.num = 123; // ❌ 错误：number 不能赋值给 string
```

### 8.2 数字索引签名

```typescript
interface NumberDictionary {
  [index: number]: string;
}

const arr: NumberDictionary = ["a", "b", "c"];
// JavaScript 中数字索引会被转换为字符串，所以 string 索引也必须兼容
```

### 8.3 与已知属性组合

在 TypeScript 中，如果同时有已知属性和索引签名，已知属性的类型必须是索引签名类型的子类型：

```typescript
// ✅ 正确：number 可赋值给 string | number
interface Dictionary {
  [key: string]: string | number;
  length: number;
  name: string;
}

// ❌ 错误：boolean 不能赋值给 string
interface BadDictionary {
  [key: string]: string;
  isReady: boolean; // 类型不兼容
}
```

### 8.4 使用 Record 工具类型

```typescript
// Record<K, V> 是索引签名的简便写法
type Config = Record<string, string | number>;

// 等价于：
// type Config = { [key: string]: string | number };
```

> **常见陷阱**：索引签名的一个限制是不能使用联合类型作为键类型：

```typescript
// ❌ 错误：索引签名参数类型必须是 'string'、'number'、'symbol' 或模板字面量类型
// interface BadIndex {
//   [key: "a" | "b"]: string;
// }

// ✅ 正确：使用 Record
type GoodIndex = Record<"a" | "b", string>;
```

---

## 九、实用工具类型深入解析

前面都是"操作符层级"的类型操作——keyof、typeof、索引访问。接下来是 TypeScript 内置的工具类型，它们由这些操作符组合而成，直接解决日常开发中的常见需求。

### 9.1 Partial\<T\>

将所有属性变为可选：

```typescript
// 实现
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

interface User {
  name: string;
  age: number;
  email: string;
}

// 常用于 update 函数的参数
function updateUser(id: number, changes: Partial<User>): void {
  // 只更新传入的字段
}
updateUser(1, { name: "new name" }); // 只需要传入要修改的字段
```

### 9.2 Required\<T\>

将所有可选属性变为必选：

```typescript
type MyRequired<T> = {
  [K in keyof T]-?: T[K];
};
```

### 9.3 Readonly\<T\>

将所有属性变为只读：

```typescript
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

### 9.4 Pick\<T, K\>

从类型中选取一组属性：

```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};

type UserName = Pick<User, "name" | "email">;
// { name: string; email: string; }
```

### 9.5 Omit\<T, K\>

从类型中移除一组属性（与 Pick 相反）：

```typescript
// 实现原理
type MyOmit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

type UserWithoutAge = Omit<User, "age">;
// { name: string; email: string; }
```

### 9.6 Exclude\<T, U\>

从联合类型 T 中排除可以赋值给 U 的类型：

```typescript
type MyExclude<T, U> = T extends U ? never : T;

type T1 = Exclude<"a" | "b" | "c", "a" | "b">; // "c"
type T2 = Exclude<string | number | boolean, string>; // number | boolean
```

### 9.7 Extract\<T, U\>

从联合类型 T 中提取可以赋值给 U 的类型：

```typescript
type MyExtract<T, U> = T extends U ? T : never;

type T3 = Extract<"a" | "b" | "c", "a" | "b">; // "a" | "b"
type T4 = Extract<string | number | boolean, boolean>; // boolean
```

### 9.8 NonNullable\<T\>

从类型中排除 null 和 undefined：

```typescript
type MyNonNullable<T> = T extends null | undefined ? never : T;

type T5 = NonNullable<string | null | undefined>; // string
```

### 9.9 ReturnType\<T\>

获取函数类型的返回值类型：

```typescript
type MyReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : any;

type Fn = (x: number) => string;
type R = ReturnType<Fn>; // string
```

### 9.10 Parameters\<T\> 和 ConstructorParameters\<T\>

```typescript
type MyParameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : any;

type FnParams = Parameters<(name: string, age: number) => void>; // [string, number]
```

---

## 十、自定义高级工具类型

### 10.1 Merge 类型

什么时候需要：当你有一个基础类型（比如数据库模型的公共字段），要在不同场景下覆盖或追加字段时。`Merge<Base, Overrides>` 让你不用手写交叉类型。

合并两个类型，B 的属性覆盖 A 的同名属性：

```typescript
type Merge<A, B> = Omit<A, keyof B> & B;

interface Base {
  id: number;
  name: string;
  createdAt: Date;
}

interface Overrides {
  name: number; // 覆盖 name 的类型
  extra: boolean; // 新增属性
}

type Merged = Merge<Base, Overrides>;
// { id: number; createdAt: Date; name: number; extra: boolean; }
```

### 10.2 Overwrite 类型

什么时候需要：Merge 用 `&` 交集，在属性冲突时的行为有时不如映射类型直观。Overwrite 明确只保留 T 中已有的键，不会引入 U 特有的键。

与 Merge 类似，但使用映射类型实现，不依赖交集类型：

```typescript
type Overwrite<T, U> = {
  [K in keyof T]: K extends keyof U ? U[K] : T[K];
};

interface Original {
  name: string;
  age: number;
  email: string;
}

interface PartialOverwrite {
  age: string;
  phone?: string;
}

type Overwritten = Overwrite<Original, PartialOverwrite>;
// { name: string; age: string; email: string; }
// 注意：phone 不会出现在结果中，因为 Overwrite 只处理 T 中已有的键
```

### 10.3 DeepReadonly

什么时候需要：`Readonly<T>` 只做浅层只读，嵌套对象依然能被修改。DeepReadonly 递归地将所有层级变为只读——适合配置对象、不可变状态树等场景。

递归地将所有属性变为只读：

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepReadonly<T[K]>
    : T[K];
};

interface Nested {
  name: string;
  config: {
    host: string;
    port: number;
    nested: {
      value: string;
    };
  };
}

type ReadonlyNested = DeepReadonly<Nested>;
// 所有层级的属性都变成 readonly
```

### 10.4 DeepPartial

什么时候需要：和 DeepReadonly 同理——`Partial<T>` 只做浅层可选。当你的深层嵌套数据结构只在部分层级有值时（比如部分更新配置），DeepPartial 就派上用场了。

递归地将所有属性变为可选：

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? T[K] extends Function
      ? T[K]
      : DeepPartial<T[K]>
    : T[K];
};

type PartialNested = DeepPartial<Nested>;
// 所有层级的所有属性都变为可选
```

### 10.5 条件类型链

什么时候需要：你想根据输入类型的不同输出不同的类型——类似 JavaScript 的 `switch`。条件类型链把这种"类型分支"逻辑表达出来。

```typescript
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<"hello">; // "yes"
type B = IsString<42>;      // "no"

// 多条件链
type TypeName<T> =
  T extends string ? "string" :
  T extends number ? "number" :
  T extends boolean ? "boolean" :
  T extends undefined ? "undefined" :
  T extends Function ? "function" :
  "object";

type TStr = TypeName<string>; // "string"
type TNum = TypeName<number>; // "number"
type TObj = TypeName<{ a: 1 }>; // "object"
```

### 10.6 infer 关键字

什么时候需要：你有一个复杂的类型（比如 `Promise<string>`），想从中提取内部的类型（`string`）。`infer` 就是条件类型里的"模式匹配"工具——声明一个待推断的类型变量，让 TypeScript 自动推导。

`infer` 用于在条件类型中推断类型变量：

```typescript
// 提取 Promise 的内部类型
type Unwrap<T> = T extends Promise<infer U> ? U : T;
type Unwrapped = Unwrap<Promise<string>>; // string

// 提取数组元素类型
type ElementType<T> = T extends (infer U)[] ? U : T;
type El = ElementType<number[]>; // number

// 提取函数第一个参数类型
type FirstArg<T> = T extends (first: infer F, ...args: any[]) => any ? F : never;
type FA = FirstArg<(name: string, age: number) => void>; // string
```

---

## 十一、常见陷阱

### 11.1 过度使用类型断言

```typescript
// ❌ 错误做法
const data: any = { name: "Alice" };
const age = (data as { age: number }).age; // 运行时是 undefined，编译时是 number

// ✅ 正确做法：使用类型守卫或运行时验证
interface UserData {
  name: string;
  age?: number;
}

function isUserData(obj: any): obj is UserData {
  return obj && typeof obj.name === "string";
}

if (isUserData(data)) {
  console.log(data.name); // 类型安全
}
```

### 11.2 satisfies 的版本问题

`satisfies` 在 TypeScript 4.9 中引入，旧版本不支持：

```typescript
// ❌ 在 TS < 4.9 中编译错误
const obj = { name: "test" } satisfies { name: string };

// ✅ 兼容方式：使用类型注解或额外的变量
const _check: { name: string } = { name: "test" };
```

### 11.3 索引签名的性能陷阱

```typescript
// ❌ 过多使用宽泛的索引签名
interface Loose {
  [key: string]: any;
}

// ✅ 使用更精确的类型
interface Tight {
  [key: string]: string | number;
}
```

---

## 十二、面试指南

### 常见面试题

**Q1**: `keyof` 和 `typeof` 组合使用时返回什么？

```typescript
const obj = { a: 1, b: "hello" };
type Keys = keyof typeof obj; // "a" | "b"
```

**Q2**: 实现一个 `DeepReadonly` 类型。

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Record<string, unknown>
    ? DeepReadonly<T[P]>
    : T[P];
};
```

**Q3**: 类型断言为什么是危险的？

答：类型断言告诉 TypeScript "相信我，我知道这个类型"，跳过了类型检查。如果断言错误，运行时可能产生意外行为。

**Q4**: `satisfies` 和类型注解有什么区别？

答：类型注解会拓宽值的推断类型，而 `satisfies` 只做类型检查，保留最精确的原始推断类型。

### 学习建议

1. **基础阶段**：熟练掌握 `keyof`、`typeof`、索引访问类型的使用
2. **进阶阶段**：理解映射类型、条件类型、`infer` 推断
3. **高级阶段**：能够编写自定义工具类型如 `DeepReadonly`、`Merge` 等
4. **实战阶段**：在大型项目中应用类型体操简化代码、提高安全性

---

## 总结

类型操作和工具类型是 TypeScript 类型系统的精髓。从 `keyof` 和 `typeof` 的基础查询，到 `as const` 和 `satisfies` 的精细控制，再到自定义高级工具类型的组合，掌握这些能力能让你写出类型更安全、代码更优雅的 TypeScript 程序。记住：类型系统的目标是提高代码质量和开发效率，而不是炫技。合理使用类型操作，让你的代码既有表现力又有安全性。
