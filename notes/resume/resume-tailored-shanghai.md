<table><tr>
<td><img src="avatar.jpg" width="80" style="border-radius:6px;" /></td>
<td>

# 潘林峰

> 7 年前端开发经验 | 本科 · 软件工程 | linfeng.pan3@gmail.com | 15094041848

</td>
</tr></table>

## 个人简介

**7 年前端开发经验**，专注 React + TypeScript 技术栈与微前端架构。深度参与 **qiankun 微前端架构落地**，将保时捷经销商 B 端 Web Admin 拆分为独立子应用，实现应用通信、样式隔离、独立部署全链路。具备 **全英文协作经验**（Thoughtworks 时期与澳洲、印度团队日常英文会议、文档、代码评审），英语可作为日常工作语言。

擅长前端工程化体系建设（Webpack/Vite + Monorepo + CI/CD 流水线），跨端架构（Taro 四端复用），页面性能优化与质量基线搭建。微信小程序与跨端经验丰富。

---

## 核心技能

| 分类 | 技术 |
|---|---|
| **前端框架** | React、Next.js、Redux Toolkit、React Router、Ant Design |
| **微前端** | **qiankun**、Module Federation — 子应用拆分、应用通信（props / 全局状态）、样式隔离（Shadow DOM / CSS Scope）、独立部署 |
| **编程语言** | TypeScript、JavaScript (ES6+)、HTML5、CSS3 / Sass / Less / Tailwind |
| **工程化** | Webpack 5、Vite、Lerna、Yarn Workspace (Monorepo)、ESLint、Prettier |
| **CI/CD** | GitLab CI/CD 流水线配置、自动化构建 → 测试 → 部署 |
| **跨端开发** | TaroJS、微信小程序（原生）、抖音小程序、H5 |
| **测试** | Jest、React Testing Library、Enzyme、TDD |
| **性能优化** | 路由懒加载、代码分割、CDN + WebP 图片压缩、虚拟列表、首屏优化 |
| **接口联调** | HTTP、RESTful API 规范，与后端高效协作联调 |

---

## 工作经历

### Thoughtworks | 高级前端工程师 | 2021.01 – 2025.09

#### 保时捷全国经销商管理系统（2021 – 2024）— 前端 Lead

为保时捷全国经销商网络打造的核心业务中台，覆盖微信小程序、抖音小程序、Web Admin、H5 四端。包含车辆智能推荐、新车目录、经销商管理、销售模块等。团队规模 100+ 人。

**技术栈：** React、TypeScript、Redux Toolkit、qiankun、TaroJS、Webpack、GitLab CI/CD

- **微前端架构落地**：保时捷经销商 B 端 Web Admin 需要作为微前端子应用运行。负责 **qiankun 微前端方案落地**，将经销商管理模块拆分为独立子应用，实现子应用注册/加载/卸载生命周期管理、主子应用间跨应用通信（props 透传 + 全局状态共享）、CSS 样式隔离（Shadow DOM + CSS Module）、独立构建部署流水线，子应用可独立迭代发布而不影响主框架

- **跨端架构与迁移**：主导 **微信 → 抖音小程序迁移**，核心解决 Taro API 在抖音运行时的兼容性差异和动画性能退化问题，通过研究替代 API 并重写动画模块，达成约 70% 代码复用，为后续跨端迁移建立可复制方案

- **Monorepo 跨端组件库**：基于 Taro + Lerna / Yarn Workspace 搭建 Monorepo 组件库，交付 15+ 通用业务组件（车辆卡片、经销商选择器、统一表单等），四端共享，消除重复 UI 开发

- **前端工程化体系**：搭建 GitLab CI/CD 流水线（Lint → Test → Build → Deploy），推行 ESLint 规范、Code Review 机制、TDD 实践，建立团队前端质量基线

- **性能优化实践**：针对经销商系统页面加载慢和长列表卡顿问题，推动路由懒加载与组件级代码分割减小首屏包体积，落地 CDN + WebP 图片加载方案，调优长列表虚拟滚动与复杂动画性能，关键页面首屏加载时间降低 35%+

---

#### REA Group — 澳大利亚最大地产平台（2024 – 2025）— 前端工程师

维护与迭代 realcommercial.com.au / realestate.com.au，服务数百万用户。**全英文日常协作**，与澳洲、印度团队远程交付。

**技术栈：** React、TypeScript、Next.js、Jest、React Testing Library、CI/CD

- 负责核心业务功能前端开发（React + TypeScript + Next.js），基于 RESTful 规范对接后端接口完成数据联调
- 维护项目 CI/CD 流水线（构建 → 单测 → 自动部署），确保每次提交经过自动化质量验证
- 快速定位并修复线上生产事故，保障核心业务连续性；维护跨团队代码健康度监控机制
- 基于 Claude Code 封装自定义 Agent Skill，将 AI 驱动开发覆盖需求拆解、单元测试、Code Review 环节

---

#### 其他项目

**租赁系统 — 小程序 + Web（React + Jest + React Testing Library）**
- 从零搭建前后端分离项目，独立完成前端架构选型与技术方案设计，编写单元测试及集成测试保障核心业务流程

**KPI 看板 / 合同管理系统（React + ECharts）**
- 开发数据可视化看板替代人工 Excel 报表；重构遗留前端代码，显著提升可维护性


### 西安飞蜂科技 | 前端开发工程师 | 2019.10 – 2021.01

#### 乡村振兴公厕 IoT 管理系统

**技术栈：** 原生微信小程序、React、Ant Design、ECharts、IoT 传感器集成、GPS 追踪

- 作为唯一前端开发，独立负责 C 端（微信小程序）和 B 端（Web Admin）前端全流程交付
- 对接后端 IoT 数据接口，实现厕位状态实时展示与动态路线导航
- 基于地图 SDK 实现车辆 GPS 实时追踪与路线规划可视化
- 独立完成内部管理系统前端开发（React + Ant Design），与后端协作完成 HTTP 接口对接


### 长江电子有限公司 | 2019.7 – 2019.9

- 人才储备（前端开发方向）

---

## 教育背景

| 时间 | 学校 | 学历 |
|---|---|---|
| 2014 – 2019 | 西北农林科技大学 | 本科 · 软件工程 |

---

## 语言能力

| 语言 | 水平 | 说明 |
|---|---|---|
| **英语** | 可作为工作语言 | 参与过英文工作环境：英文需求文档、日常英文会议、<br>英文技术文档输出、英文 Code Review，与澳洲/印度团队协作 |
| 中文 | 母语 | — |

