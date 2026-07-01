# React 核心深度面试题

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

---

## 八、Redux / Redux Toolkit（高频必问）

### Q15: Redux 三大原则和核心概念？

**三大原则：**

| 原则 | 说明 |
|------|------|
| Single Source of Truth | 整个应用状态存储在唯一一个 Store 的 Object Tree 中 |
| State is Read-only | 不能直接修改 state，只能通过 dispatch action 触发变更 |
| Changes via Pure Functions | Reducer 必须是纯函数，输入相同输出相同，无副作用 |

**核心概念：**

```
View ──dispatch(action)──→ Store ──执行 reducer──→ New State ──通知 View 更新
                                │
                         Middleware (处理异步/日志等)
```

- **Store**：保存状态树的容器，`createStore` / `configureStore` 创建
- **Action**：描述"发生了什么"的普通对象，必须有 `type` 字段
- **Reducer**：纯函数 `(prevState, action) => newState`
- **Dispatch**：触发状态更新的唯一方式
- **Middleware**：`dispatch` 的拦截器，链式处理

### Q16: Redux 中间件原理？手写一个 logger 中间件？

**中间件本质：**

```
正常流程：    action → dispatch → reducer → store
加入中间件： action → middleware1 → middleware2 → dispatch → reducer → store
```

Redux 中间件是一个嵌套的三层函数的柯里化结构：

```jsx
// 中间件签名：store => next => action => { ... }
// - store: 包含 getState 和 dispatch
// - next: 下一个中间件的 dispatch（或原始的 store.dispatch）
// - action: 当前被派发的 action

// 手写 logger 中间件
const loggerMiddleware = (store) => (next) => (action) => {
  console.group(`Action: ${action.type}`);
  console.log('prev state:', store.getState());
  console.log('action:', action);
  const result = next(action); // 调用下一个中间件或原始 dispatch
  console.log('next state:', store.getState());
  console.groupEnd();
  return result;
};

// 使用
import { createStore, applyMiddleware } from 'redux';
const store = createStore(reducer, applyMiddleware(loggerMiddleware));
```

**核心机制**：`applyMiddleware` 将中间件链组合成洋葱模型，每个中间件控制 action 的流转方向，可以在 `next(action)` 前后进行操作，也可以不调用 `next` 拦截 action。

### Q17: Redux Toolkit 相比传统 Redux 解决了什么问题？

| 问题 | 传统 Redux | Redux Toolkit |
|------|-----------|---------------|
| 样板代码 | Action Types + Action Creators + Reducer 分散在多个文件 | `createSlice` 自动生成 action 和 reducer，一个文件搞定 |
| 不可变更新 | 手动展开对象（`...spread` / `Object.assign`） | Immer 内置，可"直接修改"state（`state.count += 1`） |
| 异步处理 | 单独配置 redux-thunk / redux-saga，手动处理状态 | `createAsyncThunk` 一步完成，内建 pending/fulfilled/rejected |
| Store 配置 | 手动组合 enhancer、middleware、devtools | `configureStore` 开箱即用（middleware + devtools 已集成） |
| 数据获取 | 手动管理缓存、loading、error 状态 | RTK Query 全自动管理 |

```jsx
// RTK 示例：一个 slice 搞定 action + reducer
import { createSlice } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },           // 直接修改！
    add: (state, action) => { state.value += action.payload; },
  },
});

export const { increment, add } = counterSlice.actions;
export default counterSlice.reducer;
```

### Q18: RTK Query 的原理和优势？

**核心原理**：RTK Query 封装了数据获取和缓存逻辑，基于 Redux 的 middleware 层拦截查询请求，自动管理缓存生命周期。

```jsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['Post'],
  endpoints: (builder) => ({
    getPosts: builder.query({
      query: () => '/posts',
      providesTags: ['Post'],               // 提供标签
    }),
    addPost: builder.mutation({
      query: (body) => ({ url: '/posts', method: 'POST', body }),
      invalidatesTags: ['Post'],            // 使缓存失效，自动重请求
    }),
  }),
});
```

**优势：**

