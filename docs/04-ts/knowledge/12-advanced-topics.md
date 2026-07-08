# TypeScript 进阶话题

## 一、this 在 TypeScript 中

### 1.1 JavaScript 的 this 问题

JavaScript 的 `this` 在运行时才确定，取决于函数的调用方式。这是 JS 中最容易出错的概念之一：

```javascript
// JavaScript 中 this 的动态绑定
const user = {
  name: 'Alice',
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

const greet = user.greet;
greet(); // Hello, I'm undefined（this 指向全局对象或 undefined）

// 回调中的 this 丢失
setTimeout(user.greet, 100); // Hello, I'm undefined
```

### 1.2 TypeScript 的 this 参数

TypeScript 通过 **`this` 参数**来固定函数的 `this` 类型：

```typescript
// this 参数是一个"假参数"，编译后被擦除
interface User {
  name: string;
}

function greet(this: User) {
  console.log(`Hello, I'm ${this.name}`);
}

const user: User = { name: 'Alice' };

greet.call(user);    // ✅ 正确：this 是 User 类型
greet();             // ❌ 错误：this 是 void，不能赋值给 User

// 将函数赋值给对象方法
const user2 = { name: 'Bob', greet };
user2.greet();       // ✅ 正确：调用时 this 是 user2
```

### 1.3 this 在回调中的问题

```typescript
class MyClass {
  name = 'MyClass';
  
  // ❌ 糟糕的做法：this 类型不安全
  onTimeout() {
    console.log(this.name); // this: any 或 undefined
  }
  
  // ✅ 方法一：箭头函数（捕获定义时的 this）
  onTimeoutArrow = () => {
    console.log(this.name); // this 正确绑定
  }
  
  // ✅ 方法二：显式 this 参数（但不能用于回调）
  onTimeoutExplicit(this: MyClass) {
    console.log(this.name);
  }
}

const obj = new MyClass();
setTimeout(obj.onTimeoutArrow, 100);      // ✅ "MyClass"
setTimeout(obj.onTimeout, 100);           // ❌ undefined（严格模式）
setTimeout(() => obj.onTimeoutExplicit(), 100); // ✅
```

### 1.4 this 类型在流畅 API 中

```typescript
// Fluent API（链式调用）的 this 返回类型
class QueryBuilder {
  private conditions: string[] = [];
  
  where(condition: string): this {
    this.conditions.push(condition);
    return this; // 返回 this，保持子类的类型
  }
  
  orderBy(field: string): this {
    this.conditions.push(`ORDER BY ${field}`);
    return this;
  }
  
  build(): string {
    return this.conditions.join(' ');
  }
}

class ExtendedQueryBuilder extends QueryBuilder {
  limit(n: number): this {
    this.conditions.push(`LIMIT ${n}`);
    return this;
  }
}

const query = new ExtendedQueryBuilder()
  .where('age > 18')
  .orderBy('name')
  .limit(10)   // ✅ limit 可用，因为 where/orderBy 返回 this（即 ExtendedQueryBuilder）
  .build();
```

> **面试要点**：`this` 参数是 TypeScript 独有的特性，JavaScript 中没有。它不在运行时产生任何作用（编译时被擦除），但能让编译器在调用时检查 `this` 的类型是否正确。

## 二、函数重载（Function Overloads）

### 2.1 什么是函数重载？

函数重载允许一个函数拥有多个**调用签名（Call Signatures）**，根据传入参数的不同（数量或类型），返回不同的类型。

```typescript
// 重载签名（Overload Signatures）— 只有类型，没有实现
function double(value: string): string;
function double(value: number): number;
function double(value: boolean): boolean;

// 实现签名（Implementation Signature）— 包含实际逻辑
function double(value: string | number | boolean): string | number | boolean {
  if (typeof value === 'string') {
    return value + value;
  }
  if (typeof value === 'number') {
    return value * 2;
  }
  return value || value; // 布尔值
}

