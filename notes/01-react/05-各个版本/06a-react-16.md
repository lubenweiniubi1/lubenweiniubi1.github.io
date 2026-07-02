# 06a — React 16：Fiber 架构与 Hooks 革命

> React 16 是 React 历史上最大的版本，内核重写 + Hooks 推出，彻底改变了 React 的开发范式。

---

## 一、Fiber 架构（16.0，底层核心）

### 1.1 为什么需要 Fiber？

React 15 使用 **Stack Reconciler**（递归调和），一旦开始渲染必须同步完成整个组件树，无法中断。问题：

- 组件树大时，JS 执行占用主线程时间过长（>16ms）
- 用户输入、动画掉帧
- React 被"卡住"直到渲染完成

**Fiber 核心思想**：把渲染工作拆成一个个可中断的**工作单元（Unit of Work）**，浏览器每帧的剩余时间执行若干工作单元，没执行完就让出主线程。

### 1.2 Fiber 节点结构（简化）

```
Fiber Node = {
  type, key,          // 组件类型
  child, sibling,     // 链表结构（替代递归树）
  return,             // 父节点
  effectTag,          // 副作用标记（插入/更新/删除）
  memoizedState,      // hooks 链表
  lanes,              // 优先级
  alternate,          // 当前树 ↔ 工作树双缓冲
}
```

### 1.3 双缓冲（Double Buffering）

- **current 树**：当前屏幕显示的 Fiber 树
- **workInProgress 树**：正在构建的新 Fiber 树
- 两个树通过 `alternate` 互相指向
- 渲染完成后，workInProgress 变成 current

### 1.4 Render Phase vs Commit Phase

| 阶段 | Render Phase | Commit Phase |
|------|-------------|-------------|
| 操作 | 构建 Fiber 树、Diffing | 将变更应用到 DOM |
| 可中断 | ✅ 可中断、可恢复 | ❌ 不可中断 |
| 副作用 | 无（纯计算） | 执行 effect、调用生命周期 |

---

## 二、Hooks（16.8，改变一切）

### 2.1 为什么 Hooks 是里程碑？

React 16.8 之前，函数组件是"无状态组件"，只能做展示。Hooks 推出后：

- 函数组件可以：管理状态、处理副作用、访问 Context、使用 Ref
- 类组件的所有能力，函数组件都能做
- 不用在"用函数组件还是类组件"之间纠结

### 2.2 核心 Hooks 详解

#### useState

```jsx
const [count, setCount] = useState(0);
// 每次 setState 触发重新渲染
// setCount(fn) 函数式更新可以避免闭包陷阱
setCount(c => c + 1);
```

**为什么不能条件调用？** React 通过调用顺序匹配 hooks 链表，条件调用会打乱顺序。

#### useEffect 与 useLayoutEffect：从源码执行时序深入理解

这两个 Hook 的区别不能停留在"一个异步一个同步"——必须从 React 的 **Commit Phase 子阶段** 和 **浏览器渲染管线** 两个维度来理解。

##### 完整执行时序（以 setCount(1) 触发更新为例）

```
T0: Render 阶段（可中断）
    └─ 重新执行组件函数，生成新的 Fiber 树，Diffing 对比

T1: Commit 阶段开始（同步、不可中断）
    ├─ BeforeMutation 子阶段
    │   └─ getSnapshotBeforeUpdate（类组件）
    │
    ├─ Mutation 子阶段
    │   ├─ 删除旧 DOM 节点
    │   ├─ 插入新 DOM 节点
    │   └─ 更新 DOM 属性
    │   （此时真实 DOM 已更新！但浏览器还没渲染到屏幕）
    │
    └─ Layout 子阶段 ← useLayoutEffect 在这里
        ├─ useLayoutEffect(() => {
        │      // DOM 已更新，浏览器尚未绘制
        │      // 可以同步读取/修改 DOM 尺寸
        │      // 这里 setState 会触发同步重渲染，合并到同一帧
        │      // 用户不会看到闪烁
        │   })
        ├─ componentDidMount
        └─ componentDidUpdate

T2: Commit 阶段结束
    └─ JS 调用栈清空，控制权交还给浏览器

T3: 浏览器渲染管线
    ├─ 样式计算（Style）
    ├─ 布局计算（Layout）← 浏览器的 Layout/Reflow
    ├─ 绘制（Paint）
    └─ 合成（Composite）
    （此时用户才真正看到更新后的画面）

T4: 浏览器渲染完成
    └─ 微任务队列执行 ← useEffect 在这里
        └─ useEffect(() => {
               // 用户已经看到新 UI
               // 适合：数据请求、订阅、打日志等不涉及视觉的操作
               // 这里 setState 会触发新一次渲染（用户可能看到闪烁）
           })
```

##### 关键结论

| 维度 | useLayoutEffect | useEffect |
|------|----------------|-----------|
| 执行时机 | Commit 的 Layout 子阶段 | 浏览器绘制后，微任务队列 |
| 与浏览器 Layout 的关系 | **在浏览器 Layout 之前** | **在浏览器 Layout 之后** |
| 是否阻塞绘制 | ✅ 同步阻塞（慎用） | ❌ 不阻塞 |
| DOM 可读吗 | ✅ 已更新 | ✅ 已更新 |
| 屏幕可见吗 | ❌ 用户还没看到 | ✅ 用户已看到 |
| 内部 setState | 同步合并到当前帧，不闪烁 | 触发新一轮渲染，可能闪烁 |
| 对应类组件 | componentDidMount / componentDidUpdate | 无直接对应（类组件无此概念） |

