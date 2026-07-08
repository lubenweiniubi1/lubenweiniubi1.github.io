# qiankun 微前端高频面试题

---

## 一、基础概念

### Q1: 什么是微前端？为什么要用它？

**回答要点：**

微前端是一种将前端应用拆分为更小、更简单的独立模块的架构模式，每个模块可以由不同团队独立开发、测试和部署。

**核心价值：**
- **技术栈无关**：主应用不限制子应用的技术栈（React、Vue、Angular 均可）
- **独立开发/部署**：各子应用独立仓库、独立 CI/CD，互不阻塞
- **增量升级**：老旧系统可以逐步迁移，不用整体重写
- **团队自治**：不同业务线团队可独立迭代，降低沟通成本
- **运行时整合**：不同于 iframe 的隔离方案，qiankun 在同一个 DOM 下实现 JS/CSS 隔离

**适用场景：** 大型中后台系统、多团队协作、遗留系统迁移、多业务线聚合

---

### Q2: qiankun 的底层原理是什么？它基于哪些原生能力？

**回答要点：**

qiankun 基于 **single-spa** 封装，核心依赖三个浏览器原生能力：

1. **`fetch` / `import-html-entry`**：通过 fetch 拉取子应用的 HTML 入口，从中解析出 JS 和 CSS，然后在主应用中执行
2. **Proxy**（JS 沙箱）：用 `Proxy` 代理 `window` 对象，拦截子应用对全局变量的读写，实现 JS 隔离
3. **Shadow DOM / Scope CSS**：通过 CSS Scope 方案（给样式加前缀/命名空间）实现样式隔离

**single-spa vs qiankun：**
| 对比维度 | single-spa | qiankun |
|----------|-----------|---------|
| 子应用接入成本 | 高，需要手动导出生命周期 | 低，几乎无需改造（UMD 打包即可） |
| JS 沙箱 | 无 | Proxy 沙箱 + Snapshot 沙箱 |
| CSS 隔离 | 无 | 实验性支持（strictStyleIsolation / experimentalStyleIsolation） |
| 预加载 | 无 | 支持资源预加载 |
| 开箱即用 | 否 | 是 |

---

### Q3: qiankun 是如何加载子应用的？描述完整流程。

**回答要点：**

```
1. registerMicroApps(apps, lifeCycles)  注册子应用列表
2. start()                              启动 qiankun，监听路由变化
3. URL 匹配 activeRule                  触发子应用激活
4. import-html-entry                    通过 fetch 拉取子应用 HTML
   ├── 解析 HTML，提取所有 <script> 和 <link>
   ├── 获取 JS 文本和 CSS 文本
   └── 通过 eval 在沙箱中执行 JS
5. 子应用 mount 生命周期被调用           挂载到指定 container DOM 节点
6. URL 不再匹配 activeRule              触发 unmount 生命周期，卸载子应用
```

**关键 API：**
- `registerMicroApps(apps, lifeCycles?)` — 注册子应用
- `start(opts?)` — 启动 qiankun
- `initGlobalState(state)` — 初始化全局状态
- `addGlobalUncaughtErrorHandler(handler)` — 全局错误捕获

---

## 二、JS 沙箱

### Q4: qiankun 的 JS 沙箱是怎么实现的？ProxySandbox 和 SnapshotSandbox 有什么区别？

**回答要点：**

qiankun 实现了两种沙箱：

#### SnapshotSandbox（快照沙箱）

- **原理**：在子应用激活前对 `window` 拍快照（记录所有 key），子应用卸载时恢复快照
- **实现**：遍历 window 的所有属性，分别存到 `windowSnapshot` 和 `modifyPropsMap`
- **缺点**：遍历 window 很慢，且不支持多实例同时运行

```js
// 伪代码
class SnapshotSandbox {
  active() {
    // 记录当前 window 快照
    this.windowSnapshot = {};
    for (const key of Object.keys(window)) {
      this.windowSnapshot[key] = window[key];
    }
    // 恢复该子应用之前的修改
    Object.keys(this.modifyPropsMap).forEach(key => {
      window[key] = this.modifyPropsMap[key];
    });
  }
  inactive() {
    // 记录子应用的修改
    for (const key of Object.keys(window)) {
      if (window[key] !== this.windowSnapshot[key]) {
        this.modifyPropsMap[key] = window[key];
        window[key] = this.windowSnapshot[key]; // 恢复
      }
    }
  }
}
```

