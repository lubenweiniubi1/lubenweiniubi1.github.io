# Harness Engineering for Coding Agent Users — 文章分析

> 原文: https://martinfowler.com/articles/harness-engineering.html
> 作者: Birgitta Böckeler (Thoughtworks Distinguished Engineer)
> 日期: 2026-04-02

---

## 一、核心概念：什么是 Harness Engineering？

**Harness（缰绳/ harness）** = Agent 中除了 Model 本身以外的一切。

```
Agent = Model + Harness
```

在 Coding Agent 的上下文中，Harness 分为两层：
- **内层 Harness**（Builder Harness）：Agent 构建者内置的（system prompt、RAG、编排系统等）
- **外层 Harness**（User Harness）：**我们作为使用者**可以构建的引导和传感器

```
┌─────────────────────────────────┐
│        User Harness (外层)       │
│   ┌─────────────────────────┐   │
│   │   Builder Harness (内层)  │   │
│   │   ┌─────────────────┐   │   │
│   │   │     Model        │   │   │
│   │   └─────────────────┘   │   │
│   └─────────────────────────┘   │
└─────────────────────────────────┘
```

外层 Harness 的两个目标：
1. **提高 Agent 一次做对的概率**
2. **提供反馈回路，让 Agent 在人类看到之前自我修正**

---

## 二、核心框架：Feedforward + Feedback

### 2.1 Guides（前馈控制 / Feedforward）

在 Agent 行动**之前**引导它，提高首次生成质量。

| 类型 | 说明 | 示例 |
|------|------|------|
| **Computational（计算型）** | 确定性、由 CPU 执行 | Language Server、CLI 工具、脚本、codemod |
| **Inferential（推理型）** | 语义分析、由 LLM 执行 | AGENTS.md、Skills、Reference Docs、How-to 指南 |

### 2.2 Sensors（反馈控制 / Feedback）

在 Agent 行动**之后**观察结果，帮助它自我修正。

| 类型 | 说明 | 示例 |
|------|------|------|
| **Computational（计算型）** | 快速、可靠、每次变更都可运行 | Linter、Type Checker、静态分析、测试覆盖率、ArchUnit |
| **Inferential（推理型）** | 非确定性但能做语义判断 | AI Code Review Agent、"LLM as Judge" |

> **关键洞察**：只用 Feedback → Agent 反复犯同样的错；只用 Feedforward → 编码了规则但永远不知道是否有效。**两者必须结合**。

---

## 三、Steering Loop（转向循环）

人类的角色不是写代码，而是**通过迭代 Harness 来"驾驶" Agent**：

```
问题出现 → 改进前馈/反馈控制 → 降低问题再次出现的概率 → 循环
```

AI 本身也可以用来改进 Harness：
- 生成结构性测试
- 从观察到的模式生成规则草稿
- 搭建自定义 Linter
- 从代码考古创建 How-to 指南

---

## 四、Keep Quality Left（质量左移）

不同速度/成本的检查分布在开发生命周期的不同阶段：

```
编码时 → 提交前 → PR Review → 集成后 Pipeline → 持续监控
  ↑         ↑                    ↑                    ↑
 LSP     Linter              更贵的检查           漂移检测
         Fast Test            Mutation Test        SLO 监控
         Basic Review         Architecture Review  死代码检测
```

原则：**越早发现，修复成本越低**。

---

## 五、三大 Regulartion Categories（规范维度）

### 5.1 Maintainability Harness（可维护性缰绳）

最成熟的维度，因为有大量现有工具可用。

| 能可靠捕获的 | 只能部分捕获的 | 仍然难以捕获的 |
|-------------|---------------|---------------|
| 重复代码、圈复杂度 | 语义重复代码 | 问题误诊 |
| 测试覆盖率不足 | 冗余测试 | 过度工程 |
| 架构漂移、风格违规 | 暴力修复 | 误解指令 |
| | 过度设计方案 | 正确性（如果没有明确说明） |

### 5.2 Architecture Fitness Harness（架构适配性缰绳）

定义和检查应用的架构特征（Fitness Functions）：
- Skills 中前馈性能需求 + 性能测试反馈
- 日志标准的编码规范 + 调试指令让 Agent 反思日志质量
- 模块边界约束

