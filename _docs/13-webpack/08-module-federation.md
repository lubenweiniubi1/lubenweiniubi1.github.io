# 08 - 模块联邦 (Module Federation)

## 概念

### 1. 模块联邦解决什么问题？

传统的代码共享方式：

| 方式 | 问题 |
|------|------|
| **npm 包** | 发布 → 安装 → 重新构建，任何改动都要走完整 CI/CD |
| **iframe** | 通信复杂、样式隔离困难、SEO 差 |
| **CDN 共享** | 只能共享全局变量，无法做模块化 |

模块联邦的核心思想：**多个独立构建的应用，在运行时动态共享模块**——不需要重新构建，不需要 npm 发布。

### 2. Host 和 Remote

| 角色 | 职责 |
|------|------|
| **Remote** | 把自己的一部分模块暴露出去（exposes） |
| **Host** | 声明自己依赖哪些 remote（remotes），在运行时加载 |

一个应用可以同时是 Host 和 Remote——生产场景通常是一个 shell（壳应用）作为 Host，多个子应用作为 Remote。

### 3. 它和动态 import 的关系

模块联邦的底层就是动态 import。当你写 `import('mfRemote/Button')`，webpack 会自动在运行时从 remote 的地址加载 `remoteEntry.js`，然后从中找到对应的模块。

### 4. Shared Dependencies

Host 和 Remote 都用到了 `react`，如果不共享，用户会下载两份 React。`shared` 配置告诉 webpack：这个依赖应该共享，只加载一份。

```js
shared: {
  react: {
    singleton: true,         // 全局只允许一个实例
    requiredVersion: '^18.0',
  },
}
```

---

## 练习（由浅入深）

### Lv.1 理解概念——画架构图

在动手之前，画出你要做的事情：
```
[HostApp :3000] ──运行时加载──▶ [RemoteApp :3001]
                                  exposes: Button, utils
```

Host 在运行时通过 `remoteEntry.js` 发现 Remote 暴露了什么模块，然后按需加载。

### Lv.2 创建 Remote 项目

在旁边新建 `mf-remote` 项目：

```bash
mkdir ../mf-remote && cd ../mf-remote && npm init -y
npm install -D webpack webpack-cli webpack-dev-server html-webpack-plugin
```

核心是 `ModuleFederationPlugin` 配置：
```js
const { ModuleFederationPlugin } = require('webpack').container;

new ModuleFederationPlugin({
  name: 'remoteApp',                  // 唯一标识
  filename: 'remoteEntry.js',         // 入口文件（被 host 加载）
  exposes: {
    './Button': './src/Button.js',
    './utils':  './src/utils.js',
  },
})
```

创建 `src/Button.js`——导出一个创建按钮的函数。
创建 `src/utils.js`——导出 `formatDate` 等工具函数。

Remote 跑在 `localhost:3001`。

### Lv.3 Host 端消费 Remote

在当前项目 `webpack.config.js` 中添加：
```js
new ModuleFederationPlugin({
  name: 'hostApp',
  remotes: {
    mfRemote: 'remoteApp@http://localhost:3001/remoteEntry.js',
  },
})
```

在代码中跨应用导入：
```js
// 这个模块运行时来自 localhost:3001！
const { default: createButton } = await import('mfRemote/Button');
document.body.appendChild(createButton('Hello from Remote!'));
```

两个终端分别启动 Host(:3000) 和 Remote(:3001)，访问 Host，点击按钮——来自 Remote 的按钮出现在页面上。打开 Network 面板搜索 `remoteEntry.js`，确认它来自另一个源。

### Lv.4 Shared —— 避免重复加载

Host 和 Remote 都 `npm install lodash`，然后配置：
```js
shared: {
  lodash: {
    singleton: true,
    requiredVersion: '^4.17.0',
  },
}
```

分别在两个项目中 `import _ from 'lodash'`，验证打包产物中 lodash 是否只出现一次。

### Lv.5 双向共享

让 Host 也 expose 东西给 Remote 用。当前项目加：
```js
exposes: {
  './Header': './src/Header.js',
},
filename: 'hostEntry.js',    // host 也需要暴露入口
```

Remote 中配置 remotes 指向 Host。实现两个应用互相消费对方模块。

---

## 预期效果

- 理解模块联邦是"运行时共享"，和 npm 包的"构建时共享"本质不同
- 能独立搭建 Host/Remote 项目并跑通
- 理解 `singleton` 的作用

---

## 面试题

> 📝 待整理，先留位

- [ ] 模块联邦的原理是什么？和 npm 包发布有什么区别？
- [ ] Host 和 Remote 分别是什么角色？
- [ ] 模块联邦如何实现依赖共享？`singleton` 和 `eager` 分别什么意思？
- [ ] 模块联邦和 iframe 方案的区别？各自适用场景？
- [ ] 模块联邦的版本管理怎么做？remote 升级了 host 需要重新部署吗？
