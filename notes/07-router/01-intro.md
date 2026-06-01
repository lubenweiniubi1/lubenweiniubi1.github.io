[← 返回笔记目录](/) 

# 📚 React Router v7  

## 🎯 一、React Router v7 是什么？

**发布日期**：2024年11月22日

**重大变化**：从单纯的路由库进化为**全栈框架**，整合了 Remix 框架的核心特性！

---

## 📦 二、安装与三种模式

### 2.1 安装（v7 新变化）

```bash
# v7 统一包名，不再需要 react-router-dom
npm install react-router

# 或者使用 yarn
yarn add react-router
```

### 2.2 三种使用模式

#### **模式1：框架模式（Framework Mode）** - 全栈开发
```bash
# 使用官方脚手架创建项目
npx create-react-router@latest my-app
cd my-app
npm install
npm run dev
```

#### **模式2：数据模式（Data Mode）** - 推荐！功能最全
```javascript
import { createBrowserRouter, RouterProvider } from 'react-router';

// 创建路由配置
const router = createBrowserRouter([
  // 路由配置对象数组
]);

function App() {
  return <RouterProvider router={router} />;
}
```

#### **模式3：声明式模式（Declarative Mode）** - 简单项目
```javascript
import { BrowserRouter, Routes, Route } from 'react-router';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 🗺️ 三、核心概念详解（重点！）

### 3.1 什么是 `index: true`？（索引路由）

这是新手最容易困惑的地方！让我用**生活化比喻**解释：

#### 🏠 **比喻：房子和房间**

想象你有一个房子（父路由），房子里有多个房间（子路由）：

```
房子（/）        👈 父路由
├── 客厅（/）     👈 索引路由（index: true）- 进门第一眼看到的地方
├── 厨房（/kitchen）
└── 卧室（/bedroom）
```

**`index: true` 的作用**：
- 当你访问 `/`（房子的入口）时，应该显示哪个房间？
- **答案**：显示标记为 `index: true` 的房间（客厅）

---

### 3.2 完整路由配置（带超详细中文注释）

```javascript
import { createBrowserRouter } from 'react-router';

// 导入你的页面组件
import Layout from './Layout';        // 布局组件（包含导航栏、侧边栏等公共部分）
import Home from './Home';            // 首页组件
import About from './About';          // 关于页面
import Contact from './Contact';      // 联系我们页面
import UserDetail from './UserDetail'; // 用户详情页
import NotFound from './NotFound';    // 404 页面

// ========== 创建路由配置 ==========
const router = createBrowserRouter([
  // ========== 第一个路由：根路径 "/" ==========
  {
    // 🔑 path: 路由路径
    // 访问 http://localhost:3000/ 时匹配此路由
    path: '/',
    
    // 🔑 Component: 要渲染的组件
    // 使用 Layout 作为父组件，它通常包含导航栏、页脚等公共元素
    Component: Layout,
    
    // 🔑 children: 子路由数组（嵌套路由）
    // 这些子路由会在 Layout 组件内部的 <Outlet /> 位置渲染
    children: [
      // ---------- 子路由1：索引路由 ----------
      {
        // 🔑 index: true 👈【重点！新手必看】
        // 这是一个"索引路由"（默认子路由）
        // 当访问 "/" 时，如果没有匹配其他子路径，
        // 就会渲染这个带有 index: true 的子路由组件
        // 💡 理解：就像文件夹里的 index.html，是默认打开的文件
        index: true,
        
        // 要渲染的组件
        Component: Home
      },
      
      // ---------- 子路由2：关于页面 ----------
      {
        // 🔑 path: 子路由路径
        // 注意：这里写 'about' 而不是 '/about'
        // 因为它是相对于父路径 '/' 的，最终路径是 '/about'
        path: 'about',
        
        // 要渲染的组件
        Component: About
      },
      
      // ---------- 子路由3：联系我们 ----------
      {
        path: 'contact',
        Component: Contact
      },
      
      // ---------- 子路由4：动态路由（带参数） ----------
      {
        // 🔑 动态参数：:id 表示任意字符串
        // 例如：/users/123、/users/abc 都会匹配此路由
        // params.id 可以获取到 "123" 或 "abc"
        path: 'users/:id',
        
        Component: UserDetail
      }
    ]
  },
  
  // ========== 第二个路由：404 页面 ==========
  {
    // 🔑 通配符路由：* 匹配所有未定义的路径
    // 当访问不存在的路径时（如 /xxx），会渲染此组件
    path: '*',
    
    Component: NotFound
  }
]);

