# Git Issue 标准化格式

> 设计目标：
> 1. **AI 可自动填充**——输入一句话需求，AI 按此模板生成标准化 Issue
> 2. **人类可快速扫读**——结构清晰，关键信息一目了然
> 3. **可追溯**——每个 Issue 有明确的类型、优先级、关联信息
> 4. **可执行**——验收标准用 Given/When/Then，可直接转测试用例

---

## 格式模板

```markdown
---
type: feature | bug | refactor | docs | chore | perf
priority: P0 | P1 | P2 | P3
status: open
branch: feature/<short-name>
depends_on: [#issue号] (可选)
estimated_hours: N (可选)
---

## 标题

<type>(<scope>): <简短描述>

<!--
标题遵循 Conventional Commits：
  feat(auth): 支持密码显示/隐藏切换
  fix(modal): 修复 Esc 键无法关闭弹窗
  refactor(api): 统一错误处理格式
-->

## 背景

<为什么需要这个需求？解决了什么问题？给谁用？>

## 描述

### 当前行为（Bug 类必填）

<现在发生了什么？>

### 期望行为

<应该发生什么？>

## 验收标准

<!-- 用 Given/When/Then 格式，每条可独立验证 -->

### Scenario 1: <场景名>

- **Given** <前置条件>
- **When** <用户操作>
- **Then** <预期结果>

### Scenario 2: <场景名>

- **Given** <前置条件>
- **When** <用户操作>
- **Then** <预期结果>

## 技术要点

<!-- 给开发者的技术提示，非必填但建议填写 -->

- **涉及文件**：`src/features/<module>/...`
- **API 依赖**：`POST /api/xxx`
- **类型定义**：`src/types/xxx.ts`
- **注意事项**：<兼容性、性能、安全等>

## 附件（可选）

- 设计稿链接：
- API 文档链接：
- 相关 PR：
```

---

## AI 填充该模板的 System Prompt 片段

将此段放入 CLAUDE.md 或 Skill 定义中：

```markdown
## Git Issue 生成规范

当用户描述一个需求时，按以下规则生成 Issue：

### 类型判断
- 新增功能 → `feature`
- 修复 Bug → `bug`
- 代码重构（不改变行为）→ `refactor`
- 仅文档变更 → `docs`
- 构建/依赖/CI → `chore`
- 性能优化 → `perf`

### 优先级判断
- P0：线上故障、阻塞发布、安全漏洞
- P1：核心功能、本 Sprint 必须完成
- P2：重要但可延期
- P3：锦上添花、技术债

### 标题格式
- 中文描述，英文 type 前缀
- scope 用模块名（auth / user / order / dashboard ...）
- 标题 ≤ 72 字符

### 验收标准
- 每个 Scenario 只描述一个行为
- Happy Path 至少 1 条
- Edge Case 至少 2 条（空状态、网络错误、边界值）
- 用 Given/When/Then 格式
```

---

## 实际示例

### 示例 1：新功能

```markdown
---
type: feature
priority: P1
status: open
branch: feature/password-toggle
estimated_hours: 4
---

## 标题

feat(auth): 登录页密码输入框支持显示/隐藏切换

## 背景

用户在输入密码时经常输错，需要反复删除重输。
增加显示/隐藏切换可以显著减少密码输入错误率，提升登录体验。

## 描述

### 期望行为

在登录页的密码输入框右侧增加一个切换按钮（眼睛图标），
点击可在"显示密码（明文）"和"隐藏密码（圆点）"之间切换。

## 验收标准

### Scenario 1: 默认隐藏密码

- **Given** 用户打开登录页面
- **When** 页面加载完成
- **Then** 密码输入框的 type 为 "password"，显示圆点遮蔽
- **And** 切换按钮显示为"闭眼"图标

### Scenario 2: 点击显示密码

- **Given** 用户正在登录页，密码为隐藏状态
- **When** 用户点击密码框右侧的切换按钮
- **Then** 密码输入框的 type 变为 "text"，密码明文可见
- **And** 切换按钮变为"睁眼"图标

### Scenario 3: 再次点击隐藏密码

- **Given** 密码当前为明文显示状态
- **When** 用户再次点击切换按钮
- **Then** 密码输入框恢复为 "password" 类型
- **And** 切换按钮恢复为"闭眼"图标

### Scenario 4: 键盘无障碍

- **Given** 用户正在使用键盘导航
- **When** 用户 Tab 到切换按钮并按下 Enter/Space
- **Then** 按钮行为与点击一致
- **And** 按钮有正确的 aria-label 属性

## 技术要点

- **涉及文件**：`src/features/auth/components/LoginForm.tsx`
- **注意事项**：切换时不能丢失已输入的密码内容（光标位置保持）
```

### 示例 2：Bug 修复

```markdown
---
type: bug
priority: P1
status: open
branch: fix/modal-esc-close
estimated_hours: 2
---

## 标题

fix(modal): 修复 Esc 键无法关闭嵌套弹窗的问题

## 背景

用户在订单流程中，先打开"选择地址"弹窗，再在该弹窗内打开"新增地址"弹窗。
此时按 Esc 键，预期关闭"新增地址"弹窗，但实际两个弹窗都关闭了。

## 描述

### 当前行为

按 Esc 键后，所有弹窗同时关闭。
用户丢失已填写的地址信息，需要重新操作。

### 期望行为

按 Esc 键只关闭最顶层（最近打开）的弹窗。
底层弹窗保持打开，用户可继续操作。

## 验收标准

### Scenario 1: Esc 关闭顶层弹窗

- **Given** 用户打开了弹窗 A，在弹窗 A 中又打开了弹窗 B（嵌套 2 层）
- **When** 用户按下 Esc 键
- **Then** 弹窗 B 关闭
- **And** 弹窗 A 保持打开

### Scenario 2: 只有一层弹窗时 Esc 正常关闭

- **Given** 用户打开了弹窗 A（仅 1 层）
- **When** 用户按下 Esc 键
- **Then** 弹窗 A 关闭

### Scenario 3: 点击遮罩层关闭顶层弹窗

- **Given** 弹窗 A 和弹窗 B 同时打开（嵌套）
- **When** 用户点击弹窗 B 外的遮罩层
- **Then** 弹窗 B 关闭
- **And** 弹窗 A 保持打开

## 技术要点

- **涉及文件**：`src/components/Modal/Modal.tsx`、`src/hooks/useModalStack.ts`
- **根因分析**：`useModalStack` 的 keydown 监听器没有区分弹窗层级
```

---

## 配套自动化脚本思路

### AI 生成 Issue 的 Skill 定义

```markdown
# Skill: /init-issue

## 触发方式
/init-issue <需求描述>

## 执行流程
1. 分析需求描述，确定 type、priority、scope
2. 按 Git Issue 格式模板填充
3. 生成至少 3 个 Scenario（1 happy + 2 edge）
4. 自动建议分支名
5. 输出标准化 Issue，等待用户确认后创建
```

### GitHub Actions 自动创建 Issue（概念）

```yaml
# .github/workflows/ai-issue.yml
on:
  issues:
    types: [opened]

jobs:
  enrich-issue:
    runs-on: ubuntu-latest
    steps:
      - name: AI 补充 Issue 信息
        # 如果 Issue 缺少模板信息，AI 自动补充
        run: claude --enrich-issue ${{ github.event.issue.number }}
```
