# TypeScript 基础概念

## 一、什么是 TypeScript？

你写了一个 `add(1, '2')`，JavaScript 给你返回了 `'12'` 而不是 `3`。TypeScript 在你运行代码之前就能发现这个问题。

### JavaScript 与 TypeScript 的关系

```
JavaScript           TypeScript
   |                     |
   | 动态类型            | 静态类型
   | 运行时检查          | 编译时检查
   | .js 文件            | .ts 文件
   |                     |
   +------- 超集 -------+
```

核心区别在于：JavaScript 是一种**动态类型**语言，变量的类型在运行时确定；而 TypeScript 是一种**静态类型**语言，变量的类型在编写代码时就已确定，并在**编译阶段**进行检查。

```typescript
// JavaScript — 运行时才能发现错误
function add(a, b) {
  return a + b;
}
add(1, "2"); // 结果为 "12"，不是预期行为，但无报错

// TypeScript — 编译时发现错误
function addTyped(a: number, b: number): number {
  return a + b;
}
addTyped(1, "2"); // ❌ 编译错误：类型 'string' 不可赋值给类型 'number'
```

> **面试要点**：TypeScript 不是一门全新的语言，它是 JavaScript 的超集。TypeScript 代码最终会被编译（或通过 ts-node、Babel 等转译）为纯 JavaScript 运行。这意味着 TypeScript 并没有改变 JavaScript 的运行时行为——类型在运行时被完全擦除。

## 二、TypeScript 的类型系统 vs JavaScript 的动态类型

| 特性 | JavaScript | TypeScript |
|------|-----------|------------|
| 类型检查时机 | 运行时 | 编译时 |
| 类型推断 | 无（值决定） | 有（TS 可推断） |
| 类型注解 | 不支持 | 支持 |
| 类型错误发现 | 执行到该行 | 编写时立刻提示 |
| 开发体验 | 无自动补全 | 完善的 IDE 支持 |

```typescript
// JavaScript 的"隐式类型转换"常常导致隐蔽的 BUG
console.log([] + []);   // ""（空字符串）
console.log([] + {});   // "[object Object]"
console.log({} + []);   // 0（在某些浏览器中）
console.log(null == undefined); // true
console.log(null == 0); // false（令人困惑）

// TypeScript 的类型系统让你在编码阶段就捕获这些问题
// 注意：TypeScript 不会修复 JavaScript 的运行时行为，它只是帮你发现类型不匹配
```

## 三、数据类型详解

### 3.1 基础数据类型

```typescript
// 字符串
const name: string = "TypeScript";
const template: string = `Hello, ${name}`;

// 数字（所有数字都是浮点数，没有 int/float 之分）
const count: number = 42;
const pi: number = 3.14159;
const hex: number = 0xff;      // 255
const binary: number = 0b1010;  // 10

// 布尔
const isDone: boolean = true;

// null 和 undefined
const n: null = null;
const u: undefined = undefined;

// ════════════════════════════════════════
// 以上是入门基础类型，记住这 5 个就够了。
// 下面所有类型为进阶内容，先有个印象即可，后续章节会逐一展开
// ════════════════════════════════════════

// void — 通常用于函数返回值
function log(message: string): void {
  console.log(message);
  // return undefined; // void 函数可以返回 undefined，但不能返回其他值
}

// any — 绕过类型检查（应尽量避免使用）
let loose: any = 4;
loose = "string";       // OK
loose = true;           // OK
loose.toUpperCase();    // 编译通过，但运行时可能出错

// unknown — 类型安全的 any
let safe: unknown = 4;
safe = "string";        // OK
// safe.toUpperCase();  // ❌ 编译错误：Object is of type 'unknown'
if (typeof safe === "string") {
  safe.toUpperCase();   // ✅ 类型收窄后可以使用
}

// never — 表示永远不会发生的值
function throwError(message: string): never {
  throw new Error(message);
}

function infiniteLoop(): never {
  while (true) {}
}

// symbol — 唯一标识符
const sym1: symbol = Symbol("key");
const sym2: symbol = Symbol("key");
console.log(sym1 === sym2); // false（每个 Symbol 都是唯一的）

// bigint — 大整数（ES2020+）
const big: bigint = 100n;
const big2: bigint = BigInt(100);

// object — 非原始类型
const obj: object = { key: "value" };
// obj.key // ❌ 编译错误：object 类型上不存在 key
```

### 3.2 深入：包装类型 vs 原始类型（可选阅读）

> 本节深入讨论大小写类型的差异和 JS 包装对象的边缘行为。**初学阶段可以先跳过**，不影响后续理解。