export default router;
```

---

### 3.3 Layout 组件示例（必须包含 `<Outlet />`）

```javascript
// Layout.jsx
import { Outlet, Link, useLocation } from 'react-router';

function Layout() {
  // useLocation 用于获取当前路由信息
  const location = useLocation();
  
  return (
    <div className="app-container">
      {/* ========== 顶部导航栏 ========== */}
      <nav className="navbar">
        <div className="logo">我的网站</div>
        
        {/* 🔑 Link 组件：声明式导航 */}
        <div className="nav-links">
          {/* to 属性指定目标路径 */}
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            首页
          </Link>
          
          <Link 
            to="/about" 
            className={location.pathname === '/about' ? 'active' : ''}
          >
            关于我们
          </Link>
          
          <Link 
            to="/contact" 
            className={location.pathname === '/contact' ? 'active' : ''}
          >
            联系我们
          </Link>
        </div>
      </nav>
      
      {/* ========== 🔑 Outlet 组件：子路由渲染位置 ========== */}
      {/* 这里是魔法发生的地方！ */}
      {/* 当访问不同子路由时，对应的组件会在这里渲染 */}
      {/* 例如：访问 / 时，Home 组件会在这里显示 */}
      {/* 访问 /about 时，About 组件会在这里显示 */}
      <main className="main-content">
        <Outlet />
      </main>
      
      {/* ========== 页脚 ========== */}
      <footer className="footer">
        <p>© 2026 我的网站. 保留所有权利.</p>
      </footer>
    </div>
  );
}

export default Layout;
```

---

### 3.4 各个页面组件示例

```javascript
// Home.jsx - 首页
import { Link } from 'react-router';

export default function Home() {
  return (
    <div className="home-page">
      <h1>🏠 欢迎来到首页！</h1>
      <p>这是网站的默认页面（索引路由）</p>
      
      {/* 链接到其他页面 */}
      <div className="links">
        <Link to="/about">去关于页面</Link>
        <Link to="/contact">去联系我们页面</Link>
        <Link to="/users/123">查看用户 123</Link>
      </div>
    </div>
  );
}

// About.jsx - 关于页面
export default function About() {
  return (
    <div className="about-page">
      <h1>ℹ️ 关于我们</h1>
      <p>这是一个使用 React Router v7 构建的网站。</p>
    </div>
  );
}

// Contact.jsx - 联系我们
export default function Contact() {
  return (
    <div className="contact-page">
      <h1>📞 联系我们</h1>
      <p>邮箱：contact@example.com</p>
    </div>
  );
}

// UserDetail.jsx - 用户详情（带动态参数）
import { useParams } from 'react-router';

export default function UserDetail() {
  // 🔑 useParams：获取路由参数
  // 例如访问 /users/123，params.id 就是 "123"
  const params = useParams();
  
  return (
    <div className="user-detail">
      <h1>👤 用户详情</h1>
      <p>用户ID：{params.id}</p>
      {/* 这里可以调用 API 获取用户详细信息 */}
    </div>
  );
}

// NotFound.jsx - 404 页面
import { useNavigate } from 'react-router';

export default function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="not-found">
      <h1>404 - 页面不存在</h1>
      <p>您访问的页面不存在。</p>
      <button onClick={() => navigate('/')}>
        返回首页
      </button>
    </div>
  );
}
```

---

## 🎨 四、路由导航方式

### 4.1 声明式导航（使用 `<Link>` 组件）

```javascript
import { Link, NavLink } from 'react-router';