// 使用
const strResult = double('hello');  // 类型为 string
const numResult = double(21);       // 类型为 number
const boolResult = double(true);    // 类型为 boolean
```

### 2.2 重载解析顺序

重载签名的顺序很重要——TypeScript 按**声明顺序**尝试匹配：

```typescript
// ✅ 正确顺序：更具体的重载在前
function format(input: Date, locale?: string): string;
function format(input: number, options?: { decimals: number }): string;
function format(input: string, uppercase?: boolean): string;
function format(input: any, param?: any): string {
  // 实现
  return '';
}

// ❌ 错误顺序：通用重载在前会"遮蔽"后面的特化重载
function format(input: any, param?: any): string; // 这个会匹配所有调用
function format(input: Date, locale?: string): string; // 永远不会被匹配到
function format(input: number, options?: { decimals: number }): string;
// 实现签名...
```

### 2.3 常见场景：不同参数返回不同类型

```typescript
// 场景：获取坐标，可以传对象、两个数、或数组
interface Point {
  x: number;
  y: number;
}

// 重载签名
function getCoordinate(point: Point): Point;
function getCoordinate(x: number, y: number): Point;
function getCoordinate(coords: [number, number]): Point;

// 实现签名
function getCoordinate(
  arg1: Point | number | [number, number],
  arg2?: number
): Point {
  if (typeof arg1 === 'object' && Array.isArray(arg1)) {
    return { x: arg1[0], y: arg1[1] };
  }
  if (typeof arg1 === 'object') {
    return { x: arg1.x, y: arg1.y };
  }
  return { x: arg1, y: arg2! };
}

// 使用
getCoordinate({ x: 1, y: 2 });  // ✅ Point → Point
getCoordinate(1, 2);            // ✅ number, number → Point
getCoordinate([1, 2]);          // ✅ tuple → Point
```

### 2.4 条件类型替代重载

在某些场景，条件类型（Conditional Types）可以替代函数重载：

```typescript
// 使用重载
function getProperty<T, K1 extends keyof T>(obj: T, key: K1): T[K1];
function getProperty<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  obj: T, key1: K1, key2: K2
): T[K1][K2];

// 使用条件类型（更灵活）
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K];
function getProperty<T, K1 extends keyof T, K2 extends keyof T[K1]>(
  obj: T, key1: K1, key2: K2
): T[K1][K2];
```

### 2.5 常见陷阱

```typescript
// 陷阱 1：实现签名对外可见
function test(value: string): void;
function test(value: number): void;
function test(value: string | number): void {
  // 实现
}

// 如果直接把实现签名暴露给用户：
function test(value: string | number): void {} // 允许 string | number 组合
// 而重载版本则要求具体的类型

// 陷阱 2：重载数量过多
function process(x: 'a'): 1;
function process(x: 'b'): 2;
function process(x: 'c'): 3;
// ... 如果有 20+ 个重载，考虑使用映射类型或联合类型

// 陷阱 3：返回值类型不匹配
function transform(x: string): string;
function transform(x: number): number;
// function transform(x: string | number): string | number { // 返回签名不匹配
//   return typeof x === 'string' ? x.length : x.toString();
// }
// 应该确保实现签名的返回值兼容所有重载签名
```

> **面试要点**：函数重载面试常问"重载解析顺序"和"实现签名不可见"。关键记住：更具体的重载放前面，实现签名对所有重载签名负责，且调用时只看重载签名。

## 三、类型推断（Type Inference）

### 3.1 基础类型推断

TypeScript 编译器可以根据上下文自动推断类型，无需显式注解：

```typescript
// 从初始化值推断
let count = 42;       // 推断为 number
const name = 'Alice'; // 推断为 'Alice'（字面量类型）
let items = [];       // 推断为 any[]（空数组）
let items2 = [1, 2];  // 推断为 number[]

