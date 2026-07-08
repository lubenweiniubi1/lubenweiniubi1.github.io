# React 事件系统与调度机制

> 合成事件、事件委托、Fiber 冒泡模拟、Scheduler 调度、Lanes 优先级。

---

## 一、合成事件（SyntheticEvent）

React 封装了跨浏览器的合成事件，对所有浏览器暴露统一 API：

```jsx
function handleClick(e) {
  e.preventDefault();
  e.stopPropagation();
  console.log(e.target);         // 谁触发
  console.log(e.currentTarget);  // 谁处理
  console.log(e.nativeEvent);    // 底层原生事件
}
```

---

## 二、事件委托：React 16 vs 17（★ 核心面试题）

### 2.1 委托位置变化

```
React 16：document ← dispatchEvent 在这里
React 17+：root 节点 ← dispatchEvent 在这里
```

| 版本 | 委托位置 | 影响 |
|------|---------|------|
| React 16 | `document` | 原生事件**一定先于** React 事件执行 |
| React 17+ | 根容器节点 `#root` | React 捕获 → 原生捕获 → 原生冒泡 → React 冒泡 |

### 2.2 三个关键影响

1. **执行顺序**：React 16 所有原生事件 > 所有 React 事件。React 17 React 和原生交替执行按 DOM 位置
2. **stopPropagation 语义**：React 16 中在原生捕获阶段 `stopPropagation` → 事件到不了 document → **整个 React 事件系统被"关掉"**。React 17 只能阻止冒泡阶段，捕获阶段拦不住
3. **微前端**：React 16 多个版本共用一个 document 委托 → 冲突；React 17 各版本委托到自己的 root → 隔离

### 2.3 面试话术

> "React 16 把所有事件委托到 document，React 17 改成了根容器节点。三个影响：执行顺序变了、stopPropagation 语义变了、微前端事件隔离好了。这是 React 17 最关键的破坏性变化。"

---

## 三、事件冒泡模拟（collectListeners）

React 的冒泡不是真正的 DOM 冒泡——所有事件只绑在根节点。React 通过遍历 Fiber 树来模拟冒泡：

```
1. 原生事件在 <button> 上触发 → 冒泡到根节点 → dispatchEvent 调用
2. 从 e.target 拿到真实 DOM → _reactInternalFiber → 找到 Fiber
3. 从目标 Fiber 向上遍历 return 链，逐个收集事件处理器
4. 按冒泡方向（目标→根）依次执行 handler
5. e.stopPropagation() → 跳出循环，后续 handler 不执行
```

**Portal** 事件冒泡按 React 组件树（Fiber 的 return 链），不是 DOM 树。因为 collectListeners 不看 DOM parentNode。

---

## 四、Scheduler 调度器（React 18）

### 4.1 为什么需要 Scheduler？

旧方案的问题：
- `requestIdleCallback`：浏览器兼容性差、无法主动取消、不支持优先级
- `setTimeout(fn, 0)`：有 4ms 最小延迟，高频调度浪费严重
- `Promise.then()` 微任务：在同一帧内全部执行，浏览器没机会渲染

### 4.2 React 的 Scheduler 核心：MessageChannel

```
scheduleCallback(优先级, 要做的事)
  → 创建 task → 放入 taskQueue 最小堆
  → port2.postMessage(null)  // 发信号

port1.onmessage（宏任务中执行）
  → 取 taskQueue 堆顶 → 执行 task
  → 5ms 到了？→ postMessage 再来一轮
  → 做完了？→ 停
```

**关键优势**：宏任务（浏览器可在任务间渲染） + 无最小延迟 + 全浏览器支持。

### 4.3 Lanes 优先级系统（31 位位掩码）

```
SyncLane            = 0b000...0001  // 最高：点击、输入
InputContinuousLane = 0b000...0100  // 拖动、滚动
DefaultLane         = 0b000...10000 // 普通 setState
TransitionLane      = 0b001...0000  // startTransition
IdleLane            = 0b010...0000  // 最低：离屏
```

lane 数值越小，优先级越高。位运算判断 O(1)。

---

## 五、浏览器一帧（★ 基础概念）

### 5.1 一帧的内部执行顺序（~16.67ms @ 60Hz）

```
① Input Events → ② Timers → ③ Begin Frame
→ ④ requestAnimationFrame（Layout 前最后一刻）
→ ⑤ ResizeObserver / IntersectionObserver
→ ⑥ Style → ⑦ Layout → ⑧ Paint → ⑨ Composite
→ ⑩ Idle Period（requestIdleCallback）
```

React 在帧末（⑩ Idle Period 之后）用 5ms 时间片干活，5ms 到点就让出等下一帧。

### 5.2 为什么是 5ms 而不是 16ms？

一帧 16.67ms，浏览器自己渲染（Style/Layout/Paint）也要时间。5ms 是经验值：足够 React 干活，确保浏览器有 ~11ms 做渲染。

---

## 六、Automatic Batching（React 18）

React 17 只在 React 事件处理器中自动 batch。setTimeout/Promise/原生事件中的多次 setState 各自触发独立渲染。

React 18 **所有场景**都自动 batch：

```jsx
// React 17：触发两次渲染
setTimeout(() => {
  setCount(c => c + 1); // 渲染一次
  setFlag(f => !f);     // 又渲染一次！
}, 1000);

// React 18：合并为一次渲染
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);     // 只渲染一次！
}, 1000);
```

退出批处理：`ReactDOM.flushSync(() => { ... })`。

---

## 七、Transitions（useTransition / useDeferredValue）

### useTransition

将 setState 标记为 `TransitionLane`（低优先），遇到 `SyncLane`（点击/输入）时可被中断丢弃。

```jsx
const [isPending, startTransition] = useTransition();

function handleInput(e) {
  setInputValue(e.target.value);  // SyncLane：立即响应
  startTransition(() => {
    setSearchResult(filter(e.target.value)); // TransitionLane：可中断
  });
}
```

### startTransition vs setTimeout

| | startTransition | setTimeout |
|---|---|---|
| 可中断 | ✅ 高优先一来就中断 | ❌ 必须等回调执行完 |
| 时机 | 同步执行，标记优先级 | 延迟到下一个宏任务 |
| 旧 UI 保持 | ✅ 保持旧 UI，不闪烁 | ❌ 需要手动处理 loading |

### useTransition vs useDeferredValue

- `useTransition`：你**控制 setState 的时机**
- `useDeferredValue`：你**控制不了上游**（props 来自父组件），只能延迟消费

```jsx
startTransition(() => { setResult(query); });     // 你控制了 setState
const deferred = useDeferredValue(propsFromParent); // 你控制不了 props
```

### createRoot → workLoopSync vs workLoopConcurrent

`createRoot` 是总开关——搭好 Scheduler + Lanes + workLoopConcurrent 基础设施。`useTransition`/`useDeferredValue` 是方向盘——让特定更新走低优先车道。不用这些 API，所有更新走 DefaultLane，无优先级抢占。
