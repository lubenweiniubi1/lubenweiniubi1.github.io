# React 面试题全集（按版本编排）

> 覆盖 React 16 → React 19。每题按「是什么 → 为什么 → 有啥用」回答。深层知识点见 `knowledge-points/`。

---

## 目录

- [React 16](#react-16) — Fiber · Hooks · Error Boundary · 事件系统 · 设计模式
- [React 17](#react-17) — 事件委托变更 · JSX Transform · 微前端
- [React 18](#react-18) — Concurrent · Batching · Transitions · SSR Streaming
- [React 19](#react-19) — RSC · Server Actions · use() · useOptimistic

---

# React 16

## Fiber 架构

### Q1：React 16 为什么要重写为 Fiber 架构？

- **是什么**：Fiber 是 React 16 全新内核，把渲染工作拆成一个个可中断的"工作单元"，浏览器每帧空闲时执行一部分。
- **为什么**：React 15 的 Stack Reconciler 是同步递归的——一旦开始渲染必须一口气完成，大组件树会长期占用主线程（>16ms），导致动画掉帧、用户输入无响应。
- **有啥用**：渲染不再阻塞用户交互。React 可以暂停、恢复、甚至丢弃渲染任务，为 React 18 的并发模式打下基础。

> 📎 [Fiber 与渲染机制](knowledge-points/02-fiber-and-rendering.md)

### Q2：Fiber 树为什么用链表结构（child/sibling/return）？

- **是什么**：每个 Fiber 节点通过 `child`（第一个子节点）、`sibling`（下一个兄弟）、`return`（父节点）构成链表树，而非传统的递归树。
- **为什么**：链表在任意节点可以"暂停"——遍历到一半让出主线程，下次回来通过三个指针直接继续。数组需要用额外变量记录遍历位置。
- **有啥用**：这是可中断渲染的数据结构基础，没有它 Fiber 的"异步可中断"无从实现。

### Q3：什么是双缓冲（Double Buffering）？

- **是什么**：两棵 Fiber 树——`current`（当前屏幕显示）和 `workInProgress`（正在内存中构建），通过 `alternate` 互相指向，Commit 完成后 wip 切换为新 current。
- **为什么**：构建新树时可以随时中断丢弃重来，不影响当前屏幕显示。同时旧树为新树提供"上一次长什么样"的参照，用于 diff。
- **有啥用**：保证渲染过程对用户无感——构建中的树永远不会被用户看到。

### Q4：Render Phase 和 Commit Phase 的区别？

- **是什么**：Render 阶段构建 Fiber 树、diff 计算、打 effectTag 标记；Commit 阶段按标记统一操作 DOM 并执行副作用。
- **为什么**：Render 可中断——如果每个 fiber 立刻改 DOM，中断时用户会看到残缺的 UI。Commit 必须一口气完成，保证 DOM 状态一致。
- **有啥用**：Render 阶段可以随时暂停让出主线程；Commit 阶段保证最终渲染结果原子化。

---

## Hooks

### Q5：Hooks 为什么不能放在条件/循环中？

- **是什么**：Hooks 通过**调用顺序**和 Fiber 的 `memoizedState` 链表索引一一对应——第 0 个 useState 对应链表第 0 个节点。
- **为什么**：React 没有通过"名称"来匹配 Hook，而是通过"第几次调用"。条件调用会打乱索引，导致后续所有 Hook 错位——不同渲染周期同一个 useState 读到的可能是另一个 Hook 的状态。
- **有啥用**：理解这个就知道为什么必须在顶层调用、为什么不能动态增删 Hooks。

> 📎 [Hooks 深入](knowledge-points/01-hooks-deep-dive.md)

### Q6：useEffect 和 useLayoutEffect 的区别？（★ 高频）

- **是什么**：两者都在 Commit 阶段触发。useLayoutEffect 在 DOM 变更后、浏览器绘制**前**同步执行；useEffect 在浏览器绘制**后**的微任务中异步执行。
- **为什么**：React 需要给"防闪烁操作"和"不涉及视觉的操作"分配不同的执行窗口——Layout 阶段可以同步修改 DOM 并合并到同一帧，浏览器没机会在中间渲染。
- **有啥用**：默认用 useEffect（数据请求、订阅、日志）。只在需要防闪烁时（DOM 测量后立即 setState、滚动位置恢复）才用 useLayoutEffect。

### Q7：useLayoutEffect 中 setState 会死循环吗？

- **是什么**：会——React 在 Layout 子阶段同步重入 render → commit 循环，直到 state 不再变化或抛出 "Maximum update depth exceeded"。
- **为什么**：useLayoutEffect 中 setState 不会像 useEffect 那样等下一个事件循环——它同步立刻重渲染。没有停止条件就会无限循环。
- **有啥用**：利用这个特性可以实现"测量 → 调整 → 再测量"的无闪烁布局校正，但必须自建终止条件（如 `if (lines < 5) setLines(lines + 1)`）。

### Q8：什么是闭包陷阱（Stale Closure）？（★）

- **是什么**：useEffect 回调在创建时捕获了当次渲染的 props/state，依赖数组不变则回调不重建，内部永远读到旧值。
- **为什么**：每次重渲染组件函数重新执行，产生全新的作用域。但 useEffect 只检查依赖数组是否变化来决定是否更新回调。旧回调活在旧作用域里，对新的 state 毫不知情。
- **有啥用**：三种解法按需使用——① 函数式更新 `setState(c => c + 1)`（React 传最新值，最优雅）② 补全依赖数组（最直接）③ useRef 存最新值（只读不触发渲染时）。

### Q9：类组件 setState 和函数组件 useState 的核心差异？

- **是什么**：setState 相同值也触发渲染 + 自动浅合并 state；useState 用 `Object.is` 比较，相同值跳过渲染 + 直接替换不合并。
- **为什么**：类组件默认 `shouldComponentUpdate` 返回 true，React 不替你做判断。useState 可以在更新入口处就拦截，性能更好。
- **有啥用**：写函数组件时记得手动展开旧 state；维护老代码时理解类组件 setState 的合并行为。

### Q10：useMemo / useCallback 什么时候该用？

- **是什么**：useMemo 缓存计算结果，useCallback 缓存函数引用。两者都通过依赖数组判断是否重新计算。
- **为什么**：传给 `React.memo` 子组件的 prop 引用每次变化都会导致子组件渲染——即使值相同。稳定引用是 memo 生效的前提。
- **有啥用**：只在两种场景用：① 配合 React.memo 的子组件需要稳定引用 ② 计算确实昂贵（大量数据 filter/sort）。不要无脑包——比较本身有开销。

### Q11：useRef 的使用场景？

- **是什么**：`ref.current` 是一个可变的容器，修改不触发渲染。
- **为什么**：React 的 state 改了就触发渲染，但有些场景需要"记住一个值但不触发渲染"——比如定时器 ID、前一个 state、DOM 节点引用。
- **有啥用**：三类：① DOM 引用 ② 保存不需要触发渲染的变量 ③ 解决闭包陷阱——useEffect 里读 `ref.current` 永远是最新值。

---

## React 事件系统

### Q12：React 的合成事件（SyntheticEvent）是什么？

- **是什么**：React 自己封装的事件系统，不对每个 DOM 绑定事件，而是全部委托到根节点。事件触发后沿 Fiber 树 `return` 链收集 handler，模拟冒泡和捕获。
- **为什么**：原生事件在各浏览器间行为不一致；每个 DOM 独立绑定事件内存开销大；React 需要在自己的渲染流程中控制事件调度。
- **有啥用**：跨浏览器行为一致、内存占用低、动态元素自动支持、为 React 18 的事件优先级调度提供了基础。

> 📎 [事件系统与调度](knowledge-points/03-events-and-scheduling.md)

### Q13：React 16 vs 17 事件委托的核心差异？（★）

- **是什么**：委托节点从 `document` 改到 `#root` 根容器。
- **为什么**：React 16 中多个 React 版本共存时全部委托到同一个 `document`，`e.stopPropagation()` 在 React 层间失效。React 17 各版本委托到自己的 root，天然隔离。
- **有啥用**：三个影响——① 执行顺序变了（16 原生全部 > React 全部；17 交替执行）② stopPropagation 语义修正（16 中在原生捕获阶段 stop 会关掉整个 React 事件系统，17 只关冒泡）③ 微前端事件隔离成为可能。

### Q14：Portal 中事件冒泡按什么规则？

- **是什么**：Portal DOM 在父组件之外，但事件冒泡沿 **Fiber 的 `return` 链**，不沿 DOM `parentNode`。
- **为什么**：collectListeners 不看 DOM 树只看 Fiber 树——Portal 的 Fiber 父节点仍是声明它的组件。
- **有啥用**：弹出层、Modal 的点击事件仍然能被声明它的父组件捕获，符合直觉。

### Q15：React 16 的事件池（Event Pooling）是什么？

- **是什么**：React 16 为节省内存复用事件对象，回调执行后清空所有属性。
- **为什么**：频繁触发的事件会产生大量事件对象，复用可以减少 GC 压力。
- **有啥用**：React 16 异步访问事件属性必须 `e.persist()`。React 17 已移除事件池，不再需要。

---

## Error Boundaries

### Q16：Error Boundary 能捕获什么？不能捕获什么？（★）

- **是什么**：React 声明式错误处理机制——组件渲染出错时，用类组件两个生命周期捕获错误，渲染 fallback UI 而非整个应用白屏。
- **为什么**：React 15 一个组件报错整个页面崩溃。Error Boundary 把错误隔离在子树内——判断标准是"错误是否发生在 React 同步渲染调用栈内？"
- **有啥用**：能捕获 render、生命周期、构造函数的错误；不能捕获事件处理器、异步代码、SSR、自身错误。

> 📎 [设计模式与高级概念](knowledge-points/04-patterns-and-advanced.md)

### Q17：为什么 try-catch 不能替代 Error Boundary？

- **是什么**：`<ChildComponent />` 只是 `React.createElement` 调用，真正渲染在 React 内部递归调和中进行。
- **为什么**：try-catch 在 JSX 外面，只能捕获 `createElement` 这层，捕获不到 React 内部渲染时的错误。
- **有啥用**：声明式渲染需要声明式的错误处理——Error Boundary 就是 React 的"try-catch for rendering"。

### Q18：为什么 Error Boundary 必须是类组件？

- **是什么**：需要 `componentDidCatch` 和 `getDerivedStateFromError` 两个生命周期方法。
- **为什么**：这两个 API 在 Hooks 中没有等价实现——React 团队尚未提供 Hook 版本。
- **有啥用**：现阶段只能用类组件写 Error Boundary，社区的 `useErrorBoundary` 本质也是包装了类组件。

### Q19：getDerivedStateFromError 和 componentDidCatch 的区别？

- **是什么**：一个在 Render 阶段（纯函数，更新 state 渲染 fallback），一个在 Commit 阶段（可副作用，上报日志）。
- **为什么**：Render 阶段不能有副作用——但错误上报本身就是副作用。React 把"管 UI"和"管日志"拆成两个 API。
- **有啥用**：前者负责"展示什么"，后者负责"记录什么"。职责清晰。

### Q20：实际使用 Error Boundary 的最佳策略？

- **是什么**：按功能区域颗粒化放置——一个 Error Boundary 只保护一个功能模块。
- **为什么**：一层包全部 = 某组件报错整个页面 fallback。颗粒化 = Header 挂了 Sidebar 照常用。
- **有啥用**：结合 `setState(() => { throw error })` 技巧——在 state 更新函数中 throw，把异步错误转回渲染流程，让 Error Boundary 统一兜底。

---

## 设计模式

### Q21：HOC（高阶组件）是什么？有什么问题？

- **是什么**：一个函数，接收组件返回新组件，用于逻辑复用。如 `const Enhanced = withAuth(RawComponent)`。
- **为什么**：Hooks 出现前，HOC 是类组件复用的主要手段。但它会嵌套（包装地狱）、覆盖同名 props、不传 ref、丢失静态方法。
- **有啥用**：新项目优先用自定义 Hooks。HOC 只在集成 Redux connect、React Router withRouter 等旧 API 时了解。

### Q22：Render Props 和 Hooks 怎么选？

- **是什么**：Render Props 通过值为函数的 prop 传递渲染逻辑；Hooks 把逻辑抽成函数在组件内调用。
- **为什么**：Render Props 仍有嵌套问题，Hooks 天然无嵌套、代码更线性。
- **有啥用**：新项目默认 Hooks。集成 React Router、Downshift 等库时了解 Render Props 即可。

### Q23：受控组件 vs 非受控组件？

- **是什么**：受控 = 表单值由 React state 驱动；非受控 = 值留在 DOM 里，通过 ref 获取。
- **为什么**：受控能实时验证、动态修改值、统一数据流。非受控省代码但失去对数据的控制。
- **有啥用**：能用受控就用受控。简单表单、文件上传（`<input type="file">` 不可受控）才用非受控。

### Q24：Context 的弊端是什么？

- **是什么**：Context 值变化 → 所有订阅组件强制重渲染，`React.memo` 拦不住。
- **为什么**：Context 的订阅机制不做字段级 diff——只要 Provider value 引用变了，消费者全量渲染。
- **有啥用**：拆分 Context（高频和低频分开）、用 Zustand 等外部库做细粒度订阅。Context 适合低频变化的全局状态（主题、语言）。

### Q25：React.lazy + Suspense 的原理和限制？

- **是什么**：`React.lazy(() => import('./Comp'))` 实现组件级代码分割，Suspense 提供加载中 fallback。
- **为什么**：动态 import 返回 Promise——React 在组件首次进入渲染树时才触发加载，加载完成前向上找最近 Suspense 显示 fallback。
- **有啥用**：减少首屏 bundle 体积。限制：必须模块顶层定义、仅支持 default export。

### Q26：React.memo 和 PureComponent 的浅比较陷阱？

- **是什么**：两者用浅比较（`Object.is` 比较顶层 key）判断是否需要渲染。
- **为什么**：父组件每次渲染传入的新对象/函数（即使内容相同）引用不同 → 浅比较判定为"变了" → memo 失效。
- **有啥用**：用 `useMemo`/`useCallback` 稳定传给 memo 子组件的引用——这是 memo 生效的前提。

---

## 类组件（维护老项目）

### Q27：React ≤17 中 setState 什么时候同步？什么时候异步？

- **是什么**：React 事件处理器和生命周期中异步批处理；setTimeout、Promise、原生 DOM 事件中同步。
- **为什么**：React 在事件处理器入口开启批处理模式，出口关闭。非 React 控制的回调（setTimeout、原生事件）在批处理范围之外。
- **有啥用**：React 18 已统一为自动批处理。维护老代码时知道这个差异就行。

### Q28：PureComponent 和 Component 的区别？

- **是什么**：Component 每次 setState 都渲染；PureComponent 内置浅比较，相同值跳过。
- **为什么**：Component 默认 `shouldComponentUpdate` 返回 true，不做任何优化。
- **有啥用**：老项目性能优化——父组件频繁更新但子组件 props 不变时，用 PureComponent 避免不必要渲染。

---

# React 17

### Q29：React 17 为什么没有新 Feature？

- **是什么**：React 17 是"换地基"的过渡版本——事件委托重构、新 JSX Transform、渐进式升级支持，为 React 18 Concurrent Mode 铺路。
- **为什么**：与其发布大版本 breaking change 让所有人改代码，不如发布一个清理版本把基础设施问题解决掉。
- **有啥用**：有 breaking changes 但绝大多数不影响应用代码。它是从 16 到 18 的"无感跳板"。

### Q30：新的 JSX Transform 改变了什么？

- **是什么**：JSX 编译产物从 `React.createElement` 改为 `import { jsx } from 'react/jsx-runtime'`。
- **为什么**：不再需要手动 `import React from 'react'`——编译器自动注入。
- **有啥用**：少写一行 import，bundle 体积微减。

### Q31：React 17 事件委托从 document 改为 root 的影响？（★）

- **是什么**：事件监听从 `document.addEventListener` 改为 `rootContainer.addEventListener`。
- **为什么**：React 16 多版本共存时全部委托到同一个 document，事件在 React 层间互相干扰。React 17 各版本委托到自己的 root 实现隔离。
- **有啥用**：① 执行顺序变了（16 原生全部先于 React；17 交替）② stopPropagation 行为修正（16 中在原生捕获 stop 会彻底关掉 React 事件系统）③ 微前端事件隔离成为可能。

### Q32：微前端和 React 17 有什么关系？

- **是什么**：事件委托到 root + 渐进式升级支持 → 多个 React 版本/实例在同一页面和平共处。
- **为什么**：每个子应用事件委托到各自的 root 节点，彼此隔离不干扰。
- **有啥用**：qiankun、micro-app、Module Federation 等方案能在 React 生态落地的技术基础。

### Q33：React 17 移除了什么？改了什么？

- **是什么**：移除事件池（不再需要 `e.persist()`）、useEffect 清理函数改异步、onFocus/onBlur 改用原生 focusin/focusout。
- **为什么**：事件池在现代 JS 引擎下收益不大反而造成困惑；清理函数异步执行加快卸载速度。
- **有啥用**：写代码更直观，性能更好，行为更接近浏览器标准。

---

# React 18

## Concurrent 基础

### Q34：React 16.8 的"时间切片"和 React 18 的"并发可中断"有什么区别？（★）

- **是什么**：16.8 时间切片 = 同一份工作切碎分帧做完，中断只因帧时间用完，恢复后**接着做**。18 优先级抢占 = 低优先工作被高优先打断后**丢弃重来**（因为高优先可能改变了 state）。
- **为什么**：16.8 只有"时间"维度，不知道"谁更重要"。18 引入 Lanes 优先级——用户点击 > 数据渲染，高优先一来低优先让路。
- **有啥用**：用户交互永远优先响应——搜索框打字不会因为结果列表渲染而卡顿。

> 📎 [事件系统与调度](knowledge-points/03-events-and-scheduling.md)

### Q35：React 18 在调度器基础上加了哪三样？

- **是什么**：① Lanes 优先级系统（31 位位掩码，O(1) 判断）② Scheduler 包（MessageChannel 宏任务，替代 requestIdleCallback）③ 并发 API 层（useTransition / useDeferredValue）。
- **为什么**：时间切片只是"能停"，这三样让 React"知道什么时候该停、该给谁让路、让开发者能表达意图"。
- **有啥用**：开发者通过 useTransition 和 useDeferredValue 声明"这个更新可以慢"，React 自动优化调度。

### Q36：createRoot 和 ReactDOM.render 的关系？

- **是什么**：`createRoot` 是并发特性总开关——开启了可以使用所有的并发能力。`ReactDOM.render` 是旧 API，即使装 React 18 也走同步渲染路径。
- **为什么**：并发不是"自动生效"的——需要 createRoot 把 Scheduler + Lanes + workLoopConcurrent 基础设施搭起来。
- **有啥用**：迁移 React 18 的第一步就是把 `render` 换成 `createRoot`。

### Q37：为什么 Scheduler 选 MessageChannel 而不是其他方案？

- **是什么**：Scheduler 用 MessageChannel 的 `postMessage` 触发宏任务来调度渲染。
- **为什么**：`Promise.then()` 微任务在同一帧全执行完、`setTimeout` 有 4ms 最小延迟、`requestAnimationFrame` 触发太少、`requestIdleCallback` 兼容性差。MessageChannel = 宏任务（可在任务间让浏览器渲染）+ 无最小延迟 + 全浏览器支持。
- **有啥用**：React 能精确到 0~1ms 粒度调度工作单元，每 5ms 就让出检查是否有高优先更新。

---

## Automatic Batching

### Q38：React 18 的 Automatic Batching 改变了什么？

- **是什么**：所有场景（事件处理器、setTimeout、Promise、原生事件）中的多次 setState 自动合并为一次渲染。
- **为什么**：React 17 只在事件处理器中 batch——setTimeout 中两次 setState 各触发一次渲染，多余的渲染浪费性能。
- **有啥用**：代码不需要改，性能自动提升。需要退出批处理时用 `flushSync()`。

---

## Transitions

### Q39：useTransition 解决什么问题？什么原理？（★）

- **是什么**：`startTransition` 将包裹的 setState 标记为低优先级（TransitionLane），可被高优先级更新中断丢弃。
- **为什么**：搜索框场景——输入框更新必须立即响应（SyncLane），搜索结果渲染可以慢（TransitionLane）。用户继续打字 → 旧的搜索渲染被丢弃，用最新输入重来。
- **有啥用**：用户感觉输入始终流畅。同时 `isPending` 可用来显示"后台加载中"的轻量提示。

### Q40：startTransition vs setTimeout？

- **是什么**：startTransition 同步标记优先级；setTimeout 延迟到下一个宏任务。
- **为什么**：setTimeout 降低了所有更新的响应速度，且不可被中断——高优先更新也得等它执行完。startTransition 只在有高优先插入时才让路。
- **有啥用**：Transition 是"优雅降级"，setTimeout 是"主动降级"。前者体验更好——无额外延迟、保持旧 UI、无闪烁。

### Q41：useTransition vs useDeferredValue？

- **是什么**：useTransition 控制 setState 的优先级（你掌控触发时机）。useDeferredValue 延迟 props 的消费（你掌控不了上游，只能延迟下游）。
- **为什么**：前者包裹的是 `setState` 调用，后者包裹的是 `props` 的值。
- **有啥用**：你能控制 setState → 用 useTransition；props 来自父组件你改不了 → 用 useDeferredValue 让下游渲染慢下来。

---

## setState 完整链路

### Q42：调用 setState 之后发生了什么？（★ 必问）

- **是什么**：三个阶段——触发（创建 update → 入队 updateQueue → scheduleUpdateOnFiber）；Render（遍历 updateQueue 算新 state → 执行组件函数 → diff 打 effectTag）；Commit（按标记操作 DOM → useLayoutEffect → 浏览器绘制 → useEffect）。
- **为什么**：React 不立刻改 state 和 DOM——先收集所有 update（批处理），再统一计算和 diff（可中断），最后统一应用（不可中断），分阶段让每一步可控。
- **有啥用**：理解这个能解释批处理、可中断渲染、useEffect/useLayoutEffect 时序等几乎所有 React 行为。

> 📎 [Fiber 与渲染机制](knowledge-points/02-fiber-and-rendering.md)

### Q43：update 对象 / Scheduler task / Fiber 节点的区别？

- **是什么**：update 对象描述"state 怎么变"（环形链表）；Scheduler task 描述"什么时候执行"（最小堆）；Fiber 节点描述"组件树长什么样"（链表树）。
- **为什么**：三者分属不同层——Reconciler 管组件和 state，Scheduler 管调度时机。各司其职互不耦合。
- **有啥用**：理解 React 架构分层——不是一个大 while 循环，而是精心拆分的三层协作。

---

## 新增 Hooks 与 Suspense

### Q44：useSyncExternalStore 解决什么问题？

- **是什么**：安全订阅外部 Store 的 Hook，防止并发渲染下的 **Tearing**——UI 中同时出现新旧两个状态。
- **为什么**：并发渲染中 React 可能在渲染到一半时让出主线程，外部 Store 在此期间更新 → 组件上半部分用旧值、下半部分用新值。
- **有啥用**：Redux、Zustand 等外部状态库的内部实现会用它来保证订阅安全。普通开发者不直接调用。

### Q45：useInsertionEffect 什么场景用？

- **是什么**：在 DOM 变更**之前**同步执行的 Hook，比 useLayoutEffect 还早。
- **为什么**：CSS-in-JS 库需要在 Layout 计算前注入样式规则——如果在 Layout 之后注入，会触发额外的样式重算和回流。
- **有啥用**：专门给 styled-components、Emotion 等库写的。普通开发者几乎不直接使用。

### Q46：React 18 Strict Mode 变严格了什么？

- **是什么**：开发模式下故意 double-invoke 组件函数体、useState 初始化函数、useEffect/useLayoutEffect。
- **为什么**：模拟"挂载 → 卸载 → 再挂载"场景（如 Tab 切换）。如果缺少 cleanup，副作用会重复执行，提前暴露问题。
- **有啥用**：帮你在开发阶段发现缺少 cleanup 的副作用。仅开发模式，生产环境无影响。

### Q47：React 18 的 SSR Streaming 是什么？（★）

- **是什么**：用 `renderToPipeableStream` 替代 `renderToString`，把页面按 Suspense 边界拆成多个独立的流式通道——不依赖数据的部分先发，慢组件各自独立流式追加。客户端 `hydrateRoot` 配合选择性水合，哪个组件先准备好就先可交互。
- **为什么**：传统 SSR 四个"等"——等数据、等 HTML、等 JS、等 Hydrate。一个慢组件拖整个页面。流式 + 选择性水合打破了串行依赖。
- **有啥用**：用户先看到首屏框架，慢内容渐进式加载，重要区域优先可交互。适合性能差异大的页面（博客正文快、评论区慢；商品详情快、推荐慢）。

> 📎 [Fiber 与渲染机制 · SSR Streaming](knowledge-points/02-fiber-and-rendering.md)

---

# React 19

### Q48：RSC（React Server Components）是什么？（★）

- **是什么**：只在服务端渲染、永不 hydrate 到客户端、代码零 bundle 下发、可直接查数据库的 React 组件。客户端拿到的不是 HTML，而是 RSC Payload（序列化的 React Element Tree）来重建 UI。
- **为什么**：传统 CSR 首屏慢 + bundle 膨胀；传统 SSR 首屏快了但 JS 体积不减、水合开销不减。两者的思维模型都是"整个应用一体"——RSC 打破这个假设：一个 200KB 的 Markdown 渲染器、一个纯产品列表，根本不需要下载到浏览器。
- **有啥用**：零 bundle 体积、直连数据库（不需要 API Route 中间层）、敏感逻辑永不下船。开发时默认 Server Component，需要交互（useState/onClick）处用 `'use client'` 标记。

> 📎 [Fiber 与渲染机制 · RSC](knowledge-points/02-fiber-and-rendering.md)

### Q49：三种组件类型怎么区分？

- **是什么**：Server Component（默认，查数据库/不可交互）、Client Component（`'use client'`，useState/事件）、Shared Component（纯展示，取决于谁引用）。
- **为什么**：不是每个组件都需要客户端交互——数据展示组件和交互组件应该用不同的渲染模型。
- **有啥用**：默认 Server，按需 Client。Server 可以 import Client，反过来不行。Client 是单向边界入口。

### Q50：RSC Payload 是什么？

- **是什么**：Server Component 的渲染产物——序列化的 React Element Tree，不是 HTML。
- **为什么**：Payload 比 HTML 更丰富——保留了组件结构信息，客户端可以用它精确重建 React 树，而不是"硬水合"一段字符串。
- **有啥用**：客户端不需要下载 Server Component 的 JS 代码——只需要 Payload 就能知道"渲染结果长什么样"。

### Q51：Server Actions 解决了什么？

- **是什么**：`'use server'` 标记的函数，可以直接作为表单 action。React 自动处理序列化、网络请求、错误。
- **为什么**：传统需要手动写 API Route + fetch + `e.preventDefault()` + loading/error 状态。Server Action 把这些全部自动化。
- **有啥用**：不需要 API Route、不需要手动 fetch、不需要 `preventDefault`。`<form action={serverFn}>` 一行搞定。

### Q52：`'use server'` 的两种定义方式？

- **是什么**：文件级别（文件顶行 `'use server'`，整个文件都是 Server Actions）或函数级别（`async function fn() { 'use server'; }`，只标记单个函数）。
- **为什么**：文件级别适合 Action 集中的模块；函数级别适合一个文件里混合导出 Server Action 和其他工具函数。
- **有啥用**：灵活选择——一般文件级别更清晰。

### Q53：use() Hook 为什么说它"打破了 Hooks 规则"？

- **是什么**：`use()` 可以在条件/循环中调用，可读取 Promise（配合 Suspense）和 Context。
- **为什么**：它不是 Hook——是 React 内建函数，不依赖调用顺序，不存储在 Hook 链表中。
- **有啥用**：在组件中直接 `use(promise)` 读取异步数据，不需要 useState + useEffect 的组合模式。还能替代 `useContext`。

### Q54：useOptimistic 的原理？

- **是什么**：接受原始数据 + 合并函数，返回乐观状态 + `addOptimistic` 函数。调用 `addOptimistic` 立即更新 UI，真实请求失败后自动回滚。
- **为什么**：传统乐观更新需要手动管理两份状态（当前 + 显示中），出错还要手动回滚。useOptimistic 把这一切自动化。
- **有啥用**：提交评论、点赞、收藏等场景——用户操作后立即看到结果，不等待服务端响应。

### Q55：useFormStatus 和 useActionState 的区别？

- **是什么**：useFormStatus 只读表单提交状态（`{ pending, data, method, action }`）。useActionState 管理 Action 完整生命周期（`[state, formAction, isPending]`）。
- **为什么**：前者轻量——只关心"表单是否在提交"；后者重量——管理 Action 的返回值、错误状态。
- **有啥用**：useFormStatus 给 SubmitButton 用（决定 disabled + loading 文字）；useActionState 给表单容器用（处理服务端返回的验证错误）。

### Q56：forwardRef 还需要吗？

- **是什么**：React 19 ref 直接作为普通 prop 传递——`function MyInput({ ref, ...props })`。
- **为什么**：forwardRef 是 React 16/17/18 的"补丁"——因为 ref 被特殊处理，不能像普通 prop 一样解构。React 19 把这个特殊处理去掉了。
- **有啥用**：少写一层 forwardRef 包装，代码更直观。

### Q57：Context 的 Provider 还需要吗？

- **是什么**：不需要 `.Provider`——直接 `<ThemeContext value={theme}><App /></ThemeContext>`。
- **为什么**：Provider 嵌套是多余的样板代码，Context 本身就是"提供者"。
- **有啥用**：少打几个字。

### Q58：Document Metadata 怎么在组件中直接写？

- **是什么**：组件中直接写 `<title>`、`<meta>`、`<link>`，React 自动提升到 `<head>`。
- **为什么**：这些标签语义上属于组件——博客标题、SEO 描述应该由渲染该内容的组件声明，而不是单独用 react-helmet 管理。
- **有啥用**：不需要第三方库，组件自包含自己的 metadata。

---

## 版本脉络

```
React 16：函数组件能写一切（Fiber + Hooks 革命）
React 17：悄悄把地基换了（事件委托、JSX Transform、微前端基础）
React 18：UI 不再卡顿（Concurrent + Transition + 优先级调度）
React 19：前后端边界消失（RSC + Server Actions + 乐观更新）
```

---

> 💡 知识点详解见 `knowledge-points/`：
> - [Hooks 深入](knowledge-points/01-hooks-deep-dive.md) — useEffect/useLayoutEffect 完整时序、闭包陷阱、React 18/19 新 Hooks
> - [Fiber 与渲染机制](knowledge-points/02-fiber-and-rendering.md) — Fiber 架构、setState 完整链路、SSR Streaming、RSC
> - [事件系统与调度](knowledge-points/03-events-and-scheduling.md) — 合成事件、事件委托 16 vs 17、Scheduler、Automatic Batching、Transitions
> - [设计模式与高级概念](knowledge-points/04-patterns-and-advanced.md) — Error Boundaries、HOC、Render Props、Portals、Context
> - [状态管理](knowledge-points/05-state-management.md) — Redux 核心、Redux Toolkit、中间件
> - [路由](knowledge-points/06-routing.md) — React Router v7、HashRouter vs BrowserRouter
