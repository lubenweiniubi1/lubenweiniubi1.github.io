# TypeScript 类与面向对象

## 一、TypeScript 中的类简介

你在 JavaScript 里写 `this.name = name`，拼错了没人告诉你。TypeScript 的类能让你在写错的时候立刻看到红线。

```typescript
// JavaScript 中的类
class PersonJS {
  constructor(name) {
    this.name = name; // 动态添加属性
  }
}

// TypeScript 中的类
class PersonTS {
  name: string;        // 字段声明 + 类型注解
  age: number = 0;     // 带默认值

  constructor(name: string, age?: number) {
    this.name = name;
    if (age !== undefined) this.age = age;
  }
}
```

### 关键差异

1. **字段声明**：TS 要求在类体中显式声明字段
2. **类型注解**：字段和方法参数/返回值都可以加类型
3. **访问修饰符**：`private` / `protected` / `public`
4. **参数属性**：构造器参数与字段声明合二为一

## 二、访问修饰符

TypeScript 提供了三个访问修饰符，用于控制类成员的可见性：

| 修饰符 | 含义 | 在同一类中 | 在子类中 | 在外部 |
|--------|------|-----------|---------|-------|
| `public`（默认） | 公开的 | 可访问 | 可访问 | 可访问 |
| `protected` | 受保护的 | 可访问 | 可访问 | 不可访问 |
| `private` | 私有的 | 可访问 | 不可访问 | 不可访问 |

```typescript
class Animal {
  public name: string;
  protected age: number;
  private id: string;
  
  constructor(name: string, age: number) {
    this.name = name;           // ✅ 任何地方
    this.age = age;             // ✅ 同一类
    this.id = this.generateId(); // ✅ 同一类
  }
  
  private generateId(): string {
    return Math.random().toString(36);
  }
  
  public getInfo(): string {
    return `${this.name}(${this.age})`; // ✅ 同一类中可访问所有
  }
}

class Dog extends Animal {
  constructor(name: string, age: number) {
    super(name, age);
    console.log(this.name); // ✅ public：可访问
    console.log(this.age);  // ✅ protected：子类可访问
    // console.log(this.id); // ❌ private：子类不可访问
  }
}

const animal = new Animal('动物', 5);
console.log(animal.name);    // ✅ public
// console.log(animal.age);  // ❌ protected
// console.log(animal.id);   // ❌ private
```

### TypeScript private 与 JavaScript # private 字段

这是面试中极其高频的考点。

```typescript
// TypeScript 的 private（编译时检查）
class TSPrivate {
  private secret: string = 'ts-private';
  
  reveal() {
    console.log(this.secret); // ✅ 同一类内
  }
}

// JavaScript 的 # private（运行时真正的私有）
class JsPrivate {
  #secret: string = 'js-private';
  
  reveal() {
    console.log(this.#secret); // ✅ 同一类内
  }
}

const ts = new TSPrivate();
const js = new JsPrivate();

// TypeScript private 在编译后就是普通属性
// 运行时仍然可以访问（类型断言绕过）
(ts as any).secret; // ✅ 运行时可以访问！

// JavaScript # private 在运行时真正私有
// (js as any).#secret; // ❌ 语法错误，无法访问
js['#secret']; // undefined
```

**关键区别总结：**

| 特性 | TS `private` | JS `#private` |
|------|-------------|---------------|
| 检查时机 | 编译时 | 运行时 |
| 子类访问 | 不允许 | 不允许 |
| 编译后存在 | 变为普通属性 | 保留为 WeakMap 私有 |
| 类型断言绕过 | 可能（`as any`） | 不可能 |
| 性能 | 无运行时开销 | 微小的运行时开销 |

### 面试题

> **问：** 你应该选择 TS `private` 还是 JS `#private`？
> **答：** 如果只是防止其他开发者误用，且不在意运行时的真正私有性，用 TS `private`（零运行时开销）。如果你需要真正的运行时封装（例如库开发），用 `#private`。两者的最佳实践是：先用 TS 的 `private` 做编译时检查，同时在命名上用 `_` 前缀作为约定，如果确实需要运行时私有再用 `#`。

## 三、readonly 属性

`readonly` 修饰符表示属性只能在声明时或构造函数中被赋值：