#### ProxySandbox（代理沙箱）⭐ 默认

- **原理**：用 `Proxy` 为每个子应用创建一个 `fakeWindow`，劫持对 `window` 的读写
- **优点**：支持**多实例同时运行**，性能更好
- **核心**：通过 `hasOwnProperty` 区分原生属性和子应用新增属性

```js
// 伪代码
class ProxySandbox {
  constructor() {
    this.fakeWindow = {}; // 子应用自己的全局变量池
    this.proxy = new Proxy(window, {
      get(target, key) {
        // 优先从 fakeWindow 取
        if (this.fakeWindow.hasOwnProperty(key)) {
          return this.fakeWindow[key];
        }
        return target[key]; // 否则从真实 window 取
      },
      set(target, key, value) {
        // 写入 fakeWindow，不污染真实 window
        this.fakeWindow[key] = value;
        return true;
      },
    });
  }
}
```

**面试追问：Proxy 沙箱下 `window.a = 1` 和 `window.Array` 的行为分别是什么？**
- `window.a = 1` → 写入 `fakeWindow`，不污染真实 `window`
- `window.Array` → 从 `fakeWindow` 查不到，回退到真实 `window.Array`

---

### Q5: qiankun 的 JS 沙箱有哪些局限性？什么问题沙箱解决不了？

**回答要点：**

1. **无法隔离直接操作 DOM**：如 `document.querySelector` 会被所有子应用共享
2. **无法隔离 `eval` / `new Function`**：这些是动态执行代码，Proxy 无法拦截
3. **无法隔离 WebSocket / EventSource / IndexedDB** 等非 window 属性的全局资源
4. **第三方库的 `IIFE`**：如果库直接使用对 window 的引用而非通过沙箱 proxy，可能逃逸
5. **全局事件的绑定**：如 `window.addEventListener('resize', ...)`，子应用卸载时需要手动清理
6. **`document.head` 和 `document.body` 的污染**：子应用往 head 插入 style 不会被自动清理

---

## 三、CSS 隔离

### Q6: qiankun 如何解决 CSS 隔离问题？有哪些方案？

**回答要点：**

#### 方案一：strictStyleIsolation（严格隔离）

```js
start({ sandbox: { strictStyleIsolation: true } });
```

- 基于 **Shadow DOM** 实现
- 将子应用包裹在 Shadow DOM 中，样式完全隔离
- **缺点**：Shadow DOM 内的弹窗组件（Modal、Dropdown）可能被挂到 body，无法应用子应用的样式

#### 方案二：experimentalStyleIsolation（实验性隔离）

```js
start({ sandbox: { experimentalStyleIsolation: true } });
```

- 原理：遍历子应用的所有样式规则，给每个选择器添加特殊前缀（如 `div[data-qiankun="app-name"]`）
- 本质是 CSS Scope 方案
- **缺点**：无法处理动态插入的样式；`@keyframes`、`@font-face`、`body/head/html` 选择器会有问题

#### 方案三：工程化手段（推荐）

- **CSS Modules**：每个组件样式自带 hash
- **BEM 命名规范** + 子应用统一前缀
- **CSS-in-JS**（styled-components、emotion）：天然隔离
- **postcss 插件**自动加前缀
- **子应用打包时加 `postcss-preset-env` 或自定义 PostCSS 插件**

#### 方案四：主应用约定

- 子应用卸载时，清理自己动态插入的 `<style>` 和 `<link>`
- 在子应用的 `unmount` 生命周期中做清理

---

## 四、应用间通信

### Q7: qiankun 中主应用和子应用如何通信？

**回答要点：**

#### 方式一：Props 传递（主 → 子，单向）

```js
// 主应用注册时
registerMicroApps([
  {
    name: 'app1',
    entry: '//localhost:8001',
    container: '#container',
    activeRule: '/app1',
    props: { namespace: 'app1', apiBase: '/api/app1' },
  },
]);

// 子应用接收
export async function mount(props) {
  console.log(props.namespace); // 'app1'
  console.log(props.apiBase);  // '/api/app1'
  // 可以从 props.onGlobalStateChange 拿到额外的回调
}
```

