# TypeScript 类型兼容性

## 一、引言

类型兼容性是 TypeScript 类型系统的核心机制，它决定了哪些类型可以赋值给哪些类型。与 Java、C# 等语言的"名义类型系统"不同，TypeScript 采用"结构类型系统"——判断两个类型是否兼容的依据是它们的**结构**（即包含哪些属性），而不是类型名称。理解这一机制是掌握 TypeScript 类型系统的关键。

---

## 二、结构类型系统 vs 名义类型系统

### 2.1 核心区别

```typescript
// 名义类型系统（Nominal Typing）—— Java/C#/Rust
// 类型由名称（或声明位置）唯一确定
// class Dog { }
// class Cat { }
// Dog d = new Cat(); // ❌ 编译错误：类型不兼容

// 结构类型系统（Structural Typing）—— TypeScript
// 类型由结构（包含的属性和方法）确定
class Dog {
  name: string = "";
}

class Cat {
  name: string = "";
}

const pet: Dog = new Cat(); // ✅ TypeScript 中允许，因为结构相同
```

### 2.2 鸭子类型（Duck Typing）

TypeScript 的结构类型系统常被称为"鸭子类型"——"如果它走起来像鸭子，叫起来像鸭子，那它就是鸭子"：

```typescript
interface Duck {
  walk(): void;
  quack(): void;
}

function makeItQuack(duck: Duck): void {
  duck.quack();
}

// 即使没有显式实现 Duck 接口，只要结构匹配即可
const myPet = {
  walk: () => console.log("walking"),
  quack: () => console.log("quack"),
};

makeItQuack(myPet); // ✅ 结构匹配
```

### 2.3 类型别名和接口的可互换性

```typescript
type Point = { x: number; y: number };
interface Point2D {
  x: number;
  y: number;
}

const p1: Point = { x: 1, y: 2 };
const p2: Point2D = p1; // ✅ 结构相同，可以赋值

// 即使类型名称不同，只要结构相同就兼容
```

> **面试提示**：面试中常见的开篇问题是："TypeScript 和 Java 在类型判断上有什么不同？"——核心答案就是结构类型 vs 名义类型。

---

## 三、对象类型兼容性

### 3.1 基础规则

```typescript
interface Named {
  name: string;
}

interface Person {
  name: string;
  age: number;
}

let named: Named;
let person: Person = { name: "Alice", age: 30 };

// ✅ 子类型可以赋值给父类型（Person 是 Named 的子类型）
named = person;

// ❌ 父类型不能赋值给子类型（缺少 age）
// person = named;
```

**核心原则**：如果 B 包含了 A 所要求的所有成员，且类型兼容，那么 B 就是 A 的子类型。

```typescript
// 记忆方法：对照上面的代码
// Person (B) 有 name 和 age → 包含了 Named (A) 要求的 name → Person 是 Named 的子类型
// 所以 person 可以赋给 named，反过来不行
```

### 3.2 多余属性检查（Excess Property Checking）

这是一个重要的例外情况：

```typescript
interface Named {
  name: string;
}

// ✅ 变量赋值：允许多余属性
const alice = { name: "Alice", age: 30 };
const named: Named = alice; // 正确，变量可以有多余属性

// ❌ 对象字面量：多余属性触发检查
// const named2: Named = { name: "Alice", age: 30 };
// 错误：类型 "{ name: string; age: number; }" 不可赋值给类型 "Named"
// 对象字面量只能指定已知属性，并且 "age" 不在类型 "Named" 中
```

为什么要有这个区别？

```typescript
// 防止常见的拼写错误
interface Config {
  port: number;
  host: string;
}

// ❌ 捕获错误：'prot' 是拼写错误，本意是 'port'
const config: Config = {
  host: "localhost",
  port: 3000,
  prot: 8080, // 多余属性检查捕获了这个错误
};

// 但如果通过变量赋值，不会触发检查
const options = { host: "localhost", port: 3000, prot: 8080 };
const config2: Config = options; // ✅ 不检查，因为 options 不是字面量
```

### 3.3 绕过多余属性检查

```typescript
// 方式 1：使用中间变量
interface Named {
  name: string;
}
const obj = { name: "Alice", extra: true };
const named: Named = obj; // ✅ 绕过

// 方式 2：类型断言
const named2: Named = { name: "Alice", extra: true } as Named; // ✅

// 方式 3：索引签名
interface NamedLoose {
  name: string;
  [key: string]: unknown; // 索引签名允许任意属性
}
const named3: NamedLoose = { name: "Alice", extra: true }; // ✅
```