```typescript
class Config {
  readonly version: string;
  readonly createdAt: Date = new Date(); // 声明时初始化
  
  constructor(version: string) {
    this.version = version; // ✅ 构造函数中赋值
  }
  
  update() {
    // this.version = '2.0'; // ❌ 只读属性不能修改
  }
}

const config = new Config('1.0');
console.log(config.version); // '1.0'
// config.version = '2.0';   // ❌
```

### readonly 与 const 的区别

```typescript
// const 用于变量
const MAX_SIZE = 100; // 变量不可重新赋值

// readonly 用于属性
class Box {
  readonly id: string; // 属性不可重新赋值
}

// 注意 readonly 并不意味着不可变（immutable）
class MutableArray {
  readonly items: number[] = [];
  
  add(item: number) {
    this.items.push(item); // ✅ 只读指的是引用不可变，内容可变！
  }
  
  replace(items: number[]) {
    // this.items = items; // ❌ 引用不可重新赋值
  }
}
```

## 四、参数属性

参数属性是 TypeScript 提供的语法糖，将构造器参数声明和字段声明合并：

```typescript
// 传统写法
class PersonOld {
  private name: string;
  private age: number;
  
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// 参数属性写法（简洁版）
class PersonNew {
  constructor(
    private name: string,
    public age: number,
    protected email?: string  // 可选参数也能用
  ) {}
  
  greet() {
    console.log(`我叫${this.name}，今年${this.age}岁`);
  }
}
```

给构造器参数加上修饰符（`public` / `private` / `protected` / `readonly`），TypeScript 会自动：
1. 声明同名的类字段
2. 在构造函数中将参数值赋给该字段

```typescript
class User {
  constructor(
    readonly id: number,         // 公开只读
    public name: string,         // 公开可读写
    private password: string,    // 私有
    protected role?: string      // 受保护可选
  ) {}
  
  // 等价于：
  // readonly id: number;
  // public name: string;
  // private password: string;
  // protected role?: string | undefined;
}
```

## 五、抽象类

抽象类是不能被直接实例化的类，用于定义子类必须实现的结构：

```typescript
abstract class Animal {
  abstract name: string;       // 抽象属性
  abstract makeSound(): void;   // 抽象方法
  
  move(): void {               // 具体方法（共享实现）
    console.log(`${this.name} 在移动`);
  }
}

class Dog extends Animal {
  name: string = '狗';
  
  makeSound(): void {
    console.log('汪汪！');
  }
}

// const animal = new Animal(); // ❌ 不能实例化抽象类
const dog = new Dog();        // ✅
dog.makeSound();              // '汪汪！'
dog.move();                   // '狗 在移动'
```

### 抽象类 vs 接口

这是面试中最常被问到的主题之一。

| 特性 | 抽象类 (abstract class) | 接口 (interface) |
|------|------------------------|-----------------|
| 实例化 | 不能 | 不能 |
| 方法实现 | 可以有具体方法 | 不能有实现（TS 除外？接口可以有默认实现？实际上接口不能有实现） |
| 构造函数 | 可以有 | 不能有 |
| 访问修饰符 | 支持 private/protected | 不支持 |
| 属性初始化 | 可以 | 不可以 |
| 多继承 | 单继承 | 多实现 |
| 运行时 | 存在（编译为 JS 类） | 不存在（编译时擦除） |
| 使用场景 | 共享实现 + 定义契约 | 仅定义契约 |

```typescript
// 何时用抽象类：有共享实现
abstract class Database {
  abstract connect(): void;
  abstract disconnect(): void;
  
  // 共享实现
  query(sql: string): Promise<any> {
    this.connect();
    // ...执行查询逻辑
    this.disconnect();
    return Promise.resolve([]);
  }
}

// 何时用接口：仅定义形状
interface Flyable {
  fly(): void;
}

interface Swimmable {
  swim(): void;
}

// 一个类可以实现多个接口
class Duck implements Flyable, Swimmable {
  fly() { console.log('飞'); }
  swim() { console.log('游'); }
}
```

### 面试题

> **问：** 抽象方法可以 private 吗？
> **答：** 不能。抽象方法必须由子类实现，所以必须是 `protected` 或 `public`。`private` 方法对子类不可见，无法被重写，与抽象方法的语义矛盾。

