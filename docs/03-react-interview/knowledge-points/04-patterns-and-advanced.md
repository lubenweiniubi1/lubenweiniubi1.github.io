# React 设计模式与高级概念

> Error Boundaries / HOC / Render Props / Portals / Context / 受控与非受控 / 代码分割

---

## 一、Error Boundaries

### 1.1 核心机制

React 16 推出的声明式错误处理。利用类组件的两个生命周期：

| API | 调用时机 | 用途 |
|-----|---------|------|
| `getDerivedStateFromError` | Render 阶段 | 更新 state → 渲染 fallback UI（纯函数，不能有副作用） |
| `componentDidCatch` | Commit 阶段 | 副作用：打日志、上报监控 |

### 1.2 能捕获 / 不能捕获

**能捕获**：render() 中的错误、生命周期方法中的错误、构造函数中的错误

**不能捕获**：
- ❌ 事件处理器（在 React 渲染流程之外）
- ❌ 异步代码（setTimeout/Promise）
- ❌ SSR 中的错误
- ❌ Error Boundary 自身的错误

**判断标准**：错误是否发生在 React 的同步渲染调用栈内？

### 1.3 为什么 try-catch 不能替代？

JSX `<ChildComponent />` 不是立即执行，只是 `React.createElement`。真正渲染在 React 内部递归调和过程中，try-catch 包不住。

### 1.4 异步错误转渲染错误的技巧

```jsx
function useAsyncError() {
  const [, setError] = useState();
  return (error) => setError(() => { throw error; });
  // 在状态更新函数中 throw → React 交给 Error Boundary
}
```

### 1.5 放置策略

颗粒化放置——一个 Error Boundary 保护一个功能区域，Header 挂了不影响 Content：

```jsx
<ErrorBoundary fallback={<SlimHeader />}><Header /></ErrorBoundary>
<ErrorBoundary fallback={<ErrorContent />}><Content /></ErrorBoundary>
<ErrorBoundary fallback={<p>Sidebar error</p>}><Sidebar /></ErrorBoundary>
```

### 1.6 为什么必须是类组件？

`componentDidCatch` 和 `getDerivedStateFromError` 两个生命周期目前只有类组件有。截止 React 19，Hooks 没有等价 API。
```

---

## 二、HOC（高阶组件）

### 2.1 定义

一个函数，接收组件，返回新组件。用于复用组件逻辑。

```jsx
const EnhancedComponent = withAuth(OriginalComponent);
```

### 2.2 常见场景

- 权限控制 (`withAuth`)
- 数据加载 (`withData`)
- 日志埋点 (`withLogging`)
- Redux 的 `connect` / React Router 的 `withRouter`

### 2.3 问题

- **包装地狱**：多层嵌套 `withA(withB(withC(Comp)))`
- **Props 覆盖**：同名 prop 被 HOC 覆盖
- **Ref 不传递**：需要 `forwardRef`
- **静态方法丢失**：需用 `hoist-non-react-statics`

> **现代实践**：优先用自定义 Hooks 替代 HOC。HOC 只在需要包装整个组件或集成旧库时使用。

---

## 三、Render Props

### 3.1 定义

通过值为函数的 prop 来告诉组件渲染什么：

```jsx
<Mouse>
  {({ x, y }) => <Cat position={{ x, y }} />}
</Mouse>
```

### 3.2 对比

| | HOC | Render Props | Hooks |
|---|---|---|---|
| 嵌套 | 包装地狱 | 回调嵌套 | ✅ 无嵌套 |
| 适用 | 类/函数组件 | 类/函数组件 | 仅函数组件 |
| Props 冲突 | 可能 | 较少 | ✅ 无 |

> **现代实践**：新项目优先用 Hooks。Render Props 在集成某些库（React Router、Downshift）时仍然有用。

---

## 四、Portals

```jsx
ReactDOM.createPortal(children, domNode);
```

- 渲染到 DOM 树外，但**事件冒泡仍按 React 组件树**（走 Fiber 的 return 链）
- 典型场景：Modal、Tooltip、Dropdown

---

## 五、Context

### 5.1 问题

Context 值变化时，**所有订阅了该 Context 的组件都会重新渲染**，即使组件只使用了 Context 中的部分字段。`React.memo` 无法阻止。

### 5.2 缓解方案

- 拆分 Context（将高频变化的值和低频变化的值分开）
- 使用第三方库（Zustand 等）做更细粒度的订阅

### 5.3 React 19 简化

```jsx
// React 18
<ThemeContext.Provider value={theme}><App /></ThemeContext.Provider>

// React 19
<ThemeContext value={theme}><App /></ThemeContext>
// 不再需要 .Provider
```

---

## 六、受控组件 vs 非受控组件

| 特性 | 受控 | 非受控 |
|------|------|--------|
| 数据来源 | React State | DOM |
| 值获取 | state | ref |
| 实时验证 | ✅ | ❌ |
| 文件上传 | 困难 | ✅ 天然 |

---

## 七、代码分割（Code Splitting）

```jsx
const LazyComp = React.lazy(() => import('./HeavyComp'));

<Suspense fallback={<Skeleton />}>
  <LazyComp />
</Suspense>
```

- 组件级懒加载，减少首屏 bundle
- 必须放在模块顶层定义（不能在 render 内）
- 仅支持 default export
- 加载完成后的行为和普通组件完全一致

---

## 八、类组件 vs 函数组件

| 特性 | 类组件 | 函数组件 |
|------|--------|---------|
| State | `this.state` + `setState` | `useState` |
| 生命周期 | 多个生命周期方法 | `useEffect`/`useLayoutEffect` |
| 逻辑复用 | HOC / Render Props | 自定义 Hooks |
| 实例 | 有 `this` | 无 |
| 性能 | 默认不跳过 | `Object.is` 跳过相同值 |
| 趋势 | 维护为主 | 主流 |

---

## 九、React.memo / PureComponent / shouldComponentUpdate

```jsx
// 类组件
class Comp extends React.PureComponent { }  // 自动浅比较 props 和 state

// 函数组件
const Comp = React.memo(({ data }) => <div>{data}</div>);
// 可传入自定义比较函数：React.memo(Comp, (prev, next) => prev.id === next.id)
```

**浅比较陷阱**：每次渲染传入新对象/函数 → 浅比较判定"变化" → 优化失效。