| 能力 | 说明 |
|------|------|
| 自动缓存管理 | 请求结果自动缓存，相同 queryKey 复用 |
| Tag 失效策略 | `providesTags` + `invalidatesTags` 自动联动 |
| 请求去重 | 多个组件请求相同 key，只发一次请求 |
| 乐观更新 | Mutation 时先更新 UI，失败再回滚 |
| 自动生成 Hooks | `${endpointName}.useQuery` / `.useMutation` |

**vs React Query (TanStack Query)：**

| 维度 | RTK Query | TanStack Query |
|------|-----------|----------------|
| 状态管理 | 基于 Redux Store | 独立缓存管理器 |
| 学习成本 | 需要先懂 Redux | 独立库，零耦合 |
| 灵活性 | 强约定 | 高自定义 |
| 配套生态 | Redux 全家桶 | 框架无关（React/Vue/Svelte） |

### Q19: Redux vs Zustand vs Context + useReducer 怎么选？

| 维度 | Redux + RTK | Zustand | Context + useReducer |
|------|------------|---------|---------------------|
| Bundle Size | ~12KB (RTK) | ~1KB | 0（内置） |
| API 复杂度 | 中等（有约定） | 极简 | 简单 |
| Middleware 支持 | 强大 | 有限 | 无 |
| DevTools | 原生支持 | 内置支持 | 需手动 |
| Re-render 粒度 | 细粒度（useSelector 比较） | 细粒度（selector 比较） | 粗粒度（所有 Consumer 重渲染） |
| 异步处理 | createAsyncThunk | 自定义 | 手动 |
| 适用规模 | 大型应用 | 中小型应用 | 极小/原型 |
| SSR 支持 | 完善 | 良好 | 视情况 |

**选择建议：**
- **小项目 / 原型**：Context + useReducer
- **中型项目 / 追求轻量**：Zustand
- **大型项目 / 团队规范**：Redux + RTK

### Q20: React Query (TanStack Query) 的核心概念？

```jsx
import { useQuery, useMutation, QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,   // 数据新鲜期：5分钟内不重新请求
      cacheTime: 30 * 60 * 1000,   // 缓存保留时间：30分钟
      retry: 3,                     // 失败重试次数
      refetchOnWindowFocus: true,   // 窗口聚焦时自动重新请求
    },
  },
});
```

**核心概念：**

| 概念 | 说明 |
|------|------|
| `staleTime` | 数据多久后视为"过期"。过期后再次读取会触发后台刷新 |
| `cacheTime` | 不使用的缓存数据保留多久后回收 |
| `queryKey` | 唯一标识查询的 key 数组，用于缓存匹配和失效 |
| `refetchOnWindowFocus` | 用户切回页面时自动刷新，保证数据实时性 |
| `retry` | 请求失败自动重试次数 |
| `useMutation` | 增删改操作，配合 `onSuccess` 手动失效或乐观更新 |

```jsx
// 乐观更新示例
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries(['todos']);
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo]);
    return { previous }; // 如果失败，回滚到这个值
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previous);
  },
});
```

---

## 九、React 合成事件与事件系统

### Q21: React 合成事件（SyntheticEvent）是什么？为什么要有？

**SyntheticEvent** 是 React 跨浏览器原生事件的一套封装，行为与原生事件一致但抹平了差异。

**为什么要有：**

1. **抹平浏览器差异**：统一 `event.preventDefault()`、`event.stopPropagation()` 等行为
2. **事件委托机制**：不把事件绑定到每个 DOM 节点，而是委托到 root 节点（React 17 前为 document）统一管理
3. **性能优化**：减少内存占用（少注册事件监听器），统一销毁管理
4. **异步池化（React 17 前）**：事件对象复用池，`e.persist()` 可取出事件对象避免回收

```jsx
// React 17 前：事件对象复用池，异步访问需 persist
function handleClick(e) {
  console.log(e.target); // 同步可用
  setTimeout(() => {
    console.log(e.target); // ❌ React 17 前已被回收
  }, 100);
}

// React 17+：不再使用事件池
function handleClick(e) {
  console.log(e.target);
  setTimeout(() => {
    console.log(e.target); // ✅ 可以正常访问
  }, 100);
}
```

### Q22: React 17 事件委托从 document 改到 root 有什么影响？

**变更内容：**