#### 方式二：GlobalState（全局状态，双向通信）⭐ 推荐

```js
// 主应用初始化
import { initGlobalState } from 'qiankun';

const actions = initGlobalState({ user: null, token: '' });

// 主应用修改状态 → 所有子应用收到通知
actions.setGlobalState({ user: { name: 'admin' }, token: 'xxx' });

// 主应用监听
actions.onGlobalStateChange((state, prev) => {
  console.log('主应用收到变化:', state, prev);
});

// 子应用监听（在 mount 生命周期中绑定）
export async function mount(props) {
  props.onGlobalStateChange((state, prev) => {
    console.log('子应用收到:', state, prev);
  }, true); // true 表示立即触发一次
}

// 子应用修改状态
export async function mount(props) {
  props.setGlobalState({ fromApp1: 'hello' });
}
```

**通信原理：**
- 基于发布-订阅模式
- 每次 `setGlobalState` 会触发所有注册的回调
- 数据流向：主应用 `initGlobalState` → 子应用通过 `mount(props)` 拿到 `onGlobalStateChange` 和 `setGlobalState`

#### 方式三：自定义事件 / EventBus

```js
// 主应用
window.dispatchEvent(new CustomEvent('app-event', { detail: data }));

// 子应用
window.addEventListener('app-event', (e) => { ... });
```

> ⚠️ 注意在 unmount 时移除事件监听，防止内存泄漏

#### 方式四：URL 参数 / 浏览器存储

- `localStorage` / `sessionStorage` + `storage` 事件
- SharedWorker（较少用）
- URL query 参数

---

### Q8: 子应用之间可以直接通信吗？

**回答要点：**

原则上子应用之间**不应该直接通信**，推荐通过主应用中转：

```
子应用A → setGlobalState → 主应用 → onGlobalStateChange → 子应用B
```

如果要子应用间直连：
- 通过主应用暴露的共享 API（props 传入）
- 通过 `window` 上的共享对象（前提是知道对方的命名空间，不推荐）
- 通过自定义事件（`CustomEvent`）

**最佳实践：** 所有跨应用通信统一收口到主应用的 `store/globalState.js`，key 作为常量维护。

---

## 五、生命周期

### Q9: qiankun 的子应用有哪些生命周期？分别在什么时候调用？

**回答要点：**

子应用必须导出三个（或两个）生命周期钩子：

```js
// 1. bootstrap — 子应用首次加载时调用一次
export async function bootstrap() {
  // 初始化操作：加载配置、初始化 SDK 等
}

// 2. mount — 每次激活时调用（首次 + 每次切回）
export async function mount(props) {
  // 渲染应用、绑定事件、监听全局状态
  render(props);
}

// 3. unmount — 每次失活时调用
export async function unmount(props) {
  // 销毁应用实例、清除事件监听、清理定时器
  destroy();
}
```

**调用时机：**
```
URL 首次匹配 → bootstrap() → mount()
URL 切换走   → unmount()
URL 再切回来 → mount()（bootstrap 不再调用）
```

**额外生命周期（主应用注册时）：**
```js
registerMicroApps(apps, {
  beforeLoad: (app) => {},     // 开始加载
  beforeMount: (app) => {},    // 挂载前
  afterMount: (app) => {},     // 挂载后
  beforeUnmount: (app) => {},  // 卸载前
  afterUnmount: (app) => {},   // 卸载后
});
```

---

## 六、路由与资源

### Q10: qiankun 的路由是如何工作的？activeRule 和子应用路由如何配合？

**回答要点：**

qiankun 本身不依赖特定路由库，它通过 `activeRule` 判断是否激活子应用：

```js
// 方式1：字符串匹配（前缀匹配）
{ activeRule: '/user' }        // URL 以 /user 开头即激活

// 方式2：函数匹配（完全自定义）
{ activeRule: (location) => location.pathname.startsWith('/user') }

// 方式3：正则匹配
{ activeRule: /^\/user(\/|$)/ }
```

