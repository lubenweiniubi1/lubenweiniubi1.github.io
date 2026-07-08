# 技术栈 & 知识体系总览

> 本文档按多维度整理所有技术积累：技术栈 → 架构 → 性能 → 网络 → 工程化。每个条目链接到对应的笔记或练习仓库。
>
> `TODO` = 有笔记但还没独立练习仓库。`本地` = 本地有项目但还没推到 GitHub。

---

## 一、技术栈

### 1.1 前端核心

| 技术 | 说明 | 笔记 / 仓库 |
|------|------|-------------|
| **React.js** | v16/v17 多版本、基础概念、原理（Fiber/Diff/VDOM）、生命周期、HOC、Context、Portals | [react-playground](https://github.com/lubenweiniubi1/react-playground) |
| **Redux / RTK Query** | 状态管理：Redux、中间件、RTK Query、redux-persist、normalization | [react-playground](https://github.com/lubenweiniubi1/react-playground)（内含） |
| **React Router** | Hash / Browser / Memory 路由 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（内含） |
| **TypeScript** | TS 学习 + 面试题库 + 12 篇知识文章 | 本地 ts-playground（待推送） |
| **JavaScript** | JS 基础练习 | [js-demo](https://github.com/lubenweiniubi1/js-demo) |
| **Immer / Immutable** | 不可变数据方案 | TODO |

### 1.2 样式 & UI

| 技术 | 说明 | 笔记 / 仓库 |
|------|------|-------------|
| **Tailwind CSS** | 原子化 CSS 框架 | [笔记](./16-fullstack/04-tailwind.md) — TODO |
| **CSS-in-JS** | CSS 方案对比 | [笔记](./16-fullstack/03-css-in-js.md) — TODO |
| **Virtual List** | 虚拟列表 / 长列表渲染优化 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（内含 virtual-list） |

### 1.3 跨端 & 跨平台

| 技术 | 说明 | 笔记 / 仓库 |
|------|------|-------------|
| **TaroJS** | React 语法写小程序，跨微信/抖音/H5/Web 四端 | [笔记](./10-面试题/12-跨端组件库.md) — 本地 ui-cross-platform（待推送） |
| **跨端组件库** | Taro + Lerna Monorepo，15+ 通用业务组件 | [笔记](./10-面试题/12-跨端组件库.md) |
| **小程序** | 微信小程序（原生）、抖音小程序 | [笔记](./10-面试题/11-小程序八股文.md) |

### 1.4 微前端

| 技术 | 说明 | 笔记 / 仓库 |
|------|------|-------------|
| **Qiankun** | 微前端框架（基座 + 子应用） | [qiankun-base](https://github.com/lubenweiniubi1/qiankun-base) + [qiankun-sub-app-react](https://github.com/lubenweiniubi1/qiankun-sub-app-react) |
| **Module Federation** | Webpack 5 模块联邦，与 Qiankun 对比 | [笔记](./09-微前端/) — 本地 qiankun-demo（Module Federation 文档） |
| **Single-spa** | 微前端底层框架 | [笔记](./09-微前端/06.single-spa%20和%20qiankun.md) — TODO |
| **微服务** | 概念与实践 | [笔记](./09-微前端/04-微服务.md) — TODO |

### 1.5 后端 & 数据库

| 技术 | 说明 | 笔记 / 仓库 |
|------|------|-------------|
| **Node.js** | 后端基础 | [node-demo](https://github.com/lubenweiniubi1/node-demo) |
| **Drizzle ORM** | 数据库 ORM（配合 Postgres） | [笔记](./16-fullstack/05-drizzle-orm.md) — TODO |

### 1.6 AI & LLM

| 技术 | 说明 | 笔记 / 仓库 |
|------|------|-------------|
| **AI Agent** | 智能体开发 | [agent-playground](https://github.com/lubenweiniubi1/agent-playground) |
| **RAG** | 检索增强生成 | [笔记](./11-AI/08-RAG.md) — TODO |
| **多智能体合作** | Multi-Agent 协作 | [笔记](./11-AI/07-多智能体合作.md) — TODO |
| **SDD+TDD with AI** | AI 驱动的开发方法论 | [笔记](./11-AI/04-SDD+TDD.md) — TODO |
| **Harness Engineering** | AI 编排工程 | [笔记](./11-AI/05-harness-engineering.md) — TODO |
| **AI 全栈实战** | AI 远程面试辅助系统 | [deamon-x](https://github.com/lubenweiniubi1/deamon-x) |

### 1.7 构建 & 基础设施

| 技术 | 说明 | 笔记 / 仓库 |
|------|------|-------------|
| **Webpack** | 打包工具原理与实践 | [webpack-playground](https://github.com/lubenweiniubi1/webpack-playground) |
| **Lerna + Yarn Workspace** | 多包管理 / Monorepo 方案 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（Monorepo 架构） |
| **pnpm Workspace** | Monorepo 方案（与 Yarn 对比） | [deamon-x](https://github.com/lubenweiniubi1/deamon-x)（pnpm + workspace） |
| **Git** | Git 操作练习 | [git-demo](https://github.com/lubenweiniubi1/git-demo) |
| **Docker** | 容器化部署 | [笔记](./16-fullstack/06-docker.md) — TODO |
| **Nginx** | 反向代理 / 静态资源 | [笔记](./16-fullstack/07-nginx.md) — TODO |
| **GitHub Actions** | CI/CD 自动化 | [笔记](./13-github/01-github.action.md) — TODO |
| **GitHub Pages** | 静态站点部署 | 本即站点 GitHub Pages 实践：[lubenweiniubi1.github.io](https://github.com/lubenweiniubi1/lubenweiniubi1.github.io) |

---

## 二、架构能力

> 本文档重点从「组件封装」「微前端架构」「渲染模式」三个维度总结架构积累。更多面试向内容见 [架构面试笔记](./10-面试题/06-架构面试.md)。

### 2.1 组件封装方法论

| 话题 | 核心要点 | 笔记 |
|------|---------|------|
| **分层策略** | Level 1（局部封装）→ Level 2（项目级）→ Level 3（跨项目组件库），按复用范围决策 | [06-架构面试.md](./10-面试题/06-架构面试.md) |
| **接口设计** | 收敛共性、暴露扩展点，用组合而非继承 | 同上 |
| **跨端组件库实战** | Taro + Lerna Monorepo，15+ 组件四端共享，消除重复 UI 开发 | [12-跨端组件库.md](./10-面试题/12-跨端组件库.md) |

### 2.2 微前端架构

| 话题 | 核心要点 | 笔记 |
|------|---------|------|
| **Qiankun 实战** | 基座应用 + 子应用注册、登录路由守卫、应用间通信、CSS 隔离 | [qiankun-base](https://github.com/lubenweiniubi1/qiankun-base) |
| **Module Federation** | Webpack 5 模块联邦基本概念、配置实践、与 Qiankun 对比 | 本地 qiankun-demo/docs |
| **Single-spa** | 微前端底层原理，Qiankun 的前身 | [笔记](./09-微前端/06.single-spa%20和%20qiankun.md) |
| **打包模式** | 微前端的构建策略与部署模式 | [笔记](./09-微前端/05-打包模式.md) |

### 2.3 渲染架构

| 话题 | 核心要点 | 笔记 / 仓库 |
|------|---------|-------------|
| **CSR** | 客户端渲染，React 默认模式 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（csr-demo） |
| **SSR** | 服务端渲染，SEO + 首屏优化 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（ssr-demo） |
| **RSC** | React Server Components，服务端组件 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（rsc-demo） |
| **Next.js** | SSR/RSC/CSR 统一框架 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（nextjs-app） |
| **对比与选型** | 三种渲染模式的区别、适用场景与决策框架 | [笔记](./16-fullstack/02-ssr+rsc+csr.md) |

---

### 2.4 鉴权与安全

| 话题 | 核心要点 | 笔记 |
|------|---------|------|
| **JWT 鉴权** | Token 生成/验证/刷新、Access Token + Refresh Token 双 token 策略 | [01-jwt.md](./12-登录验证/01-jwt.md) |
| **登录态管理** | Cookie vs Header、跨域携带、SSO 单点登录概念 | 同上 |

---

## 三、性能优化

> 更多面试向内容见 [工程化与性能优化面试题](./10-面试题/03-工程化与性能优化面试题.md)。

| 话题 | 核心要点 | 笔记 / 仓库 |
|------|---------|-------------|
| **滚动驱动动画** | TaroJS + 微信小程序，十几个全屏模块的滚动动画优化，高频滚动事件节流、按需销毁 | [07-性能案例.md](./10-面试题/07-性能案例.md) |
| **虚拟列表** | 长列表 DOM 节点复用，只渲染可视区域 | [react-playground](https://github.com/lubenweiniubi1/react-playground)（virtual-list） |
| **防抖节流** | debounce / throttle 在搜索、滚动、resize 场景的实际应用 | [笔记](./10-面试题/03-工程化与性能优化面试题.md) |
| **接口缓存** | 请求去重、SWR/stale-while-revalidate 策略 | 同上 |
| **分步加载** | 代码分割、懒加载、预加载策略 | 同上 |
| **Webpack 构建优化** | Tree Shaking、Code Splitting、按需加载 | [webpack-playground](https://github.com/lubenweiniubi1/webpack-playground) |

---

## 四、网络与通信

| 话题 | 核心要点 | 笔记 / 仓库 |
|------|---------|-------------|
| **HTTP 协议** | HTTP/1.1 → HTTP/2 → HTTP/3 演进，请求/响应模型 | [笔记](./11-AI/06-sse-websocket-http.md) |
| **WebSocket** | 全双工通信、长连接保活、Express + React 实战 | [笔记](./16-fullstack/08-ws.md) |
| **SSE** | 服务端推送、单向数据流、与 WebSocket 的对比选型 | [笔记](./11-AI/06-sse-websocket-http.md) |
---

## 五、工程化实践

| 话题 | 核心要点 | 笔记 / 仓库 |
|------|---------|-------------|
| **Lint 规范** | ESLint + Prettier + Husky + lint-staged + Commitlint 完整工作流 | [笔记](./10-面试题/03-工程化与性能优化面试题.md) |
| **Monorepo** | Lerna + Yarn Workspace（react-playground）vs pnpm Workspace（deamon-x） | 见上方构建章节 |
| **CI/CD** | Docker + GitHub Actions 自动化：构建 → 测试 → 部署 | [笔记](./16-fullstack/09-CI-CD.md) |
| **AI 驱动开发** | Claude Code + 自定义 Agent Skill，覆盖需求拆解、测试、Review 全流程 | [笔记](./11-AI/09-frontend-workflow.md) |
| **Storybook** | 组件文档与可视化测试 | 本地 ui-cross-platform（Storybook 包） |

---

> **更新说明**：推送本地仓库后，将对应链接替换为 GitHub URL。