function Navigation() {
  return (
    <nav>
      {/* 基础 Link */}
      <Link to="/">首页</Link>
      <Link to="/about">关于</Link>
      
      {/* NavLink - 会自动添加 active 类名当匹配当前路由 */}
      <NavLink 
        to="/about" 
        className={({ isActive }) => isActive ? 'active-link' : ''}
      >
        关于
      </NavLink>
      
      {/* 带状态的导航（传递额外数据） */}
      <Link 
        to="/user"
        state={{ from: 'home', timestamp: Date.now() }}
      >
        用户页面
      </Link>
    </nav>
  );
}
```

### 4.2 编程式导航（使用 `useNavigate` Hook）

```javascript
import { useNavigate, useLocation } from 'react-router';

function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 模拟登录
    const success = await login();
    
    if (success) {
      // 🔑 navigate(path) - 跳转到指定路径
      navigate('/dashboard');
      
      // 🔑 带状态跳转
      navigate('/profile', {
        state: { userId: 123 }
      });
      
      // 🔑 返回上一页
      navigate(-1);
      
      // 🔑 替换当前历史记录（不创建新记录）
      navigate('/home', { replace: true });
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input type="text" name="username" />
      <input type="password" name="password" />
      <button type="submit">登录</button>
    </form>
  );
}
```

---

## 🔄 五、路由参数详解

### 5.1 动态参数（`:param`）

```javascript
// 路由配置
{
  path: 'users/:id',        // :id 是动态参数
  Component: UserDetail
}

// 组件中获取参数
import { useParams } from 'react-router';

function UserDetail() {
  const { id } = useParams(); // 获取 :id 的值
  
  // 例如：访问 /users/123，id = "123"
  // 访问 /users/abc，id = "abc"
  
  return <div>用户ID：{id}</div>;
}
```

### 5.2 可选参数（`:param?`）

```javascript
// 路由配置
{
  path: 'search/:query?',   // :query? 表示 query 参数可选
  Component: Search
}

// 访问 /search 时，query = undefined
// 访问 /search/react 时，query = "react"
```

### 5.3 通配符参数（`*`）

```javascript
// 路由配置
{
  path: 'files/*',          // * 匹配任意路径
  Component: FileExplorer
}

// 访问 /files/docs/readme.md
// 在组件中可以通过 useParams() 获取 '*'
```

### 5.4 查询参数（URLSearchParams）

```javascript
import { useSearchParams } from 'react-router';

function SearchPage() {
  // 🔑 useSearchParams：获取和设置查询参数
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 获取参数
  const query = searchParams.get('q');      // ?q=react
  const page = searchParams.get('page');    // ?page=2
  
  // 设置参数
  const handleSearch = (newQuery) => {
    setSearchParams({ q: newQuery, page: '1' });
    // URL 会变成：?q=newQuery&page=1
  };
  
  return (
    <div>
      <input 
        value={query || ''} 
        onChange={(e) => handleSearch(e.target.value)} 
      />
      <p>当前搜索：{query}</p>
      <p>当前页码：{page}</p>
    </div>
  );
}
```

---

## 🛡️ 六、路由守卫（权限控制）

### 6.1 使用 Loader 实现路由守卫

```javascript
import { redirect } from 'react-router';

// 🔑 路由守卫 Loader
export async function authLoader() {
  // 检查是否有 token
  const token = localStorage.getItem('token');
  
  // 如果没有 token，重定向到登录页
  if (!token) {
    // 🔑 redirect(path) - 重定向到指定路径
    return redirect('/login?returnTo=' + window.location.pathname);
  }
  
  // 验证 token 是否有效
  const isValid = await validateToken(token);
  
  if (!isValid) {
    localStorage.removeItem('token');
    return redirect('/login');
  }
  
  // 验证通过，返回 null 或数据
  return null;
}

// 路由配置
{
  path: '/dashboard',
  Component: Dashboard,
  loader: authLoader  // 应用路由守卫
}
```

### 6.2 角色权限控制

```javascript
export async function roleBasedLoader({ request }) {
  const user = await getCurrentUser();
  
  // 获取所需角色
  const requiredRole = getRequiredRole(request.url);
  
  // 检查用户是否有权限
  if (!user.roles.includes(requiredRole)) {
    // 抛出错误，会被 errorElement 捕获
    throw new Response('无权限访问', { status: 403 });
  }
  
  return user;
}

