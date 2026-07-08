# TypeScript 面试题答案

> 每道题末尾标注了对应的知识文章，可跳转深入学习。

---

## 一、基础概念

📖 对应知识文章：[01-basics.md](knowledge/01-basics.md)

### 1. 说说你对 TypeScript 的理解？与 JavaScript 的区别？

**是什么**

TypeScript 是 JavaScript 的**类型超集**，在 JS 之上添加了静态类型系统。所有合法 JS 都是合法 TS（严格模式下可能报错），类型只在编译时存在，运行时完全擦除。

**为什么**

静态类型是 TS 与 JS 最根本的分水岭。JS 是动态类型，变量的类型在运行时才确定，错误也在运行时才暴露；TS 在编译阶段就进行类型检查，将大量潜在错误消灭在编码期。这意味着你可以用更短的时间发现拼写错误、参数类型不匹配、空值引用等常见问题。

| 维度 | JavaScript | TypeScript |
|---|---|---|
| 类型系统 | 动态类型，运行时确定 | 静态类型，编译时检查 |
| 错误发现 | 运行时抛错 | 编译时就报错 |
| 编辑器支持 | 有限 | 强大的 IntelliSense、重构 |
| 运行 | 直接运行 | 需编译为 JS 后运行 |
| 语法 | ES 标准 | ES 标准 + 类型注解 + 接口 + 泛型 + 装饰器等 |
| 学习曲线 | 低 | 中高（尤其在复杂类型体操时） |

TS 的类型系统还带来了更强的 IDE 体验：自动补全、跳转定义、重构重命名等功能都以类型信息为基础。对于大型项目，这种"编译器作为助手"的开发模式能显著降低维护成本。当然，代价是需要学习类型语法，以及增加编译构建环节。

**收束**

TypeScript 的本质是"JS + 类型系统"，让你在编码阶段发现问题而非等到线上崩了才追查。核心记忆点：类型只在编译时存在，运行时完全擦除。

> 📖 详见：[01-basics.md](knowledge/01-basics.md)

---

### 2. TS 的数据类型有哪些？

**是什么**

TypeScript 的数据类型分两大类：JS 原有的原始类型和 TS 扩展的类型。

**为什么**

JS 原有的原始类型包括 `string`、`number`、`boolean`、`null`、`undefined`、`symbol`、`bigint`。这些是运行时就已经存在的类型，TS 直接沿用并为它们添加了静态类型检查。

TS 扩展的类型才是面试考察的重点：

- `any` — 任意类型，关闭类型检查，应尽量避免
- `unknown` — 安全的 any，使用前需要类型收窄
- `never` — 永远不存在的值的类型（抛错函数、死循环）
- `void` — 函数无返回值（实际返回 undefined）
- `enum` — 枚举，编译后生成反向映射对象
- `tuple` — 元组，定长数组且每项类型可以不同
- `Array<T>` / `T[]` — 泛型数组
- 字面量类型 — `"hello"`、`42`、`true` 作为类型
- 联合类型 `|` 和交叉类型 `&`

理解这些类型的区别和适用场景是 TS 基础面试的核心。尤其是 `any` / `unknown` / `never` / `void` 的区别，几乎必考。

**收束**

TS 类型 = JS 运行时原始类型 + TS 编译时扩展类型。面试时按此框架分两大类回答，再重点突出 `any` / `unknown` / `never` / `void` 的差异。

> 📖 详见：[01-basics.md](knowledge/01-basics.md)

---

### 3. TS 中 any 类型的作用是什么？

**是什么**

`any` 是 TypeScript 中的**逃生舱口（escape hatch）**，使用 `any` 后编译器会跳过该变量的所有类型检查，允许对它做任何操作而不报错。

**为什么**

```typescript
let value: any = 42;
value = "hello";        // ✅
value.foo.bar.baz();    // ✅ 编译通过，但运行时可能崩
value();                // ✅ 编译通过
```

`any` 的主要适用场景有两个：一是将现有 JS 项目渐进式迁移到 TS 时，先用 `any` 标注尚未完成类型定义的模块；二是处理确实无法确定类型的第三方库或动态数据。在这些场景中，`any` 能临时绕过编译器的类型检查，让迁移和集成更平滑。

但 `any` 的风险不容忽视。它会**传染**——任何使用了 `any` 值的表达式，其返回值也是 `any`，类型安全从这个节点开始扩散性地丧失。团队中一旦广泛使用 `any`，类型系统就形同虚设。因此，更好的做法是优先使用 `unknown`，它强制你在使用前进行类型收窄，既保留了灵活性又不牺牲安全性。如果非要使用 `any`，应当加 TODO 注释标记后续修复。

**收束**

`any` 是选择性退出类型检查的逃生舱口，适用于迁移和未知数据的临时处理。但 `any` 会传染且丧失类型安全，优先用 `unknown` 替代。

> 📖 详见：[01-basics.md](knowledge/01-basics.md) 的 any vs unknown vs never 详解

---

### 4. TypeScript 中 any、never、unknown、null & undefined 和 void 有什么区别？

**是什么**

这是五种容易混淆的类型，核心区别在于类型的安全性层级和实际表示的含义不同。

**为什么**

| 类型 | 含义 | 可赋值给 | 使用场景 |
|---|---|---|---|
| `any` | 任意类型，关闭检查 | 任何类型 / 可接收任何值 | 迁移、逃逸 hatch |
| `unknown` | 未知类型，安全版 any | 只能赋给 `any` / `unknown`，使用前需收窄 | 安全处理未知来源数据 |
| `never` | 永远不会出现的值 | 可赋给任意类型 | 抛错函数、死循环、穷尽性检查 |
| `void` | 无返回值 | `null` / `undefined`（取决于 strictNullChecks） | 函数返回类型 |
| `null` | 空值 | 严格模式下只能赋给 `null` / `any` / `unknown` | 显式空值 |
| `undefined` | 未定义 | 严格模式下只能赋给 `undefined` / `void` / `any` / `unknown` | 可选参数默认值 |

最容易混淆的是 `never` 和 `void`：
```typescript
function throwError(): never { throw new Error(); }   // 永远不会正常返回
function log(): void { console.log("hi"); }            // 正常返回 undefined
```
`void` 表示函数正常结束但没有返回值（实际返回 `undefined`），而 `never` 表示函数**永远无法正常结束**——要么抛异常，要么死循环。

`any` 和 `unknown` 的对比也很重要：
```typescript
let a: any = "hello"; a.trim();  // ✅ 不安全
let u: unknown = "hello";        // ❌ u.trim() 直接报错
if (typeof u === "string") u.trim(); // ✅ 收窄后安全
```
`unknown` 在设计上就是"安全的 any"——你必须在收窄后才能操作它，这避免了 `any` 那种可以随时随地对值做任何操作的隐患。在实践中，应当默认使用 `unknown` 来处理来自 API、用户输入等不可信来源的数据。

**收束**

五种类型的本质差异在于安全层级：`any` 完全无保护，`unknown` 要求使用前收窄，`void` 表示无返回值，`never` 表示不可能返回，`null`/`undefined` 表示值的缺失。面试时重点突出 `never` vs `void` 和 `any` vs `unknown` 两对对比。

> 📖 详见：[01-basics.md](knowledge/01-basics.md)

---

### 5. TypeScript 中可以使用 String、Number、Boolean、Symbol、Object 等给类型做声明吗？

**是什么**

编译能通过，但强烈不推荐。`String` / `Number` / `Boolean` 是 JS 包装对象构造函数对应的接口类型，而 `string` / `number` / `boolean` 才是真正的原始类型。TS 出于结构类型兼容性允许前者赋值给后者，但这掩盖了二者在运行时的本质差异。

**为什么**

大写类型（`String`、`Number`、`Boolean`）与小写类型（`string`、`number`、`boolean`）在 TS 中属于不同的类型层级。小写是**原始类型**（primitive type），大写是**装箱类型接口**（boxed type interface），定义在 `lib.es5.d.ts` 中。TS 不阻止原始值赋给 `String` 类型标注的变量，因为 `string` 拥有 `String` 接口上的所有方法（`charAt`、`toUpperCase` 等），这符合结构类型兼容性原则。

但这种"表面通过"隐藏了四个风险：

```typescript
// 风险 1：类型标注 String，运行时却是原始值
const s1: String = "hello";
typeof s1; // "string" — 不是 "object"！

// 风险 2：new String() 才是真正的包装对象，行为完全不同
const s2: String = new String("hello");
typeof s2; // "object" — 跟 s1 的 typeof 结果不一样！
```

```typescript
// 风险 3：typeof 判断在混入 new String() 时会行为分裂
function isStringValue(val: String): boolean {
  return typeof val === "string";
}
isStringValue("hello");          // true
isStringValue(new String("hi")); // false — 类型标注都是 String，行为却不一样！
```

```typescript
// 风险 4：Object vs object 的区别是真实存在的陷阱
const obj1: Object = 42;         // ✅ Object 涵盖所有非 null/undefined 值
const obj2: object = 42;         // ❌ object 仅表示非原始类型
```

正确的做法是始终使用小写原始类型，仅在 `.d.ts` 声明文件或内置类型声明中才使用大写形式：

```typescript
// ✅ 永远用小写原始类型
const name: string = "TypeScript";
const count: number = 42;
const flag: boolean = true;
const sym: symbol = Symbol("key");
const big: bigint = 100n;

// ✅ 需要"非原始类型"时用 object
function acceptObject(val: object): void { /* ... */ }
acceptObject({ a: 1 });  // ✅
acceptObject([1, 2]);    // ✅（数组也是 object）
acceptObject(42);         // ❌
```

**收束**

永远用小写原始类型（`string` / `number` / `boolean`）做类型标注。大写类型（`String` / `Number` / `Boolean`）是包装对象接口，用它们做类型标注会导致类型声明与运行时行为脱节，引发难以排查的 `typeof` 判断问题。

> 📖 详见：[01-basics.md](knowledge/01-basics.md) 的"装箱类型 vs 原始类型"章节

---

### 6. 数组定义的两种方式？

**是什么**

TypeScript 中定义数组有两种语法：`T[]`（元素类型加方括号）和 `Array<T>`（泛型写法），二者在类型层面完全等价。

**为什么**

```typescript
// 方式一：T[]（推荐，更简洁）
let arr1: number[] = [1, 2, 3];
let arr2: string[] = ["a", "b"];

// 方式二：Array<T>（泛型写法，在复杂类型中更清晰）
let arr3: Array<number> = [1, 2, 3];
let arr4: Array<{ name: string }> = [{ name: "Alice" }];

// 只读数组
let ro: readonly number[] = [1, 2, 3];   // ✅ 不可修改
let ro2: ReadonlyArray<number> = [1, 2]; // ✅ 等价写法
```

两种定义方式的选择主要关乎可读性。对于简单类型（`number`、`string`），`T[]` 更简洁直观；对于嵌套泛型（如 `Array<{ name: string }>`），`Array<T>` 避免了 `T[][]` 这种难以阅读的双层方括号形式。

除了定义方式，还需注意数组的只读变体。`readonly number[]` 和 `ReadonlyArray<number>` 在编译时阻止对数组的修改操作，是函数式编程中常见的防御手段——当你希望函数接收数组但不修改它时，用只读数组类型明确语义。

**收束**

两种方式等价。简单类型用 `T[]`，嵌套泛型用 `Array<T>`。需要只读语义时使用 `readonly` 前缀或 `ReadonlyArray<T>`。

> 📖 详见：[01-basics.md](knowledge/01-basics.md)

---

## 二、高级类型

📖 对应知识文章：[02-advanced-types.md](knowledge/02-advanced-types.md)

### 7. 说说你对 TS 中高级类型的理解？有哪些？

**是什么**

高级类型是超越基本类型的**类型组合与运算能力**。基本类型定义"值的集合"，高级类型则允许你对这些集合做并、交、映射、条件筛选等运算，组合出新的类型。

**为什么**

高级类型包含以下核心能力：

- **联合类型 (Union)**：`A | B`，值是二者之一
- **交叉类型 (Intersection)**：`A & B`，同时满足两者
- **字面量类型**：`"success" | "error"`、`1 | 2 | 3`
- **类型别名 (Type Alias)**：`type Name = ...`
- **索引类型**：`keyof T`、`T[K]`
- **映射类型**：`{ [K in keyof T]: ... }`
- **条件类型**：`T extends U ? X : Y`
- **模板字面量类型**：`` `${Prefix}${string}` ``
- **可辨识联合 (Discriminated Union)**：通过共有字段区分联合成员

高级类型的核心思想源于"类型即值的集合"。如果你把 `string` 理解为所有字符串的集合，那么 `string | number` 就是字符串集合与数值集合的并集，`A & B` 就是交集，`keyof T` 就是对象属性名的集合。这种集合论视角让类型系统的运作变得可以预测且一致。

实际开发中，高级类型最常见的应用场景是 API 响应的差异化处理（可辨识联合）、配置对象的类型生成（映射类型）、以及根据输入类型推断输出类型（条件类型）。

**收束**

高级类型是 TS 类型系统的核心能力所在。用集合论的视角理解：类型 = 值的集合，高级类型 = 集合运算。面试时先给出这个核心定义，再列举具体的类型运算类别。

> 📖 详见：[02-advanced-types.md](knowledge/02-advanced-types.md)

---

### 8. TypeScript 中 type 和 interface 的区别？

**是什么**

`type` 和 `interface` 都是定义类型的工具，但 `interface` 专为描述对象形状设计（支持声明合并），`type` 更通用（支持联合、元组、映射等）。二者在大部分场景可互换，但在特定能力上有不可替代的差异。

**为什么**

总览两者的关键差异：

| 特性 | interface | type |
|---|---|---|
| 声明合并 | ✅ 同名自动合并 | ❌ 同名报错 |
| 原始类型别名 | ❌ | ✅ `type Name = string` |
| 联合类型 | ❌ | ✅ `A \| B` |
| 元组 | ❌ | ✅ `[string, number]` |
| 映射类型 | ❌ | ✅ `{ [K in keyof T]: ... }` |
| 扩展语法 | `extends` | `&` 交叉 |
| 函数类型 | ✅ 调用签名 | ✅ 箭头语法 |
| 泛型 | ✅ | ✅ |
| 类实现 | ✅ `implements` | ✅ `implements` |
| 索引签名 | ✅ | ✅ |
| 同名属性冲突 | 报错（不允许宽化） | 取交集（可能变 never） |

**interface 独有的：声明合并**

```typescript
interface User { name: string; }
interface User { age: number; }
const u: User = { name: "Alice", age: 30 }; // ✅ 自动合并

// 实战价值：扩展第三方库类型
interface Window { __CUSTOM__: string; }  // 全局扩展 Window
```