```
React 16：事件委托到 document
React 17+：事件委托到 React 挂载的 root 节点（#root）
```

**影响：**

- **多 React 版本共存**：React 17+ 页面内有多个 React 版本实例时，事件互不干扰，各自在其 root 节点上拦截
- **`e.stopPropagation()` 行为**：16 版本中，`e.stopPropagation()` 阻止的是合成事件冒泡到 document；17 版本阻止的是向 root 节点的冒泡。如果在 root 之外绑定了原生事件，React 17 无法阻止
- **iframe 场景**：React 16 的 document 事件会在 iframe 外意外触发，17 的 root 级委托避免了这个问题

```jsx
// React 16：react 外部的 document 级原生事件也会被 react 合成事件影响
document.addEventListener('click', () => {}); // 可能被 react 事件干扰

// React 17：root 级委托，与 document 事件隔离开
const root = document.getElementById('root');
root.addEventListener('click', () => {}); // react 事件在 root 管理
```

### Q23: React 中如何阻止事件冒泡？

```jsx
// ✅ 推荐：使用合成事件的 stopPropagation
function handleClick(e) {
  e.stopPropagation(); // 阻止合成事件冒泡
}

// ❌ 谨慎使用：在 react 中调用原生 stopPropagation
function handleClick(e) {
  e.nativeEvent.stopImmediatePropagation(); // 会阻止 root 上的所有事件
}

// 为什么不直接阻止原生事件？
// React 通过委托处理事件，调用了 e.nativeEvent.stopPropagation() 后，
// React 无法再捕获该事件，可能导致意想不到的行为
```

**注意**：如果混合使用 React 合成事件和原生 DOM 事件监听器，`e.stopPropagation()` 只能阻止合成事件的传播，不能阻止 root 节点上绑定的原生事件监听器。反之也一样。

---

## 十、组件设计模式与高级 API

### Q24: HOC、Render Props、自定义 Hook 三种逻辑复用方案对比？

| 维度 | HOC | Render Props | 自定义 Hook |
|------|-----|-------------|-------------|
| 本质 | 高阶组件包装 | Props 传递渲染函数 | 函数封装 |
| 嵌套问题 | 多层 HOC 嵌套难以调试（wrapper hell） | 嵌套层级深（callback hell） | 无嵌套，扁平结构 |
| 命名冲突 | 同名 props 会覆盖 | 无冲突 | 无冲突（解构赋值） |
| 静态属性 | 需手动 hoist 静态方法 | 无影响 | 无影响 |
| 灵活度 | 中等 | 高 | 最高 |
| 可测试性 | 较复杂 | 中等 | 简单 |
| 适用场景 | 权限校验、日志埋点 | 鼠标位置追踪、响应式监听 | 状态逻辑封装、副作用管理 |

```jsx
// HOC 模式
function withLogging(WrappedComponent) {
  return function WithLogging(props) {
    useEffect(() => { console.log('mounted'); }, []);
    return <WrappedComponent {...props} />;
  };
}

// Render Props 模式
function MouseTracker({ render }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => { /* mousemove handler */ }, []);
  return render(pos);
}

// ✅ 自定义 Hook（推荐）
function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  useEffect(() => { /* mousemove handler */ }, []);
  return pos;
}
```

**推荐优先级：自定义 Hook > HOC > Render Props**

### Q25: Error Boundary 的原理和使用限制？

**原理**：Error Boundary 是类组件通过实现 `getDerivedStateFromError` 或 `componentDidCatch` 来捕获子树渲染阶段错误的机制。

```jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };   // 更新状态触发 fallback UI
  }

  componentDidCatch(error, errorInfo) {
    console.error(error, errorInfo);    // 记录错误日志
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <h1>Something went wrong</h1>;
    }
    return this.props.children;
  }
}
```

**使用限制（不能捕获的场景）：**

```
能捕获：                不能捕获：
├── 渲染阶段错误        ├── 事件处理回调（onClick 等）
├── 生命周期方法错误    ├── 异步代码（setTimeout/Promise）
├── 构造函数中错误      ├── 服务端渲染错误
└── 子组件树中错误      ├── Error Boundary 自身抛出的错误
                       └── 同构渲染中的 hydrate 不匹配
```

