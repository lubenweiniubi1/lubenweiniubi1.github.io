# M1 每日任务清单：环境搭建 + Hello World

> **上级文档**：[tesla-q1-nestjs-auth-service.md](./tesla-q1-nestjs-auth-service.md) · [tesla-1y-master-plan.md](./tesla-1y-master-plan.md)
> **周期**：Week 1-2（14 天）
> **总目标**：`docker compose up` 起全套服务，Swagger 能访问，GitHub 有第一次提交
> **原则**：每天任务控制在 1.5h（21:30–23:00 的项目时段），卡壳超过当天预算 → 简化 → 记录到"卡壳日志"，第二天不重试同一方案
> **注意**：本文的时长**只算项目部分**。每晚 21:00–21:30 的算法 30min 在这之前，不占用本文预算；W1-2 算法主题是数组 / 双指针，共 12 题

---

## 前置准备（Day 0，动工前必做）

在 Week 1 Day 1 开始前，先花 30 分钟检查：

- [ ] Node.js ≥ 20 已装（`node -v`）
- [ ] Docker Desktop 已装并能启动（`docker ps` 无报错）
- [ ] Git 已配置（`git config --global user.email` 有值）
- [ ] GitHub 账号已登录，能 SSH clone
- [ ] VSCode 装好这几个插件：Prisma、ESLint、Docker、REST Client
- [ ] 一个可用的科学上网工具（npm / GitHub 会用到）

**如果任何一项失败**：Day 1 的第一件事就是修好它，别硬推进。

---

## Week 1：本地能跑

### Day 1（周一）· 建仓库 + 拉起数据库

**目标**：Postgres 和 Redis 在 Docker 里跑起来，能用 psql 连上。

**任务**（约 1.5h）：
1. 建 GitHub 私有仓库 `auth-service`，本地 clone
2. 写 `docker-compose.yml`，包含：
   - `postgres:16-alpine`（暴露 5432，volume 挂载）
   - `redis:7-alpine`（暴露 6379）
3. `docker compose up -d` 起服务
4. 用 `psql` 或 TablePlus / DBeaver 连上 Postgres，建一个测试库
5. 用 `redis-cli` 连上 Redis，`SET foo bar` / `GET foo`

**验收**：
- [ ] `docker compose ps` 显示两个服务都 `healthy`
- [ ] 能用 GUI 工具或 CLI 分别连上 pg 和 redis
- [ ] `.gitignore` 加了 `node_modules` / `.env` / `data/`

**卡壳兜底**：Docker Desktop 起不来 → 换 Rancher Desktop 或 OrbStack。

---

### Day 2（周二）· NestJS 骨架

**目标**：NestJS 项目跑起来，能返回 "Hello World"。