在 TypeScript 中，`String`、`Number`、`Boolean`、`Symbol`、`Object` 这类大写类型也能用作类型注解，**编译不会报错**：

```typescript
// ⚠️ 编译能通过，但强烈不推荐
const badStr: String = "hello";   // ✅ 编译通过
const badNum: Number = 42;        // ✅ 编译通过
```

**既然编译不报错，为什么不推荐？**

核心问题不在编译期，而在**语义混乱和运行时风险**：

**1. 类型标注和运行时真实类型不一致**

```typescript
// 类型标注写的是 String，但运行时 const 赋值不会自动装箱
const a: String = "hello";
typeof a; // "string" ← 运行时是原始值，不是包装对象！
// 这让阅读代码的人产生错误预期
```

**2. 真正的包装对象来自 `new` 构造**

```typescript
const primitive: string = "hello";        // typeof → "string"
const wrapped: String = new String("hi"); // typeof → "object" ← 这才是真正的包装对象

// 用 typeof 判断时行为完全不一样
function isStringValue(val: String): boolean {
  return typeof val === "string";
}
isStringValue("hello");          // true
isStringValue(new String("hi")); // false！ ← 你的类型标注说"这是 String"，但 typeof 却是 object
```

**3. 与期望 `string` 的 API 交互时需要留意**

```typescript
function greet(name: string): string {
  return `Hello, ${name}`;
}

const wrapper: String = "World";
greet(wrapper); // ✅ 编译通过（TS 认为 String 结构兼容 string）
// 但如果是 new String("World")，运行时行为可能出乎意料
```

**4. 正确的做法**

```typescript
// ✅ 坚持用小写原始类型
const name: string = "TypeScript";
const count: number = 42;
const flag: boolean = true;
const sym: symbol = Symbol("key");

// ✅ 如果确实需要包装对象（极少场景），用 new 显式创建
const s: String = new String("rarely needed");
```

**总结**：大写包装类型能用 ≠ 该用。它不是编译错误，但会让代码的**类型语义模糊**，当代码中混入 `new String()` 产生的真正包装对象时，`typeof` 检查、严格相等 `===` 等操作的行为会与直觉不一致。

> **面试要点**：当被问到 `String` vs `string` 的区别时，不要只说"不能用"——准确的说法是：（1）`string` 是 TS 原始类型，对应 JS 运行时的 `typeof "x" === "string"`；（2）`String` 是 `String` 构造函数对应的接口类型，代表包装对象；（3）TS 出于结构兼容性不会阻止你用 `String` 标注原始值，但这会造成类型标注与运行时真值不一致的风险；（4）官方推荐始终用小写原始类型。核心区别记忆：**小写 = 原始值，大写 = 包装对象接口**。

### 3.3 any vs unknown vs never 深入对比

这三个类型是 TypeScript 类型系统中容易混淆的概念，理解它们的区别对掌握 TypeScript 至关重要。

| 特性 | any | unknown | never |
|------|-----|---------|-------|
| 可赋值给任何类型 | 是 | 否 | 是（never 是 bottom type） |
| 可接收任何类型的赋值 | 是 | 是 | 否 |
| 可访问任意属性/方法 | 是 | 否（需类型收窄） | N/A |
| 类型安全 | 不安全（禁用类型检查） | 安全（需类型守卫） | 安全（无值可操作） |

```typescript
// any — 脱离类型系统的逃生舱
let anything: any;
anything = 42;
anything = "hello";
anything.foo.bar.baz(); // 编译通过，运行时肯定会崩溃
// any 让你失去了 TypeScript 带来的所有好处

// unknown — 安全的 any
let unknownValue: unknown;
unknownValue = 42;
unknownValue = "hello";

// 使用 unknown 必须先收窄类型
if (typeof unknownValue === "string") {
  console.log(unknownValue.toUpperCase()); // ✅
}

// 或者使用类型断言
const strLength = (unknownValue as string).length; // ✅ 显式告知编译器

// never — 理论上的 bottom type（底层类型）
// never 是所有类型的子类型，但没有类型是 never 的子类型
type A = string & number; // never（没有值既是 string 又是 number）

// 使用 never 进行穷举检查
type Shape = "circle" | "square" | "triangle";

function area(shape: Shape): number {
  switch (shape) {
    case "circle": return Math.PI;
    case "square": return 1;
    case "triangle": return 0.5;
    default:
      // 如果上面没有穷举所有 case，这里会报错
      const exhaustive: never = shape;
      throw new Error(`Unknown shape: ${shape}`);
  }
}
```