**配合 react-error-boundary 库**（函数组件友好）：

```jsx
import { ErrorBoundary } from 'react-error-boundary';

function Fallback({ error, resetErrorBoundary }) {
  return (
    <div>
      <p>出错了: {error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={Fallback} onReset={() => {}}>
  <MyComponent />
</ErrorBoundary>
```

### Q26: useLayoutEffect vs useEffect 的区别？使用场景？

**执行时机对比：**

```
render → DOM 更新 → useLayoutEffect（同步） → 浏览器 paint → useEffect（异步）
```

| 维度 | useLayoutEffect | useEffect |
|------|----------------|-----------|
| 执行时机 | DOM 更新后、浏览器 paint 前同步执行 | paint 后异步执行 |
| 阻塞 | 阻塞浏览器绘制 | 不阻塞绘制 |
| 触发时机 | 类似 class 的 componentDidMount / componentDidUpdate | 延迟执行 |
| 打印时机 | paint 前已执行完 | paint 后执行 |

**使用场景：**

```jsx
// ✅ useLayoutEffect 适用：需要读取布局、避免闪烁
function Tooltip({ targetRect }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const { width } = ref.current.getBoundingClientRect();
    // 根据 tooltip 宽度调整位置，避免第一次渲染后闪烁
    ref.current.style.left = targetRect.left - width / 2 + 'px';
  }, [targetRect]);
  return <div ref={ref}>Tooltip</div>;
}

// ✅ useEffect 适用：大多数副作用场景
useEffect(() => {
  fetchData().then(setData);  // 数据获取不阻塞 paint
}, []);
```

**经验法则**：优先用 `useEffect`，只有发现视觉闪烁或需要同步读取 DOM 布局时才用 `useLayoutEffect`。

### Q27: forwardRef + useImperativeHandle 的使用场景？

**场景**：父组件需要直接调用子组件暴露的方法，而不是通过 props 驱动。

```jsx
// 子组件
const CustomInput = forwardRef((props, ref) => {
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    scrollTo: () => inputRef.current.scrollIntoView({ behavior: 'smooth' }),
    reset: () => { inputRef.current.value = ''; },
  }));

  return <input ref={inputRef} {...props} />;
});

// 父组件
function Parent() {
  const inputRef = useRef(null);

  const handleFocus = () => inputRef.current.focus();  // 调用子组件方法

  return (
    <>
      <CustomInput ref={inputRef} />
      <button onClick={handleFocus}>聚焦输入框</button>
      <button onClick={() => inputRef.current.reset()}>重置</button>
    </>
  );
}
```

**适用场景：**
- 焦点管理（input 聚焦）
- 滚动控制（scrollIntoView）
- 媒体播放（video/audio 控制 play/pause）
- 命令式动画（触发动画方法）
- 第三方库集成（调用 DOM 方法）

### Q28: Portal 的使用场景？

**Portal** 允许将子节点渲染到父组件之外的 DOM 节点，解决 **z-index 层级和 overflow hidden** 问题。

```jsx
import { createPortal } from 'react-dom';

function Modal({ children, open }) {
  if (!open) return null;
  return createPortal(
    <div className="modal-overlay">
      <div className="modal-content">{children}</div>
    </div>,
    document.body  // 渲染到 body 下
  );
}
```

**常见场景：**
- **Modal / Dialog**：避免被父容器 `overflow: hidden` 裁剪
- **Tooltip / Popover**：避免 z-index 层级冲突
- **Dropdown 菜单**：溢出父级容器边界时
- **通知 / Toast**：全局展示，脱离组件层级

```jsx
// 对比：不用 Portal → modal 被父层 overflow 裁剪
<div style={{ overflow: 'hidden', position: 'relative' }}>
  <Modal /> {/* modal 内容被裁剪 */}
</div>

// 用 Portal → modal 渲染到 body，完全不受父层限制
document.body
  └── <div id="modal-root">
        └── <Modal />  {/* 不被父组件裁剪 */}
```

---

## 十一、setState 深入

### Q29: setState 是同步还是异步？什么情况下是同步？

**结论（React 18）：全部批处理，都是"异步"的。** 需要同步更新可以用 `flushSync`。

**各版本对比：**