**type 独有的：原始类型 / 联合 / 元组 / 映射**

```typescript
type ID = string;                                   // 原始类型别名
type Status = "active" | "inactive";                 // 联合类型
type Point = [number, number];                       // 元组
type Readonly<T> = { readonly [K in keyof T]: T[K] }; // 映射类型
```

**扩展语法差异：extends vs &**

```typescript
// interface extends — 同名属性必须兼容父接口（只能收窄）
interface Base { id: string; }
interface Child extends Base { id: "admin" | "user"; }  // ✅ 收窄

// type & — 同名属性取交集（可能变 never）
type A = { id: string };
type B = { id: number };
type AB = A & B; // id: string & number = never

// 两者可以互相配合
type FullConfig = Config & { port: number; };       // type extends interface ✅
interface ProdServer extends Server { domain: string; } // interface extends type ✅
```

**函数类型与泛型 — 两者都支持**

```typescript
interface FnI { (x: number, y: number): number; }  // 调用签名
type FnT = (x: number, y: number) => number;        // 箭头语法

interface RepoI<T> { get(id: string): T; }
type RepoT<T> = { get(id: string): T; };
```

此外还有编译器差异：interface 报错时显示接口名，type 会展开为完整结构更难读；interface 按名称缓存（更快），type 按结构替换（略慢）。

**选择策略**：描述对象形状用 `interface`（可合并、错误信息友好）；需要联合/元组/映射/原始类型别名用 `type`；不确定时选 `interface`，需要了再改 `type`。

**收束**

`interface` 是声明对象形状的首选——支持合并、错误信息更清晰；`type` 是通用工具——能表达任何类型，包括联合、元组和映射。核心原则：能用 `interface` 就用 `interface`，需要了再改 `type`。

> 📖 详见：[02-advanced-types.md](knowledge/02-advanced-types.md) 的 type vs interface 全面对比（含 11 个子章节的完整案例）

---

### 9. TypeScript 中 const 和 readonly 的区别？枚举和常量枚举的区别？接口和类型别名的区别？

**是什么**

这是一道多知识点综合题。`const` vs `readonly` 涉及变量绑定与属性的不可变语义；普通枚举 vs `const enum` 涉及运行时开销与编译时内联；接口和类型别名的区别见第 8 题。

**为什么**

**const vs readonly**：`const` 用于变量声明，禁止变量重新赋值；`readonly` 用于属性声明，禁止属性被修改。二者在不同维度上提供不可变性：

```typescript
const x = 1;  x = 2;            // ❌ 不能重新赋值
interface User { readonly id: number; }
let u: User = { id: 1 }; u.id = 2; // ❌ 只读属性不能改
```

注意 `const` 变量如果指向对象，对象内部属性仍然可以修改——`const` 只是禁止重新绑定，不保证深层不可变。而 `readonly` 也只是编译时约束，运行时完全不阻止赋值。

**枚举 vs 常量枚举**：普通枚举在编译后生成一个完整的对象（包含反向映射），运行时真实存在；`const enum` 在编译时将使用处直接替换为字面量值，不生成任何 JS 对象，零运行时开销：

```typescript
const enum Direction { Up, Down }
let d = Direction.Up; // 编译后变成 let d = 0;
// 注意：const enum 无法被非 TS 工具（如 babel 独立编译）使用
```

这意味着 `const enum` 对于性能敏感的代码路径（如频繁用到的标志位）有显著优势。但代价是如果代码被 Babel 等独立工具编译（而非 tsc），`const enum` 会因缺少完整类型信息而报错。因此在库或工具链中应避免使用 `const enum`。

**收束**

`const` 禁止变量重新赋值，`readonly` 禁止属性修改；普通枚举运行时存在，`const enum` 编译时内联无开销。`const enum` 适合应用内部性能敏感场景，但不适合库发布。

> 📖 详见：[02-advanced-types.md](knowledge/02-advanced-types.md)

---

### 10. TypeScript 中 interface 可以给 Function / Array / Class（Indexable）做声明吗？

**是什么**

可以。interface 通过三种特殊签名语法来描述非对象形状：调用签名描述函数，索引签名描述数组/字典，构造签名描述类构造函数。

**为什么**

interface 最常见的用法是描述对象形状（`{ name: string; age: number }`），但它的能力不止于此。通过不同的签名语法，interface 可以精确描述函数、数组和类的类型：

```typescript
// 1. 描述函数（Call Signature）
interface Fn {
  (x: number, y: number): number;
}
const add: Fn = (a, b) => a + b;

// 2. 描述数组（Index Signature + numeric index）
interface StringArray {
  [index: number]: string;  // 索引签名
  length: number;           // 附加属性
}
const arr: StringArray = ["a", "b"];

// 3. 描述类（Constructor Signature + 方法签名）
interface Clock {
  new (hour: number, minute: number): Date; // Constructor Signature
  tick(): void;
}
```

这三种签名的本质区别在于语法形式：**调用签名**是圆括号 `()`，**构造签名**是 `new` 关键字加圆括号 `()`，**索引签名**是方括号 `[]`。同一个 interface 可以组合多种签名和属性，例如同时定义调用签名和普通属性可以实现"可调用的对象"（如 jQuery 中的 `$` 函数）。

**收束**

interface 通过调用签名（函数）、索引签名（数组/字典）和构造签名（类）来声明非对象类型的形状，这些都是资深 TS 开发者需要掌握的进阶技巧。

> 📖 详见：[02-advanced-types.md](knowledge/02-advanced-types.md) 的 Interface 高级用法

---

### 11. TS 中使用 Union Types 有哪些注意事项？

**是什么**

联合类型 `A | B` 表示值可以是类型 A 或类型 B 中的任意一个。TS 要求只能访问联合类型所有成员的**共有属性**，实操时需先通过类型收窄再操作具体成员。

**为什么**

```typescript
type Cat = { meow: () => void };
type Dog = { bark: () => void };
type Pet = Cat | Dog;

declare const pet: Pet;
pet.meow();  // ❌ Dog 没有 meow
pet.bark();  // ❌ Cat 没有 bark
// ✅ 需要先收窄类型：
if ("meow" in pet) { pet.meow(); }  // 这里 pet 被收窄为 Cat
```

这是联合类型最重要的原则：TS 在不确定具体类型时，只允许访问所有成员共有的部分。要操作具体成员，必须先通过类型守卫收窄。

使用联合类型时有四个关键注意事项：

1. **类型收窄后再操作**：使用 `typeof`、`instanceof`、`in` 或可辨识属性（discriminant）将联合类型收窄为具体分支
2. **穷尽性检查**：在 `switch` 或 `if-else` 的 `default` 分支中，将变量赋值给 `never` 类型，确保所有情况都被处理——如果新增了联合成员但忘记处理，TS 会报错
3. **联合的分布性**：`(A | B)[]` 是"数组，其元素可以是 A 或 B"，不等于 `A[] | B[]`（"要么全是 A 的数组，要么全是 B 的数组"）
4. **交叉与联合的运算**：`(A | B) & C` 满足分配律，等价于 `(A & C) | (B & C)`

**收束**

联合类型的核心原则是"先收窄，再操作"。牢记四个要点：收窄手段、穷尽性检查、联合分布性与分配律。面试时能用 `never` 做穷尽性检查是加分项。

> 📖 详见：[02-advanced-types.md](knowledge/02-advanced-types.md) 和 [04-type-guards-narrowing.md](knowledge/04-type-guards-narrowing.md)

---

### 12. 如何联合枚举类型的 Key？

**是什么**

通过 `keyof typeof` 的组合用法获取枚举的所有键组成的联合类型。

**为什么**

```typescript
// 方式一：keyof + typeof（数字/字符串枚举）
enum Color { Red, Green, Blue }
type ColorKeys = keyof typeof Color; // "Red" | "Green" | "Blue"
```

这里的关键在于理解 `typeof` 和 `keyof` 的分工。`typeof Color` 获取枚举对象的运行时类型——枚举在 JS 中是一个对象，`typeof Color` 就是 `{ Red: Color, Green: Color, Blue: Color }` 的类型。然后 `keyof` 提取这个对象类型的所有键，得到 `"Red" | "Green" | "Blue"`。

```typescript
// 方式二：模板字面量 + keyof typeof
type ColorValues = `${ColorKeys}`;   // "Red" | "Green" | "Blue"

// 使用
function getColor(key: ColorKeys): Color {
  return Color[key];
}
```

注意数字枚举的反向映射会影响 `keyof typeof` 的结果——数字枚举除了字符串键，还包含反向的数字键。如果只想要字符串键，可以用 `Exclude<keyof typeof Color, number>` 过滤掉数字。

**收束**

`keyof typeof Color` 获取枚举的所有字符串键，本质是先通过 `typeof` 获取枚举对象的类型，再用 `keyof` 提取键。注意数字枚举的反向映射会产生额外数字键，需用 `Exclude` 过滤。

> 📖 详见：[02-advanced-types.md](knowledge/02-advanced-types.md) 和 [07-type-operations.md](knowledge/07-type-operations.md)

---

## 三、泛型（Generics）

📖 对应知识文章：[03-generics.md](knowledge/03-generics.md)

### 13. 说说你对 TypeScript 中泛型的理解？应用场景？

**是什么**

泛型是**类型参数化**——让函数、接口、类在定义时不指定具体类型，调用时才确定，从而实现"一次定义，多种类型适用"且保持类型安全。

**为什么**

```typescript
// ❌ 不用泛型：用 any 丢失类型信息
function identity(arg: any): any { return arg; }

// ❌ 不用泛型：为每个类型重复定义
function identityNumber(arg: number): number { return arg; }
function identityString(arg: string): string { return arg; }

// ✅ 用泛型：一次定义，类型安全
function identity<T>(arg: T): T { return arg; }
const num = identity(42);      // num: number
const str = identity("hello"); // str: string
```

不用泛型只有两种选择：用 `any` 完全放弃类型检查，或为每种类型重复编写函数。前者不安全，后者不 DRY。泛型在两者之间找到了平衡——将类型作为参数传入，让编译器在调用时根据实际参数自动推断类型参数。

泛型的核心应用场景非常广泛：

- **容器类型**：`Array<T>`、`Promise<T>`、`Map<K, V>`——这些都是不含具体类型的"容器"，泛型让它们可以容纳任意类型的数据
- **API 封装**：`axios.get<User[]>("/users")` 自动推断返回类型，让 API 调用获得完整的类型安全
- **React**：`useState<T>()`、`useRef<T>()`、`forwardRef<T>()`——这些 Hook 的返回类型完全由泛型参数决定
- **工具函数**：`clone<T>(obj: T): T`、`pick<T, K extends keyof T>(obj: T, keys: K[])`——类型安全的通用数据处理
- **HOC/组件模式**：通过泛型约束确保高阶组件或混入模式的 props 类型正确

**收束**

泛型 = 类型参数化。核心价值是"一次定义，多处复用，类型安全"。面试时用 `identity<T>` 的例子引出定义，再列举容器类型、API 封装、React Hook 等实际应用场景。

> 📖 详见：[03-generics.md](knowledge/03-generics.md)

---

### 14. 泛型约束（Generic Constraints）是如何工作的？extends 在泛型中的作用？

**是什么**

泛型约束通过 `extends` 关键字限制类型参数必须满足某个形状，确保在泛型内部可以安全地访问类型参数上的属性和方法。

**为什么**

```typescript
// 没有约束：T 可以是任意类型
function getLength<T>(arg: T): number {
  return arg.length; // ❌ T 不一定有 length
}

// 有约束：T 必须有 length 属性
function getLength<T extends { length: number }>(arg: T): number {
  return arg.length; // ✅ T 保证有 length
}

getLength("hello");  // ✅ string 有 length
getLength([1, 2]);   // ✅ 数组有 length
getLength(42);        // ❌ number 没有 length
```

没有约束时，泛型函数内部无法访问任何类型特有的属性和方法，因为编译器不知道 `T` 到底有什么。`extends` 约束告诉编译器"T 至少包含某组属性"，从而在函数体内可以安全地使用这些属性。调用时，如果传入的类型不满足约束，编译器会在调用处报错，而非在运行时才暴露问题。

最经典的泛型约束模式是 `K extends keyof T`：

```typescript
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

getProperty({ name: "Alice", age: 30 }, "name"); // ✅
getProperty({ name: "Alice" }, "age");            // ❌ "age" 不在 keyof T 中
```

这确保了 `key` 参数必须是 `obj` 对象实际存在的属性名。错误在调用时就被捕获，而非在函数内部返回 `undefined`。

需要额外注意：`extends` 在 TypeScript 中具有三重重含义——类继承（`class A extends B`）、泛型约束（`T extends U`）、条件类型判断（`T extends U ? X : Y`）。理解这三个语境是区分不同语法的关键。

**收束**

`extends` 在泛型中用于约束类型参数必须满足特定形状，语法直观如 `T extends { length: number }`。`K extends keyof T` 是获取对象属性名的最常用模式。

> 📖 详见：[03-generics.md](knowledge/03-generics.md) 的"泛型约束"章节

---

### 15. 泛型工具类型有哪些？Partial、Required、Readonly、Pick、Record 的实现原理？

**是什么**

这些是 TypeScript 内置的泛型工具类型，基于**映射类型（Mapped Types）**和**条件类型（Conditional Types）**实现，用于在类型层面进行转换和操作。

**为什么**

```typescript
// Partial<T> — 全部变为可选
type Partial<T> = { [K in keyof T]?: T[K] };

// Required<T> — 全部变为必选
type Required<T> = { [K in keyof T]-?: T[K] };

// Readonly<T> — 全部变为只读
type Readonly<T> = { readonly [K in keyof T]: T[K] };

// Pick<T, K> — 选取部分属性
type Pick<T, K extends keyof T> = { [P in K]: T[P] };

// Record<K, V> — 构造对象类型
type Record<K extends keyof any, V> = { [P in K]: V };

// Exclude<T, U> — 从联合类型排除
type Exclude<T, U> = T extends U ? never : T;

// Extract<T, U> — 从联合类型提取
type Extract<T, U> = T extends U ? T : never;

// NonNullable<T> — 排除 null | undefined
type NonNullable<T> = T extends null | undefined ? never : T;

// ReturnType<T> — 获取函数返回类型
type ReturnType<T extends (...args: any) => any> = T extends (...args: any) => infer R ? R : never;

// Omit<T, K> — 排除某些属性
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

// Parameters<T> — 获取函数参数类型
type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : never;
```

这些工具类型的实现遵循统一的模式：

