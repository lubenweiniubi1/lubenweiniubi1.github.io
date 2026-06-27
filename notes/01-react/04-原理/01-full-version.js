/**
 * ============================================================
 * Didact — 从零实现 React (Build Your Own React)
 * 参考: https://pomb.us/build-your-own-react/
 * ============================================================
 *
 * 这篇代码完整实现了 React 核心机制，对应教程的 Step I ~ Step VIII。
 * 整体执行流程概览：
 *
 *   render()                     ← 入口：创建 root fiber，设为 nextUnitOfWork
 *     ↓
 *   workLoop()                   ← 浏览器空闲时循环执行工作单元（可中断！）
 *     ↓
 *   performUnitOfWork()          ← 处理单个 fiber 节点
 *     ├─ updateFunctionComponent()  ← 处理函数组件（如 <App />）
 *     │    ├─ 执行函数获取 children
 *     │    ├─ useState() 在这里被调用
 *     │    └─ reconcileChildren()   ← 调和：对比新旧 fiber
 *     └─ updateHostComponent()      ← 处理原生节点（如 <div />）
 *          ├─ createDom()           ← 创建真实 DOM
 *          └─ reconcileChildren()
 *     ↓
 *   commitRoot()                 ← 所有工作单元完成后，一次性提交到 DOM
 *     ├─ commitWork()            ← 根据 effectTag 增/删/改 DOM
 *     └─ commitDeletion()        ← 处理函数组件无 dom 节点的删除
 *
 * 核心概念速查：
 *   - Fiber:      每个 React 元素对应的"工作单元"对象，通过 child/sibling/parent 链成树
 *   - effectTag:  标记这个 fiber 要做什么操作 — PLACEMENT(新增) / UPDATE(更新) / DELETION(删除)
 *   - wipRoot:    "work in progress root" — 正在构建中的 fiber 树根节点
 *   - currentRoot: 上一次提交到 DOM 的 fiber 树根节点，用于 diff 对比
 *   - Reconciliation (调和/协调): 对比新旧 fiber，决定复用/新增/删除
 *   - Commit Phase: 把 fiber 树的变化一次性应用到真实 DOM
 * ============================================================
 */

// ============================================================
// Step I: createElement —— 把 JSX 转成"虚拟 DOM"对象
// ============================================================
// JSX 编译后就是调用这个函数，例如：
//   <div id="foo">hello</div>
// 会被 Babel 编译为：
//   Didact.createElement("div", { id: "foo" }, "hello")
// 这个函数返回一个普通的 JS 对象（React 元素），不是真实 DOM。
function createElement(type, props, ...children) {
  return {
    type,       // "div" / "h1" / 函数组件（如 App）
    props: {
      ...props, // 如 { id: "foo" }
      children: children.map(child =>
        typeof child === "object"
          ? child                          // 已经是 createElement 返回的对象，直接保留
          : createTextElement(child)       // 原始值（字符串/数字）包装成 TEXT_ELEMENT
      ),
    },
  }
}

// 文本节点没有 type，我们用特殊标记 "TEXT_ELEMENT" 来区分。
// 真实的 React 不会这样处理，这里是为了简化。
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,    // 文本内容
      children: [],       // 文本节点没有孩子
    },
  }
}

// ============================================================
// Step II & V: createDom —— 把"虚拟 DOM"对象变成真实 DOM 节点
// ============================================================
// 根据 fiber 的 type 创建真实的 HTMLElement 或 TextNode。
// 注意：这里只创建节点，不插入页面（插入在 commit 阶段做）。
function createDom(fiber) {
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")        // 文本节点
      : document.createElement(fiber.type) // 普通元素如 div / h1

  // 把 fiber.props 上的属性（除了 children）挂到真实 DOM 上
  // 初始调用时 prevProps = {}，所以所有属性都是"新增"
  updateDom(dom, {}, fiber.props)

  return dom
}

// ============================================================
// Step VI: updateDom —— 对比新旧 props，更新真实 DOM
// ============================================================
// 辅助函数：判断一个 prop 是否是事件（如 onClick / onMouseMove）
const isEvent = key => key.startsWith("on")
// 辅助函数：判断一个 prop 是否是普通属性（不是 children 也不是事件）
const isProperty = key =>
  key !== "children" && !isEvent(key)
