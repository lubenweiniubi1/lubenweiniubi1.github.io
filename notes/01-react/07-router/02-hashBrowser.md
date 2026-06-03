[← 返回笔记目录](/) 

# 🔬 HashRouter vs BrowserRouter - 底层原理深度解析

## 一、HashRouter 原理

### 1.1 核心机制

```javascript
// HashRouter 本质是监听 hash 变化
window.addEventListener('hashchange', (event) => {
  console.log('旧URL:', event.oldURL);
  console.log('新URL:', event.newURL);
  console.log('当前hash:', window.location.hash);
  // 触发路由匹配和组件渲染
});
```

### 1.2 URL 结构与处理

```
完整URL: http://example.com:8080/path?query=1#section/about

浏览器解析:
├── 协议:     http
├── 域名:     example.com
├── 端口:     8080
├── 路径:     /path
├── 查询参数: ?query=1
└── Hash:     #section/about  ← 这部分不会被发送到服务器
```

**关键点**：
- `#` 后面的内容**永远不会发送到服务器**
- 服务器只看到 `http://example.com:8080/path?query=1`
- 前端通过 `window.location.hash` 获取 `#section/about`

### 1.3 HashRouter 源码简化实现

```javascript
class HashRouter {
  constructor() {
    this.routes = new Map();
    this.currentPath = '';
    
    // 初始化时解析当前 hash
    this.currentPath = this.getHashPath();
    
    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
      this.currentPath = this.getHashPath();
      this.matchRoute();
    });
  }
  
  // 获取 hash 路径（去掉 #）
  getHashPath() {
    // location.hash: "#/about"
    // 返回: "/about"
    return window.location.hash.replace(/^#/, '') || '/';
  }
  
  // 设置 hash（会触发 hashchange 事件）
  setHashPath(path) {
    window.location.hash = path;
  }
  
  // 路由匹配
  matchRoute() {
    const route = this.routes.get(this.currentPath);
    if (route) {
      route.component(); // 渲染组件
    }
  }
  
  // 注册路由
  addRoute(path, component) {
    this.routes.set(path, component);
  }
}

// 使用示例
const router = new HashRouter();
router.addRoute('/home', Home);
router.addRoute('/about', About);
```

### 1.4 HashRouter 工作流程
1. **用户操作**：用户点击页面上的链接或按钮

2. **调用导航方法**：触发 `navigate('/about')` 方法

3. **修改URL**：执行 `window.location.hash = '#/about'`
   - URL 从 `http://xxx/` 变为 `http://xxx/#/about`
   - 页面**不会刷新**

4. **事件触发**：浏览器自动触发 `hashchange` 事件

5. **监听器响应**：HashRouter 内部的事件监听器捕获到变化

6. **解析路径**：从 `window.location.hash` 获取 `#/about`，去掉 `#` 得到 `/about`

7. **路由匹配**：在路由表中查找 `/about` 对应的组件

8. **组件渲染**：找到匹配的 About 组件并渲染到页面

---

#### 关键特点

- **无刷新跳转**：整个过程页面不会重新加载
- **纯前端控制**：所有逻辑在浏览器端完成
- **浏览器历史**：会添加到浏览器历史记录，支持前进/后退
- **服务器无感知**：服务器始终只收到对 `/` 的请求

 

---

## 二、BrowserRouter 工作原理（完整版）

### 📋 核心概念前置

**重要澄清**：
- ✅ `popstate` 事件**只在浏览器前进/后退时触发**
- ❌ `history.pushState()` **不会触发** `popstate` 事件
- ❌ `history.replaceState()` **不会触发** `popstate` 事件

---

### 场景一：编程式导航（用户点击 Link 组件）

#### 详细步骤

1. **用户操作**
   - 用户点击页面上的 `<Link to="/about">About</Link>` 链接

2. **触发导航方法**
   - React Router 内部调用 `navigate('/about')` 方法

3. **修改 URL（关键步骤）**
   ```javascript
   history.pushState(null, '', '/about');
   ```
   - URL 从 `http://xxx/` 变为 `http://xxx/about`
   - ⚠️ **页面不会刷新**
   - ⚠️ **会添加新的历史记录条目**
   - ⚠️ **popstate 事件不会触发！**（这是你的疑问点）

4. **BrowserRouter 手动更新内部状态**
   ```javascript
   setLocation({
     pathname: '/about',
     search: '',
     hash: ''
   });
   ```
   - 因为 `pushState` 不会触发事件，所以 BrowserRouter **必须手动更新** React 状态
   - 这会触发组件重新渲染