// 从返回值推断
function add(a: number, b: number) {
  return a + b; // 推断返回类型为 number
}
```

### 3.2 最佳类型推断（Best Common Type）

当从多个表达式中推断类型时，TypeScript 计算"最佳通用类型"：

```typescript
// 从数组元素推断
const arr = [0, 1, null]; // 推断为 (number | null)[]

// 从联合类型推断最佳类型
class Dog { bark() {} }
class Cat { meow() {} }
class Bird { fly() {} }

const pets = [new Dog(), new Cat()];
// 推断为 (Dog | Cat)[]，而不是 Animal[]（不存在 Animal 类型）

// 如果有显式的类型信息，会使用它
interface Animal { 
  makeSound(): void;
}
const animals: Animal[] = [new Dog(), new Cat()];
// ✅ Dog 和 Cat 是 Animal 的子类型
```

### 3.3 上下文类型推断（Contextual Typing）

TypeScript 根据上下文来推断类型，这在回调函数中特别常见：

```typescript
// 回调参数类型自动推断
const numbers = [1, 2, 3];

// item 自动推断为 number，index 推断为 number
numbers.forEach((item, index) => {
  console.log(item.toFixed(2));
});

// 事件处理器的类型推断
document.addEventListener('click', (event) => {
  // event 自动推断为 MouseEvent
  console.log(event.clientX);
});

// 上下文类型在泛型中
interface Action<T> {
  payload: T;
  type: string;
}

function dispatch<T>(action: Action<T>) {}

dispatch({ type: 'SET', payload: 'hello' });
// T 自动被推断为 string
```

### 3.4 const 断言（const assertion）

```typescript
// 普通的 let 声明
let a = 'hello'; // 类型为 string

// const 声明
const b = 'hello'; // 类型为 'hello'（字面量类型）

// 使用 as const 断言
let c = 'hello' as const; // 类型为 'hello'

// as const 在复杂对象上的效果
const config = {
  server: 'localhost',
  port: 3000,
  mode: 'development' as const, // mode 类型为 'development'
} as const;
// 整个对象变为 readonly 且值变为字面量类型

// 实际应用：联合类型 + as const
const COLORS = ['red', 'green', 'blue'] as const;
type Color = typeof COLORS[number]; // 'red' | 'green' | 'blue'

// React 中的 action 定义
export const Actions = {
  increment: 'INCREMENT',
  decrement: 'DECREMENT',
  reset: 'RESET',
} as const;

type ActionType = typeof Actions[keyof typeof Actions];
// 'INCREMENT' | 'DECREMENT' | 'RESET'
```

### 3.5 推断最佳实践

```typescript
// ✅ 推荐：让 TypeScript 推断简单类型
const name = 'Alice';
const count = 42;
const isActive = true;

// ✅ 推荐：声明返回值类型（公共 API）
export function createUser(name: string): User {
  return { id: 1, name, createdAt: new Date() };
}

// ✅ 推荐：复杂对象显式注解
const config: Config = {
  host: 'localhost',
  port: 3000,
};

// ✅ 推荐：函数参数必须显式类型
function greet(name: string) { // name 必须显式注解
  return `Hello, ${name}`;
}

// ❌ 避免：冗余的类型注解
const count: number = 42; // ✅ 类型安全，但不必要

// 🤔 争议：何时显式标注返回类型
// - 公共 API 函数：应该标注
// - 内部函数：可以让 TS 推断
// - 递归函数：必须显式标注
// - 复杂泛型：推荐显式标注（帮助调试）
```

> **面试要点**："TypeScript 推断"面试常问：最佳公共类型（Best Common Type）和上下文类型（Contextual Typing）的概念，以及 `as const` 对类型推断的影响。了解这些能帮助写出更简洁且类型安全的代码。

## 四、Mixin 模式

### 4.1 什么是 Mixin

Mixin 是一种**组合优于继承**的代码复用模式。在 TypeScript 中，Mixin 通过函数将行为"混合"到现有类中：

```typescript
// 基础 Mixin 模式
type Constructor<T = {}> = new (...args: any[]) => T;

