# 06b — React 17：无新 Feature 的"过渡版本"

> React 17 没有任何面向开发者的新 API 或 Feature。它做的事是"换地基"——为新 JSX Transform、React 18 的 Concurrent Mode 铺路。

---

## 一、为什么 17 没有新 Feature？

React 团队的处理方式：**渐进式升级（Gradual Upgrades）**。与其出一次性 breaking change 让所有人改代码，不如发布一个"清理版本"把需要拆的雷拆掉，让开发者无痛过渡。

因此 React 17 有 breaking changes，但**绝大多数改动不会影响应用代码**。

---

## 二、新的 JSX Transform

### 2.1 之前怎么写

```jsx
import React from 'react';  // 必须，否则 JSX 编译报错

function App() {
  return <div>Hello</div>;
}
```

JSX 编译为 `React.createElement('div', null, 'Hello')`，所以必须 import React。

### 2.2 React 17 之后

```jsx
// 不需要 import React from 'react'！
function App() {
  return <div>Hello</div>;
}
```

JSX 编译为 `import { jsx } from 'react/jsx-runtime'; jsx('div', { children: 'Hello' })`。

**收益**：
- 代码少一行 import
- Bundle 体积略微减少
- 为未来的 JSX 优化留出空间

---

## 三、事件委托变更

### 3.1 旧行为（React 16）

```
document.addEventListener('click', handler)  // 委托到 document
```

所有事件委托到 document。问题：
- 同一个页面运行多个 React 版本时，`e.stopPropagation()` 在 React 内失效
- 大型页面的事件响应有微小延迟

### 3.2 新行为（React 17）

```
rootNode.addEventListener('click', handler)  // 委托到 root 节点
```

事件委托到 React 挂载的根节点。收益：
- 微前端、渐进升级场景下事件隔离更好
- `e.stopPropagation()` 行为更符合预期

### 3.3 移除的事件池（Event Pooling）

React 17 移除了事件池机制：

```jsx
// React 16：e.persist() 必须手动调用才能异步访问
function handleClick(e) {
  setTimeout(() => {
    console.log(e.target); // 如果不调 e.persist()，这里就空了
  }, 100);
}

// React 17：不需要 e.persist()，事件对象不会被重用
```

---

## 四、useEffect 清理时机变更

```jsx
// React 16：清理函数同步执行（阻塞渲染）
useEffect(() => {
  return () => {
    // 组件卸载时同步执行
  };
});

// React 17：清理函数异步执行（不阻塞渲染）
useEffect(() => {
  return () => {
    // 组件卸载时异步执行，延迟到浏览器绘制帧的末尾
  };
});
```

**收益**：组件卸载更快，用户体验更流畅。

---

## 五、渐进式升级（Gradual Upgrades）

这是 React 17 最重要的目标：允许同一页面上运行多个 React 版本。

使用场景：
- 大型应用逐步迁移，老模块继续用 React 16，新模块用 React 17
- 微前端架构中，不同子应用用不同 React 版本

实现方式：`ReactDOM.createRoot` 和 `ReactDOM.render` 可共存。

---

## 六、微前端与 React 17

### 6.1 什么是微前端？

微前端（Micro-Frontends）是一种架构模式，将前端应用拆分为多个独立的小型应用（子应用），每个子应用可以独立开发、独立部署、独立运行，最终在前端组合成一个完整的应用。

**类比**：微服务是后端的拆分思路，微前端就是把同样的理念搬到前端。

```
┌─────────────────────────────────────────┐
│              主应用 (Shell)              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │ 子应用 A  │ │ 子应用 B  │ │ 子应用 C  │ │
│  │ React 16 │ │ React 17 │ │  Vue 3   │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────┘
```

**核心价值**：
- 团队独立：不同团队负责不同子应用，技术栈可不同
- 独立部署：改一个子应用不需要重新部署整个应用
- 增量升级：老代码继续跑，新功能用新技术栈

### 6.2 React 17 跟微前端有什么关系？

