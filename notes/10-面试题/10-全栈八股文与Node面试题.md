# 全栈八股文 & Node.js 面试题清单

> 目标岗位：全栈工程师（外企 / 国内大厂）
> 当前水平：前端为主，Node.js / Express / CI/CD 有实际使用经验，需系统性复习八股

---

## 一、Node.js 核心

### 1.1 事件循环（🔴 必会，高频）

- [ ] Node.js 事件循环的 **6 个阶段**（timers → pending callbacks → idle/prepare → poll → check → close callbacks），每阶段干什么
- [ ] `process.nextTick` vs `Promise.then` 的优先级和执行时机
- [ ] `setImmediate` vs `setTimeout(fn, 0)` 的执行顺序
- [ ] Node 事件循环 vs 浏览器事件循环的核心差异（3 点以上）
- [ ] 微任务在 Node 中的执行时机（每个阶段之后清空）
- [ ] 能完整写出任意事件循环代码的执行顺序并解释原因

### 1.2 模块系统

- [ ] CommonJS（require / module.exports）的加载机制与缓存策略
- [ ] ES Module（import / export）与 CommonJS 的差异（静态 vs 动态、引用 vs 拷贝）
- [ ] `require` 的查找规则（node_modules 向上递归）
- [ ] 循环依赖在 CJS 和 ESM 下的表现差异

### 1.3 Stream 与 Buffer

- [ ] Buffer 是什么，为什么需要 Buffer（二进制数据处理）
- [ ] Stream 的四种类型：Readable / Writable / Duplex / Transform
- [ ] 流式处理的背压（backpressure）机制
- [ ] `pipe()` 的工作原理
- [ ] 实际场景：大文件读取、HTTP 请求响应流

### 1.4 进程与线程

- [ ] `child_process`（spawn / exec / fork / execFile）的区别和使用场景
- [ ] `cluster` 模块：多进程架构，Master-Worker 通信
- [ ] `worker_threads`：多线程，与 cluster 的区别
- [ ] 进程间通信（IPC）的方式

### 1.5 内存与性能

- [ ] V8 垃圾回收机制（新生代 Scavenge / 老生代 Mark-Sweep-Compact）
- [ ] 内存泄漏的常见场景与排查方法（heapdump、memory leak patterns）
- [ ] 事件循环阻塞的原因与排查（长时间同步操作）

### 1.6 错误处理

- [ ] `try-catch` / `.catch()` / `uncaughtException` / `unhandledRejection` 的区别
- [ ] Express 全局错误处理中间件
- [ ] 优雅退出（graceful shutdown）：`process.on('SIGTERM')`

---

## 二、Express / Web 框架

### 2.1 Express 核心

- [ ] 中间件（middleware）机制：执行顺序、`next()` 的作用
- [ ] `app.use` vs `app.get` 的区别
- [ ] 内置中间件：`express.json()`、`express.static()`
- [ ] 路由（Router）的模块化组织方式
- [ ] 请求/响应对象（req / res）的核心属性和方法

### 2.2 Koa（加分项）

- [ ] Koa 与 Express 的核心区别（中间件签名、洋葱模型、ctx 上下文）
- [ ] Koa 的洋葱模型（`await next()`）
- [ ] 为什么 Koa 把内置功能移到了中间件

---

## 三、数据库

### 3.1 关系型数据库（PostgreSQL / MySQL）

- [ ] SQL 基础：SELECT / INSERT / UPDATE / DELETE / JOIN / GROUP BY / 子查询
- [ ] 索引的原理（B+Tree），什么情况下索引失效
- [ ] 事务 ACID 特性
- [ ] 连接池的作用与配置
- [ ] ORM vs Raw SQL 的优缺点

### 3.2 NoSQL（加分项）

- [ ] Redis 基础：常用数据结构（String / Hash / List / Set / Sorted Set）
- [ ] Redis 使用场景：缓存、Session 存储、分布式锁
- [ ] 缓存策略：Cache-Aside / Read-Through / Write-Through、缓存穿透/击穿/雪崩

---

## 四、网络与协议（🔴 必会）

- [ ] HTTP/1.1 vs HTTP/2 vs HTTP/3 的核心差异
- [ ] HTTPS 握手过程（TLS 1.2 / 1.3），能画出 SSL/TLS 握手流程图
- [ ] TCP 三次握手、四次挥手
- [ ] DNS 解析过程
- [ ] CDN 原理与缓存策略
- [ ] RESTful API 设计原则（资源命名、状态码、版本控制）
- [ ] GraphQL vs REST 的对比（加分项）
- [ ] WebSocket 原理与使用场景
- [ ] CORS 跨域原因与解决方案

