# 06c — React 18：并发特性

> React 18 引入了 Concurrent Features，核心思路是"让 React 更聪明地调度渲染"，不阻塞用户交互。

---

## 一、前提：两个"可中断"的区别（★ 基础概念）

讲到 React 18 的"并发可中断"，必须先搞清楚它和 React 16.8 Fiber 的"可中断"有什么区别。两者都叫"可中断渲染"，但本质完全不同。

### 1.1 React 16.8：时间切片（同一份工作，分时做完）

把渲染拆成小单元，浏览器空闲时做一点，没时间就暂停，下次继续。

```
16.8 的核心循环（伪代码）：

  循环开始
    │
    ├─ 处理一个 Fiber 节点（~几微秒）
    ├─ 检查：这一帧还剩时间吗？
    │   ├─ 有 → 继续循环，处理下一个节点
    │   └─ 没了 → 暂停！ requestIdleCallback(下次继续)
    │
    └─ 所有节点都处理完了？ → commit → 更新 DOM

中断原因就一个：这帧时间片用完了。
恢复方式就一个：下个空闲帧接着做。
```

```
同一批工作，切碎分帧：
  [A1][A2][A3] ── [A4][A5] ── [A6][commit A]

用户中途点击？→ 等着，A 做完了才能处理你的点击 ← 问题所在
```

### 1.2 React 18：优先级抢占（高优先来了，低优先让路）

在时间切片的基础上，给每个工作打了 **lane（优先级标签）**。高优先级的来了，低优先的不再是"暂停等等"，而是**直接丢弃，用新 state 重来**。

```
18 的核心循环（伪代码）：

  循环开始
    │
    ├─ 处理一个 Fiber 节点
    ├─ 检查①：这一帧还剩时间吗？
    │   └─ 没了 → 暂停！下个宏任务继续（同 16.8）
    │
    ├─ 检查②：队列里有更高优先级的活插进来了吗？ ← 18 新增！
    │   └─ 有 → 当前工作全部丢弃！return！高优先先跑
    │         （高优先做完后，低优先用最新 state 重新来过）
    │
    └─ 所有节点处理完？ → commit

中断原因有两个：① 时间片用完 ② 被更高优先级抢断
恢复方式不一样：① 接着做  ② 丢弃重来
```

```
低优先被高优先打断，丢弃重来：
  [低A1][低A2] ── 💥用户点击 ── [高B1][高B commit] ── [低A重来1][低A重来 commit]

  高优先 B 立刻响应 ✅        丢弃的 A 用新 state 重算 ✅

### 1.3 两个循环的直观对比

```
16.8 的 while 条件：                 18 的 while 条件：
┌──────────────────────┐            ┌──────────────────────────────┐
│ ① 还有工作没做完？    │            │ ① 还有工作没做完？            │
│ ② 这帧还有时间？      │            │ ② 这帧还有时间？              │
│                       │            │ ③ 有更高优先级的更新插队？ ← 新增│
│ 中断 → 下帧继续       │            │   中断 → 丢弃当前，重来       │
└──────────────────────┘            └──────────────────────────────┘
```

| | 16.8 workLoop | 18 workLoop |
|---|---|---|
| 循环判断 | `有时间 && 有工作` | `有时间 && 有工作 && 没被插队` |
| 中断后 | 保存进度，下帧**继续** | 丢弃进度，**重来** |
| 不同 setState 之间 | 排队，先到先做 | 高优先插队，低优先让路 |
| 触发执行的方式 | `requestIdleCallback`（浏览器说了算）| `MessageChannel`（React 自己控制）|

### 1.4 React 18 在调度器基础上具体加了什么？

以 [Build Your Own React](notes/01-react/04/原理/01-intro.md) 中的迷你调度器为起点，React 18 加了三样东西：

**① Lanes 优先级系统（替代 expirationTime）**

```js
// React 16：用过期时间戳表示优先级（粒度粗）
const update = {
  expirationTime: now + timeout,  // 优先级隐含在 timeout 里
}

// React 18：用 31 位位掩码（Lanes）表示优先级
const SyncLane            = 0b0000000000000000000000000000001  // 最高：点击、输入
const InputContinuousLane = 0b0000000000000000000000000000100  // 拖动、滚动
const DefaultLane         = 0b0000000000000000000000000010000  // 普通 setState
const TransitionLane      = 0b0000000000000000000001000000000  // startTransition
const IdleLane            = 0b0100000000000000000000000000000  // 最低：离屏