### 3.4 可选属性的兼容性

```typescript
interface WithOptional {
  name: string;
  age?: number;
}

interface WithoutOptional {
  name: string;
  age: number;
}

let withOpt: WithOptional;
let withoutOpt: WithoutOptional = { name: "Alice", age: 30 };

// ✅ 没有可选属性的类型可以赋值给有可选属性的类型
withOpt = withoutOpt;

// ❌ 反过来不行（可能存在 undefined 不兼容）
// withoutOpt = withOpt; // age 可能为 undefined
```

> **常见陷阱**：对象字面量的多余属性检查是 TypeScript 中最容易让人困惑的特性之一。记住：只有**新鲜的对象字面量**（直接赋值给类型注解的变量）才会触发这个检查。

---

## 四、函数类型兼容性

### 4.1 参数兼容性

```typescript
type Logger = (message: string) => void;

// ✅ 兼容：参数更少（可以忽略参数）
const simpleLog: Logger = () => {}; // 正确

// ✅ 兼容：参数类型相同
const standardLog: Logger = (msg: string) => console.log(msg);

// ❌ 兼容吗？参数类型不匹配
// const typedLog: Logger = (msg: number) => {}; // 错误
```

### 4.2 参数数量的兼容

```typescript
type Handler = (x: number, y: number) => void;

// ✅ 函数可以忽略多余的参数（安全）
const handler1: Handler = (x: number) => console.log(x);
const handler2: Handler = () => {};

// 为什么安全？
// 调用 Handler 时传入 2 个参数，函数可以忽略不需要的参数
// 这类似于 JavaScript 中的常见模式
[1, 2, 3].forEach((item) => console.log(item)); // forEach 的回调有 3 个参数
```

### 4.3 协变与逆变

这是函数类型兼容性中最核心、最容易混淆的概念。先从词本身说起：

**协变（Covariance）**："协"就是"同方向"。子类型关系在传递后**保持不变**——如果 `Dog` 是 `Animal` 的子类型，那么 `() => Dog` 也是 `() => Animal` 的子类型。子类型箭头方向没变。

**逆变（Contravariance）**："逆"就是"反方向"。子类型关系在传递后**反转了**——如果 `Dog` 是 `Animal` 的子类型，那么 `(Animal) => void` 反而是 `(Dog) => void` 的子类型。子类型箭头反过来了。

**用生活例子记**：返回值是协变——别人给你东西，越具体越好（给你一只狗，当然可以当动物用）。参数是逆变——你接收东西，越宽容越好（能处理任何动物的函数，当然也能处理狗）。

```typescript
// ===== 准备：Animal 和 Dog 的类型关系 =====
interface Animal { name: string; }
interface Dog extends Animal { breed: string; }

// 基本规则：Dog 是 Animal 的子类型，所以 Dog 可以赋给 Animal
declare const dog: Dog;
const animal: Animal = dog; // ✅ 子 → 父

// ===== 协变：返回值 =====
// 场景：你声明一个"返回 Animal"的函数，实际实现返回了 Dog
const getPet = (): Animal => {
  return { name: "Rex", breed: "German Shepherd" } satisfies Dog;
};

// 为什么安全？站在调用方的角度看：
const pet = getPet();          // 调用方只知道拿到的是 Animal
console.log(pet.name);         // ✅ Dog 一定有 name，所以安全
// pet.breed — 调用方不能访问，因为它只知道返回 Animal，但这不影响安全性

// 结论：返回值方向，子类型关系不变
// Dog 是 Animal 的子类型 → (()=>Dog) 也是 (()=>Animal) 的子类型


// ===== 逆变：参数 =====
// 场景：你有一个"接收 Dog"的函数签名，但实际实现只用了 Animal 级别的属性
const feedDog = (d: Dog) => {
  console.log(d.name);  // 只用了 name，没用到 breed
};
// feedDog 的类型是 (d: Dog) => void

// 现在有人想把这个函数赋值给一个"接收 Animal"的签名：
type AnimalConsumer = (a: Animal) => void;
const feed: AnimalConsumer = feedDog; // ✅ 为什么安全？

// 站在调用方的角度看：
// 调用方拿了一个 Animal 喂给 feed——但 feed 的实现在 feedDog 里只读了 name，
// Animal 有 name，所以传 Animal 进去不会崩。
// 反过来就炸了：如果签名是 (d: Dog)，实现里读了 d.breed，
// 调用方传了个普通 Animal（没有 breed）→ 运行时 undefined

// 结论：参数方向，子类型关系反转
// Dog 是 Animal 的子类型 → ((Animal)=>void) 反而是 ((Dog)=>void) 的子类型
```