**关键点：**
- 主应用路由和子应用路由共享同一个 URL（同一域名）
- 主应用在注册时预留路由前缀给子应用
- 子应用内部用 `react-router` / `vue-router` 管理自己的路由
- 子应用的路由 base 需要与 `activeRule` 一致

```js
// React 子应用
<BrowserRouter basename="/user">
  <Routes>
    <Route path="/list" element={<UserList />} />
    <Route path="/detail/:id" element={<UserDetail />} />
  </Routes>
</BrowserRouter>
```

**常见踩坑：**
- 主应用的 `historyApiFallback` 和子应用路由冲突
- 子应用的 `<base href="/">` 设置不正确导致资源 404

---

### Q11: qiankun 子应用需要做哪些改造才能接入？

**回答要点：**

#### 1. 打包为 UMD 格式（webpack）

```js
// webpack.config.js
module.exports = {
  output: {
    library: `${packageName}-[name]`,  // 挂载到 window 的名字
    libraryTarget: 'umd',              // UMD 通用模块
    chunkLoadingGlobal: `webpackJsonp_${packageName}`, // 避免 JSONP 冲突
    globalObject: 'window',
  },
};
```

#### 2. 导出生命周期钩子

```js
// src/index.js
let root = null;
function render(props = {}) {
  const { container } = props;
  root = createRoot(container
    ? container.querySelector('#root')
    : document.getElementById('root'));
  root.render(<App />);
}

// 独立运行
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

// qiankun 生命周期
export async function bootstrap() {}
export async function mount(props) { render(props); }
export async function unmount() { root?.unmount(); }
```

#### 3. 允许跨域（开发环境）

```js
devServer: {
  headers: { 'Access-Control-Allow-Origin': '*' },
},
```

#### 4. 修复资源加载

- 图片等静态资源使用绝对路径或 CDN
- webpack 设置 `publicPath` 为入口 URL

#### 5. 避免污染全局

- 不在 `window` 上挂载业务属性（或使用统一命名空间）
- 事件监听在 `unmount` 中清理

---

## 七、部署与性能

### Q12: 为什么 qiankun 要求主应用和子应用同域？如何解决跨域问题？

**回答要点：**

**原因：**
1. qiankun 通过 `fetch` 拉取子应用的 HTML/JS/CSS
2. JS 沙箱需要在同一个 JS 执行上下文中运行
3. 不同源的 `iframe`/`fetch` 受同源策略限制

**开发环境方案：**
```js
// 子应用 webpack-dev-server 配置 CORS
devServer: {
  headers: { 'Access-Control-Allow-Origin': '*' },
}
```

**生产环境方案：**
```
Nginx 反向代理 — 统一入口域名

Browser 访问 → app.com（唯一域名）
  → Nginx :80
  ├─ /user/*    → main-app:8000（主应用服务，qiankun fetch sub-react:8001）
  ├─ /content/* → main-app:8000（主应用服务，qiankun fetch sub-vue:8002）
  └─ /api/*     → api-server:3000

浏览器始终只看到 app.com 一个 origin
```

---

### Q13: qiankun 有哪些性能优化手段？

**回答要点：**

#### 1. 预加载（Preload）

```js
import { start, prefetchApps } from 'qiankun';

start({
  prefetch: 'all',          // 所有子应用
  // prefetch: ['app1'],    // 指定子应用
  // prefetch: true,        // 第一个匹配的子应用
  // prefetch: false,       // 不预加载
});
```

原理：在浏览器空闲时（`requestIdleCallback`）请求子应用的 HTML 入口，提前解析并缓存 JS/CSS。

#### 2. 子应用按需加载

- 只在 `activeRule` 匹配时才加载子应用资源
- 子应用内部做路由级别的 code-splitting（`React.lazy` / `defineAsyncComponent`）

#### 3. 公共依赖抽取

- `externals` 配置：React、ReactDOM、Vue 等公共库从主应用加载
- 子应用通过 `externals` 引用，不重复打包

```js
// 主应用 webpack 配置
externals: {
  react: 'React',
  'react-dom': 'ReactDOM',
}

// 主应用 index.html
<script src="https://cdn.com/react@18.umd.js"></script>
```

#### 4. 资源缓存

