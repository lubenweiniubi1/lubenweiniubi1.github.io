# Hooks 深入理解

> 覆盖 useState / useEffect / useLayoutEffect / useRef / useMemo / useCallback / useReducer / useContext 的核心原理与面试要点。

---

## 一、useState

### 1.1 基本机制

- useState 通过**调用顺序**来匹配状态 —— 所以不能在条件/循环中调用
- 状态存储在 Fiber 节点的 `memoizedState` 链表中
- 更新是**异步批处理**的（React 18 自动批处理所有场景）

### 1.2 函数式更新 vs 直接赋值

```jsx
// ❌ 直接赋值：依赖闭包中的旧值
setCount(count + 1);
setCount(count + 1);  // 两次都基于同一个旧值，最终只 +1

// ✅ 函数式更新：React 保证传入最新值
setCount(c => c + 1);
setCount(c => c + 1);  // 正确 +2
```

### 1.3 类组件 setState vs 函数组件 useState

| 特性 | 类组件 `setState` | 函数组件 `useState` |
|------|------------------|-------------------|
| 相同值更新 | **会**触发渲染 | **不会**触发渲染（Object.is 比较） |
| 状态合并 | **浅合并**（自动 merge） | **替换**（不 merge，需手动展开） |
| 比较机制 | 不做比较 | `Object.is()` |

### 1.4 类组件 setState 同步/异步场景（React ≤17）

**异步（批处理）场景**：React 事件处理器、生命周期方法
**同步场景**：原生 DOM 事件、setTimeout/setInterval、Promise 回调

> React 18 引入 Automatic Batching，所有场景都自动批处理。退出批处理用 `flushSync()`。

---

## 二、useEffect vs useLayoutEffect（★ 核心面试题）

### 2.1 完整执行时序

```
setState 触发
  → Render 阶段（可中断，构建 Fiber 树）
  → Commit 阶段（不可中断）：
      BeforeMutation → Mutation（DOM 更新） → Layout 子阶段
        └─ useLayoutEffect 在这里同步执行！DOM 已更新，浏览器还没画
  → 浏览器 Layout → Paint（用户看到新 UI）
  → 微任务队列
    └─ useEffect 在这里异步执行！用户已经看到新 UI
```

### 2.2 对比表

| 维度 | useLayoutEffect | useEffect |
|------|----------------|-----------|
| 执行时机 | Commit 的 Layout 子阶段 | 浏览器绘制后 |
| 阻塞绘制 | ✅ 同步阻塞 | ❌ 不阻塞 |
| 内部 setState | 同步合并到同一帧，不闪烁 | 触发新一轮渲染，可能闪烁 |
| 使用场景 | DOM 测量、滚动恢复、防闪烁 | 数据请求、订阅、日志 |

### 2.3 面试话术

> "两者区别要从 React Commit 阶段和浏览器渲染管线理解。useLayoutEffect 在 DOM 变更后、浏览器绘制前同步执行——适合需要防闪烁的 DOM 操作。useEffect 在浏览器绘制后异步执行——适合不涉及视觉的副作用。90% 场景用 useEffect。"

---

## 三、闭包陷阱（Stale Closure）

### 3.1 问题本质

useEffect 回调在创建时捕获了当时的 props/state。依赖数组不变 → 回调不重建 → 读到旧值。

### 3.2 三种解法

| 解法 | 适用场景 | 原理 |
|------|---------|------|
| 函数式更新 `setCount(c => c + 1)` | 只需更新 state | React 传入最新值 |
| 补全依赖数组 | 需要响应外部变量变化 | 让回调随依赖重建 |
| useRef 存最新值 | 需要读值但不触发渲染 | ref.current 是可变对象 |

---

## 四、useMemo / useCallback

```jsx
const memoValue = useMemo(() => compute(a, b), [a, b]);    // 缓存计算结果
const memoFn = useCallback(() => doSomething(a), [a]);      // 缓存函数引用
// useCallback(fn, deps) ≡ useMemo(() => fn, deps)
```

**何时用**：配合 `React.memo` 避免子组件不必要渲染；缓存昂贵的计算结果。**不要无脑包**——比较本身也有开销。

---

## 五、useRef

- `ref.current` 可变，修改不触发渲染
- 常用于：DOM 引用、保存不触发渲染的变量（如定时器 ID、前一个 state）
- React 19 中 ref 可作为普通 prop 传递，不再需要 `forwardRef`

---

## 六、useReducer

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
```

- 适合复杂状态逻辑（多个子值、状态转换依赖前一个状态）
- `dispatch` 引用稳定，不会随渲染变化
- 本质上是对 useState 的封装

---

## 七、Hooks 规则与原理

1. **只在最顶层调用**：不在条件/循环/嵌套函数中
2. **只在 React 函数中调用**：函数组件或自定义 Hook
3. **自定义 Hook 以 `use` 开头**

**为什么必须按顺序？** Hook 通过链表存储，通过 `hookIndex` 定位。React 用调用顺序匹配状态——条件调用会打乱顺序。

```jsx
// ❌ 条件调用 → hookIndex 错乱
if (condition) { useState(0); } // 有时调有时不调 → 后面的 hook 全错位
useState('');                   // 这个变成第 0 个或第 1 个，不确定！
```

---

## 八、useLayoutEffect 死循环机制

useLayoutEffect 中 setState 会**同步**触发重渲染（在同一个 Commit 阶段内循环），React 不会自动阻止——只会在循环过深时抛出 "Maximum update depth exceeded"。

```jsx
// ❌ 死循环：每次 Layout 都 +1 → 重渲染 → 再进 Layout → ...
useLayoutEffect(() => {
  setCount(count + 1);
}, [count]);

// ✅ 有停止条件，最多 N 次
useLayoutEffect(() => {
  if (width > max && lines < 5) {
    setLines(lines + 1);
  }
}, [lines]);
```

---

## 九、React 18 新增 Hooks

### useId
生成服务端/客户端一致的唯一 ID，用于 `htmlFor`、`aria-labelledby` 等无障碍属性。

### useSyncExternalStore
安全订阅外部 Store（Redux、Zustand 等），防止 **Tearing**（并发渲染下 UI 中同时出现新旧状态）。

### useInsertionEffect
在 DOM 变更**之前**同步执行，专门给 CSS-in-JS 库（styled-components、Emotion）在 Layout 前注入样式。普通开发者几乎用不到。

---

## 十、React 19 新增 Hooks

### use()
在组件中直接读取 Promise 或 Context。**可在条件和循环中调用**——它是 React 内建函数，不受 Hooks 规则约束。

```jsx
function Profile({ userPromise }) {
  const user = use(userPromise);  // Promise resolve 前组件"悬浮"，配合 Suspense
  const theme = use(ThemeContext); // 替代 useContext
  return <div>{user.name}</div>;
}
```

### useOptimistic
乐观更新：先假设操作成功立即更新 UI，失败自动回滚。

```jsx
const [optimistic, addOptimistic] = useOptimistic(
  messages,
  (state, newMsg) => [...state, newMsg]
);
// addOptimistic(msg) → 立即显示 → 真实请求成功则不变，失败则回滚
```

### useFormStatus
读取所在 `<form>` 的提交状态：`{ pending, data, method, action }`。必须在 `<form>` 内部组件中调用。

### useActionState
管理 Server Action 的完整状态：`const [state, formAction, isPending] = useActionState(action, initialState)`。
