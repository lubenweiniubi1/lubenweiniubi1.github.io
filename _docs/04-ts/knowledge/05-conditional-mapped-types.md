# 条件类型与映射类型

## 一、前言

后端返回的 API 响应有时是 `{ data: T, error: null }`，有时是 `{ data: null, error: string }`。怎么让 TypeScript 根据一个字段自动推导另一个字段的类型？这就是条件类型和映射类型要解决的核心问题。

```typescript
// 如果把类型看成"值"...
type Result = SomeCondition extends true ? TypeA : TypeB;
// 就像 JavaScript 中的三元表达式一样
const result = someCondition ? valueA : valueB;
```

## 二、条件类型基础

### 2.1 基本语法

```typescript
T extends U ? X : Y
```

如果类型 `T` 可以赋值给类型 `U`，则结果为 `X`，否则为 `Y`。

```typescript
type IsString<T> = T extends string ? true : false;

type A = IsString<'hello'>;  // true
type B = IsString<42>;       // false
type C = IsString<string>;   // true
```

### 2.2 条件类型的实际应用

```typescript
// 提取数组元素的类型
type ElementType<T> = T extends unknown[] ? T[number] : T;

type A = ElementType<string[]>;   // string
type B = ElementType<number>;     // number

// 过滤 null/undefined
type NonNullable<T> = T extends null | undefined ? never : T;

type C = NonNullable<string | null>;   // string
type D = NonNullable<number | undefined>; // number
```

### 面试题

> **问：** 条件类型 `T extends U ? X : Y` 中，`extends` 的语义是什么？
> **答：** 这里的 `extends` 不是继承，而是**可赋值性检查**（assignability check）。`T extends U` 表示"T 是否可以赋值给 U"——即 T 是 U 的子类型。

## 三、分布式条件类型

当条件类型的**检测类型是一个裸类型参数**（即出现在 `extends` 前的类型参数），且该参数是联合类型时，条件类型会**分布**到联合类型的每个成员：

```typescript
type ToArray<T> = T extends unknown ? T[] : never;

// 如果 T 是联合类型 A | B：
type Result = ToArray<string | number>;
// 等价于：string[] | number[]
// 而不是 (string | number)[]
```

### 分布式行为详解

```typescript
// ❌ 非分布式：T 被包装了
type NonDistributive<T> = [T] extends [string] ? 'yes' : 'no';

// ✅ 分布式：T 是裸类型参数
type Distributive<T> = T extends string ? 'yes' : 'no';

type A = Distributive<string | number>;   // 'yes' | 'no'
type B = NonDistributive<string | number>; // 'no'（整体判断）
```

### 利用分布式实现类型过滤

```typescript
// 过滤掉 union 中的某些类型
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;

type A = Extract<'a' | 'b' | 'c', 'a' | 'c'>;  // 'a' | 'c'
type B = Exclude<'a' | 'b' | 'c', 'a'>;         // 'b' | 'c'

// 防止分布：使用元组包装
type PreventDistribute<T> = [T] extends [string] ? 'yes' : 'no';
type C = PreventDistribute<string | number>; // 'no'，不分布
```

### 常见陷阱

```typescript
// 陷阱：条件类型与 never 的交互
type Distributive<T> = T extends string ? T : never;

type Result = Distributive<never>; // never
// 因为 never 是空联合，分布式条件类型在遇到 never 时返回 never
// 但这往往不是期望的行为

// 解决方法：使用元组包装
type NonDistributive<T> = [T] extends [string] ? T : never;
type Result2 = NonDistributive<never>; // never（相同，但原因不同——整体判断）
```

## 四、infer 关键字

`infer` 是条件类型中的"类型提取"工具，用于在条件类型中声明一个**待推断的类型变量**：

```typescript
type ReturnType<T> = T extends (...args: any[]) => infer R ? R : never;
```

`infer R` 表示"让 TypeScript 推断这里的类型，并将其绑定到 R"。

### 4.1 经典工具类型实现

```typescript
// 提取函数参数类型
type Parameters<T> = T extends (...args: infer P) => any ? P : never;

// 提取 Promise 内部类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type A = UnwrapPromise<Promise<string>>;  // string
type B = UnwrapPromise<number>;           // number

// 提取数组元素类型
type ArrayItem<T> = T extends (infer U)[] ? U : T;

type C = ArrayItem<string[]>;  // string
type D = ArrayItem<number>;    // number
```