##### 实际使用场景

**useLayoutEffect 适用场景（阻止视觉闪烁）：**

```jsx
// 场景1：根据 DOM 实际尺寸调整布局
useLayoutEffect(() => {
  const { width } = ref.current.getBoundingClientRect();
  if (width > 600) {
    setLayout('wide');
  } else {
    setLayout('narrow');
  }
}, []);  // 不同屏幕尺寸下，UI 直接以正确布局出现，无闪烁

// 场景2：滚动位置恢复
useLayoutEffect(() => {
  containerRef.current.scrollTop = savedScrollPosition;
}, [savedScrollPosition]);  // 在浏览器绘制前就滚到位，用户看到的就是正确位置

// 场景3：第三方 DOM 库初始化（需要同步操作 DOM）
useLayoutEffect(() => {
  const instance = new FancyChart(ref.current);
  instance.render();
  return () => instance.destroy();
}, []);
```

##### useLayoutEffect 中 setState 的同步行为详解

这是面试高频追问："为什么 useLayoutEffect 里 setState 不会闪烁？会不会死循环？"

**为什么不会闪烁？**

useLayoutEffect 执行于 Commit 阶段的 Layout 子阶段，此时 DOM 已更新但**浏览器还没绘制**。在这个窗口内调用 setState：

```
触发 setState
    │
    ▼
┌──────────────────────────────────────────────────────┐
│              Commit 阶段（同步、不可中断）              │
│                                                      │
│  Mutation：DOM 更新完成                                │
│       │                                               │
│       ▼                                               │
│  Layout 子阶段：                                      │
│    ├─ useLayoutEffect() ← 在这里 setState              │
│    │       │                                          │
│    │       ▼  React 检测到新 state                     │
│    │       立即同步重入 Render 阶段                     │
│    │       │                                          │
│    │       ├─ 重新生成 Fiber 树                        │
│    │       ├─ 重新 Diffing                            │
│    │       └─ 重新进入 Commit → 再跑一次 Layout         │
│    │       │                                          │
│    │       ▼  最终 state 稳定                          │
│    └─ componentDidMount/Update                        │
│                                                      │
│  Commit 结束 → 交还浏览器                              │
└──────────────────────────────────────────────────────┘
    │
    ▼
浏览器：一次 Layout + Paint（用户看到的是最终结果）
```

**关键**：整个"setState → 重渲染 → 再次 Layout"的循环全部发生在一个同步调用栈内。浏览器没有机会在中间插一脚，所以**用户只看到最后一次渲染的结果，不会看到中间态**。

**源码简化逻辑**：

```js
// React 内部（极度简化）
function commitRoot(root) {
  // Mutation：更新 DOM
  commitMutationEffects(root);

  // Layout：同步执行 useLayoutEffect
  commitLayoutEffects(root);  // 这里用户代码调用 setState

  // 如果有新的更新被调度（由 useLayoutEffect 中的 setState 触发）
  if (rootHasPendingUpdate(root)) {
    // 同步再跑一遍 render + commit
    renderRootSync(root);       // 重新 Render
    commitMutationEffects(root); // 重新 Mutation
    commitLayoutEffects(root);   // 重新 Layout
    // 重复直到 state 稳定
  }
}
// 这全部结束后，浏览器才获得控制权，才发生 Layout/Paint
```

**会不会死循环？**

**会，如果你不设停止条件。** React 不会自动阻止——它只是一直循环直到没有新 state 产生。

```jsx
// ❌ 死循环
useLayoutEffect(() => {
  setCount(count + 1);  // 每次 Layout 都 +1 → 触发重渲染 → 再进 Layout → 再 +1 → ...
}, [count]);

// ✅ 有停止条件
useLayoutEffect(() => {
  if (containerRef.current.scrollWidth > maxWidth && lines < 5) {
    setLines(lines + 1);  // lines < 5 就停了，最多重渲染 5 次
  }
}, [lines]);
```

**React 内部保护 vs 开发者责任**：

| 保护机制 | 说明 |
|---------|------|
| 无自动保护 | React 不会像 useEffect 那样"等下一次事件循环"，它会一直同步执行直到稳定 |
| 极深循环会报错 | 若同步循环次数过多（内部计数器溢出），React 会抛出 "Maximum update depth exceeded" |
| 终究会终止 | 要么 state 稳定，要么报错。不会像 effect 无限循环那样默默卡死页面 |

**useEffect 中 setState 对比**：

```jsx
// useEffect 中 setState —— 异步，产生闪烁
useEffect(() => {
  const { width } = ref.current.getBoundingClientRect();
  setMeasuredWidth(width);  // 用户先看到 0，下一帧才看到真实宽度
}, []);

// useLayoutEffect 中 setState —— 同步，无闪烁
useLayoutEffect(() => {
  const { width } = ref.current.getBoundingClientRect();
  setMeasuredWidth(width);  // 用户直接看到真实宽度
}, []);
```