> **面试要点**：`never` 是**底层类型（bottom type）**——它是所有类型的子类型，但没有类型是 `never` 的子类型（除了 `never` 自身）。`unknown` 是**顶层类型（top type）**的替代品——某些情况下可以将其视为类型安全的 `any`。记住：`any` 让你**逃避**类型检查，`unknown` 让你**推迟**类型检查，`never` 表示**不可能**的状态。

### 3.4 null & undefined 与 strictNullChecks

```typescript
// strictNullChecks: false（不推荐）
let s: string = "hello";
s = null;  // ✅ 不会报错
s = undefined; // ✅ 也不会报错
// 这会导致大量潜在的 null 引用问题

// strictNullChecks: true（推荐，默认启用）
let t: string = "hello";
// t = null;  // ❌ Type 'null' is not assignable to type 'string'
// t = undefined; // ❌ Type 'undefined' is not assignable to type 'string'

// 正确的做法：使用联合类型
let nullable: string | null = null;
nullable = "hello";  // ✅

let optional: string | undefined = undefined;
optional = "world";  // ✅

// 使用可选链操作符
interface User {
  name?: string;
  address?: {
    city?: string;
  };
}

const user: User = {};
// 没有可选链：需要层层判断
const city = user && user.address && user.address.city;

// 可选链：简洁安全
const city2 = user?.address?.city ?? "unknown city";

// 非空断言（谨慎使用）
const el = document.getElementById("app")!; // ! 告诉 TS 它一定存在
```

### 3.5 void 类型的正确理解

```typescript
// void 表示函数没有返回值
function noop(): void {
  // 没有 return 语句，或者 return undefined
}

// 在 TypeScript 中，void 可以被 undefined 赋值
let v: void = undefined;

// 但函数返回类型为 void 时，不意味着你不能返回一个值
// 它只是表示调用者不应该依赖返回值
const arr = [1, 2, 3];
const result = arr.forEach((item) => {
  // forEach 返回 void
});
// result 的类型是 void
```

## 四、数组类型

TypeScript 提供两种语法来声明数组类型：

```typescript
// 语法一：泛型写法 Array<T>
const arr1: Array<number> = [1, 2, 3];

// 语法二：简洁写法 T[]
const arr2: number[] = [1, 2, 3];

// 两种写法完全等价，选择取决于编码规范和个人偏好
// 推荐：JSX/TSX 文件中使用 T[]（避免与 JSX 标签混淆）
// 推荐：在复杂的泛型表达式中使用 Array<T>

// 只读数组
const readonlyArr: readonly number[] = [1, 2, 3];
// readonlyArr.push(4);   // ❌ Property 'push' does not exist
// readonlyArr[0] = 10;   // ❌ Index signature in readonly array

// ReadonlyArray<T> 等价于 readonly T[]
const arr3: ReadonlyArray<number> = [1, 2, 3];
```

## 五、元组类型（Tuple）

元组是固定长度、每个元素类型已知的数组：

```typescript
// 基本元组
const tuple: [string, number] = ["hello", 42];
const first = tuple[0]; // 类型为 string
const second = tuple[1]; // 类型为 number

// 可选元素的元组
type OptionalTuple = [string, number?];
const t1: OptionalTuple = ["hello"];
const t2: OptionalTuple = ["hello", 42];

// 剩余元素的元组
type RestTuple = [string, ...number[]];
const t3: RestTuple = ["hello", 1, 2, 3];

// 只读元组
const readonlyTuple: readonly [string, number] = ["hello", 42];
// readonlyTuple[0] = "world"; // ❌

// 具名元组（TypeScript 4.0+）
type NamedTuple = [name: string, age: number];
function createUser(): NamedTuple {
  return ["Alice", 30];
}
```

### 常见陷阱

```typescript
// 陷阱 1：push 操作绕过元组长度检查
const tuple: [string, number] = ["a", 1];
tuple.push("extra"); // 编译通过，但违背了元组的本意
// 使用 readonly 元组可以避免这个问题

// 陷阱 2：解构赋值超出范围（使用可选元素元组）
const bad: [number, number] = [1, 2];
const [x, y, z] = bad; // z 的类型为 undefined，但 TypeScript 不会报错
// 这是因为元组解构的扩展行为

// 陷阱 3：元组元素之间的依赖关系无法表达
// 例如：第二个元素的类型取决于第一个元素的值
// 这种情况需要使用 discriminated unions 或泛型
```

> **面试要点**：元组与数组的核心区别是**长度固定**和**每个位置的类型已知**。`readonly` 修饰符在元组上的作用尤为重要，它防止了意外的 `.push()` 操作破坏元组的结构完整性。

## 六、枚举类型（Enum）

### 6.1 数字枚举（Numeric Enum）

