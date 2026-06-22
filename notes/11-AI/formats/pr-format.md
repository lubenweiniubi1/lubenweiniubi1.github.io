# PR 描述标准化格式

> 设计目标：
> 1. **AI 可自动生成**——Push 代码后自动分析 diff，填充 PR 描述
> 2. **关联 Issue**——每个 PR 必须有对应的 Issue 链接
> 3. **Reviewer 友好**——一眼看出改了什么、为什么、风险在哪
> 4. **自查清单**——提交者（和 AI）在提交前完成自查

---

## 格式模板

```markdown
## 📝 概述

<!-- 用 1-3 句话说明这个 PR 做什么、为什么 -->

## 🔗 关联

- **Closes** #[issue号]
- **Related** #[相关 issue 号]（可选）

## 📋 变更类型

- [ ] ✨ 新功能 (feature)
- [ ] 🐛 Bug 修复 (fix)
- [ ] ♻️ 重构 (refactor)
- [ ] 📝 文档 (docs)
- [ ] 🎨 样式 (style)
- [ ] ⚡ 性能 (perf)
- [ ] 🧪 测试 (test)
- [ ] 🔧 构建/工具 (chore)

## 📦 变更详情

### ➕ 新增
- <新增的文件/模块/功能>

### ✏️ 修改
- <修改的文件/模块/功能，说明原因>

### ➖ 删除
- <删除的文件/模块/功能，说明原因>

### 📚 依赖变更
- <新增/升级/移除的依赖>

## 🧪 测试

<!-- 全部通过才能合并 -->

- [ ] 单元测试通过 (`npm test`)
- [ ] 组件测试通过
- [ ] TypeScript 类型检查通过 (`tsc --noEmit`)
- [ ] Lint 检查通过 (`eslint .`)
- [ ] E2E 测试通过（如适用）

### 测试覆盖

| 类型 | 新增 | 总计 |
|------|------|------|
| 单元测试 | +N | N |
| 组件测试 | +N | N |

## 🔍 重点 Review 区域

<!-- 告诉 Reviewer 重点看哪里 -->

1. `<文件路径>` — <为什么需要重点看>
2. `<文件路径>` — <为什么需要重点看>

## 📸 截图 / 录屏

<!-- UI 变更必填，拖入图片或粘贴 GIF -->

| Before | After |
|--------|-------|
| | |

## ✅ Code Review 自查

<!-- 提交者（和 AI）在请求 Review 前完成自查 -->

### 类型安全
- [ ] 无 `any` 类型（特殊情况已注释原因）
- [ ] 无 `as` 类型断言（已用 type predicate 替代）
- [ ] API 响应有完整类型定义

### 错误处理
- [ ] 覆盖了 loading / error / empty 三种状态
- [ ] 用户可见的错误提示友好且可操作
- [ ] 网络异常有重试机制（如适用）

### 性能
- [ ] 无不必要的 re-render（useMemo / useCallback / React.memo 合理使用）
- [ ] 大列表使用虚拟滚动（如适用）
- [ ] 图片懒加载（如适用）

### 可访问性 (a11y)
- [ ] 交互元素可通过键盘访问
- [ ] 表单有正确的 label / aria 属性
- [ ] 颜色对比度符合 WCAG AA 标准

### 安全
- [ ] 无敏感信息硬编码（密钥、Token）
- [ ] 用户输入有适当校验和转义
- [ ] 无 XSS 风险（dangerouslySetInnerHTML 有防范措施）

### 代码质量
- [ ] 命名清晰、符合项目约定
- [ ] 每个导出函数/组件有 JSDoc
- [ ] 无 console.log / debugger 残留
- [ ] 无注释掉的代码

## 🚀 部署注意事项

<!-- 如有特殊部署要求，在此说明 -->

- [ ] 需要数据库迁移：<描述>
- [ ] 需要环境变量变更：<描述>
- [ ] 需要清理缓存：<描述>
- [ ] 依赖其他 PR 先合并：#<PR号>

## 📚 后续任务

<!-- 如有已知的 follow-up 任务，创建 Issue 并在此链接 -->

- [ ] #<issue号> — <描述>
```

---

## AI 自动填充该模板的 System Prompt 片段

将此段放入 CLAUDE.md 或 `/gen-pr` Skill 定义中：

```markdown
## PR 描述生成规范

当用户 push 代码或请求生成 PR 描述时，按以下规则生成：

### 概述
- 从分支名和 commit history 推断 PR 目的
- 1-3 句话，包含：做了什么、为什么、影响范围
- 中文描述

### 关联 Issue
- 从分支名提取 issue 号（如 `feature/issue-42-xxx` → #42）
- 从 commit message 中搜索 `Closes #N` 或 `Refs #N`