### 4.4 strictFunctionTypes 标志

```typescript
// 没有 strictFunctionTypes（或设为 false）
// 参数是双变的（bivariant）：协变和逆变都允许

// 有 strictFunctionTypes（TS 2.6+ 默认启用）
// 参数是逆变的（更安全）

{
  "compilerOptions": {
    "strictFunctionTypes": true  // 推荐
  }
}
```

```typescript
// strictFunctionTypes 的效果
interface EventHandler {
  (event: MouseEvent): void;
}

// 没有 strictFunctionTypes 时（双变）：
// 以下两种都允许
const handler1: EventHandler = (e: Event) => {};       // 逆变
const handler2: EventHandler = (e: MouseEvent) => {};   // 协变

// 有 strictFunctionTypes 时（逆变）：
// 只允许参数更宽（接受更通用的类型）
const handler3: EventHandler = (e: Event) => {};        // ✅ 逆变：接受更通用的 Event
// const handler4: EventHandler = (e: WheelEvent) => {}; // ❌ 协变被禁止
```

### 4.5 方法 vs 函数属性

方法和函数属性在兼容性上有重要区别：

```typescript
interface WithMethod {
  process(x: string): void;  // 方法语法
}

interface WithProperty {
  process: (x: string) => void;  // 函数属性语法
}

// 方法：双变的（bivariant）
const obj1: WithMethod = {
  // ✅ 参数可以协变（更窄）或逆变（更宽）
  process(x: string | number) {},
};

// 函数属性：逆变的（contravariant，受 strictFunctionTypes 影响）
const obj2: WithProperty = {
  // 受 strictFunctionTypes 约束
  process(x: string) {},
};
```

**为什么方法可以是双变的？**

```typescript
// 实际原因：数组方法在 TypeScript 中的常见用法
const numbers: number[] = [1, 2, 3];
numbers.forEach((item) => console.log(item)); // item 是 number

// 如果参数是严格的逆变，以下代码在 JS 中常见，但在严格类型下可能报错
class Base { base = 1; }
class Derived extends Base { derived = 2; }

function processBase(b: Base) {}
const derivedArray: Derived[] = [new Derived()];
// derivedArray.forEach(processBase); // 参数逆变——实际工作良好
```

> **面试提示**："什么是协变和逆变？"是 TypeScript 面试中的经典问题。理解并用通俗的语言解释：协变是"子类替换父类"（返回值），逆变是"父类替换子类"（参数）。

---

## 五、枚举兼容性

### 5.1 数字枚举

```typescript
enum Direction {
  Up,      // 0
  Down,    // 1
  Left,    // 2
  Right,   // 3
}

// ✅ 数字枚举与 number 兼容
const num: number = Direction.Up;  // ✅
const dir: Direction = 1;          // ✅ （不过最好使用枚举名）

// ✅ 不同数字枚举之间兼容
enum Status {
  Active = 0,
  Inactive = 1,
}

const d: Direction = Status.Active as unknown as Direction; // 需要显式转换
```

### 5.2 字符串枚举

```typescript
enum StringDir {
  Up = "UP",
  Down = "DOWN",
}

// ❌ 字符串枚举与 string 不兼容
// const str: string = StringDir.Up; // 错误（在某些 TS 版本中）

// ❌ 不同字符串枚举不兼容
enum StringStatus {
  Active = "ACTIVE",
}

// const sd: StringDir = StringStatus.Active as any; // 需要断言
```

### 5.3 const 枚举

```typescript
const enum ConstEnum {
  A = 1,
  B = 2,
}

// const 枚举在编译时被内联，没有运行时对象
const val = ConstEnum.A; // 编译为：const val = 1;
```

> **常见陷阱**：字符串枚举的行为不同于数字枚举——它们是名义上不兼容的。这是有意设计的，因为字符串枚举的值更有意义（"UP"比 0 更有语义），混淆两个有意义的字符串枚举可能导致 bug。

---

## 六、类兼容性

### 6.1 实例成员比较

