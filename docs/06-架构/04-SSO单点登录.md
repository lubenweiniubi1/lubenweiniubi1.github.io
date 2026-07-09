# 单点登录 SSO（Single Sign-On）

> "一次登录，处处通行"。登录 `mail.google.com` 之后，去 `docs.google.com`、`youtube.com` 都自动是登录态。

## 一、常见面试题

1. **什么是 SSO？和普通登录有什么区别？**
2. **同域和跨域的 SSO 实现方式一样吗？**
3. **CAS 单点登录的完整流程是怎样的？**
4. **OAuth 2.0 授权码模式的流程？为什么要有 code 换 token 这一步？**
5. **OAuth 2.0 和 OIDC 有什么区别？**
6. **单点登出（SLO，Single Log-Out）怎么做？**
7. **PKCE 是什么？为什么纯前端 SPA 要用它？**
8. **state 参数有什么用？**
9. **企业内部多个系统怎么共享登录态？**
10. **微信登录、GitHub 登录背后是什么原理？**

---

## 二、什么是 SSO？

**多个业务系统共用一个"认证中心"**，用户只需登录一次，之后访问其它系统都自动认得他。

```
      ┌──────────────┐
      │  认证中心 SSO  │  ← 只在这里登录一次
      └───────┬──────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 ┌──────┐ ┌──────┐ ┌──────┐
 │ 邮箱  │ │ 网盘  │ │ 论坛  │  ← 全都自动登录
 └──────┘ └──────┘ └──────┘
```

**和普通登录的区别**：普通登录每个系统一套账号密码；SSO 只有一套账号，认证中心统一发放"通行证"。

---

## 三、按场景分：同域 vs 跨域

### 3.1 同主域下的 SSO —— Cookie 共享（最简单）

场景：`a.company.com`、`b.company.com`、`c.company.com` 都是同一个主域。

做法：登录后把 Cookie 的 `Domain` 设为 `.company.com`（注意前面那个点），所有子域都能共享。

```
Set-Cookie: token=xxx; Domain=.company.com; Path=/; HttpOnly; Secure
```

这是最土也最好用的方案，不需要复杂协议。**只适合子域场景**。

### 3.2 完全跨域下的 SSO

场景：`site-a.com`、`site-b.net`、`app-c.io` 是不同的公司/项目，Cookie 不能共享。这时候就需要 **CAS / OAuth / OIDC / SAML** 这类协议了。

---

## 四、CAS（Central Authentication Service）流程

CAS 是最早的 SSO 协议之一，理解它之后 OAuth 就是"进阶版"。

### 4.1 角色

- **User-Agent**：浏览器
- **App**：业务系统（如网盘、邮箱）
- **CAS Server**：认证中心（如 `sso.company.com`）

### 4.2 完整流程（首次登录）

```
用户                    App                    CAS Server
 │                       │                          │
 │ ① 访问 app.com/home    │                          │
 │ ────────────────────▶ │                          │
 │                       │  没 Session，需要登录     │
 │ ② 302 重定向          │                          │
 │    → sso.com/login?service=app.com/callback     │
 │ ◀──────────────────── │                          │
 │                                                  │
 │ ③ 跳转到 CAS，输入账号密码                          │
 │ ───────────────────────────────────────────────▶ │
 │                                                  │
 │ ④ CAS 校验通过，生成 ticket=ST-abc               │
 │    Set-Cookie: TGC=xxx （CAS 域下的登录凭证）      │
 │    302 → app.com/callback?ticket=ST-abc          │
 │ ◀─────────────────────────────────────────────── │
 │                                                  │
 │ ⑤ 带 ticket 回到 App   │                          │
 │ ────────────────────▶ │                          │
 │                       │                          │
 │                       │ ⑥ 服务器后台去 CAS 验票   │
 │                       │    GET /validate?ticket │
 │                       │ ───────────────────────▶ │
 │                       │                          │
 │                       │ ⑦ 返回用户信息            │
 │                       │ ◀─────────────────────── │
 │                       │                          │
 │                       │ 建立 App 自己的 Session   │
 │ ⑧ 登录成功，返回页面    │                          │
 │ ◀──────────────────── │                          │
```

