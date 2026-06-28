# React 核心深度面试题

> 对应考察维度：**专业能力 → 前端核心技术 → React 基础概念理解的深度**
> 字节 OD 面试高频考点，按考察深度递进排列

---

## 一、React Fiber 架构（必问）

### Q1: Fiber 架构产生的背景是什么？解决了什么问题？

**回答要点：**

React 15 及之前使用递归的 Stack Reconciler，递归调用栈一旦开始就无法中断。当组件树庞大时，主线程被长时间占用（超过 16.6ms），导致页面掉帧、动画卡顿。

Fiber 的核心改进：
- **可中断的异步渲染**：将渲染任务拆分为小的 Fiber 单元，通过调度器在浏览器空闲时执行
- **优先级调度**：高优先级任务（用户输入、动画）可以打断低优先级任务（数据更新）
- **双缓冲机制**：current tree 和 workInProgress tree 交替工作，减少闪烁

### Q2: Reconciler 如何遍历 Fiber 树？

```
遍历顺序：深度优先先序遍历（DFS）
- child：指向第一个子节点
- sibling：指向下一个兄弟节点
- return：指向父节点

遍历过程：
1. 从根节点开始，沿 child 向下
2. 到达叶子节点后，通过 sibling 横向移动
3. 一层遍历完后，通过 return 回到父层
```

**追问：为什么用 DFS 而不是 BFS？**
- DFS 天然对应组件树的层级关系（父→子→孙）
- 便于实现可中断恢复（暂停后从断点继续）
- 与生命周期执行顺序匹配（父 componentWillMount → 子 componentWillMount → 子 componentDidMount → 父 componentDidMount）

### Q3: DOM 树和 Fiber 树的区别？

| 维度 | DOM 树 | Fiber 树 |
|------|--------|----------|
| 结构 | 只有 child + sibling 的隐式关系 | 显式的 child / sibling / return 三向链表 |
| 更新方式 | 直接操作，不可中断 | 可中断、可恢复、可复用 |
| 节点类型 | 仅 DOM 元素 | 类组件 / 函数组件 / HostComponent / Fragment 等 |
| 生命周期 | 无 | 关联 effect 副作用（增/删/改） |

---

## 二、React Hooks 深度

### Q4: Hooks 闭包陷阱是什么？如何解决？

**闭包陷阱本质**：函数组件每次渲染都会创建新的闭包。如果在 `useEffect` 或定时器中引用了 state，捕获的是当次渲染的值，后续 state 更新后闭包内的值不会自动更新。

```jsx
// ❌ 问题代码：count 永远是 0
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count); // 始终打印 0
  }, 1000);
  return () => clearInterval(timer);
}, []);

// ✅ 方案一：正确声明依赖
useEffect(() => {
  const timer = setInterval(() => {
    console.log(count);
  }, 1000);
  return () => clearInterval(timer);
}, [count]);

// ✅ 方案二：使用 useRef 保存最新值（不重建定时器）
const countRef = useRef(count);
countRef.current = count;

useEffect(() => {
  const timer = setInterval(() => {
    console.log(countRef.current); // 始终是最新值
  }, 1000);
  return () => clearInterval(timer);
}, []);
```

### Q5: useEffect 依赖过多导致重复渲染怎么办？

**优化策略（按优先级排列）：**

1. **精简依赖项**：只放真正需要监听的值，不要放函数引用（函数放到 effect 内部或 useCallback 包裹）
2. **合并副作用**：多个相关 effect 合并成一个
3. **条件判断**：在 effect 内部做 guard
   ```jsx
   useEffect(() => {
     if (!data) return; // 没有数据时不执行
     doSomething(data);
   }, [data]);
   ```
4. **useRef 突破依赖**：用 ref 存储不需要触发 effect 的最新值
5. **useReducer 替代多 useState**：当多个 state 相互关联时，用 reducer 统一管理

### Q6: useMemo / useCallback 什么时候该用，什么时候不该用？

**该用的场景：**
- `useMemo`：复杂计算（大数组过滤/排序/聚合），计算结果作为其他 hook 的依赖
- `useCallback`：传递给 `React.memo` 包裹的子组件；作为其他 hook（useEffect）的依赖

**不该用的场景：**
- 简单计算（`a + b`）—— useMemo 本身有开销
- 传给原生 DOM 元素的事件回调 —— DOM 元素没有 memo 概念
- 组件本身渲染就很便宜时

**核心原则：先写没有优化的代码，遇到性能问题再 profile，精准优化。**

### Q7: 手写一个防闭包陷阱的 useInterval Hook

```jsx
function useInterval(callback, delay) {
  const savedCallback = useRef();

  // 每次渲染更新回调引用
  useEffect(() => {
    savedCallback.current = callback;
  });

  useEffect(() => {
    if (delay === null) return;
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]); // 仅 delay 变化时重建定时器
}
```