## 六、继承与 implements

### extends（继承）

```typescript
class BaseEntity {
  id: number;
  createdAt: Date = new Date();
  
  constructor(id: number) {
    this.id = id;
  }
  
  save(): void {
    console.log(`保存实体 #${this.id}`);
  }
}

class User extends BaseEntity {
  name: string;
  
  constructor(id: number, name: string) {
    super(id); // 必须先调用 super()
    this.name = name;
  }
  
  // 重写方法
  save(): void {
    console.log(`保存用户：${this.name}`);
    super.save(); // 调用父类方法
  }
}
```

### implements（实现接口）

```typescript
interface Serializable {
  serialize(): string;
}

interface Loggable {
  getLogInfo(): string;
}

class Product implements Serializable, Loggable {
  constructor(
    public id: number,
    public name: string,
    public price: number
  ) {}
  
  serialize(): string {
    return JSON.stringify(this);
  }
  
  getLogInfo(): string {
    return `Product(${this.id}): ${this.name}`;
  }
}
```

### 继承 vs 实现的选择

- **`extends`**：复用实现，建立"is-a"关系
- **`implements`**：仅约束形状，建立"can-do"关系

```typescript
// 一个类可以同时继承和实现
class SpecialProduct extends Product implements Loggable {
  getLogInfo(): string {
    return `Special: ${this.name}`;
  }
}
```

> **注**：接口也可以 `extends` 类（继承其成员签名），但此特性在实际中较少使用，了解即可。

## 八、Getters 与 Setters

TypeScript 完全支持 ES6 的 `get` / `set` 访问器，并可以添加类型注解：

```typescript
class Temperature {
  private _celsius: number = 0;
  
  get celsius(): number {
    return this._celsius;
  }
  
  set celsius(value: number) {
    if (value < -273.15) {
      throw new Error('温度不能低于绝对零度');
    }
    this._celsius = value;
  }
  
  get fahrenheit(): number {
    return this._celsius * 9 / 5 + 32;
  }
  
  set fahrenheit(value: number) {
    this._celsius = (value - 32) * 5 / 9;
  }
}

const temp = new Temperature();
temp.celsius = 25;
console.log(temp.fahrenheit); // 77
// temp.celsius = -300; // ❌ 抛出错误
```

### Getter/Setter 的类型要求

- `getter` 必须有返回值类型
- `setter` 的参数类型必须与 `getter` 的返回类型兼容
- `setter` 不能有返回值类型注解（必须返回 `void`）
- 访问器可以没有 `setter`（只读属性）

```typescript
class Person {
  private _fullName: string = '';
  
  // 只读 getter（没有 setter）
  get initials(): string {
    return this._fullName
      .split(' ')
      .map(n => n[0])
      .join('');
  }
  
  get fullName(): string {
    return this._fullName;
  }
  
  set fullName(name: string) {
    this._fullName = name.trim();
  }
}
```

## 九、静态成员

静态成员属于类本身，而不是类的实例：

```typescript
class MathUtils {
  static PI: number = 3.14159;
  
  static circleArea(radius: number): number {
    return this.PI * radius * radius; // this 指向类本身
  }
  
  static max(a: number, b: number): number {
    return a > b ? a : b;
  }
}

console.log(MathUtils.PI);           // 3.14159
console.log(MathUtils.circleArea(5)); // 78.53975
console.log(MathUtils.max(3, 7));    // 7

// 静态成员不能通过实例访问
const utils = new MathUtils();
// console.log(utils.PI); // ❌ 错误
```

### 静态成员与继承

静态成员也会被继承：

```typescript
class Parent {
  static type: string = 'PARENT';
  static identify(): string {
    return `我是${this.type}`;
  }
}

class Child extends Parent {
  static type: string = 'CHILD';
}

console.log(Parent.identify()); // '我是PARENT'
console.log(Child.identify());  // '我是CHILD'（this 指向 Child）
```

### 静态属性与泛型

```typescript
class Registry<T> {
  private static instances: Map<string, any> = new Map();
  
  static register(name: string, instance: any): void {
    this.instances.set(name, instance);
  }
  