### 4.2 进阶 infer 用法

```typescript
// 提取函数第一个参数类型
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any ? F : never;

type Fn = (name: string, age: number) => void;
type Name = FirstArg<Fn>; // string

// 提取构造函数实例类型
type InstanceType<T> = T extends new (...args: any[]) => infer R ? R : never;

class MyClass {}
type Instance = InstanceType<typeof MyClass>; // MyClass

// 从字符串字面量类型中提取
type ExtractName<T extends string> = T extends `get${infer Rest}` ? Rest : never;

type MethodName = ExtractName<'getUser'>; // 'User'

// 深度递归 infer
type DeepPromiseValue<T> = T extends Promise<infer U>
  ? DeepPromiseValue<U>
  : T;

type Nested = DeepPromiseValue<Promise<Promise<string>>>; // string
```


### 面试题

> **问：** 实现一个类型工具，提取 Promise 的 value 类型，支持嵌套 Promise。
> **答：** 见上面 `DeepPromiseValue` 示例。核心是递归调用自身 + infer 提取。

## 五、映射类型基础

映射类型允许你**遍历已有类型的属性**来创建新类型：

```typescript
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};
```

语法：`{ [K in keyof T]: T[K] }`
- `K`：类型变量，遍历每个属性
- `keyof T`：T 的所有属性名联合
- `T[K]`：对应属性的值类型

### 5.1 基础映射类型

```typescript
// 所有属性变为可选
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// 所有属性变为必选
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// 所有属性变为只读
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// 使用示例
interface User {
  name: string;
  age: number;
  email: string;
}

type PartialUser = Partial<User>;
// { name?: string; age?: number; email?: string }

type ReadonlyUser = Readonly<User>;
// { readonly name: string; readonly age: number; readonly email: string }
```

## 六、修饰符操作

映射类型支持在遍历时通过 `+` 和 `-` 前缀增减修饰符：

| 语法 | 含义 |
|------|------|
| `readonly` | 添加 readonly |
| `-readonly` | 移除 readonly |
| `?` | 添加可选 |
| `-?` | 移除可选 |

```typescript
// 移除只读修饰符
type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

// 移除可选修饰符 = Required
type Concrete<T> = {
  [P in keyof T]-?: T[P];
};

// 混合使用
type CreateMutable<T> = {
  -readonly [P in keyof T]: T[P];
};
type LockedAccount = {
  readonly id: string;
  readonly name: string;
};
type UnlockedAccount = CreateMutable<LockedAccount>;
// { id: string; name: string }
```

## 七、键名重映射（TS 4.1+）

TypeScript 4.1 引入了 `as` 子句，允许在映射类型中**重命名属性键**：

```typescript
// 为所有属性添加前缀
type AddPrefix<T, P extends string> = {
  [K in keyof T as `${P}${Capitalize<string & K>}`]: T[K];
};

interface Person {
  name: string;
  age: number;
}

type PrefixedPerson = AddPrefix<Person, 'user'>;
// { userName: string; userAge: number }
```

### 过滤属性

```typescript
// 只保留函数类型的属性
type PickFunctions<T> = {
  [K in keyof T as T[K] extends Function ? K : never]: T[K];
};

interface Mix {
  id: number;
  getName: () => string;
  setName: (name: string) => void;
}

type Functions = PickFunctions<Mix>;
// { getName: () => string; setName: (name: string) => void }

// 排除特定键
type ExcludeKeys<T, Exclude> = {
  [K in keyof T as K extends Exclude ? never : K]: T[K];
};

type WithoutId = ExcludeKeys<{ id: number; name: string; age: number }, 'id'>;
// { name: string; age: number }
```

## 八、模板字面量类型（TS 4.1+）

模板字面量类型允许在类型层面进行字符串操作：

```typescript
type EventName = `on${Capitalize<string>}`;
// 但这太宽泛了——实际上需要配合具体类型

// 实际应用：将属性名转换为事件名
type ToEvent<T extends string> = `on${Capitalize<T>}`;

type ClickEvent = ToEvent<'click'>;  // 'onClick'
type ChangeEvent = ToEvent<'change'>; // 'onChange'
```

### 字符串模式匹配与 infer