1. **映射类型**：`{ [K in keyof T]: T[K] }` 遍历 `T` 的所有属性
2. **修饰符调整**：用 `?`（可选）、`readonly`（只读）、`-?`（移除可选）、`-readonly`（移除只读）修改属性
3. **范围控制**：用 `keyof` 限定遍历范围（如 `Pick` 通过 `K extends keyof T` 只选取部分键，`Record` 通过 `K extends keyof any` 允许任意字符串键）
4. **条件类型**：`T extends U ? X : Y` 实现类型层面的条件分支（如 `Exclude` 用 `never` 排除匹配的类型）

理解这些工具类型的实现原理，就能自己编写自定义的工具类型——比如 `DeepPartial<T>`、`Mutable<T>`、`FuncReturnType<T>` 等面试中常见的变体。

**收束**

所有内置工具类型都构建在映射类型 `{ [K in keyof T]: T[K] }` 之上，配合修饰符和条件类型实现类型转换。掌握这个统一模式，比死记硬背每个工具类型的 API 更有价值。

> 📖 详见：[03-generics.md](knowledge/03-generics.md) 的"内置泛型工具类型"和 [05-conditional-mapped-types.md](knowledge/05-conditional-mapped-types.md)

---

## 四、类型守卫与类型收窄

📖 对应知识文章：[04-type-guards-narrowing.md](knowledge/04-type-guards-narrowing.md)

### 16. 什么是类型守卫？typeof、instanceof、in 的区别与使用场景？

**是什么**

类型守卫（Type Guard）是**在条件分支中将宽类型自动收窄为窄类型的表达式**。TS 内置三种基本守卫：`typeof`（检查原始类型）、`instanceof`（检查类实例）、`in`（检查属性存在）。它们本质上是将类型判断逻辑嵌入条件分支，让编译器在分支内推断出更精确的类型。

**为什么**

没有类型守卫时，联合类型只能访问所有成员的共有属性——这在实际开发中远远不够。类型守卫解决了"如何在运行时区分类型，同时让编译器理解这种区分"的问题：它将运行时的类型检查与编译时的类型收窄绑定在一起，使得分支内可以安全地访问特定类型的属性和方法。

`typeof` 用于区分原始类型：
```typescript
function pad(value: string | number) {
  if (typeof value === "number") {
    return value.toFixed(2); // value: number
  }
  return value.padStart(10); // value: string
}
```
`typeof` 能区分的类型包括：`string`、`number`、`boolean`、`undefined`、`symbol`、`function`、`bigint`、`object`。注意 `typeof null === "object"` 是历史遗留问题，判断对象时必须先排除 `null`。

`instanceof` 用于判断类的实例：
```typescript
if (error instanceof TypeError) { /* error: TypeError */ }
```
它通过原型链匹配，适合自定义类或内置构造函数的实例判断。局限是不能跨 realm（如 iframe、不同 Node.js vm 上下文）使用，因为原型引用不同。

`in` 用于检查对象是否包含某属性，适合区分形状不同的联合成员：
```typescript
if ("swim" in animal) { /* animal: Fish */ }
```
它只检查键的存在性，不验证值类型，在复杂场景中需要配合其他守卫。

| 守卫 | 适用场景 | 常见陷阱 |
|---|---|---|
| `typeof` | 原始类型区分 | `typeof null === "object"` |
| `instanceof` | 类实例判断 | 跨 realm 失效 |
| `in` | 联合类型中区分对象形状 | 只检查存在，不检查值类型 |

**收束**

回答时先点明类型守卫的本质是"运行时检查 + 编译时收窄的绑定机制"，再按表分类说明三种内置守卫的适用场景和各自陷阱。能主动指出 `typeof null` 问题和跨 realm 局限是加分项。

> 📖 详见：[04-type-guards-narrowing.md](knowledge/04-type-guards-narrowing.md)

---

### 17. 如何自定义类型守卫（User-Defined Type Guards）？is 关键字的作用？

**是什么**

自定义类型守卫是用 `is` 关键字声明返回类型的函数，称为类型谓词（Type Predicate）。语法为 `参数名 is 类型`，告诉 TS："如果此函数返回 `true`，则该参数已被收窄为指定类型"。

**为什么**

内置守卫（`typeof`、`instanceof`、`in`）只能覆盖基础场景。实际项目中常常需要更复杂的类型判断逻辑——比如验证 API 响应结构、判断配置对象的形状、或校验表单数据。自定义守卫允许你将任意逻辑包装为 TS 可识别的类型收窄函数，将复杂的运行时检查映射为可被编译器理解的类型信息。

```typescript
interface Fish { swim(): void; }
interface Bird { fly(): void; }

// is 关键字：返回 true 时，animal 被收窄为 Fish
function isFish(animal: Fish | Bird): animal is Fish {
  return (animal as Fish).swim !== undefined;
}

declare const pet: Fish | Bird;
if (isFish(pet)) {
  pet.swim(); // ✅ pet: Fish
} else {
  pet.fly();  // ✅ pet: Bird（TS 自动取反）
}
```

不使用 `is` 时，函数即使内部做了判断，TS 也无法理解其类型含义：
```typescript
// ❌ 返回 boolean，TS 不知道类型收窄
function isFishBad(animal: any): boolean { /* ... */ }
// 调用后 animal 仍然是联合类型，无法访问特定成员

// ✅ 返回类型谓词，TS 理解类型关系
function isFishGood(animal: any): animal is Fish { /* ... */ }
// 调用后对应的分支自动收窄
```

**注意事项**：`is` 守卫的运行时逻辑需要开发者自行保证正确性——TS 只信任返回值上的类型声明，不会验证函数体内部的实现。错误的谓词逻辑会导致类型安全隐患，需要配合单元测试保障。

**收束**

核心一句话："`is` 关键字将任意函数的 boolean 返回值映射为类型收窄信号，让 TS 理解自定义判断逻辑的类型含义。" 面试时补一句常见误区即可：谓词函数可能写出 bug 但 TS 不会报错。

> 📖 详见：[04-type-guards-narrowing.md](knowledge/04-type-guards-narrowing.md) 的"自定义类型守卫"章节

---

### 18. 什么是可辨识联合（Discriminated Unions）？如何设计？

**是什么**

可辨识联合（Discriminated Union）是 **联合类型 + 共有字面量判别字段** 的组合模式。每个联合成员通过一个固定的字段（如 `kind`）用字面量类型标记自身身份，TS 通过检查该字段自动收窄到具体成员。

**为什么**

可辨识联合解决了"如何在联合类型中安全、可扩展地做分支处理"的问题。相比 `typeof` 或 `in` 守卫，它的核心优势在于：判别字段集中且显式，新增成员时不会静默遗漏——配合 `never` 穷尽性检查，编译器会在遗漏 case 时直接报错。

```typescript
interface Circle   { kind: "circle";   radius: number; }
interface Square   { kind: "square";   sideLength: number; }
interface Triangle { kind: "triangle"; base: number; height: number; }

type Shape = Circle | Square | Triangle;

function area(shape: Shape): number {
  switch (shape.kind) {
    case "circle":   return Math.PI * shape.radius ** 2;
    case "square":   return shape.sideLength ** 2;
    case "triangle": return (shape.base * shape.height) / 2;
    default:
      // 穷尽性检查：如果遗漏了新成员，shape 不会是 never，编译报错
      const _exhaustive: never = shape;
      return _exhaustive;
  }
}
```

**设计要点**：

1. **字面量类型字段**：判别字段的值必须是字面量类型（如 `"circle"`、`"success"`），而非 `string`——否则 TS 无法区分成员
2. **集中分支处理**：用 `switch` 或 `if-else` 检查判别字段，TS 在每条分支内自动收窄
3. **穷尽性检查**：`default` 分支中将收窄后的类型赋给 `never`——如果新增了成员但忘记加 case，剩余类型不是 `never`，编译报错
4. **实际应用广泛**：Redux reducer 的 action 类型、状态机状态转换、API 响应数据处理等

**收束**

可辨识联合是 TS 中"模式匹配"的最佳实践——用字面量字段做标记、`switch` 做分支、`never` 做穷尽性检查。面试时强调"这是一种让类型错误在编译时暴露、而非运行时崩溃的设计模式"。

> 📖 详见：[04-type-guards-narrowing.md](knowledge/04-type-guards-narrowing.md) 的"可辨识联合"章节

---

## 五、条件类型与映射类型

📖 对应知识文章：[05-conditional-mapped-types.md](knowledge/05-conditional-mapped-types.md)

### 19. 条件类型（Conditional Types）的语法和使用场景？extends 与 infer 关键字的作用？

**是什么**

条件类型的语法是 `T extends U ? X : Y`——在类型层面做三元判断：如果 `T` 可赋值给 `U`，取 `X`，否则取 `Y`。`infer` 则是在 `extends` 子句中**声明并提取**一个待推断的类型变量，相当于类型层面的模式匹配。

**为什么**

条件类型将 JS 运行时的条件逻辑提升到了类型层面，让类型可以"根据输入类型的不同产生不同的输出类型"。这对于编写泛型工具类型至关重要——内置工具类型如 `ReturnType`、`Parameters`、`Awaited` 都是基于条件类型实现的。

基本用法——类型层面的 if/else：
```typescript
type IsString<T> = T extends string ? "yes" : "no";
type A = IsString<string>;  // "yes"
type B = IsString<number>;  // "no"
```

分布条件类型——当 `T` 是联合类型时，条件会**分布在每个成员**上：
```typescript
type ToArray<T> = T extends any ? T[] : never;
type C = ToArray<string | number>; // string[] | number[]
// 等价于 (string extends any ? string[] : never) | (number extends any ? number[] : never)
```
这种"分布性"（Distributive Conditional Types）是条件类型最强大的特性之一，也是很多类型体操题目的核心考点。

`infer` 关键字在条件类型的 `extends` 子句中声明一个"占位类型变量"，让 TS 自动推断：
```typescript
// 提取函数返回类型
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 提取 Promise 包裹的值
type Awaited<T> = T extends Promise<infer U> ? U : T;

// 提取数组元素类型
type ElementOf<T> = T extends (infer E)[] ? E : never;

// 提取函数第一个参数类型
type FirstParam<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;
```

**常见误区**：分布条件类型要求类型参数是"裸用"（naked）的——如果 `T` 被包裹在 `[T]` 中就不会分布。另外 `infer` 只能在条件类型的 `extends` 子句中使用，不能单独声明。

**收束**

"条件类型 = 类型层面的三元表达式，`infer` = 类型层面的模式匹配。" 面试时最好带上 `ReturnType` 的手写实现来说明 infer 的典型用法，并主动解释分布条件类型的特性和触发条件。

> 📖 详见：[05-conditional-mapped-types.md](knowledge/05-conditional-mapped-types.md) 的"条件类型与 infer"章节

---

### 20. 映射类型（Mapped Types）是什么？如何在映射类型中重命名 key（Key Remapping）？

**是什么**

映射类型是 **遍历已有类型的属性键，逐字段生成新类型** 的类型运算。基本语法为 `{ [K in keyof T]: NewType }`。TS 4.1 引入的 `as` 子句进一步允许在遍历时**重命名或过滤 key**。

**为什么**

映射类型解决了"如何基于一个类型自动派生出另一个类型"的问题——这在实际开发中极其常见。例如让所有属性变为可选（`Partial`）、变为只读（`Readonly`）、或批量添加 `get` 前缀方法。手动为每个属性写一遍不仅枯燥，而且当源类型变化时无法同步更新。

基本语法和修饰符：
```typescript
// 基本映射：所有属性值转为 string
type ToString<T> = { [K in keyof T]: string };

// 移除 readonly（`-` 前缀表示移除修饰符）
type CreateMutable<T>  = { -readonly [K in keyof T]: T[K] };

// 移除可选
type CreateRequired<T> = { [K in keyof T]-?: T[K] };
```

Key Remapping——`as` 子句的三重能力：
```typescript
// 1. 重命名 key：给每个属性生成 getter 方法
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};
interface Person { name: string; age: number; }
type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number; }

// 2. 过滤 key：只保留值类型满足条件的属性
type PickByValue<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

// 3. 转换 key：根据模板移除前缀
type RemovePrefix<T, Prefix extends string> = {
  [K in keyof T as K extends `${Prefix}${infer Rest}` ? Rest : never]: T[K];
};
```

**常见误区**：`as` 子句中的 `never` 用于排除 key，而不是产生 `never` 类型的值。另外 `keyof T` 可能包含 `symbol`，与模板字面量结合时需要用 `string & K` 过滤。

**收束**

映射类型的本质是"对对象类型的属性做 forEach 遍历"，`as` 子句在此基础上增加了 map（重命名）和 filter（排除）能力。面试时从内置工具类型（`Partial`、`Readonly`）的实现原理切入，再展开到 Key Remapping 的高级用法。

> 📖 详见：[05-conditional-mapped-types.md](knowledge/05-conditional-mapped-types.md) 的"映射类型与 Key Remapping"章节

---

### 21. 模板字面量类型（Template Literal Types）的应用场景？

**是什么**

模板字面量类型（TS 4.1+）允许在**类型层面拼接和变换字符串**，语法与 JS 模板字面量一致但作用于类型。当插槽位置填入联合类型时，会**自动展开为所有可能组合的联合**。

**为什么**

在模板字面量类型出现之前，事件名（`onClick`、`onFocus`）、CSS 属性（`marginTop`、`paddingLeft`）、路由路径等字符串模式无法在类型层面精确表达。模板字面量类型将这些字符串约束从运行时检查提升到了编译时检查，配合映射类型的 Key Remapping 可以组合出极其强大的类型推导。

```typescript
type Lang = "en" | "zh";
type Welcome = `welcome_${Lang}`; // "welcome_en" | "welcome_zh"

type Hello = `Hello, ${string}`; // 任何以 "Hello, " 开头的字符串
```

经典应用场景：

```typescript
// 1. 事件处理器名称
type EventName = "click" | "focus";
type Handler = `on${Capitalize<EventName>}`; // "onClick" | "onFocus"

// 2. CSS 属性全组合
type Prop = "margin" | "padding";
type Dir = "Top" | "Bottom" | "Left" | "Right";
type CssProp = `${Prop}${Dir}`; // 8 种组合

// 3. 路由类型安全——确保路径格式正确
type Route = `/api/${string}`;

// 4. 深层属性路径推导（配合递归和映射类型）
type DeepKeys<T> = T extends object ? {
  [K in keyof T & string]: K | `${K}.${DeepKeys<T[K]>}`;
}[keyof T & string] : never;

// 5. 内置字符串操作类型
type Greeting = "hello world";
type Shout = Uppercase<Greeting>;    // "HELLO WORLD"
type Title = Capitalize<Greeting>;   // "Hello world"
// 还有 Lowercase、Uncapitalize 等
```