---

## 三、React 19 / React 18 新特性

### Q8: React 19 Compiler（React Forget）做了什么？

**核心能力：自动 memoization**

React 19 Compiler 在编译阶段自动分析组件的依赖关系，自动插入 `useMemo` / `useCallback` / `React.memo`，开发者不再需要手动写这些优化。

- 编译时静态分析，零运行时开销
- 遵循 "Rules of React"（类似 ESLint 规则但作用于编译层）
- 解决 "要不要包 useMemo" 的决策负担

### Q9: React Server Components (RSC) 原理？与 Client Components 的区别？

**核心区别：**

| 维度 | Server Components | Client Components |
|------|-------------------|-------------------|
| 运行环境 | Node.js 服务端 | 浏览器 |
| JS 代码 | 不发送到客户端 | 完整打包发送 |
| 可用能力 | 直接访问 DB/文件系统 | 不可访问服务端资源 |
| 交互性 | 无（不能 useState/useEffect/onClick） | 有完整交互能力 |
| 标识 | 默认 | `'use client'` 指令 |

**RSC 的优势：**
- 减小客户端 bundle 体积
- 避免客户端-服务端数据请求瀑布流
- 自动代码分割

### Q10: React 18 的并发特性有哪些？

- **useTransition / startTransition**：标记低优先级更新
- **useDeferredValue**：延迟某个值的更新，类似防抖但不阻塞
- **自动批处理**：setTimeout/Promise 中的多次 setState 也会合并
- **Suspense 增强**：支持服务端渲染和数据获取

---

## 四、虚拟 DOM 与 Diff 算法

### Q11: Diff 算法的三层假设与比较过程

**三层假设：**
1. **类型不同 → 直接重建**：`<div>` 变 `<span>` 不比较属性，整棵子树重建
2. **key 相同 → 复用**：列表节点通过 key 判断是否可复用
3. **同层比较**：只比较同层级节点，不跨层

**比较过程：**
```
1. 根节点类型比较 → 不同则直接卸载重建
2. 属性 diff → 只更新变化的属性
3. 子节点 diff（三种情况）：
   - 都是文本：直接替换
   - 旧的是数组、新的是数组：key 匹配 + 增删移
   - 旧的是单个、新的是数组：卸载旧的，创建新的
```

**为什么不用 index 做 key？**
- 数组顺序变化时 index 会错位，导致错误复用
- 例如：删除第一项，index 为 1 的元素会被认为是原来的 index 0，产生错误的 DOM 复用

---

## 五、React 状态管理

### Q12: useState 批量更新机制

React 18 之前只在事件处理函数中批处理，setTimeout/Promise 中不会。React 18 之后所有场景都会自动批处理。

```jsx
// React 18：三次 setState 合并为一次渲染
const handleClick = () => {
  setCount(c => c + 1);
  setCount(c => c + 1);
  setCount(c => c + 1);
  // 结果是 +3（函数形式拿到最新值）
};

// 如果需要退出批处理：
import { flushSync } from 'react-dom';
flushSync(() => setCount(c => c + 1));
```

### Q13: useReducer vs useState 如何选择？

| 场景 | 推荐 |
|------|------|
| 单个简单状态 | useState |
| 多个状态相互关联 | useReducer |
| 下一状态依赖上一状态 | useReducer |
| 需要复用状态逻辑 | useReducer + Context |
| 状态逻辑复杂需要测试 | useReducer（reducer 是纯函数） |

---

## 六、React 性能优化体系

### Q14: React 性能优化手段全景

```
构建时：
├── 代码分割（React.lazy + Suspense）
├── Tree Shaking
└── 资源压缩

运行时：
├── React.memo + useMemo + useCallback
├── 虚拟列表（react-window / react-virtuoso）
├── 避免内联对象/函数作为 props
├── 状态下沉（把状态放到使用它的最小组件中）
└── 列表使用稳定 key

首屏：
├── SSR / SSG / RSC
├── 图片懒加载 + WebP/AVIF
├── preload / prefetch 关键资源
└── CDN + 缓存策略
```

---

## 七、面试回答框架

当面试官问 "你 React 学到什么程度？" 时，建议按这个结构展开：

1. **基础层**（1 分钟）：Hooks 使用、组件通信、生命周期理解
2. **原理层**（2 分钟）：Fiber 架构、Diff 算法、渲染机制
3. **工程层**（2 分钟）：性能优化实战、自定义 Hooks 封装、状态管理方案
4. **趋势层**（1 分钟）：RSC、React 19 Compiler、AI 辅助开发

每一层都带一个自己项目的真实案例。