```typescript
// 解析路由参数
type ExtractParam<T extends string> = 
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParam<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type RouteParams = ExtractParam<'/user/:id/post/:postId'>;
// 'id' | 'postId'
```

### 字符串联合类型的笛卡尔积

```typescript
type Color = 'red' | 'blue' | 'green';
type Size = 'small' | 'large';

type CssClass = `${Color}-${Size}`;
// 'red-small' | 'red-large' | 'blue-small' | 'blue-large' | 'green-small' | 'green-large'
```

## 九、内置字符串操作类型

| 类型 | 效果 |
|------|------|
| `Uppercase<S>` | 全部大写 |
| `Lowercase<S>` | 全部小写 |
| `Capitalize<S>` | 首字母大写 |
| `Uncapitalize<S>` | 首字母小写 |

```typescript
type Upper = Uppercase<'hello'>;     // 'HELLO'
type Lower = Lowercase<'WORLD'>;     // 'world'
type Cap = Capitalize<'name'>;       // 'Name'
type Uncap = Uncapitalize<'Name'>;   // 'name'

// 结合映射类型：创建事件处理函数类型
type EventHandler<T extends string> = {
  [K in T as `on${Capitalize<K>}`]: (event: K) => void;
};

type ClickHandler = EventHandler<'click' | 'submit'>;
// {
//   onClick: (event: 'click') => void;
//   onSubmit: (event: 'submit') => void;
// }
```

## 十、综合实战

### 10.1 表单验证类型

```typescript
type ValidationRule<T> = {
  required?: boolean;
  minLength?: T extends string ? number : never;
  min?: T extends number ? number : never;
  max?: T extends number ? number : never;
  pattern?: T extends string ? RegExp : never;
};

type FormValidation<T> = {
  [K in keyof T]: ValidationRule<T[K]>;
};

interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
  age: number;
}

type LoginValidation = FormValidation<LoginForm>;
// {
//   username: { required?: boolean; minLength?: number; pattern?: RegExp };
//   password: { required?: boolean; minLength?: number; pattern?: RegExp };
//   remember: { required?: boolean };
//   age: { required?: boolean; min?: number; max?: number };
// }
```

### 10.2 事件系统类型

```typescript
type EventMap = {
  click: { x: number; y: number };
  keydown: { key: string; ctrlKey: boolean };
  focus: { target: HTMLElement };
  resize: { width: number; height: number };
};

// 监听器类型
type EventListeners = {
  [K in keyof EventMap as `on${Capitalize<K>}`]: 
    (payload: EventMap[K]) => void;
};

// 移除监听器类型
type EventRemovers = {
  [K in keyof EventMap as `removeOn${Capitalize<K>}`]: 
    () => void;
};

type EventSystem = EventListeners & EventRemovers;
```

### 10.3 API 响应包装

```typescript
type ApiResponse<T> = {
  data: T;
  status: number;
  message: string;
  timestamp: number;
};

// 所有 API 响应统一包装
type ApiWrapper<T> = {
  [K in keyof T]: ApiResponse<T[K]>;
};

interface UserApi {
  getUser: { id: number; name: string };
  updateUser: { success: boolean };
}

type WrappedUserApi = ApiWrapper<UserApi>;
// {
//   getUser: ApiResponse<{ id: number; name: string }>;
//   updateUser: ApiResponse<{ success: boolean }>;
// }

// 可选：添加条件处理
type SmartApiWrapper<T> = {
  [K in keyof T]: T[K] extends void
    ? { status: number; message: string }
    : ApiResponse<T[K]>;
};
```

### 10.4 深层属性可选化

```typescript
type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

interface Config {
  database: {
    host: string;
    port: number;
    credentials: {
      user: string;
      password: string;
    };
  };
}

type DeepPartialConfig = DeepPartial<Config>;
// {
//   database?: {
//     host?: string;
//     port?: number;
//     credentials?: {
//       user?: string;
//       password?: string;
//     };
//   };
// }
```

## 十一、常见陷阱

### 陷阱 1：深层映射类型的性能问题

```typescript
// 递归的 DeepPartial 在处理大型类型时可能导致编译性能下降
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

// 性能优化：限制递归深度
type DeepReadonlyLimited<T, Depth extends number = 3> = Depth extends 0
  ? T
  : {
      readonly [P in keyof T]: T[P] extends object
        ? DeepReadonlyLimited<T[P], PrevDepth[Depth]>
        : T[P];
    };

// TypeScript 内置的 PrevDepth 模拟
interface PrevDepth {
  0: 0; 1: 0; 2: 1; 3: 2; 4: 3;
}
```