**总结一句话**：

> useLayoutEffect 里的 setState 发生在"DOM 已更新但浏览器还没画"的窗口。React 会在这个窗口内同步跑完所有重渲染，用户只看到最终结果。但要自己控制终止条件，否则 React 会一直循环直到报错。

**useEffect 适用场景（不涉及视觉的操作）：**

```jsx
// 场景1：数据请求
useEffect(() => {
  fetchUser(id).then(setUser);
}, [id]);

// 场景2：事件订阅
useEffect(() => {
  const unsubscribe = eventEmitter.subscribe(handler);
  return unsubscribe;
}, []);

// 场景3：日志/埋点（不影响 UI）
useEffect(() => {
  analytics.track('page_view', { page: pathname });
}, [pathname]);
```

##### 为什么 useLayoutEffect 用多了会出问题？

```jsx
// 反模式：在 useLayoutEffect 中做耗时操作
useLayoutEffect(() => {
  // 大量计算、同步请求...
  // 这会阻塞浏览器绘制，用户看到的是白屏/旧 UI
  // 屏幕就像"卡住了"
}, []);
```

**口诀**：默认用 useEffect，只在**不立即改 DOM 就会出现肉眼可见的闪烁**时，才改用 useLayoutEffect。90% 的场景 useEffect 就够了。

##### 常见误用警示

**useEffect 常见误用**：
- 依赖数组为 `[]` 但内部引用了外部变量 → 闭包陷阱（读到旧值）
- 清理函数忘了写 → 内存泄漏（订阅/定时器未清理）
- 在 useEffect 中无防护地 setState → 无限循环
- 在 useEffect 中做 DOM 测量后立即 setState → 用户看到闪烁

**useLayoutEffect 常见误用**：
- 在其中做异步请求 → 没必要，白白阻塞绘制
- 在其中做重计算 → 卡住浏览器，用户感知到的延迟
- 所有 DOM 操作都放这里 → 过度使用，拖慢首屏

```jsx
// ❌ 典型错误：应该在 useEffect 却用了 useLayoutEffect
useLayoutEffect(() => {
  fetch('/api/data').then(setData);  // 白白阻塞绘制！改用 useEffect
}, []);

// ✅ 正确：DOM 测量必须用 useLayoutEffect
useLayoutEffect(() => {
  const height = ref.current.scrollHeight;
  setMeasuredHeight(height);  // 必须在绘制前完成，否则用户看到高度跳变
}, [content]);
```

---

### 闭包陷阱（Stale Closure）专题

这是 useEffect 最高频的面试考点，也是实际开发中最容易踩的坑。

#### 什么是闭包陷阱？

useEffect 的回调函数在**创建时捕获了当时的 props 和 state**。如果依赖数组没包含变化的值，回调里读到的永远是旧值。

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count);       // ❌ 永远是 0！
      setCount(count + 1);      // ❌ 永远是 0 + 1 = 1
    }, 1000);
    return () => clearInterval(timer);
  }, []);  // 依赖数组为空 → 回调只在挂载时创建一次
}
```

**发生了什么**：
1. 组件第一次渲染，count = 0
2. useEffect 执行，回调捕获了 count = 0
3. setInterval 每秒执行一次，但每次读到的 count 都是 0
4. setCount(0 + 1) 永远设置成 1

#### 为什么会出现？

```
第一次渲染：
  组件函数执行 → count = 0
  ↓
  useEffect 回调被创建 → 闭包捕获 count = 0
  ↓
  React 记录：deps = []，回调已执行

第二次渲染（setCount 触发）：
  组件函数执行 → count = 1（新作用域！）
  ↓
  useEffect 检查 deps：[] 没变 → 跳过，不复执
  ↓
  但 setInterval 里的回调还是第一次渲染的 → count 还是 0

问题本质：useEffect 的回调活在"第一次渲染的作用域"里，
每次重渲染创建的新作用域和旧回调毫无关系。
```

#### 三种解法

**解法一：补全依赖数组（直接但可能引入新问题）**

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);  // 用函数式更新
  }, 1000);
  return () => clearInterval(timer);
}, [count]);  // 依赖 count → 每次 count 变就重建定时器
```

**问题**：定时器被反复清除重建，但结果是对的。

**解法二：函数式更新（推荐，不依赖外部状态）**

```jsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(c => c + 1);  // c 是 React 传入的最新值，不是闭包捕获的
  }, 1000);
  return () => clearInterval(timer);
}, []);  // 依赖数组为空，定时器只创建一次，但 setCount 用函数式更新
```

**原理**：`setCount(c => c + 1)` 中的 `c` 不是闭包捕获的，而是 React 在更新时传入的最新 state。函数式更新永远拿到最新值。

**解法三：useRef 保存最新值（适合需要读但不触发渲染的场景）**

```jsx
function Timer() {
  const [count, setCount] = useState(0);
  const countRef = useRef(count);
  countRef.current = count;  // 每次渲染同步最新值到 ref

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(countRef.current);       // ✅ ref.current 永远是最新值
    }, 1000);
    return () => clearInterval(timer);
  }, []);
}
```