**常见注意点**：当插槽类型是复杂联合时，组合数量会按笛卡尔积暴涨，不要滥用。在映射类型的 Key Remapping 中与 `as` 子句配合是最常见的生产用法。

**收束**

"模板字面量类型 = 在类型层面做字符串模板的拼接和变换，联合类型插槽自动产生全组合。" 面试时重点提两个核心应用：事件名推导和 Key Remapping 中的字符串变换。

> 📖 详见：[05-conditional-mapped-types.md](knowledge/05-conditional-mapped-types.md) 的"模板字面量类型"章节

---

## 六、类与面向对象

📖 对应知识文章：[06-classes-oop.md](knowledge/06-classes-oop.md)

### 22. TS 如何设计 Class 声明？

**是什么**

TypeScript 的 Class 声明在 ES6 class 语法基础上增加了**类型注解、访问修饰符、参数属性、抽象类、implements** 等静态类型特性，让面向对象编程具有完整的类型安全保障。

**为什么**

TS 类解决了 JS 原生类在大型项目中的几个痛点：属性需要外部推断而非显式声明（易出错），没有访问控制（`private`/`protected`），缺少接口约束（`implements`），以及构造函数中重复的 `this.x = x` 模板代码。参数属性（Parameter Properties）是 TS 减少样板代码的经典设计。

```typescript
class Animal {
  // 1. 实例属性——必须显式声明类型
  name: string;

  // 2. 静态属性——属于类本身而非实例
  static species = "unknown";

  // 3. 参数属性——声明 + 赋值一步到位
  //    protected age 会自动声明为 protected 实例属性
  constructor(name: string, protected age: number) {
    this.name = name;
  }

  // 4. 方法——支持返回类型注解
  speak(): void {
    console.log(`${this.name} makes a sound.`);
  }

  // 5. Getter/Setter——访问器也有类型
  get info(): string {
    return `${this.name}, ${this.age}`;
  }
}
```

**TS 类 vs JS 类的关键差异**：

| 特性 | JS 类 | TS 类 |
|---|---|---|
| 属性声明 | 构造函数内赋值即可 | 必须在类体或参数属性中声明类型 |
| 访问修饰符 | 无（`#` 是硬私有） | `public` / `private` / `protected` / `readonly` |
| 抽象 | 无 | `abstract class` + `abstract method` |
| 接口实现 | 无 | `implements Interface` |
| 私有语义 | `#` 运行时硬私有 | `private` 仅编译时检查，运行时仍可访问 |

**常见注意点**：TS 的 `private` 不等于 JS 的 `#`——前者只在编译时报错，运行时不被保护。需要真正运行时私有时应使用 ES 的 `#field` 语法。

**收束**

"TS 类 = ES6 类语法 + 类型系统赋予的静态检查能力。" 回答时从属性声明、参数属性、修饰符三个维度展开，最后点明 `private` 与 `#` 的本质区别——这是高频追问点。

> 📖 详见：[06-classes-oop.md](knowledge/06-classes-oop.md)

---

### 23. 对 TypeScript 类中成员的 public、private、protected、readonly 的理解？

**是什么**

四个访问修饰符控制类成员的可访问性和可变性：`public`（任意访问，默认）、`private`（仅本类内部）、`protected`（本类及子类）、`readonly`（只读不可写）。前三个控制访问范围，`readonly` 控制可变性，可以与前三者组合使用。

**为什么**

访问修饰符是面向对象封装原则（Encapsulation）的落地工具——它让类的设计者能明确声明"哪些是对外的 API，哪些是内部实现细节"。没有修饰符时，类的所有成员都是公开的，外部代码可以随意修改内部状态，导致耦合高、维护难。

```typescript
class Base {
  public a = 1;       // 任意位置可访问
  private b = 2;      // 仅在 Base 类内部可访问
  protected c = 3;    // Base + 子类可访问，外部不可访问
  readonly d = 4;     // 公开只读
}

class Derived extends Base {
  method() {
    console.log(this.a); // ✅ public：任何地方
    console.log(this.b); // ❌ private：子类不可访问
    console.log(this.c); // ✅ protected：子类可以
    this.d = 5;          // ❌ readonly：不可修改
  }
}
```

| 修饰符 | 访问范围 | 子类可访问 | 编译后 |
|---|---|---|---|
| `public`（默认） | 任意位置 | ✅ | 属性保留，无修饰符 |
| `private` | 仅本类内部 | ❌ | 属性保留，仅为编译时检查 |
| `protected` | 本类 + 子类 | ✅ | 属性保留 |
| `readonly` | 与访问修饰符相同 | ✅（读） | 属性保留，仅编译时检查 |

**关键陷阱**：TS 的 `private` 只是**编译时约束**，运行时并不真正保护字段——通过 `obj['privateField']` 或 `Object.keys()` 仍可访问。ES 的 `#field`（硬私有）才是在运行时真正不可访问的。两者可以并存，选择取决于是否需要运行时保护。

**收束**

"`public` / `private` / `protected` 控制谁能访问，`readonly` 控制能否修改——四个修饰符是 TS 实现封装原则的语法工具。" 高频考点是区分 TS `private`（编译时）与 JS `#`（运行时）的不同，面试时要主动提及。

> 📖 详见：[06-classes-oop.md](knowledge/06-classes-oop.md) 的"访问修饰符"章节

---

### 24. 什么是抽象类（Abstract Class）？与接口的区别？

**是什么**

抽象类是用 `abstract` 关键字声明的、**不能实例化只能被继承**的基类。它可以包含已实现的完整方法（共享逻辑），也可以包含只有签名的抽象方法（强制子类实现）。一句话：抽象类 = 部分实现 + 部分契约。

**为什么**

抽象类解决的是"多个子类有共同的逻辑，但部分行为需要各自实现"的问题。与接口相比，抽象类可以将共享逻辑（如基础方法、构造函数、工具函数）放在基类中，子类只需关注差异化的部分。这在模板方法模式、生命周期管理等场景中非常有用。

```typescript
abstract class Animal {
  // 抽象方法——子类必须实现
  abstract makeSound(): void;

  // 已实现方法——共享逻辑（接口做不到）
  move(): void {
    console.log("Moving...");
  }
}

class Dog extends Animal {
  makeSound(): void {
    console.log("Woof!"); // 必须实现
  }
  // move() 从基类继承，不需要重写
}

const a = new Animal(); // ❌ 抽象类不能实例化
const d = new Dog();    // ✅
```

**抽象类 vs 接口的核心差异**：

| 维度 | 抽象类 | 接口 |
|---|---|---|
| 实例化 | ❌ | ❌ |
| 方法实现 | ✅ 可以有完整实现 | ❌ 只有签名 |
| 构造函数 | ✅ 可以有 | ❌ |
| 访问修饰符 | ✅ `private` / `protected` | ❌ |
| 继承数量 | ❌ 只能单继承 | ✅ 可实现多个 |
| 运行时 | ✅ 编译为 JS class，运行时存在 | ❌ 编译时完全擦除 |
| 适用场景 | 共享实现 + 模板方法模式 | 定义契约 + 多态 |

**选择策略**：需要共享实现逻辑、构造函数、或访问修饰符时用抽象类；其他场景优先使用接口——接口更轻量、更灵活、支持多重实现。

**收束**

"抽象类 = 接口 + 部分实现，用于子类共享逻辑；接口 = 纯契约，用于定义形状。" 回答时强调"有实现用抽象类，没实现用接口"的原则，并指出模板方法模式是抽象类的经典应用。

> 📖 详见：[06-classes-oop.md](knowledge/06-classes-oop.md) 的"抽象类"章节

---

### 25. 说说你对 TypeScript 装饰器（Decorators）的理解？

**是什么**

装饰器（Decorator）是一种**声明式元编程**语法，以 `@expression` 的形式附加在类、方法、属性或参数上，在编译/运行时注入额外行为。它本质上是一个接收特定参数的函数，用于修改或增强被装饰的目标。

**为什么**

装饰器解决了"如何在不修改原始类代码的前提下，给类及其成员添加横切关注点（Aspect）"的问题。这在日志、权限校验、依赖注入、数据验证等场景中极为常见。在 Angular 和 NestJS 中，装饰器是整个框架的基石。

```typescript
// 类装饰器——接收构造函数，可修改原型或密封类
function sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

// 方法装饰器——拦截方法调用，常用于日志、性能监控
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function (...args: any[]) {
    console.log(`Calling ${propertyKey} with`, args);
    return original.apply(this, args);
  };
}

// 属性装饰器——常用于添加元数据（配合 reflect-metadata）
function required(target: any, propertyKey: string) {
  // 标记属性为必填，框架可据此做运行时校验
}

@sealed
class MyClass {
  @required
  name: string;

  @log
  greet() { return `Hello, ${this.name}`; }
}
```

**四种装饰器类型**：

| 类型 | 接收参数 | 典型用途 |
|---|---|---|
| 类装饰器 | `constructor: Function` | 密封类、注册类到 IoC 容器 |
| 方法装饰器 | `target, key, descriptor` | 日志、缓存、权限控制 |
| 属性装饰器 | `target, key` | 添加元数据、验证规则 |
| 参数装饰器 | `target, key, index` | 参数注入、参数校验 |

**两个重要版本**：

1. **实验性装饰器**（TS 5.0 前）：需开启 `experimentalDecorators: true`，基于 `--emitDecoratorMetadata` 配合 `reflect-metadata` 使用
2. **Stage 3 装饰器**（TS 5.0+）：ECMAScript 标准语法，参数签名和求值顺序与实验性版本不同，不再依赖 `experimentalDecorators`

**常见误区**：装饰器的执行顺序是**从外到内求值（从上到下）、从内到外执行**。另外属性装饰器无法直接修改属性值，需要配合方法装饰器或返回 descriptor 修改。

**收束**

"装饰器 = 声明式横切关注点注入。" 面试时从四种类型和参数说起，然后区分实验性装饰器与 Stage 3 标准装饰器的不同，最后举一个典型的日志或权限装饰器例子——NestJS 和 Angular 的开发经验是天然加分项。

> 📖 详见：[06-classes-oop.md](knowledge/06-classes-oop.md) 的"装饰器"章节

---

## 七、类型操作与工具

📖 对应知识文章：[07-type-operations.md](knowledge/07-type-operations.md)

### 26. keyof 和 typeof 关键字的作用？

**是什么**

`keyof` 获取对象类型所有键的联合类型；`typeof`（类型上下文中）获取运行时值的编译时类型。两者一个是纯类型操作，一个用于桥接运行时与编译时。

```typescript
interface User { id: number; name: string; email: string; }
type UserKeys = keyof User; // "id" | "name" | "email"

const config = { host: "localhost", port: 8080 };
type Config = typeof config; // { host: string; port: number; }
```

**为什么**

`keyof` 是 TypeScript 类型运算的基础操作符之一，几乎所有工具类型的骨架都依赖它。它让你能在类型层面枚举对象的键，从而编写出泛化的类型变换逻辑。常见误区是以为 `keyof` 对联合类型也能产生直观结果——实际上 `keyof (A | B)` 取的是联合成员的共有键，而非并集。

`typeof` 在值到类型的映射中不可替代。经典组合是 `keyof typeof obj`，用于从运行时常量定义派生联合类型，避免重复声明：

```typescript
const Colors = { Red: "#FF0000", Green: "#00FF00", Blue: "#0000FF" } as const;
type ColorName = keyof typeof Colors;   // "Red" | "Green" | "Blue"
type ColorValue = typeof Colors[ColorName]; // "#FF0000" | "#00FF00" | "#0000FF"
```

这种模式在配置管理、事件名称定义、状态机等场景中非常常见——改一处常量定义，类型自动同步，零维护成本。

**收束**

`keyof` 是类型运算的"迭代器"，`typeof` 是值到类型的"桥梁"；`keyof typeof` 组合是从常量推导联合类型的标准模式，面试官期待你能举出这个组合的实际案例。

> 📖 详见：[07-type-operations.md](knowledge/07-type-operations.md)

---

### 27. 简述工具类型 Exclude、Omit、Merge、Intersection、Overwrite 的作用与实现

**是什么**

这五个工具类型分别实现联合成员排除、属性排除、对象合并、交叉类型直接使用、属性级覆盖。其中 Exclude 和 Omit 是 TS 内置的，Merge、Intersection、Overwrite 通常在项目中自行定义。

```typescript
type Exclude<T, U> = T extends U ? never : T;              // 条件类型 + 分布式
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
type Merge<A, B> = Omit<A, keyof B> & B;
type Overwrite<T, U> = { [K in keyof T]: K extends keyof U ? U[K] : T[K] };
```

**为什么**

Exclude 利用条件类型的分布式特性——当 `T` 是联合时，条件表达式逐一应用于每一个成员。这是理解整个 TS 条件类型体系的关键模式。Omit 在其之上组合了 Pick 和 Exclude，是映射类型的典型"搭积木"案例。

Merge 与 Overwrite 的区别是面试中容易踩坑的地方：Merge 用 `&` 交叉，在同名属性类型不一致时可能产生 `never`；Overwrite 用映射类型逐属性判断，结果更可预期：

```typescript
// Merge 的问题：同名属性类型冲突 → never
type M = Merge<{ a: string }, { a: number }>;
// { a: string & number } → { a: never } ← 不是期望的行为

// Overwrite 更精确：逐属性判断，用 U 的替换
type O = Overwrite<{ a: string; b: boolean }, { a: number }>;
// { a: number; b: boolean }
```

Intersection（`&`）本身就是操作符而非工具类型，但它的行为需要理解——对象交叉类型**合并属性**，联合交叉类型**取交集成员**。误以为 `A & B` 是"取并集"是常见误区。

**收束**

掌握 Exclude 的分布式条件类型原理和 Omit 的 Pick + Exclude 组合是基础；理解 Merge 和 Overwrite 的取舍（交叉 vs 映射）能区分"会用"和"精通"两个层次。

> 📖 详见：[07-type-operations.md](knowledge/07-type-operations.md) 和 [03-generics.md](knowledge/03-generics.md)

---

### 28. 类型断言（Type Assertions）有哪几种写法？as const 的作用？

**是什么**

类型断言是"告诉编译器我知道这个值是什么类型，你不用检查了"。有两种写法：`as` 语法（推荐）和尖括号语法（JSX 中不可用）。`as const` 是将字面量值收窄为最精确的不可变类型。

```typescript
const value = someValue as string;     // as 语法
const value2 = <string>someValue;      // 尖括号语法（JSX 中冲突）
const x = "hello" as any as number;    // 双重断言（绕过检查，不推荐）
```

