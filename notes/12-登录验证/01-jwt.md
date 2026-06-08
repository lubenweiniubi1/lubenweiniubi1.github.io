# 🔐 JWT（JSON Web Token）完全详解

## 一、什么是 JWT？

**官方定义**：JWT（JSON Web Token）是一种**开放标准（RFC 7519）**，用于在各方之间以 JSON 对象的形式**安全地传输信息**。

**核心定位**：现代 Web 应用中最主流的**无状态认证方案**之一，广泛应用于：
- 单页面应用（SPA）身份认证
- 微服务架构的 API 接口认证
- 单点登录（SSO）
- API 密钥管理

---

## 二、JWT 的结构（三段式）

JWT 由**三部分**组成，用点号 `.` 分隔：
```
Header.Payload.Signature
```

### 1️⃣ Header（头部）

**作用**：声明令牌类型和签名算法

**示例**：
```json
{
  "alg": "HS256",    // 签名算法：HMAC-SHA256
  "typ": "JWT"       // 令牌类型
}
```

**常见算法**：
| 算法 | 类型 | 说明 |
|------|------|------|
| `HS256` | HMAC | 对称加密，服务端和客户端共享同一密钥 |
| `RS256` | RSA | 非对称加密，私钥签名，公钥验证 |
| `ES256` | ECDSA | 椭圆曲线加密 |

**编码方式**：Base64Url 编码（注意：不是加密！）

---

### 2️⃣ Payload（载荷/声明）

**作用**：存放实际传输的数据（Claims）

**示例**：
```json
{
  "sub": "1234567890",        // 主题（通常是用户ID）
  "name": "John Doe",         // 用户名
  "admin": true,              // 自定义声明
  "iat": 1516239022,          // 签发时间（Issued At）
  "exp": 1516242622,          // 过期时间（Expiration Time）
  "iss": "your-app.com",      // 签发者（Issuer）
  "aud": "api.your-app.com"   // 受众（Audience）
}
```

**Claims 分类**：

| 类型 | 说明 | 常见字段 |
|------|------|----------|
| **注册声明**（Registered） | JWT 标准预定义的字段 | `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti` |
| **公共声明**（Public） | 自定义但需避免冲突 | 任何自定义字段（如 `role`, `email`） |
| **私有声明**（Private） | 双方约定的私有字段 | 业务特定数据 |

**⚠️ 重要警告**：Payload **仅进行 Base64Url 编码，未加密**！任何人都可以解码查看内容，**切勿存储敏感信息**（如密码、身份证号）。

---

### 3️⃣ Signature（签名）

**作用**：验证消息在传输过程中**未被篡改**，并验证发送方身份

**签名生成公式**：
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret_key
)
```

**验证过程**：
1. 服务端用相同的密钥和算法重新计算签名
2. 比对计算出的签名与 JWT 中的 Signature
3. 如果一致 → **未被篡改**；如果不一致 → **已被篡改，拒绝请求**

---

## 三、JWT 认证完整流程

```mermaid
sequenceDiagram
    participant C as 客户端
    participant S as 服务端
    participant DB as 数据库

    C->>S: 1. POST /login (用户名+密码)
    S->>DB: 2. 验证凭证
    DB-->>S: 3. 验证通过
    S->>S: 4. 生成 JWT (Header+Payload+Signature)
    S-->>C: 5. 返回 JWT (通常在响应体或 Set-Cookie)
    C->>C: 6. 存储 JWT (LocalStorage/Cookie)
    
    Note over C,S: 后续请求
    C->>S: 7. GET /api/data (Header: Authorization: Bearer <JWT>)
    S->>S: 8. 验证 JWT 签名 + 检查 exp
    S-->>C: 9. 返回受保护数据
