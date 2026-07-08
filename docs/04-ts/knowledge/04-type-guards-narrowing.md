# 类型守卫与类型收窄

## 一、什么是类型收窄

TypeScript 的类型系统是静态的——它在编译时就知道每个变量的类型。但在真实代码中，一个变量可能在运行时属于多种类型之一。类型收窄（Type Narrowing）指的是 TypeScript 根据代码中的条件判断，**将一个宽泛的类型缩小为更具体的类型**的过程。

```typescript
function printLength(value: string | number) {
  // 这里 value 的类型是 string | number
  console.log(value.length); // 错误！number 没有 length 属性
  
  if (typeof value === 'string') {
    // 这里 value 的类型被收窄为 string
    console.log(value.length); // ✅ 正确
  }
}
```

为什么需要类型收窄？因为在联合类型中，TypeScript **必须确保每个成员类型都能安全地访问属性**。如果不收窄，它只能允许所有成员共有的操作。

## 二、typeof 类型守卫

`typeof` 是最基础也是最常用的类型守卫。它可以检查的值类型包括：

| 类型 | 说明 |
|------|------|
| `string` | 字符串 |
| `number` | 数字 |
| `boolean` | 布尔值 |
| `symbol` | 符号 |
| `undefined` | 未定义 |
| `object` | 对象（注意：`typeof null` 也是 `"object"`） |
| `function` | 函数 |
| `bigint` | 大整数 |

```typescript
function format(value: string | number | boolean | object) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  // 这里 value 被收窄为 object
  return JSON.stringify(value);
}
```

### 常见陷阱：typeof null

```typescript
typeof null === 'object' // true，这是一个历史遗留 bug
```

这意味着当你检查 `typeof x === 'object'` 时，`null` 也会通过，需要使用额外的 `&& x !== null` 来排除。

```typescript
function process(input: string | null) {
  if (typeof input === 'object') {
    // 这里的 input 是 null 而非 object
    input.toString(); // 运行时崩溃！
  }
}
```

### 面试题
> **问：** `typeof` 可以检查 `array` 吗？
> **答：** 不能。`typeof []` 返回 `"object"`。检查数组应使用 `Array.isArray()`。

## 三、真值收窄

JavaScript 中，所有值都可以被强制转换为布尔值，结果为 `false` 的值称为"假值"：`0`、`NaN`、`""`、`0n`、`null`、`undefined`、`false`。

真值收窄（Truthiness Narrowing）利用这一特性来过滤 `null` 和 `undefined`：

```typescript
function printName(name: string | null | undefined) {
  if (name) {
    // name 被收窄为 string（排除了 null 和 undefined）
    console.log(name.toUpperCase());
  } else {
    // 这里 name 是 string | null | undefined
    // 注意：空字符串 "" 也会走到这里！
  }
}
```

### 谨慎使用真值收窄

```typescript
function processNumber(n: number | undefined) {
  if (n) {
    // 当 n = 0 时，0 是假值，不会进入这个分支！
    console.log(100 / n);
  }
}
```

**最佳实践：** 只对 `null` / `undefined` 使用 `!= null`（它同时排除 `null` 和 `undefined`）：

```typescript
function greet(name: string | null | undefined) {
  // != null 同时排除 null 和 undefined
  if (name != null) {
    console.log(`你好，${name.toUpperCase()}`);
  }
}
```

## 四、相等性收窄

通过 `===`、`!==`、`==` 等比较运算符，TypeScript 可以收窄类型：

```typescript
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // 当 x === y 为 true 时，x 和 y 的类型必须兼容
    // x 被收窄为 string（string 是两者的交集）
    // y 也被收窄为 string
    console.log(x.toUpperCase(), y.toUpperCase());
  }
}
```

### switch 语句中的收窄

```typescript
type Shape = 'circle' | 'square' | 'triangle';

function getArea(shape: Shape, size: number): number {
  switch (shape) {
    case 'circle':
      return Math.PI * size * size;
    case 'square':
      return size * size;
    case 'triangle':
      return (Math.sqrt(3) / 4) * size * size;
  }
}
```