**关键点**：
- **TGC**（Ticket Granting Cookie）：种在 CAS Server 域名下的 Cookie，标识"我在 CAS 登过了"。
- **ST**（Service Ticket）：一次性票据，一次性使用后作废。
- **票据校验必须走后端**，避免票据被中间人劫持。

### 4.3 第二个 App 登录（无感）

```
用户                    App-B                   CAS Server
 │                       │                          │
 │ ① 访问 app-b.com       │                          │
 │ ────────────────────▶ │                          │
 │                       │  没 Session，重定向       │
 │ ② → sso.com/login?service=app-b/callback         │
 │ ◀──────────────────── │                          │
 │                                                  │
 │ ③ 浏览器自动带上 TGC Cookie                        │
 │ ───────────────────────────────────────────────▶ │
 │                                                  │
 │ ④ CAS 看到 TGC 有效，跳过登录页                     │
 │    直接生成 ticket，302 回 App-B                   │
 │ ◀─────────────────────────────────────────────── │
 │                                                  │
 │ ⑤ 后续和首次登录 ⑤~⑧ 一样                          │
```

用户完全无感知，只感觉"点开就登录了"。

---

## 五、OAuth 2.0（现在最主流）

**OAuth 严格说不是"登录"协议，是"授权"协议**：让 A 应用能替用户去 B 应用拿数据。但业界普遍拿它当 SSO 用。

### 5.1 四种模式一览

| 模式 | 英文 | 场景 | 现状 |
|------|------|------|------|
| 授权码 | Authorization Code | Web 应用，有后端 | ✅ 最推荐 |
| 隐式 | Implicit | 纯前端 SPA | ❌ 已废弃，用授权码 + PKCE 代替 |
| 密码 | Resource Owner Password Credentials | 只用于极度信任的自家 App | ⚠️ 不推荐 |
| 客户端凭证 | Client Credentials | 服务器之间（无用户参与） | ✅ 后端间调用 |

### 5.2 授权码模式完整流程（第三方登录场景）

以「网站 A 用 GitHub 登录」为例：

```
用户            网站 A（Client）         GitHub（Auth Server）
 │                    │                         │
 │ ① 点"用 GitHub 登录" │                         │
 │ ─────────────────▶ │                         │
 │                    │                         │
 │ ② 302 到 GitHub 授权页                        │
 │    /authorize?                              │
 │      client_id=xxx                          │
 │      &redirect_uri=网站A/callback            │
 │      &scope=user:email                      │
 │      &state=随机串                            │
 │      &response_type=code                    │
 │ ◀───────────────── │                         │
 │                                              │
 │ ③ 用户看到"网站 A 想访问你的邮箱，是否同意"       │
 │    点同意                                     │
 │ ──────────────────────────────────────────▶ │
 │                                              │
 │ ④ 302 到网站 A                                │
 │    /callback?code=abc123&state=随机串         │
 │ ◀──────────────────────────────────────────  │
 │                                              │
 │ ⑤ 带 code 回到网站 A │                         │
 │ ─────────────────▶ │                         │
 │                    │                         │
 │                    │ ⑥ 后台校验 state 防 CSRF   │
 │                    │    然后用 code 换 token   │
 │                    │    POST /token          │
 │                    │      client_id          │
 │                    │      client_secret      │  ← 关键！只有后端有
 │                    │      code               │
 │                    │ ──────────────────────▶ │
 │                    │                         │
 │                    │ ⑦ { access_token,       │
 │                    │     refresh_token }     │
 │                    │ ◀────────────────────── │
 │                    │                         │
 │                    │ ⑧ 用 token 拉用户信息     │
 │                    │    GET /user            │
 │                    │ ──────────────────────▶ │
 │                    │                         │
 │                    │ ⑨ { id, name, email }   │
 │                    │ ◀────────────────────── │
 │                    │                         │
 │                    │ 建立网站 A 自己的 Session │
 │ ⑩ 登录成功           │                         │
 │ ◀───────────────── │                         │
```

### 5.3 关键问题解答

#### Q1：为什么不直接返回 token，要绕一圈用 code 换？

如果 GitHub 直接把 access_token 塞到浏览器地址栏返回，token 会：
- 出现在浏览器历史记录里
- 出现在 Referer 头里
- 可能被前端 JS 读到