```typescript
class Animal {
  name: string = "";
  age: number = 0;
}

class Person {
  name: string = "";
  age: number = 0;
  email: string = "";
}

// ✅ 只比较实例结构，不比较类名
const animal: Animal = new Person(); // ✅ Person 有 Animal 的所有属性

// ❌ 反过来不行
// const person: Person = new Animal(); // ❌ 缺少 email
```

### 6.2 静态成员不参与兼容性检查

```typescript
class ClassA {
  static version = "1.0";
  name: string = "";
}

class ClassB {
  name: string = "";
}

// ✅ 静态成员不影响实例类型兼容性
const a: ClassA = new ClassB(); // ✅
```

### 6.3 私有/受保护成员

私有成员和受保护成员使类在名义上兼容：

```typescript
class BaseWithPrivate {
  private id: number = 0;
  name: string = "";
}

class DerivedWithPrivate {
  private id: number = 0;
  name: string = "";
  email: string = "";
}

// ❌ 不兼容：私有成员必须来自同一个类
// const base: BaseWithPrivate = new DerivedWithPrivate();
// 错误：私有属性 'id' 的类型不兼容

// 私有成员使类型兼容性变为名义的（结构性相同但私有成员来源不同）

// ✅ 通过继承创建的类可以赋值
class Child extends BaseWithPrivate {
  email: string = "";
}

const base: BaseWithPrivate = new Child(); // ✅ 继承自同一个基类
```

```typescript
protected 成员同理：
class BaseProtected {
  protected id: number = 0;
}

class DerivedProtected extends BaseProtected {}

// ✅ 同一个继承链
const base: BaseProtected = new DerivedProtected();

// ❌ 不同类（即使结构相同）
class AnotherWithProtected {
  protected id: number = 0;
}
// const base2: BaseProtected = new AnotherWithProtected(); // 错误
```

### 6.4 类的构造函数

```typescript
class Bigger {
  constructor(public name: string, public age: number) {}
}

class Smaller {
  constructor(public name: string) {}
}

// 实例类型兼容性：只比较实例成员
const bigger: Bigger = new Smaller("test");
// 编译通过，但运行时 Bigger 期望的 age 为 undefined
// 这是结构类型系统的特点——可能会接受不完整的对象
```

> **常见陷阱**：类的私有成员使检查变为名义类型。这是 TypeScript 刻意设计的，确保私有成员不会被外部类型意外访问到。

---

## 七、泛型兼容性

### 7.1 基础泛型

```typescript
interface Box<T> {
  value: T;
}

// ✅ 相同结构，相同类型参数
const box1: Box<string> = { value: "hello" };
const box2: Box<string> = box1; // ✅

// ❌ 不同类型参数，结构不同
// const box3: Box<number> = box1; // 错误：类型参数不同导致结构不同

// 但对于没有使用类型参数的泛型：
interface Empty<T> {}

const empty1: Empty<string> = {};
const empty2: Empty<number> = {};
// ✅ 结构相同（都没有额外属性），所以兼容
```

### 7.2 泛型推断和结构展开

```typescript
// 泛型在展开后会进行结构检查
function identity<T>(arg: T): T {
  return arg;
}

interface Person {
  name: string;
  age: number;
}

const result = identity({ name: "Alice", age: 30 });
// result 的类型是 { name: string; age: number; }

// 泛型约束不影响兼容性
interface HasLength {
  length: number;
}

function logLength<T extends HasLength>(arg: T): T {
  console.log(arg.length);
  return arg;
}

const str = logLength("hello");     // ✅ string 有 length
const arr = logLength([1, 2, 3]);    // ✅ 数组有 length
// logLength(42);                     // ❌ number 没有 length
```

### 7.3 对象展开与泛型的交互

```typescript
function merge<T, U>(obj1: T, obj2: U): T & U {
  return { ...obj1, ...obj2 };
}

const result = merge({ name: "Alice" }, { age: 30 });
// result 类型：{ name: string } & { age: number }

// 属性覆盖的问题
function setDefaults<T>(options: T, defaults: Partial<T>): T {
  return { ...defaults, ...options };
}

// 问题：展开后的类型可能丢失可选性
const config = setDefaults({ timeout: 5000 }, { timeout: 3000 });
// config.timeout 类型应该是 number，但可能推断有问题

// 更好的做法：显式指定返回类型
function setDefaults2<T>(options: T, defaults: Partial<T>): T {
  return Object.assign({}, defaults, options);
}
```

---

## 八、泛型变体

### 8.1 不变（Invariance）