| 场景 | React 16/17 | React 18 |
|------|-------------|----------|
| 合成事件（onClick） | 异步（批处理） | 异步（批处理） |
| 生命周期 | 异步（批处理） | 异步（批处理） |
| setTimeout | 同步（不批处理） | 异步（自动批处理） |
| 原生事件（addEventListener） | 同步（不批处理） | 异步（自动批处理） |
| Promise / async 回调 | 同步（不批处理） | 异步（自动批处理） |

```jsx
// React 18：所有场景都批处理
const handleClick = () => {
  setCount(1);
  setFlag(true);
  setName('hello');
  // 只触发一次渲染
};

// React 16/17：setTimeout 中不批处理
setTimeout(() => {
  setCount(1);  // 触发一次渲染
  setFlag(true); // 再触发一次渲染
}, 100);

// ✅ 强制同步更新
import { flushSync } from 'react-dom';
flushSync(() => {
  setCount(1);  // 立刻渲染
});
```

### Q30: setState 传入函数和传入对象的区别？

```jsx
const [count, setCount] = useState(0);

// 对象形式（直接传值）
setCount(count + 1);
setCount(count + 1);
setCount(count + 1);
// 结果：count = 1（三次都用相同的 0+1）

// 函数形式（传入 updater）
setCount(prev => prev + 1);
setCount(prev => prev + 1);
setCount(prev => prev + 1);
// 结果：count = 3（React 保证依次执行）
```

| 维度 | 对象形式 `setState(newValue)` | 函数形式 `setState(prev => ...)` |
|------|------------------------------|----------------------------------|
| 依赖 | 依赖外部变量（有闭包陷阱风险） | 基于上一个 state，无闭包问题 |
| 批量调用 | 多次调用只有最后一次生效 | 按顺序依次应用，每次拿最新值 |
| 合并 | 浅合并（class 组件） | 不合并，替换旧值 |
| 优先使用 | state 值与前值无关时 | state 值依赖前值时 |

**经验法则**：只要新 state 依赖旧 state（如 +1、toggle），就用函数形式。

---

## 十二、Context 与性能

### Q31: Context 值变化时渲染范围是什么？如何避免不必要的渲染？

**渲染范围**：所有消费该 Context 的组件（即调用 `useContext` 或 `Consumer` 的组件）都会重新渲染，无论它是否只使用了变化的部分。

```jsx
const AppContext = createContext();

function App() {
  const [user, setUser] = useState({ name: 'Alice', age: 25 });
  const [theme, setTheme] = useState('light');

  return (
    // ❌ 问题：user 变化时，只消费 theme 的组件也会重渲染
    <AppContext.Provider value={{ user, theme }}>
      <ThemeConsumer />  {/* user 变化时也重渲染 */}
      <UserProfile />    {/* 需要 user */}
    </AppContext.Provider>
  );
}
```

**优化方案：**

**1. 拆分 Context**：按变化频率拆分

```jsx
const UserContext = createContext();
const ThemeContext = createContext();

// User 频繁变化，Theme 不常变
<ThemeContext.Provider value={theme}>
  <UserContext.Provider value={user}>
    <App />
  </UserContext.Provider>
</ThemeContext.Provider>
```

**2. useMemo 包裹 value**

```jsx
// value 每次重新创建都会导致所有 consumer 重渲染
const value = useMemo(() => ({ user, theme }), [user, theme]);
<AppContext.Provider value={value}>
```

**3. 组件提升（children 模式）**

```jsx
// 把不变的部分通过 children 传递，避免 Provider 重渲染时重新创建
function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div>
      <Sidebar open={sidebarOpen} />  {/* 仅 Sidebar 重渲染 */}
      {children}  {/* 不变 */}
    </div>
  );
}
```

### Q32: Context + useReducer 实现轻量级状态管理？

这是 Redux 的"平替"方案，适合中小型应用。

```jsx
// 1. 定义状态和 reducer
const initialState = { count: 0, user: null, loading: false };

function appReducer(state, action) {
  switch (action.type) {
    case 'INCREMENT':
      return { ...state, count: state.count + 1 };
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// 2. 创建 Context
const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

// 3. 创建 Provider 组件
function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

// 4. 使用
function Counter() {
  const state = useContext(AppContext);
  const dispatch = useContext(AppDispatchContext);

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
    </div>
  );
}

// 5. 包装根组件
function Root() {
  return (
    <AppProvider>
      <Counter />
    </AppProvider>
  );
}
```