// 优先级比较 → 位运算，O(1)
function isHigherPriority(a, b) {
  return a < b  // lane 数值越小，优先级越高
}
```

Lanes 比 expirationTime 的好处：
- **细粒度**：一个组件上可以同时有多个优先级的更新（比如既有 TransitionLane 又有 SyncLane）
- **位运算**：判断、合并、移除都用位运算，极快
- **批处理天然支持**：同一 lane 的多个更新自动合并

**② Scheduler 包（替代 requestIdleCallback）**

```js
// requestIdleCallback 的问题：
// 1. 浏览器兼容性（Firefox 不完全支持）
// 2. 无法主动取消已排期的回调
// 3. 只能按注册顺序执行，不支持插队

// React 18 的 Scheduler：基于 MessageChannel 实现
const channel = new MessageChannel()
const port = channel.port2

channel.port1.onmessage = () => {
  performWorkUntilDeadline()  // 在宏任务中执行，5ms 时间片
}

function schedulePerformWork() {
  port.postMessage(null)  // 触发下一个宏任务
}
```

#### Scheduler 怎么用 MessageChannel？——极简版

Scheduler 本质就是维护一个**按优先级排序的任务队列** + 用 MessageChannel 驱动执行循环。不需要记住具体 API，理解这三点就够了：

**① 收到更新 → 入队**

```
scheduleCallback(优先级, 要做的事)
  │
  ├─ 创建一个 task：{ 要做的事, 优先级, 过期时间 }
  ├─ 把 task 放入 taskQueue（按过期时间排序，最紧急的在堆顶）
  └─ 调用 requestHostCallback()
       └─ 检查：MessageChannel 已经在跑了吗？
          ├─ 已经在跑 → 不用管，循环会自己取到这个 task
          └─ 没在跑   → port2.postMessage(null)  ← 发信号启动！
```

**② MessageChannel 收到信号 → 开始干活**

```
port1.onmessage 触发（在宏任务中）
  │
  ├─ 取 taskQueue 堆顶 → 最紧急的那个 task
  ├─ 执行 task.callback（也就是 performWorkOnFiber → 处理 Fiber 节点）
  │   ├─ 任务返回函数 → 没做完，callback 换成返回的函数，下次继续
  │   └─ 任务返回空   → 做完了，从队列移除
  │
  ├─ 检查：时间片用完了（> 5ms）且任务还没过期？
  │   └─ 是 → break！port2.postMessage(null) → 下个宏任务继续
  │
  └─ 检查：队列里还有任务吗？
      ├─ 有 → port2.postMessage(null) → 再来一轮
      └─ 空 → 停止 MessageChannel 循环