**code 只是"一次性凭证"**，短命（10 分钟）、只能用一次。真正拿 token 的动作发生在**后端到后端**（服务器直连 GitHub），中间不经过浏览器，安全得多。

#### Q2：`client_secret` 是什么？

网站 A 在 GitHub 注册应用时分配的密钥，**绝对不能给前端**。用它证明"我确实是网站 A"，防止别人拿到 code 也去换 token。

#### Q3：`state` 参数干嘛用的？

防 CSRF。用户点"用 GitHub 登录"时，前端生成一个随机串存 session，跳转时带上。回调时校验 state 是否一致——不一致就是被人伪造的回调。

#### Q4：`scope` 是啥？

申请的权限范围。GitHub 的 `user:email` 表示只要邮箱，`repo` 表示要读写仓库。用户在授权页会看到"网站 A 想访问你的：邮箱、仓库..."。

### 5.4 PKCE（Proof Key for Code Exchange，密钥交换证明）

纯前端 SPA（比如 Vue/React 打包出来的静态站）没有后端，**装不下 `client_secret`**。这时候用 PKCE：

```
① 前端生成随机串 code_verifier
② 计算 code_challenge = SHA256(code_verifier)
③ 跳转授权页时带上 code_challenge
④ 换 token 时带上原始的 code_verifier
⑤ 授权服务器校验 SHA256(code_verifier) == 之前存的 code_challenge
```

即使 code 被中间人截获，没有 code_verifier 也换不到 token。

现在 OAuth 2.1 已经把 PKCE 定为**授权码模式的必选项**（不管有没有后端）。

---

## 六、OIDC（OpenID Connect）—— OAuth 之上的身份层

OAuth 只解决"授权"，OIDC 在它之上加了"认证"：

- 除了 `access_token`，还额外返回一个 **`id_token`**
- `id_token` 是一个 **JWT**，里面直接包含用户身份（sub、email、name...）
- 前端拿到就能知道用户是谁，不用再调 `/user` 接口

**总结一句话**：
- 想让 A 系统能"替用户"去 B 系统拿数据 → OAuth
- 想让 A 系统"知道用户是谁" → OIDC

Google、微信、Apple 登录本质都是 OIDC。

---

## 七、单点登出 SLO（Single Log-Out）

比登录难做。用户在 App-A 点"退出"，需要 App-B、App-C 都跟着退出。常见方案：

1. **后端信道通知**：App-A 退出时告诉认证中心，认证中心用**后端 HTTP 请求**通知所有已登录的 App 清 Session。可靠但要维护 App 列表。
2. **前端 iframe 广播**：认证中心页面里嵌一堆 App 的登出 iframe，一次性退。简单但依赖第三方 Cookie，现代浏览器越来越难用。
3. **短期 Token + 黑名单**：Token 有效期短（如 5 min），退出时把 refreshToken 拉黑名单，最多 5 min 内所有 App 也失效。

---

## 八、其他协议速览

- **SAML 2.0**（Security Assertion Markup Language）：企业内部老牌 SSO 协议，基于 XML，重。银行、大公司 AD/LDAP 场景常用。
- **LDAP**（Lightweight Directory Access Protocol）：不是 SSO 协议，是账号目录服务，常做 SSO 后面的账号池。
- **Kerberos**：微软 AD 域用的，Windows 登录一次内网所有服务都通。

---

## 九、方案选型建议

| 场景 | 推荐 |
|------|------|
| 同公司多个子域 | Cookie Domain 共享（最简单） |
| 面向 C 端的第三方登录 | OAuth 2.0 / OIDC 授权码 + PKCE |
| 企业内部多个自研系统 | CAS 或 OIDC，配 LDAP 作账号池 |
| 传统大企业（银行、政府） | SAML |
| Windows 域内 | Kerberos / AD |

---

## 十、面试话术版一句话总结

> SSO 的核心是**把认证从业务系统里剥离到独立的认证中心**。同域下用 Cookie 共享最简单；跨域下通过重定向 + 一次性票据（CAS 的 ticket / OAuth 的 code）来传递身份。OAuth 授权码模式绕一圈换 token 是为了让 token 只走后端信道，不暴露给浏览器；纯前端 SPA 没有 client_secret，用 PKCE 补位。OIDC 在 OAuth 基础上加了 id_token，让"授权协议"能当"登录协议"用。