**为什么**

类型断言在从宽类型向窄类型转换时不可避免，比如操作 DOM、解析 JSON、与第三方 JS 库交互。但过度使用断言等于放弃类型检查——每次写 `as` 都应该自问"有没有更好的方式"。

`as const` 是 TS 3.4 引入的精髓特性，效果有三：所有属性变为 `readonly`、值变为字面量类型、数组变为 `readonly` 元组。它在常量配置、枚举替代、函数式编程中广泛使用：

```typescript
// 没有 as const：类型被宽化
const a = { name: "Alice", age: 30 };
// { name: string; age: number; }

// 使用 as const：精确字面量 + 只读
const b = { name: "Alice", age: 30 } as const;
// { readonly name: "Alice"; readonly age: 30; }
```

常见的陷阱是混淆类型断言和类型转换——断言不会做任何运行时转换，它只在编译时影响类型判断。如果你需要真的转换，请写运行时代码：

```typescript
// ❌ 断言不会把 string 变成 number
const n = "42" as number; // 编译通过，运行时还是字符串

// ✅ 运行时转换
const n2 = Number("42");  // number
```

**收束**

`as` 是必要的逃生阀，但要用得克制；`as const` 是精确化类型的利器，在常量推导中几乎必用。记住：断言只影响编译时，不影响运行时。

> 📖 详见：[07-type-operations.md](knowledge/07-type-operations.md) 的"类型断言"章节

---

### 29. satisfies 关键字（TS 4.9）的作用与使用场景？

**是什么**

`satisfies` 用于**检查一个值的类型是否满足约束，同时保留最精确的推断结果**——它不像类型注解那样会宽化类型。

```typescript
const config = {
  red: [255, 0, 0],
  blue: "#0000FF",
} satisfies Record<string, string | [number, number, number]>;
config.red.map(x => x);     // ✅ 推断为元组方法
config.blue.toUpperCase();  // ✅ 推断为 string 方法
```

**为什么**

在 `satisfies` 出现之前，开发者面临一个两难：用类型注解 `: Type` 会丢失字面量信息；不用注解又无法验证形状约束。这让开发者被迫在类型安全与开发体验之间妥协。

`satisfies` 解决了这个痛点。典型场景包括 API 响应映射、多态配置对象、颜色/主题定义等。它比类型注解更"聪明"——检查类型但不改变推断：

```typescript
// 对比三种方式
interface ColorConfig { red: string | [number, number, number]; }

// 注解：检查了类型，但丢失了精确推断
const a: ColorConfig = { red: [255, 0, 0] };
a.red.map(x => x); // ❌ string | [number, number, number] 上没有 map

// as：也不改变推断，但放弃了检查
const b = { red: [255, 0, 0] } as ColorConfig; // 不检查结构

// satisfies：既检查，又保留精确类型
const c = { red: [255, 0, 0] } satisfies ColorConfig;
c.red.map(x => x); // ✅ 精确推断为元组
```

**收束**

`satisfies` 是 TS 4.9 最重要的语言特性之一，填补了类型注解（宽化）和 as（不检查）之间的空白——"检查但不改变"，在类型安全与精确推断之间找到平衡。

> 📖 详见：[07-type-operations.md](knowledge/07-type-operations.md) 的 "satisfies" 章节

---

### 30. 索引签名（Index Signature）是什么？如何使用？

**是什么**

索引签名定义通过方括号访问属性时的值类型，告诉 TS"这个对象可以接受动态的键"。语法为 `[key: string]: ValueType`，其中 `key` 是占位符名称，冒号后是属性值类型。

```typescript
interface StringMap {
  [key: string]: string;
}
const map: StringMap = { a: "hello", b: "world" };
map.c = "!";              // ✅
```

**为什么**

索引签名在处理动态数据时必不可少——API 响应、配置对象、缓存、表单数据等场景都需要"未知键但已知值类型"的表达力。但它的使用有几个关键约束，理解这些约束才能避免坑：

```typescript
// 约束 1：所有命名属性必须兼容索引签名的值类型
interface Foo {
  [key: string]: string;
  length: number; // ❌ number 不是 string 的子类型
}

// 约束 2：数字索引的值类型必须是字符串索引值类型的子类型
interface Bar {
  [index: number]: string;          // 数字索引
  [key: string]: string | number;   // 字符串索引必须覆盖数字索引
}

// 约束 3：无法枚举出具体的键——类型层面没有约束
function process(map: Record<string, string>) {
  map.foo; // 不报错，但编译时不知道 foo 是否存在
}
```

实际项目中更推荐使用 `Record<K, V>` 或 `Map<K, V>` 而非裸索引签名。`Record` 是内置的映射工具类型，表达能力相同但意图更清晰：

```typescript
type UserCache = Record<string, User>;  // ✅ 等价于索引签名，更简洁
```

**收束**

索引签名是表达"字典"或"动态对象"的核心手段，但要理解它与命名属性的兼容性规则。生产环境中优先使用 `Record<K, V>`，仅在需要同时使用数字和字符串索引时手写索引签名。

> 📖 详见：[07-type-operations.md](knowledge/07-type-operations.md) 的"索引签名"章节

---

## 八、模块与命名空间

📖 对应知识文章：[08-modules-namespaces.md](knowledge/08-modules-namespaces.md)

### 31. import 报 "Cannot find module" 怎么排查？Namespace 还有人用吗？

**是什么**

这道题不是让你背模块加载算法——面试官真正想问的是：**import 出问题时你知道往哪个方向排查**，以及你知不知道 namespace 已经过时了。

**为什么**

**99% 的 import 报错，查这三个地方就够：**

```typescript
// ❌ 典型报错：Cannot find module './user' or its corresponding type declarations.

// ① 路径写对了吗？文件扩展名补了吗？
import { User } from "./User";   // 相对路径以 ./ 或 ../ 开头

// ② tsconfig 的 moduleResolution 配了吗？
// module 管"输出什么格式"（import 还是 require）
// moduleResolution 管"怎么找到那个文件"（第二层讲的 6 步文件查找）
// 前端 Webpack/Vite → "bundler"（最宽松，允许省略后缀）
// Node.js ESM → "nodenext"（要求写 .js 后缀，支持 exports）
// 老 Node CJS → "node"（模拟 require.resolve）

// ③ node_modules 里到底有没有这个包？有没有 @types？
import lodash from "lodash";      // JS 包没类型 → npm i -D @types/lodash
import myPkg from "my-pkg";       // 没 @types → 自己写 declare module "my-pkg"
```

**namespace 一句话：别用。** 它是 TS 2012 年没有 ESM 时的过渡方案。现在唯一的合法使用场景是在 `.d.ts` 里声明第三方全局变量：

```typescript
// ✅ 唯一合法的 namespace 用法
declare namespace Express {
  interface Request { user?: { id: string } }
}
// ❌ 应用代码里永远别写 namespace MyApp { ... }
```

**收束**

import 报错三板斧：路径 → moduleResolution → @types/node_modules。namespace = 历史遗留，新代码碰都别碰。

> 📖 详见：[08-modules-namespaces.md](knowledge/08-modules-namespaces.md)

---

### 32. TypeScript 中如何设置模块导入的路径别名？

**是什么**

路径别名允许用简洁的路径代替深层的相对路径导入。需要在 tsconfig 中配置 `paths` 配合 `baseUrl`，同时确保打包工具或运行时有对应的别名解析。

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

**为什么**

路径别名直接提升代码可维护性。深层嵌套的相对路径如 `../../../components/Button` 在重构目录结构时需要全部重写，而 `@components/Button` 则不受目录深度影响。

配置路径别名有三个必须同步的环节，任何一个断联就会导致"编译通过但运行报错"的经典问题：

```typescript
// 1. tsconfig.json — TS 编译时识别别名
// 2. 打包工具 — 运行时解析别名
//    - Vite:   resolve.alias
//    - Webpack: resolve.alias
//    - esbuild: alias
// 3. 测试框架 — 测试时解析别名
//    - Jest:   moduleNameMapper
```

其中容易被忽略的是**编辑器集成**——配置了 `paths` 后 VS Code 等编辑器能正确提供补全和跳转。另一个坑是 `path` 不支持包名（bare specifier）别名——只有相对路径或 node_modules 中的包才被支持。

```typescript
// ✅ tsconfig paths 支持的写法
import Button from "@components/Button";  // 映射到 src/components/Button
import { format } from "@utils/date";     // 映射到 src/utils/date

// ⚠️ tsconfig 中不能这样写
// "paths": { "lodash": ["node_modules/lodash"] }
// 应直接用裸导入：import _ from "lodash";
```

**收束**

路径别名三步走：tsconfig `paths` + 打包工具 `alias` + 测试工具 `moduleNameMapper`。每步都不能少。推荐统一使用 `@/` 前缀表示 src 根目录，团队约定优于个人偏好。

> 📖 详见：[08-modules-namespaces.md](knowledge/08-modules-namespaces.md) 和 [11-config-compilation.md](knowledge/11-config-compilation.md)

---

### 33. 如何使 TS 项目引入并识别编译为 JS 的 npm 包？

**是什么**

当 npm 包只有 JS 文件没有 `.d.ts` 类型声明时，TS 无法推导其类型。解决方案分三级：社区类型包、手写模块声明、宽松声明兜底。

**为什么**

TypeScript 项目的类型安全依赖于类型声明。JS 生态中有大量优秀的包没有自带类型（或类型不完整），直接导入会报 `Could not find a declaration file for module 'xxx'` 错误。

优先级从高到低的做法：

第一选择是安装社区维护的类型包。DefinitelyTyped 涵盖了绝大多数流行库，命名格式为 `@types/包名`：

```bash
npm i -D @types/express    # Express 的类型
npm i -D @types/lodash     # Lodash 的类型
```

第二选择是手写模块声明。适用于内部包、社区没有类型包的自定义包，或需要局部精确类型控制的场景：

```typescript
// declarations.d.ts
declare module "my-private-pkg" {
  export function createApp(config?: { port?: number }): { start(): void };
  export const VERSION: string;
}
```

第三选择是兜底方案——声明模块为 `any`，仅在快速原型或迁移过渡期使用：

```typescript
declare module "untyped-pkg"; // 所有导入为 any
```

对于包作者，最佳实践是在 `package.json` 中声明类型入口，让消费者自动获得类型：

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

**收束**

优先级：社区 `@types` 包 > 手写模块声明 > 宽松 any 兜底。理解 `.d.ts` 的查找规则（`types` 字段 → `@types` → 自动查找）对排查"类型找不到"问题至关重要。

> 📖 详见：[08-modules-namespaces.md](knowledge/08-modules-namespaces.md) 和 [10-declaration-files.md](knowledge/10-declaration-files.md)

---

## 九、类型兼容性

📖 对应知识文章：[09-type-compatibility.md](knowledge/09-type-compatibility.md)

### 35. 简单聊聊你对 TypeScript 类型兼容性的理解？

**是什么**

TypeScript 采用**结构类型系统（Structural Typing）**——类型是否兼容取决于它们的内部结构（属性与方法），而非类型名称。这与 Java/C# 的**标称类型系统（Nominal Typing）**截然相反。

```typescript
interface Point { x: number; y: number; }
interface Vector { x: number; y: number; }
let p: Point = { x: 1, y: 2 };
let v: Vector = p; // ✅ 结构兼容，不关心名字
```

**为什么**

结构类型系统的设计决策直接服务于 TS 的核心目标——**在保留 JS 灵活性的前提下提供类型安全**。JS 的鸭子类型哲学（"如果它走路像鸭子，叫起来像鸭子，它就是鸭子"）决定了"只看形状不看名字"的兼容规则是最自然的选择。

理解类型兼容性的三个核心原则就能推导出几乎所有边界情况：

```typescript
// 原则 1：子类型可以赋值给父类型（成员多的可赋值给成员少的）
interface Named { name: string; }
interface Person { name: string; age: number; }
let named: Named;
let person: Person = { name: "Alice", age: 30 };
named = person; // ✅ 因为 Person 包含 Named 的所有成员
// person = named; // ❌ 缺少 age

// 原则 2：对象字面量有额外属性检查（Freshness）
// 当直接将字面量赋给类型时，TS 会严格检查"多余属性"
named = { name: "Bob", age: 25 }; // ❌ 字面量中的 age 是多余的
named = { name: "Bob" };           // ✅

// 原则 3：函数参数双向逆变（strictFunctionTypes 下）
// 见第 36 题详解
```

常见的困惑在于"明明结构相同，为什么赋值不通过"——通常是**新鲜字面量**导致的多余属性检查在起作用。这个检查只发生在"新鲜"的对象字面量上（编译器刚构造出来的），一旦赋给变量就不再检查：

```typescript
const extra = { name: "Bob", age: 25 };
named = extra; // ✅ 非新鲜对象，跳过额外属性检查
```

**收束**

结构类型系统是 TS 灵活性的根基，核心逻辑是"成员够用就兼容"。记住额外属性检查只针对新鲜字面量，掌握这个规则就能解释大多数类型兼容性的"反直觉"行为。

> 📖 详见：[09-type-compatibility.md](knowledge/09-type-compatibility.md)

---

### 36. 协变（Covariance）与逆变（Contravariance）是什么？TypeScript 中的表现？

**是什么**

在类型系统中，协变指**子类型可以赋值给父类型**，逆变指**父类型可以赋值给子类型**。函数的返回类型是协变的，参数类型在 `strictFunctionTypes` 下是逆变的。

```typescript
class Animal { eat() {} }
class Dog extends Animal { bark() {} }

// 协变：返回类型
type GetAnimal = () => Animal;
type GetDog = () => Dog;
let ga: GetAnimal = () => new Animal();
let gd: GetDog = () => new Dog();
ga = gd; // ✅ 子类型返回可赋值给父类型返回

// 逆变：参数类型
type FeedAnimal = (a: Animal) => void;
type FeedDog = (d: Dog) => void;
let fa: FeedAnimal = (a: Animal) => { a.eat(); };
let fd: FeedDog = (d: Dog) => { d.bark(); };
fd = fa; // ✅ 父类型参数可赋值给子类型参数
```

**为什么**

理解协变与逆变的直觉来自于**"消费 vs 生产"**的视角。函数返回类型是"生产"（提供数据），子类型比父类型提供更多——所以协变安全。函数参数是"消费"（处理数据），能处理父类型的函数一定也能处理子类型——所以逆变安全。