```

**③ 取消任务**

```
不是真的删掉 task，只是把 task.callback 设为 null
→ 循环里遇到 callback === null 自动跳过
→ 原因：task 在最小堆中间，删除要 O(n)，置 null 只要 O(1)
```

**一句话**：Scheduler 就是一个 `while` 循环被 `port2.postMessage` 反复触发，每次在宏任务里处理队列中最紧急的 task，5ms 没干完就发下一个 `postMessage` 下个宏任务继续。

**一个完整的交互实例：搜索框打字**

```
用户按下 'A' 键
 │
 ├─ 1. React 合成事件触发 handleInput
 │     ├─ setInputValue('A')
 │     │   └─ scheduleCallback(ImmediatePriority, performWork)
 │     │       → expirationTime = now - 1（立即过期）
 │     │       → push(taskQueue) → requestHostCallback(flushWork)
 │     │       → port2.postMessage(null)  // 🔑 安排宏任务
 │     │
 │     └─ startTransition(() => setSearchResult(...))
 │         └─ scheduleCallback(LowPriority, performWork)
 │             → expirationTime = now + 10000（10秒后过期）
 │             → push(taskQueue)  // 排在高优先任务后面
 │             → requestHostCallback 发现 isMessageLoopRunning = true，跳过
 │             // 不重复 postMessage——已经有宏任务在排队了
 │
 ├─ 2. JS 调用栈清空
 ├─ 3. 微任务队列执行（Promise.then 等）
 │
 ├─ 4. 宏任务：port1.onmessage 触发
 │     │
 │     ├─ peek(taskQueue) → performWork for setInputValue
 │     │   expirationTime = now - 1（已过期！）
 │     │   → didTimeout = true
 │     │   → 同步执行完，不让出控制权（因为过期了）
 │     ├─ 总共只用了 0.5ms → 时间片还有余量
 │     │
 │     ├─ peek(taskQueue) → performWork for setSearchResult
 │     │   expirationTime = now + 10000（还有 10 秒才过期）
 │     │   → didTimeout = false
 │     │   → 开始处理搜索结果的 Fiber 树...
 │     │
 │     │   [work1][work2][work3] ← 用了 5ms
 │     │   → shouldYield: 5ms 到了，任务还没过期
 │     │   → break！搜索渲染暂停
 │     │   → currentTask.callback = continuation（保存进度）
 │     │   → port2.postMessage(null)  // 下个宏任务继续
 │     │
 ├─ 5. 浏览器渲染帧（用户看到输入框里显示 'A'）✅
 │
 ├─ 6. 下个宏任务：port1.onmessage 再次触发
 │     │
 │     ├─ peek(taskQueue) → 还是 setSearchResult（上次没完成）
 │     │   [work4][work5] ← 又用了 3ms
 │     │
 │     ├─ 💥 这时用户又按了 'B'！
 │     │   → scheduleCallback(ImmediatePriority, performWork)
 │     │     → push(taskQueue)  // 插到堆顶！
 │     │     → port2.postMessage(null)  // 但已经在宏任务中了...
 │     │
 │     ├─ 本轮循环继续处理 setSearchResult
 │     │   [work6] ← 完成！
 │     │
 ├─ 7. 但是！React 在 commit 前检查：taskQueue 堆顶变成了 ImmediatePriority！
 │     → 当前搜索结果的渲染被标记为 dirty
 │     → commit 被取消！
 │
 ├─ 8. 处理 'B' 的 setInputValue
 │     → SyncLane = 立即过期
 │     → 同步执行完，commit 到屏幕
 │     → 用户看到输入框显示 'AB' ✅
 │
 ├─ 9. 重新开始搜索结果的低优先渲染
 │     → 用新的 inputValue='AB' 重新搜索
 │     → 从头构建搜索结果 Fiber 树
 │     → 分多个宏任务完成 → commit
```

> **关键点**：第 6~8 步揭示了 React 18 并发模型的核心——即使低优先渲染已经"做完了"（work1~work6），在 commit 前如果发现更高优先级的更新插队，整个低优先渲染结果被**丢弃**，等高优先完成后用新 state **重新渲染**。

#### 为什么不用其他方案？

React 在选型时跑过一套基准测试，结论是 `MessageChannel` 是最优选：

| 方案 | 类型 | 问题 |
|------|------|------|
| `Promise.then()` | 微任务 | ❌ 微任务在同一帧内全部执行完，浏览器没有机会在中间做 Layout/Paint。React 需要**定期让出控制权**给浏览器渲染，微任务做不到 |
| `setTimeout(fn, 0)` | 宏任务 | ❌ 有 **4ms 最小延迟**（HTML spec 要求嵌套超时 ≥4ms）。高频调度时 4ms 累积浪费严重 |
| `requestAnimationFrame` | 帧前 | ❌ 只在帧渲染前触发一次，次数太少；且屏幕外标签页不触发 |
| `requestIdleCallback` | 帧后 | ❌ 浏览器兼容性（Firefox 不支持），且无法主动取消已排期的回调，无法指定优先级 |
| **`MessageChannel`** | **宏任务** | ✅ 宏任务（可在任务间让浏览器渲染）+ **无最小延迟** + 全浏览器支持 + 可取消 |

#### 执行时序对比

```
用户点击 → 事件处理完成 → JS 调用栈清空
                              │
                              ├─ 微任务队列（Promise、queueMicrotask）
                              │   └─ 全部执行完，浏览器没机会渲染
                              │       └─ ❌ 不合适：React 需要中间让浏览器绘制
                              │
                              ├─ 宏任务队列（MessageChannel、setTimeout）
                              │   └─ 取一个执行 → 浏览器可渲染 → 再取下一个
                              │       └─ ✅ 合适：每个宏任务之间浏览器可以 Layout/Paint
                              │
                              └─ requestIdleCallback（浏览器自行决定）
                                  └─ 优先级最低，不可控
                                      └─ ❌ 不合适：紧急渲染等不了