```typescript
// 默认情况下，泛型类型参数是不变的
interface Container<T> {
  value: T;
}

let stringContainer: Container<string>;
let unknownContainer: Container<unknown>;

// ❌ 不变：Container<string> 和 Container<unknown> 不兼容
// stringContainer = unknownContainer; // 错误
// unknownContainer = stringContainer; // 错误（没有 strictNullChecks 时可能不报错）
```

### 8.2 使用 extends 实现协变

```typescript
// 对只读数据，协变是安全的
interface ReadonlyContainer<out T> {
  readonly value: T;
}

// 但在 TypeScript 中没有原生的 variance 注解
// 只能通过使用方式来实现

// 实际中的协变：
type Producer<T> = () => T;
type Consumer<T> = (x: T) => void;

// Producer（返回 T）：天然协变
const produceStr: Producer<string> = () => "hello";
const produceUnknown: Producer<unknown> = produceStr; // ✅ 协变

// Consumer（接受 T）：天然逆变（在 strictFunctionTypes 下）
const consumeUnknown: Consumer<unknown> = (x: unknown) => {};
const consumeStr: Consumer<string> = consumeUnknown; // ✅ 逆变
```

### 8.3 不变式的常见陷阱

```typescript
// TypeScript 中的 Array 是协变的（历史原因）
const dogs: Array<Dog> = [];
const animals: Array<Animal> = dogs; // ✅ 实际允许（应该是不变的）

// 但这可能导致运行时错误：
// animals.push(new Animal("Generic Animal")); // 运行时：数组中混入了非 Dog 元素
// const firstDog = dogs[0]; // unsafe 但类型上还是 Dog

// ReadonlyArray 的行为更安全
const readonlyDogs: ReadonlyArray<Dog> = [];
const readonlyAnimals: ReadonlyArray<Animal> = readonlyDogs; // ✅ 安全

// 但可变数组的协变存在安全隐患，TypeScript 为了与 JS 惯用用法兼容选择了允许
```

---

## 九、联合类型与交叉类型的兼容性

### 9.1 联合类型

```typescript
type StringOrNumber = string | number;

// ✅ string 或 number 都可以赋值给联合类型
const val1: StringOrNumber = "hello";
const val2: StringOrNumber = 42;

// ❌ boolean 不行
// const val3: StringOrNumber = true; // 错误
```

### 9.2 交叉类型

```typescript
type Named = { name: string };
type Aged = { age: number };
type Person = Named & Aged;

// ✅ 必须同时满足交叉类型的所有要求
const person: Person = { name: "Alice", age: 30 };

// ❌ 缺少任一属性
// const person2: Person = { name: "Alice" }; // 缺少 age
```

### 9.3 分配兼容性

```typescript
// 联合类型的分发（Distributive）
type ToArray<T> = T extends any ? T[] : never;
type Result = ToArray<string | number>;
// 结果是 string[] | number[]（不是 (string | number)[]）

// 交叉类型的合并
type Merged = { a: string } & { b: number };
// 等价于 { a: string; b: number; }

// 同名属性的合并（冲突解决）
type Conflict = { a: string } & { a: number };
// a 的类型是 never —— 因为 string & number 是无意义的
```

---

## 十、常见陷阱

### 10.1 期望名义类型系统行为

```typescript
// ❌ 常见错误：期望 TypeScript 像 Java 那样按类名区分
class UserID {
  constructor(public value: string) {}
}

class ProductID {
  constructor(public value: string) {}
}

function getUser(id: UserID): void {
  console.log(id.value);
}

// 这将在运行时工作，但类型系统不会阻止
const productId = new ProductID("PROD-001");
getUser(productId); // ✅ 类型上允许——因为结构相同！

// ✅ 解决方案：使用 branded types（品牌类型）
type BrandedUserID = UserID & { __brand: "user" };
type BrandedProductID = ProductID & { __brand: "product" };

function createUserID(value: string): BrandedUserID {
  return { value } as BrandedUserID;
}

function getBrandedUser(id: BrandedUserID): void {
  console.log(id.value);
}

// getBrandedUser(productId); // ❌ 类型错误
```

### 10.2 忘记 strictFunctionTypes

