# 深入讲解 React Fiber 架构

React Fiber 是 React 16 引入的革命性架构，它彻底改变了 React 的渲染机制，从同步阻塞式渲染转变为可中断、可恢复的异步渲染。下面我将从多个维度深入剖析 Fiber 架构。

## 一、为什么需要 Fiber？

### 1.1 Stack Reconciler 的致命缺陷

在 React 15 及之前版本，React 使用 **Stack Reconciler（栈协调器）**：

```javascript
// 伪代码：旧版递归渲染
function reconcileStack(currentTree) {
  // 递归遍历整个组件树
  currentTree.children.forEach(child => {
    reconcileStack(child); // 递归调用
  });
  
  // Diff + 更新真实 DOM
  updateDOM(currentTree);
}
```

**核心问题**：
- **同步阻塞**：一旦开始渲染，必须完成整个树的遍历
- **不可中断**：无法暂停渲染去处理更高优先级的任务
- **主线程占用**：大型组件树会导致页面卡顿、掉帧
- **用户体验差**：用户输入、动画等无法及时响应

**具体场景**：
```jsx
// 假设有一个包含 10,000 个列表项的组件
function LargeList() {
  return (
    <div>
      {Array.from({ length: 10000 }, (_, i) => (
        <ListItem key={i} data={getData(i)} />
      ))}
    </div>
  );
}

// 当状态变化触发重新渲染时：
// ❌ 旧版 React：阻塞主线程 100-200ms
// ❌ 用户点击无响应
// ❌ 动画卡顿
```

### 1.2 Fiber 的核心目标

Fiber 架构要解决的根本问题：

```
将"不可中断的递归渲染" 
→ 
拆分为"可中断、可恢复、可优先级调度的工作单元"
```

**设计目标**：
1. **可中断**：渲染过程中可以暂停
2. **可恢复**：暂停后可以从断点继续
3. **可插队**：高优先级任务可以打断低优先级任务
4. **可批量提交**：多个更新可以合并执行

## 二、Fiber 的核心概念

### 2.1 什么是 Fiber？

**Fiber 的本质**：

```
Fiber ≠ 虚拟 DOM
Fiber = 可调度的工作单元（Work Unit）
```

**Fiber 的双重含义**：
1. **数据结构**：代表组件实例或 DOM 节点的 JavaScript 对象
2. **工作单元**：包含渲染该节点所需的所有信息和状态

### 2.2 Fiber 节点的数据结构

一个简化的 Fiber 节点结构：

```javascript
{
  // ========== 核心标识 ==========
  type: 'div' | Component,           // 节点类型
  key: string | null,                // 唯一标识
  tag: number,                       // Fiber 类型（HostComponent、FunctionComponent 等）
  
  // ========== 树结构指针（链表）==========
  child: Fiber | null,               // 第一个子节点
  sibling: Fiber | null,             // 下一个兄弟节点
  return: Fiber | null,              // 父节点
  
  // ========== 双缓存机制 ==========
  alternate: Fiber | null,           // 指向另一棵树的对应节点
  
  // ========== 状态信息 ==========
  stateNode: DOM | ComponentInstance, // 对应的真实 DOM 或组件实例
  pendingProps: any,                 // 新的 props
  memoizedProps: any,                // 上次渲染的 props
  memoizedState: any,                // 上次渲染的 state
  
  // ========== 副作用标记 ==========
  flags: number,                     // 更新类型标记（Placement、Update、Deletion 等）
  subtreeFlags: number,              // 子树的副作用标记
  
  // ========== 调度信息 ==========
  lanes: number,                     // 优先级（React 18+）
  childLanes: number,                // 子树的优先级
  
  // ========== 其他信息 ==========
  index: number,                     // 在兄弟节点中的索引
  ref: any,                          // ref 引用
  dependencies: Dependencies | null, // 依赖项（用于 Context、Hooks）
  
  // ========== 工作相关 ==========
  updateQueue: UpdateQueue | null,   // 更新队列
  memoizedState: any,                // 记忆化的状态（用于 Hooks）
  nextEffect: Fiber | null,          // 副作用链表的下一个节点
}
```