**原理**：ref 是可变对象，`ref.current` 的修改不触发渲染，但 useEffect 回调里读 ref 永远是同一引用 → 拿到最新值。

#### 三种解法对比

| 解法 | 适用场景 | 注意事项 |
|------|---------|---------|
| 补全依赖数组 | 回调逻辑依赖外部变量且需要响应变化 | 可能导致回调频繁重建 |
| 函数式更新 `setState(fn)` | 只需要更新 state，不需要读 state | 不能替代需要读值的场景 |
| useRef 保存最新值 | 需要读最新值但不触发渲染 | ref 是"逃生舱"，滥用破坏 React 数据流 |

#### 面试时怎么答

> "闭包陷阱的本质是 useEffect 回调在创建时捕获了当时作用域里的值，依赖数组不变就不会重建回调，导致读到的始终是旧值。
> 解法有三：函数式更新（最优雅，React 保证传入最新值）、补全依赖数组（最直接但可能频繁重建）、useRef 存最新值（适合只读不写的场景）。
> 我日常优先用函数式更新，搞不定时才考虑另外两种。"

---

#### useRef

```jsx
const ref = useRef(initialValue);
// ref.current 可变，修改不触发渲染
// 常用于：DOM 引用、保存不需要触发渲染的变量
```

#### useContext

```jsx
const value = useContext(MyContext);
// 替代 <Context.Consumer>
// Context 值变化时，组件重新渲染
```

#### useReducer

```jsx
const [state, dispatch] = useReducer(reducer, initialState);
// useState 的替代方案，适合复杂状态逻辑
// dispatch 的引用稳定，不会变化
```

#### useMemo / useCallback

```jsx
const memoValue = useMemo(() => compute(deps), [deps]);   // 缓存值
const memoFn = useCallback(() => { ... }, [deps]);         // 缓存函数引用
// useCallback(fn, deps) 等价于 useMemo(() => fn, deps)
```

**何时用？** 性能敏感场景 —— 传给子组件的引用需要稳定（配合 React.memo）、计算成本高的值需要缓存。

### 2.3 Hooks 规则

1. **只在最顶层调用**：不在条件/循环/嵌套函数中
2. **只在 React 函数中调用**：函数组件或自定义 Hook
3. 自定义 Hook 以 `use` 开头

---

## 三、React.lazy + Suspense（代码分割）

```jsx
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

- 组件级别懒加载，按需加载 JS bundle
- Suspense 提供加载中的 fallback UI
- 支持嵌套，最近一个 Suspense 边界生效

---

## 四、Error Boundaries（错误边界）

### 4.1 为什么需要 Error Boundaries？

**React 15 的痛点**：组件渲染时抛出错误 → **整个组件树崩溃** → 白屏。一个按钮报错，整个页面没了。

React 16 引入 Error Boundary：**把错误控制在一个子树内，不让它波及整个页面**。类比 try-catch，但适用于声明式的 React 渲染。

### 4.2 基本用法

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  // 渲染阶段的错误 → 用这个降级 UI
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  // 渲染阶段的错误 → 用这个做副作用（日志、上报）
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo.componentStack);
    // 上报到监控平台
    reportError({ error, stack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <FallbackUI
          message={this.state.error?.message}
          onRetry={() => this.setState({ hasError: false })}
        />
      );
    }
    return this.props.children;
  }
}
```

### 4.3 两个 API 的区别

| | getDerivedStateFromError | componentDidCatch |
|------|-------------------------|-------------------|
| 调用时机 | Render 阶段 | Commit 阶段 |
| 用途 | 更新 state → 渲染 fallback UI | 副作用：打日志、上报监控 |
| 返回值 | 返回 state 补丁 | 无返回值 |
| 禁止操作 | ❌ 不能有副作用 | ✅ 可以做副作用 |
| 触发渲染 | ✅ 触发重新渲染以显示 fallback | ❌ 不触发渲染 |

**为什么需要两个？** Render 阶段不能有副作用（getDerivedStateFromError 是纯函数），但错误上报是副作用（componentDidCatch）。React 把职责分开：一个管 UI，一个管日志。

### 4.4 能捕获什么？不能捕获什么？

```
┌─────────────────────────────────────────────────┐
│               可以被 Error Boundary 捕获            │
│                                                 │
│  ✅ render() 中的错误                             │
│  ✅ 生命周期方法中的错误（componentDidMount 等）      │
│  ✅ 构造函数中的错误                                │
│  ✅ getDerivedStateFromProps 中的错误               │
│  （这些都是 React 渲染流程内的同步代码）               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            不能被 Error Boundary 捕获              │
│                                                 │
│  ❌ 事件处理器中的错误（onClick、onChange 等）        │
│     → 原因：事件处理器在 React 渲染流程之外执行        │
│     → 解决：自己 try-catch                         │
│                                                 │
│  ❌ 异步代码中的错误（setTimeout、Promise）            │
│     → 原因：回调执行时 React 已经退出渲染流程          │
│     → 解决：自己 try-catch + setState 标记错误        │
│                                                 │
│  ❌ 服务端渲染中的错误（SSR）                        │
│     → 原因：SSR 不走客户端渲染流程                    │
│                                                 │
│  ❌ Error Boundary 自身的错误                      │
│     → 原因：自己不能捕获自己                          │
│     → 解决：父级再包一层 Error Boundary              │
└─────────────────────────────────────────────────┘
```

