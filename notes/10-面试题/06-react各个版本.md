# React 各版本 Feature 纵览

> 从 React 16 到 React 19，每个版本的关键特性速览。详细内容见子文档。

---

## React 16 (2017.09 — 里程碑版本)

**关键词：Fiber 架构 + Hooks 革命**

- **Fiber 架构**：异步可中断渲染，React 内核重写
- **Hooks (16.8)**：useState / useEffect / useContext / useReducer / useCallback / useMemo / useRef 等
- **React.lazy + Suspense**：组件级懒加载
- **Error Boundaries**：componentDidCatch / getDerivedStateFromError
- **Portals**：createPortal，渲染到 DOM 树外
- **Strict Mode**：检测潜在问题
- **Fragments**：`<>...</>` 无需额外 DOM 节点
- **SSR 基础版**：ReactDOM.hydrate

👉 详见：[06a-React 16：Fiber 与 Hooks](06a-react-16.md)

---

## React 17 (2020.10 — 无新 Feature 的"过渡版本")

**关键词：平滑升级**

- **新的 JSX Transform**：无需 `import React from 'react'`
- **事件委托变更**：从 document 改为 root 节点
- **渐进式升级**：支持同一页面运行多个 React 版本
- **useEffect 清理时机**：改为异步执行
- **无 breaking changes**：为 React 18 铺路

👉 详见：[06b-React 17：渐进升级](06b-react-17.md)

---

## React 18 (2022.03 — 并发时代)

**关键词：Concurrent Features**

- **Concurrent Mode 基础**：createRoot 替代 ReactDOM.render
- **Automatic Batching**：自动批处理，减少不必要的重渲染
- **Transitions**：useTransition / startTransition，区分紧急与非紧急更新
- **useDeferredValue**：延迟更新非关键数据
- **Suspense 增强**：支持 SSR Streaming，`renderToPipeableStream`
- **useId**：服务端/客户端一致的唯一 ID
- **useSyncExternalStore**：外部 Store 的安全订阅
- **useInsertionEffect**：CSS-in-JS 库专用
- **Strict Mode 增强**：double-invoke effect，提前暴露问题

👉 详见：[06c-React 18：并发特性](06c-react-18.md)

---

## React 19 (2024.12 — 服务端与 actions 时代)

**关键词：Server Components + Actions**

- **React Server Components (RSC)**：服务端组件正式发布
- **Server Actions**：`'use server'`，表单处理无需手动 API 路由
- **use() Hook**：在组件中读取 Promise 和 Context，替代部分 Suspense 用法
- **useOptimistic**：乐观更新，提交前即显示预期结果
- **useFormStatus**：表单提交状态（pending、数据等）
- **useActionState**：Action 状态管理（原 useFormState）
- **ref 作为 prop**：无需 forwardRef，ref 直接作为 prop 传递
- **Document Metadata**：`<title>`、`<meta>` 在组件中直接写，React 自动注入
- **Stylesheet 支持**：`<link rel="stylesheet">` 原生支持，无需三方库
- **Context 简化**：Provider 不再必需，直接用 `<MyContext value={...}>`

👉 详见：[06d-React 19：Server Components 与 Actions](06d-react-19.md)

---

## 版本脉络一句话

```
React 16：函数组件能写一切（Hooks）
React 17：悄悄把地基换了（新 JSX Transform、事件系统重构）
React 18：UI 不再卡顿（Concurrent + Transition）
React 19：前后端边界消失（Server Components + Actions）
```