### 2.3 Fiber 树的链表结构

**传统树形结构**：
```
        A
       / \
      B   C
     / \   \
    D   E   F
```

**Fiber 链表结构**（通过指针遍历）：
```
A
├─ child → B
│          ├─ sibling → C
│          │              └─ sibling → null
│          │
│          ├─ child → D
│          │          ├─ sibling → E
│          │          │              └─ sibling → null
│          │          └─ child → null
│          │
│          └─ return → A
│
└─ return → null
```

**遍历算法**（深度优先）：
```javascript
function traverseFiber(fiber) {
  let current = fiber;
  let returnFiber = null;
  
  while (current !== null) {
    // 处理当前节点
    workOnFiber(current);
    
    // 1. 如果有子节点，向下遍历
    if (current.child !== null) {
      current = current.child;
      continue;
    }
    
    // 2. 如果没有子节点，处理兄弟节点
    let sibling = current;
    while (sibling !== null) {
      // 处理兄弟节点
      workOnFiber(sibling);
      
      // 3. 如果有下一个兄弟，继续处理
      if (sibling.sibling !== null) {
        current = sibling.sibling;
        break;
      }
      
      // 4. 回到父节点
      sibling = sibling.return;
      if (sibling === null || sibling === fiber) {
        current = null;
        break;
      }
    }
  }
}
```

## 三、Fiber 架构的核心机制

### 3.1 双缓存机制（Double Buffering）

**概念**：
React 在内存中同时维护两棵 Fiber 树：
- **Current Tree**：当前屏幕上显示的内容
- **WorkInProgress Tree**：正在构建的、下一次要更新的内容

**工作流程**：
```
1. 状态变更触发更新
2. 基于 current 树创建 workInProgress 树的副本
3. 在 workInProgress 树上执行 diff 算法
4. 标记需要更新的节点（副作用）
5. 提交阶段：交换指针，workInProgress 树成为新的 current 树
6. 将副作用应用到真实 DOM
```

**代码实现**：
```javascript
// 创建 workInProgress 节点
function createWorkInProgress(current, pendingProps) {
  let workInProgress = current.alternate;
  
  if (workInProgress === null) {
    // 首次创建
    workInProgress = createFiber(current.tag, pendingProps, current.key);
    workInProgress.elementType = current.elementType;
    workInProgress.type = current.type;
    workInProgress.stateNode = current.stateNode;
    
    // 建立双缓存关系
    workInProgress.alternate = current;
    current.alternate = workInProgress;
  } else {
    // 复用已有的 workInProgress
    workInProgress.pendingProps = pendingProps;
    workInProgress.flags = NoFlags;
    workInProgress.subtreeFlags = NoFlags;
  }
  
  return workInProgress;
}

// 提交阶段的指针交换
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 交换 current 指针
  root.current = finishedWork;
  
  // 应用副作用到 DOM
  commitMutationEffects(finishedWork);
}
```

### 3.2 时间分片（Time Slicing）

**核心思想**：将渲染任务拆分成小块，每块执行时间不超过 5ms

**实现机制**：
```javascript
// 调度器核心逻辑
function workLoopConcurrent() {
  // 获取当前时间
  let currentTime = getCurrentTime();
  
  // 设置超时时间（5ms）
  let deadline = currentTime + 5;
  
  // 循环处理 Fiber 节点
  while (workInProgress !== null && !shouldYield()) {
    // 处理单个 Fiber 节点
    performUnitOfWork(workInProgress);
  }
  
  // 检查是否应该让出主线程
  function shouldYield() {
    // 检查是否超过时间片
    if (getCurrentTime() >= deadline) {
      // 让出主线程给浏览器
      return true;
    }
    
    // 检查是否有更高优先级的任务
    if (hasHigherPriorityWork()) {
      return true;
    }
    
    return false;
  }
}

// 让出主线程
function shouldYieldToHost() {
  // 使用 requestIdleCallback 或 scheduler 包
  return getCurrentTime() >= deadline;
}
```

