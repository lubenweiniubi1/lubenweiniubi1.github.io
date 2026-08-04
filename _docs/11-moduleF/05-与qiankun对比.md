# Module Federation vs qiankun 全面对比

> 📘 **综合对比** | 帮助你根据项目场景做出技术选型

---

## 一句话说清区别

| 方案 | 一句话 |
|------|--------|
| **qiankun** | 从 URL 路由层面拆分应用（每个子应用 = 一个完整的 SPA） |
| **Module Federation** | 从代码模块层面共享应用（任何应用的模块都可以被其他应用 import） |

---

## 架构模式对比

```
qiankun（星型 — 中心化）          Module Federation（网状 — 去中心化）

        主应用                              app_a ──── app_b
       /  |  \                              │  \      /  │
     /    |    \                            │   \    /   │
  子A  子B  子C                           │    \  /    │
                                          app_c ──── app_d

  主应用是必经之路                      没有中心节点，任何两个应用
  负责路由、加载、通信                   都可以互相引用模块
```

---

## 20 维度详细对比表

| 维度 | qiankun | Module Federation | 谁更好 |
|------|---------|-------------------|--------|
| **1. 隔离级别** | 应用级（每个子应用是完整 SPA） | 模块级（组件/工具函数共享） | 各有适用 |
| **2. JS 沙箱** | ✅ Proxy/Snapshot 沙箱 | ❌ 无沙箱，共享 window | qiankun ✅ |
| **3. CSS 隔离** | ✅ Shadow DOM / 样式前缀 | ❌ 无内置隔离 | qiankun ✅ |
| **4. 依赖共享** | ❌ 手动 externals + CDN | ✅ shared 自动协商去重 | MF ✅ |
| **5. 路由管理** | ✅ 主应用统一管理 | ❌ 各自管理路由 | qiankun ✅ |
| **6. 技术栈兼容** | ✅ 任意框架（fetch HTML 即可） | ⚠️ 需要 Webpack 5+ | qiankun ✅ |
| **7. 接入改造成本** | 中等（UMD + 生命周期导出） | 较低（加 webpack 插件即可） | MF ✅ |
| **8. 独立开发体验** | 需要主应用启动才能联调 | 可以完全独立开发 | MF ✅ |
| **9. 版本发布** | 子应用更新 → 刷新浏览器生效 | Remote 更新 → 无需刷新即生效 | MF ✅ |
| **10. 渐进式迁移** | 新功能做子应用，老代码不动 | 逐步 expose/替换模块 | 相当 |
| **11. 部署复杂度** | 需 Nginx 统一域名 | 同域名最佳，CORS 也可 | MF ✅ |
| **12. 安全隔离** | ✅ 第三方应用也可以安全接入 | ❌ 只适合信任的团队 | qiankun ✅ |
| **13. 全局状态管理** | ✅ initGlobalState 收发 | ❌ 需自行实现（或用 shared 模块） | qiankun ✅ |
| **14. 生命周期管理** | ✅ bootstrap/mount/unmount | ❌ 无生命周期概念 | qiankun ✅ |
| **15. 预加载** | ✅ 内置 prefetch | ❌ 需手动实现 | qiankun ✅ |
| **16. React 多实例** | ✅ 子应用独立 React 实例 | ⚠️ 必须 singleton 否则 crash | MF ✅ |
| **17. 多版本共存** | ❌ 不支持 | ✅ shareScope 分开即可 | MF ✅ |
| **18. tree shaking** | ❌ 全量加载 | ✅ 支持 tree shaking | MF ✅ |
| **19. 构建工具** | 不限 | Webpack 5+ / Rspack | qiankun ✅ |
| **20. 社区生态** | 成熟（蚂蚁金服背书） | 成熟（Webpack 5 内置） | 相当 |

---

## 选型决策树

```
你的场景是？

① 集成第三方/外包团队的应用？
  └── ✅ 选 qiankun（需要沙箱隔离）

② 多个团队共享组件，技术栈一致（都是 React）？
  └── ✅ 选 Module Federation（更轻量）

③ 有老框架的应用需要集成（jQuery、AngularJS 等）？
  └── ✅ 选 qiankun（MF 只支持 Webpack 5+）

④ 需要应用级路由隔离，希望子应用完全自治？
  └── ✅ 选 qiankun（MF 是模块级，不是应用级）

⑤ 希望 Remote 更新后 Host 自动生效，不重新部署 Host？
  └── ✅ 选 Module Federation（核心优势）

⑥ 团队之间完全信任，且都用同一个前端框架？
  └── ✅ 选 Module Federation（开发体验最好）

⑦ 需要 JS/CSS 完全隔离（类似 iframe 但不要 iframe 的缺点）？
  └── ✅ 选 qiankun
```

---

## 混合使用：qiankun + Module Federation

**它们不是互斥的，可以组合使用。**

```js
// 架构示意：
// 主应用（qiankun）管理路由
// 每个子应用内部使用 Module Federation 共享组件

// 主应用 — registerMicroApps
registerMicroApps([
  {
    name: 'team-a-app',
    entry: '//team-a.example.com',
    activeRule: '/team-a',
  },
  {
    name: 'team-b-app',
    entry: '//team-b.example.com',
    activeRule: '/team-b',
  },
]);

// team-a-app 内部使用 MF 消费公共组件库
// team-a-app/webpack.config.js
plugins: [
  new ModuleFederationPlugin({
    name: 'team_a',
    remotes: {
      shared_design: 'shared_design@//design.example.com/remoteEntry.js',
    },
  }),
],
```

**这样组合的好处：**
- qiankun 负责：路由隔离、应用级隔离、权限控制
- MF 负责：组件/工具库跨团队共享、避免重复打包

---

## 从 qiankun 迁移到 Module Federation 的考虑

| 迁移前提 | 说明 |
|----------|------|
| 团队信任 | MF 没有沙箱，必须确保所有参与方在同一信任边界内 |
| 技术栈 | 必须是 Webpack 5 项目，老项目需要先升级 |
| 组件拆分 | 需要将子应用的组件抽象为可 expose 的模块 |
| 路由重构 | 从 qiankun 的主应用路由 → 各应用自行管理路由 |
| 通信机制 | GlobalState → Shared Module 或自定义事件 |

**迁移建议：** 不要一刀切。先在某个子应用内部试用 MF 共享组件，跑通后再逐步扩大范围。

---

## 总结

| 如果你想... | 选这个 |
|-------------|--------|
| 把不同团队的应用拼成一个系统，安全隔离优先 | **qiankun** |
| 同团队多个项目共享组件，开发体验优先 | **Module Federation** |
| 两者都需要 | **qiankun（路由层） + MF（模块层）** |
| 最简单的微前端，快速上手 | **Module Federation** |
| 最安全的微前端，不怕子应用搞事 | **qiankun** |

> 💡 **一句话收尾**：qiankun 管的是"谁负责哪个页面"，Module Federation 管的是"你的代码我能不能直接 import"。前者是应用级的组织方式，后者是模块级的共享方式。两者解决的是不同层面的问题，不是非此即彼的关系。