### 变更详情
- 运行 `git diff main...HEAD --stat` 获取变更文件列表
- 按 新增/修改/删除 分类
- 每个文件/模块用一句话说明变更原因

### Code Review 自查
- 如果 AI 参与了编码，自动勾选已确认的条目
- 未确认的条目保持未勾选，提醒提交者人工检查

### 重点 Review 区域
- 自动标记：复杂度高的文件（行数 > 200）、核心业务逻辑、不熟悉的模块
```

---

## 实际示例

### 示例：新功能 PR

```markdown
## 📝 概述

为登录页密码输入框增加显示/隐藏切换功能。
用户点击密码框右侧的眼睛图标可在明文和密文之间切换，减少密码输入错误率。

## 🔗 关联

- **Closes** #42

## 📋 变更类型

- [x] ✨ 新功能 (feature)

## 📦 变更详情

### ➕ 新增
- `src/features/auth/components/PasswordInput.tsx` — 带显示/隐藏切换的密码输入组件
- `src/features/auth/components/PasswordInput.test.tsx` — PasswordInput 的组件测试（4 个场景）
- `src/features/auth/components/PasswordInput.stories.tsx` — Storybook story
- `src/components/icons/EyeIcon.tsx` — 眼睛图标（开/闭两种状态）
- `src/components/icons/EyeOffIcon.tsx`

### ✏️ 修改
- `src/features/auth/components/LoginForm.tsx` — 将原生 `<input type="password">` 替换为 `<PasswordInput>`

### ➖ 删除
- 无

### 📚 依赖变更
- 无

## 🧪 测试

- [x] 单元测试通过 (`npm test`)
- [x] 组件测试通过
- [x] TypeScript 类型检查通过 (`tsc --noEmit`)
- [x] Lint 检查通过 (`eslint .`)

### 测试覆盖

| 类型 | 新增 | 总计 |
|------|------|------|
| 组件测试 | +4 | 42 |

## 🔍 重点 Review 区域

1. `src/features/auth/components/PasswordInput.tsx:45-52` — 切换时保持光标位置的逻辑，请确认 edge case 处理
2. `src/features/auth/components/LoginForm.tsx:89` — 替换 input 后，表单提交逻辑是否需调整

## 📸 截图

| Before | After |
|--------|-------|
| ![before](https://...) | ![after](https://...) |

## ✅ Code Review 自查

### 类型安全
- [x] 无 `any` 类型
- [x] 无 `as` 类型断言
- [x] Props 有独立 interface 定义

### 错误处理
- [x] 覆盖了正常显示/隐藏切换
- [x] 键盘操作（Enter/Space）可用
- [x] 切换时不丢失已输入内容

### 可访问性 (a11y)
- [x] 切换按钮有 `aria-label="显示密码"` / `aria-label="隐藏密码"`
- [x] 按钮支持键盘 Enter/Space 触发
- [x] 焦点样式与项目其他按钮一致

### 代码质量
- [x] PasswordInput 有 JSDoc
- [x] EyeIcon / EyeOffIcon 有 JSDoc
- [x] 无 console.log
- [x] 无注释掉的代码

## 🚀 部署注意事项

- 无特殊要求，正常部署即可

## 📚 后续任务

- 无
```

---

## 自动化：AI 生成 PR 描述的 Skill

```markdown
# Skill: /gen-pr

## 触发方式
/gen-pr [可选：base 分支名，默认 dev]

## 执行流程
1. 对比当前分支与 base 分支的 diff
2. 从分支名和 commit history 提取 Issue 号
3. 分类变更文件（新增/修改/删除）
4. 按 PR 格式模板填充
5. 自动勾选已通过 CI 的检查项
6. 标记重点 Review 区域
7. 输出完整 PR 描述，等待用户确认

## 自动化触发
在 CI 中配置：Push 到非 main 分支 → 自动运行此 Skill → 输出到 PR body
```

---

## PR 模板文件位置

在项目中放置此模板，GitHub/GitLab 会自动使用：

```
.github/pull_request_template.md   # GitHub 默认 PR 模板
.gitlab/merge_request_templates/default.md  # GitLab MR 模板
```

或者使用多模板（不同场景不同模板）：

```
.github/PULL_REQUEST_TEMPLATE/
├── feature.md      # 新功能
├── bugfix.md       # Bug 修复
└── refactor.md     # 重构
```