### 3.3 优先级调度（Lane Model）

**优先级分类**（React 18）：

```javascript
// 优先级常量（位运算）
export const NoLane = 0b0000000000000000000000000000000;
export const SyncLane = 0b0000000000000000000000000000001;
export const InputContinuousLane = 0b0000000000000000000000000000100;
export const DefaultLane = 0b0000000000000000000000000010000;
export const TransitionLane = 0b0000000000000000000001000000000;
export const RetryLane = 0b0000000000000000000010000000000;
export const SelectiveHydrationLane = 0b0000000000000000000100000000000;
export const IdleLane = 0b0000000000000000001000000000000;
export const OffscreenLane = 0b0000000000000000010000000000000;
```

**优先级对应场景**：
```
SyncLane (1)           → 紧急更新（useSyncExternalStore、flushSync）
InputContinuousLane (4) → 连续输入（鼠标移动、滚动）
DefaultLane (16)        → 普通更新（setState、useEffect）
TransitionLane (256)    → 过渡更新（startTransition）
RetryLane (1024)        → 重试更新（Suspense 重试）
IdleLane (4096)         → 空闲更新（useIdleValue）
OffscreenLane (8192)    → 离屏更新（Suspense、Offscreen）
```

**优先级调度实现**：
```javascript
// 根据更新类型获取优先级
function requestUpdateLane(fiber) {
  // 检查是否有处于渲染中的更新
  const isRendering = isRenderingPhase();
  
  // 根据上下文确定优先级
  if (isRendering) {
    // 渲染中的更新使用当前优先级
    return renderLanes;
  }
  
  // 获取当前上下文的优先级
  const transition = ReactCurrentBatchConfig.transition;
  if (transition !== null) {
    // Transition 更新
    return claimNextTransitionLane();
  }
  
  // 默认更新
  return claimNextDefaultLane();
}

// 调度更新
function scheduleUpdateOnFiber(fiber, lane) {
  // 标记该 Fiber 需要更新
  markRootUpdated(root, lane);
  
  // 确保调度器会处理这个更新
  ensureRootIsScheduled(root);
  
  // 如果是同步更新，立即执行
  if (lane === SyncLane) {
    performSyncWorkOnRoot(root);
  }
}
```

## 四、Fiber 的工作流程

### 4.1 整体架构

```
┌─────────────────────────────────────────────────┐
│              React 应用层                         │
│  (Components, Hooks, setState, useEffect...)    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│              调度器 (Scheduler)                   │
│  - 优先级调度                                     │
│  - 时间分片                                       │
│  - 任务队列管理                                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│              协调器 (Reconciler)                  │
│  - Fiber 树构建                                   │
│  - Diff 算法                                      │
│  - 副作用标记                                     │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│              渲染器 (Renderer)                    │
│  - DOM 操作 (React DOM)                          │
│  - 副作用提交                                     │
└─────────────────────────────────────────────────┘
```

### 4.2 渲染阶段（Render Phase）

**阶段一：beginWork（递阶段）**

```javascript
function beginWork(current, workInProgress, renderLanes) {
  // 检查是否可以跳过更新（bailout）
  if (current !== null) {
    const oldProps = current.memoizedProps;
    const newProps = workInProgress.pendingProps;
    
    if (
      oldProps !== newProps ||
      hasContextChanged() ||
      // 检查是否有更新
      (workInProgress.updateQueue !== null && 
       workInProgress.updateQueue.shared.pending !== null)
    ) {
      // 需要更新，继续处理
    } else {
      // 可以跳过，直接复用子节点
      return bailoutOnAlreadyFinishedWork(current, workInProgress, renderLanes);
    }
  }
  
  // 根据 Fiber 类型调用不同的处理函数
  switch (workInProgress.tag) {
    case FunctionComponent:
      return updateFunctionComponent(current, workInProgress, renderLanes);
      
    case ClassComponent:
      return updateClassComponent(current, workInProgress, renderLanes);
      
    case HostComponent:
      return updateHostComponent(current, workInProgress, renderLanes);
      
    case HostText:
      return updateHostText(current, workInProgress);
      
    // ... 其他类型
  }
}

// 处理函数组件
function updateFunctionComponent(current, workInProgress, renderLanes) {
  // 获取组件函数
  const Component = workInProgress.type;
  
  // 设置 Hooks 相关上下文
  prepareToReadContext(workInProgress, renderLanes);
  const children = renderWithHooks(
    current,
    workInProgress,
    Component,
    workInProgress.pendingProps,
    workInProgress.ref,
    renderLanes
  );
  
  // 协调子节点
  reconcileChildren(current, workInProgress, children, renderLanes);
  
  return workInProgress.child;
}
```