```typescript
// 默认从 0 开始递增
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right,   // 3
}

// 自定义起始值
enum Status {
  Active = 1,
  Inactive,    // 2
  Pending,     // 3
}

// 完全自定义值
enum Color {
  Red = 0xff0000,
  Green = 0x00ff00,
  Blue = 0x0000ff,
}

// 数字枚举支持反向映射
const upValue = Direction.Up;       // 0
const upName = Direction[0];         // "Up"
console.log(Direction); // { 0: "Up", 1: "Down", 2: "Left", 3: "Right", Up: 0, Down: 1, Left: 2, Right: 3 }
```

### 6.2 字符串枚举（String Enum）

```typescript
// 每个成员必须用字符串字面量初始化
enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

function makeRequest(method: HttpMethod, url: string) {
  // ...
}

makeRequest(HttpMethod.GET, "/api/users");
// makeRequest("GET", "/api/users"); // ❌ 类型不匹配（除非使用字符串枚举值）

// 字符串枚举没有反向映射
```

### 6.3 const enum（常量枚举）

```typescript
// 使用 const enum 避免生成额外的 JavaScript 代码
const enum Size {
  Small = 100,
  Medium = 200,
  Large = 300,
}

const mySize = Size.Medium; // 编译后直接内联为 200
// 编译结果：const mySize = 200;

// 注意：const enum 在编译时被完全擦除，因此不能反向映射
// 运行时也不存在 Size 对象
```

### 6.4 枚举 vs const enum 对比

| 特性 | 普通枚举 | const enum |
|------|---------|------------|
| 运行时存在 | 是（生成对象） | 否（完全内联） |
| 反向映射 | 是（数字枚举） | 否 |
| 体积 | 更大 | 更小 |
| 适用的场景 | 需要运行时枚举信息 | 纯编译时常量 |
| 与其他模块共享 | 支持 | 需谨慎（可能不一致） |

> **面试要点**：问「枚举和常量对象的区别」是一个高级问题。枚举提供**类型安全**（只能使用枚举成员），而常量对象只是 const 变量。此外，枚举（非 const）在运行时是一个真实的对象，可以迭代；而如果使用 const 替代枚举，则没有运行时结构。

## 七、总结与最佳实践

### 你刚学 TS 只需要记这五个

| 类型 | 写法示例 | 说明 |
|------|---------|------|
| `string` | `const name: string = "TS"` | 字符串 |
| `number` | `const age: number = 25` | 数字（整数和小数都用它） |
| `boolean` | `const ok: boolean = true` | 布尔值 |
| `null / undefined` | `const n: null = null` | 空值 / 未定义（结合 `strictNullChecks` 使用） |
| `Array` | `const arr: number[] = [1, 2, 3]` | 数组 |

> 以上 5 个类型覆盖了 90% 的日常场景。其余类型（void, never, unknown, any, enum, tuple 等）在遇到具体需求时再学习即可。

### 类型选择速查表

| 场景 | 推荐类型 |
|------|---------|
| 变量有明确类型 | 使用具体类型 |
| 变量可能是多种类型 | 联合类型 `string \| number` |
| 变量可空 | `string \| null` |
| 函数无返回值 | `void` |
| 函数永不返回 | `never` |
| 不确定类型，需安全处理 | `unknown`（然后收窄） |
| 想完全绕过类型检查 | `any`（但反思一下设计） |
| 集合字段 | `T[]` 或 `Array<T>` |
| 定长数组 | `[T, U, V]` 元组 |
| 一组命名常量 | `enum` 或 `const obj` |

### 面试高频题

**Q1: TypeScript 是静态类型还是动态类型？**
A: 静态类型。类型在编译时检查，运行时类型信息被擦除。

**Q2: `any` 和 `unknown` 有什么区别？**
A: `any` 允许任意操作并禁用类型检查；`unknown` 表示值的类型未知，必须先通过类型收窄才能使用，是类型安全的。

**Q3: `void` 和 `undefined` 的区别？**
A: 函数返回 `void` 表示调用者不应依赖返回值，但函数仍然可以返回 `undefined`。`undefined` 是一个具体的值。

**Q4: 为什么推荐用 `string` 而不是 `String`？**
A: `String` 是包装对象接口类型，编译不会报错，但它会造成类型标注与运行时真实类型（`typeof` 结果）不一致的隐患。尤其是代码中混入 `new String()` 产生的真正包装对象时，`typeof`、`===` 等操作的行为会出乎意料。TypeScript 官方推荐始终使用小写的原始类型以保持语义清晰。

**Q5: `const enum` 和普通 `enum` 的区别？**
A: `const enum` 在编译时完全内联擦除，不生成运行时对象，没有反向映射，体积更小。
