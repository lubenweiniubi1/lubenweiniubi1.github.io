# Q1 计划：NestJS 认证服务（Tesla 岗位准备）

> **目标周期**：2026-08 ~ 2026-10（12 周）
> **目标岗位**：Tesla 全栈开发工程师（英文流利）MJ012743
> **核心成果**：一个能写进简历、能在面试中被追问细节的后端项目

---

## 一、总目标（12 周结束时的验收标准）

**一句话**：能独立讲清楚一个"生产级 OAuth2 认证服务"的架构、取舍和踩过的坑。

**可验收的产出**：
1. 一个部署在公网可访问的认证服务，URL 可以放进简历
2. GitHub 仓库（README 英文，含架构图、部署说明、API 文档）
3. 前端控制台（React + TS，登录 / 应用管理 / Token 查看）
4. 能用中文 20 分钟、英文 15 分钟讲清楚整个系统

**明确不做的**：
- 不追求"多用户 SaaS"、不做计费、不做多租户
- 不追求 UI 漂亮（能用即可，UI 你已经会了，不是重点）
- 不追求 100% 测试覆盖，只覆盖核心链路

---

## 二、技术选型

| 层 | 选型 | 理由 |
|---|---|---|
| 后端框架 | **NestJS** | TS 生态、装饰器、DI，前端背景切换成本最低 |
| 数据库 | **PostgreSQL 16** | Tesla JD 未明说，但外企主流；Prisma ORM 上手快 |
| ORM | **Prisma** | Schema-first、迁移方便、TS 类型自动生成 |
| 缓存 / Session | **Redis 7** | Token 黑名单、限流计数、验证码存储 |
| 认证协议 | **OAuth2 (Authorization Code + PKCE) + JWT** | 对齐 JD 里的 "Authentication systems" |
| API 文档 | **Swagger / OpenAPI**（NestJS 内置） | 面试必问 "API 设计原则" |
| 前端 | **React 18 + Vite + TS + TanStack Query** | 你熟，快速搭一个能看的控制台 |
| 部署 | **Docker Compose → 一台 2C4G 云主机** | 便宜、真实、能演示 |
| CI | **GitHub Actions** | Lint + Test + Build + Deploy |
| 可观测性 | **pino 日志 + /metrics 端点** | Q1 只做基础，Q3 再上 Prometheus |

**明确不选**：
- ❌ NextAuth：太封装，学不到东西
- ❌ Passport-only 方案：不够体系化
- ❌ MongoDB：外企后端主流仍是关系库，别偏
- ❌ K8s：Q1 用 Compose 就够，Q3 再迁 K8s

---

## 三、12 周里程碑

每个里程碑 = 一个可 demo 的状态。**卡壳超过 3 天必须简化，不许无限拖**。

### M1（Week 1-2）：环境 + Hello World

**做什么**：
- 本地跑通 NestJS + PostgreSQL + Redis（用 Docker Compose）
- Prisma 建 `User` 表，写一个 `GET /users/:id`
- Swagger 能访问
- GitHub 仓库建好，README 英文起草

**验收**：
- [ ] `docker compose up` 一条命令起全部依赖
- [ ] `curl localhost:3000/users/1` 返回 JSON
- [ ] `localhost:3000/docs` 能看到 Swagger UI
- [ ] 提交 GitHub，README 有 "How to run" 英文说明

**卡壳信号**：装环境超过 2 天 → 直接用 GitHub Codespaces。

---

### M2（Week 3-4）：注册 + 密码登录 + JWT

**做什么**：
- `POST /auth/register`：邮箱 + 密码，bcrypt 哈希
- `POST /auth/login`：返回 access token（15min）+ refresh token（7d）
- `POST /auth/refresh`：refresh token 换新 access token
- `POST /auth/logout`：refresh token 拉黑（存 Redis）
- JWT Guard 保护 `/users/me`

**验收**：
- [ ] Postman collection 走通完整登录流程
- [ ] 密码在 DB 里是 bcrypt hash，不是明文
- [ ] access token 过期后请求返回 401
- [ ] logout 后 refresh token 无法再用
- [ ] 单元测试覆盖 AuthService 的 4 个核心方法

**面试追问预演**（每个都要能答）：
- 为什么 access token 短、refresh token 长？
- refresh token 存在哪？为什么？
- bcrypt vs argon2 / scrypt？为什么选 bcrypt？
- JWT 泄露怎么办？

---

### M3（Week 5-7）：OAuth2 授权码流程

**这是整个项目的核心，也是简历上最亮的一段**。

**做什么**：
- `Client` 表：模拟"第三方应用"注册（client_id / client_secret / redirect_uri）
- `GET /oauth/authorize`：跳转登录页 → 用户同意授权 → 回调带 code
- `POST /oauth/token`：code 换 access token（走 PKCE）
- `GET /oauth/userinfo`：用 access token 换用户信息
- 支持 `scope`（至少实现 `openid profile email`）

**验收**：
- [ ] 用 Postman 或一个假的 "第三方站点" 完整走通授权码流程
- [ ] PKCE 校验能拦住不带 code_verifier 的请求
- [ ] `scope` 不足时 userinfo 只返回允许字段
- [ ] 授权页 UI 能显示 "XX 应用申请访问你的 邮箱、昵称"（这一步用最简陋的 HTML 即可）

**这一段一定要吃透**：
- 画一张时序图放进 README（授权码 + PKCE）
- 能解释：为什么要 code 中转、不直接给 token？PKCE 解决什么问题？

**卡壳兜底**：如果 OAuth2 花超过 3 周，砍掉 scope，只保证主流程通。

---

### M4（Week 8-9）：前端控制台