**阶段二：completeWork（归阶段）**

```javascript
function completeWork(current, workInProgress, renderLanes) {
  // 根据 Fiber 类型处理
  switch (workInProgress.tag) {
    case HostComponent:
      // 创建或更新 DOM 节点
      const instance = workInProgress.stateNode;
      
      if (instance === null) {
        // 首次渲染，创建 DOM 节点
        const currentHostContext = getHostContext();
        instance = createInstance(
          workInProgress.type,
          workInProgress.pendingProps,
          workInProgress.rootContainerInstance,
          currentHostContext,
          workInProgress
        );
        workInProgress.stateNode = instance;
        
        // 标记为需要插入
        markUpdate(workInProgress);
      } else {
        // 更新渲染，处理 props 变化
        const oldProps = current.memoizedProps;
        const newProps = workInProgress.pendingProps;
        
        if (oldProps !== newProps) {
          markUpdate(workInProgress);
        }
      }
      
      // 处理子节点
      appendAllChildren(instance, workInProgress, false, false);
      break;
      
    case HostText:
      // 处理文本节点
      const newText = workInProgress.pendingProps;
      if (instance === null) {
        instance = createTextInstance(newText);
        workInProgress.stateNode = instance;
        markUpdate(workInProgress);
      } else {
        const oldText = current.memoizedProps;
        if (oldText !== newText) {
          markUpdate(workInProgress);
        }
      }
      break;
      
    // ... 其他类型
  }
  
  // 返回父节点继续处理
  return workInProgress.return;
}
```

### 4.3 副作用收集（Effect List）

**副作用链表构建**：

```javascript
// 在 completeWork 阶段收集副作用
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    
    // 收集子树的副作用
    if (returnFiber !== null) {
      returnFiber.subtreeFlags |= completedWork.subtreeFlags;
      returnFiber.subtreeFlags |= completedWork.flags;
    }
    
    // 将有副作用的节点加入 effect 链表
    const flags = completedWork.flags;
    if (flags !== NoFlags) {
      if (returnFiber !== null) {
        if (returnFiber.lastEffect === null) {
          returnFiber.firstEffect = completedWork;
        } else {
          returnFiber.lastEffect.nextEffect = completedWork;
        }
        returnFiber.lastEffect = completedWork;
      }
    }
    
    completedWork = returnFiber;
  } while (completedWork !== null);
}
```

### 4.4 提交阶段（Commit Phase）

**三个子阶段**：