## 五、instanceof 类型守卫

`instanceof` 用于检查对象是否是某个类的实例：

```typescript
class Dog {
  bark() { return '汪汪！'; }
}

class Cat {
  meow() { return '喵喵！'; }
}

function makeSound(animal: Dog | Cat) {
  if (animal instanceof Dog) {
    console.log(animal.bark());
  } else {
    console.log(animal.meow());
  }
}
```

`instanceof` 的工作原理是基于原型链查找，因此对于 `class` 继承结构也能正确工作：

```typescript
class Animal {}
class Bird extends Animal {
  fly() { return '飞了'; }
}

function action(a: Animal) {
  if (a instanceof Bird) {
    a.fly(); // ✅
  }
}
```

## 六、in 操作符收窄

`in` 操作符检查对象是否具有某个属性，TypeScript 利用它来区分联合类型成员：

```typescript
type Fish = { swim: () => void };
type Bird = { fly: () => void };

function move(animal: Fish | Bird) {
  if ('swim' in animal) {
    // animal 被收窄为 Fish
    animal.swim();
  } else {
    // animal 被收窄为 Bird
    animal.fly();
  }
}
```

### 可选属性的注意事项

```typescript
type A = { name: string; age?: number };
type B = { name: string; title: string };

function check(x: A | B) {
  if ('age' in x) {
    // x 被收窄为 A（含 age 属性）
  }
  // 但 !('age' in x) 不能可靠地将 x 收窄为 B
  // 因为 age 在 A 中是可选的，可能不存在
}
```

## 七、用户自定义类型守卫（类型谓词）

当内置类型守卫不够用时，可以编写自定义的类型守卫函数。其关键语法是 **`is`** 关键字：

```typescript
type Fish = { swim: () => void };
type Bird = { fly: () => void };

// 用户自定义类型守卫
function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

const pets: (Fish | Bird)[] = [];

// filter 后，result 的类型是 Fish[]
const result = pets.filter(isFish);
```

### 类型谓词的签名模式

```typescript
function isType(value: unknown): value is SomeType {
  // 返回布尔值
}
```

### 实际案例：API 响应验证

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface ApiError {
  code: number;
  message: string;
}

type ApiResponse = User | ApiError;

function isUser(response: ApiResponse): response is User {
  return 'email' in response && typeof response.email === 'string';
}

function isApiError(response: ApiResponse): response is ApiError {
  return 'code' in response && typeof response.code === 'number';
}

function handleResponse(response: ApiResponse) {
  if (isUser(response)) {
    console.log(`用户：${response.name}`);
  } else if (isApiError(response)) {
    console.error(`错误 ${response.code}：${response.message}`);
  }
}
```

### 类型守卫与断言函数

TypeScript 3.7 引入了断言函数（`asserts`），它也可以作为类型守卫：

```typescript
function assertNonNull<T>(value: T): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw new Error('值不应为空');
  }
}

function process(input: string | null) {
  assertNonNull(input);
  // 这里 input 被收窄为 string
  console.log(input.length);
}
```

### 面试题

> **问：** 类型谓词 `is` 和布尔返回值有什么区别？
> **答：** 没有 `is` 关键字，函数只能返回 `boolean`，TypeScript 不会据此收窄类型。`is` 告诉 TS 引擎：这个函数返回 `true` 时，参数就是指定类型。

## 八、可辨识联合类型

可辨识联合（Discriminated Union）是 TypeScript 中极其强大的模式。其核心是：联合类型中的每个成员都有一个**相同的字面量字段**（通常叫 `kind` 或 `type`），用于区分彼此。

```typescript
interface Circle {
  kind: 'circle';
  radius: number;
}

interface Rectangle {
  kind: 'rectangle';
  width: number;
  height: number;
}