// 辅助函数：判断 prop 在新旧 props 之间是否变了
const isNew = (prev, next) => key =>
  prev[key] !== next[key]
// 辅助函数：判断 prop 是否在新 props 中被删除了
const isGone = (prev, next) => key => !(key in next)

function updateDom(dom, prevProps, nextProps) {
  // 1️⃣ 移除旧的/变化的事件监听器
  //    如果事件处理函数变了或者事件被删了，先解绑旧的
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        !(key in nextProps) ||                // 事件在新 props 中不存在了
        isNew(prevProps, nextProps)(key)       // 事件处理函数变了
    )
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)                         // "onClick" → "click"
      dom.removeEventListener(
        eventType,
        prevProps[name]
      )
    })

  // 2️⃣ 移除旧 props 中有但新 props 中没有的普通属性
  //    例如之前有 title="foo"，现在没有了 → 把 dom.title 清空
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // 3️⃣ 设置新增的或变化了的普通属性
  //    例如之前 title="foo" 现在 title="bar" → dom.title = "bar"
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })

  // 4️⃣ 添加新的事件监听器
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name
        .toLowerCase()
        .substring(2)
      dom.addEventListener(
        eventType,
        nextProps[name]
      )
    })
}

// ============================================================
// Step V: commitRoot —— 把所有变更一次性提交到 DOM
// ============================================================
// 为什么需要 commit 阶段？
//   因为 workLoop 是可中断的（浏览器空闲时才执行），
//   如果每处理一个 fiber 就立刻操作 DOM，
//   用户可能看到"半成品"的 UI。
//   所以我们在 fiber 树上只打标记（effectTag），
//   等所有工作单元都完成了，再一次性 apply 到 DOM。
function commitRoot() {
  // 先处理需要删除的节点（见 Step VI Reconciliation）
  deletions.forEach(commitWork)
  // 从 wipRoot.child 开始递归提交（wipRoot.dom 就是 container 本身）
  commitWork(wipRoot.child)
  // 提交完毕后，把当前树保存为"旧树"，供下一次渲染 diff 使用
  currentRoot = wipRoot
  wipRoot = null
}

// 递归地处理每个 fiber 的 effectTag
function commitWork(fiber) {
  if (!fiber) {
    return
  }

  // Step VII: 函数组件的 fiber 没有 dom 节点！
  // 所以不能直接用 fiber.parent.dom 找父 DOM，
  // 必须沿着 fiber.parent 往上找到第一个有 dom 的 fiber。
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  // 根据 effectTag 决定怎么操作真实 DOM
  if (
    fiber.effectTag === "PLACEMENT" &&
    fiber.dom != null
  ) {
    // 🆕 新增：把新节点挂到父 DOM 下
    domParent.appendChild(fiber.dom)
  } else if (
    fiber.effectTag === "UPDATE" &&
    fiber.dom != null
  ) {
    // 🔄 更新：对比新旧 props 来更新 DOM 属性
    updateDom(
      fiber.dom,
      fiber.alternate.props,   // 旧 props
      fiber.props               // 新 props
    )
  } else if (fiber.effectTag === "DELETION") {
    // 🗑️ 删除：见 commitDeletion
    commitDeletion(fiber, domParent)
  }

  // 递归处理孩子和兄弟
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

// Step VII: 函数组件没有 dom 节点，删除时需要特殊处理
// 对于函数组件，需要往它的 child 找下去，直到找到有 dom 的 fiber
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    // 有 dom 直接删
    domParent.removeChild(fiber.dom)
  } else {
    // 没有 dom（函数组件），继续向下找孩子
    commitDeletion(fiber.child, domParent)
  }
}