**做什么**（这一段对你最轻松，控制在 2 周内）：
- Vite + React + TS + TanStack Query + Tailwind
- 页面：登录 / 注册 / 我的应用列表 / 创建应用 / 应用详情（含 client_secret 一次性展示）
- 一个 "尝试授权" 按钮，触发完整 OAuth2 流程给用户看

**验收**：
- [ ] 部署到 Vercel 或和后端同机
- [ ] 首屏 < 2s，Lighthouse Performance > 80
- [ ] 全流程能录一个 3 分钟 demo 视频（放进 README）

**别做的**：
- ❌ 花时间选组件库、调 UI 细节
- ❌ 加暗黑模式、国际化、动画

---

### M5（Week 10）：部署收尾（基础在 M1 Day 13 已铺好）

> **注意**：M1 Day 13 已经把 Fly.io 部署、域名、生产 Postgres + Upstash Redis 跑通。M5 主要是把 M4 的前端也部署上、绑好域名、补全 HTTPS。

**做什么**：
- 前端 Vite 应用的 `Dockerfile` + `fly.toml`
- 前端部署到 Fly.io
- 后端 / 前端都绑定 `api.your-domain.top` / `console.your-domain.top`
- 配 HTTPS（Fly 自动签发证书）

**验收**：
- [ ] `https://api.your-domain.top` 走完后端流程
- [ ] `https://console.your-domain.top` 可登录、可看到我的应用
- [ ] `fly deploy` 整库重新部署 < 15 分钟
- [ ] README "Deployment" 段写完

---

### M6（Week 11）：CI/CD + 可观测性基础

**做什么**：
- GitHub Actions：push → lint → test → build → SSH 部署到云主机
- pino 结构化日志（JSON 格式，方便未来接 ELK）
- `/metrics` 端点暴露基础指标（QPS、错误率、DB 连接数）
- `/health` 健康检查

**验收**：
- [ ] `git push main` 5 分钟内自动上线
- [ ] 日志能看到每个请求的 traceId
- [ ] 手动挂掉 DB，健康检查返回 503

---

### M7（Week 12）：文档 + 面试话术

**这一周不写代码，只做输出**。

**做什么**：
- README 英文终稿（架构图 / 时序图 / API 列表 / 部署说明 / 已知取舍）
- 一篇英文技术博客（Medium 或 GitHub Pages）："Building an OAuth2 Server from Scratch"
- 写一份 **面试自问自答文档**（英文 30 条 + 中文 30 条），题目见下方"面试题储备"

**验收**：
- [ ] 简历更新完毕，这个项目列在最上面
- [ ] 能对着 README 用英文讲 15 分钟不看稿
- [ ] 投出第一份 Tesla / 类外企简历

---

## 四、每周节奏（建议）

| 时间 | 内容 |
|---|---|
| 工作日晚 21:00 – 23:00 | 2h，主要做开发 |
| 周六 09:00 – 12:00 | 3h，做本周最难那块（新概念 / 卡壳） |
| 周日 20:00 – 21:00 | 1h，写周报（自己看），下周任务拆解 |
| 每天通勤 | 影子跟读英文技术视频，20 分钟 |
| 每周 2 次 | iTalki 外教 30 分钟，专聊本周做的技术 |

**总投入**：约 15-18h / 周。低于 12h / 周则整个 Q1 会崩，必须提前砍范围。

---

## 五、面试题储备（Week 12 前逐步整理）

**认证协议**：
1. JWT vs Session，为什么用 JWT？什么时候不用？
2. OAuth2 四种模式各自的场景？为什么授权码 + PKCE 是主流？
3. access token 存 localStorage vs httpOnly cookie？
4. refresh token 轮换（rotation）是什么？为什么要做？

**安全**：
5. 你的服务如何防 CSRF？防 XSS？
6. 密码策略（复杂度 / 长度 / 哈希算法）你怎么选的？
7. 如果 client_secret 泄露怎么办？
8. Rate limit 你是怎么实现的？滑动窗口还是令牌桶？

**架构 / 取舍**：
9. 为什么用 PostgreSQL 不用 MongoDB？
10. Redis 挂了你的服务能撑多久？降级方案？
11. 单机部署的瓶颈在哪？怎么水平扩展？
12. token 撤销（logout / 强制下线）怎么做的？为什么这么设计？

**工程**：
13. CI 里跑不跑集成测试？为什么？
14. 你的日志怎么关联一次请求的完整链路？
15. 上线后发现 bug，怎么回滚？

**每题准备**：中文 + 英文各一版，英文版录音自听。

---

## 六、风险和兜底

| 风险 | 兜底 |
|---|---|
| 汇丰项目突然加班 | 每周硬保 10h 底线，砍范围不砍频率 |
| OAuth2 太难卡住 | M3 超过 3 周则砍 scope、砍 PKCE，先保主流程 |
| 部署 / 域名 / HTTPS 折腾 | 直接用 Fly.io / Railway 托管，别死磕自建 |
| 前端做过头 | M4 硬砍到 2 周，UI 用 shadcn 抄默认样式 |
| 英语跟不上 | iTalki 频次降不能停，宁可只写不说也要每周开口 |

---

## 七、Q1 结束时的自检

三个问题，任何一个答"否"都说明 Q1 不算通过：

1. 我能不能不看代码，白板画出完整的 OAuth2 授权码 + PKCE 时序图？
2. 我能不能用英文给一个陌生工程师讲清楚这个项目的三个技术取舍？
3. 我的 GitHub 上有没有一个 star 数 ≥ 0 但**面试官愿意花 5 分钟点进去看**的仓库？

如果三个都能答"是"，Q2 就有底气切 Go + 分布式。

---

**最后一句**：Q1 的目的**不是学会 NestJS**，是让你有资格在简历上写"具备后端开发能力"，并且在面试时经得起追问。所有技术选型和范围裁剪都围绕这一个目标。
