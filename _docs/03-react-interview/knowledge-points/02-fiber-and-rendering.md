# Fiber 架构与渲染机制

> React 16 内核重写的核心：Fiber 架构、Render/Commit 两阶段、Reconciliation（diff）。

---

## 一、为什么需要 Fiber？

React 15 使用 **Stack Reconciler**（递归调和），一旦开始渲染无法中断 → 大组件树阻塞主线程 → 掉帧。

**Fiber 核心思想**：把渲染工作拆成可中断的工作单元（Unit of Work），浏览器每帧剩余时间执行若干单元，没做完就让出主线程。

---

## 二、Fiber 节点结构

```
Fiber Node = {
  type, key,           // 组件类型
  child, sibling,      // 链表结构（替代递归树）
  return,              // 父节点
  effectTag,           // 副作用标记（Placement/Update/Deletion）
  memoizedState,       // hooks 链表
  lanes,               // 优先级（React 18）
  alternate,           // 双缓冲：current ↔ workInProgress
}
```

### 链表结构的优势

- `child` → 第一个子节点
- `sibling` → 下一个兄弟节点
- `return` → 父节点

遍历顺序：`child → sibling → return.sibling → ... → root`。链表方便在任意节点"暂停"，不需要额外记录遍历位置。

---

## 三、双缓冲（Double Buffering）

- **current 树**：当前屏幕显示的 Fiber 树
- **workInProgress 树**：正在构建的新 Fiber 树
- 两棵树通过 `alternate` 互相指向
- Commit 完成后 workInProgress → 变成 new current

---

## 四、Render Phase vs Commit Phase

| 阶段 | Render Phase | Commit Phase |
|------|-------------|-------------|
| 操作 | 构建 Fiber 树、Diffing | 将变更应用到 DOM |
| 可中断 | ✅ 可中断、可恢复 | ❌ 不可中断 |
| 副作用 | 无（只做纯计算、打标记） | 执行 effect、调用生命周期、操作 DOM |

### 为什么分两阶段？

Render 阶段可中断 → 如果不分开，用户会看到"半成品"UI。Commit 阶段统一一次应用所有 DOM 变更。

---

## 五、Reconciliation（Diff 算法）

### 核心原则

同时遍历新旧 Fiber 链表，通过 `type` 判断是否复用：

| 场景 | 条件 | effectTag | DOM 操作 |
|------|------|-----------|----------|
| 复用 | `oldFiber.type === element.type` | `UPDATE` | 更新 props |
| 新建 | 新元素存在但类型不匹配 | `PLACEMENT` | `appendChild` |
| 删除 | 旧 fiber 存在但类型不匹配 | `DELETION` | `removeChild` |

### Key 的作用

没有 key → 按位置匹配；有 key → 按 key 匹配，解决列表重排时错误复用的问题。

---

## 六、React 16.8 vs React 18 的"可中断"区别

| | 16.8 时间切片 | 18 优先级抢占 |
|---|---|---|
| 中断原因 | 帧时间片用完了 | ① 时间片用完 ② 更高优先级插队 |
| 中断后 | 保存进度，下帧**继续** | **丢弃进度，用新 state 重来** |
| 驱动方式 | `requestIdleCallback` | `MessageChannel` 宏任务 |
| 优先级 | 无，先到先做 | Lanes 位掩码系统 |

**一句话**：16.8 是把同一份工作切碎分时做完；18 是高优先来了低优先让路，丢弃重来。

---

## 七、setState → 页面渲染的完整链路

```
setState('A')
  ├─ ① 创建 update 对象 { lane, payload }
  ├─ ② 入队 fiber.updateQueue（环形链表，O(1)）
  └─ ③ scheduleUpdateOnFiber(fiber, lane)
       ├─ markUpdateLaneFromFiberToRoot → lane 沿 return 链向上标记
       └─ ensureRootIsScheduled → Scheduler → port2.postMessage(null)
            │
            ▼  宏任务中执行
  performConcurrentWorkOnRoot
    ├─ processUpdateQueue → 遍历 update 链表，跳过不匹配 lane 的
    ├─ 执行组件函数 → 返回 React Element
    ├─ reconcileChildren → diff 新旧，打 effectTag
    ├─ 没做完？→ 返回函数，下个 postMessage 继续
    └─ 做完了？→ commitRoot
         ├─ Mutation：按 effectTag 操作 DOM
         ├─ Layout：同步执行 useLayoutEffect
         ├─ current ↔ wip 交换
         ├─ 浏览器 Paint → 用户看到新 UI
         └─ 微任务：执行 useEffect
```

---

## 八、浅比较 vs 深度比较

React 中多处使用**浅比较**（`Object.is` 比较顶层键）：