**优点**：无外部依赖、代码简洁、reducer 纯函数可测试。
**缺点**：没有中间件、没有 DevTools、Context value 变化导致所有 consumer 重渲染（需要结合拆分优化）。

---

## 十三、React 调度与优先级

### Q33: Lane 模型是什么？与 16 的 expirationTime 相比有什么优势？

**Lane 模型**（React 17+）使用位掩码（bitmask）表示优先级，每个 Lane 是一个二进制位。

```
// Lane 示例（简化）
export const NoLane = 0b0000000000000000000000000000000;
export const SyncLane = 0b0000000000000000000000000000001;
export const InputContinuousLane = 0b0000000000000000000000000000010;
export const DefaultLane = 0b0000000000000000000000000000100;
export const TransitionLane1 = 0b0000000000000000000000000001000;
export const TransitionLane2 = 0b0000000000000000000000000010000;
// ... 共 31 个 Lane
```

| 维度 | expirationTime（React 16） | Lane 模型（React 17+） |
|------|--------------------------|----------------------|
| 表示方式 | 单一时间戳数值 | 位掩码（多个位同时表示） |
| 多优先级 | 一个任务一个优先级 | 一个任务可以是多个 Lane（任务批处理） |
| 优先级抢占 | 高优任务插入后需重新计算 | 位运算直接比较，更高效 |
| 批量处理 | 需要额外机制 | 多个 Lane 可以自然合并 |
| 细粒度 | 有限 | 31 个 Lane + 子 Lane，粒度更细 |

**优势总结**：
- 位运算效率高（`&` / `|` / `~`）
- 一个任务可以同时属于多个 Lane（支持 Suspense 的"降级"渲染）
- 更自然的批处理：多个更新可以合并到一个 Lane 批次中

### Q34: React 18 时间切片（Time Slicing）的原理？

**为什么需要时间切片？**

React 16 的 Fiber 架构让渲染"可中断"，但如果没有时间切片，中断后可能很快又开始，仍然会导致主线程长时间被占用。

**时间切片核心流程：**

```
┌─────────────────────────────────────────────────┐
│               一帧 (16.6ms)                        │
├──────────┬──────────────┬────────────────────────┤
│ 用户输入  │    React 工作  │    空闲/其他            │
│ (几ms)   │   (5ms 上限)  │                        │
└──────────┴──────────────┴────────────────────────┘
       ↑              ↑                        ↑
   输入响应        超出时间预算             让出主线程
                  暂停 Fiber 工作          处理浏览器绘制
                                          等待下一个空闲帧
```

**具体实现：**

```jsx
// 简化版调度逻辑
function workLoop(deadline) {
  let shouldYield = false;

  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    // 检查是否超时：deadline.timeRemaining() < 5ms
    shouldYield = deadline.timeRemaining() < 5;
  }

  if (nextUnitOfWork) {
    // 还有未完成的工作，请求下一次空闲回调
    requestIdleCallback(workLoop);
    // 或者：MessageChannel 实现（实际实现）
  }
}

requestIdleCallback(workLoop);
```

**实际实现细节：**

- React 没有直接使用 `requestIdleCallback`（浏览器支持度差、触发频率低）
- 使用 **MessageChannel** 模拟 `requestIdleCallback`：
  - `postMessage` 的回调在宏任务队列中执行
  - 可以更频繁地检查时间预算
  - 兼容性更好

```jsx
// MessageChannel 模拟时间切片
const channel = new MessageChannel();
const port = channel.port2;

channel.port1.onmessage = () => {
  // 执行工作循环，5ms 后让出
  const now = performance.now();
  while (performance.now() - now < 5 && nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if (nextUnitOfWork) port.postMessage(null); // 继续调度
};

port.postMessage(null); // 启动循环
```

**总结**：时间切片保证 React 不会一次性占用主线程超过 5ms，从而在渲染大型组件树时仍能及时响应用户输入，实现"并发渲染"。
