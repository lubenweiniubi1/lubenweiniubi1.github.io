# TypeScript 面试题库

---

## 一、基础概念

### 1. 说说你对 TypeScript 的理解？与 JavaScript 的区别？

### 2. TS 的数据类型有哪些？

### 3. TS 中 any 类型的作用是什么？

### 4. TypeScript 中 any、never、unknown、null & undefined 和 void 有什么区别？

### 5. TypeScript 中可以使用 String、Number、Boolean、Symbol、Object 等给类型做声明吗？

### 6. 数组定义的两种方式？

---

## 二、高级类型

### 7. 说说你对 TS 中高级类型的理解？有哪些？

### 8. TypeScript 中 type 和 interface 的区别？

### 9. TypeScript 中 const 和 readonly 的区别？枚举和常量枚举的区别？接口和类型别名的区别？

### 10. TypeScript 中 interface 可以给 Function / Array / Class（Indexable）做声明吗？

### 11. TS 中使用 Union Types 有哪些注意事项？

### 12. 如何联合枚举类型的 Key？

---

## 三、泛型（Generics）

### 13. 说说你对 TypeScript 中泛型的理解？应用场景？

### 14. 泛型约束（Generic Constraints）是如何工作的？extends 在泛型中的作用？

### 15. 泛型工具类型有哪些？Partial、Required、Readonly、Pick、Record 的实现原理？

---

## 四、类型守卫与类型收窄（Type Guards & Narrowing）

### 16. 什么是类型守卫？typeof、instanceof、in 的区别与使用场景？

### 17. 如何自定义类型守卫（User-Defined Type Guards）？is 关键字的作用？

### 18. 什么是可辨识联合（Discriminated Unions）？如何设计？

---

## 五、条件类型与映射类型（Conditional & Mapped Types）

### 19. 条件类型（Conditional Types）的语法和使用场景？extends 与 infer 关键字的作用？

### 20. 映射类型（Mapped Types）是什么？如何在映射类型中重命名 key（Key Remapping）？

### 21. 模板字面量类型（Template Literal Types）的应用场景？

---

## 六、类与面向对象

### 22. TS 如何设计 Class 声明？

### 23. 对 TypeScript 类中成员的 public、private、protected、readonly 的理解？

### 24. 什么是抽象类（Abstract Class）？与接口的区别？

### 25. 说说你对 TypeScript 装饰器（Decorators）的理解？

---

## 七、类型操作与工具

### 26. keyof 和 typeof 关键字的作用？

### 27. 简述工具类型 Exclude、Omit、Merge、Intersection、Overwrite 的作用与实现

### 28. 类型断言（Type Assertions）有哪几种写法？as const 的作用？

### 29. satisfies 关键字（TS 4.9）的作用与使用场景？

### 30. 索引签名（Index Signature）是什么？如何使用？

---

## 八、模块与命名空间

### 31. import 报 "Cannot find module" 怎么排查？Namespace 还有人用吗？

### 32. TypeScript 中如何设置模块导入的路径别名？

### 33. 如何使 TS 项目引入并识别编译为 JS 的 npm 包？

---

## 九、类型兼容性

### 35. 简单聊聊你对 TypeScript 类型兼容性的理解？

### 36. 协变（Covariance）与逆变（Contravariance）是什么？TypeScript 中的表现？

### 37. TypeScript 中对象展开会有什么副作用吗？

---

## 十、声明文件与环境声明

### 38. declare、declare global 是什么？使用场景？

### 39. 全局声明和局部声明（Ambient Declarations）的区别？

### 40. .d.ts 声明文件的编写规范与模块声明（Module Augmentation）？

---

## 十一、配置与编译

### 41. tsconfig.json 中有哪些配置项？核心配置有哪些？

### 42. TS 的编译原理？tsc 与 babel 编译 TS 的区别？

### 43. 什么是 Project References？如何配置？

### 44. 三斜线指令（Triple-Slash Directives）是什么？

---

## 十二、进阶话题

### 45. TS 中的 this 和 JS 中的 this 的区别？如何在 TS 中声明 this 类型？

### 46. 函数重载（Function Overloads）如何实现？使用场景？

### 47. TypeScript 的类型推导（Type Inference）机制是怎样的？最佳实践？

### 48. 如何在 TypeScript 中实现 Mixin？

### 49. DefinitelyTyped / @types 是什么？如何贡献类型声明？

### 50. 如何在 TypeScript 中模拟标称类型（Nominal Typing / Branded Types）？