```

### 详细步骤：

#### **阶段一：登录 & 颁发 Token**
1. 用户输入用户名和密码，提交登录请求
2. 服务端验证凭证（查询数据库）
3. 验证通过后，生成 JWT：
   ```javascript
   // Node.js + jsonwebtoken 库示例
   const jwt = require('jsonwebtoken');
   
   const token = jwt.sign(
     {
       userId: user.id,
       username: user.username,
       role: user.role,
       iat: Math.floor(Date.now() / 1000),
       exp: Math.floor(Date.now() / 1000) + 3600 // 1小时后过期
     },
     process.env.JWT_SECRET, // 密钥
     { algorithm: 'HS256' }
   );
   ```
4. 将 JWT 返回给客户端（通常在响应体的 `token` 字段，或通过 `Set-Cookie`）

#### **阶段二：携带 Token 请求受保护资源**
1. 客户端将 JWT 存储在：
   - **LocalStorage**（SPA 常用）
   - **Cookie**（传统 Web 应用）
   - **内存**（移动端）
2. 后续每次请求受保护资源时，在 HTTP 请求头中携带：
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. 服务端中间件拦截请求，提取并验证 JWT：
   ```javascript
   // 验证中间件示例
   const authMiddleware = (req, res, next) => {
     const authHeader = req.headers.authorization;
     
     if (!authHeader || !authHeader.startsWith('Bearer ')) {
       return res.status(401).json({ error: '未提供有效令牌' });
     }
     
     const token = authHeader.substring(7);
     
     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       req.user = decoded; // 将用户信息挂载到 req 对象
       next();
     } catch (err) {
       if (err.name === 'TokenExpiredError') {
         return res.status(401).json({ error: '令牌已过期' });
       }
       return res.status(401).json({ error: '无效令牌' });
     }
   };
   ```

#### **阶段三：Token 过期 & 刷新机制**
- **Access Token**：短期有效（15分钟~2小时），用于日常请求
- **Refresh Token**：长期有效（7天~30天），用于获取新的 Access Token
- **刷新流程**：
  1. Access Token 过期，客户端用 Refresh Token 请求 `/refresh`
  2. 服务端验证 Refresh Token 有效性
  3. 验证通过后，颁发新的 Access Token（可选：同时颁发新的 Refresh Token）
  4. 客户端用新 Access Token 继续请求

---

## 四、JWT vs Session 详细对比

| 特性 | JWT | Session |
|------|-----|---------|
| **存储位置** | 客户端（LocalStorage/Cookie） | 服务端（内存/Redis） |
| **服务端状态** | ✅ **无状态**，无需存储会话 | ❌ **有状态**，需维护 Session 存储 |
| **扩展性** | ✅ 天然支持分布式/微服务 | ❌ 需要 Session 共享（如 Redis） |
| **跨域支持** | ✅ 友好（通过 Header 携带） | ❌ 受 Cookie 同源策略限制 |
| **性能** | ✅ 验证快（无需查库） | ⚠️ 每次需查 Session 存储 |
| **安全性** | ⚠️ Token 泄露风险高 | ✅ 相对可控（服务端可主动销毁） |
| **注销/失效** | ❌ 难主动失效（需黑名单机制） | ✅ 服务端直接删除即可 |
| **数据容量** | ⚠️ 不宜过大（影响性能） | ✅ 无限制（数据存在服务端） |
| **适用场景** | 微服务、SPA、移动端 | 传统 Web 应用、需要频繁修改用户状态 |

---

## 五、JWT 的核心优势

### ✅ 1. 无状态（Stateless）
- 服务端无需存储会话信息
- 天然支持水平扩展，适合微服务架构
- 减少数据库/缓存查询压力

### ✅ 2. 自包含（Self-contained）
- Token 本身包含用户信息（如 userId、role）
- 服务端无需额外查询数据库获取用户信息
- 减少网络往返，提升性能

### ✅ 3. 跨域友好
- 通过 HTTP Header 携带，不受 Cookie 同源策略限制
- 适合前后端分离、跨域 API 调用

### ✅ 4. 标准化
- 遵循 RFC 7519 标准
- 各语言都有成熟库支持（Node.js、Java、Python、Go 等）

---

## 六、JWT 的缺点与风险

### ❌ 1. 难以主动失效
- Token 一旦签发，在过期前始终有效
- 无法像 Session 一样服务端主动销毁
- **解决方案**：
  - 缩短 Access Token 有效期（如 15 分钟）
  - 使用 Refresh Token 机制
  - 维护 Token 黑名单（需额外存储）

### ❌ 2. 安全风险较高
- Token 泄露 = 身份被盗用（直到过期）
- **解决方案**：
  - 必须使用 HTTPS
  - 避免存储在 LocalStorage（XSS 风险），优先使用 HttpOnly Cookie
  - 设置合理的过期时间

### ❌ 3. 无法修改已签发的 Token
- Payload 一旦签名，无法修改（否则签名失效）
- 如需更新用户信息（如权限变更），需重新签发 Token
- **解决方案**：缩短 Token 有效期，配合 Refresh Token

### ❌ 4. Token 体积较大
- 相比 Session ID（通常 32 字符），JWT 体积更大
- 每次请求都需携带，增加带宽消耗
- **解决方案**：精简 Payload，只存必要信息

---

## 七、安全最佳实践（必读！）

### 🔒 1. 永远不要在 Payload 中存储敏感信息
```javascript
// ❌ 错误示例：存储密码
{
  "userId": 123,
  "password": "hashed_password", // 绝对禁止！
  "email": "user@example.com"
}

