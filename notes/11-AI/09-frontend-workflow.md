# 前端 AI 工作流：从编码到面试的全景方法论

> 本文档面向**希望系统化掌握 AI 协作能力的前端开发者**，覆盖从需求分析到 CI/CD 的全链路 AI 辅助工作流，
> 同时提供面试视角的考察点分析，帮助你为"前端 AI 岗位"做好技术和表达上的准备。
>
> **前置阅读**：本文假设你已理解 AI 核心概念（Token / Context / System Prompt / Tool / Agent / Skill），
> 如需补课请先阅读 [`02-concepts.md`](./02-concepts.md)。

---

## 目录

1. [核心理念：重新定义"前端开发者"](#一核心理念重新定义前端开发者)
2. [提示词工程实战](#二提示词工程实战)
3. [项目级 AI 约束体系](#三项目级-ai-约束体系)
4. [Skills 沉淀方法论](#四skills-沉淀方法论)
5. [Sensors & Hooks 自动化体系](#五sensors--hooks-自动化体系)
6. [Git 工作流 × AI 集成](#六git-工作流--ai-集成)
7. [Greenfield 项目全流程](#七greenfield-项目全流程)
8. [Brownfield 项目全流程](#八brownfield-项目全流程)
9. [TDD + AI 深度结合](#九tdd--ai-深度结合)
10. [面试视角：前端 AI 岗位考察什么](#十面试视角前端-ai-岗位考察什么)
11. [附录：工具链速查](#十一附录工具链速查)

---

## 一、核心理念：重新定义"前端开发者"

### 1.1 AI 时代的角色转变

```
传统前端 = 写代码的人
AI 时代前端 = 驾驭 AI 完成全链路交付的人
```

有了 AI 之后，你的核心能力不再是"写得快"，而是：

| 旧能力 | 新能力 |
|--------|--------|
| 记住 API 细节 | 写出清晰的需求描述让 AI 用对 API |
| 手写样板代码 | 设计约束让 AI 生成的代码直接符合规范 |
| 肉眼 Code Review | 搭建自动化 Sensor 让 AI 自我修正 |
| 自己写文档 | 封装 Skill 让 AI 按模板输出文档 |
| 单打独斗 | 编排多个 Agent 协同工作 |

### 1.2 前端 AI 协作三层模型

```
Layer 3 — 架构层 (Architecture)
├── 系统设计决策（AI 辅助分析 trade-off）
├── 技术选型（AI 辅助调研对比）
├── 项目级约束设计（CLAUDE.md / Rules）
└── 多 Agent 编排策略

Layer 2 — 流程层 (Process)
├── 需求 → Spec → 任务拆解
├── Git Issue / PR 自动生成
├── CI/CD 中的 AI 检查点
└── Code Review 自动化

Layer 1 — 编码层 (Coding)
├── 代码生成（精确 Prompt → 合规代码）
├── TDD 循环（AI 帮你 Red → Green → Refactor）
├── 重构（AI 辅助识别坏味道 + 执行重构）
└── Debug（AI 辅助定位 + 修 Bug）
```

**核心原则**：AI 是放大器，不是替代品。你的技术判断力 × AI 的执行效率 = 你的生产力。

### 1.3 我（作者）的技术栈与工作流基线

| 维度 | 选择 |
|------|------|
| 前端框架 | React + TypeScript |
| 工程方法 | TDD（Test-Driven Development） |
| 分支策略 | main(生产) ← pp(预生产) ← staging ← dev |
| 质量门禁 | Lint + Format + TypeCheck + Test 全部通过才能提交 |
| 协作规范 | 每个需求必须有 Git Issue，PR 必须关联 Issue |
| AI 工具 | Claude Code（主力）、Superpowers 技能集 |

---

## 二、提示词工程实战

> 提示词是你和 AI 之间的"API"。设计得好的 API 返回可预期的结果，
> 设计得不好就是一场赌博。
>
> 理论基础见 [`02-concepts.md` §2.5](./02-concepts.md#25-prompt提示词)。

### 2.1 提示词的四个层次

```
Level 1：「帮我写个登录页」                        ← 模糊，结果随机
Level 2：「用 React + TS 写一个登录页，含邮箱密码表单」  ← 有技术栈，缺规格
Level 3：「…含表单验证规则、loading/error 状态、JSDoc」← 有行为约束
Level 4：「…这是 spec 文档 ↓」                       ← 结构化输入，最佳结果
```

**结论**：好的提示词 = **角色 + 上下文 + 约束 + 示例 + 输出格式**。

### 2.2 前端提示词通用模板

```markdown
## 角色
你是一个资深 React + TypeScript 前端工程师，遵循 TDD 开发流程。

## 上下文
- 项目使用 React 18 + TypeScript 5 + Vite
- 状态管理：Zustand
- 测试框架：Vitest + React Testing Library
- 代码风格遵循项目 ESLint + Prettier 配置
- 当前文件结构见下方

## 任务
[具体要做的事]

## 约束
1. 所有组件使用函数式声明 + Hooks，禁止 class 组件
2. 每个导出函数必须有 JSDoc 注释
3. 所有 Props 必须有独立 type/interface 定义
4. 先写测试，再写实现（Red → Green → Refactor）
5. 错误处理必须完整（loading / error / empty 三态）
6. 不做过度设计 — 只实现当前需求，不预判未来

## 示例（参考）
```tsx
// 项目中的类似组件写法
[粘贴 1-2 个高质量示例]

## 输出格式
1. 测试文件：`__tests__/ComponentName.test.tsx`
2. 组件文件：`ComponentName.tsx`
3. 类型定义随组件或单独 `types.ts`
```

### 2.3 前端高频场景提示词模式

#### 场景 1：新组件开发

```
按照 spec 文档 @spec/xxx.md，以 TDD 方式实现该组件。
先写出所有测试用例，列出 test cases checklist，
等我确认后再开始实现。
```

**关键点**：让 AI 先列 test cases → 你审核 → 再实现。这比直接让它写代码质量高 3 倍。

#### 场景 2：Bug 修复

```
Bug 描述：[具体现象]
复现步骤：[1. 2. 3.]
期望行为：[应该怎样]
实际行为：[实际怎样]

请：
1. 先分析可能的原因（至少 3 个假设）
2. 为每个假设设计验证方法
3. 等我确认方向后再写修复代码
4. 修复后补充回归测试
```

**关键点**：强制 AI 先思考再动手，避免"猜测式修复"。

#### 场景 3：重构

```
重构目标：[哪个文件/模块]
重构原因：[为什么要重构]
约束：不改变任何外部行为，所有现有测试必须通过

请：
1. 先分析当前代码的坏味道（2-3 条）
2. 提出重构方案
3. 等我确认后，分步执行（每步保证测试通过）
```

#### 场景 4：Code Review

```
Review 以下代码，从以下维度给出建议：
1. 类型安全（有没有 any？有没有类型漏洞？）
2. 性能（不必要的 re-render？大的依赖数组？）
3. 可访问性（a11y）
4. 错误处理（是否覆盖了 loading/error/empty？）
5. 可测试性（依赖是否可 mock？）
6. 代码风格（是否符合项目规范？）

对每个问题：指出位置 + 严重级别（🔴 必须修 / 🟡 建议修 / 🟢 可选）
```

### 2.4 提示词的反模式

| ❌ 反模式 | ✅ 正确做法 |
|-----------|------------|
| "帮我优化这段代码" | "这段代码在数据量大时渲染慢，请从 React re-render 角度分析瓶颈" |
| "这里不对，修一下" | "点击按钮后期望弹出确认框但实际直接删除了，请检查事件处理逻辑" |
| "写个好的" | "参考 `src/components/Modal/` 的模式，实现一个类似的 Drawer 组件" |
| 不给约束，事后挑剔 | 把所有约束写在 CLAUDE.md 中，每次自动生效 |
| 一次性让 AI 写 500 行 | 拆成 3-5 步，每步验证后再继续 |

### 2.5 链式思维在前端中的应用

```
简单任务：「帮我给 Button 组件加 loading 状态」
         → 直接写（不需要 Chain of Thought）

复杂任务：「把这个 class 组件重构为函数式组件 + Hooks」
         → Step 1: 分析当前组件的状态和副作用
         → Step 2: 设计新的 Hook 拆分方案
         → Step 3: 逐方法迁移，保证测试通过
         → Step 4: 清理旧代码
```

**规则**：任务越复杂，越需要显式要求 AI 分步思考。

---

## 三、项目级 AI 约束体系

> 提示词管一次交互，约束体系管整个项目生命周期。
> 这是"前端 AI 岗位"面试中**最容易被问到但最难回答好的板块**。

### 3.1 三级约束架构

```
全局级 (~/.claude/CLAUDE.md 或 ~/.claude/settings.json)
├── 对所有项目生效
├── 代码风格偏好（分号？单引号？）
├── 语言偏好（始终用中文/英文回复）
└── 全局工具配置

项目级 (<project-root>/CLAUDE.md)
├── 技术栈声明
├── 目录结构约定
├── 命名规范
├── Git 工作流
└── 测试策略

模块级 (<project-root>/.claude/rules/*.md 或子目录 CLAUDE.md)
├── 特定模块的约束（如 /api 层的错误格式）
├── 组件库使用规范
└── 领域特定的术语表
```

### 3.2 项目级 CLAUDE.md 模板

```markdown
# 项目名称

## 技术栈
- React 18 + TypeScript 5 + Vite 5
- 状态管理：Zustand
- 路由：React Router v6
- 测试：Vitest + React Testing Library + MSW
- 样式：Tailwind CSS
- 包管理：pnpm

## 目录结构
src/
├── components/    # 通用组件（纯展示 + 受控）
├── features/      # 业务模块（含 hooks + types + api）
├── hooks/         # 全局共享 Hooks
├── utils/         # 纯函数工具
├── types/         # 全局类型定义
└── __tests__/     # 测试文件，镜像 src/ 结构

## 编码规范

### 组件
- 函数式声明，禁止 class：`export function UserProfile({ user }: UserProfileProps)`
- Props 必须独立类型定义：`interface UserProfileProps { ... }`
- 每个导出函数/组件必须有 JSDoc
- 用 `const` 声明事件处理函数，不用内联箭头函数（避免不必要的 re-render）

### 类型
- 禁止 `any`，特殊情况用 `unknown` + type guard
- 禁止 `as` 类型断言，用 type predicate 替代
- API 响应必须有完整类型（建议用 Zod 做运行时校验）

### 状态管理
- 服务端数据用 React Query（缓存、重试、乐观更新）
- 客户端状态用 Zustand（避免 prop drilling）
- 表单状态用 React Hook Form + Zod

### 测试
- TDD：先写测试，再写实现
- 组件测试：React Testing Library（按用户行为测试，不测实现细节）
- API Mock：MSW（Mock Service Worker）
- 覆盖率门禁：branches ≥ 80%, functions ≥ 90%, lines ≥ 85%

## Git Flow
- main ← pp ← staging ← dev
- Commit 遵循 Conventional Commits
- PR 必须关联 Issue，自动生成 PR 描述
- 所有检查（lint + typecheck + test）通过后才能合并

## AI 行为约束
- 不确定的事项必须向用户确认，不要猜测
- 修改超过 3 个文件时先列出计划
- 每次代码修改后运行相关的 lint + typecheck + test
- 重构时保证所有现有测试通过
- 不要删除文档/注释（除非明确要求）
```

### 3.3 模块级规则示例

```markdown
# .claude/rules/api-layer.md

## API 层规范

### 请求函数
- 统一放在 `src/features/{module}/api.ts`
- 所有 API 函数返回类型为 `ApiResponse<T>`
- 错误统一抛出 `ApiError` 类型

### 错误格式
```typescript
interface ApiError {
  code: string;      // 'VALIDATION_ERROR' | 'NETWORK_ERROR' | 'UNAUTHORIZED' | ...
  message: string;   // 用户可读的错误信息
  details?: unknown; // 额外的错误详情
}
```

### React Query 使用
- Query Key 用常量管理：`export const userKeys = { all: ['users'] as const, detail: (id: string) => ['users', id] as const }`
- Mutation 必须处理 loading / error / success 三态


### 3.4 约束体系的设计原则

1. **渐进式**：先写全局级（偏好），再写项目级（规范），最后补模块级（细节）
2. **可验证**：每条约束最好能自动检查（lint 规则 > 文字描述）
3. **有示例**：禁止什么 + 推荐什么，都要给代码示例
4. **定期更新**：每 2-3 个 Sprint 回顾一次，删掉过时的、补充缺失的
5. **团队共识**：CLAUDE.md 是团队文档，不是个人配置，修改需要 PR + Review

---

## 四、Skills 沉淀方法论

> Skill = 将"反复做对的事"封装为可调用的模块。
> 这是你从"AI 的使用者"进阶到"AI 工作流的设计者"的关键标志。
>
> 理论基础见 [`03-skills.md`](./03-skills.md) 和 [`02-concepts.md` §2.9](./02-concepts.md#29-agent-skillagent-技能)。

### 4.1 什么时候该封装一个 Skill？

```
触发条件（满足任意 2 条就值得封装）：
├── 同一流程本周做了 ≥ 3 次
├── 每次都要写类似的提示词开头
├── 希望团队其他人也能复用
├── 流程有明确的输入 → 处理 → 输出结构
└── 流程容易遗漏步骤（需要 checklist 保障）
```

### 4.2 前端开发中的高频 Skill 候选

| Skill | 触发 | 功能 | 适用场景 |
|-------|------|------|----------|
| `/spec` | 需求描述 | 输出标准化 Spec 文档 | 每个需求启动时 |
| `/feat` | Spec 路径 | Spec → 完整功能代码（TDD） | 功能开发 |
| `/test` | 文件路径 | 为现有代码补测试 | 补测试覆盖 |
| `/review` | PR 号 / 文件 | 多维度代码审查 | 提 PR 前自检 |
| `/refactor` | 文件 + 目标 | 安全重构（保证测试通过） | 技术债清理 |
| `/debug` | Bug 描述 | 结构化 Debug（假设→验证→修复） | Bug 修复 |
| `/component` | 组件描述 | 生成组件 + Story + 测试 + 文档 | UI 开发 |
| `/doc` | 模块路径 | 生成/更新模块文档 | 知识沉淀 |
| `/init-issue` | 需求描述 | 自动生成标准化 Git Issue | 需求登记 |
| `/gen-pr` | 分支名 | 自动生成 PR 描述 + Issue 链接 | Push 代码后 |

### 4.3 Skill 设计模板

```markdown
# Skill: /component

## 描述
按照项目规范生成 React 组件，包含：组件本体 + Props 类型 + 测试 + Storybook story + JSDoc。

## 触发方式
/component [组件名] [描述]
例：/component SearchInput "带防抖的搜索输入框，支持自定义 placeholder 和搜索图标"

## 输入
- 组件名（PascalCase）
- 功能描述
- 可选的 Props 列表

## 执行流程
1. 检查项目组件库是否已有类似组件（避免重复造轮子）
2. 确认 Props 接口设计，列出所有 Props 及类型
3. 生成测试用例 checklist，等用户确认
4. 按 TDD 流程：先写测试 → 再写实现 → 重构
5. 生成 JSDoc 注释
6. 运行 lint + typecheck + test 确认通过

## 输出文件
- `src/components/{ComponentName}/{ComponentName}.tsx`
- `src/components/{ComponentName}/{ComponentName}.test.tsx`
- `src/components/{ComponentName}/{ComponentName}.stories.tsx`
- `src/components/{ComponentName}/types.ts`

## 约束
- 遵循 `CLAUDE.md` 中所有编码规范
- 组件必须是受控组件（由父组件管理状态）
- 必须覆盖 loading / error / empty / normal 四种状态
```

### 4.4 Skill 库的演进路径

```
阶段 1：个人常用提示词 → 文本模板（复制粘贴）
阶段 2：文本模板 → Skill 文件（/调用）
阶段 3：个人 Skill → 团队共享 Skill（统一工作流）
阶段 4：团队 Skill → CI/CD 集成（自动化触发）
```

**实践建议**：
- 从你最常做的 3 件事开始封装（如 `/feat`、`/review`、`/test`）
- 每次用完一个 Skill 后，花 30 秒思考：这次的输出哪里不满意？怎么改进 Skill？
- 把你的 Skill 库放在一个独立仓库中，各项目通过 git submodule 或符号链接引用

---

## 五、Sensors & Hooks 自动化体系

> Feedforward（前馈）告诉 AI 做什么，Sensors（传感器）检查 AI 做对了没有。
> 两者结合 = Harness Engineering（缰绳工程）。
>
> 理论基础见 [`05-harness-engineering.md`](./05-harness-engineering.md)。

### 5.1 核心模型

```
       ┌──────────┐
       │ AI 生成   │
       │ 代码变更  │
       └────┬─────┘
            │
   ┌────────┴────────┐
   │   Sensors 自动   │
   │  检测并反馈      │
   │                  │
   │  Lint ────── ✓/✗ │
   │  Format ──── ✓/✗ │
   │  TypeCheck  ✓/✗ │
   │  Test ───── ✓/✗ │
   │  Coverage ── ✓/✗ │
   │  Build ──── ✓/✗ │
   └────────┬────────┘
            │
   ┌────────┴────────┐
   │   ✗ → AI 自动    │
   │   修复错误       │
   │   ✓ → 进入下一   │
   │   个检查         │
   └─────────────────┘
```

### 5.2 前端项目必备 Sensor 矩阵

| Sensor | 类型 | 触发时机 | 工具 | 配置要点 |
|--------|------|----------|------|----------|
| **ESLint** | Computational | 文件保存 / git commit | ESLint + 项目规则 | 搭配 `--fix` 自动修复 |
| **Prettier** | Computational | 文件保存 / git commit | Prettier | 配合 `lint-staged` |
| **TypeScript** | Computational | git push / CI | `tsc --noEmit` | `strict: true` |
| **单元测试** | Computational | git push / CI | Vitest / Jest | 覆盖率门禁 |
| **组件测试** | Computational | git push | React Testing Library | 按用户行为测试 |
| **E2E 测试** | Computational | CI（合并前） | Playwright / Cypress | 关键路径覆盖 |
| **构建检查** | Computational | CI | `npm run build` | 确保能正常打包 |
| **Bundle 分析** | Computational | CI（PR） | `vite-bundle-analyzer` | 超过阈值告警 |
| **AI Code Review** | Inferential | PR 创建时 | LLM as Judge | 语义层面的审查 |

### 5.3 Claude Code 中的 Hooks 配置

> Claude Code 支持在关键事件前后注入自动化脚本，这是 Harness Engineering 的核心实现方式。

```json
// .claude/settings.json（项目级）或 ~/.claude/settings.json（全局级）
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "npx prettier --write ${path} && npx eslint --fix ${path}",
            "timeout": 30000
          }
        ]
      },
      {
        "matcher": "",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit",
            "timeout": 60000
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash(npm test)",
        "hooks": [
          {
            "type": "command",
            "command": "npx tsc --noEmit"
          }
        ]
      }
    ]
  }
}
```

### 5.4 lint-staged + husky 集成（传统 Git Hooks）

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
npx tsc --noEmit
```

```bash
# .husky/pre-push
npm test -- --coverage
```

### 5.5 Sensor 设计原则

1. **快速优先**：Lint/Format 在 1-3 秒内完成，放本地；E2E 测试可能 5-10 分钟，放 CI
2. **可自动修复优先**：能 `--fix` 的就自动修，不要让人去改 AI 的格式问题
3. **失败必须有信息量**：不是"Test failed"，而是"哪个文件哪行期望什么实际什么"
4. **按变更范围运行**：只跑改了的部分（lint-staged、jest --changedSince），不要每次都全量
5. **Inferential Sensor 做兜底**：AI Code Review 在 PR 创建时运行，检查规则做不到的语义判断

---

## 六、Git 工作流 × AI 集成

### 6.1 分支策略与 AI 行为映射

```
main (生产)     ← 严格保护分支，不允许直接提交
  ↑
pp (预生产)     ← 上线前最后验证
  ↑
staging (测试)  ← QA 测试环境
  ↑
dev (开发)      ← 日常开发分支
  ↑
feature/xxx     ← 从 dev 切出，每个需求一个分支
```

**AI 在每个阶段的行为**：

| 阶段 | AI 职责 |
|------|---------|
| 创建分支前 | 自动生成 Git Issue（需求 → 标准化 Issue） |
| feature 分支开发 | TDD 开发 → 每步通过 Sensors → 自动 commit |
| 推送到 dev | 自动生成 PR 描述（含变更摘要 + Issue 链接） |
| PR 创建后 | CI 运行全部 Sensor → 失败自动修复 → 重新推送 |
| 合并到 staging | AI 生成 Release Notes 草稿 |
| 合并到 main | AI 生成 Changelog + Tag |

### 6.2 Git Issue 自动生成

> **格式模板详见**：[`formats/git-issue-format.md`](./formats/git-issue-format.md)

核心设计理念：
- **结构化**：AI 可以从一句话需求 → 标准化 Issue 格式
- **可追溯**：每个 Issue 有唯一的类型标签、优先级、关联模块
- **可执行**：验收标准用 Given/When/Then 格式，可直接转为测试用例

一句话需求示例：
```
"用户登录页面的密码输入框需要支持显示/隐藏切换"
```

AI 自动生成标准化 Issue，包含：
- 标题（遵循 Conventional 风格）
- 类型标签（feature / bug / refactor / docs）
- 优先级（P0-P3）
- 背景与目的
- 验收标准（Given/When/Then）
- 技术要点（给开发者看的技术提示）
- 关联信息（分支、依赖、估时）

### 6.3 PR 描述自动生成

> **格式模板详见**：[`formats/pr-format.md`](./formats/pr-format.md)

核心设计理念：
- **自动关联**：AI 从分支名和 commit 历史中提取信息
- **变更摘要**：AI 自动生成"做了什么、为什么、怎么做的"
- **检查清单**：预置 Code Review checklist

PR 描述结构：
```markdown
## 概述
一句话说明这个 PR 做什么

## 关联 Issue
Closes #[issue号]

## 变更类型
- [ ] 新功能 / [ ] Bug 修复 / [ ] 重构 / [ ] 文档

## 变更详情
### 新增
### 修改
### 删除
### 依赖变更

## 测试
- [ ] 单元测试通过
- [ ] 组件测试通过
- [ ] TypeScript 检查通过
- [ ] Lint 检查通过

## 截图/录屏（如有 UI 变更）

## Code Review 自查
- [ ] 类型安全（无 any / as）
- [ ] 错误处理完整
- [ ] 可访问性（a11y）
- [ ] 性能考虑
```

### 6.4 CI/CD 流水线中的 AI 节点

```yaml
# .github/workflows/ci.yml（概念版）
jobs:
  lint-and-type:
    steps:
      - run: npx eslint .
      - run: npx tsc --noEmit

  test:
    steps:
      - run: npm test -- --coverage

  ai-review:
    needs: [lint-and-type, test]
    steps:
      - name: AI Code Review
        # Claude Code / Cursor 自动审查 PR diff
        run: claude --review-pr ${{ github.event.pull_request.number }}

  auto-fix:
    if: failure()
    steps:
      - name: AI auto-fix lint/test failures
        run: claude --auto-fix
      - name: Push fixes
        run: git push
```

---

## 七、Greenfield 项目全流程

> Greenfield = 从零开始的新项目。AI 的优势在这里最明显——可以从第一行代码就保持一致性。

### 7.1 阶段总览

```
Phase 1: 项目脚手架与约束体系  (1-2h)
Phase 2: 需求 → Spec → 任务拆解  (每需求 30-60min)
Phase 3: TDD 编码循环             (每任务 30min-2h)
Phase 4: Code Review + CI 验证    (每次 push)
Phase 5: 部署 + 文档              (每迭代)
```

### 7.2 Phase 1：项目脚手架与约束体系

**目标**：在写第一行业务代码之前，搭好 AI 能"正确工作"的底座。

```
Step 1: 初始化项目
├── npm create vite@latest my-app -- --template react-ts
└── AI 辅助：不需要，脚手架就够

Step 2: 配置质量工具
├── ESLint + Prettier + 规则集（airbnb / canonical / 自选）
├── husky + lint-staged
├── Vitest + React Testing Library + MSW
├── Playwright（E2E）
└── AI 辅助：让 AI 生成配置文件，你来审核

Step 3: 编写 CLAUDE.md（项目级约束）
├── 技术栈声明
├── 目录结构约定
├── 编码规范
├── 测试策略
└── AI 行为约束
→ 参考本文 §3.2 模板

Step 4: 建立 Git 工作流
├── 分支保护规则
├── Issue Label 模板
├── PR 模板
└── AI 辅助：从模板自动生成

Step 5: 创建 Skills 集
├── /spec、/feat、/test、/review、/debug
└── 参考本文 §4.3 模板
```

**验证标准**：走到这一步后，让 AI 帮你实现一个小功能（如"一个 Hello World 页面"），观察它生成的代码是否自动符合你的规范。不符合 → 回去调 CLAUDE.md。

### 7.3 Phase 2：需求 → Spec → 任务拆解

```
用户需求（一句话/一段话）
        │
        ▼
   AI 生成标准化 Git Issue     ← 用 /init-issue skill
   (见 formats/git-issue-format.md)
        │
        ▼
   AI 生成 Spec 文档            ← 用 /spec skill
   ├── 功能概述
   ├── UI/UX 描述
   ├── 技术方案
   ├── 验收标准 (Given/When/Then)
   └── 影响范围
        │
        ▼
   人工 Review + 修改 Spec       ← 你在这里把关
        │
        ▼
   AI 拆解为子任务列表           ← 用 /feat skill
   ├── 任务 1：类型定义
   ├── 任务 2：API 层
   ├── 任务 3：核心 Hook
   ├── 任务 4：UI 组件
   └── 任务 5：集成 + E2E
```

**关键原则**：AI 生成 Spec，人做决策。不要让 AI 替你做技术选型——这是架构层的决策。

### 7.4 Phase 3：TDD 编码循环

针对每个子任务：

```
┌──────────────────────────────────────┐
│ RED：AI 生成测试用例 checklist        │
│ 你确认 → AI 写测试代码（red test）     │
├──────────────────────────────────────┤
│ GREEN：AI 写最小实现让测试通过         │
│ 自动运行 lint + typecheck + test      │
│ ✗ → AI 修复 → 重新验证 → ✓           │
├──────────────────────────────────────┤
│ REFACTOR：AI 识别重构机会             │
│ AI 执行重构 → 测试仍然通过            │
├──────────────────────────────────────┤
│ COMMIT：AI 生成 Conventional Commit   │
│ message → 你确认 → git commit        │
└──────────────────────────────────────┘
```

### 7.5 Phase 4 + 5：CI 验证 + 部署

```
git push → PR 自动创建（AI 生成描述）
         → CI 全量 Sensor 运行
         → AI Code Review
         → ✗ → AI 修复 → 重新 push
         → ✓ → 等待人工 Code Review
              → 合并到 dev → staging → pp → main
```

---

## 八、Brownfield 项目全流程

> Brownfield = 在已有代码库上工作。这是大部分真实工作的场景，也是 AI 最容易"水土不服"的场景。

### 8.1 Brownfield vs Greenfield 的核心差异

| 维度 | Greenfield | Brownfield |
|------|-----------|------------|
| AI 一致性 | 天然一致（从第一行就遵循规范） | 需要额外约束（新旧代码风格可能不同） |
| 上下文需求 | 只需当前 spec | 需要理解已有代码的约定和边界 |
| 风险 | 过度设计 | 破坏现有功能 |
| AI 主要挑战 | 生成速度 | 理解现有代码的隐含约定 |

### 8.2 Brownfield 项目接入 AI 的 5 个步骤

#### Step 1：逆向建立约束体系

```
任务：为已有项目建立 CLAUDE.md
方法：
├── 让 AI 扫描项目结构 → 自动生成目录树
├── 让 AI 读取 package.json → 提取技术栈
├── 让 AI 读 ESLint/TSConfig → 提取编码规范
├── 让 AI 读 3-5 个典型组件 → 提取代码风格
├── 你补充业务逻辑约定（命名、状态管理、API 模式等）
└── 输出：项目级 CLAUDE.md
```

**提示词示例**：
```
请扫描这个项目的以下文件，帮我生成 CLAUDE.md：
1. package.json（技术栈）
2. tsconfig.json（TypeScript 配置）
3. .eslintrc.*（代码规范）
4. src/ 目录结构（模块组织方式）
5. 随机选 5 个 .tsx 组件（代码风格）

归纳出项目的：技术栈、目录结构、编码规范、命名约定、测试策略。
输出为 CLAUDE.md 格式。
```

#### Step 2：建立测试安全网

```
如果项目缺少测试（大多数 Brownfield 项目的现实）：

策略 A：先补核心路径的测试（happy path）
├── 让 AI 为一个核心页面/组件生成测试
├── 只测用户可感知的行为（渲染、交互、数据展示）
├── 目标：确保现有功能不被破坏
└── 耗时：每核心组件 30-60min

策略 B：快照测试（临时方案，后续替换为行为测试）
├── 让 AI 为现有页面生成快照测试
├── 快速覆盖大量代码 → 具备基本的回归检测能力
└── 缺点：快照测试维护成本高，后续需替换

策略 C：E2E 优先（如果 UI 稳定）
├── 为关键业务路径编写 E2E 测试
├── Playwright codegen 录制 + AI 优化
└── 覆盖：登录 → 核心功能 → 退出
```

#### Step 3：定义"改动边界"

```
原则：不一次重构整个项目，而是为每次改动划定安全区。

例如：要修改用户列表页的筛选逻辑

安全区定义：
├── 直接改动范围：UserList 组件 + useUserFilter Hook
├── 间接影响范围：依赖 User 类型的其他组件（通过 tsc 自动检测）
├── 回归测试范围：UserList 的测试 + 引用 User 类型的组件的测试
└── AI 行为约束："只修改 UserList 和 useUserFilter，不要动其他文件"
```

#### Step 4：增量式规范对齐

```
策略：每次改动一个文件，让它向新规范靠近一步。

原文件（不符合规范）：
```tsx
// 问题：无类型、无 JSDoc、class 组件
class UserList extends React.Component {
  render() { return <div>...</div> }
}
```

改动时（不要一次性重构整个文件！）：
1. 只改你要改的那部分
2. 如果是新加功能，新代码按规范写
3. 如果改到了某个函数/组件，顺带加类型 + JSDoc
4. 不要为了"统一风格"而去改没关系的代码
```

#### Step 5：建立 Brownfield 专用的 AI 工作流

```
改动前：
┌── 让 AI 分析改动影响范围（基于 tsc 的类型依赖图）
├── 让 AI 列出需要更新的测试（如果测试存在）
└── 你确认改动方案

改动中：
┌── TDD 编写（如果有测试基础）
├── 或先写实现，改动后补测试（如果没有测试基础）
└── 每次保存触发 Sensors

改动后：
┌── 运行全量（或受影响范围的）测试
├── AI 生成改动摘要
├── AI 检查：是否引入了与旧代码风格严重不一致的代码？
└── 提交
```

### 8.3 Brownfield 常见陷阱与应对

| 陷阱 | 现象 | 应对 |
|------|------|------|
| **AI 不了解隐含约定** | AI 生成的代码虽然能跑但与项目风格不一致 | 把典型代码示例放入 CLAUDE.md |
| **AI 过度重构** | 改一个功能顺带重写了半个文件 | 明确约束："只改目标函数/组件，保持其他代码不变" |
| **破坏性改动** | 改了一个"看起来无关"的函数，影响了 20 个调用方 | 改动前让 AI 分析影响范围 |
| **测试缺失的恐惧** | 不敢改，因为不知道会不会破坏什么 | 先补特征测试（Characterization Test），再改动 |
| **AI 用新技术栈** | AI 建议"用 React Query 替换现有的 useEffect + fetch" | 在 CLAUDE.md 中明确：技术选型变更需要人工决策 |

---

## 九、TDD + AI 深度结合

> 这是你简历上最能打的差异化亮点——"TDD + AI 协作"。
>
> 理论基础见 [`04-SDD+TDD.md`](./04-SDD+TDD.md)。

### 9.1 为什么 TDD + AI 是黄金组合？

| 纯 AI 编码 | TDD + AI 协作 |
|------------|--------------|
| AI 一次生成 200 行，你肉眼检查 | AI 先列 test cases，你确认后分批实现 |
| 没有测试保护，重构不敢动手 | 测试覆盖下，AI 大胆重构 |
| AI 可能误解需求，你事后才发现 | 测试 = 可执行的需求文档，AI 理解偏差立即暴露 |
| 代码可测试性差（耦合严重） | TDD 天然驱动松耦合设计 |
| 面试时只能说"我用 AI 写代码" | 面试时能说"我设计了一套 TDD+AI 工作流" |

### 9.2 TDD + AI 的具体工作流

```
Step 0: 你告诉 AI 需求（或给它 Spec 文档）

Step 1 — RED（5 min）
├── AI：生成 test cases checklist（覆盖 happy path + edge cases + error cases）
├── 你：审核 checklist，补充遗漏的边界条件
├── AI：生成测试代码
├── 你：确认测试代码语义正确
└── 运行测试 → 🔴 RED（符合预期，因为实现还没写）

Step 2 — GREEN（5-15 min）
├── AI：生成最小实现代码
├── Sensors 自动运行：lint ✓ / format ✓ / typecheck ✓ / test ✓
├── 如果有 ✗ → AI 阅读错误信息 → 自动修复 → 重新验证
└── 全部 ✓ → 🟢 GREEN

Step 3 — REFACTOR（5-10 min）
├── AI：分析代码，提出重构建议（提取函数/优化命名/去重复）
├── 你：审核重构建议（有些 AI 的重构可能过度）
├── AI：执行重构
└── 运行测试 → 仍然是 🟢 GREEN → Refactor 成功

Step 4 — COMMIT
├── AI：基于改动内容生成 Conventional Commit message
└── 你：确认 → git commit
```

### 9.3 测试用例 Checklist 模式

每次让 AI 开发功能前，先让它生成这个 checklist：

```markdown
## 测试用例 Checklist — [功能名]

### Happy Path（正常路径）
- [ ] 用户输入有效数据 → 提交成功 → 看到成功提示
- [ ] 用户点击取消 → 返回上一页

### Edge Cases（边界条件）
- [ ] 输入为空 → 提交按钮禁用
- [ ] 输入达到最大长度 → 不能继续输入
- [ ] 输入含特殊字符 → 正确转义
- [ ] 网络超时 → 显示重试按钮
- [ ] 并发提交 → 防止重复提交

### Error Cases（错误情况）
- [ ] API 返回 500 → 显示通用错误提示
- [ ] API 返回 401 → 跳转登录页
- [ ] API 返回 422（校验失败）→ 显示字段级错误

### Accessibility（可访问性）
- [ ] 表单字段有正确的 label/aria 属性
- [ ] 错误提示与输入框正确关联（aria-describedby）
- [ ] 键盘 Tab 顺序正确
```

### 9.4 测试覆盖率的务实态度

```
目标不是 100% 覆盖率，而是"有信心改代码"。

优先级：
P0 — 核心业务逻辑的单元测试（纯函数、状态机、工具函数）
P1 — 关键 UI 交互的组件测试（用户能看到和操作的）
P2 — 关键路径的 E2E 测试（登录→核心操作→退出）
P3 — 边缘场景 + 快照测试（锦上添花）
```

---

## 十、面试视角：前端 AI 岗位考察什么

> 这一节专门为"找前端 AI 岗位"设计。
> 目标：让你不仅能使用 AI，还能在面试中**清晰表达你的 AI 协作方法论**。

### 10.1 面试官眼中的"前端 AI 能力"模型

```
基础层（必须过关）
├── 能用 AI 写代码（Copilot / Cursor / Claude Code 至少熟练一种）
├── 能写出有约束的提示词（不只是"帮我写个组件"）
└── 理解 AI 的局限性（幻觉、上下文窗口、Token 成本）

进阶层（区分度大）
├── 有系统化的 AI 工作流（不只是用 AI 写代码，而是全链路集成）
├── 有自己的 Skills 库（可复用的 AI 工作流模块）
├── 能在已有项目中接入 AI（Brownfield 经验）
└── 有 TDD + AI 的实践经验

高级层（面试亮点）
├── 设计了自动化质量门禁（Sensors / Hooks）
├── 有团队级 AI 约束体系设计经验（CLAUDE.md / Rules）
├── 能编排多个 Agent 协作完成复杂任务
└── 有自己的 AI 工具链选择方法论（为什么选这个而不是那个）
```

### 10.2 高频面试问题及回答框架

#### Q1：「你平时怎么用 AI 辅助前端开发？」

**差回答**：「我用 Copilot 写代码，挺方便的。」

**好回答的结构**：

> 我建立了一套系统化的 AI 工作流。分三个层面：
>
> **编码层**：日常用 Claude Code，按 TDD 流程协作——先让 AI 列出测试用例，我确认后它生成测试代码，再生成实现。每次代码改动后自动运行 ESLint + TypeScript + 测试作为质量门禁。
>
> **流程层**：从需求开始就有 AI 参与——自动生成标准化 Git Issue，开发完成后自动生成 PR 描述并关联 Issue，CI 流水线里集成了 AI Code Review。
>
> **架构层**：我在每个项目里维护 CLAUDE.md 作为项目级约束，还封装了 5-6 个常用 Skill（如 `/feat`、`/review`、`/refactor`），让 AI 每次都按统一标准工作。
>
> 举个例子，最近做的一个功能从需求到上线，AI 帮我处理了约 60% 的代码量和 80% 的样板工作，我的精力主要花在架构决策和 Code Review 上。

#### Q2：「AI 写的代码你怎么保证质量？」

> 我设计了一个三层质量门禁体系：
>
> **第一层（实时）**：每次 AI 写代码后，Claude Code 的 PostToolUse Hook 自动运行 ESLint + Prettier。格式问题秒级修复，不需要我操心。
>
> **第二层（提交前）**：husky pre-commit 跑 lint-staged + TypeScript 类型检查。类型不对的根本提交不了。
>
> **第三层（CI）**：Push 后跑全量测试 + 覆盖率检查 + AI Code Review。测试覆盖率掉到阈值以下会直接拦截。
>
> 另外我的工作流是 TDD——测试就是可执行的需求文档。AI 理解偏了，测试直接报错，不会等到 Code Review 才发现。
>
> 这套体系的核心思想来自 Harness Engineering：Feedforward（CLAUDE.md 约束）告诉 AI 怎么做，Sensors（自动化检查）验证 AI 做对了没有。

#### Q3：「你怎么让 AI 理解你们项目的代码规范？」

> 不是靠每次对话重申，而是靠一套**项目级 AI 约束体系**。
>
> 核心文件是 `CLAUDE.md`，放在项目根目录，里面声明了：技术栈、目录结构、编码规范（组件声明方式、类型要求、JSDoc 要求）、命名约定、测试策略、还有 AI 行为约束（多久确认一次、改动几个文件要列计划等）。
>
> 对于特定模块还有更细的规则文件，比如 API 层有专门的错误格式约定。
>
> 这套体系的好处是：新人（或新 AI 会话）打开项目，AI 自动就知道规范，不需要每次重新"教育"。
>
> 我还会定期（每 2-3 个 Sprint）review CLAUDE.md，删掉过时规则、补充新约定。

#### Q4：「你有没有把 AI 工作流沉淀给团队其他人用过？」

> 有的。我把自己常用的工作流封装成了 Skills 技能集，比如 `/feat` 是按 TDD 做功能开发、`/review` 是多维度代码审查。
>
> 每个 Skill 有标准化的输入输出和执行流程，团队成员直接调用就行，不需要自己写提示词。
>
> 另外我设计了标准化的 Git Issue 和 PR 模板，AI 能自动填充这些模板，团队不用手写重复内容。
>
> 这套东西我放在独立仓库里，新项目引用即可，已经帮 3 个项目统一了 AI 工作流。

#### Q5：「在已有项目（非新项目）中接入 AI，你遇到过什么坑？」

> 最大的坑是**隐含约定**。新项目从零开始，AI 生成的代码天然一致；老项目有很多"约定俗成"的东西——比如某个组件总是这样命名、某个状态总是通过 props 而不是全局 store 传。
>
> 我的解法是先花 1-2 小时逆向建立 CLAUDE.md：让 AI 扫描项目结构、读配置文件、读几个典型组件，自动提取归纳代码风格，我再补充业务逻辑约定。
>
> 第二个坑是**测试缺失**。很多老项目没什么测试，直接让 AI 改代码风险很大。我的策略是：在改任何功能前，先让 AI 写特征测试（Characterization Test）——把当前行为固化为测试，这样至少知道改完后有没有破坏原有功能。
>
> 第三个坑是**AI 忍不住重构**。明明只让它改一个函数，它可能顺手把整个文件"优化"了一遍。我必须在约束里明确："只修改目标函数/组件，保持其他代码不变"。

#### Q6：「你觉得前端 AI 岗位的核心竞争力是什么？」

> 不是"会用 AI 工具"——工具门槛越来越低。真正的竞争力是：
>
> 1. **系统化能力**：能把 AI 编入完整的工作流（不只是某个环节用 AI），形成可复制的方法论
> 2. **判断力**：知道什么该让 AI 做（执行层）、什么该自己做（架构层、安全层、体验层）
> 3. **约束设计能力**：能把团队的隐性知识转化为 AI 可执行的显性规则
> 4. **工程化思维**：用 Harness Engineering 的思路设计 Feedforward + Feedback 双回路，而不是靠"每次盯紧 AI"
> 5. **持续优化意识**：不断审视和改进 AI 工作流，把"人 + AI"的协作效率推向极致

### 10.3 如何在项目中体现 AI 能力（简历/作品集）

| 体现方式 | 具体操作 |
|----------|----------|
| **GitHub Profile** | 在你的个人网站/笔记仓库中展示 CLAUDE.md 和 Skills 的设计思路 |
| **项目 README** | 写出"AI 协作说明"章节，说明这个项目如何与 AI 协作开发 |
| **PR 历史** | 你的 PR 描述有结构、有 AI 协作痕迹（如 AI-generated summary），本身就是能力的证明 |
| **博客/笔记** | 把 AI 工作流的思考和迭代写成笔记（就像本文档），面试时直接给面试官看 |
| **开源贡献** | 为开源项目设计 CLAUDE.md 或 Skills，展示你能在 Brownfield 项目中接入 AI |
| **演讲/分享** | 在公司或社区分享"前端 × AI 工作流"，既是输出也是学习 |

### 10.4 你当前需要补的短板（自检清单）

基于你说的背景（React+TS、TDD、想找前端 AI 岗位），按优先级排列：

- [ ] **动手建立个人 AI 工作流**：在你下一个项目（哪怕是练习项目）中完整走一遍 Greenfield 流程
- [ ] **搭建 Brownfield 案例**：找一个你的老项目，按 §8.2 的步骤接入 AI，产出 CLAUDE.md + 测试安全网
- [ ] **封装 5+ 个 Skill**：把最常用的工作流封装为可复用 Skill，放在独立仓库
- [ ] **设计 Sensor 矩阵**：至少把 Lint + TypeCheck + Test 集成到 Claude Code Hooks 中
- [ ] **整理面试话术**：用 §10.2 中的框架准备你自己的回答（用你自己的项目经验填充）
- [ ] **了解 AI 成本模型**：能说出 Token 怎么算、上下文窗口多大、不同模型的价格差异
- [ ] **了解 AI 安全**：能说出 AI 生成代码的安全风险（注入攻击、密钥泄露、依赖供应链等）
- [ ] **关注一个 AI 工具的前沿动态**：了解 Claude Code / Cursor / Copilot 的最新功能，能说出差异化

---

## 十一、附录：工具链速查

### 11.1 推荐工具链

| 类别 | 工具 | 用途 |
|------|------|------|
| AI 编码 | Claude Code / Cursor / GitHub Copilot | 日常编码辅助 |
| Skills 管理 | Superpowers / OpenSpec | Skills 框架 |
| 代码质量 | ESLint + Prettier + TypeScript strict | 静态检查 |
| 测试 | Vitest + React Testing Library + MSW + Playwright | 分层测试 |
| Git Hooks | husky + lint-staged + commitlint | 提交质量控制 |
| CI/CD | GitHub Actions / GitLab CI | 自动化流水线 |
| MCP | Figma MCP / GitHub MCP / 自定义 MCP | 扩展 AI 能力边界 |
| 文档 | Storybook / Docusaurus | 组件文档 |

### 11.2 学习路线图

```
第 1 周：基础夯实
├── 阅读 02-concepts.md（AI 核心概念）
├── 阅读 05-harness-engineering.md（Feedforward + Feedback）
└── 在 1 个小项目中尝试用 AI 写 3 个组件

第 2 周：工作流搭建
├── 为你的主力项目编写 CLAUDE.md
├── 配置 Sensor 矩阵（至少 Lint + TypeCheck + Test）
├── 封装前 3 个 Skill（/feat、/review、/test）
└── 实际走完一个需求的完整流程

第 3 周：深度整合
├── 设计 Git Issue / PR 自动化（用 §6 的模板）
├── Brownfield 项目接入（如果你有老项目）
├── CI 流水线中加入 AI Code Review
└── 阅读 07-多智能体合作.md

第 4 周：面试准备
├── 整理你的 AI 工作流方法论（用 §10.2 的框架）
├── 准备 3 个具体的项目案例
├── 补漏：Token 成本计算、AI 安全风险、前沿动态
└── 模拟面试：把 §10.2 的问题全部用你自己的话回答一遍
```

### 11.3 相关资源

- [Harness Engineering for Coding Agent Users](https://martinfowler.com/articles/harness-engineering.html) — Birgitta Böckeler, Thoughtworks
- [Superpowers 技能集](https://www.skills.sh/obra/superpowers) — 标准化 AI 工作流
- [OpenSpec](https://github.com/openspec) — Spec-Driven Development 工具
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents) — Anthropic 官方 Agent 设计指南

---

> **最后的话**：AI 工作流不是一次设计就完事的。它是一套活的体系——每做一个项目、每踩一个坑、每学一个新工具，都往里面加东西。本文档会持续更新，欢迎把它们整理成你自己的版本。
>
> **下一步**：选一个项目，从 §7.2 开始，真正动手走一遍。读再多方法论，不如实操一次有体感。