```typescript
// 为什么参数必须逆变？反证法：
type Handler = (data: unknown) => void;
type StringHandler = (data: string) => void;

let h: Handler = (d: unknown) => {};
let sh: StringHandler = (d: string) => d.toUpperCase();

// 如果参数是协变的（sh 可赋值给 h）：
// h = sh;         // 假设协变，编译通过
// h(42);           // 运行时：d.toUpperCase 不是函数 → 崩溃！
// ∴ 参数必须逆变或双变

// 实际 TS 行为：
h = sh; // ❌ strictFunctionTypes 下报错
```

TypeScript 有一个特殊之处——**方法签名的参数是双变的**（既协变又逆变）。这是为了兼容性考虑：

```typescript
interface WithMethod {
  handler(data: string): void;       // 方法声明
}
interface WithProperty {
  handler: (data: string) => void;   // 函数属性
}

// 方法声明：双变（宽松，兼容老代码）
// 函数属性：逆变（严格模式下的安全行为）
```

这个差异是面试中的经典考点——了解这个区别说明你对 TS 类型系统的细节有深入理解。

**收束**

协变 = 输出（返回类型，安全），逆变 = 输入（参数类型，安全）。TS 方法签名是双变的（历史原因），函数属性是逆变的（strictFunctionTypes 下）。记住"消费逆变、生产协变"这个口诀。

> 📖 详见：[09-type-compatibility.md](knowledge/09-type-compatibility.md) 的"协变与逆变"章节

---

### 37. TypeScript 中对象展开会有什么副作用吗？

**是什么**

对象展开（`{ ...obj }`）在运行时是浅拷贝，在类型层面则有推断精度的限制——TS 对展开操作的类型推导有已知的局限，尤其在泛型场景中表现明显。

```typescript
interface User { name: string; age: number; }
const user: User = { name: "Alice", age: 30 };

// 展开后类型是展开后的新对象类型，不是交叉类型
const extended = { ...user, role: "admin" };
// { name: string; age: number; role: string; }
// 不是 User & { role: string; }
```

**为什么**

对象展开的类型推导问题主要体现在三个方面，理解它们可以避免生产环境中的意外类型错误：

第一，**泛型中的展开类型不安全**。TS 编译器无法保证 `{ ...obj, ...extra }` 的结果完全等于 `T & U`，因为运行时展开的行为（属性枚举、getter/setter 触发、Symbol 属性丢失等）与重载的泛型签名可能不一致：

```typescript
function extend<T extends object, U extends object>(obj: T, extra: U): T & U {
  return { ...obj, ...extra }; // ❌ 编译报错
  // 类型 '{ ...obj, ...extra }' 不可赋值给类型 'T & U'
}
```

解决方案通常是使用类型断言或重载签名。

第二，**可选属性的展开行为与直觉不符**。展开一个可选属性为 `undefined` 的对象时，该属性在结果对象中被**丢弃**而非保留为 `undefined`：

```typescript
interface Config { debug?: boolean; }
const cfg: Config = { debug: undefined };
const copy = { ...cfg };
// copy 的类型是 {}，没有 debug 属性！
// 因为展开 undefined 属性值时，该键被跳过
```

第三，**嵌套对象的浅拷贝**。展开只复制最外层属性的引用，嵌套对象仍然共享。`as const` 断言也无法改变这一行为——它只在类型层面标记只读，不改变运行时的可变性：

```typescript
const original = { nested: { value: 1 } } as const;
const clone = { ...original };
clone.nested.value = 2; // ✅ 编译时可能通过，运行时修改了原始对象！
```

**收束**

展开操作的副作用集中在：泛型推断不精确、可选值 `undefined` 的键被丢弃、浅拷贝。实战中使用展开时保持对象结构扁平，泛型中配合断言或重载使用。面试时能说出"展开的不是 `T & U`，而是属性展开后的新对象类型"就算过关。

> 📖 详见：[09-type-compatibility.md](knowledge/09-type-compatibility.md) 的"对象展开"章节

---

## 十、声明文件与环境声明

📖 对应知识文章：[10-declaration-files.md](knowledge/10-declaration-files.md)

### 38. declare、declare global 是什么？使用场景？

**是什么** — `declare` 关键字告诉 TypeScript 编译器"这个变量、函数、类或模块已经在别处（运行时）存在，无需检查定义，只需知道其类型签名"。`declare global` 则是在模块文件中显式扩展全局作用域。

```typescript
// declare：声明外部存在的变量/函数/模块
declare const API_BASE: string;
declare function gtag(event: string, data?: object): void;
declare module "*.module.css" { const classes: Record<string, string>; export default classes; }
```

**为什么** — 你需要 `declare` 是因为 TS 不可能知道所有运行时存在的东西。最常见的情况是：HTML 页面通过 `<script>` 加载的第三方全局变量（如 `_paq`、`ga`、`grecaptcha`）、Webpack/Vite 的 `import.meta.env`、CSS Module 的导入，以及没有自带类型定义的 npm 包。

没有 `declare` 时，TS 会报 `Cannot find name 'xxx'` 或 `Cannot find module 'xxx'` 的错误。用 `declare` 就是给这些"凭空出现"的东西补上类型契约。

`declare global` 解决的是一个更隐蔽的问题：当你处于一个模块文件（有 `import`/`export`）中时，所有声明默认是局部的。如果你想给 `Window`、`String` 或 `NodeJS.ProcessEnv` 添加额外属性，必须用 `declare global { }` 把声明"提升"到全局层级。

```typescript
// 在模块文件中扩展现有全局接口
declare global {
  interface Window { __APP_CONFIG__: { env: string }; }
  interface String { toTitleCase(): string; }
}
export {}; // 无此 export，文件就是脚本而非模块
```

常见陷阱：在 `.d.ts` 文件中忘记加上 `export {}` 或 `import`，会导致 TS 将该文件视为全局脚本而非模块，使得 `declare global` 实际无效且污染全局命名空间。

**收束** — `declare` 是 TS 与运行时世界的桥梁，告诉编译器"相信我，它存在"；`declare global` 是模块文件打开全局作用域的阀门，用于扩展内置类型或 Window 接口。

> 📖 详见：[10-declaration-files.md](knowledge/10-declaration-files.md)

---

### 39. 全局声明和局部声明（Ambient Declarations）的区别？

**是什么** — 全局声明（Global Ambient Declarations）无需导入即可在任何文件中使用；局部声明（Module Ambient Declarations）仅在当前模块作用域内生效，其他文件必须导入才能使用。两者的分界线只有一个：**文件是否包含 `import` 或 `export` 语句**。

**为什么** — TS 严格遵循 ES Module 规范：文件只要有 `import`/`export` 就是模块（Module），所有声明属于模块作用域；没有则是脚本（Script），所有声明属于全局作用域。这直接决定了 `.d.ts` 文件的行为。

```typescript
// ========== 全局声明（脚本文件，无 import/export） ==========
// types/env.d.ts — 自动全局可见
declare const ENV: "development" | "production";
// 任意文件中直接使用：console.log(ENV);

// ========== 局部声明（模块文件，有 import/export） ==========
// types/module-augment.d.ts
import "some-lib";
declare module "some-lib" {
  interface Options { extraField: boolean; }
}
// 这个模块声明只在导入 "some-lib" 时生效

// ========== 模块文件中的全局声明 ==========
// types/global.d.ts
export {}; // 强制为模块
declare global {
  interface Window { MY_APP: { version: string }; }
}
```

理解这个区别对避免"声明了但不生效"的问题至关重要。一个常见错误是在 `.d.ts` 文件中无意写了 `import`（比如引入其他类型），导致文件从全局脚本变成模块，所有声明都不再全局可见。解决方法是：要么去掉 `import` 改用三斜线指令，要么显式用 `export {}` 声明为模块并在 `declare global` 中包装。

```typescript
// ❌ 误区：为了使用其他类型加了 import，导致全局声明失效
// types/env.d.ts
import "./other-types";
declare const API_URL: string; // 不再全局可见！

// ✅ 正确：使用三斜线保持脚本文件身份
// types/env.d.ts
/// <reference path="./other-types.d.ts" />
declare const API_URL: string;
```

**收束** — 全局声明在脚本文件中自动全局化，局部声明在模块文件中默认模块化；用 `declare global` 在模块中模拟全局声明。记住"文件有没有 `import`/`export`"是唯一判断标准。

> 📖 详见：[10-declaration-files.md](knowledge/10-declaration-files.md) 的"全局 vs 局部声明"章节

---

### 40. .d.ts 声明文件的编写规范与模块声明（Module Augmentation）？

**是什么** — `.d.ts` 声明文件是纯类型描述文件（编译后零产出），它为 JS 库或运行时环境提供类型签名。模块声明扩展（Module Augmentation）允许你在不修改源码的前提下，为已有模块添加或覆盖类型。

**为什么** — 编写 `.d.ts` 的核心场景有三个：为无类型的 npm 包补类型、为你自己的 JS 库生成声明、为全局脚本变量提供类型。

编写规范遵循以下原则：

```typescript
// types/sdk.d.ts — 模块声明规范
declare module "my-sdk" {
  // 1. 导出接口/类型
  export interface ClientOptions {
    baseUrl: string;
    timeout?: number;
  }

  // 2. 函数（支持重载）
  export function createClient(): Client;
  export function createClient(opts: ClientOptions): Client;
  export function createClient(baseUrl: string, opts?: ClientOptions): Client;

  // 3. 类
  export class Client {
    constructor(opts: ClientOptions);
    request<T>(method: string, path: string): Promise<T>;
    readonly connected: boolean;
  }

  // 4. 常量
  export const VERSION: string;

  // 5. 默认导出
  export default createClient;
}
```

模块声明扩展（Module Augmentation）解决的是"第三方库类型不够用"的问题。比如 Express 的 `Request` 没有 `user` 字段，你不应该改 `@types/express`，而是在自己的文件中扩展它：

```typescript
// types/express-augment.d.ts
import "express";

declare module "express" {
  interface Request {
    user?: { id: string; role: "admin" | "user" };
    requestId: string;
  }
}
// 之后在任何中间件中：req.user、req.requestId 都有类型
```

一个容易被忽视的约束：模块扩展的文件名必须以 `.d.ts` 结尾或在 tsconfig 中被包含，否则 TS 不会加载它。另外，扩展只能**追加**属性和方法，不能删除或修改已有声明的类型。

常见陷阱：扩展全局类的原型（如 `String.prototype.toTitleCase`）需要用 `declare global` 而不是 `declare module`：

```typescript
declare global {
  interface String {
    toTitleCase(): string;
  }
}
```

**收束** — `.d.ts` 是"零成本的类型契约"（编译后消失），模块扩展是"不碰源码改类型"的插件模式。核心规范是：匹配 JS 运行时结构、导出签名完整、用 `declare module` 包裹、用 `declare global` 扩展全局。

> 📖 详见：[10-declaration-files.md](knowledge/10-declaration-files.md) 的 "模块声明与扩展" 章节

---

## 十一、配置与编译

📖 对应知识文章：[11-config-compilation.md](knowledge/11-config-compilation.md)

### 41. tsconfig.json 中有哪些配置项？核心配置有哪些？

**是什么** — `tsconfig.json` 是 TypeScript 项目的配置文件，定义编译器选项、包含/排除的文件列表、项目引用等。核心配置分为五大类：严格性检查、模块解析、输出控制、JS 兼容性、编辑器辅助。

**为什么** — tsconfig.json 的作用远远不止是编译参数。它定义了整个项目的"严格度"——这直接决定了你能享受多少类型安全保障。

严格模式是首先要关注的。`strict: true` 一键开启所有严格检查，但理解其组成选项更重要：