// ============================================================
// render —— 入口函数，一切从这里开始
// ============================================================
// 对比 Step II 最简单的 render（直接递归创建 DOM），
// 现在的 render 只做一件事：创建 root fiber 并设为工作起点。
// 实际的 DOM 创建发生在 workLoop → performUnitOfWork → commitRoot 这条链路上。
function render(element, container) {
  // wipRoot 是整个 fiber 树的根节点
  // 注意它的 dom 就是 container 本身（如 <div id="root"></div>）
  wipRoot = {
    dom: container,               // 容器 DOM
    props: {
      children: [element],        // 把传入的元素作为孩子
    },
    alternate: currentRoot,       // 🔑 指向旧 fiber 树的根，用于 diff
    // 第一次 render 时 currentRoot 为 null，所以 alternate 为 null
  }
  deletions = []                  // 清空待删除列表
  nextUnitOfWork = wipRoot        // 设为下一个工作单元，workLoop 会处理它
}

// ============================================================
// Step III & IV & V: 全局状态变量
// ============================================================
// 这些是"模块级全局变量"，是理解整个流程的关键！

// nextUnitOfWork: 下一个要处理的工作单元（fiber）
//   workLoop 每次循环取这个，处理完一个再取下一个
let nextUnitOfWork = null

// currentRoot: 上一次成功提交到 DOM 的 fiber 树根节点
//   用于下一次 render 时做 diff（对比），看哪些变了
let currentRoot = null

// wipRoot: "work in progress root" — 当前正在构建的 fiber 树根
//   当 nextUnitOfWork 为 null（所有工作完成）且 wipRoot 不为 null 时，
//   意味着可以 commit 了（见 workLoop）
let wipRoot = null

// deletions: 需要从 DOM 删除的旧 fiber 列表
//   在 reconcileChildren 中，当发现旧 fiber 类型和新元素类型不同时，
//   就把旧 fiber 记到这里，等 commit 阶段批量删除
let deletions = null

// ============================================================
// Step III: workLoop —— 可中断的工作循环（Concurrent Mode 核心！）
// ============================================================
// 这是 React 能实现"并发"的关键。
//
// 使用 requestIdleCallback（浏览器空闲时回调）：
//   - deadline.timeRemaining() 返回当前帧还剩多少毫秒
//   - 如果快没时间了（< 1ms），就让出控制权给浏览器
//   - 浏览器处理完用户交互/动画后，会再次调用 workLoop
//
// 这样即使 fiber 树很大，也不会长时间阻塞主线程，
// 用户点击、滚动依然流畅。
function workLoop(deadline) {
  let shouldYield = false

  // 循环：只要还有工作单元，且本帧还有剩余时间，就一直处理
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    // 检查本帧剩余时间，如果不足 1ms 就让出控制权
    shouldYield = deadline.timeRemaining() < 1
  }

  // 🔑 所有工作单元都处理完了（nextUnitOfWork === null）
  // 且有待提交的 wipRoot → 一次性提交到 DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }

  // 注册下一次空闲回调，形成循环
  requestIdleCallback(workLoop)
}

// 启动工作循环！这个调用会让 workLoop 在浏览器空闲时开始执行
requestIdleCallback(workLoop)

// ============================================================
// Step IV & VII: performUnitOfWork —— 处理单个 fiber（工作单元）
// ============================================================
// 每个 fiber 节点处理包括：
//   1. 创建/更新 DOM（或执行函数组件）
//   2. 为孩子创建 fiber（reconcileChildren）
//   3. 返回下一个工作单元（child → sibling → uncle → ... → root → done）
//
// 返回下一个 fiber 的规则（Step IV 的核心）：
//   - 优先返回 child（深度优先）
//   - 没 child 就返回 sibling
//   - 没 sibling 就往上找 parent.sibling（叔叔）
//   - 一直找到 root，返回 undefined → 所有工作完成
function performUnitOfWork(fiber) {
  // Step VII: 判断是函数组件还是原生元素
  //   函数组件的 type 是函数（如 function App(props) {...}）
  //   原生元素的 type 是字符串（如 "div"、"h1"）
  const isFunctionComponent =
    fiber.type instanceof Function

  if (isFunctionComponent) {
    updateFunctionComponent(fiber)    // 执行函数，获取 children
  } else {
    updateHostComponent(fiber)        // 创建真实 DOM
  }

  // 返回下一个工作单元（见 fiber 树遍历规则）
  if (fiber.child) {
    return fiber.child                // 1. 优先 child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling        // 2. 没 child 找 sibling
    }
    nextFiber = nextFiber.parent      // 3. 往上找 parent 的 sibling（叔叔）
  }
  // 4. 到 root 了，返回 undefined → 所有工作完成 → workLoop 进入 commit
}