interface Triangle {
  kind: 'triangle';
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;
```

当使用 `switch` 或 `if` 检查这个字段时，TypeScript 会自动收窄：

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    case 'triangle':
      return (shape.base * shape.height) / 2;
  }
}
```

### 复杂可辨识联合

可辨识字段不仅可以是字面量字符串，也可以是字面量数字、布尔值，甚至嵌套使用：

```typescript
type Result<T> =
  | { status: 'success'; data: T; timestamp: number }
  | { status: 'error'; code: number; message: string }
  | { status: 'loading'; progress?: number };

function handleResult<T>(result: Result<T>) {
  if (result.status === 'success') {
    // result.data 可用，result.code 不可用
    console.log(result.data);
  } else if (result.status === 'error') {
    // result.code 可用，result.data 不可用
    console.error(result.message);
  }
}
```

## 九、穷举检查与 never 类型

当处理可辨识联合时，如果添加了新的成员而忘记更新所有分支，会产生 bug。TypeScript 的 `never` 类型可以帮助进行**穷举检查**（Exhaustiveness Checking）：

```typescript
// 新增一种形状
interface Pentagon {
  kind: 'pentagon';
  side: number;
}

type Shape = Circle | Rectangle | Triangle | Pentagon;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle': return (shape.base * shape.height) / 2;
    default:
      // 把 shape 赋值给 never，如果未穷举则编译错误
      const _exhaustive: never = shape;
      // 类型 'Pentagon' 不能赋值给类型 'never' ❌
      throw new Error(`未处理的形状：${shape}`);
  }
}
```

添加 `Pentagon` 后，编译器会立刻报错，提示你在 `default` 分支中 `shape` 不兼容 `never`。这迫使开发者处理新的类型。

### 函数返回 never

`never` 还可以用于表示永远不会返回的函数：

```typescript
function assertUnreachable(x: never): never {
  throw new Error(`不应到达此处：${x}`);
}

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case 'circle': return Math.PI * shape.radius ** 2;
    case 'rectangle': return shape.width * shape.height;
    case 'triangle': return (shape.base * shape.height) / 2;
    default: return assertUnreachable(shape); // 缺少 case 时会报错
  }
}
```

## 十、赋值收窄

TypeScript 还会根据赋值语句收窄类型：

```typescript
let value: string | number;

value = 'hello';
// 此时 value 被收窄为 string
value.toUpperCase();

value = 42;
// 此时 value 被收窄为 number
value.toFixed(2);
```

### const 与 let 的区别

```typescript
// const 会被收窄为字面量类型
const x = 'hello';    // type: 'hello'（字面量类型）

// let 会被推断为基础类型
let y = 'hello';      // type: string

// 显式类型注解会覆盖推断
const z: string = 'hello'; // type: string
```

## 十一、控制流分析

TypeScript 使用**控制流分析**（Control Flow Analysis）来跟踪类型。它会分析代码分支、循环、返回值等：

```typescript
function padLeft(value: string, padding: string | number) {
  // 提前返回
  if (typeof padding === 'number') {
    return ' '.repeat(padding) + value;
  }
  // 此处 padding 已被收窄为 string
  return padding + value;
}
```

### TypeScript 能追踪什么

- `if/else` 分支中的类型变化
- `switch/case` 分支
- 三元运算符
- `&&` 和 `||` 逻辑运算符
- `try/catch` 中的类型流转
- 循环体的分析

```typescript
// 逻辑运算符的收窄
function test(value: string | null) {
  // && 运算符：左边为真才执行右边
  value && console.log(value.length); // value 被收窄
  
  // || 运算符
  const result = value || '默认值'; // result 推断为 string
}
```

### TypeScript 不能追踪什么

```typescript
// ❌ 函数调用中的收窄
function process(value: string | null) {
  if (value) {
    someFunction();
    // 不安全！someFunction 可能修改了 value
    // 但这里的 value 类型仍被假定为 string
    console.log(value.length);
  }
}

// ❌ 闭包中的类型窄化丢失
function processItems(items: (string | null)[]) {
  items.forEach((item) => {
    if (item !== null) {
      // 这里 item 被正确收窄为 string
      console.log(item.length);
    }
  });
  
  for (let i = 0; i < items.length; i++) {
    if (items[i] !== null) {
      // ❌ 这里 items[i] 仍为 string | null
      // TS 无法追踪索引访问的收窄
      console.log(items[i].length); // 报错
    }
  }
}
```

## 十二、常见陷阱

### 陷阱 1：闭包中丢失类型收窄

```typescript
function trap1(value: string | null) {
  if (value !== null) {
    // 这里 value 是 string
    
    setTimeout(() => {
      // ❌ 这里 value 又被推断为 string | null
      // 因为 TS 无法确保 value 在异步回调执行时没有被修改
      console.log(value.length);
    }, 1000);
  }
}
```

**解决方案：** 将收窄后的值赋给一个新的局部变量：

```typescript
function trap1Fixed(value: string | null) {
  if (value !== null) {
    const safeValue = value; // string
    setTimeout(() => {
      console.log(safeValue.length); // ✅
    }, 1000);
  }
}
```

### 陷阱 2：对象属性的收窄不持久

```typescript
interface Config {
  url?: string;
  port?: number;
}

function processConfig(config: Config) {
  if (config.url) {
    // 这里 config.url 是 string
    console.log(config.url.length); // ✅
  }
  
  if (config.url && config.port) {
    // 但访问另一个属性时，config.url 并不保证是 string
    // 因为对象属性可能被重新赋值
    fetch(config.url, { port: config.port });
  }
}
```

### 陷阱 3：联合类型中的函数属性

```typescript
type CallbackOrNumber = (() => void) | number;

function execute(value: CallbackOrNumber) {
  if (typeof value === 'function') {
    // value 收窄为函数
    value(); // ✅
  }
}

// 但如果是对象类型中的方法签名：
type WithMethod = { process: () => void } | { process: number };

function run(x: WithMethod) {
  if (typeof x.process === 'function') {
    // 这里可能仍然无法安全调用
    x.process(); // 取决于 x 的完整结构
  }
}
```

## 十三、面试高频题

### Q1：如何判断一个值是数组？

```typescript
// 正确方法
Array.isArray(value); // 返回 value is any[]

// 或者
value instanceof Array;

// 注意：typeof value === 'object' 不能区分数组和普通对象
```

### Q2：什么是可辨识联合？为什么有用？

可辨识联合是 TypeScript 的核心模式，通过一个共同的字面量字段区分联合成员。它的价值在于：TypeScript 可以通过 switch/if 自动收窄类型，提供**类型安全的模式匹配**，并且在添加新成员时可以通过 `never` 进行穷举检查，防止遗漏。

### Q3：如何定义一个类型守卫函数？

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}
```

关键点是返回值类型使用 `value is Type` 语法，而不是简单的 `boolean`。

### Q4：`in` 操作符收窄的注意事项？

`in` 用于检查属性存在性。但要注意：如果属性在类型中被标记为可选（`?`），`in` 检查后不能可靠地收窄类型，因为可选属性可能存在于任何一个联合成员中。

### Q5：如何在 switch 中实现穷举检查？

在 `default` 分支中，将参数赋值给 `never` 类型变量：

```typescript
default:
  const _exhaustive: never = value;
  throw new Error(`未处理的情况`);
```

这样当有新的联合成员未被处理时，编译器会报错。

---

## 总结

类型守卫与类型收窄是 TypeScript 类型系统的核心能力，它们让开发者能够在静态类型检查的前提下，编写符合运行时逻辑的代码。掌握这些技术，不仅能减少 bug，还能大幅提升代码的可读性和可维护性。

| 技术 | 适用场景 |
|------|----------|
| `typeof` | 基本类型检查 |
| 真值收窄 | 排除 null/undefined |
| 相等性收窄 | switch 和 === 比较 |
| `instanceof` | 类实例检查 |
| `in` | 属性存在性检查 |
| 类型谓词 | 自定义复杂检查 |
| 可辨识联合 | 多形态数据处理 |
| `never` 穷举 | 确保所有分支已处理 |