**核心判断标准**：错误是否发生在 **React 的同步渲染调用栈**内？

- 是 → Error Boundary 能捕获
- 否 → 需要自己 try-catch

### 4.5 为什么 try-catch 不能替代 Error Boundary？

```jsx
function MyComponent() {
  try {
    // ❌ 这个 try-catch 捕获不了 ChildComponent render 的错误！
    return <ChildComponent />;
  } catch (e) {
    return <Fallback />;
  }
}
```

原因：JSX `<ChildComponent />` 不会立即执行，它只是 `React.createElement`。真正的渲染发生在 React 内部的递归调和过程中，你的 try-catch 在外面，根本包不住。

### 4.6 为什么必须是类组件？

React 官方解释：Error Boundary 需要 `componentDidCatch` 和 `getDerivedStateFromError` 这两个生命周期。截止 React 19，Hooks 没有等价 API。

社区讨论过的 Hook 方案（如 `useErrorBoundary`）本质上是包装了类组件。React 团队表示未来可能有 Hook 版本，但目前还没有。

### 4.7 放置策略：在哪里放 Error Boundary？

```jsx
// 坏：一层包全部，某组件报错整个页面 fallback
<ErrorBoundary>
  <App>
    <Header />
    <Content />
    <Sidebar />
    <Footer />
  </App>
</ErrorBoundary>

// 好：颗粒化放置，独立区域各自兜底
function App() {
  return (
    <>
      <Header errorFallback={<SlimHeader />}>
        <Header />
      </Header>
      <ErrorBoundary errorFallback={<ErrorContent />}>
        <Content />
      </ErrorBoundary>
      <ErrorBoundary errorFallback={<p>Sidebar unavailable</p>}>
        <Sidebar />
      </ErrorBoundary>
    </>
  );
}
```

**颗粒化原则**：一个 Error Boundary 保护一个功能区域。Header 挂掉不影响 Content 和 Sidebar。

### 4.8 实际生产案例

**案例一：保护第三方组件**

```jsx
function MapView() {
  return (
    <ErrorBoundary fallback={<StaticMapImage />}>
      <InteractiveMap /> {/* 第三方地图库，不稳定 */}
    </ErrorBoundary>
  );
}
```

**案例二：路由级别兜底**

```jsx
function App() {
  return (
    <ErrorBoundary fallback={<ErrorPage onRetry={() => window.location.reload()} />}>
      <Router>
        <Routes>
          <Route path="/checkout" element={<Checkout />} /> {/* 下单页，不能挂 */}
          <Route path="/blog" element={<Blog />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

**案例三：异步错误用 Error Boundary 降级**

```jsx
function useAsyncError() {
  const [, setError] = useState();
  return (error) => setError(() => { throw error; });
  // 把异步错误"扔"回 React 渲染流程，让 Error Boundary 能捕获
}

function DataLoader() {
  const throwError = useAsyncError();
  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(err => throwError(err));  // 异步错误 → 转为渲染错误
  }, []);
  // ...
}
```

**核心技巧**：`setState(() => { throw error })` ——在状态更新函数中 throw，React 会把错误交给最近的 Error Boundary。

### 4.9 与 Suspense 的关系

```
<Suspense fallback={<Spinner />}>   ← 处理"还没 ready"
  <ErrorBoundary fallback={<ErrorUI />}>  ← 处理"出错了"
    <Content />
  </ErrorBoundary>
</Suspense>
```

Suspense 和 Error Boundary 是正交的：一个管加载态，一个管错误态。嵌套使用时外层 Suspense 捕获 Promise，内层 Error Boundary 捕获渲染错误。

### 4.10 面试怎么答

> "Error Boundary 是 React 的声明式错误处理机制，利用类组件的两个生命周期——getDerivedStateFromError 渲染 fallback UI、componentDidCatch 上报错误日志。
> 它只能捕获 React 同步渲染调用栈中的错误——render、生命周期、构造函数。事件处理器和异步回调不在这个调用栈里，所以捕获不到，需要自己 try-catch。
> 实际使用时我会按功能区域颗粒化放置，保证一个模块挂了不影响其他模块。另外有个常用技巧：用 `setState(() => { throw error })` 把异步错误转回渲染流程，让 Error Boundary 统一兜底。"

---

## 五、React 事件系统

> React 16 建立了完整的事件系统——合成事件 + 事件委托 + Fiber 树冒泡模拟。本节重点把 **React 16 vs 17 在事件委托上的差异**吃透，这是面试高频考点，也是微前端场景下实际会遇到的问题。

### 5.1 合成事件（SyntheticEvent）

React 封装了跨浏览器的**合成事件**，对不同浏览器暴露统一 API：

```jsx
function handleClick(e) {
  // e 是 SyntheticEvent，API 和原生一致
  e.preventDefault();
  e.stopPropagation();
  console.log(e.target);         // 事件源（触发事件的真实 DOM）
  console.log(e.currentTarget);  // 当前处理事件的元素
  console.log(e.nativeEvent);    // 底层原生 Event（需要时）
}
```

| 属性 | 含义 |
|------|------|
| `e.target` | 事件最初发生的那个具体元素（谁触发） |
| `e.currentTarget` | 当前绑定 handler 的那个元素（谁处理） |
| `e.nativeEvent` | 底层原生事件对象 |

### 5.2 事件委托：React 16 vs 17 的核心差异（★ 重点）

React 不给每个 DOM 单独绑事件，而是**全部委托到一个根节点**。但委托到**哪个节点**，React 16 和 17 截然不同——这不是实现细节，而是直接影响**混合原生事件时的执行顺序**和**微前端场景下的 stopPropagation 行为**。

#### 5.2.1 委托位置对比

```
React 16：委托到 document                 React 17+：委托到 #root
=======================                 =======================