// ============================================================
// Step VIII: 函数组件相关
// ============================================================

// wipFiber: 当前正在处理的函数组件的 fiber（给 useState 用的上下文）
let wipFiber = null
// hookIndex: 当前 hook 在 hooks 数组中的索引
//   每次调用 useState 时自增，支持同一个组件多次调用 useState
let hookIndex = null

// Step VII: updateFunctionComponent
// 函数组件有两个特点：
//   1. 没有自己的 DOM 节点（不像 <div> 可以 document.createElement）
//   2. children 不是从 props.children 取的，而是执行函数拿返回值
function updateFunctionComponent(fiber) {
  // 设置全局变量，让 useState 能知道"当前是哪个组件在调用我"
  wipFiber = fiber
  hookIndex = 0               // 每次渲染从第 0 个 hook 开始
  wipFiber.hooks = []          // 初始化 hooks 数组（支持多次调用 useState）

  // 🔑 核心：执行函数组件！fiber.type 就是那个函数
  //   例如 fiber.type = Counter 函数，
  //   执行 Counter(fiber.props) 返回 <h1>Count: 1</h1> 对应的 element 对象
  const children = [fiber.type(fiber.props)]

  // 然后对函数返回的 element 进行调和（和原生元素一样）
  reconcileChildren(fiber, children)
}

// Step VIII: useState —— 函数组件的状态管理
// 这是整个实现中最精妙的部分！
//
// 使用示例：
//   const [count, setCount] = Didact.useState(0)
//   setCount(c => c + 1)  // 触发重新渲染
function useState(initial) {
  // 1️⃣ 找旧 hook：通过 alternate（旧 fiber）和 hookIndex 定位到对应的旧 hook
  //    第一次渲染时 alternate 为 null，所以 oldHook 为 undefined
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]

  // 2️⃣ 创建新 hook：如果旧 hook 存在就复用它的 state，否则用 initial
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],          // 待执行的 action 队列
  }

  // 3️⃣ 执行所有排队中的 action（来自上一次 setState 的调用）
  //    注意：action 是函数，接收旧 state 返回新 state
  //    例如 action = c => c + 1
  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state)   // 依次 apply 所有 action 到 state
  })

  // 4️⃣ setState：用户调用它来更新状态
  //    它不立刻更新 state，而是把 action push 到队列里，
  //    然后触发一次新的渲染（通过设置 nextUnitOfWork）
  const setState = action => {
    hook.queue.push(action)

    // 🔑 触发重新渲染：以 currentRoot 为基础创建新的 wipRoot
    //    alternate 指向 currentRoot，这样 reconcileChildren 可以做 diff
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot    // 启动新一轮 workLoop
    deletions = []              // 清空删除列表
  }

  // 5️⃣ 记录 hook，推进索引
  wipFiber.hooks.push(hook)
  hookIndex++
  // 返回 [state, setState] 元组，和 React 一模一样
  return [hook.state, setState]
}

// Step VII: updateHostComponent —— 处理原生元素（div / h1 / span 等）
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)    // 创建真实 DOM 节点
  }
  // 为孩子元素创建 fiber（见 reconcileChildren）
  reconcileChildren(fiber, fiber.props.children)
}