```json
{
  "compilerOptions": {
    // === 严格性检查 ===
    "strict": true,                              // 开启下面所有严格选项
    "strictNullChecks": true,                    // null/undefined 不能赋值给其他类型（排坑核心）
    "noImplicitAny": true,                       // 禁止隐式 any（函数参数必须有类型或推导出类型）
    "strictFunctionTypes": true,                 // 函数参数逆变检查（防止运行时类型不安全）
    "strictPropertyInitialization": true,        // 类的实例属性必须在 constructor 中初始化
    "noUncheckedIndexedAccess": true,            // 索引访问结果包含 | undefined

    // === 模块系统 ===
    "module": "ESNext",                          // 模块输出格式（ESNext / CommonJS / NodeNext）
    "moduleResolution": "bundler",               // 模块解析策略（bundler / node16 / classic）
    "baseUrl": ".",                              // 非相对路径的基准目录
    "paths": { "@/*": ["src/*"] },               // 路径别名
    "types": ["node", "jest"],                   // 自动包含的 @types 包
    "typeRoots": ["./node_modules/@types"],      // 类型包查找目录

    // === 输出控制 ===
    "target": "ES2022",                          // 目标 JS 版本
    "outDir": "./dist",                          // 输出目录
    "declaration": true,                         // 生成 .d.ts 文件（库项目必须）
    "declarationMap": true,                      // 生成声明文件的 sourcemap
    "sourceMap": true,                           // 生成 .js.map
    "noEmit": true,                              // 仅类型检查，不生成文件（前端项目常见）

    // === JS 兼容 ===
    "allowJs": true,                             // 允许编译 JS 文件
    "checkJs": true,                             // 对 JS 文件做类型检查
    "esModuleInterop": true,                     // 允许 import 导入 CommonJS 模块
    "skipLibCheck": true,                        // 跳过 node_modules 类型检查（大幅提速）

    // === 编辑器辅助 ===
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,                   // 所有路径必须有返回值
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

推荐的基础配置因项目类型而异。库项目需要 `declaration: true` + `declarationMap: true`；前端应用常用 `noEmit: true`（交给打包工具编译）；Node.js 后端项目倾向于 `module: "NodeNext"` + `moduleResolution: "NodeNext"`。

常见误区：`"module": "ESNext"` 和 `"moduleResolution": "node"` 混用会导致解析行为不一致；`skipLibCheck: true` 不是偷懒选项，几乎每个项目都应该开启（否则每次安装依赖都会检查所有 `@types/*` 的声明文件）。

**收束** — `strict` 是一切的起点，`moduleResolution` 必须与 `module` 配合，`skipLibCheck` 始终开启，声明产出按项目用途配置。牢记"严格模式不伤生产力，它是在保存生产力"。

> 📖 详见：[11-config-compilation.md](knowledge/11-config-compilation.md)

---

### 42. TS 的编译原理？tsc 与 babel 编译 TS 的区别？

**是什么** — TSC（TypeScript Compiler）是 TS 官方的完整编译器，核心流程：**源码 -> 扫描/解析 -> AST -> 类型检查 -> 类型擦除 -> JS 输出**。Babel 则是一个语法转译器，只剥离类型注解，不做类型检查。

**为什么** — 理解 TSC 的编译流程能帮你定位很多诡异问题。

TSC 的四个阶段：
1. **扫描与解析**：词法分析（tokenize）--- 语法分析（parse），生成 AST（抽象语法树）
2. **绑定与符号解析**：遍历 AST，建立符号表（Symbol Table），连接标识符到其声明（作用域分析）
3. **类型检查**：基于绑定信息进行类型检查，这是 TS 的核心价值所在
4. **代码生成**：类型擦除 + AST -> JS 源码输出（如果 target 低于 ES 版本还可能做降级）

```typescript
// 输入 TS
function greet(name: string): string { return `Hello ${name}`; }

// 类型检查后，步骤 4 输出 JS（类型擦除且无声明）
function greet(name) { return `Hello ${name}`; }
```

TSC 与 Babel 的关键差异：

| 维度 | TSC（tsc） | Babel（@babel/preset-typescript） |
|---|---|---|
| 类型检查 | 完整类型检查 | 不检查，只剥离类型注解 |
| 编译速度 | 慢（全量类型检查） | 快（纯语法转换） |
| 语法降级 | 有限（target 控制） | 强大（@babel/preset-env + polyfill） |
| 装饰器 | 实验性 / Stage 3 | 支持（不同插件） |
| const enum | 内联实现 | 默认忽略（可能导致运行时错误） |
| 插件生态 | 几乎无 | 极其丰富 |

常见的生产实践是**职责分离**：
- **Babel** 负责实际编译（快、polyfill、插件生态）
- **TSC** 只做类型检查：`tsc --noEmit`

在 CI 中先跑 `tsc --noEmit` 确保类型正确，再用 Babel/Vite 编译产出。这需要 tsconfig 中 `"isolatedModules": true`，因为 Babel 每次处理单个文件，无法跨文件检查（cross-file inference）。

```json
{
  "compilerOptions": {
    "isolatedModules": true, // 确保代码能被 Babel 独立编译
    "noEmit": true
  }
}
```

一个容易踩的坑：`const enum` 在 Babel 下会丢失（Babel 不做常量折叠）。要么避免使用 `const enum`，要么用 `isolatedDeclarations` 作为替代方案。

**收束** — TSC 是类型检查器 + 编译器，Babel 是纯粹的语法转译器。生产最佳实践：Babel 编译 + `tsc --noEmit` 类型检查，既快又安全。记住 `isolatedModules` 是 Babel 兼容的关键开关。

> 📖 详见：[11-config-compilation.md](knowledge/11-config-compilation.md) 的"编译原理"章节

---

### 43. 什么是 Project References？如何配置？

**是什么** — Project References 是 TypeScript 的**项目引用机制**，允许你将一个大型项目拆分为多个子项目（每个子项目有自己的 `tsconfig.json`），通过 `references` 字段建立依赖关系，实现增量编译和类型隔离。

**为什么** — 当项目大到一定规模（几千个文件），单次 `tsc` 全量编译会越来越慢。Project References 的核心价值是**增量构建**：`tsc --build`（简称 `tsc -b`）只重新编译有变更的子项目及其下游依赖。

配置方式分为顶层项目和子项目两层：

```json
// === tsconfig.json（根项目 / 聚合配置） ===
{
  "compilerOptions": {
    "composite": true // 根项目也需要 composite
  },
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/utils" },
    { "path": "./packages/app" }
  ]
}

// === packages/core/tsconfig.json（子项目） ===
{
  "compilerOptions": {
    "composite": true,      // 必须：声明此项目可被引用
    "outDir": "./dist",     // 必须：composite 要求 outDir
    "rootDir": "./src",
    "declaration": true,    // 必须：composite 要求 declaration 或 declarationMap
    "declarationMap": true  // 推荐：引用方可以跳转到源码定义
  },
  "include": ["src"]
}
```

子项目的 `composite: true` 强制要求设置 `outDir` 和 `declaration`，这保证了编译后生成 `.d.ts` 和 `.d.ts.map` 文件，供其他项目引用。

编译命令改为 `tsc -b`：
```bash
# 构建所有项目
tsc -b

# 仅构建某个项目及其依赖
tsc -b packages/core

# 清理所有构建产物
tsc -b --clean

# 干跑，查看构建顺序
tsc -b --dry --verbose
```

实际项目中，还需要处理多个 `outDir` 带来的 runtime 路径问题。如果子项目编译后放到 `packages/core/dist`，主项目引用时需要确保运行时能找到这些文件。通常配合 npm workspaces 或 monorepo 工具（Turborepo、Nx）一起使用：

```json
// packages/core/package.json
{
  "name": "@myapp/core",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

常见陷阱：引用循环（A 引用 B，B 引用 A）会导致 `tsc -b` 报错 `Circular dependency`；子项目路径变更后必须删除 `dist` 目录重新编译，否则可能生效旧的 `.d.ts`。

**收束** — Project References 通过 `composite` + `references` + `tsc -b` 实现增量编译和类型隔离。适合 monorepo 和 大项目拆分，但不适合小项目（配置开销大于收益）。

> 📖 详见：[11-config-compilation.md](knowledge/11-config-compilation.md) 的"Project References"章节

---

### 44. 三斜线指令（Triple-Slash Directives）是什么？

**是什么** — 三斜线指令是 TypeScript 独有的**单行注释指令**，以 `///` 开头，前置 XML 标签风格，只能放在文件最顶部（任何代码或 import 之前）。它告诉编译器引入额外的类型声明文件、类型包或内置 lib。

**为什么** — 三斜线指令是 ES Module 标准化之前的产物。在早期 TypeScript（和它的前身 AtScript）年代，没有 `import` 关键字处理类型引用，三斜线指令是唯一的手动关联声明文件的方式。

```typescript
/// <reference path="./types/global.d.ts" />   // 引用特定声明文件
/// <reference types="node" />                  // 引用 @types/node（等同 tsconfig types）
/// <reference lib="es2017.string" />           // 引用内置 lib（String.prototype.padStart 等）
/// <amd-module name="MyModule" />              // AMD 模块命名（极少使用）
```

它的三类主要指令各有不同语义：

```typescript
// 1. path — 手动引入声明文件，按顺序串联
/// <reference path="./legacy-types.d.ts" />
declare const GLOBAL_CONFIG: Record<string, unknown>;

// 2. types — 引用 @types 包，近似于 tsconfig 的 "types": ["node"]
/// <reference types="vite/client" />  // 在 .d.ts 中使用 Vite 的类型

// 3. lib — 引用 TS 内置的 lib.*.d.ts
/// <reference lib="esnext.string" />
// 使你能够使用 String.prototype.replaceAll 等较新 API 的类型
```

现代项目中三斜线指令几乎被 `import` 和 tsconfig 的 `types` 字段取代。但仍有三个场景无法替代：

1. **全局 `.d.ts` 文件的相互引用**：如果声明文件处于"脚本"模式（无 import），用 `import` 会把它变成模块，此时只能用 `/// <reference path="..." />`
2. **对齐内置 lib 依赖**：当你使用较新的 JS API 但不想更改 `target` 时，用 `/// <reference lib="esnext.foo" />` 细粒度引入类型
3. **Vite/Webpack 环境类型**：`/// <reference types="vite/client" />` 是 Vite 项目的标准做法，必须在 `env.d.ts` 顶部出现

一个常见的困惑：三斜线指令中的 `types` 和 `path` 有什么区别？`types` 会去 `node_modules/@types` 查找包，而 `path` 按相对路径引用特定文件。

```typescript
// ❌ 错误：三斜线指令不能放在 import 之后
import { something } from "foo";
/// <reference types="bar" /> // 无效！TS 会忽略它

// ✅ 正确：三斜线指令必须在最顶部
/// <reference types="vite/client" />
/// <reference path="./env.d.ts" />
import { defineConfig } from "vite";
```

**收束** — 三斜线指令是 TS 遗留的引用机制，现代代码用 `import` 替代；但在 `.d.ts` 脚本文件、内置 lib 细粒度引用、Vite 环境类型这三个场景中仍是必需品。牢记"必须放在文件最顶部"。

> 📖 详见：[11-config-compilation.md](knowledge/11-config-compilation.md) 和 [08-modules-namespaces.md](knowledge/08-modules-namespaces.md)

---

## 十二、进阶话题

📖 对应知识文章：[12-advanced-topics.md](knowledge/12-advanced-topics.md)

### 45. TS 中的 this 和 JS 中的 this 的区别？如何在 TS 中声明 this 类型？

**是什么** — JS 的 `this` 由调用方式动态决定（谁调用指向谁），TS 在此基础上增加了**显式 `this` 类型声明**（作为函数的第一个假参数）和**多态 `this` 类型**（类方法返回 `this` 而非类名），让 `this` 在编译时可检查。

**为什么** — JS 的 `this` 是动态绑定（dynamic binding），这是它最大的灵活性和最大的坑：同名函数在不同的调用上下文中 `this` 指向不同。TS 不能改变 JS 的运行时行为，但可以在编译时帮你发现 this 错配。

```typescript
// 显式 this 参数：第一个参数名必须是 "this"，类型为期望的上下文
function onClick(this: HTMLButtonElement, event: MouseEvent) {
  this.disabled = true;           // ✅ TS 知道 this 是 HTMLButtonElement
  // this.innerHTML = 123;        // ❌ 类型检查：HTMLButtonElement 没有这个属性
}

const btn = document.querySelector("button")!;
btn.addEventListener("click", onClick); // ✅ 绑定正确：this 是 HTMLButtonElement

// ⚠️ 如果这样调用：
// onClick(new MouseEvent("click"));  // ❌ TS 报错：this 上下文不匹配
```

这一机制在事件处理、回调函数中尤为有用。没有 `this` 参数时，TS 会从调用上下文推导 `this`；有了显式 `this` 参数，TS 会强制检查调用方是否提供了正确的 `this`。

多态 `this` 类型解决的是另一个经典问题——方法链（fluent API）中的类型丢失：

```typescript
class Builder {
  constructor(protected value: string) {}

  withPrefix(prefix: string): this {
    this.value = prefix + this.value;
    return this;           // 返回 this（多态类型）
  }
}

class AdvancedBuilder extends Builder {
  withSuffix(suffix: string): this {
    this.value = this.value + suffix;
    return this;
  }
}

const result = new AdvancedBuilder("hello")
  .withPrefix(">> ")       // 返回 AdvancedBuilder（不是 Builder！）
  .withSuffix(" <<")       // ✅ 类型正确
  .withPrefix("!! ");      // ✅ 依然能链式调用

// ❌ 如果 Builder 返回 Builder 而非 this：
// 第二个 .withSuffix 会报错，因为 Builder 上没有 withSuffix
```

如果没有多态 `this`，基类方法返回的是基类类型，子类的特有方法就链不上了。`this` 类型让 TS 始终使用"当前最具体的类型"。

**收束** — TS 的 `this` 类型是编译时完善 JS 动态 this 的补丁：`this: HTMLElement` 做静态检查，`return this` 保留链式调用中的具体类型。面试回答方向是"JS 动态 this + TS 编译时约束 + 多态链式调用"。

> 📖 详见：[12-advanced-topics.md](knowledge/12-advanced-topics.md) 的 "this" 章节

---

### 46. 函数重载（Function Overloads）如何实现？使用场景？

**是什么** — TS 的函数重载通过**多个调用签名（overload signatures）+ 一个实现签名（implementation signature）** 实现，允许同一个函数根据参数类型或数量返回不同的类型结果。注意这是纯编译时的"假重载"，最终 JS 还是单个函数。

**为什么** — 函数重载解决的核心问题是：输入类型和输出类型之间存在精确的映射关系，用联合类型或泛型无法精确表达。

```typescript
// ❌ 只用联合类型：输入和输出之间的映射丢失了
function format(value: string | number | boolean): string {
  return String(value);
}
// 问题：format(true) 返回 string，但调用方无法知道是 "true" 还是 "false"

// ✅ 函数重载：精确描述输入到输出的映射
function format(value: string): `"${string}"`;
function format(value: number): string;          // 格式化数字
function format(value: boolean): "yes" | "no";  // 布尔返回字面量
// 实现签名（使用最宽的类型）
function format(value: string | number | boolean): string {
  if (typeof value === "string") return `"${value}"`;
  if (typeof value === "number") return value.toFixed(2);
  return value ? "yes" : "no";
}

const result = format(true); // 类型："yes" | "no" — 精确！
```

重载的三条规则：
1. 至少有**两个**调用签名（overload signatures），一个实现签名（implementation signature）
2. 实现签名必须兼容所有调用签名（它的参数类型必须是所有调用签名参数类型的联合）
3. **实现签名的类型不会被外界看到**（外界看到的只是调用签名）

```typescript
// 场景二：根据参数数量产生不同行为
function createElement(tag: "div"): HTMLDivElement;
function createElement(tag: "input", options: { type: string }): HTMLInputElement;
function createElement(tag: "img", options: { src: string; alt: string }): HTMLImageElement;
// 实现
function createElement(tag: string, options?: Record<string, unknown>): HTMLElement {
  const el = document.createElement(tag);
  if (options) Object.assign(el, options);
  return el;
}
```

```typescript
// 场景三：条件返回不同类型
function getCache(key: string): string | null;
function getCache(key: string, defaultValue: string): string;
// 实现
function getCache(key: string, defaultValue?: string): string | null {
  const value = localStorage.getItem(key);
  return value ?? defaultValue ?? null;
}
```

使用重载需要考虑的原则：
- 优先用**联合类型 + 泛型**：如果调用签名之间的差异仅仅是类型不同，用 `function<T>(value: T): T` 可能更简洁
- 最精确的签名放最前面：TS 从上到下匹配，匹配到第一个就停止
- 实现签名用 `any` 或最宽的联合类型，且永远不对外暴露
- 如果调用签名超过 3-4 个，考虑拆分为多个函数

常见陷阱：实现签名错误地写成了 public 的调用签名之一，导致某些参数组合返回 `any` 或报错。

```typescript
// ❌ 错误：误把实现签名当作调用签名
function fn(x: string): string;
function fn(x: number): number;
function fn(x: string | number): string | number {
  return x; // 外界看到的还是 string | number 的返回，而非精确匹配
}
```

**收束** — 函数重载是多签名 + 单实现的模式，用于精确描述"输入类型映射到不同输出类型"。能用联合或泛型解决的不用重载，重载适合库 API 和参数形态有明显差异的场景。面试回答只需说清"多个调用签名在前，一个宽类型实现在后"即可。

> 📖 详见：[12-advanced-topics.md](knowledge/12-advanced-topics.md) 的"函数重载"章节

---

### 47. TypeScript 的类型推导（Type Inference）机制是怎样的？最佳实践？

**是什么** — 类型推导是 TypeScript 编译器在**未显式注解类型时，根据上下文自动推断变量、函数返回值、泛型参数类型**的能力。TS 的推导是**基于流程的、局部的、上下文敏感的**。

**为什么** — 类型推导是 TS 比纯类型系统语言（Java、C#）更灵活的原因。你不必在每个地方写类型，TS 会自动推断出最合理的类型。理解推导机制能帮你写出更简洁且类型安全的代码。

TS 推导的四种主要形式：

```typescript
// 1. 变量初始化推导
let count = 42;                    // number
const name = "Alice";              // "Alice"（const 推导为字面量）
let items = [1, 2, 3];             // number[]
let mixed = [1, "hello", true];    // (string | number | boolean)[]

// 2. 函数返回值推导
function add(a: number, b: number) { return a + b; } // 返回 number
function greet(name: string) { return `Hello ${name}`; } // 返回 string

// 3. 上下文类型推导（Contextual Typing）
const numbers = [1, 2, 3];
numbers.forEach((num, index) => {
  // num: number, index: number — 从 forEach 签名推导
});

window.addEventListener("click", (event) => {
  // event: MouseEvent — 从 addEventListener 签名推导
});

// 4. 泛型推导
function identity<T>(arg: T): T { return arg; }
const result = identity(42);       // T 推导为 number
const result2 = identity("hi");    // T 推导为 string
```

```typescript
// 5. 字面量类型推导（谨防宽化）
const x = { name: "Alice", role: "admin" as const };
// x.name 推导为 string（宽化）
// x.role 推导为 "admin"（as const 阻止宽化）

function pick<T extends object, K extends keyof T>(obj: T, key: K): T[K];
const item = pick({ name: "Alice", age: 30 }, "age");
// T: { name: string; age: number }, K: "age", 返回: number
```

推导的最佳实践可以用一个简单原则概括：**在"类型证据充分"的地方让 TS 推导，在"边界"处显式标注**。

| 场景 | 建议 | 原因 |
|---|---|---|
| `const x = 42` | 推导 | 类型显然 |
| 函数参数 | 显式标注 | public API 契约，必须明确 |
| 函数返回值（公共 API） | 显式标注 | 防止实现变更意外改变返回类型 |
| 函数返回值（内部函数） | 推导 | 实现和返回相邻，一目了然 |
| 复杂对象字面量 | 显式标注 | 防止多余属性检查遗漏或宽化 |
| 泛型参数 | 推导 | 调用方传递，无需标注 |

```typescript
// ✅ 好的实践
const config = {
  api: "https://example.com",
  timeout: 5000,
} as const;                       // 用 as const 阻止宽化

function fetchData(url: string): Promise<Response> {
  return fetch(url);
}
// 公共 API 标注了返回类型，内部 let data = await fetchData(...) 推导即可

// ❌ 过度标注
const x: number = 42;            // 画蛇添足，42 显然是 number
const users: User[] = getUserList(); // 如果 getUserList() 返回类型明确，不需要额外标注
```

常见误区：`let x = "hello"` 推导为 `string`（宽化字面量），而 `const x = "hello"` 推导为 `"hello"`（字面量）。用 `let` 时会假设未来可能被重新赋值，因此扩展到基本类型。

**收束** — TS 的推导是"合理推断而非穷举证明"。最佳实践：公共接口显式标注，内部实现让 TS 推导，用 `as const` 控制字面量宽化。面试中补充一句"类型推导让 TS 拥有了类似动态语言的编写体验，却保持了静态语言的类型安全"。

> 📖 详见：[12-advanced-topics.md](knowledge/12-advanced-topics.md) 的"类型推导"章节

---

### 48. 如何在 TypeScript 中实现 Mixin？

**是什么** — Mixin 是一种**组合式复用**模式，通过将一个类的实例化逻辑与多个行为混合（mixing）来创建新类，绕过单继承的限制。TS 中通过**高阶类函数**实现：接受一个类，返回一个扩展后的新类。

**为什么** — 单继承（class extends）在面对横跨多个正交维度的行为时力不从心。"可日志记录的"、"可事件触发的"、"可验证的"——这些行为不属于同一个继承链，但很多类都需要它们。

Mixin 的核心机制是**构造器类型**：

```typescript
// 定义构造器类型：接受任意参数，返回 T 类型的实例
type Constructor<T = {}> = new (...args: any[]) => T;
```

```typescript
// Mixin 1：添加时间戳能力
function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    createdAt = new Date();
    updatedAt: Date | null = null;

    touch(): void {
      this.updatedAt = new Date();
    }
  };
}

// Mixin 2：添加激活/停用能力
function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    isActive = false;

    activate(): void {
      this.isActive = true;
      console.log("Activated");
    }

    deactivate(): void {
      this.isActive = false;
      console.log("Deactivated");
    }
  };
}

// Mixin 3：添加序列化能力
function Serializable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    toJSON(): string {
      return JSON.stringify(this);
    }
  };
}
```

组合使用：

```typescript
class User {
  constructor(public name: string, public email: string) {}
}

// 组合多个 Mixin（注意调用顺序：从内到外执行）
const EnhancedUser = Serializable(Activatable(Timestamped(User)));

const user = new EnhancedUser("Alice", "alice@example.com");
user.createdAt;            // ✅ 来自 Timestamped
user.activate();           // ✅ 来自 Activatable
user.toJSON();             // ✅ 来自 Serializable
console.log(user.name);    // ✅ 来自 User
```

Mixin 的注意事项：

```typescript
// ⚠️ 问题 1：Mixin 之间的命名冲突
// 如果两个 Mixin 定义了同名属性或方法，后应用的会覆盖先应用的

// ⚠️ 问题 2：Mixin 无法访问被扩展类的私有属性
class SecretHolder {
  #secret = "hidden"; // # 硬私有，Mixin 无法访问
}

// ⚠️ 问题 3：instanceof 检测
const user2 = new EnhancedUser("Bob", "bob@test.com");
console.log(user2 instanceof User);             // ✅ true
console.log(user2 instanceof Activatable);      // ❌ false（Activatable 不是类，是工厂函数）

// ⚠️ 问题 4：需要对构造函数参数做类型收窄
function Named<TBase extends Constructor<{ name: string }>>(Base: TBase) {
  return class extends Base {
    constructor(...args: any[]) {
      super(...args);
      // 这里 Base 保证有 name 属性
    }
  };
}
```

```typescript
// ✅ 更严格的版本：约束传入的类必须有特定成员
interface WithName {
  name: string;
}

function Loggable<TBase extends Constructor<WithName>>(Base: TBase) {
  return class extends Base {
    logName(): void {
      console.log(`User name: ${this.name}`); // 安全访问 name
    }
  };
}
```

**收束** — Mixin 通过 `type Constructor<T> = new (...args: any[]) => T` + 高阶类函数实现组合复用，绕过单继承限制。面试记住：构造器类型签名、函数返回匿名类、从内到外组合。Mixin 适合正交行为组合，不适合深继承链场景。

> 📖 详见：[12-advanced-topics.md](knowledge/12-advanced-topics.md) 的 "Mixin" 章节

---

### 49. DefinitelyTyped / @types 是什么？如何贡献类型声明？

**是什么** — DefinitelyTyped（简称 DT）是 GitHub 上最大的社区类型仓库，为数以万计没有自带 `.d.ts` 的 npm 包提供类型声明。它通过 `@types/*` 作用域包发布到 npm，用户通过 `npm i -D @types/包名` 安装。

**为什么** — 不是所有 JS 库都内置了 TS 类型。三类情况：
1. **纯 JS 库**（如 lodash、express、jQuery）：由 DT 社区贡献类型
2. **自带类型的库**（如 React、Vue、Ant Design）：类型在库内，`@types/react` 只是补丁
3. **无类型也无 @types**：需要自行编写 `declare module`

```bash
# 使用 DT 上的类型声明
npm install -D @types/lodash     # 现在 import _ from "lodash" 有类型了
npm install -D @types/express    # Express 路由有类型提示
npm install -D @types/node       # process.env、Buffer、path 等有类型
```

DT 的工作机制：
- 每个 `@types/pkg` 对应 DT 仓库中 `types/pkg/` 目录
- 类型文件经过 DT 维护团队审核后合并
- 合并后自动通过 CI 发布到 npm（@types 仓库有数千个包，无需手动发布）

给 DefinitelyTyped 贡献类型的流程：

```
1. Fork DefinitelyTyped/DefinitelyTyped
2. 在本地创建 types/包名/ 目录
3. 编写 index.d.ts（主声明文件）
4. 编写 包名-tests.ts（测试文件，会编译检查）
5. 创建 tsconfig.json（继承 DT 基础配置）
6. 提交 PR，通过 DT 的 CI 检查
7. DT 维护者审核合并后自动发布
```

```typescript
// types/my-hypothetical-lib/index.d.ts
declare module "my-hypothetical-lib" {
  // 类型必须精确（不允许 any），覆盖主要 API
  export interface Options {
    timeout: number;
    retries?: number;
  }

  export function run(cmd: string, opts?: Options): Promise<string>;
  export const VERSION: string;
}

// types/my-hypothetical-lib/my-hypothetical-lib-tests.ts
import { run, VERSION } from "my-hypothetical-lib";

run("echo hello");                         // ✅
run("echo hello", { timeout: 5000 });      // ✅
// run(42);                                // ❌ 应编译报错（string 预期）
```

如果你的项目只用了某个无类型包的很小一部分，不必提交 DT（DT 的审核流程可能较慢），在项目内部用 `declare module "pkg" { ... }` 写最小声明即可。

常见陷阱：
- 作用域包的 `@types` 包名规则：`@scope/pkg` -> `@types/scope__pkg`（双下划线分隔）
- DT 的类型测试文件必须至少有一个测试用例编译通过，且至少有一个 `export {}`
- 如果库本身已经包含类型（`package.json` 中的 `types` 字段），不应再提交 DT

**收束** — DefinitelyTyped 是 npm 生态的"类型层"，`@types` 包让 JS 库无缝接入 TS。贡献 DT 的核心是：精确的类型签名 + 通过 CI 的测试文件。面试只需说清"社区为无类型库补声明"、"@types 安装方式"和"提交 PR 的简单流程"。

> 📖 详见：[12-advanced-topics.md](knowledge/12-advanced-topics.md) 的 "DefinitelyTyped" 章节

---

### 50. 如何在 TypeScript 中模拟标称类型（Nominal Typing / Branded Types）？

**是什么** — TS 是结构类型系统（只要是同样的结构就能互相赋值），但通过 **Branded Types**（品牌类型）模式可以在类型层面模拟**标称类型系统**（类型由名称而非结构决定）。核心手法是用一个不为空的交叉类型 `T & { __brand: BrandName }` 让 TS 认为两个结构相同的类型不兼容。

**为什么** — 结构类型在 95% 的场景下非常完美，但在需要**区分语义上不同的类型**时会造成安全漏洞。最典型的场景是多个 ID 类型：

```typescript
// 结构类型的问题：UserId 和 OrderId 结构相同，可以混用
function getUser(id: string): User { /* ... */ }
function getOrder(id: string): Order { /* ... */ }