  static get(name: string): any {
    return this.instances.get(name);
  }
}

Registry.register('user', { id: 1, name: '张三' });
```

### 静态初始化块（ES2022+）

```typescript
class Configuration {
  static apiUrl: string;
  static timeout: number;
  
  // 静态初始化块，在类加载时执行
  static {
    const env = process.env.NODE_ENV || 'development';
    if (env === 'production') {
      this.apiUrl = 'https://api.example.com';
      this.timeout = 5000;
    } else {
      this.apiUrl = 'http://localhost:3000';
      this.timeout = 10000;
    }
  }
}
```

## 十、this 参数

把方法当回调传的时候，`this` 会丢。TypeScript 可以在编译时帮你抓住这个问题——在方法的第一个参数位置声明 `this` 的类型：

```typescript
class MyClass {
  name = 'MyClass';
  
  // this 参数告诉 TS：这个方法必须通过 MyClass 的实例调用
  getName(this: MyClass): string {
    return this.name;
  }
}

const instance = new MyClass();
instance.getName(); // ✅

const fn = instance.getName;
// fn(); // ❌ 错误：this 上下文丢失
```

### 实际应用：事件处理中的 this

```typescript
class UIElement {
  element: HTMLElement;
  
  constructor(tag: string) {
    this.element = document.createElement(tag);
  }
  
  // 确保 onClick 中的 this 指向 UIElement 实例
  onClick(this: UIElement, handler: (this: UIElement, ev: MouseEvent) => void) {
    this.element.addEventListener('click', handler.bind(this));
  }
}
```

### this 参数在回调中的使用

```typescript
interface ClickHandler {
  (this: HTMLButtonElement, event: MouseEvent): void;
}

function setupButton(button: HTMLButtonElement, handler: ClickHandler) {
  button.addEventListener('click', handler); // handler 中的 this 是 button
}
```

## 十一、装饰器

> **警告**：装饰器是实验性特性，需要 `experimentalDecorators: true`。

装饰器让你在不修改方法体的情况下，给一批方法统一加上日志、权限检查等逻辑。

### 类装饰器

```typescript
function Sealed(constructor: Function) {
  Object.seal(constructor);
  Object.seal(constructor.prototype);
}

@Sealed
class SealedClass {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
```

### 方法装饰器

```typescript
function Log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = function (...args: any[]) {
    console.log(`调用 ${propertyKey}，参数：`, args);
    const result = originalMethod.apply(this, args);
    console.log(`结果：`, result);
    return result;
  };
  
  return descriptor;
}

class Calculator {
  @Log
  add(a: number, b: number): number {
    return a + b;
  }
}

const calc = new Calculator();
calc.add(2, 3);
// 输出：调用 add，参数：[2, 3]
// 输出：结果：5
```

### 属性装饰器

```typescript
function DefaultValue(value: any) {
  return (target: any, propertyKey: string) => {
    let currentValue = value;
    
    Object.defineProperty(target, propertyKey, {
      get: () => currentValue,
      set: (newValue) => {
        currentValue = newValue;
      },
      enumerable: true,
      configurable: true,
    });
  };
}

class Settings {
  @DefaultValue('guest')
  username: string;
}

const settings = new Settings();
console.log(settings.username); // 'guest'
```

### 参数装饰器

```typescript
function Validate(target: any, propertyKey: string, parameterIndex: number) {
  const existingValidated = Reflect.getOwnMetadata('validate', target, propertyKey) || [];
  existingValidated.push(parameterIndex);
  Reflect.defineMetadata('validate', existingValidated, target, propertyKey);
}
```

### 装饰器工厂

装饰器工厂是返回装饰器函数的函数，允许传入参数：

```typescript
function LogWith(prefix: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      console.log(`[${prefix}] 调用 ${propertyKey}`);
      return originalMethod.apply(this, args);
    };
  };
}

class Service {
  @LogWith('SERVICE')
  process(data: string) {
    return `处理：${data}`;
  }
}
```

## 十二、常见陷阱

### 陷阱 1：TypeScript private 不是运行时私有

```typescript
class Wallet {
  private balance: number = 1000;
  
  getBalance(): number {
    return this.balance;
  }
}

const wallet = new Wallet();
console.log(wallet.getBalance()); // 1000