// ✅ 正确示例：只存必要标识
{
  "sub": "123",
  "role": "admin",
  "iat": 1717800000,
  "exp": 1717803600
}
```

### 🔒 2. 必须使用 HTTPS
- 防止 Token 在传输过程中被中间人窃取
- 生产环境强制 HTTPS，开发环境也建议使用

### 🔒 3. 设置合理的过期时间
```javascript
// ✅ 推荐：短期 Access Token + 长期 Refresh Token
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });
const refreshToken = jwt.sign({ userId: 123 }, secret, { expiresIn: '7d' });
```

### 🔒 4. 使用强密钥
- 密钥长度至少 32 字符（256 位）
- 使用环境变量存储，**切勿硬编码**
- 定期轮换密钥（需考虑已签发 Token 的兼容性）

### 🔒 5. 验证所有 Claims
```javascript
// ✅ 完整验证示例
jwt.verify(token, secret, {
  algorithms: ['HS256'],      // 限制允许的算法
  issuer: 'your-app.com',     // 验证签发者
  audience: 'api.your-app.com' // 验证受众
});
```

### 🔒 6. 防范算法混淆攻击
- **禁止**使用 `none` 算法
- 明确指定允许的算法（如 `algorithms: ['HS256']`）
- 避免使用弱算法（如 HS256 密钥过短）

### 🔒 7. 存储方式选择
| 存储方式 | 优点 | 缺点 | 适用场景 |
|----------|------|------|----------|
| **HttpOnly Cookie** | 防 XSS 攻击 | 受同源策略限制，需处理 CSRF | 传统 Web 应用 |
| **LocalStorage** | 跨域友好，使用简单 | 易受 XSS 攻击 | SPA（配合 CSP） |
| **Memory** | 最安全（关闭即失效） | 刷新页面丢失 | 移动端、桌面应用 |

**推荐方案**：
- Web 应用：HttpOnly + Secure + SameSite=Strict Cookie
- SPA：LocalStorage + 严格的 CSP 策略 + 短期 Token
- 移动端：内存存储 + 定期刷新

---

## 八、适用场景与不适用场景

### ✅ 适合使用 JWT 的场景
1. **微服务架构**：各服务无状态，无需共享 Session
2. **单页面应用（SPA）**：前后端分离，跨域请求频繁
3. **移动端 API**：Token 可长期存储，减少登录频率
4. **单点登录（SSO）**：跨域身份传递
5. **第三方 API 接入**：API 密钥管理

### ❌ 不适合使用 JWT 的场景
1. **需要频繁修改用户状态**：如权限实时变更、强制下线
2. **需要即时踢人下线**：如管理员强制用户登出
3. **高安全要求场景**：如金融交易、敏感操作（建议每次验证）
4. **Token 数据量大**：如需存储大量用户信息（考虑 Session）

---

## 九、常见问题解答（FAQ）

### Q1: JWT 和 OAuth 2.0 有什么区别？
- **JWT**：是一种**令牌格式**（Token 的结构和编码方式）
- **OAuth 2.0**：是一种**授权框架**（如何获取和使用 Token 的流程）
- **关系**：OAuth 2.0 可以使用 JWT 作为 Access Token 的格式

### Q2: JWT 过期后如何无感刷新？
```javascript
// 前端拦截器示例（Axios）
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // 用 Refresh Token 获取新 Access Token
        const { data } = await axios.post('/api/refresh', {
          refreshToken: localStorage.getItem('refreshToken')
        });
        
        localStorage.setItem('accessToken', data.accessToken);
        originalRequest.headers['Authorization'] = `Bearer ${data.accessToken}`;
        
        return axios(originalRequest); // 重试原请求
      } catch (refreshError) {
        // Refresh Token 也过期，跳转登录
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

### Q3: 如何实现 JWT 黑名单（强制失效）？
```javascript
// 服务端维护 Redis 黑名单
const logout = async (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.decode(token);
  
  // 计算剩余有效期（秒）
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
  
  // 加入黑名单，有效期 = 剩余有效期
  await redis.setex(`blacklist:${token}`, expiresIn, '1');
  
  res.json({ message: '登出成功' });
};

// 验证中间件增加黑名单检查
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  
  // 检查黑名单
  const isBlacklisted = await redis.exists(`blacklist:${token}`);
  if (isBlacklisted) {
    return res.status(401).json({ error: '令牌已失效' });
  }
  
  // ... 继续验证签名
};
```

### Q4: JWT 的签名算法如何选择？
| 算法 | 适用场景 | 说明 |
|------|----------|------|
| **HS256** | 单体应用、内部系统 | 对称加密，简单高效，密钥需保密 |
| **RS256** | 微服务、第三方集成 | 非对称加密，私钥签名，公钥验证，更安全 |
| **ES256** | 移动端、IoT | 椭圆曲线，签名更短，性能更好 |

**推荐**：生产环境优先选择 **RS256**（非对称加密），安全性更高。

---

## 十、总结

| 维度 | 核心要点 |
|------|----------|
| **本质** | 一种自包含、无状态的令牌格式（RFC 7519） |
| **结构** | Header（算法） + Payload（数据） + Signature（签名） |
| **优势** | 无状态、自包含、跨域友好、标准化 |
| **劣势** | 难主动失效、安全风险高、无法修改 |
| **安全** | HTTPS + 短期 Token + 强密钥 + 验证所有 Claims |
| **存储** | Web：HttpOnly Cookie；SPA：LocalStorage + CSP；移动端：内存 |
| **适用** | 微服务、SPA、移动端、SSO |
| **不适用** | 需频繁修改状态、需即时踢人、高安全敏感操作 |

> 💡 **一句话总结**：JWT 是现代 Web 认证的**利器**，但不是**银弹**。用对场景、做好安全，才能发挥其最大价值。