```typescript
// 没有启用 strictFunctionTypes 时的潜在 bug
interface EventEmitter {
  on(event: string, handler: (e: Event) => void): void;
}

const emitter: EventEmitter = {
  on(event, handler) {},
};

// 没有 strictFunctionTypes：以下代码不会报错
emitter.on("click", (e: MouseEvent) => {
  // e 被声明为 MouseEvent，但实际可能是任何 Event
  console.log(e.clientX); // 运行时可能 undefined——如果事件不是鼠标事件
});

// 启用 strictFunctionTypes 后：
// 参数逆变 —— handler 必须接受 Event，不能接受更具体的 MouseEvent
```

### 10.3 枚举比较问题

```typescript
enum Color {
  Red,
  Green,
  Blue,
}

enum Fruit {
  Apple,
  Banana,
}

// 数字枚举与 number 兼容可能导致意外
function paint(color: Color): void {
  // ...
}

paint(Color.Red);   // ✅
paint(1);            // ✅ 数字枚举可以传入 number！这可能不安全

// 字符串枚举更严格：
enum StringColor {
  Red = "RED",
}

function paintString(color: StringColor): void {
  // ...
}

// paintString("RED"); // ❌ 错误：string 不能赋值给 StringColor
```

### 10.4 对象展开丢失类型信息

```typescript
interface Config {
  host: string;
  port: number;
  timeout?: number;
}

function createConfig(overrides: Partial<Config>): Config {
  const defaults: Config = {
    host: "localhost",
    port: 3000,
  };

  // 展开后可能丢失精确的类型信息
  return { ...defaults, ...overrides };

  // 更好的方式：
  return Object.assign({}, defaults, overrides);
  // 或在 TS 4.1+ 中正确推断
}
```

---

## 十一、面试指南

### 基础面试题

**Q1**: TypeScript 使用哪种类型系统？

答：TypeScript 使用结构类型系统（structural typing），也称为鸭子类型。类型兼容性由类型的结构（属性和方法）决定，而不是类型名称。

**Q2**: 什么是多余属性检查（excess property checking）？

答：当使用对象字面量直接赋值给一个类型时，TypeScript 会检查是否有额外的属性。这是为了防止拼写错误和意外属性。但是，通过变量间接赋值时不会触发这个检查。

**Q3**: TypeScript 中方法的参数是协变还是逆变？

答：在 `strictFunctionTypes` 模式下，函数声明（使用 `=` 语法的函数属性）的参数是**逆变**的——它们可以接受更宽泛的类型。但方法语法（在类或接口中使用简写语法声明的函数）是**双变**的——协变和逆变都可接受。

### 进阶面试题

**Q4**: 为什么数组在 TypeScript 中是协变的？

答：主要是为了与 JavaScript 的常用模式兼容，例如将 `string[]` 传递给接受 `(string | number)[]` 的函数。这是一种在类型安全与可用性之间的妥协。`ReadonlyArray` 的行为也是协变的，但因为它是只读的，所以是类型安全的。

**Q5**: 什么是 branded type？在什么时候使用？

答：Branded type 是一种在结构类型系统中模拟名义类型的技术。通过给类型添加一个独特的"品牌"标记（如 `{ __brand: "userId" }`），使得结构相同的不同类型在类型层面不可互换。用于需要区分同一基础类型的不同语义的场景（如 UserID vs ProductID）。

**Q6**: 泛型参数在 TypeScript 中默认是不变的吗？

答：是的，通用的泛型参数（如 `Container<T>`）是不变的。但特定的使用位置可以表现出协变或逆变特性。例如，一个返回 `T` 的函数是协变的，一个接受 `T` 的函数是逆变的。

### 学习建议

1. **掌握基础**：先理解结构类型系统的核心思想，"形状相同即兼容"
2. **理解例外**：重点学习多余属性检查、私有成员检查和 `strictFunctionTypes` 这三个"例外"规则
3. **实践验证**：在 TypeScript Playground 中创建类型并测试兼容性，亲眼观察结果
4. **阅读错误信息**：TypeScript 的类型错误信息非常详细，理解错误信息是提高的关键
5. **实际应用**：在项目中组织类型时，利用结构类型的灵活性设计可复用的类型

---

## 总结

TypeScript 的类型兼容性以其结构类型系统为基础，提供了 JavaScript 开发者熟悉的灵活性，同时通过额外的检查机制（如多余属性检查、`strictFunctionTypes`）在不牺牲太多便利性的前提下提高类型安全。理解协变、逆变、双变这些概念，掌握对象、函数、类、泛型等不同实体的兼容性规则，是深入 TypeScript 类型系统的必经之路。记住：结构类型系统更像是一种约定——"如果你有我所需要的一切，我们就可以合作"。