// ============================================================
// Step IV & VI: reconcileChildren —— 调和/协调（diff 核心！）
// ============================================================
// 这是 React 的灵魂所在。
// 对比旧的 fiber 节点和新的元素，决定要不要：
//   - 复用旧的 DOM（UPDATE）
//   - 创建新的 DOM（PLACEMENT）
//   - 删除旧的 DOM（DELETION）
//
// 同时还要维护 fiber 树的结构：建立 child / sibling / parent 关系。
//
// 参数说明：
//   wipFiber: 当前正在处理的 fiber（父 fiber）
//   elements: 这个 fiber 的孩子元素数组（来自 props.children）
function reconcileChildren(wipFiber, elements) {
  let index = 0
  // oldFiber: 旧 fiber 树的子节点链表头
  //   第一次渲染时 wipFiber.alternate 为 null，所以 oldFiber 为 undefined
  let oldFiber =
    wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null   // 上一个兄弟 fiber（用于建立 sibling 链）

  // 同时遍历新 elements 数组和旧 fiber 链表
  // 条件用 || 而不是 &&：如果新数组更长（新增节点），或者旧链表更长（删除节点），都要处理
  while (
    index < elements.length ||
    oldFiber != null
  ) {
    const element = elements[index]
    let newFiber = null

    // 🔑 diff 核心：通过 type 判断是否"同类"
    //   例如旧的是 <div>，新的是 <div> → sameType = true → UPDATE
    //   旧的是 <div>，新的是 <span> → sameType = false → 删旧建新
    const sameType =
      oldFiber &&
      element &&
      element.type == oldFiber.type

    // 情况 1️⃣：类型相同 → 复用 DOM，更新 props
    if (sameType) {
      newFiber = {
        type: oldFiber.type,        // 类型不变
        props: element.props,       // 用新 props
        dom: oldFiber.dom,          // 🔑 复用旧的 DOM 节点（省掉创建开销）
        parent: wipFiber,
        alternate: oldFiber,        // 保留旧 fiber 引用，供下次 diff
        effectTag: "UPDATE",        // 标记：commit 时执行 updateDom
      }
    }

    // 情况 2️⃣：有新元素但类型不同 → 创建新 DOM
    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,                  // 新建 fiber，dom 还没创建
        parent: wipFiber,
        alternate: null,            // 没有对应的旧 fiber
        effectTag: "PLACEMENT",     // 标记：commit 时执行 appendChild
      }
    }

    // 情况 3️⃣：有旧 fiber 但类型不同（或被新元素替换了）→ 删除旧 DOM
    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber)      // 加入删除队列，commit 时删除
    }

    // 移动到下一个旧 fiber（链表遍历）
    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    // 建立 fiber 树的 child/sibling 关系（Step IV 的核心结构）
    if (index === 0) {
      // 第一个孩子 → 设为 wipFiber.child
      wipFiber.child = newFiber
    } else if (element) {
      // 后续孩子 → 设为前一个兄弟的 sibling
      prevSibling.sibling = newFiber
    }

    prevSibling = newFiber
    index++
  }
}

// ============================================================
// 导出 & 使用示例
// ============================================================

// Didact 对象 — 模拟 React 的 API
const Didact = {
  createElement,    // JSX 编译后调用
  render,           // 渲染入口
  useState,         // 状态管理（Hook）
}

// 告诉 Babel：JSX 代码用 Didact.createElement 来编译
// 所以 <div id="a">hello</div> 会变成:
//   Didact.createElement("div", { id: "a" }, "hello")
/** @jsx Didact.createElement */

// 示例：计数器组件（验证所有功能）
function Counter() {
  const [state, setState] = Didact.useState(1)
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  )
}

const element = <Counter />
const container = document.getElementById("root")
Didact.render(element, container)

// ============================================================
// 📖 复习：一次 setState 的完整数据流
// ============================================================
//
// 用户点击 <h1> → setState(c => c + 1) 被调用 →
//   1. action (c => c + 1) 被 push 到 hook.queue
//   2. 创建新的 wipRoot（alternate 指向 currentRoot）
//   3. nextUnitOfWork = wipRoot
//   4. workLoop 下次空闲时开始处理
//   5. performUnitOfWork 遍历 fiber 树
//   6. 遇到 Counter fiber → updateFunctionComponent →
//      执行 Counter() → 调用 useState(1) →
//      发现 oldHook.queue 有 action → 执行 action(1) → state = 2
//   7. reconcileChildren 对比新旧 fiber，发现 state 变了 → effectTag: "UPDATE"
//   8. workLoop 发现没有 nextUnitOfWork → commitRoot()
//   9. commitWork 根据 UPDATE tag 调用 updateDom 更新 DOM 文本
//   10. 用户看到 Count: 2
//
// 🎯 这就是 React 的完整渲染管线！
// ============================================================