```

**③ 并发 API 层（暴露给开发者）**

这是你在这个文件下面看到的 `useTransition`、`useDeferredValue` ——它们的作用就是把特定更新标记为 `TransitionLane`（低优先），让浏览器事件触发的更新（`SyncLane`）能抢占它们：

```jsx
function handleInput(e) {
  // 这个 setState 走 SyncLane → 不能被中断 → 用户打字立即响应
  setInputValue(e.target.value)

  // 这个 setState 走 TransitionLane → 可以被中断 → 列表更新可以慢
  startTransition(() => {
    setSearchResult(filterResults(e.target.value))
  })
}
```

### 1.5 Concurrent Mode → Concurrent Features

有了以上铺垫，理解 React 18 的产品决策就很容易了：React 18 把"并发能力"从一个全局开关变成了一组可选 API。你不用启动一个"并发模式"，只需要在需要的地方使用 `useTransition`、`useDeferredValue`，每个都是独立开关。

**关键洞察**：并发不是说 React 同时做很多事（JS 单线程），而是 React 能在多个优先级的渲染任务之间**快速切换**，高优先任务不等待低优先任务。

### 1.6 setState → 页面渲染：完整链路（★ 含 update 对象）

面试高频题："调用 setState 之后发生了什么？"这个问题考察的是对整个渲染管线的理解。下面从按下回车到像素显示，把沿途经过的每个关键对象和函数都串起来。

#### 1.6.1 总览：三大阶段

```
setState(newValue)
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  阶段一：触发（Trigger）—— 同步，几微秒               │
│                                                     │
│  ① 创建 update 对象                                  │
│  ② update 入队（fiber.updateQueue 环形链表）          │
│  ③ 从当前 fiber 向上标记 lane                        │
│  ④ scheduleUpdateOnFiber → Scheduler 调度            │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  阶段二：Render —— 可中断，异步（宏任务中执行）        │
│                                                     │
│  ⑤ processUpdateQueue：遍历链表，计算新 state        │
│  ⑥ 执行组件函数，生成新的 React Element               │
│  ⑦ reconcileChildren：diff 新旧，生成新 Fiber 树     │
│  ⑧ 时间片用完或有高优先插入 → 中断，下个宏任务继续     │
└─────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────┐
│  阶段三：Commit —— 不可中断，同步                     │
│                                                     │
│  ⑨ Mutation：更新真实 DOM                            │
│  ⑩ Layout：执行 useLayoutEffect                      │
│  ⑪ 浏览器 Layout → Paint → 用户看到新 UI             │
│  ⑫ 微任务：执行 useEffect                            │
└─────────────────────────────────────────────────────┘
```

#### 1.6.2 阶段一详解：触发（Trigger）

**① 创建 update 对象**

每次 `setState` 调用，React 内部创建一个 update 对象——它描述了"这次更新要干什么"：

```js
// setState('hello') 或 setState(prev => prev + '!') 都会产生一个 update
const update = {
  lane: SyncLane,          // 优先级标记（位掩码）
  tag: UpdateState,        // 0=UpdateState, 1=ReplaceState, 2=ForceUpdate

  // payload 就是 setState 的参数
  payload: 'hello',        // setState(值) → 直接存值
  // 或
  payload: prev => prev + '!',  // setState(函数) → 存函数

  callback: null,          // setState(val, callback) 的第二个参数（很少用）
  next: null,              // 链表指针 → 指向下一个 update
}