- Nginx 设置为子应用静态资源添加 `Cache-Control`
- 文件名带 content hash 实现长期缓存

#### 5. 并行加载

- `singular: false`（非严格模式）允许多个子应用同时挂载
- 避免 `singular: true` 导致的前一个卸载后一个才加载的串行等待

---

## 八、排错与调试

### Q14: 子应用加载 404 怎么办？常见原因是什么？

**回答要点：**

| 原因 | 排查方法 | 解决 |
|------|----------|------|
| `entry` 地址写错 | 直接在浏览器打开 entry URL | 检查端口号和路径 |
| CORS 未配置 | Network 面板看是否有 CORS 错误 | devServer 加 `Access-Control-Allow-Origin` |
| webpack `publicPath` 不对 | 资源请求路径错误 | 设为绝对路径或动态 `__webpack_public_path__` |
| 子应用 HTML 响应了非 HTML 内容 | 查看 fetch 返回内容 | 检查 Nginx 路由配置 |
| 子应用未启动 | `curl` 测试端口 | 先单独启动子应用验证 |

---

### Q15: CSS 冲突和 JS 全局变量污染怎么排查？

**回答要点：**

**CSS 冲突排查：**
1. DevTools 审查元素，看哪个选择器生效
2. 检查是否有多个子应用使用了相同的 class 名
3. 检查加载顺序：后加载的子应用样式覆盖先加载的

**JS 全局变量污染排查：**
1. 打开控制台，在不同子应用间切换，打印 `window.myVar`
2. 搜索子应用代码中使用 `window.xxx =` 的地方
3. 检查是否有未 `import` 而直接使用全局变量的情况
4. 使用 Chrome DevTools 的 Performance Monitor 观察内存是否持续增长

---

## 九、综合场景

### Q16: 如何实现子应用的可配置化注册（动态注册）？

**回答要点：**

```js
// 从后台接口获取子应用列表
async function loadMicroApps() {
  const apps = await fetch('/api/micro-apps').then(r => r.json());

  const microApps = apps.map(app => ({
    name: app.name,
    entry: app.entry,
    container: '#micro-app-container',
    activeRule: app.activeRule,
    props: { namespace: app.name, apiBase: app.apiBase },
  }));

  registerMicroApps(microApps, {
    beforeLoad: [
      async (app) => {
        // 权限校验：无权限则阻止加载
        if (!hasPermission(app.name)) {
          return Promise.reject(new Error('无权限'));
        }
      },
    ],
  });

  start();
}

loadMicroApps();
```

**应用场景：**
- 后台管理系统的菜单和子应用由权限系统控制
- SaaS 平台根据租户配置动态加载不同的子应用

---

### Q17: 如何实现微前端的全局登录态管理？

**回答要点：**

```js
// 1. 主应用登录，写入 token
function onLoginSuccess(token, user) {
  setCookie('token', token);
  actions.setGlobalState({ token, user });
}

// 2. 子应用挂载时获取 token
export async function mount(props) {
  // 方式A：通过 props 同步获取
  const state = props.getGlobalState?.(); // 同步获取当前状态

  // 方式B：通过 onGlobalStateChange 监听
  props.onGlobalStateChange((state) => {
    // state.token 变化时更新子应用内部的认证状态
    updateAuthStore(state.token);
  }, true); // true = 立即触发一次回调
}

// 3. token 过期处理
actions.onGlobalStateChange((state) => {
  if (!state.token) {
    // token 被清空 → 子应用应跳转到登录页
    // 主应用统一跳转（不依赖子应用自行处理）
    window.location.href = '/login';
  }
});

// 4. 子应用内部 API 请求统一带 token
axios.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

---

### Q18: 微前端架构下，如何做统一的错误监控和异常处理？

**回答要点：**

```js
// 1. qiankun 全局错误捕获
import { addGlobalUncaughtErrorHandler } from 'qiankun';

addGlobalUncaughtErrorHandler((event) => {
  console.error('微前端异常:', event);
  // 上报到 Sentry / 自建监控平台
  reportError({
    app: event?.appOrParcelName,
    message: event?.message,
    stack: event?.error?.stack,
  });
});