// ❌ 编译时报错
// console.log(wallet.balance);

// ✅ 运行时通过类型断言绕过
console.log((wallet as any).balance); // 1000，运行时仍然可访问！
```

**解决方法：** 如果真正需要运行时私有，使用 JS 的 `#` 私有字段。

### 陷阱 2：装饰器需要 experimentalDecorators

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true  // 如果需要反射元数据
  }
}
```

如果没有启用，会报错：`Experimental support for decorators is a feature that is subject to change in a future release.`

### 陷阱 3：在继承中缺少 super() 调用

```typescript
class Base {
  constructor(public id: number) {}
}

class Derived extends Base {
  name: string;
  
  constructor(name: string) {
    // ❌ 错误：必须先调用 super()
    this.name = name;
    // super(0); // 延迟调用也不行，super() 必须是构造函数中的第一个语句
  }
}
```

### 陷阱 4：箭头函数与类方法

```typescript
class MyComponent {
  value: string = 'hello';
  
  // 实例方法（在原型上）
  regularMethod() {
    console.log(this.value);
  }
  
  // 箭头函数（每个实例一份）
  arrowMethod = () => {
    console.log(this.value);
  };
}

const comp = new MyComponent();
const fn1 = comp.regularMethod;
const fn2 = comp.arrowMethod;

fn1(); // ❌ undefined（this 丢失）
fn2(); // ✅ 'hello'（箭头函数捕获了 this）
```

**注意：** 箭头函数作为类属性会导致每个实例都创建一份函数副本（内存开销），而原型方法所有实例共享同一份。

### 陷阱 5：初始化顺序问题

```typescript
class Example {
  a: number = 1;
  b: number = this.a + 1;   // ✅ 2
  c: string = this.init();   // ✅ 调用方法
  
  constructor(public d: number = 5) {}
  
  private init(): string {
    return `a=${this.a}, d=${this.d}`;
  }
}

// 初始化顺序：
// 1. 基类字段初始化
// 2. 派生类字段初始化（按声明顺序）
// 3. 构造函数体执行
```

## 十三、面试高频题

### Q1：`private` 与 `protected` 的区别？

`private`：只能在声明它的类内部访问。`protected`：可以在声明它的类及其子类中访问。两者都不能在外部访问。

### Q2：抽象类和接口有什么区别？何时用哪个？

抽象类可以有方法实现、构造函数、访问修饰符，用于"共享实现 + 定义契约"的场景。接口只能定义形状（纯抽象），用于"定义契约"的场景。当有共享代码时用抽象类，当只需要保证结构一致时用接口。

### Q3：什么是参数属性？优势是什么？

参数属性是把构造函数参数直接转化为类字段的语法糖。优势是减少样板代码——不需要手动声明字段再赋值。在构造器参数前加 `private`/`protected`/`public`/`readonly` 即可。

### Q4：TS 的 `private` 和 JS 的 `#` 有什么区别？

TS `private` 是编译时检查，编译后变成普通属性，可以通过 `as any` 绕过。JS `#` 在运行时真正私有，使用 WeakMap 实现，不能被外部访问。库开发建议用 `#`，一般项目用 TS `private` 就够了。

### Q5：装饰器能做什么？有什么限制？

装饰器可以修改类、方法、属性、参数的行为。常见用途：日志、权限检查、依赖注入、属性验证。限制：目前是实验特性，需要 `experimentalDecorators: true`；不能装饰普通函数（只能用在高阶函数替代）。

### Q6：`super()` 为什么必须是构造函数的第一条语句？

因为 JavaScript 要求在访问 `this` 之前必须先完成父类的初始化。TypeScript 继承了这个规则。在调用 `super()` 之前访问 `this` 会抛出运行时错误。

---

## 总结

TypeScript 的类系统在 JavaScript 类的基础上提供了类型安全和更丰富的面向对象编程支持。掌握访问修饰符、抽象类、参数属性、装饰器等特性，可以写出更健壮、更具可维护性的代码。记住 TS 的 `private` 只是编译时检查，真正的运行时私有需要使用 JS 的 `#` 字段。选择抽象类还是接口，取决于你是需要"共享实现"（抽象类）还是仅需要"契约约束"（接口）。