// 注：lane 的值由调用上下文决定：
//   事件处理器中调用 setState → SyncLane
//   startTransition 中调用 → TransitionLane
//   useEffect 中调用 → DefaultLane
```

**② update 入队（fiber.updateQueue 环形链表）**

update 不是直接生效的——它被挂到对应 fiber 的 `updateQueue` 上，等 Scheduler 调度后再处理。`updateQueue` 是单向环形链表，入队只需 O(1)：

```js
// fiber.updateQueue 的结构
fiber.updateQueue = {
  baseState: '当前渲染后的 state',            // 上次 commit 时确定的 state

  // 上次渲染时跳过的 update（优先级不够的），下次渲染继续处理
  firstBaseUpdate: jumpUpdate1,              // 链表头
  lastBaseUpdate: jumpUpdate2,               // 链表尾

  shared: {
    // 环形链表：新来的 update 都挂这里
    pending: update3,  // 最后一个 update → update3.next = 第一个 update
    // 展开：update1 → update2 → update3 → update1（环）
    //       ↑ 第一个           ↑ pending
  },

  effects: [],  // 带 callback 的 update（setState(val, cb)），commit 后执行
}
```

入队操作——不管链表多长，只改两个指针：

```js
function enqueueUpdate(fiber, update) {
  const pending = fiber.updateQueue.shared.pending

  if (pending === null) {
    // 第一个 update → 自己指向自己
    update.next = update
  } else {
    // 链表已有 update1 → update2 → update3 → update1
    // pending 指向 update3
    update.next = pending.next    // 新 update.next = update1（第一个）
    pending.next = update         // update3.next = 新 update
    // 现在：update1 → update2 → update3 → 新update → update1
  }

  fiber.updateQueue.shared.pending = update  // pending 移到最新
}
```

**③ 标记 lane（从当前 fiber 向上传播）**

```js
// 沿着 return 链，把 lane 标记到所有祖先 fiber
let fiber = currentlyRenderingFiber  // 当前正在 render 的 fiber（触发 setState 的组件）
while (fiber !== null) {
  fiber.lanes |= lane       // 位运算：合并 lane
  // 同时标记子节点中有更新
  fiber.childLanes |= lane
  fiber = fiber.return      // 向上传播
}
// 为什么？因为祖先需要知道"我的子树里有更新"，
// 这样才能在遍历时进入这个分支而不是跳过。
```

**④ 调度（scheduleUpdateOnFiber → Scheduler）**

```js
function scheduleUpdateOnFiber(fiber, lane) {
  // 1. 标记 root
  const root = markUpdateLaneFromFiberToRoot(fiber, lane)

  // 2. 检查：有没有更高优先级的渲染正在进行？
  if (isHigherPriority(lane, root.entangledLanes)) {
    // 有更高优先 → 打断当前渲染
    markRootUpdated(root, lane)
  }

  // 3. 通过 Scheduler 调度
  //    SyncLane → scheduleSyncCallback（微任务，立即执行）
  //    其他 lane → scheduleCallback（Scheduler 宏任务，按优先级排队）
  ensureRootIsScheduled(root)
  //      ↓
  //  scheduleCallback(priorityLevel, performConcurrentWorkOnRoot)
  //      ↓                              ↑
  //   push(taskQueue)                   这个函数在宏任务中执行，
  //      ↓                             进入 Render 阶段
  //  port2.postMessage(null)
}
```

#### 1.6.3 阶段二详解：Render

当 MessageChannel 的宏任务触发后，`performConcurrentWorkOnRoot` 被调用，进入 Render 阶段。

**⑤ processUpdateQueue：消费 update 链表，计算新 state**

这是整个 React 渲染的"起点"——从 updateQueue 里取出所有 update，逐个应用，算出组件的新 state：

```js
// 核心逻辑（伪代码）
function processUpdateQueue(fiber) {
  // 1. 把 pending 环形链表拆成单向链表
  let update = fiber.updateQueue.shared.pending.next  // 第一个 update

  // 2. 遍历链表，逐个应用
  let newState = fiber.updateQueue.baseState  // 从上次的 state 出发
  while (update) {
    if (update.lane 不匹配当前渲染的 lane) {
      跳过，保留到 baseUpdate 链表，下次再试  // ← React 18 核心
      continue
    }
    // lane 匹配 → 应用
    newState = typeof update.payload === 'function'
      ? update.payload(newState)   // 函数式更新
      : update.payload             // 直接值
    update = update.next
  }
  return newState
}
```

用一个具体例子串起来：

```js
// 组件状态
const [count, setCount] = useState(0)

// 用户连续点击，触发了三次 setState：
setCount(1)                        // update A: { payload: 1,      lane: SyncLane }
setCount(c => c + 1)               // update B: { payload: fn,      lane: SyncLane }
startTransition(() => {
  setCount(c => c + 10)            // update C: { payload: fn,      lane: TransitionLane }
})
```

updateQueue: `A → B → C → A (环)`

**以 SyncLane 渲染时**：
- A: `payload = 1` → `newState = 1` ✅
- B: `payload = fn` → `newState = 1 + 1 = 2` ✅
- C: `lane = TransitionLane` ≠ `SyncLane` → 跳过！保留到 baseUpdate 链表 ⏭️
- 结果：`newState = 2`

**以 TransitionLane 渲染时（SyncLane 完成后）**：
- 从 `baseState = 2` 出发
- A、B 的 lane 不匹配当前 lane → 跳过
- C: `payload = fn` → `newState = 2 + 10 = 12` ✅

**这就是 React 18 "同一 fiber 上混合多种优先级 update" 的底层机制**——不是 Scheduler task 级别的，而是 update 对象级别的。高优先渲染只处理高优先 update，低优先 update 被跳过并保留。

**⑥ 执行组件函数，生成 React Element**

```js
// 函数组件
function Counter() {
  const [count, setCount] = useState(0)
  return <div>Count: {count}</div>
}