```javascript
function commitRoot(root) {
  const finishedWork = root.finishedWork;
  
  // 阶段一：Before Mutation（DOM 变更前）
  commitBeforeMutationEffects(root, finishedWork);
  
  // 阶段二：Mutation（DOM 变更）
  commitMutationEffects(root, finishedWork, lanes);
  
  // 交换 current 指针
  root.current = finishedWork;
  
  // 阶段三：Layout（DOM 变更后）
  commitLayoutEffects(finishedWork, root, lanes);
  
  return null;
}

// 阶段一：Before Mutation
function commitBeforeMutationEffects(root, firstChild) {
  let fiber = firstChild;
  
  while (fiber !== null) {
    const primaryFlags = fiber.flags & (
      Snapshot | 
      BeforeMutationMask
    );
    
    if (primaryFlags !== NoFlags) {
      // 执行 getSnapshotBeforeUpdate
      commitBeforeMutationEffectOnFiber(root, fiber);
    }
    
    // 遍历子树
    const child = fiber.child;
    if ((fiber.subtreeFlags & BeforeMutationMask) !== NoFlags && child !== null) {
      child.return = fiber;
      fiber = child;
      continue;
    }
    
    // 回溯
    if (fiber === finishedWork) {
      return;
    }
    
    while (fiber.sibling === null) {
      fiber = fiber.return;
      if (fiber === null || fiber === finishedWork) {
        return;
      }
    }
    fiber.sibling.return = fiber.return;
    fiber = fiber.sibling;
  }
}

// 阶段二：Mutation
function commitMutationEffects(root, firstChild, lanes) {
  let fiber = firstChild;
  
  while (fiber !== null) {
    const flags = fiber.flags;
    
    // 处理 Placement（插入）
    if (flags & Placement) {
      commitPlacement(fiber);
      fiber.flags &= ~Placement;
    }
    
    // 处理 Update（更新）
    if (flags & Update) {
      commitWork(fiber.alternate, fiber);
      fiber.flags &= ~Update;
    }
    
    // 处理 Deletion（删除）
    if (flags & Deletion) {
      commitDeletion(root, fiber, lanes);
      fiber.flags &= ~Deletion;
    }
    
    // 处理 Ref
    if (flags & Ref) {
      commitAttachRef(fiber);
      fiber.flags &= ~Ref;
    }
    
    // 遍历子树
    const child = fiber.child;
    if ((fiber.subtreeFlags & MutationMask) !== NoFlags && child !== null) {
      child.return = fiber;
      fiber = child;
      continue;
    }
    
    // 回溯
    if (fiber === finishedWork) {
      return;
    }
    
    while (fiber.sibling === null) {
      fiber = fiber.return;
      if (fiber === null || fiber === finishedWork) {
        return;
      }
    }
    fiber.sibling.return = fiber.return;
    fiber = fiber.sibling;
  }
}

// 阶段三：Layout
function commitLayoutEffects(finishedWork, root, committedLanes) {
  let fiber = finishedWork;
  
  while (fiber !== null) {
    const flags = fiber.flags;
    
    // 执行 componentDidMount / componentDidUpdate
    if (flags & Update) {
      commitLayoutEffectOnFiber(root, current, fiber, committedLanes);
    }
    
    // 处理 Ref
    if (flags & Ref) {
      commitAttachRef(fiber);
    }
    
    // 遍历子树
    const child = fiber.child;
    if ((fiber.subtreeFlags & LayoutMask) !== NoFlags && child !== null) {
      child.return = fiber;
      fiber = child;
      continue;
    }
    
    // 回溯
    if (fiber === finishedWork) {
      return;
    }
    
    while (fiber.sibling === null) {
      fiber = fiber.return;
      if (fiber === null || fiber === finishedWork) {
        return;
      }
    }
    fiber.sibling.return = fiber.return;
    fiber = fiber.sibling;
  }
}
```

## 五、Fiber 的核心算法

### 5.1 workLoop（工作循环）

```javascript
// 同步工作循环
function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// 异步工作循环（可中断）
function workLoopConcurrent() {
  while (workInProgress !== null && !shouldYield()) {
    performUnitOfWork(workInProgress);
  }
}

// 执行单个工作单元
function performUnitOfWork(unitOfWork) {
  // 获取当前处理的 Fiber
  const current = unitOfWork.alternate;
  
  // beginWork：处理当前节点，返回子节点
  let next = beginWork(current, unitOfWork, renderLanes);
  
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  
  if (next === null) {
    // 没有子节点，进入 complete 阶段
    completeUnitOfWork(unitOfWork);
  } else {
    // 有子节点，继续处理
    workInProgress = next;
  }
  
  // 重置工作进度
  ReactCurrentOwner.current = null;
}

// 完成工作单元
function completeUnitOfWork(unitOfWork) {
  let completedWork = unitOfWork;
  
  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    
    // completeWork：处理节点，创建/更新 DOM
    const next = completeWork(current, completedWork, renderLanes);
    
    if (next !== null) {
      // 有剩余工作，继续处理
      workInProgress = next;
      return;
    }
    
    // 收集副作用
    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      // 有兄弟节点，处理兄弟
      workInProgress = siblingFiber;
      return;
    }
    
    // 回到父节点
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
  
  // 所有工作完成
  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
}
```