5. **路由匹配**
   - React Router 根据新的 `location.pathname`（`/about`）在路由表中查找匹配项

6. **组件渲染**
   - 找到匹配的 `About` 组件
   - 渲染到页面上

---

### 场景二：浏览器前进/后退操作

#### 详细步骤

1. **用户操作**
   - 用户点击浏览器的**后退**或**前进**按钮
   - 或调用 `history.back()` / `history.forward()` / `history.go(-1)`

2. **浏览器自动触发 popstate 事件**
   ```javascript
   // 浏览器内部自动触发
   window.dispatchEvent(new PopStateEvent('popstate', { state: ... }));
   ```
   - ⚠️ **这是唯一会触发 popstate 事件的场景！**

3. **BrowserRouter 监听到事件**
   ```javascript
   window.addEventListener('popstate', (event) => {
     // 事件处理函数被调用
   });
   ```

4. **获取当前路径**
   ```javascript
   const pathname = window.location.pathname;  // 例如: '/home'
   const search = window.location.search;      // 例如: '?id=1'
   const hash = window.location.hash;          // 例如: '#section'
   ```

5. **更新内部状态**
   ```javascript
   setLocation({
     pathname: pathname,
     search: search,
     hash: hash
   });
   ```
   - 触发 React 重新渲染

6. **路由匹配**
   - 根据新的路径在路由表中查找匹配项

7. **组件渲染**
   - 渲染匹配的组件

---

### 🔄 两种场景对比

| 对比项 | 编程式导航 | 浏览器前进/后退 |
|--------|-----------|----------------|
| **触发方式** | `navigate('/path')` | 点击按钮或 `history.back()` |
| **修改 URL 方法** | `history.pushState()` | 浏览器自动处理 |
| **popstate 事件** | ❌ **不会触发** | ✅ **会触发** |
| **BrowserRouter 响应** | 手动更新状态 | 监听事件 + 更新状态 |
| **是否需要手动干预** | ✅ 需要 | ❌ 不需要（事件自动触发） |

---

### 🛠️ BrowserRouter 源码逻辑（简化版）

```javascript
function BrowserRouter({ children }) {
  // 1. 初始化状态
  const [location, setLocation] = useState({
    pathname: window.location.pathname,
    search: window.location.search,
    hash: window.location.hash
  });

  // 2. 监听 popstate 事件（只处理浏览器前进/后退）
  useEffect(() => {
    const handlePopState = (event) => {
      console.log('popstate 事件触发！');  // 只在前进/后退时打印
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 3. 导航方法
  const navigate = useCallback((to, { replace = false } = {}) => {
    // 修改 URL
    if (replace) {
      history.replaceState(null, '', to);
    } else {
      history.pushState(null, '', to);  // ❌ 不会触发 popstate！
    }
    
    // ⚠️ 关键：手动更新状态
    setLocation({
      pathname: to,
      search: '',
      hash: ''
    });
  }, []);

  return (
    <RouterContext.Provider value={{ location, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
```

---

### 📊 完整流程图（文字版）

#### 编程式导航流程

```
用户点击 Link 组件
  ↓
navigate('/about') 被调用
  ↓
history.pushState(null, '', '/about')
  ├─ URL 变为: http://xxx/about
  ├─ 页面不刷新 ✅
  ├─ 添加历史记录 ✅
  └─ popstate 事件触发？❌ **不会触发！**
  ↓
BrowserRouter 手动调用 setLocation()
  ↓
React 状态更新，触发重新渲染
  ↓
路由匹配（查找 /about 对应的组件）
  ↓
渲染 About 组件到页面
```

#### 浏览器前进/后退流程

```
用户点击浏览器后退按钮
  ↓
浏览器自动触发 popstate 事件
  ├─ URL 变为: http://xxx/home
  ├─ popstate 事件触发？✅ **会触发！**
  └─ 事件对象包含: event.state
  ↓
BrowserRouter 的事件监听器捕获事件
  ↓
获取当前路径: window.location.pathname
  ↓
BrowserRouter 调用 setLocation()
  ↓
React 状态更新，触发重新渲染
  ↓
路由匹配（查找 /home 对应的组件）
  ↓
渲染 Home 组件到页面
```

## 三、关键差异深度对比

### 3.1 服务器交互差异 -- 刷新页面或者在地址栏输入url的时候，HashRouter 和 BrowserRouter 的表现完全不同：