// Render 阶段做的事：
const newState = processUpdateQueue(fiber)  // 算出 count = 2
const children = Counter()                   // 执行组件函数
// children = { type: 'div', props: { children: 'Count: 2' } }
```

**⑦ reconcileChildren：diff 新旧，打 effectTag**

```js
// 核心逻辑（伪代码）
// 同时遍历 旧 fiber 链表(current.child) 和 新元素数组(组件返回的 children)
while (旧fiber 或 新元素 还有) {
  if (旧fiber.type === 新元素.type) {
    复用旧 DOM → 新建 wip fiber，打 effectTag = 'UPDATE'
  } else {
    旧 fiber 打 effectTag = 'DELETION'  // 旧的不一样了，删
    新建 wip fiber，打 effectTag = 'PLACEMENT'  // 新的不存在，建
  }
  指针各自移到下一个 sibling
}
// 结果：一棵打了标记的新 Fiber 树，Commit 阶段按标记操作 DOM
```

**⑧ 时间片用完或高优先插入 → 中断**

```js
function workLoopConcurrent() {
  // 和 16.8 的 workLoop 一样的外壳，但多了 lane 检查
  while (workInProgress !== null && !shouldYield()) {
    workInProgress = performUnitOfWork(workInProgress)

    // 中断条件 1：时间用完（5ms，同 16.8）
    // 中断条件 2：有更高 lane 的更新插队（React 18 新增）
  }

  if (workInProgress !== null) {
    // 没做完 → 返回函数，Scheduler 会在下个宏任务继续
    return performConcurrentWorkOnRoot.bind(null, root)
  }
  // 做完了 → commit
}
```

#### 1.6.4 阶段三详解：Commit

所有 fiber 都处理完、`workInProgress` 为 null 后，进入 Commit。

**⑨ Mutation 子阶段：操作 DOM**

```js
function commitMutationEffects(root) {
  // 遍历 effectList（有 effectTag 的 fiber 链表）

  // PLACEMENT → appendChild
  commitPlacement(fiber)     // fiber.dom 插入到父 DOM

  // UPDATE → 更新属性
  commitUpdate(fiber)        // updateDom(dom, oldProps, newProps)
                             // 对比 className、style、事件等

  // DELETION → removeChild
  commitDeletion(fiber)      // fiber.dom 从父 DOM 移除
}
```

**⑩ Layout 子阶段：执行 useLayoutEffect**

```js
function commitLayoutEffects(root) {
  // 同步执行 useLayoutEffect 回调
  // 此时 DOM 已更新，但浏览器还没画
  // 这里 setState 会同步重新进入 Render → Commit，不产生闪烁
}
```

**⑪ 浏览器绘制 & ⑫ useEffect**

```
Commit 完成 → JS 调用栈清空 → 浏览器 Layout → Paint → 用户看到新 UI
                                                        │
                                                    微任务队列
                                                        │
                                                    useEffect 回调