### 陷阱 2：条件类型中的循环引用

```typescript
// ❌ 循环引用导致编译错误
type Circular<T> = T extends number ? Circular<T> : string;

// ✅ 需要条件终结
type SafeCircular<T> = T extends number
  ? T extends 0
    ? string
    : SafeCircular<T>
  : string;
```

### 陷阱 3：分布式条件类型的意外行为

```typescript
// 如果 T 包含 never，分布式条件类型会产生意外结果
type Filter<T> = T extends string ? T : never;

type Test = Filter<string | number | never>; // string
// 注意 never 被跳过了，因为 never 是空联合

// 如果 T 是 any
type TestAny = Filter<any>; // 分发到 string | never = string
// 但 any 的特殊行为：any extends string ? 是 boolean

// 更安全的写法
type SafeFilter<T> = [T] extends [string] ? T : never;
// 使用元组包装阻止分发
```

### 陷阱 4：模板字面量类型与大量联合类型的组合爆炸

```typescript
type Color = 'red' | 'blue' | 'green' | 'yellow' | 'purple';
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Weight = '100' | '200' | '300' | '400' | '500';

// 这会产生 5 * 5 * 5 = 125 种组合
type CssClass = `${Color}-${Size}-${Weight}`;

// 如果联合类型更大，可能导致类型实例化过深
// 优化：分步创建
type ColorSize = `${Color}-${Size}`;  // 25 种
type FinalClass = `${ColorSize}-${Weight}`; // 125 种（但缓存了中间结果）
```

## 十二、高级模式

### 12.1 Branded Types（品牌类型）

```typescript
type Brand<T, B> = T & { __brand: B };

type UserId = Brand<number, 'UserId'>;
type PostId = Brand<number, 'PostId'>;

function getUser(id: UserId) { /* ... */ }
function getPost(id: PostId) { /* ... */ }

const uid = 1 as UserId;
const pid = 1 as PostId;

getUser(uid); // ✅
getUser(pid); // ❌ 类型不匹配
```

### 12.2 类型安全的 Pick — 只保留指定键

```typescript
// 用映射类型实现一个类型安全的 pick：只保留对象中指定的键
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

interface User {
  id: number;
  name: string;
  email: string;
  password: string;
}

// PublicUser 只包含 id、name、email，password 被排除
type PublicUser = Pick<User, 'id' | 'name' | 'email'>;
// { id: number; name: string; email: string }
```

类似地可以实现 `Omit`（排除指定键），原理相同：先用 `Exclude<keyof T, K>` 过滤键名，再映射。
```

## 十三、面试高频题

### Q1：实现一个 `Pick` 类型

```typescript
type MyPick<T, K extends keyof T> = {
  [P in K]: T[P];
};
```

### Q2：分布式条件类型何时发生？

当 `extends` 左侧是一个裸泛型参数（没有任何包装），且该参数是联合类型时，条件类型会分布式执行——对联合类型的每个成员分别计算后合取结果。

### Q3：`infer` 和泛型有什么区别？

泛型需要在调用时显式或隐式传入；`infer` 可以在条件类型匹配时由 TypeScript 自动推断类型变量。`infer` 只能在条件类型的 `extends` 子句中使用。

### Q4：如何让一个映射类型只保留特定类型的属性？

使用 `as` 子句进行键过滤：

```typescript
type PickByType<T, ValueType> = {
  [K in keyof T as T[K] extends ValueType ? K : never]: T[K];
};
```

### Q5：模板字面量类型的编译性能如何？

对于较小的联合类型（几十个成员以内）没有问题。但当联合类型变大时（数百个），组合爆炸会导致编译变慢。建议对大型联合使用分步模板字面量类型，避免一次性组合过多。

---

## 总结

条件类型和映射类型是 TypeScript 类型编程的核心。条件类型让你"选择"类型（类似三元表达式），映射类型让你"变换"类型（类似 `Array.map`）。结合 `infer`、模板字面量类型和键重映射，可以实现极其强大和精确的类型系统——从表单验证到 API 封装，再到类型安全的 Builder 模式。