React 17 的两个关键改动，**本质上就是为了让微前端成为可能**：

#### 6.2.1 事件委托从 document 改为 root 节点

这是 React 17 对微前端最核心的支撑。

**React 16 的问题**：

```jsx
// React 16 把所有事件都委托到 document
// 如果页面同时跑 React 16 子应用 + React 17 子应用：
// React 16 的 e.stopPropagation() 无法阻止事件冒泡到 React 17
// 因为它们在 document 层面共用同一个事件系统
```

**React 17 的解决**：

```
React 16：document.addEventListener('click', handler)    ← 全局一个
React 17：rootNode.addEventListener('click', handler)   ← 每个应用自己的 root
```

每个子应用的事件委托到自己的根节点，彼此隔离。`e.stopPropagation()` 在子应用内部正常工作，不会影响到其他子应用。

#### 6.2.2 渐进式升级让多版本共存

React 17 允许同一页面同时运行 React 16 和 React 17（通过不同的渲染入口），这是微前端"逐步迁移"的技术基础。

### 6.3 Demo：两个 React 子应用共存

下面是一个简单但完整的微前端 demo —— 同一页面跑两个独立的 React 应用，事件互不干扰。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>微前端 Demo — React 17 事件隔离</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f0f2f5;
      display: flex; gap: 20px; padding: 40px; min-height: 100vh;
    }
    .app-container {
      flex: 1; background: #fff; border-radius: 12px;
      padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .app-container h2 { font-size: 18px; margin-bottom: 16px; color: #333; }
    .click-zone {
      padding: 40px 20px; text-align: center; border-radius: 8px;
      cursor: pointer; user-select: none; transition: all 0.2s;
      font-size: 14px; color: #666;
    }
    .log-panel {
      margin-top: 16px; padding: 12px; background: #1e1e1e;
      border-radius: 6px; max-height: 200px; overflow-y: auto;
    }
    .log-panel .log {
      font-family: 'Fira Code', monospace; font-size: 12px;
      color: #4ec9b0; padding: 2px 0;
    }
    .log-panel .log.warn { color: #ce9178; }
  </style>
</head>
<body>

  <!-- 子应用 A 的挂载点 -->
  <div id="app-a" class="app-container"></div>

  <!-- 子应用 B 的挂载点 -->
  <div id="app-b" class="app-container"></div>

  <!-- 注意：生产环境你会有不同版本的 React，这里用 CDN 模拟概念 -->
  <script crossorigin src="https://unpkg.com/react@17/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <script type="text/babel">
    // ============ 子应用 A：计数器 ============
    const logA = []; // 每个子应用独立的日志

    function AppA() {
      const [count, setCount] = React.useState(0);
      const [logs, setLogs] = React.useState([]);

      const handleClick = (e) => {
        // 🔑 关键：stopPropagation 只在当前子应用内有效
        e.stopPropagation();
        setCount(c => c + 1);
        setLogs(prev => [...prev, `[AppA] 点击了！count = ${count + 1} (stopPropagation 已调用)`]);
      };

      return (
        <>
          <h2>📦 子应用 A（计数器）</h2>
          <div
            className="click-zone"
            style={{ background: '#e6f7ff', border: '2px dashed #91d5ff' }}
            onClick={handleClick}
          >
            <div style={{ fontSize: 48, fontWeight: 700, color: '#1890ff' }}>{count}</div>
            <div style={{ marginTop: 8 }}>点击这里 +1</div>
          </div>
          <div className="log-panel">
            {logs.map((msg, i) => (
              <div key={i} className="log">{msg}</div>
            ))}
          </div>
        </>
      );
    }

    // ============ 子应用 B：TODO 列表 ============
    function AppB() {
      const [todos, setTodos] = React.useState([
        { id: 1, text: '学习 React 17 事件委托', done: false },
        { id: 2, text: '理解微前端架构', done: false },
        { id: 3, text: '准备面试', done: false },
      ]);

      const toggle = (id, e) => {
        // 🔑 关键：这个 stopPropagation 不会影响 AppA 的事件
        e.stopPropagation();
        setTodos(prev =>
          prev.map(t => (t.id === id ? { ...t, done: !t.done } : t))
        );
      };

      return (
        <>
          <h2>📋 子应用 B（TODO）</h2>
          <div
            className="click-zone"
            style={{ background: '#fff7e6', border: '2px dashed #ffd591' }}
          >
            <ul style={{ listStyle: 'none', textAlign: 'left' }}>
              {todos.map(todo => (
                <li
                  key={todo.id}
                  onClick={(e) => toggle(todo.id, e)}
                  style={{
                    padding: '10px 16px', margin: '8px 0', cursor: 'pointer',
                    borderRadius: 6, transition: 'all 0.2s',
                    background: todo.done ? '#f6ffed' : '#fff',
                    border: `1px solid ${todo.done ? '#b7eb8f' : '#d9d9d9'}`,
                    textDecoration: todo.done ? 'line-through' : 'none',
                    color: todo.done ? '#999' : '#333',
                  }}
                >
                  {todo.done ? '✅' : '⬜'} {todo.text}
                </li>
              ))}
            </ul>
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: '#999' }}>
            💡 点击 TODO 项切换状态（每个子应用事件独立隔离）
          </div>
        </>
      );
    }

    // ============ 分别挂载到各自的 root ============
    ReactDOM.render(<AppA />, document.getElementById('app-a'));
    ReactDOM.render(<AppB />, document.getElementById('app-b'));

    // 如果页面上还有一个 React 16 的子应用，
    // 它用 ReactDOM.render（旧 API），也能和 React 17 应用共存。
    // 事件会委托到各自的 root，互不干扰。
  </script>

</body>
</html>
```

**Demo 要点解释**：

1. **两个独立的 React 应用**挂载到不同 DOM 节点，各自有独立的状态和事件
2. 每个子应用内调用 `e.stopPropagation()` 只会影响自己，因为 React 17 的事件委托到各自的 root 节点
3. 如果其中一个换成 React 16，照样能共存 —— 这就是渐进式升级的基础

### 6.4 Demo：模拟多版本共存

这个 demo 演示同一个页面同时运行 React 16 和 React 17：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>多版本 React 共存</title></head>
<body>
  <div id="root-16"><h3>React 16 区域</h3></div>
  <hr />
  <div id="root-17"><h3>React 17 区域</h3></div>

  <!-- React 16（旧版） -->
  <script src="https://unpkg.com/react@16/umd/react.development.js"></script>
  <script src="https://unpkg.com/react-dom@16/umd/react-dom.development.js"></script>
  <script>
    // React 16 子应用
    function OldApp() {
      return React.createElement('div', null,
        React.createElement('p', null, '👴 我是 React 16 的老代码'),
        React.createElement('button', { onClick: () => alert('React 16 事件触发') }, '点我')
      );
    }
    ReactDOM.render(React.createElement(OldApp), document.getElementById('root-16'));
  </script>

  <!-- React 17（新版）—— 注意：需要不同的全局变量名避免冲突 -->
  <!-- 实际项目中通过模块打包（webpack Module Federation / qiankun 等）自动隔离 -->
  <script>
    // 这里用同一个 React 17 CDN 模拟概念
    // 真正的多版本通过 import maps 或模块联邦实现
    console.log(
      '✅ 两个 React 分别渲染到各自的 root，事件隔离，互不影响\n' +
      '   - React 16 事件委托到 document\n' +
      '   - React 17 事件委托到 #root-17 节点'
    );
  </script>
</body>
</html>
```

> **面试说实话**：上面的多版本 demo 用了同一份 React CDN，因为浏览器 `<script>` 标签引入会覆盖全局变量。**真正的多版本共存**需要靠构建工具实现：
> - **Module Federation**（Webpack 5）：每个子应用打包时带上自己的 React，运行时互不冲突
> - **qiankun / micro-app**：通过 JS 沙箱隔离全局变量
> - **iframe**：最粗暴的隔离，每个子应用一个 iframe

### 6.5 主流微前端方案对比

| 方案 | 原理 | JS 隔离 | 样式隔离 | 适合场景 |
|------|------|---------|---------|---------|
| **iframe** | 浏览器原生隔离 | ✅ 天然 | ✅ 天然 | 最简单，但体验差（URL 不同步、加载慢） |
| **qiankun** | 基于 single-spa，JS 沙箱 | ✅ Proxy 代理 | ⚠️ 需手动处理 | 阿里系，国内用得最多 |
| **micro-app** | Web Component + Proxy | ✅ Proxy 代理 | ✅ Shadow DOM | 京东系，接入成本低 |
| **Module Federation** | Webpack 5 原生 | ✅ 模块作用域 | ⚠️ 需手动处理 | 构建时集成，性能最好 |
| **wujie** | Web Component + iframe | ✅ 天然 | ✅ Shadow DOM | 腾讯系，iframe 沙箱体验 |

### 6.6 微前端与 React 面试常问

**Q1：微前端中事件冒泡会互相干扰吗？**

React 16 会，因为它把事件委托到 `document`。React 17+ 不会，因为委托到各自的 root 节点。这是 React 17 事件系统改动的核心动机之一。

**Q2：多个 React 版本如何共存？**

通过 Module Federation 或微前端框架（qiankun 等），每个子应用打包时带上自己的 React 版本，运行时通过 JS 沙箱或模块作用域隔离，互相看不到对方的全局变量。

**Q3：微前端的状态能共享吗？**

可以，但要谨慎。通常通过：
- 主应用通过 props 传递共享状态
- 自定义事件总线（Event Bus）
- 共享状态管理库（但会增加耦合，不推荐作为首选）

原则：**子应用之间尽量不直接通信**，通过主应用中转。

**Q4：为什么 React 17 是微前端的"基础设施版本"？**

React 17 没给开发者新 API，但它改了三件事让微前端成为可能：
1. 事件委托到 root → 事件隔离
2. 渐进式升级支持 → 多版本共存
3. useEffect 清理异步化 → 卸载更快，切换子应用更流畅

### 6.7 一个面试可以讲的总结

> "React 17 看起来没加新功能，但它做了一件很关键的事：把事件委托从 document 移到了 root 节点。这个改动对于单个应用来说几乎无感，但对于微前端架构来说就是地基——它让多个 React 应用可以在同一个页面上和平共处，各自的事件不会互相干扰。加上对渐进式升级的支持，React 17 本质上是在为大规模前端应用的架构演进铺路。"

---

## 七、其他底层改动

| 改动 | 说明 |
|------|------|
| **onFocus / onBlur 改用 native focusin/focusout** | 行为更符合浏览器标准 |
| **onScroll 不再冒泡** | 与其他事件行为一致 |
| **forwardRef / memo 返回 undefined 时报错** | 早期发现 bug |
| **更严格的类型检查** | PropTypes 仅在开发模式下运行 |
| **核心 bundle 体积缩小** | 无新 Feature 但包更小 |

---

## 面试要点

| 问题 | 核心回答 |
|------|---------|
| React 17 有 breaking change 吗？ | 有，但绝大多数不影响应用代码 |
| 新 JSX Transform 有什么用？ | 不需要 import React，减少 bundle |
| 事件委托改了什么？ | 从 document 改为 root 节点 |
| 为什么 17 没新 Feature？ | 为 React 18 Concurrent Mode 换地基，过渡版本 |
| 渐进式升级是什么？ | 同一页面运行多个 React 版本，逐步迁移 |
| 微前端和 React 17 什么关系？ | 事件委托到 root 是微前端事件隔离的基础 |
| 微前端多个 React 版本如何共存？ | Module Federation 或 JS 沙箱隔离全局变量 |
| 微前端事件会互相干扰吗？ | React 17+ 不会，各自委托到自己的 root |
| 常用微前端方案有哪些？ | qiankun / micro-app / Module Federation / wujie |