// 定义一个 Mixin
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();
    
    update() {
      this.updatedAt = new Date();
    }
  };
}

// 另一个 Mixin
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;
    
    activate() {
      this.isActive = true;
    }
    
    deactivate() {
      this.isActive = false;
    }
  };
}

// 使用 Mixin
class Person {
  constructor(public name: string) {}
}

// 组合多个 Mixin
const ActivePerson = Timestamped(Activatable(Person));
const person = new ActivePerson('Alice');
person.name;          // ✅ 来自 Person
person.createdAt;     // ✅ 来自 Timestamped
person.isActive;      // ✅ 来自 Activatable
person.activate();    // ✅ 来自 Activatable
```

### 4.2 Mixin 类型约束

```typescript
// 约束 Base 类必须具有某些属性
interface Named {
  name: string;
}

function Greetable<TBase extends Constructor<Named>>(Base: TBase) {
  return class extends Base {
    greet() {
      return `Hello, I'm ${this.name}`; // 因为 TBase 约束了 name 存在
    }
  };
}

class User {
  name: string = '';
  email: string = '';
}

// ✅ 可行：User 满足 Named 约束
const GreetableUser = Greetable(User);

class Animal {
  species: string = '';
}

// ❌ 不可行：Animal 不满足 Named 约束（没有 name）
// const GreetableAnimal = Greetable(Animal);
```

### 4.3 使用类型定义 Mixin 结果

```typescript
// 为了正确推导 Mixin 结果的类型
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt = new Date();
    
    update() {
      this.updatedAt = new Date();
    }
  };
}

interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
  update(): void;
}

interface Activatable {
  isActive: boolean;
  activate(): void;
  deactivate(): void;
}

// 声明最终类型
type ActivePerson = Person & Timestamped & Activatable;

// 工厂函数
function createActivePerson(name: string): ActivePerson {
  const ActivePersonClass = Timestamped(Activatable(Person));
  return new ActivePersonClass(name) as ActivePerson;
}
```

### 4.4 Mixin 的优缺点

| 优点 | 缺点 |
|------|------|
| 代码复用，避免深层继承 | 类型推断复杂 |
| 灵活组合行为 | 运行时开销（多层级原型链） |
| 单一职责原则更好体现 | 命名冲突时难以解决 |
| 比继承更细粒度的复用 | Debug 时调用栈复杂 |

> **面试要点**：Mixin 面试常问"组合 vs 继承"。Mixin 模式体现了组合优于继承的原则，TypeScript 通过 `Constructor<T>` 类型约束和类表达式来实现类型安全的 Mixin。

## 五、名义类型与品牌类型（Nominal & Branded Types）

### 5.1 为什么需要名义类型？

TypeScript 的类型系统是**结构化类型（Structural Typing）**——只要结构匹配就认为是相同类型。这在大多数时候很方便，但有时需要区分"值相同但含义不同"的类型：

```typescript
// 结构化类型的问题
type UserId = string;
type OrderId = string;
type ProductId = string;

function getUser(id: UserId): User { /* ... */ }
function getOrder(id: OrderId): Order { /* ... */ }

const userId: UserId = 'user_123';
const orderId: OrderId = 'order_456';

// 糟糕！下面的代码类型检查通过，但逻辑错误
getUser(orderId);  // ❌ 类型检查通过，但传入了订单 ID！
getOrder(userId);  // ❌ 类型检查通过，但传入了用户 ID！
```

### 5.2 Branded 类型模式

使用交叉类型添加一个"品牌"字段来模拟名义类型：

```typescript
// Branded 类型模式
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

function getUser(id: UserId): User {
  // 实现
  return {} as User;
}

function getOrder(id: OrderId): Order {
  return {} as Order;
}

// 创建 Branded 值
function createUserId(id: string): UserId {
  return id as UserId; // 类型断言
}

const userId = createUserId('user_123');
const orderId = 'order_456' as OrderId;