```

#### 1.6.5 三种对象对比

| | update 对象 | Scheduler task | Fiber 节点 |
|---|---|---|---|
| 所在层 | Reconciler | Scheduler | Reconciler |
| 创建时机 | 每次 `setState` | `scheduleUpdateOnFiber` | render 阶段 `reconcileChildren` |
| 存什么 | lane + 新 state（直接值/函数）| callback + 优先级 + 过期时间 | type + props + DOM + alternate + effectTag |
| 数据结构 | 环形链表（fiber.updateQueue）| 最小堆（taskQueue）| 链表树（child/sibling/return）|
| 生命周期 | 被 processUpdateQueue 消费后丢弃 | 任务执行完后出队 | commit 后 current ↔ wip 交换 |
| 核心作用 | 描述"state 怎么变" | 描述"什么时候执行" | 描述"组件树长什么样" |

#### 1.6.6 面试话术

> "setState 调用后分三个阶段。触发阶段：React 创建一个 update 对象保存新 state 和 lane，把它加入 fiber.updateQueue 的环形链表，然后沿着 return 链向上标记 lane，最后调用 Scheduler 通过 MessageChannel 在宏任务中调度。Render 阶段：在宏任务中执行，processUpdateQueue 遍历 update 链表、跳过不匹配当前 lane 的 update、计算出新 state，执行组件函数拿到新的 React Element，reconcileChildren diff 新旧 fiber 并打上 effectTag 标记。Commit 阶段：统一操作 DOM（增删改），同步执行 useLayoutEffect，然后浏览器绘制，最后微任务中执行 useEffect。"

#### 1.6.7 一句话串起全流程

```
setState('A')
  │
  ├─ ① 创建 update = { lane: SyncLane, payload: 'A' }
  ├─ ② 入队 fiber.updateQueue（环形链表，O(1)）
  ├─ ③ lane 沿 return 链向上标记到所有祖先 fiber
  └─ ④ scheduleUpdateOnFiber → Scheduler → port2.postMessage(null)
        │
        ▼  宏任务中执行 ↓
        │
  performConcurrentWorkOnRoot
    ├─ processUpdateQueue → 遍历 update 链表，跳过不匹配 lane 的，算出 newState
    ├─ 执行组件函数 → 返回 React Element
    ├─ reconcileChildren → diff 新旧，打 effectTag（UPDATE/PLACEMENT/DELETION）
    ├─ 没做完？→ 返回函数，下个 postMessage 继续
    └─ 做完了？→ commitRoot
         ├─ Mutation：按 effectTag 操作 DOM（增删改）
         ├─ Layout：同步执行 useLayoutEffect
         ├─ current ↔ wip 交换（双缓冲）
         ├─ 浏览器 Layout → Paint（用户看到新 UI）
         └─ 微任务：执行 useEffect
```

```jsx
// React 17
ReactDOM.render(<App />, document.getElementById('root'));

// React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
```

用旧 API 的话，即使装了 React 18，并发特性也不生效。

---

## 三、Automatic Batching（自动批处理）

### 3.1 旧行为

```jsx
// React 17：只在事件处理器中自动 batch
setTimeout(() => {
  setCount(c => c + 1);  // 触发一次渲染
  setFlag(f => !f);      // 又触发一次渲染！两次！
}, 1000);
```

React 17 只在 React 事件处理器中自动 batch。Promise、setTimeout、原生事件中的多次 setState 各自触发独立渲染。

### 3.2 React 18

```jsx
// React 18：所有更新都自动 batch
setTimeout(() => {
  setCount(c => c + 1);  // 不立即渲染
  setFlag(f => !f);      // 不立即渲染
  // setTimeout 结束时，合并为一次渲染
}, 1000);
```

**如果想退出 batch**：`ReactDOM.flushSync(() => { ... })`

---

## 四、Transitions（关键新概念）

### 4.1 问题场景

搜索输入框：用户打字时，搜索结果列表更新很重。如果搜索结果的渲染阻塞了输入框的反馈，用户会觉得"键盘卡住了"。

### 4.2 解决方案

```jsx
const [isPending, startTransition] = useTransition();

function handleInput(e) {
  // 高优先级：立即更新输入框
  setInputValue(e.target.value);

  // 低优先级：可以被中断
  startTransition(() => {
    setSearchResult(filterResults(e.target.value));
  });
}

// isPending 为 true 时显示 loading
```

**核心机制**：Transition 中的状态更新是**可中断**的。如果用户继续打字，React 会放弃当前渲染，用最新的 input 重新开始。

### 4.3 Transition vs setTimeout

| 维度 | startTransition | setTimeout |
|------|----------------|-----------|
| 可中断 | ✅ 高优先任务一来就中断 | ❌ 必须等回调执行完 |
| 时机 | 同步执行，标记优先级 | 延迟到下一个宏任务 |
| 旧状态显示 | 保留旧 UI，没有 fallback 闪烁 | 需要手动处理 loading |

---

## 五、useDeferredValue

```jsx
const deferredValue = useDeferredValue(value);
// 当 value 变化时，deferredValue 保持旧值
// React 在空闲时用新值重新渲染
```

**useDeferredValue vs useTransition**：
- `useTransition`：你控制 `setState` 的时机（包裹在 startTransition 里）
- `useDeferredValue`：你无法控制上游（比如 value 来自父组件 props），只能标记下游"这个值可以慢"

**何时用**：父组件传下来的 prop 变化频繁，但你渲染成本高 → 用 useDeferredValue 延迟渲染。

---

## 六、Suspense 增强 + SSR Streaming

### 6.1 之前的 SSR

```
Server：渲染整个 HTML → 一次性发送 → Client：hydrate 整个页面
```
问题：一个慢组件拖慢整个页面。

### 6.2 React 18 SSR Streaming

```jsx
// 服务端
import { renderToPipeableStream } from 'react-dom/server';