---

## 五、CI/CD & DevOps

### 5.1 Docker（🔴 必会）

- [ ] 镜像 / 容器 / 仓库的概念
- [ ] Dockerfile 核心指令：FROM / RUN / COPY / CMD / ENTRYPOINT / ENV
- [ ] 多阶段构建（multi-stage build）及其优势
- [ ] docker-compose 的基本使用
- [ ] 容器网络模式（bridge / host / none）

### 5.2 CI/CD 流水线

- [ ] CI/CD 的核心概念：持续集成 / 持续交付 / 持续部署 的区别
- [ ] 典型流水线阶段：lint → test → build → deploy
- [ ] GitHub Actions 的基本使用（workflow / job / step 语法）
- [ ] 环境变量管理、敏感信息（secrets）管理
- [ ] 蓝绿部署 / 滚动部署 / 金丝雀发布 的区别

### 5.3 Nginx

- [ ] 反向代理 vs 正向代理
- [ ] 负载均衡策略（轮询 / 权重 / IP Hash / 最少连接）
- [ ] 常见配置：静态资源服务、location 匹配规则、upstream

---

## 六、认证与安全

- [ ] JWT 的结构（Header / Payload / Signature）与工作原理
- [ ] Session vs JWT 的对比（存储位置、扩展性、安全性）
- [ ] OAuth 2.0 的四种授权模式（授权码 / 隐式 / 密码 / 客户端凭证）
- [ ] XSS / CSRF / SQL 注入 的攻击原理与防御
- [ ] HTTPS 中间人攻击的防御

---

## 七、系统设计（外企高频）

### 7.1 基础概念

- [ ] 微服务 vs 单体架构的对比（优缺点、适用场景）
- [ ] 水平扩展 vs 垂直扩展
- [ ] 负载均衡（L4 vs L7）
- [ ] 消息队列（削峰、解耦、异步）
- [ ] CAP 定理（Consistency / Availability / Partition Tolerance）

### 7.2 常见场景设计

- [ ] 短链接系统设计
- [ ] 实时聊天系统设计
- [ ] 文件上传系统设计
- [ ] 限流器设计（令牌桶 / 漏桶 / 滑动窗口）
- [ ] API Gateway 设计

---

## 八、数据结构与算法（外企必考）

- [ ] 数组与字符串：双指针、滑动窗口、前缀和
- [ ] 链表：反转、环检测、合并
- [ ] 栈与队列：单调栈、BFS
- [ ] 哈希表：实现原理、冲突解决
- [ ] 树与图：二叉树遍历（前中后层序）、BST、DFS / BFS
- [ ] 排序：快排、归并排序（时间/空间复杂度）
- [ ] 动态规划：背包、最长子序列
- [ ] 常见设计模式：单例、观察者、策略、工厂

---

## 九、软技能（外企高频）

- [ ] "Tell me about yourself"（2 分钟电梯演讲）
- [ ] "Most challenging project"（STAR 方法，逐字稿练 5 遍）
- [ ] "Conflict with teammate"（如何解决分歧）
- [ ] "Why do you want to leave / join us"
- [ ] "Where do you see yourself in 3-5 years"
- [ ] 准备 2-3 个有深度的问题反问面试官

---

## 复习策略

### 优先级排序

| 优先级 | 模块 | 原因 |
|--------|------|------|
| 🔴 P0 | Node 事件循环、网络协议、Docker | 全栈面试必问，简历有 CI/CD 必须接住 |
| 🟡 P1 | Express 中间件、JWT、SQL 基础 | 高频基础题 |
| 🟢 P2 | CI/CD 流水线、Nginx、算法 | 加分项，拉开差距 |
| ⚪ P3 | Koa、GraphQL、消息队列、系统设计 | 大厂/外企进阶需求 |

### 学习方法

1. **每道题写逐字稿 → 录音 → 听回放 → 迭代**，练到能自然说出口
2. **Node 事件循环**：自己写 demo 验证每个阶段，而非死记硬背
3. **Docker**：在本地跑一遍完整流程（Dockerfile → build → run → compose）
4. **算法**：LeetCode Easy/Medium 高频题，每天 2-3 题保持手感
5. **系统设计**：每个场景画出架构图，讲清楚数据流和组件职责
