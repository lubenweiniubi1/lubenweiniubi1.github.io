<table><tr>
<td><img src="avatar.jpg" width="80" style="border-radius:6px;" /></td>
<td>

# 潘林峰

> 7 年前端开发经验 | 本科 · 软件工程 | linfeng.pan3@gmail.com | 15094041848 | 31 岁

</td>
</tr></table>

## 教育背景
| 时间 | 学校 | 学历 |
|---|---|---|
| 2014 – 2019 | 西北农林科技大学 | 本科 · 软件工程 |


## 近期状况

| | |
|---|---|
| **所在城市** | 西安 |
| **语言能力** | 英文可作为工作语言 |
| **面试时间** | 工作日可约 |
| **当前状态** | 已离职（2025.09 离开 Thoughtworks），随时到岗 |


## 个人简介

全栈前端工程师，**7 年开发经验**，擅长 Web、微信小程序、抖音小程序、H5 混合开发等多端应用交付。具备全栈能力（React + Next.js + Node.js/Express + Drizzle ORM + Docker），曾为 **REA Group**（澳洲最大地产平台）和 **保时捷**（全国经销商网络）等全球客户交付生产级系统。

**跨端架构与组件化：** 主导跨端 UI 组件库（Taro + Lerna Monorepo），复用至微信小程序、抖音小程序、Web Admin、H5 四个平台。主导保时捷微信小程序向抖音小程序的迁移，通过解决 Taro API 兼容问题和重写动画模块，达成约 70% 的代码复用率。

**AI 工程化实践：** 深度使用 Claude Code 等 AI 工具，将 Vibecoding 融入日常开发工作流。在 REA Group 项目中，基于 Claude Code 设计并实现自定义 Agent Skill，搭建覆盖完整交付周期的 AI 辅助开发流水线：需求拆解 → 前端开发 → 自动单测 → 自主提交 → 自动 Review → 个人审查，显著提升团队交付效率和代码质量。

**工程文化：** 在 Thoughtworks 与澳洲、印度团队全英文协作。推动 Code Review、ESLint 规范、TDD 实践落地，提升团队代码质量。

---

## 核心技能

| 分类 | 技术 |
|---|---|
| **编程语言** | JavaScript (ES6+)、TypeScript、HTML5、CSS3 |
| **前端框架** | React、Next.js、Redux Toolkit、React Router、MobX |
| **跨端开发** | TaroJS、微信小程序（原生）、抖音小程序、H5 |
| **后端** | Node.js、Express、RESTful API |
| **数据库 & ORM** | MySQL、PostgreSQL、MongoDB、Drizzle ORM |
| **DevOps** | Docker、CI/CD（GitHub Actions）、Nginx |
| **测试** | Jest、React Testing Library、Enzyme、Supertest |
| **工程化** | Webpack 5、Vite、Lerna、Yarn Workspace (Monorepo)、Git |
| **AI 辅助开发** | Claude Code、Cursor — Agent Skill 封装、Spec 驱动开发、Vibecoding 工作流 |

---

## 工作经历

### Thoughtworks | 前端开发工程师 | 2021.01 – 2025.09

#### 保时捷经销商系统（2021 – 2024）— 前端 Lead

为保时捷全国经销商网络开发的核心业务系统，覆盖微信小程序、抖音小程序、Web Admin、H5 四端，包含车辆智能推荐、新车目录、经销商管理、销售模块等。团队规模 100+ 人。

**技术栈：** React、TypeScript、Redux Toolkit、TaroJS、微信小程序、抖音小程序、H5、腾讯云视频

- 作为前端 Lead 负责四端功能交付，主导团队前端工程化建设——推行 ESLint 规范、Code Review 机制、TDD 实践，建立前端质量基线
- 主导**微信 → 抖音小程序迁移**：核心挑战是 Taro API 在抖音运行时的兼容性差异和动画性能退化，通过研究替代 API 方案并重写动画模块，达成约 70% 代码复用，为后续跨端迁移提供了可复制的方案
- 主导**跨端组件库建设**（Taro + Lerna/Yarn Workspace Monorepo），交付 15+ 通用业务组件（车辆卡片、经销商选择器、统一表单等），四端共享，消除重复 UI 开发

---

#### REA Group（2024 – 2025）— 全栈工程师

维护和开发澳大利亚最大地产平台（realcommercial.com.au / realestate.com.au），服务数百万用户。与澳洲、印度团队全英文协作。

**技术栈：** React、TypeScript、Next.js、Node.js、Express、Jest、Supertest、Claude Code

- 负责前端功能开发（React + TypeScript + Next.js）及 Node.js/Express 后端服务维护，后端开发遵循 DDD（领域驱动设计），API 测试使用 Supertest
- 日常使用 Claude Code 以 Vibecoding 方式驱动开发——将 AI 融入需求分析、代码实现、测试、Review 全流程，而非仅在代码补全层面使用 AI
- 基于 Claude Code 设计并封装自定义 Agent Skill，标准化开发工作流：

| Skill | 功能 |
|-------|------|
| **Spec Skill** | 需求拆解为结构化、可执行的 Spec 文档 |
| **Unit Test Skill** | 自动生成 Jest 测试用例，覆盖核心逻辑与边界场景 |
| **Issue Skill** | 发布结构化 Issue 报告，包含根因分析及修复文档 |
| **Code Review Skill** | 提交前自动化预检，确保代码符合规范 |

```
需求拆解 → 前端开发 → 单元测试 → Issue 发布 → Code Review → CI/CD 发布
```

- 快速定位并修复生产事故，保障核心业务连续性；维护跨团队代码健康度监控机制

---

#### 其他项目

**租赁系统 — 小程序 + Web（React + Jest + React Testing Library）**
- 从零搭建小程序和 Web 项目，负责前端架构选型；编写单元测试及集成测试保障核心业务流程

**KPI 看板 / 合同管理系统（React + ECharts）**
- 开发数据可视化看板替代人工 Excel 报表；重构遗留前端代码，显著提升可维护性

---

### 西安飞蜂科技 | 前端开发工程师 | 2019.07 – 2021.01

#### 乡村振兴公厕 IoT 管理系统

在农村公厕安装 IoT 传感器，实时监测厕位状态。小程序帮助政府工作人员查看需要清理的设施并按动态规划路线作业，Web 管理端提供车辆 GPS 追踪与数据可视化。

**技术栈：** 原生微信小程序、IoT 传感器集成、GPS 追踪、路径规划、ECharts

- 作为唯一前端开发，从需求沟通到部署上线全流程独立负责
- 集成 IoT 传感器数据，实现设施状态实时展示与动态路径规划算法
- 实现车辆 GPS 实时追踪及逐向导航功能；Admin Web 端负责核心地图页开发
- 独立完成内部管理系统前端开发（React + Spring Boot + MongoDB）