// 包裹 Suspense 的组件可以流式发送
<Suspense fallback={<Skeleton />}>
  <SlowComponent />
</Suspense>
```

流程：
1. 先发送壳子 HTML（含 Suspense fallback）
2. 慢组件 ready 后，追加一段 `<script>` 替换 fallback
3. 选择性 hydrate：`hydrateRoot`

### 6.3 Suspense 在 CSR 中的增强

```jsx
// Transition 中的 Suspense 不会显示 fallback
// 而是保持旧 UI，避免 loading 闪烁
function handleTabChange(tab) {
  startTransition(() => {
    setCurrentTab(tab);
  });
}
// 如果新 tab 的内容 Suspense 了，显示旧 tab 内容而非 fallback
```

---

## 七、新增 Hooks

### useId

```jsx
const id = useId();
// 生成在服务端和客户端一致的唯一 ID
// 用于 label 的 htmlFor、aria-labelledby 等
```

### useSyncExternalStore

```jsx
const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
// 安全地订阅外部 Store（Redux、Zustand 等）
// 防止 Tearing（UI 中同时看到新旧两个状态）
```

### useInsertionEffect

```jsx
useInsertionEffect(() => {
  // 在 DOM 变更之前同步执行
  // 专门给 CSS-in-JS 库（styled-components、Emotion 等）使用
  // 普通开发者几乎不会用到
});
```

---

## 八、Strict Mode 增强

React 18 的 Strict Mode 会故意**double-invoke 以下内容**以暴露副作用问题：

- 组件函数体
- useState / useReducer / useMemo 的初始化函数
- useEffect / useLayoutEffect

**目的**：模拟"组件挂载 → 卸载 → 再次挂载"的场景（如 tab 切换），提前暴露没有 cleanup 的副作用。

**只在开发模式启用，生产环境不影响。**

---

## 面试要点

| 问题 | 核心回答 |
|------|---------|
| React 16.8 vs 18 "可中断"的区别？ | 16.8 是时间切片——同一份工作分时做完，中断只因帧时间片用完，恢复后接着做。18 是优先级抢占——低优先工作被高优先更新抢断，**丢弃重来**（因为高优先更新可能改变了 state）。18 加了：Lanes 优先级系统、Scheduler 包（替代 rIC）、并发 API（useTransition 等）|
| setState 之后发生了什么？ | 三阶段：①触发——创建 update 对象（lane+payload），入队 fiber.updateQueue 环形链表，标记 lane 到祖先，Scheduler 通过 MessageChannel 宏任务调度；②Render——processUpdateQueue 遍历链表跳过不匹配 lane 的 update 算出新 state，执行组件函数得 React Element，reconcileChildren diff 新旧 fiber 打 effectTag，可中断；③Commit——Mutation 统一操作 DOM（增删改），Layout 同步执行 useLayoutEffect，浏览器 Paint，微任务 useEffect |
| update 对象是什么？ | 每次 setState 创建的数据结构：`{ lane, payload, next }`。存到 fiber.updateQueue 的环形链表里，Render 阶段被 processUpdateQueue 消费。同一 fiber 上可有多个不同 lane 的 update，高优先渲染只处理匹配的，低优先的跳过保留——这是 React 18 lane 优先级在 update 级别的体现 |
| Automatic Batching？ | 所有更新自动合并，不再限于事件处理器 |
| useTransition 原理？ | 将 setState 标记为 TransitionLane（低优先），遇到 SyncLane（点击/输入）时被中断丢弃，等高优先完成后重来 |
| useTransition vs useDeferredValue？ | Transition 控制 setState 的优先级，DeferredValue 控制 props 的渲染时机。前者你能控制 setState，后者你无法控制上游 props |
| SSR Streaming 是什么？ | 先发壳子再流式发慢组件，不等全部 ready |
| useSyncExternalStore 解决什么？ | 外部 Store 的 Tearing 问题 |