- **PureComponent / React.memo**：浅比较 props 和 state 决定是否跳过渲染
- **Hooks 依赖数组**：`useEffect`/`useMemo`/`useCallback` 的 deps

**陷阱**：对象/数组每次创建新引用 → 浅比较判定"变化" → 渲染优化失效。解决方案：`useMemo`/`useCallback` 稳定引用，或自定义比较函数。

---

## 九、SSR Streaming（React 18 服务端渲染）

### 9.1 传统 SSR 的四个"等"

React 17 及以前的 SSR（`renderToString`）是完全串行的：

```
Server：等全部数据 → renderToString(整个 App) → 一次性发送 HTML
Client：下载 JS → hydrate 整个页面（一次性全部水合）→ 页面可交互

每一步都必须等前一步 100% 完成。一个组件有慢查询 → 整条链路被拖住。
```

四个痛点：

| 痛点 | 说明 |
|------|------|
| **等数据** | 某组件依赖慢查询（3 秒），整个页面 HTML 都得等着 |
| **等 HTML** | 所有 HTML 一次性生成，大页面耗时数百毫秒 |
| **等 JS** | HTML 到了但 JS bundle 还在下载，页面可见不可用 |
| **等 Hydrate** | 传统 hydrate 是 all-or-nothing，全部组件水合完才能交互 |

### 9.2 React 18 的两把武器

**武器一：流式输出（Streaming）**

用 `renderToPipeableStream`（Node.js）或 `renderToReadableStream`（Edge）替代 `renderToString`。

核心理念：页面里可以有 **N 个 Suspense 边界**，每个边界独立流式输出，互不阻塞：

```
<Header />          ← 不依赖数据 → 立即渲染 → 立即 pipe 发出去
<Sidebar />         ← 不依赖数据 → 立即渲染 → 立即 pipe 发出去
<Suspense fallback={<Skeleton />}>  ← 边界 A：评论区
  <Comments />      ← 依赖慢数据（3s）→ 先发 Skeleton 占位，数据 ready 后流式追加
</Suspense>
<Suspense fallback={<Spinner />}>   ← 边界 B：推荐区
  <Recommendations /> ← 依赖另一个慢数据（1s）→ 独立流式追加，不等 A
</Suspense>
<Footer />          ← 不依赖数据 → 立即渲染 → 立即 pipe 发出去
```

流程：

```
头部/侧边/底部 → 不依赖数据 → 渲染完立即 pipe 发送给浏览器
  │
  ├─ 浏览器收到首屏框架 → 用户看到页面骨架
  │
  ├─ Suspense 边界 A（Comments）：先发 Skeleton 占位
  │   后台取慢数据...数据 ready → 渲染 Comments → 追加 HTML + <script> 替换 Skeleton
  │
  └─ Suspense 边界 B（Recommendations）：先发 Spinner 占位
      数据 1s 就 ready 了（比 A 快）→ 不等 A → 立刻流式追加
```

**关键收益**：
- 不是"分两块"——是**有多少个 Suspense 边界就有多少条独立的流式通道**
- 每条通道只等自己的数据，互不阻塞
- 用户看到的不是"等全部 → 一次显示"，而是"渐进式出现"

**服务端代码示例**：

```js
import { renderToPipeableStream } from 'react-dom/server';

app.get('/', (req, res) => {
  const { pipe } = renderToPipeableStream(<App />, {
    bootstrapScripts: ['/main.js'],
    onShellReady() {
      res.setHeader('content-type', 'text/html');
      pipe(res); // 像水管一样持续输出
    },
    onShellError(error) {
      res.statusCode = 500;
      res.send('Server error');
    },
    onError(error) {
      console.error('Streaming error:', error);
    },
  });
});
```

**武器二：选择性 Hydrate（Selective Hydration）**

```jsx
// 客户端：React 17 → ReactDOM.hydrate（全量，不可中断）
// 客户端：React 18 → hydrateRoot（选择性，可中断）

import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root'), <App />);
```

`hydrateRoot` 配合 Suspense 实现选择性水合：

```
页面有多个 Suspense 边界：

┌────────────────────────────┐
│ <Header />        ← 立即 hydrate │
│ <Suspense>                      │
│   <Comments />     ← 慢 JS chunk│ → 先跳过，等 chunk 加载完再说
│ </Suspense>                     │
│ <Suspense>                      │
│   <Recommendations />           │
│ </Suspense>                     │  → 哪个先加载完就先 hydrate 哪个
│ <Footer />        ← 立即 hydrate │
└────────────────────────────┘

React 18 策略：
  1. Header/Footer 先 hydrate → 页面框架可交互
  2. Comments 的 JS chunk 还在加载？→ 这片区域保持"脱水"状态（显示 HTML，不可交互）
  3. Recommendations chunk 先到？→ 优先 hydrate Recommendations
  4. Comments chunk 也到了 → hydrate Comments
  5. 用户在此期间点击任何已 hydrate 的区域 → 立即响应

  → 被跳过的区域保持"脱水"状态
  → 哪个先 ready 就先 hydrate 哪个，不按顺序等
  → 即使部分区域还在 hydrate，已完成的区域已经可以交互
```