#### HashRouter - 无服务器交互

```javascript
// 用户访问: http://example.com/#/about
// 刷新页面时:

// 1. 浏览器向服务器发送请求
GET / HTTP/1.1
Host: example.com
// 注意：请求路径是 /，不是 /#/about

// 2. 服务器返回 index.html
HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>

// 3. 前端 JavaScript 执行
// 读取 window.location.hash = '#/about'
// 匹配路由，渲染 About 组件
```

#### BrowserRouter - 需要服务器配合

```javascript
// 用户访问: http://example.com/about
// 刷新页面时:

// ❌ 错误配置：服务器尝试查找 /about 文件
GET /about HTTP/1.1
Host: example.com

HTTP/1.1 404 Not Found  // 服务器找不到 /about 文件

// ✅ 正确配置：服务器返回 index.html

GET /about HTTP/1.1
Host: example.com

HTTP/1.1 200 OK
Content-Type: text/html

<!DOCTYPE html>
<html>
  <body>
    <div id="root"></div>
    <script src="bundle.js"></script>
  </body>
</html>

// 前端 JavaScript 执行
// 读取 window.location.pathname = '/about'
// 匹配路由，渲染 About 组件
```
注意：
+ 
### 3.2 浏览器兼容性差异

| 浏览器 | HashRouter | BrowserRouter |
|--------|-----------|---------------|
| IE8 | ✅ 支持 | ❌ 不支持 |
| IE9 | ✅ 支持 | ❌ 不支持 |
| IE10+ | ✅ 支持 | ✅ 支持 |
| Chrome | ✅ 支持 | ✅ 支持 |
| Firefox | ✅ 支持 | ✅ 支持 |
| Safari | ✅ 支持 | ✅ 支持 |

**检测兼容性**：
```javascript
function supportsHistory() {
  // 检查是否支持 pushState
  return window.history && 'pushState' in window.history;
}

if (supportsHistory()) {
  // 使用 BrowserRouter
} else {
  // 降级使用 HashRouter
}
```
---
 
## 六、高级特性对比

### 6.1 路由状态传递

```javascript
// BrowserRouter 支持 state 传递
import { useNavigate } from 'react-router-dom';

function PageA() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/page-b', {
      state: { 
        from: 'page-a', 
        data: { id: 123 }
      }
    });
  };
  
  return <button onClick={handleClick}>跳转</button>;
}

// state 存储在 history.state 中
// 可以通过 useLocation() 获取
```

**HashRouter 的限制**：
```javascript
// HashRouter 也支持 state，但刷新后会丢失
// 因为 hash 变化不会保存 state 到浏览器历史
```

### 6.2 路由守卫与权限控制

```javascript
// 自定义路由守卫
function PrivateRoute({ children }) {
  const location = useLocation();
  const isAuthenticated = checkAuth();
  
  if (!isAuthenticated) {
    // 保存当前路径，登录后跳回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return children;
}

// 使用
<BrowserRouter>
  <Routes>
    <Route path="/dashboard" element={
      <PrivateRoute>
        <Dashboard />
      </PrivateRoute>
    } />
  </Routes>
</BrowserRouter>
```

---

## 七、总结：核心原理对比表

| 特性 | HashRouter | BrowserRouter |
|------|-----------|---------------|
| **底层技术** | `location.hash` + `hashchange` | History API (`pushState`, `replaceState`, `popstate`) |
| **URL 格式** | `/#/path` | `/path` |
| **服务器请求** | 只请求 `/` | 请求完整路径（需配置） |
| **事件触发** | `hashchange` | `popstate` |
| **浏览器兼容** | 所有浏览器 | 需要 HTML5 支持 |
| **SEO** | ❌ 不友好 | ✅ 友好 |
| **路由状态** | 刷新丢失 | 可保留 |
| **性能** | 事件触发快 | API 性能更好 |
| **适用场景** | 静态托管、兼容性要求高 | 生产环境、SEO 重要 |

---

## 💡 面试加分回答

**面试官**：请深入讲解 HashRouter 和 BrowserRouter 的原理？

**追问**：为什么 BrowserRouter 刷新会 404？

**回答**：因为 BrowserRouter 的路由是真实路径，刷新时浏览器向服务器请求该路径，如果服务器没有配置返回 `index.html`，就会返回 404。解决方案是配置服务器的 `try_files` 或 `fallback` 规则。