getUser(userId);   // ✅ 正确
getUser(orderId);  // ❌ 类型错误！不能将 OrderId 赋值给 UserId
// getOrder(userId); // ❌ 同样错误
```

### 5.3 Branded 类型的实际应用

```typescript
// 应用一：货币类型
type USD = Brand<number, 'USD'>;
type EUR = Brand<number, 'EUR'>;
type JPY = Brand<number, 'JPY'>;

function createMoney<T extends string>(amount: number, currency: T): Brand<number, T> {
  return amount as Brand<number, T>;
}

const usd = createMoney(100, 'USD');
const eur = createMoney(200, 'EUR');

// ❌ 编译错误：不同货币不能混淆
// const total = usd + eur; // 虽然 number 可以相加，但类型要匹配

// ✅ 必须显式转换
function convertUSDtoEUR(usd: USD, rate: number): EUR {
  return (usd * rate) as EUR;
}

// 应用二：实体 ID（防止 ID 混淆）
type PostId = Brand<string, 'PostId'>;
type CommentId = Brand<string, 'CommentId'>;

interface Post {
  id: PostId;
  title: string;
  content: string;
}

interface Comment {
  id: CommentId;
  postId: PostId; // 明确关联的类型
  text: string;
}

function getPost(id: PostId): Post { return {} as Post; }
function getCommentsByPost(postId: PostId): Comment[] { return []; }

// ✅ 类型安全
const postId = 'post_123' as PostId;
getCommentsByPost(postId);  // ✅

const commentId = 'comment_456' as CommentId;
// getCommentsByPost(commentId); // ❌ 类型错误！
```

### 5.4 Flavor 类型模式（弱品牌类型）

Flavor 类型是 Branded 类型的弱化版本，只在类型检查时"标记"类型，但不阻止直接赋值：

```typescript
// Flavor 模式 — 仅在比较时区分，但不阻止赋值
type Flavor<T, F> = T & { __flavor?: F };

type Name = Flavor<string, 'Name'>;
type Email = Flavor<string, 'Email'>;

function sendEmail(to: Email, content: string) {
  console.log(`Sending to ${to}`);
}

const name: Name = 'Alice';
const email: Email = 'alice@example.com';

sendEmail(email); // ✅
// sendEmail(name); // ❌ 类型错误：Name 不能赋值给 Email

// 但与 Brand 不同，Flavor 的值可以直接赋值给基础类型
const str: string = name; // ✅ Flavor 可以赋值给基础类型
```

**Flavor vs Brand 对比：**

| 特性 | Brand | Flavor |
|------|-------|--------|
| 阻止跨类型赋值 | 是 | 是 |
| 可赋值给基础类型 | 否（需转） | 是 |
| 运行时影响 | 无（编译擦除） | 无（编译擦除） |
| 使用场景 | 严格类型隔离 | 宽松区分 |

### 5.5 运行时注意

```typescript
// Branded 类型在运行时被完全擦除
type UserId = Brand<string, 'UserId'>;

const id: UserId = '123' as UserId;

// 运行时：typeof id === 'string'，__brand 不存在！
if (typeof id === 'object' && '__brand' in id) {
  // 这段代码永远不会执行！
  // 品牌属性是类型层面的，运行时不存在
}

// 正确做法：运行时检查应该用其他方式
function isValidUserId(id: string): id is UserId {
  return /^user_\d+$/.test(id); // 根据实际格式验证
}
```

### 5.6 Branded 类型的局限性

```typescript
// 局限性 1：类型断言必须显式
const id = 'user_123' as UserId; // 每次都要断言

// 补救：使用工厂函数（推荐）
function UserId(id: string): UserId {
  // 可以在工厂函数中做运行时验证
  if (!/^user_\d+$/.test(id)) {
    throw new Error(`Invalid UserId: ${id}`);
  }
  return id as UserId;
}