document  ← dispatchEvent 在这里         document
  │                                       │
  └─ #root                                └─ #root  ← dispatchEvent 在这里
       └─ <App>                                └─ <App>
            └─ <button>                              └─ <button>
```

| 版本 | 委托位置 | 事件监听方式 |
|------|---------|-------------|
| React 16 | `document` | `document.addEventListener('click', dispatchEvent)` |
| React 17+ | 根容器节点（`#root`） | `rootContainer.addEventListener('click', dispatchEvent)` |

React 17 在 `#root` 上同时注册了**捕获和冒泡**两个监听器，分别负责 React 的捕获阶段和冒泡阶段。这一点是理解下面 demo 的关键。

#### 5.2.2 Demo 1：原生事件 + React 事件混用，执行顺序完全不同

场景：父子元素各绑定了原生事件（捕获 + 冒泡）和 React 合成事件（onClickCapture + onClick）。

```jsx
function App() {
  useEffect(() => {
    const parent = document.getElementById('parent');
    const child = document.getElementById('child');

    parent.addEventListener('click', () => console.log('原生-父捕获'), true);
    child.addEventListener('click', () => console.log('原生-子捕获'), true);
    parent.addEventListener('click', () => console.log('原生-父冒泡'), false);
    child.addEventListener('click', () => console.log('原生-子冒泡'), false);
  }, []);

  return (
    <div id="parent" onClickCapture={() => console.log('React-父捕获')}
                     onClick={() => console.log('React-父冒泡')}>
      父元素
      <div id="child" onClickCapture={() => console.log('React-子捕获')}
                      onClick={() => console.log('React-子冒泡')}>
        子元素
      </div>
    </div>
  );
}
```

**点击 child 元素，React 16 输出：**

```
原生-父捕获 → 原生-子捕获 → 原生-子冒泡 → 原生-父冒泡
→ React-父捕获 → React-子捕获 → React-子冒泡 → React-父冒泡
```

**React 16 的时序逻辑**：原生事件从 child 一路冒泡到 `document`，途中所有原生 handler 依次执行。React 的 `dispatchEvent` 绑在 `document` 上——它是**整个传播链的最后一站**。所以**所有原生事件必须先跑完，React 事件才登场**。

```
Native Capture:  document → #root → parent → child    ← 原生捕获依次触发
Native Bubble:   child → parent → #root → document    ← 原生冒泡依次触发
                                                      ← 到这里才到 document！
React dispatch:  在 document 上被调用
                 → React 模拟捕获（父→子）
                 → React 模拟冒泡（子→父）
```

**点击 child 元素，React 17 输出：**

```
React-父捕获 → React-子捕获 → 原生-父捕获 → 原生-子捕获
→ 原生-子冒泡 → 原生-父冒泡 → React-子冒泡 → React-父冒泡
```

**React 17 的时序逻辑**：React 在 `#root` 上同时注册了原生捕获和原生冒泡两个监听器。当原生事件沿 DOM 树传播时：

```
Native Capture（从上往下）:
  document → ... → #root → React 捕获监听器触发！ → React-父捕获 → React-子捕获
                      → parent → 原生-父捕获
                      → child  → 原生-子捕获

Native Bubble（从下往上）:
  child   → 原生-子冒泡
  parent  → 原生-父冒泡
  #root   → React 冒泡监听器触发！ → React-子冒泡 → React-父冒泡
  ... → document
```

**核心结论**：

> React 16：所有原生事件 **>** 所有 React 事件（原生永远先执行）
>
> React 17：React 捕获 **>** 原生捕获 **>** 原生冒泡 **>** React 冒泡（React 和原生**交替执行**）

#### 5.2.3 Demo 2：同一元素上的原生事件和 React 事件

```jsx
function App() {
  const ref = useRef(null);

  useEffect(() => {
    const dom = ref.current;
    dom.addEventListener('click', () => console.log('原生捕获'), true);
    dom.addEventListener('click', () => console.log('原生冒泡'), false);
  }, []);

  return (
    <div ref={ref} onClickCapture={() => console.log('React捕获')}
                   onClick={() => console.log('React冒泡')}>
      点击我
    </div>
  );
}
```

**React 16 输出**：`原生捕获 → 原生冒泡 → React捕获 → React冒泡`

**React 17 输出**：`React捕获 → 原生捕获 → 原生冒泡 → React冒泡`

原理同上——React 17 中 `#root` 位于该元素之上，捕获阶段先经过 `#root` 触发 React 捕获，而 React 16 要到 document 才触发。这个 demo 更直观地展示了同一元素上两种事件的先后关系完全颠倒。