// 2. 主应用 ErrorBoundary
class MicroAppErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div>子应用加载失败，请刷新重试</div>;
    }
    return this.props.children;
  }
}

// 3. 子应用内部自行捕获（Sentry 在子应用内初始化）
```

---

### Q19: qiankun 和 iframe 方案、Module Federation 的对比？

**回答要点：**

| 维度 | qiankun | iframe | Module Federation |
|------|---------|--------|-------------------|
| **隔离性** | JS 沙箱（Proxy）+ CSS Scope | 完全隔离（独立 Browsing Context） | 无隔离，共享作用域 |
| **通信** | GlobalState / Props 直通 | postMessage 异步 | 共享模块、直接调用 |
| **性能** | 好（同一上下文） | 差（多文档实例） | 最好（共享依赖） |
| **SEO** | 支持 SSR | 不支持 | 支持 SSR |
| **URL 同步** | 天然同步 | 需手动同步 | 天然同步 |
| **技术栈** | 支持任意框架 | 支持任意框架 | 仅 Webpack 5+，且限 JS 框架 |
| **子应用接入** | 需改造（UMD + 生命周期） | 零改造 | 需改造（webpack 配置） |
| **弹窗问题** | 正常 | Modal 不能跨 iframe | 正常 |
| **适用场景** | 中后台、多团队协作 | 第三方页面嵌入 | 同技术栈微服务 |

---

### Q20: 你在 qiankun 项目中遇到过哪些坑？怎么解决的？

**回答要点（结合项目实际）：**

1. **子应用静态资源 404**
   - 原因：webpack `publicPath` 默认是相对路径，qiankun fetch 后资源路径变成主应用域名
   - 解决：设置 `publicPath` 为子应用的 entry 地址前缀

2. **React/Vue 多实例冲突**
   - 原因：主应用和子应用都打包了 React
   - 解决：通过 `externals` 共享或设置 `chunkLoadingGlobal` 避免 JSONP 冲突

3. **子应用卸载后事件未清理**
   - 表现：切走子应用后，`resize` 事件还在响应
   - 解决：`unmount` 生命周期中清理所有事件监听和定时器

4. **弹窗组件挂载问题**
   - 原因：Ant Design Modal 等默认挂到 `document.body`，切走子应用后弹窗还在
   - 解决：使用 `getContainer` 指定挂载节点，并在 `unmount` 时销毁

5. **CSS 污染**
   - 表现：子应用 A 的样式影响了子应用 B
   - 解决：CSS Modules + BEM 命名 + `experimentalStyleIsolation`

6. **开发环境 HMR 失效**
   - 原因：qiankun 通过 fetch 获取的是构建后的 bundle，不是 devServer 的 HMR 资源
   - 解决：开发时子应用独立打开调试 UI，联调时再接入主应用

---

## 十、代码实战速查

### 主应用最小注册

```js
import { registerMicroApps, start, initGlobalState } from 'qiankun';

const apps = [
  {
    name: 'app1',
    entry: '//localhost:8001',
    container: '#micro-container',
    activeRule: '/app1',
    props: { namespace: 'app1' },
  },
];

registerMicroApps(apps);

// 初始化全局状态
const actions = initGlobalState({ user: null, token: '' });
actions.onGlobalStateChange((state, prev) => {
  console.log('state changed:', state);
});

start({ prefetch: true, sandbox: { experimentalStyleIsolation: true } });
```

### 子应用最小接入（React）

```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

let root = null;

function render(props = {}) {
  const { container } = props;
  const dom = container
    ? container.querySelector('#root')
    : document.getElementById('root');
  root = createRoot(dom);
  root.render(<App globalState={props} />);
}

// qiankun 生命周期
export async function bootstrap() {}
export async function mount(props) {
  props.onGlobalStateChange?.((state, prev) => {
    console.log('app1 state changed:', state);
  }, true);
  render(props);
}
export async function unmount() {
  root?.unmount();
  root = null;
}

// 独立运行（非 qiankun 环境）
if (!window.__POWERED_BY_QIANKUN__) {
  render();
}
```

---

> 文档总结基于 qiankun 2.x 版本，结合项目 [qiankun-demo](https://github.com) 实际架构编写。