### 5.3 Behaviour Harness（行为缰绳）⚠️ 最难

这是最大的挑战——如何确保功能行为正确？

**当前常见做法**：
- Feedforward: 功能规格说明（从简短 prompt 到多文件描述）
- Feedback: AI 生成的测试套件 + 手动测试

**问题**：过度信任 AI 生成的测试还不够可靠。`approved fixtures` 模式有前景但不能包治百病。

---

## 六、关键概念

### 6.1 Harnessability（可驾驭性）

并非所有代码库都同样容易 Harness：
- ✅ 强类型语言 → 天然有类型检查
- ✅ 清晰的模块边界 → 可以做架构约束
- ✅ 框架抽象（如 Spring）→ 减少 Agent 需要关心的细节
- ❌ 遗留系统 + 技术债务 → 最需要 Harness 但最难构建

### 6.2 Ambient Affordances（环境可供性）

> "环境本身的结构属性使其对 Agent 而言可读、可导航、可驾驭"

- **Greenfield 项目**：可以从第一天就设计 Harnessability
- **Legacy 项目**：最需要 Harness 但最难构建——这是个矛盾

### 6.3 Harness Templates（缰绳模板）

大多数企业有几种常见服务拓扑（80% 场景）：
- CRUD 业务服务
- 事件处理服务
- 数据仪表盘

→ 这些拓扑可以对应**预置的 Harness 模板**，团队可能根据已有的 Harness 来选择技术栈。

### 6.4 Ashby's Law（阿什比定律）

> 一个调节器必须具备至少与被调节系统同样多的多样性

- LLM Agent 几乎可以生成任何东西 → 多样性极大
- **通过提交到一个拓扑来缩小空间** → 使得全面的 Harness 变得可行
- 定义拓扑是一种"多样性缩减"行为

---

## 七、人类的角色

人类开发者带来的隐性 Harness（Agent 没有的）：
- 吸收的规范和良好实践
- 对复杂性的认知痛苦
- 提交上的名字 = 社会责任感
- **组织对齐**——知道团队在试图达成什么
- 审美厌恶——300 行的函数、重复代码

Agent 没有：
- 社会责任感
- 对糟糕代码的审美直觉
- "我们不这么干"的团队记忆
- 组织上下文

> **Harness 的目标不是完全消除人类输入，而是将人类输入引导到最重要的地方。**

---

## 八、业界实践案例

| 公司/团队 | 实践 |
|-----------|------|
| **OpenAI** | 分层架构 + 自定义 Linter + 结构化测试 + 定期"垃圾回收"扫描漂移 |
| **Stripe** | pre-push hooks + 启发式 Linter + "shift feedback left" + Blueprints |
| **Thoughtworks** | 用计算型 + 推理型传感器对抗架构漂移，"Janitor Army" 提升代码质量 |

---

## 九、开放问题

1. **Harness 一致性**：随着 Harness 增长，如何保持 guides 和 sensors 不互相矛盾？
2. **信任度**：Agent 能在指令和反馈信号冲突时做出合理权衡吗？
3. **覆盖度评估**：如果传感器从不触发，是质量高还是检测不足？（类似代码覆盖率问题）
4. **工具化**：前馈和反馈控制散落在不同交付步骤中，需要工具来统一配置和管理
5. **行为 Harness**：仍然是最大的未解难题

---

## 十、对前端/AI 开发的启示

1. **Skills 封装** = 前馈引导的实践形式（AGENTS.md、How-to guides）
2. **MCP Server** = 计算型前馈引导（让 Agent 访问工具和数据）
3. **AI Code Review** = 推理型反馈传感器
4. **Linter + Type Checker** = 计算型反馈传感器，便宜且可靠
5. **Harness 是可积累的工程资产**：一个好的 Skill 或 Linter 规则可以跨项目复用
6. **团队级 AI 提效的成熟度标志**：从"用 Agent 写代码"进化到"系统性构建 Harness"

---

## 十一、一句话总结

> **Harness Engineering 是把"用好 AI Agent"这件事从个人手艺提升为工程实践的方法论——系统性构建前馈引导和反馈传感器，让 Agent 在越来越少的监督下产出越来越可信的代码。**