#### 5.2.4 Demo 3：原生 stopPropagation() 对 React 事件的影响——React 16 的"一刀切"

```jsx
function App() {
  useEffect(() => {
    const child = document.getElementById('child');
    child.addEventListener('click', (e) => {
      console.log('原生捕获');
      e.stopPropagation(); // ← 在捕获阶段阻止传播
    }, true);
  }, []);

  return (
    <div onClick={() => console.log('React-父冒泡')}
         onClickCapture={() => console.log('React-父捕获')}>
      父元素
      <button id="child" onClick={() => console.log('React-子冒泡')}
                        onClickCapture={() => console.log('React-子捕获')}>
        子元素
      </button>
    </div>
  );
}
```

**React 16 输出**：`原生捕获` —— **就这一行，后面全没了。**

**为什么？** `e.stopPropagation()` 在原生捕获阶段被调用，阻止了事件继续传播——冒泡阶段不会发生，事件也永远不会到达 `document`。React 的 `dispatchEvent` 绑在 `document` 上，事件连 document 都没到，React 根本不知道有这件事发生过。**所有 React handler（捕获 + 冒泡）全部失效。**

**React 17 输出**：`React-父捕获 → React-子捕获 → 原生捕获` —— React 冒泡也没了，但**捕获还在。**

**为什么？** React 17 的捕获监听器在 `#root` 上，事件在捕获阶段**先经过 `#root`**（React 捕获已触发），**之后**才到达 child 触发 `e.stopPropagation()`。所以 React 捕获 handler 已经执行完了，被阻止的只是后续的冒泡阶段。

```
React 16：                     React 17：
                                
child 原生捕获                  #root → React捕获已触发 ✅
  └─ stopPropagation()          child 原生捕获
     └─ 事件传播终止               └─ stopPropagation()
     └─ document 永远收不到          └─ 后续冒泡终止
     └─ React 全挂 ❌               └─ React冒泡挂了，但捕获保住了 ✅
```

**这是 React 16 → 17 最关键的破坏性变化**：在 React 16 中，原生 `stopPropagation` 可以"关掉"整个 React 事件系统；React 17 中它只能阻止冒泡阶段的 React handler，捕获阶段的拦不住。

#### 5.2.5 为什么 React 17 要改？

| 痛点（React 16） | React 17 如何解决 |
|------------------|------------------|
| **多版本共存**：页面上同时有 React 16 和 React 17，事件委托都在 document 上打架 | 各版本委托到各自的 `#root`，互不干扰 |
| **微前端**：不同子应用的事件在 document 上交叉触发，`e.stopPropagation()` 在 React 层完全失效 | 每个子应用独立事件系统，stopPropagation 只在当前微前端内部生效 |
| **事件池**：异步访问事件属性必须 `e.persist()` | 移除事件池，事件对象就是普通对象 |
| **与原生事件交互不直观**：所有原生事件必然先于 React 事件执行 | React 事件和原生事件按 DOM 树位置自然交替 |

#### 5.2.6 面试话术

> "React 16 把所有事件委托到 `document`，React 17 改成了委托到根容器节点。这个变化有三个影响：
> 第一，**执行顺序变了**——React 16 中所有原生事件一定先于 React 事件执行；React 17 中 React 捕获最先执行，然后原生捕获、原生冒泡，最后 React 冒泡。
> 第二，**stopPropagation 语义变了**——React 16 中在原生捕获阶段 stopPropagation，事件到不了 document，整个 React 事件系统被'关掉'；React 17 中因为捕获阶段先经过 #root，React 捕获 handler 拦不住。
> 第三，**微前端友好**——每个 React 实例委托到自己的 root，互不干扰。"

### 5.3 事件冒泡模拟（collectListeners）

React 的冒泡**不是真正的 DOM 冒泡**——所有事件只绑定在根节点。React 通过**遍历 Fiber 树**来模拟冒泡：

```
1. 原生事件在 <button> 上触发 → 沿 DOM 树冒泡到根节点 → dispatchEvent 被调用
2. 从 e.target 拿到真实 DOM → 读取 _reactInternalFiber → 找到对应的 Fiber 节点
3. 从目标 Fiber 向上遍历 return 链，逐个收集事件处理器（见下方 collectListeners）
4. 按收集顺序执行 handler（冒泡方向 = 目标→根）
5. 冒泡阶段：原生顺序 → 捕获阶段：反转顺序
6. 某个 handler 调了 e.stopPropagation() → 跳出循环，后续 handler 不执行
```

```js
function collectListeners(startFiber, eventType) {
  const listeners = [];
  let current = startFiber;

  while (current !== null) {
    const props = current.memoizedProps;
    const propName = reactEventToProp(eventType); // 'click' → 'onClick'
    if (props[propName]) {
      listeners.push({
        instance: current.stateNode, // 真实 DOM 节点
        listener: props[propName],   // 事件处理函数
      });
    }
    current = current.return; // 向父 Fiber 遍历
  }
  return listeners; // 顺序：目标 → 根（冒泡顺序）
}
```

**Fiber 与 DOM 的关联**：