// 局限性 2：第三方库可能不识别
// 当传入需要 string 的库函数时，需要转换
function externalLibrary(id: string) { /* ... */ }
externalLibrary(userId as string); // 需要显式转换

// 局限性 3：泛型中可能丢失品牌信息
function identity<T>(x: T): T { return x; }
const result = identity(userId); // 可以保留品牌信息
```

> **面试要点**：Branded Types 面试常问"为什么需要在结构化类型系统中模拟名义类型"。关键在于：当值的形状相同但语义不同时，Branded 类型可以提供编译时的安全性，防止 ID 混淆、货币单位混用等问题。

## 六、高级类型推断模式

### 6.1 提取 Promise 值类型

```typescript
// 内置的 Awaited 类型（TypeScript 4.5+）
type PromiseValue = Promise<string>;
type Result = Awaited<PromiseValue>; // string

// 手动实现（用于理解）
type MyAwaited<T> = T extends PromiseLike<infer U> ? MyAwaited<U> : T;

type NestedPromise = Promise<Promise<string>>;
type R1 = MyAwaited<NestedPromise>; // string

// 实际应用：API 响应类型
async function fetchData(): Promise<{ id: number; name: string }> {
  return { id: 1, name: 'data' };
}

type FetchDataReturn = Awaited<ReturnType<typeof fetchData>>;
// { id: number; name: string }
```

### 6.2 提取组件 Props 类型

```typescript
import React from 'react';

// 提取 React 组件的 Props 类型
type MyComponentProps = {
  title: string;
  count: number;
  onClick: () => void;
};

const MyComponent = (props: MyComponentProps) => null;

// 使用 React.ComponentProps
type PropsFromComponent = React.ComponentProps<typeof MyComponent>;
// { title: string; count: number; onClick: () => void }

// 通用对象类型提取
class Service {
  getUser(id: number) { return { id, name: 'Alice' }; }
  setConfig(config: Record<string, unknown>) { return true; }
}

type ServiceInstance = InstanceType<typeof Service>;
type ServiceMethods = {
  [K in keyof ServiceInstance]: ServiceInstance[K] extends (...args: any[]) => any 
    ? K 
    : never;
}[keyof ServiceInstance];
// 'getUser' | 'setConfig'
```

### 6.3 提取函数参数和返回值

```typescript
function process(options: { 
  url: string; 
  method: 'GET' | 'POST'; 
  body?: unknown;
}): Promise<{ status: number; data: unknown }> {
  return Promise.resolve({ status: 200, data: null });
}

type ProcessParams = Parameters<typeof process>;
// [{ url: string; method: 'GET' | 'POST'; body?: unknown }]

type ProcessReturn = ReturnType<typeof process>;
// Promise<{ status: number; data: unknown }>

// 提取函数的第一个参数类型
type FirstParam<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;
type P1 = FirstParam<typeof process>;
// { url: string; method: 'GET' | 'POST'; body?: unknown }

// 提取 Promise 内的值类型
type PromiseResult<T> = T extends Promise<infer R> ? R : T;
type Result2 = PromiseResult<ProcessReturn>;
// { status: number; data: unknown }
```

### 6.4 映射类型推断

```typescript
// 从配置生成类型
const CONFIG_SCHEMA = {
  database: { type: String, required: true },
  port: { type: Number, default: 3000 },
  debug: { type: Boolean, default: false },
} as const;

type ConfigSchema = typeof CONFIG_SCHEMA;

type InferConfigType<T> = {
  [K in keyof T]: T[K] extends { type: typeof String }
    ? string
    : T[K] extends { type: typeof Number }
      ? number
      : T[K] extends { type: typeof Boolean }
        ? boolean
        : never;
};

type AppConfig = InferConfigType<ConfigSchema>;
// { database: string; port: number; debug: boolean }