**任务**（约 1.5h）：
1. `npx @nestjs/cli new backend`（选 npm）
2. 删掉默认的测试代码，保留最小结构
3. `npm run start:dev`，浏览器访问 `localhost:3000` 看到 Hello World
4. 装 `@nestjs/config`，建 `.env` 和 `.env.example`：
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/auth
   REDIS_URL=redis://localhost:6379
   PORT=3000
   ```
5. 在 `main.ts` 里打印一句 "Server started on port X"
6. Git commit：`chore: init NestJS skeleton`

**验收**：
- [ ] `npm run start:dev` 能起服务
- [ ] 改代码能热更新
- [ ] `.env.example` 提交到仓库，`.env` 不提交

---

### Day 3（周三）· Prisma 接入 + 第一张表

**目标**：Prisma 连上 Postgres，`User` 表建好，能手动插一条数据。

**任务**（约 2h）：
1. `npm i prisma @prisma/client`，`npx prisma init`
2. 写 `schema.prisma`：
   ```prisma
   model User {
     id        String   @id @default(uuid())
     email     String   @unique
     password  String
     createdAt DateTime @default(now())
   }
   ```
3. `npx prisma migrate dev --name init`
4. 建 `src/prisma/prisma.module.ts` 和 `prisma.service.ts`（全局注入）
5. 用 Prisma Studio (`npx prisma studio`) 手动插一条 User
6. Commit：`feat: add prisma + user model`

**验收**：
- [ ] `prisma/migrations/` 下有一个迁移文件
- [ ] Prisma Studio 能看到刚插的用户
- [ ] `PrismaService` 在 NestJS 里能被注入（后面 Day 4 验证）

**卡壳兜底**：连不上数据库 → 检查 `DATABASE_URL` 里 host 是不是 `localhost` 而不是 `postgres`（Docker 内外差异）。

---

### Day 4（周四）· 第一个真实接口

**目标**：`GET /users/:id` 能返回数据库里的用户。

**任务**（约 1.5h）：
1. `nest g module users` + `nest g controller users` + `nest g service users`
2. `UsersService` 注入 `PrismaService`，实现 `findById(id)`
3. `UsersController` 加 `GET /users/:id`，不返回 password 字段
4. 用 REST Client 或 curl 测试：`curl localhost:3000/users/<uuid>`
5. 加一个全局 `ValidationPipe`（`main.ts`）
6. Commit：`feat: add users module`

**验收**：
- [ ] `curl localhost:3000/users/<真实id>` 返回 JSON（无 password）
- [ ] 不存在的 id 返回 404
- [ ] 非法 uuid 格式返回 400

---

### Day 5（周五）· Swagger + 请求日志

**目标**：Swagger UI 能访问，所有请求有结构化日志。

**任务**（约 1.5h）：
1. `npm i @nestjs/swagger`
2. `main.ts` 里配 Swagger：
   ```ts
   const config = new DocumentBuilder()
     .setTitle('Auth Service')
     .setVersion('0.1.0')
     .build();
   ```
3. 在 `GET /users/:id` 上加 `@ApiOperation` / `@ApiResponse` 注解
4. 装 `nestjs-pino`，全局启用 pino 日志
5. 访问 `localhost:3000/docs`，看到 Users 接口
6. Commit：`feat: add swagger + pino logger`

**验收**：
- [ ] `localhost:3000/docs` 能看到接口列表
- [ ] 能在 Swagger UI 里直接 "Try it out"
- [ ] 每个请求在终端有 JSON 格式日志（含 reqId）

---

### Day 6（周六，3h 大段时间）· README 英文起草 + Docker 化后端

**目标**：把后端本身也 Docker 化，`docker compose up` 一条命令起全部。

**任务**（约 3h）：
1. 写后端 `Dockerfile`（多阶段构建）：
   - Stage 1: `node:20-alpine` 装依赖 + 构建
   - Stage 2: 只拷贝 `dist/` 和 prod 依赖
2. 更新 `docker-compose.yml`，加入 `backend` service，depends_on: postgres/redis
3. 处理迁移问题：容器启动时先跑 `prisma migrate deploy`
4. **完整重来一次**：`docker compose down -v` → `docker compose up --build`，验证全流程
5. 起草 README.md（英文），至少包含：
   - Project overview（3-5 句话）
   - Tech stack 表
   - How to run（3 条命令）
   - Roadmap（列出 M1-M7 状态）

**验收**：
- [ ] `docker compose down -v && docker compose up --build` 一条命令能完整起服务
- [ ] 从 clean 状态到 Swagger 可访问 < 3 分钟
- [ ] README 用英文写完，语法过一遍 Grammarly

---

### Day 7（周日）· 八股整理 + 复盘 + Week 2 拆解

**任务**（约 1.5h）：
1. **八股 1h**：新建 `_plans/interview-qa-q1.md`，整理本周真实碰到的 3-5 条，中英各一版。W1 候选题：
   - Docker 的 network / volume 机制，容器间怎么互相访问
   - 数据库连接池是什么？池满了会发生什么？
   - Swagger / OpenAPI 除了"生成文档"还解决什么问题
   - （只写你这周真的动手碰过的，没碰过的留到后面）
2. 写一份 Week 1 复盘（放进 `_plans/journal/week1.md`）：
   - 做完了什么
   - 卡壳在哪、怎么解决的
   - Week 2 要调整什么
3. 检查 Week 2 任务清单（下方），把每天的任务落到日历
4. **奖励自己休息半天**——别通宵，长期节奏比单周产出重要

**验收**：
- [ ] `interview-qa-q1.md` 有 3-5 条，每条中英各一版
- [ ] `week1.md` 提交到仓库
- [ ] 下周 5 天的任务时间已在日历上圈出
- [ ] 本周算法完成 ≥ 6 题，其中至少 2 道全程出声用英文讲过

---

## Week 2：把基础打扎实

Week 1 是"跑起来"，Week 2 是"跑得住"——加测试、加规范、加健康检查，为 M2 认证模块铺路。

### Day 8（周一）· ESLint + Prettier + Husky

**任务**（约 1.5h）：
1. NestJS 默认自带 ESLint / Prettier，检查配置
2. 装 `husky` + `lint-staged`，pre-commit 跑 lint + format
3. 装 `commitlint`，强制 conventional commits
4. 试一次 `git commit -m "bad message"`，验证被拦
5. Commit：`chore: add husky + commitlint`

**验收**：
- [ ] 提交格式错误的 commit message 会失败
- [ ] pre-commit 会自动 format 改动的文件

---

### Day 9（周二）· 单元测试打通

**任务**（约 1.5h）：
1. 给 `UsersService.findById` 写单测（mock PrismaService）
2. 熟悉 `Test.createTestingModule` 用法
3. `npm run test` 通过
4. `npm run test:cov` 看覆盖率报告
5. Commit：`test: add users service unit tests`

**验收**：
- [ ] `npm run test` 有至少 3 个通过的测试
- [ ] 知道怎么 mock 依赖服务

---

### Day 10（周三）· 集成测试（e2e）

**任务**（约 2h）：
1. 用 NestJS 自带的 `test/app.e2e-spec.ts` 框架
2. 写一个 e2e：起完整应用，用 supertest 测 `GET /users/:id` 返回 200
3. e2e 用**独立的测试数据库**（`DATABASE_URL_TEST`），每次跑前重置
4. 在 `package.json` 加 `test:e2e` 脚本
5. Commit：`test: add users e2e`

**验收**：
- [ ] `npm run test:e2e` 通过
- [ ] 测试库和开发库不冲突

**卡壳兜底**：e2e 数据库配置麻烦 → 直接用 `.env.test`，跑前手动 `prisma migrate reset --force`。

---

### Day 11（周四）· 健康检查 + 错误处理

**任务**（约 1.5h）：
1. `npm i @nestjs/terminus`，加 `/health` 端点，检查 DB + Redis
2. 写全局 `HttpExceptionFilter`，统一错误响应格式：
   ```json
   { "code": "USER_NOT_FOUND", "message": "...", "traceId": "..." }
   ```
3. 手动挂掉 Postgres 容器，`/health` 应返回 503
4. Commit：`feat: add health check + error filter`

**验收**：
- [ ] `curl localhost:3000/health` 返回 JSON
- [ ] Postgres 挂掉时返回 503
- [ ] 任何异常响应都有 `traceId`

---

### Day 12（周五）· GitHub Actions 起步

**任务**（约 2h）：
1. 建 `.github/workflows/ci.yml`
2. 触发条件：push / PR to main
3. 步骤：checkout → setup-node → install → lint → test → build
4. postgres/redis 用 GitHub Actions 的 service containers 起
5. 提交后看 Actions 页面绿色打勾
6. Commit：`ci: add github actions`

**验收**：
- [ ] push 到 main 会自动触发 CI
- [ ] CI 全绿
- [ ] README 加上 CI badge

---

### Day 13（周六，3h 大段时间）· Fly.io 首次部署（提前完成 M5 一半的活）

> **免备案的最大好处：现在就能部署真机**。M1 结束时就有一个公网 URL，比只在本地跑一个 hello world 值得多——面试早期投简历都有得看。

**方案选定**：**Fly.io**（推荐，理由见下方）

**为什么选 Fly.io 而不是 Railway**：
- 免费额度更慷慨（3 台共享 CPU + 3GB volume）
- 原生支持 Postgres 和 Redis（Upstash 集成）
- 支持 Dockerfile 部署，和你本地开发一致
- 全球多节点，延迟低

**任务**（约 3h）：
1. **域名**：买一个 `.top` / `.xyz` 域名（10-20 元/年，Namecheap 或 Porkbun 都行）
2. **Fly.io 账号**：注册，绑定信用卡（不刷免费额度也需要卡验证）
3. **CLI 安装**：`iwr https://fly.io/install.ps1 -useb | iex`（Windows PowerShell）
4. **首次部署尝试**：
   - `cd backend`
   - `fly launch`（会问你要不要建 Postgres → 选 yes，用 Fly 自己的 pg）
   - Redis 用 [Upstash](https://upstash.com/)（Fly.io 官方集成，免费额度够用）
   - 等它自己生成 `fly.toml`
   - `fly deploy` 首次部署
5. **验证公网可访问**：`fly open` 打开分配的 URL，看到 hello world 或 Swagger
6. **配置生产环境变量**：`fly secrets set DATABASE_URL=xxx REDIS_URL=xxx`
7. **绑定自定义域名**（可选，也可以放到 M5 做）：
   - `fly certs create api.your-domain.top`
   - 在域名商添加 A / AAAA 记录

**验收**：
- [ ] 域名已购买
- [ ] Fly.io 账号已激活，`fly auth whoami` 正常
- [ ] **一个公网可访问的 URL**（Fly 分配的 `xxx.fly.dev` 就够）
- [ ] `curl https://xxx.fly.dev/health` 返回 200
- [ ] Swagger 可以在公网访问

**踩坑预警**：
- Fly.io 免费实例会**自动休眠**（15 分钟无请求），冷启动约 2-3s。演示前先 warm up 一下即可。
- 首次 `fly launch` 会问一堆问题，不确定就选默认。
- Postgres 密码只显示一次，**立刻存到密码管理器**。
- Redis 别用 Fly.io 自己的（Fly Redis 已 EOL），用 Upstash。

**为什么把这个提前到 M1**：
- 提前发现部署问题，避免 M5 一堆坑一起爆
- M1 结束就能把 URL 写进简历（哪怕功能还很少）
- 后续每个 milestone 都能 `fly deploy` 一键上线，形成正反馈

---

### Day 14（周日）· M1 收尾 + Demo 录制

**任务**（约 2.5h）：
1. **八股 30min**：往 `interview-qa-q1.md` 补 W2 的 3-5 条。候选题：单测 vs e2e 的边界、健康检查为什么要区分依赖可用性、结构化日志为什么比字符串日志值钱、CI 里跑不跑集成测试
2. 从 clean 状态跑一遍完整流程，录一个 3 分钟视频：
   - `git clone`
   - `docker compose up`
   - 访问 Swagger
   - 调一次 `/users/:id`
   - 展示 CI 全绿
3. 视频放进 README（或 GitHub Discussions）
4. 写 M1 复盘 `_plans/journal/m1-retro.md`：
   - 计划 vs 实际（哪些超时、哪些提前）
   - 学到的最重要 3 个知识点
   - M2（认证模块）需要提前准备什么
5. 简历"个人项目"栏加一行占位（"OAuth2 认证服务，进行中，M1 完成"）

**验收**：
- [ ] 有一个能发给别人看的 3 分钟 demo
- [ ] M1 复盘写完
- [ ] `interview-qa-q1.md` 累计 ≥ 6 条
- [ ] 算法累计 ≥ 12 题（W1-2 目标：数组 / 双指针）
- [ ] 心里对 M2 有个大致草图（不用完美）

---

## 卡壳日志模板

如果任何一天卡住超过预算时间，在 `_plans/journal/stuck-log.md` 里记一条：

```markdown
### 2026-08-05 · Prisma migrate 失败
- 现象：`prisma migrate dev` 报 P1001
- 尝试过：改 DATABASE_URL / 重启 docker / 删 volume
- 最终方案：host 从 `postgres` 改回 `localhost`（Docker 网络理解错误）
- 学到的：Docker Compose 内部服务名 vs 宿主机访问的区别
```

**为什么记这个**：每周日整理八股时，这个文件就是你最真实的素材库 —— 面试官追问到第三层时，你能答的往往就是这里记过的东西。

---

## 每日检查表（打印贴电脑上）

```
□ 21:00 先做算法 30min（1-2 题，出声讲思路）
□ 21:30 开工，今天的项目任务写在纸上，只有 1 条主任务
□ 开工前先 `docker compose ps` 确认环境健康
□ 卡壳 > 45 分钟必须停下来问自己：能不能绕过？
□ 收工前 commit（哪怕 WIP）
□ 收工前更新今日进度（划掉今天的 □）
□ 明早第一件事是什么？写下来。
```

---

**M1 结束时你应该拥有**：
- 一个每次 `git push` 会自动 CI 的 GitHub 仓库
- `docker compose up` 一条命令能起全部依赖
- Swagger、健康检查、结构化日志、单测 + e2e 都跑通
- 一个 3 分钟英文 demo 视频
- 一份卡壳日志（比代码更值钱）
- 域名 + 云主机准备就绪（M5 不慌）
- `interview-qa-q1.md` 里 6 条八股 + 12 道算法题的手感

**M1 不需要的**：漂亮 UI、完整的认证、生产级监控——这些都在后面里程碑。

Week 3 一开始就直接切 M2，进入认证模块——那才是"这个项目值不值钱"的关键。