```js
// React 创建 DOM 时
domNode._reactInternalFiber = fiber;

// 事件触发时——从真实 DOM 直通 Fiber 树
const fiber = e.target._reactInternalFiber;
```

### 5.4 捕获阶段（onClickCapture）

捕获 handler 的执行依赖 React 版本：

**React 16**：根节点只注册了原生冒泡监听器。捕获阶段的实现是把 `collectListeners` 收集到的列表**反转**（目标→根 变成 根→目标），在同一个 dispatchEvent 中先执行反转后的（捕获），再执行正常顺序的（冒泡）。

**React 17**：根节点同时注册了原生捕获和原生冒泡两个监听器，分别在原生捕获/冒泡阶段触发，各自 collect 并执行对应阶段的 handler——语义更接近原生 DOM 事件模型。

```jsx
<div onClickCapture={() => console.log('捕获')}>
  <button onClick={() => console.log('冒泡')}>
    Click
  </button>
</div>
// 两个版本都输出：捕获 → 冒泡
// 但底层实现机制不同（16靠反转数组，17靠两个独立监听器）
```

### 5.5 事件池（Event Pooling）—— React 16 的陷阱

React 16 为节省内存**复用事件对象**，回调执行后清空所有属性：

```jsx
// React 16：必须手动 e.persist()
function handleClick(e) {
  e.persist(); // 不调 → 异步访问全空
  setTimeout(() => console.log(e.target), 1000);
}

// React 17+：事件池已移除，直接访问
function handleClick(e) {
  setTimeout(() => console.log(e.target), 1000); // 正常工作
}
```

### 5.6 Portal 中的事件冒泡

Portal 把 DOM 渲染到父组件之外，但**事件冒泡仍然按 React 组件树**（Fiber 的 `return` 链），不是 DOM 的 `parentNode` 链：

```jsx
<div onClick={() => console.log('父组件收到冒泡')}>
  {ReactDOM.createPortal(
    <button onClick={() => console.log('Portal 内按钮')}>Click</button>,
    document.body  // DOM 上在 <body> 下
  )}
</div>

// 点击按钮：
// 1. Portal 内按钮
// 2. 父组件收到冒泡   ← 虽然 DOM 不在 <div> 下，Fiber 树中仍在
```

**原因**：collectListeners 走的是 Fiber 的 `return` 链。Portal 的 Fiber parent 仍是父组件，与 DOM 位置无关。

---

## 六、其他重要 Feature

### Portals（传送门）

```jsx
ReactDOM.createPortal(children, domNode);
// 渲染到 DOM 树外，但事件冒泡走 React 树（见 5.6）
```

### Fragments

```jsx
<>...</> 或 <React.Fragment>...</React.Fragment>
// 不产生额外 DOM 节点，支持 key 属性
```

### Strict Mode

```jsx
<React.StrictMode>
  <App />
</React.StrictMode>
// 检测：不安全生命周期、遗留 ref API、意外的副作用
```

### SSR 基础（ReactDOM.hydrate）

```jsx
ReactDOM.hydrate(<App />, document.getElementById('root'));
// 在已有服务端渲染标记的 DOM 上附加事件，而非重新创建
```

---

## 面试要点

| 问题 | 核心回答 |
|------|---------|
| Fiber 解决了什么？ | 同步渲染阻塞主线程 → 异步可中断渲染 |
| Hooks 为什么不能条件调用？ | React 靠调用顺序匹配 state 链表 |
| useEffect vs useLayoutEffect？ | 时序：Render → Commit(Layout子阶段) → 浏览器Layout/Paint → 微任务。useLayoutEffect 在 Commit Layout 子阶段同步执行（绘前），useEffect 在浏览器绘制后微任务执行（绘后）。测 DOM 防闪烁用 Layout，数据请求/订阅用 Effect |
| Error Boundary 能捕获什么？ | 能捕获：React 同步渲染调用栈内的错误（render/生命周期/构造函数）。不能：事件处理器、异步代码、SSR、自身错误。核心判断：是否在 React 递归调和调用栈内 |
| React 16 vs 17 事件委托差异？ | 委托位置：document → #root。三个影响：①执行顺序——React 16 原生事件永远先于 React 事件，React 17 中 React 捕获最先执行、React 冒泡最后执行、原生事件在中间；②stopPropagation 语义——React 16 中在原生捕获阶段 stopPropagation 会彻底"关掉"React 事件系统（事件到不了 document），React 17 中只能阻止冒泡阶段的 React handler（捕获阶段已过 #root）；③微前端——各版本委托到自己的 root，互不干扰 |
| 合成事件是什么？ | React 封装的跨浏览器事件系统。三个支柱：合成事件（SyntheticEvent 统一 API）、事件委托（全部绑到 document/root）、Fiber 树冒泡模拟（collectListeners 沿 return 链收集 handler） |
| Portal 事件冒泡？ | Portal 的 DOM 在父组件外，但事件冒泡按 React 组件树（Fiber 的 return 链）走。collectListeners 不看 DOM parentNode |
| React 16 事件池陷阱？ | 事件对象被复用，异步访问必须 e.persist()。React 17 已移除 |
| why useCallback？ | 配合 React.memo 避免子组件不必要渲染 |