### 5.2 调度器（Scheduler）

```javascript
// 调度器核心
const scheduler = {
  // 任务队列
  taskQueue: [],
  
  // 当前正在执行的任务
  currentTask: null,
  
  // 下一个任务的执行时间
  currentTime: getCurrentTime(),
  
  // 调度任务
  scheduleCallback(priorityLevel, callback) {
    const currentTime = getCurrentTime();
    const startTime = currentTime;
    const timeout = getTimeout(priorityLevel);
    const expirationTime = startTime + timeout;
    
    // 创建任务
    const newTask = {
      id: taskIdCounter++,
      callback,
      priorityLevel,
      startTime,
      expirationTime,
      sortIndex: -1,
    };
    
    newTask.sortIndex = expirationTime;
    
    // 加入任务队列
    push(taskQueue, newTask);
    
    // 如果当前没有任务在执行，立即开始
    if (!isPerformingWork && !isHostCallbackScheduled) {
      isHostCallbackScheduled = true;
      requestHostCallback(flushWork);
    }
    
    return newTask;
  },
  
  // 执行任务
  flushWork(hasTimeRemaining, initialTime) {
    isHostCallbackScheduled = false;
    isPerformingWork = true;
    
    try {
      return workLoop(hasTimeRemaining, initialTime);
    } finally {
      currentTask = null;
      currentTime = getCurrentTime();
      isPerformingWork = false;
    }
  },
  
  // 工作循环
  workLoop(hasTimeRemaining, initialTime) {
    let currentTime = initialTime;
    currentTask = peek(taskQueue);
    
    while (currentTask !== null) {
      if (
        currentTask.expirationTime > currentTime &&
        (!hasTimeRemaining || shouldYieldToHost())
      ) {
        // 时间片用完，暂停执行
        break;
      }
      
      const callback = currentTask.callback;
      if (typeof callback === 'function') {
        currentTask.callback = null;
        const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
        
        // 执行回调
        const continuationCallback = callback(didUserCallbackTimeout);
        
        currentTime = getCurrentTime();
        
        if (typeof continuationCallback === 'function') {
          // 回调返回了新的函数，继续执行
          currentTask.callback = continuationCallback;
        } else {
          // 任务完成，从队列中移除
          if (currentTask === peek(taskQueue)) {
            pop(taskQueue);
          }
        }
      } else {
        pop(taskQueue);
      }
      
      currentTask = peek(taskQueue);
    }
    
    // 如果还有任务，继续调度
    if (currentTask !== null) {
      return true;
    } else {
      return false;
    }
  }
};
```

## 六、Fiber 架构的优势

### 6.1 性能优势

**时间分片对比**：

```javascript
// 传统同步渲染（阻塞 100ms）
[||||||||||||||||||||||||||||||||||||||||] 100ms

// Fiber 异步渲染（分片执行）
[||||] 5ms → 浏览器渲染 → [||||] 5ms → 浏览器渲染 → ...

// 用户体验：
// ✅ 页面不会卡顿
// ✅ 用户输入能及时响应
// ✅ 动画流畅
```

### 6.2 并发特性支持

**Suspense**：
```jsx
<Suspense fallback={<Spinner />}>
  <ProfileDetails />
</Suspense>
```

**Transitions**：
```jsx
const [isPending, startTransition] = useTransition();

function handleClick() {
  startTransition(() => {
    // 这个更新会被标记为低优先级
    setSearchQuery(input);
  });
}
```

