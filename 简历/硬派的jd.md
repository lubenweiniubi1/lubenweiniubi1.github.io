面试准备参考：

1️⃣ AI4SE / Harness Engineering 基本理念
本次面试强调“AI作为工程协作伙伴”的开发方式，类似于 AI orchestration / harness engineering 思路。

建议了解以下概念：
- 如何通过结构化约束提升 AI 输出质量
- 如何将开发过程拆解为“AI可执行的步骤”
- 如何持续迭代和修正 AI 输出，而不是一次性生成代码
- 如何在 AI 辅助下保持架构一致性与可维护性

📌 可参考方向：
- OpenAI 官方关于 AI coding / agents 的工程实践文章 
  [https://openai.com/index/harness-engineering/]
- Anthropic 关于 Claude 在复杂任务拆解与工具使用方面的文章 [https://www.anthropic.com/engineering/harness-design-long-running-apps]
- “AI agent / tool use / workflow orchestration”相关实践内容

建议理解：
AI不是“代码生成器”，而是“可被约束的工程执行体”

2️⃣  DDD（领域驱动设计）基础理解
本次题目涉及一定程度的领域建模能力，建议提前了解：
- Entity / Value Object / Aggregate 的基本概念
- 领域模型与业务规则的关系
- 如何从业务描述中抽象系统结构
- 聚合边界的基本思考方式

📌 推荐参考：
- Domain-Driven Design
- 或任意 DDD 入门资料（重点理解建模思维即可）

3️⃣ 工程能力关注点
本次面试不仅关注“是否能写出功能”，更关注：
- 是否能理解需求并进行合理拆解
- 是否具备基本代码质量与测试意识
- 是否能在 AI 辅助下保持代码结构一致性
- 是否能够持续优化而不是反复推倒重来

4️⃣ 面试形式说明
- 本次为远程编程 + AI辅助开发
- 可以使用任意 AI 工具（如 Cursor / Claude Code / Codex 等）
- 不限制是否使用 AI，但会重点观察 AI 使用方式
- 面试过程更关注“思考与协作过程”，而非最终代码完整度

5️⃣ 建议准备方式
为更好发挥，可以提前思考：
- 如何用 AI 协助设计系统结构，而不是直接生成代码
- 如何逐步约束 AI 输出，使其符合你的设计意图
- 如何在复杂规则变化时保持代码结构稳定
- 如何验证 AI 输出的正确性与一致性

6️⃣ 技术栈与工程环境预期
本次面试为从零构建一个 Web 后端系统的现场编码场景，建议提前具备以下基础认知与准备思路：

后端技术栈（以 Java 为例）
系统实现建议基于常见企业级后端技术栈（不限具体实现方式，请选择合理的技术组件）：
例如：
- Spring Boot（作为基础 Web 框架）
- MyBatis（数据访问层）
- Lombok（简化样板代码）
- MapStruct（DTO / Domain 转换）

并且具备代码分层+职责隔离的基本设计意识。

AI 辅助开发工具使用预期
本次面试允许并鼓励使用 AI 辅助开发工具，例如：
- Cursor
- Claude Code
- Codex

同时可能涉及以下 AI 协作能力，不强制要求以下全部，按实际任务：
- rules（对 AI 输出进行结构约束）
- skills（封装可复用能力或提示模板）
- commands（结构化调用 AI 完成特定任务）
- plugin （插件机制，例如 Superpower 类工具）
- MCP （用于扩展 AI 与外部系统/工具的交互能力）

建议在面试前尝试结合 Harness Engineering 思想，使用 AI 构建一个基于 DDD 分层架构的端到端 CRUD 后端服务，以熟悉在结构化约束下进行 AI 辅助开发的方式。


- 如何通过结构化约束提升 AI 输出质量
- 如何将开发过程拆解为“AI可执行的步骤”
- 如何持续迭代和修正 AI 输出，而不是一次性生成代码
- 如何在 AI 辅助下保持架构一致性与可维护性