const userId = "u_123";
const orderId = "o_456";
getUser(orderId);  // ✅ 编译通过，但逻辑错误！传了 orderId 给 getUser
```

Branded Types 通过在类型上附加一个"品牌标记"来解决：

```typescript
// Brand 工具类型：T 是底层类型，B 是品牌名称
type Brand<T, B> = T & { readonly __brand: B };

// 定义不同类型的 ID
type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
type ProductId = Brand<string, "ProductId">;

// 现在类型系统会区分它们
function getUser(id: UserId): { name: string } {
  return { name: "User:" + id };
}
function getOrder(id: OrderId): { amount: number } {
  return { amount: Number(id) };
}

const userId = "u_123" as UserId;
const orderId = "o_456" as OrderId;

getUser(userId);    // ✅ 正确
getUser(orderId);   // ❌ 编译错误！OrderId 不能赋值给 UserId
getUser("u_123");   // ❌ 编译错误！普通 string 也不行

// 上生产环境时，结合运行时验证的工厂函数
function createUserId(raw: string): UserId {
  if (!/^u_[a-z0-9]+$/.test(raw)) {
    throw new Error(`Invalid UserId format: ${raw}`);
  }
  return raw as UserId; // 断言转换
}

function createOrderId(raw: string): OrderId {
  if (!/^o_[a-z0-9]+$/.test(raw)) {
    throw new Error(`Invalid OrderId format: ${raw}`);
  }
  return raw as OrderId;
}
```

Brand 和 Flavor 两种模式的选择：

```typescript
// Brand（严格模式）：__brand 为必选属性
type Brand<T, B> = T & { __brand: B };
// 必须显式断言为 Brand 类型，不能被隐式赋值
const id1 = "abc" as Brand<string, "Foo">;

// Flavor（宽松模式）：__brand 为可选属性
type Flavor<T, B> = T & { __brand?: B };
// 可以被同结构隐式赋值，但不能跨品牌赋值
const id2: Flavor<string, "Foo"> = "abc"; // ✅ 隐式赋值可行
```

```typescript
// 更复杂的应用：金额类型
type USD = Brand<number, "USD">;
type EUR = Brand<number, "EUR">;

function addMoney(a: USD, b: USD): USD {
  return (a + b) as USD;
}

const wallet1 = 100 as USD;
const wallet2 = 50 as EUR;

addMoney(wallet1, wallet1); // ✅ 美元加美元
addMoney(wallet1, wallet2); // ❌ 编译错误：不能混用
```

```typescript
// 进阶用法：用 Brand 标记 Promise 的结果类型
type Authenticated<T> = Brand<T, "Authenticated">;

async function login(token: string): Promise<Authenticated<{ user: User }>> {
  const user = await api.login(token);
  return user as Authenticated<{ user: User }>;
}

function deleteAccount(data: Authenticated<{ user: User }>): void {
  // 只有经过 login() 的数据才能传进来
}

// 绕过：内部模块用 as 断言创建 Brand，外部消费方安全
```

Brand 的局限：`__brand` 只在编译时存在，运行时被完全擦除。如果运行时需要真正的隔离保护（比如防止一个"u_xxx"格式的字符串被错误传递），上述模式只能提供编译时保护，仍需配合运行时验证。

**收束** — Branded Types 通过 `T & { __brand: B }` 在结构类型系统中模拟标称类型，用于区分语义不同的相同结构（如 UserId vs OrderId）。选 Brand（严格）还是 Flavor（宽松）看你是否需要隐式赋值。面试要点：结构类型的局限 -> Brand 模式 -> 工厂函数 + 运行时验证。

> 📖 详见：[12-advanced-topics.md](knowledge/12-advanced-topics.md) 的 "Branded Types" 章节