function getRequiredRole(url) {
  const roleMap = {
    '/admin': 'admin',
    '/manager': 'manager'
  };
  
  for (const [path, role] of Object.entries(roleMap)) {
    if (url.startsWith(path)) {
      return role;
    }
  }
  
  return 'user';
}
```

---

## ⚡ 七、性能优化

### 7.1 路由懒加载（代码分割）

```javascript
const router = createBrowserRouter([
  {
    path: '/',
    async lazy() {
      // 🔑 动态导入：只有访问此路由时才加载组件
      const { default: Layout } = await import('./Layout');
      return { Component: Layout };
    },
    children: [
      {
        index: true,
        async lazy() {
          const { default: Home } = await import('./Home');
          return { Component: Home };
        }
      },
      {
        path: 'about',
        async lazy() {
          const { default: About } = await import('./About');
          return { Component: About };
        }
      }
    ]
  }
]);
```

### 7.2 使用 Suspense 处理加载状态

```javascript
import { Suspense } from 'react';
import { RouterProvider } from 'react-router';

function App() {
  return (
    <Suspense fallback={<div className="loading">加载中...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
```

---

## 📊 八、完整项目结构示例

```
my-react-app/
├── src/
│   ├── router/
│   │   └── index.js              # 路由配置文件（本文重点）
│   ├── components/
│   │   ├── Layout.jsx            # 布局组件（包含 <Outlet />）
│   │   └── Loading.jsx           # 加载组件
│   ├── pages/
│   │   ├── Home.jsx              # 首页
│   │   ├── About.jsx             # 关于页面
│   │   ├── Contact.jsx           # 联系我们
│   │   ├── UserDetail.jsx        # 用户详情
│   │   └── NotFound.jsx          # 404 页面
│   ├── App.jsx                   # 主应用组件
│   └── main.jsx                  # 入口文件
└── package.json
```

---

## 🎯 九、核心概念总结表

| 概念 | 说明 | 使用场景 |
|------|------|----------|
| **`index: true`** | 索引路由（默认子路由） | 父路由的默认显示内容 |
| **`<Outlet />`** | 子路由渲染占位符 | 布局组件中 |
| **`children`** | 子路由数组 | 嵌套路由配置 |
| **`:param`** | 动态参数 | 用户详情、文章详情等 |
| **`*`** | 通配符 | 404页面、文件浏览器 |
| **`loader`** | 数据预加载 | 页面数据获取、权限验证 |
| **`action`** | 表单提交处理 | 创建、更新、删除操作 |

---

## 💡 十、常见问题解答

### Q1: 为什么要有 `index: true`？

**答**：想象一个文件夹，里面有很多文件。当你打开这个文件夹时，默认显示哪个文件？通常是 `index.html`。`index: true` 就是这个作用——当访问父路由时，默认显示哪个子路由。

### Q2: `<Outlet />` 必须在 Layout 组件中吗？

**答**：是的！`<Outlet />` 是子路由的"插座"，必须放在父路由组件中，子路由组件才会在那里渲染。

### Q3: `path: 'about'` 和 `path: '/about'` 有什么区别？

**答**：
- `path: 'about'` - 相对路径，最终路径是 `/about`（相对于父路径 `/`）
- `path: '/about'` - 绝对路径，最终路径也是 `/about`

在嵌套路由中，通常使用相对路径（不带 `/` 前缀）。

---

## 📚 十一、学习资源

- **[官方文档](https://reactrouter.com)** - 最权威的学习资料
- **[React Router 中文文档](https://reactrouter.com.cn)** - 中文版
- **[GitHub 仓库](https://github.com/remix-run/react-router)** - 源码和示例

---

希望这个带详细中文注释的教程能帮助你彻底理解 React Router v7！如果有任何疑问，欢迎继续提问！🚀