### 9.3 一图流对比

```
React 17 SSR：
  [==== 等全部数据 ====][== renderToString ==][== 发送 ==][=== hydrate 全部 ===]
  ↑ 慢数据拖住一切                                    ↑ 必须全部完成

React 18 SSR Streaming：
  [等 Shell 数据]                                      [hydrate Header/Sidebar]
       ↓ 先发送 Shell                                          ↓
  [==== 慢查询 ====]  ← 后台等                          [hydrate Comments]
       ↓ 流式追加 HTML                                       ↓
                                                    [hydrate Recommendations]
                                                    ↑ 选择性，可中断
```

### 9.4 与 Suspense 的关系（CSR 也有增强）

CSR 场景下 React 18 的 Suspense 也变聪明了——配合 `startTransition`，切换时新内容没 ready 就保持旧内容，不显示 fallback：

```jsx
function handleTabChange(tab) {
  startTransition(() => {
    setCurrentTab(tab);
  });
}
// 旧 tab 内容保持可见，直到新 tab 内容渲染完毕
// 不会看到 fallback 闪烁
```

### 9.5 面试话术

> "React 18 的 SSR Streaming 用流式输出替代了传统的一次性渲染。核心策略是：先把不需要异步数据的'壳子'渲染出来立即发浏览器，被 Suspense 包裹的慢组件先发 fallback 占位，后台取完数据后以流的方式追加发送。客户端配合 hydrateRoot 实现选择性水合——哪个组件先准备好就先让哪个可交互，不必等整个页面全量水合完成。
> 
> 这解决了传统 SSR 的四个'等'：等数据、等 HTML、等 JS、等 Hydrate。尤其适合性能差异大的页面，比如博客（正文很快，评论区很慢）、电商（商品详情很快，推荐区很慢）。"

---

## 十、React Server Components（RSC）

### 10.1 核心概念

RSC 是**只在服务端渲染、永远不会被 hydrate 到客户端**的 React 组件。它的代码和依赖永不进入客户端 bundle。

### 10.2 RSC vs 传统 SSR

| | 传统 SSR | RSC |
|---|---|---|
| 渲染产物 | HTML 字符串 | **RSC Payload**（序列化的 React Element Tree） |
| 客户端行为 | hydrate（下载 JS + 水合） | **不 hydrate**，用 Payload 重建 UI |
| 组件代码 | 打包到客户端 bundle | **零 bundle**——永远留在服务端 |
| 服务端能力 | 只能 `getServerSideProps` 预取 | **直接**查数据库、读文件 |

**最核心区别**：SSR 是"在服务端预渲染，然后所有东西搬到客户端继续跑"。RSC 是"有些东西永远待服务端，客户端只需要渲染结果"。

### 10.3 为什么要 RSC？

传统方案的矛盾——CSR 首屏慢 + bundle 大；SSR 首屏快了但 JS 体积没减少、水合开销没减少。RSC 打破"整个应用是一个整体"的假设：一个 `MarkdownRenderer`（200KB 依赖）、一个 `ProductList`（纯数据展示），它们的 JS 代码完全可以留在服务端。

### 10.4 RSC Payload 渲染流程

```
服务端：执行 Server Component → 查数据库 → 渲染 React Element Tree → 序列化为 RSC Payload
客户端：收到 Payload → React 用 Payload 重建 UI（不下载 Server Component 的 JS！）
        → 遇到 Client Component → 正常 hydrate
```

### 10.5 Server + Client 配合

```jsx
// === Server Component（默认）===
async function ProductPage({ productId }) {
  const product = await db.product.findUnique({ where: { id: productId } });
  return (
    <article>
      <h1>{product.name}</h1>
      <AddToCartButton productId={product.id} /> {/* Client Component */}
    </article>
  );
}

// === Client Component ===
'use client';
export function AddToCartButton({ productId }) {
  const [loading, setLoading] = useState(false);
  return <button onClick={...}>{loading ? '...' : 'Add'}</button>;
}
```

**规则**：Server 可以 import Client ✅；Client 不能 import Server ❌；单向边界。

### 10.6 三种组件类型

| 类型 | 标识 | 在哪渲染 | 能做什么 |
|------|------|---------|---------|
| Server Component | 默认 | 服务端 | 查数据库、读文件 |
| Client Component | `'use client'` | 客户端 | useState、事件处理 |
| Shared Component | 无标记、无 async | 取决于谁引用 | 纯展示