**Selective Hydration**：
```jsx
// 优先水合用户交互的组件
<button onClick={handleClick}>Click me</button>
// 其他组件可以延迟水合
```

### 6.3 优先级调度的实际应用

```jsx
// 高优先级：用户输入
<input 
  value={searchQuery} 
  onChange={(e) => setSearchQuery(e.target.value)}
/>

// 低优先级：数据获取
const [data, setData] = useState(null);

useEffect(() => {
  startTransition(() => {
    fetchData().then(setData);
  });
}, []);

// 紧急更新：表单提交
function handleSubmit() {
  flushSync(() => {
    setFormSubmitted(true);
  });
  // 表单立即更新，用户看到提交状态
}
```

## 七、Fiber 架构的演进

### 7.1 React 16：Fiber 初版

- 引入 Fiber 架构
- 支持异步渲染
- 时间分片
- 优先级调度（基础版）

### 7.2 React 17：优化和完善

- 事件系统重构
- 新的 JSX 转换
- 改进的 Suspense

### 7.3 React 18：并发特性正式发布

- **Automatic Batching**：自动批处理
- **Transitions**：startTransition API
- **Suspense on the Server**：服务端 Suspense
- **Selective Hydration**：选择性水合
- **useDeferredValue**：延迟值
- **useSyncExternalStore**：外部存储同步

### 7.4 React 19（预览）：进一步优化

- **Actions**：简化数据获取
- **use**：统一异步 API
- **Asset Loading**：资源加载优化
- **Document Metadata**：文档元数据管理

## 八、调试和性能分析

### 8.1 React DevTools

```javascript
// 查看 Fiber 树
// React DevTools → Components → 右键组件 → "Show Source"
```

### 8.2 Profiler API

```jsx
<Profiler id="List" onRender={onRenderCallback}>
  <List items={items} />
</Profiler>

function onRenderCallback(
  id, // Profiler 树的 id
  phase, // "mount" 或 "update"
  actualDuration, // 实际渲染时间
  baseDuration, // 估计的渲染时间
  startTime, // 开始时间
  commitTime, // 提交时间
  interactions // 交互信息
) {
  console.log(`${id} ${phase} took ${actualDuration}ms`);
}
```

### 8.3 性能优化建议

```jsx
// ✅ 使用 React.memo 避免不必要的重渲染
const MemoizedComponent = React.memo(Component);

// ✅ 使用 useMemo 缓存计算结果
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);

// ✅ 使用 useCallback 缓存函数
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);

// ✅ 使用 key 优化列表渲染
{items.map(item => <Item key={item.id} item={item} />)}

// ✅ 使用 Suspense 进行代码分割
const LazyComponent = React.lazy(() => import('./Component'));
<Suspense fallback={<Spinner />}>
  <LazyComponent />
</Suspense>
```

## 九、总结

React Fiber 架构是 React 发展史上的里程碑，它通过以下核心机制彻底改变了 React 的渲染方式：

### 核心创新点

1. **链表数据结构**：替代递归栈，支持可中断遍历
2. **双缓存机制**：current 和 workInProgress 两棵树
3. **时间分片**：将渲染任务拆分为小块，避免阻塞
4. **优先级调度**：根据任务重要性动态调度
5. **副作用收集**：通过 effect 链表高效管理更新

### 架构优势

- ✅ **可中断**：渲染过程中可以暂停
- ✅ **可恢复**：从断点继续执行
- ✅ **可插队**：高优先级任务优先执行
- ✅ **并发渲染**：支持 Suspense、Transitions 等特性
- ✅ **性能优化**：避免主线程长时间阻塞

### 对开发者的影响

- 更好的用户体验（响应更快）
- 更灵活的渲染控制
- 更强大的并发能力
- 更丰富的性能优化手段

Fiber 架构不仅是 React 的技术革新，更是现代前端框架设计的重要参考，它展示了如何在保持声明式编程优势的同时，实现高性能的异步渲染。