// 使用
function loadConfig(): AppConfig {
  return { database: 'test', port: 3000, debug: false };
}
```

## 七、DefinitelyTyped / @types 生态

### 7.1 什么是 DefinitelyTyped？

[DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) 是世界上最大的 TypeScript 类型声明仓库。它包含了超过 9000 个 `@types/*` 包的社区维护类型定义。

### 7.2 使用 @types 包

```bash
# 安装第三方库的类型
npm install --save-dev @types/lodash
npm install --save-dev @types/react
npm install --save-dev @types/node
npm install --save-dev @types/express
```

```json
// 查看 @types 版本要求
{
  "dependencies": {
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "@types/lodash": "^4.17.0" // 应与 lodash 大版本匹配
  }
}
```

### 7.3 类型自动发现

TypeScript 默认会自动从 `node_modules/@types` 加载类型：

```json
{
  "compilerOptions": {
    // 默认行为：自动加载所有 @types/* 包
    // 或者白名单指定：
    "types": ["node", "lodash"]
  }
}
```

### 7.4 如何贡献 DefinitelyTyped

如果你是库作者或想为社区贡献力量：

1. **Fork 仓库**：https://github.com/DefinitelyTyped/DefinitelyTyped
2. **创建类型目录**：`types/my-package/`
3. **编写声明文件**：
```typescript
// types/my-package/index.d.ts
// Type definitions for my-package 1.0.0
// Definitions by: Your Name <https://github.com/your-profile>

declare module 'my-package' {
  export interface Options {
    timeout?: number;
    retry?: boolean;
  }
  
  export function setup(config: Options): void;
  export function execute<T = any>(task: string): Promise<T>;
  export const version: string;
}
```
4. **添加测试文件**：
```typescript
// types/my-package/my-package-tests.ts
import { setup, execute, version } from 'my-package';

// 基本使用
setup({ timeout: 1000 });
execute<string>('test').then(result => {
  console.log(result);
});

// 类型测试
const v: string = version;

// 可选：测试错误用法（应该被编译器拒绝）
// setup({ timeout: 'fast' }); // ❌ 应该报错
```
5. **配置 tsconfig.json**：
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "lib": ["es6"],
    "noImplicitAny": true,
    "strictNullChecks": true,
    "types": []
  },
  "files": [
    "index.d.ts",
    "my-package-tests.ts"
  ]
}
```
6. **提交 PR** 到 DefinitelyTyped 仓库

### 7.5 库自带类型 vs @types

```json
// 库自带类型（推荐）
{
  "name": "my-library",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",  // 库自己维护类型
  "files": ["dist"]
}

// 或者通过 @types 包
// 用户安装：
// npm install my-library
// npm install --save-dev @types/my-library
```

**选择策略**：
- 如果库用 TypeScript 编写：让 tsc 自动生成 `.d.ts`，随库发布
- 如果库用 JavaScript 编写：维护 DefinitelyTyped 包
- 如果库用 JS 但仅内部使用：在项目中创建 `.d.ts` 声明

> **面试要点**："DefinitelyTyped 的贡献流程"是高级面试问题。核心流程：Fork → 写 index.d.ts → 写测试文件 → 配置 tsconfig → PR。了解这些表明你深入参与了 TS 生态。

## 八、常见陷阱与最佳实践

### 陷阱 1：函数重载顺序错误

```typescript
// ❌ 错误：通用重载在前
function format(data: any): string;           // 遮蔽了后面的重载
function format(data: Date): string;
function format(data: number): string;
function format(data: any): string {
  return String(data);
}

format(new Date()); // 匹配到第一个重载，data 类型为 any，失去了类型信息

// ✅ 正确：特化在前
function format(data: Date): string;
function format(data: number): string;
function format(data: any): string; // 兜底
```

### 陷阱 2：Branded 类型在运行时失效

```typescript
// ❌ 常见误解：以为品牌属性在运行时存在
type UserId = Brand<string, 'UserId'>;

function isUserId(value: string): value is UserId {
  return typeof value === 'string' && value.startsWith('user_');
  // 不要检查 '__brand' —— 它编译后不存在！
}

// ✅ 正确：使用值的实际特征做运行时检查
function isValidUserId(id: string): id is UserId {
  return /^user_[a-z0-9]+$/.test(id);
}
```

### 陷阱 3：复杂泛型推断失败

```typescript
// ❌ 错误：嵌套泛型导致推断失败
async function getData<T>() {
  const response = await fetch('/api/data');
  return response.json() as T;
}

const data = await getData(); // T 推断为 unknown

// ✅ 正确：显式指定泛型参数
const data = await getData<{ id: number; name: string }>();
```

### 陷阱 4：this 参数与箭头函数混用

```typescript
// ❌ 错误：箭头函数不能有 this 参数
// const wrong = (this: MyClass) => { }; // 语法错误

// ✅ 正确：方法声明中使用 this 参数
class Handler {
  onEvent(this: Handler) {
    console.log('handled');
  }
}

// ✅ 箭头函数使用 this 捕获
class Handler2 {
  onEvent = () => {
    // 箭头函数从定义时捕获 this
    console.log('handled');
  };
}
```

### 陷阱 5：Mixin 类型丢失

```typescript
// ❌ 错误：没有声明 Mixin 结果的类型
const MixedClass = Timestamped(Activatable(BaseClass));
const instance = new MixedClass();
// instance.createdAt 存在但 IDE 可能无法推断

// ✅ 正确：声明组合后的类型
interface FinalType extends BaseClass, Timestamped, Activatable {}
const instance = new MixedClass() as unknown as FinalType;
```

## 九、面试高频题

### Q1：this 参数在 TypeScript 中有什么作用？

this 参数是 TypeScript 独有的，用于显式指定函数体中 this 的类型。它在编译时被完全擦除。主要用途包括：固定回调函数中的 this 类型、实现类型安全的链式调用（return this）、防止 this 误用。

### Q2：函数重载和联合类型参数有什么区别？

函数重载允许根据参数类型返回**不同的类型**，联合类型参数只能返回统一的类型。重载提供更精确的返回类型映射。例如 `double('hello')` 返回 `string`，`double(21)` 返回 `number`，而使用联合类型则只能返回 `string | number`。

### Q3：什么是 Branded Type？为什么需要它？

Branded Type 通过交叉类型添加虚拟的 `__brand` 属性来模拟名义类型（Nominal Typing）。TypeScript 是结构化类型系统，Branded Type 用于区分形状相同但语义不同的类型（如 UserId vs OrderId），防止运行时混淆。

### Q4：as const 的作用是什么？

`as const` 将值标记为深度只读字面量类型。它有三个作用：属性变为 readonly、值变为字面量类型、数组变为只读元组。常用于定义联合类型和配置对象。

### Q5：Mixin 模式和继承的关系是什么？

Mixin 是"组合优于继承"的实践。通过函数组合多个类的能力，避免深层的类继承。在 TypeScript 中通过 `Constructor<T>` 类型约束和类表达式实现类型安全的 Mixin。

### Q6：如何提取一个 Promise 的泛型参数类型？

使用 `Awaited<T>` 类型（内置，TS 4.5+）或自定义 `type Unwrap<T> = T extends Promise<infer U> ? U : T`。使用条件类型的 infer 关键字提取 Promise 内部类型。

---

## 总结

| 话题 | 核心概念 | 难度 |
|------|---------|------|
| this 类型 | this 参数声明、箭头函数 vs 方法、流畅 API | 中 |
| 函数重载 | 重载签名、实现签名、解析顺序 | 中 |
| 类型推断 | 最佳公共类型、上下文类型、as const | 中 |
| Mixin 模式 | Constructor 约束、类表达式、组合 | 高 |
| Branded Types | 名义类型模拟、交叉类型品牌 | 高 |
| 高级推断 | Awaited、Parameters、ReturnType、映射推断 | 高 |
| DefinitelyTyped | @types 包、贡献流程 | 中 |
