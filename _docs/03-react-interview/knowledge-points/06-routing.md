# React Router

> 路由核心概念、HashRouter vs BrowserRouter、React Router v7 变化

---

## 一、React Router v7 三种模式

| 模式 | 适用场景 |
|------|---------|
| 框架模式（Framework） | 全栈开发，类似 Remix |
| 数据模式（Data） | 推荐，功能最全，`createBrowserRouter` |
| 声明式模式（Declarative） | 简单项目，`<BrowserRouter> + <Routes>` |

---

## 二、核心概念

### 嵌套路由 + Outlet
```jsx
const router = createBrowserRouter([{
  path: '/',
  Component: Layout,
  children: [
    { index: true, Component: Home },     // index: true = 默认子路由
    { path: 'about', Component: About },
    { path: 'users/:id', Component: User },
  ]
}]);
```

`<Outlet />` 是子路由渲染的占位符——必须写在 Layout 组件中。

### 动态参数
```jsx
// 路由：path: 'users/:id'
// 组件中：const { id } = useParams();
```

### 路由守卫
```jsx
export async function authLoader() {
  const token = localStorage.getItem('token');
  if (!token) return redirect('/login');
  return null;
}
// 路由配置：{ path: '/dashboard', Component: Dashboard, loader: authLoader }
```

---

## 三、HashRouter vs BrowserRouter

| | HashRouter | BrowserRouter |
|---|---|---|
| URL 格式 | `/#/path` | `/path` |
| 核心 API | `hashchange` 事件 | `pushState`/`replaceState` + `popstate` |
| 服务端要求 | 不需要配置 | 需要配置 fallback |
| 刷新行为 | 不会 404（# 之后不发到服务端） | 会 404（没有服务端配置时） |

### 底层原理

**HashRouter**：监听 `hashchange` 事件，hash 变化不发送请求到服务端。

**BrowserRouter**：通过 `pushState`/`replaceState` 修改 URL（不刷新页面），通过 `popstate` 事件监听浏览器前进/后退。

---

## 四、编程式导航

```jsx
const navigate = useNavigate();
navigate('/dashboard');              // 跳转
navigate(-1);                        // 返回
navigate('/home', { replace: true }); // 替换历史记录
```

---

## 五、代码分割（路由懒加载）

```jsx
{
  path: '/heavy',
  async lazy() {
    const { default: Heavy } = await import('./Heavy');
    return { Component: Heavy };
  }
}
```
