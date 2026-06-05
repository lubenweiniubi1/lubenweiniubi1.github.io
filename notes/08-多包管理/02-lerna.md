[← 返回笔记目录](/) 


# 📚 Lerna 深入教学：从原理到最佳实践

Lerna 是一个专为 JavaScript/TypeScript 多包项目设计的强大工具，它优化了使用 Git 和 npm/yarn 管理 monorepo（单仓库多包）的工作流程。本文将带你从零深入理解 Lerna 的核心原理、工作模式、完整命令体系以及企业级最佳实践。

---

## 🎯 一、Lerna 核心概念

### 1.1 什么是 Monorepo？

**Monorepo**（单仓库多包）是一种代码组织范式，将多个逻辑相关但功能独立的项目统一托管在同一个 Git 仓库中。

**典型结构：**
```
my-monorepo/
├── lerna.json          # Lerna 配置文件
├── package.json        # 根项目配置
├── packages/           # 所有子包目录
│   ├── @myorg/core/   # 包1
│   │   └── package.json
│   ├── @myorg/ui/     # 包2
│   │   └── package.json
│   └── @myorg/cli/    # 包3
│       └── package.json
└── tools/             # 构建工具
```

### 1.2 Lerna 的核心价值

| 问题 | Lerna 的解决方案 |
|------|------------------|
| 多包依赖管理复杂 | 自动解析和链接本地包依赖 |
| 版本发布繁琐 | 一键发布所有包，自动生成 changelog |
| 跨包调试困难 | `lerna bootstrap` 创建符号链接 |
| 重复操作多 | `lerna run` 批量执行脚本 |
| 代码共享困难 | 统一仓库，天然支持代码复用 |

---

## 🔧 二、两种工作模式深度解析

### 2.1 Fixed 模式（固定版本）

**适用场景**：所有包作为一个整体发布，版本号统一（如 Babel、React）

```json
// lerna.json
{
  "version": "2.1.0",  // 所有包共享同一个版本号
  "npmClient": "npm",
  "packages": ["packages/*"]
}
```

**特点：**
- 每次发布，所有包的版本号都会统一更新
- 适合紧密耦合的包集合
- `lerna publish` 会为所有包打相同的 tag

**发布流程：**
```
修改包A → lerna publish → 询问新版本号（如 2.2.0）
→ 所有包的 package.json 版本号都更新为 2.2.0
→ 生成统一的 CHANGELOG.md
→ 发布到 npm
```

### 2.2 Independent 模式（独立版本）

**适用场景**：每个包独立演进，版本号各自管理（如组件库）

```json
// lerna.json
{
  "version": "independent",  // 每个包独立版本
  "npmClient": "npm",
  "packages": ["packages/*"]
}
```

**特点：**
- 每个包可以有自己的版本号
- 只有修改过的包才会被发布
- 更灵活，适合松散耦合的包集合

**发布流程：**
```
修改包A和包B → lerna publish
→ 为包A选择版本（如 1.2.0）
→ 为包B选择版本（如 0.5.0）
→ 包C未修改，跳过发布
→ 生成各自的 CHANGELOG.md
```

---

## 🛠️ 三、核心命令详解

### 3.1 初始化与配置

```bash
# 安装 Lerna
npm install -g lerna

# 初始化项目（Fixed 模式）
lerna init

# 初始化项目（Independent 模式）
lerna init --independent

# 查看配置
lerna ls  # 列出所有包
lerna ls --all  # 包括私有包
```

### 3.2 依赖管理：`lerna bootstrap`

**核心原理：**
```javascript
// bootstrap 的工作流程
1. 解析所有包的 package.json
2. 识别本地包之间的依赖关系
3. 在 node_modules 中创建符号链接（symlink）
4. 安装第三方依赖
```

**常用参数：**
```bash
# 基础用法
lerna bootstrap

# 使用 hoisting（提升依赖到根 node_modules）
lerna bootstrap --hoist

# 只安装生产依赖
lerna bootstrap --production

# 忽略特定包
lerna bootstrap --ignore="@myorg/test-utils"

# 使用特定 npm client
lerna bootstrap --npm-client=yarn
```

**Hoisting 机制：**
```
根目录 node_modules/
├── react@18.2.0      ← 提升的公共依赖
├── lodash@4.17.21    ← 只安装一次
└── @myorg/
    ├── core -> packages/core  ← 符号链接
    └── ui -> packages/ui      ← 符号链接
```

### 3.3 添加依赖：`lerna add`

```bash
# 为所有包添加依赖
lerna add lodash

# 为特定包添加依赖
lerna add react --scope=@myorg/ui

# 为多个包添加依赖
lerna add axios --scope="@myorg/*"

# 添加为开发依赖
lerna add jest --dev

# 添加本地包作为依赖
lerna add @myorg/core --scope=@myorg/ui
```

### 3.4 批量执行：`lerna run` 和 `lerna exec`

```bash
# 在所有包中运行 build 脚本
lerna run build

# 在特定包中运行测试
lerna run test --scope="@myorg/ui"

# 并行执行（默认是串行）
lerna run build --parallel

# 按拓扑顺序执行（依赖包先执行）
lerna run build --sort

# 在每个包目录执行任意命令
lerna exec -- ls -la
lerna exec -- rm -rf dist
```

### 3.5 版本管理：`lerna version`

```bash
# 交互式版本更新
lerna version

# 直接指定版本号
lerna version 2.0.0

# 使用语义化版本
lerna version patch    # 1.0.0 → 1.0.1
lerna version minor    # 1.0.0 → 1.1.0
lerna version major    # 1.0.0 → 2.0.0

# 跳过 git commit
lerna version --no-git-tag-version

# 自定义 commit 信息
lerna version --message "chore(release): publish %s"
```

### 3.6 包发布：`lerna publish`

```bash
# 交互式发布
lerna publish

# 从 Git 标签发布
lerna publish from-git

# 从包版本发布
lerna publish from-package

# 跳过 npm 发布（只更新版本和 git）
lerna publish --no-push

# 自定义 npm registry
lerna publish --registry=https://registry.npmjs.org/

# 使用 OTP（双因素认证）
lerna publish --otp=123456
```

### 3.7 其他实用命令

```bash
# 查看自上次发布以来修改的包
lerna changed

# 显示包之间的依赖图
lerna ls --graph

# 清理所有 node_modules
lerna clean

# 创建新包
lerna create @myorg/new-package

# 链接本地包（不安装依赖）
lerna link
```

---

## ⚙️ 四、lerna.json 配置详解

### 4.1 完整配置示例

```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "npm",
  "useWorkspaces": true,
  "packages": ["packages/*"],
  "command": {
    "publish": {
      "ignoreChanges": ["*.md", "*.test.js", "test/**"],
      "message": "chore(release): publish",
      "registry": "https://registry.npmjs.org/",
      "allowBranch": ["main", "master"],
      "conventionalCommits": true,
      "changelogPreset": "angular"
    },
    "bootstrap": {
      "npmClientArgs": ["--no-package-lock"],
      "hoist": true,
      "mutex": "network:42424"
    },
    "version": {
      "allowBranch": ["main"],
      "message": "chore(release): version %s",
      "conventionalCommits": true
    }
  },
  "ignoreChanges": ["**/*.md", "**/*.test.js"],
  "ignore": ["**/*.md"],
  "registry": "https://registry.npmjs.org/"
}
```

### 4.2 关键配置项说明

| 配置项 | 说明 | 示例 |
|--------|------|------|
| `version` | 版本模式 | `"1.0.0"` 或 `"independent"` |
| `npmClient` | 包管理器 | `"npm"`, `"yarn"`, `"pnpm"` |
| `useWorkspaces` | 使用 npm/yarn workspaces | `true` |
| `packages` | 包目录模式 | `["packages/*", "apps/*"]` |
| `command.publish.ignoreChanges` | 忽略的文件变更 | `["*.md", "test/**"]` |
| `command.publish.conventionalCommits` | 使用约定式提交 | `true` |
| `command.bootstrap.hoist` | 提升公共依赖 | `true` |

---

## 🚀 五、企业级最佳实践

### 5.1 与 Conventional Commits 集成

**安装依赖：**
```bash
npm install --save-dev commitizen cz-conventional-changelog
npm install --save-dev @commitlint/cli @commitlint/config-conventional
npm install --save-dev husky
```

**配置 package.json：**
```json
{
  "scripts": {
    "commit": "git-cz"
  },
  "config": {
    "commitizen": {
      "path": "cz-conventional-changelog"
    }
  },
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }
  }
}
```

**commitlint.config.js：**
```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']
    ]
  }
};
```

**提交示例：**
```bash
git add .
npm run commit
# 交互式选择：feat → ui → 添加新按钮组件 → BREAKING CHANGE: none
```

### 5.2 自动化版本和发布流程

**使用 conventional-changelog：**
```bash
npm install --save-dev conventional-changelog-cli
```

**package.json scripts：**
```json
{
  "scripts": {
    "release": "lerna publish --conventional-commits",
    "version": "lerna version --conventional-commits",
    "changelog": "conventional-changelog -p angular -i CHANGELOG.md -s"
  }
}
```

**CI/CD 集成（GitHub Actions）：**
```yaml
name: Publish
on:
  push:
    branches: [main]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm run test
      - run: npx lerna publish from-git --yes
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 5.3 与 pnpm workspace 集成（推荐组合）

**为什么推荐：**
- pnpm workspace：依赖安装和本地开发（性能更好）
- Lerna：版本管理和发布（专注发布流程）

**配置：**
```json
// package.json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*"
  ]
}
```

```json
// lerna.json
{
  "version": "independent",
  "npmClient": "pnpm",
  "useWorkspaces": true,
  "command": {
    "publish": {
      "conventionalCommits": true
    }
  }
}
```

**工作流程：**
```bash
# 安装依赖（使用 pnpm）
pnpm install

# 开发时运行脚本
pnpm --filter @myorg/ui run dev

# 发布时使用 Lerna
lerna publish --conventional-commits
```

### 5.4 性能优化技巧

```bash
# 1. 使用 --since 选项只处理变更的包
lerna run build --since HEAD~1

# 2. 使用缓存
lerna run build --cache

# 3. 并行执行
lerna run test --parallel

# 4. 按拓扑排序（依赖包先执行）
lerna run build --sort

# 5. 使用 Nx 进行更高级的缓存和分布式执行
npm install -D nx
npx nx run-many --target=build --all
```

---

## 🔍 六、调试与故障排查

### 6.1 常见问题

**问题1：依赖安装失败**
```bash
# 清理缓存
lerna clean
rm -rf node_modules
npm cache clean --force
lerna bootstrap
```

**问题2：符号链接失效**
```bash
# 重新链接
lerna link convert
lerna bootstrap
```

**问题3：发布时权限错误**
```bash
# 检查 npm 登录状态
npm whoami

# 重新登录
npm login

# 使用 OTP（如果启用了 2FA）
lerna publish --otp=123456
```

### 6.2 调试命令

```bash
# 查看详细日志
lerna bootstrap --loglevel=silly

# 检查包依赖关系
lerna ls --graph

# 查看变更的包
lerna changed --loglevel=debug

# 模拟发布（不实际发布）
lerna publish --canary
```

---

## 📊 七、Lerna vs 其他工具对比

### 7.1 Lerna vs Nx

| 特性 | Lerna | Nx |
|------|-------|-----|
| 核心功能 | 包管理和发布 | 智能任务编排 |
| 缓存 | 基础 | 高级（计算哈希） |
| 依赖图 | 简单 | 可视化 |
| 分布式执行 | ❌ | ✅ |
| 插件生态 | 有限 | 丰富 |
| 学习曲线 | 低 | 中 |

**推荐：** 现代项目可以使用 `Lerna + Nx` 组合，Lerna 负责发布，Nx 负责构建和测试。

### 7.2 Lerna vs Turborepo

| 特性 | Lerna | Turborepo |
|------|-------|-----------|
| 速度 | 中等 | 极快（Go 编写） |
| 缓存 | 基础 | 云端缓存 |
| 配置 | JSON | JSON |
| 生态 | 成熟 | 新兴 |
| 发布管理 | ✅ | ❌ |

**推荐：** 如果只需要构建和测试，选择 Turborepo；如果需要完整的发布流程，选择 Lerna。

---

## 🎓 八、实战案例：构建组件库

### 8.1 项目结构

```
my-component-lib/
├── lerna.json
├── package.json
├── tsconfig.json
├── packages/
│   ├── core/           # 核心工具函数
│   ├── button/         # 按钮组件
│   ├── modal/          # 弹窗组件
│   └── theme/          # 主题配置
└── scripts/
    └── build.js        # 构建脚本
```

### 8.2 完整工作流程

```bash
# 1. 初始化项目
mkdir my-component-lib && cd my-component-lib
lerna init --independent

# 2. 创建包
lerna create @myorg/core
lerna create @myorg/button
lerna create @myorg/modal

# 3. 添加依赖
lerna add react --scope="@myorg/*"
lerna add @myorg/core --scope="@myorg/button"

# 4. 开发
lerna run dev --scope=@myorg/button --parallel

# 5. 构建
lerna run build

# 6. 测试
lerna run test

# 7. 发布
lerna publish --conventional-commits
```

---

## 📝 九、总结与建议

### 9.1 使用场景

**适合使用 Lerna 的情况：**
- ✅ 多个 npm 包需要统一管理
- ✅ 包之间有复杂的依赖关系
- ✅ 需要自动化版本管理和发布
- ✅ 团队协作开发多个相关项目

**不适合使用 Lerna 的情况：**
- ❌ 单个独立项目
- ❌ 包之间完全独立，无依赖关系
- ❌ 对构建速度要求极高（考虑 Turborepo）

### 9.2 学习路径建议

1. **入门阶段**：掌握 `lerna init`, `bootstrap`, `add`, `run`
2. **进阶阶段**：理解 `version`, `publish`, 配置文件
3. **高级阶段**：集成 Conventional Commits, CI/CD, 性能优化
4. **专家阶段**：自定义插件, 与其他工具深度集成

### 9.3 推荐资源

- [官方文档](https://lerna.js.org/)
- [Lerna 中文网](https://lerna.nodejs.cn/)
- [GitHub 仓库](https://github.com/lerna/lerna)
- 实战项目：Babel, React, Vue CLI


---

# 和 yarn workspaces 的合作

Lerna 和 Yarn Workspace 是现代 monorepo 项目的黄金组合。它们各有所长，配合使用可以发挥最大效能。本文将深入讲解如何将两者完美结合，以及这种组合的最佳实践。

---

## 🎯 一、为什么需要两者结合？

### 1.1 各自的职责分工

| 工具 | 核心职责 | 优势 |
|------|---------|------|
| **Yarn Workspace** | 依赖安装和本地开发 | ⚡ 极快的安装速度、智能的 hoisting |
| **Lerna** | 版本管理和包发布 | 📦 强大的发布流程、语义化版本 |

**完美分工：**
```
Yarn Workspace → 负责 "安装" 和 "开发"
Lerna → 负责 "发布" 和 "版本管理"
```

### 1.2 单独使用的局限性

**只用 Yarn Workspace：**
- ❌ 缺少自动化版本管理
- ❌ 发布流程需要手动操作
- ❌ 缺少 changelog 生成

**只用 Lerna：**
- ❌ 依赖安装速度较慢
- ❌ hoisting 机制不如 Yarn 智能
- ❌ 缺少 workspace 协议的优雅性

---

## ⚙️ 二、配置详解

### 2.1 基础配置

#### 根目录 package.json
```json
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "lerna run build",
    "test": "lerna run test",
    "lint": "lerna run lint",
    "publish": "lerna publish"
  },
  "devDependencies": {
    "lerna": "^7.0.0",
    "typescript": "^5.0.0"
  }
}
```

#### lerna.json
```json
{
  "$schema": "node_modules/lerna/schemas/lerna-schema.json",
  "version": "independent",
  "npmClient": "yarn",
  "useWorkspaces": true,
  "packages": [
    "packages/*",
    "apps/*"
  ],
  "command": {
    "publish": {
      "conventionalCommits": true,
      "allowBranch": ["main", "master"],
      "message": "chore(release): publish %s",
      "registry": "https://registry.npmjs.org/"
    },
    "version": {
      "allowBranch": ["main"],
      "message": "chore(release): version %s",
      "conventionalCommits": true
    }
  }
}
```

#### .yarnrc.yml（Yarn 2+ 配置）
```yaml
nodeLinker: node-modules

plugins:
  - path: .yarn/plugins/@yarnpkg/plugin-workspace-tools.cjs
    spec: "@yarnpkg/plugin-workspace-tools"

yarnPath: .yarn/releases/yarn-3.6.0.cjs
```

### 2.2 项目结构

```
my-monorepo/
├── .yarn/                          # Yarn 2+ 配置
│   ├── plugins/
│   └── releases/
├── .yarnrc.yml                     # Yarn 配置
├── lerna.json                      # Lerna 配置
├── package.json                    # 根配置
├── yarn.lock                       # 锁文件
├── packages/                       # 库包
│   ├── @myorg/core/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   ├── @myorg/ui/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   └── @myorg/utils/
│       ├── package.json
│       ├── src/
│       └── tsconfig.json
├── apps/                           # 应用
│   ├── web-app/
│   │   ├── package.json
│   │   ├── src/
│   │   └── tsconfig.json
│   └── mobile-app/
│       ├── package.json
│       ├── src/
│       └── tsconfig.json
└── tools/                          # 构建工具
    └── build.js
```

---

## 🚀 三、工作流程详解

### 3.1 初始化项目

```bash
# 1. 创建项目目录
mkdir my-monorepo && cd my-monorepo

# 2. 初始化 Git 仓库
git init

# 3. 初始化 package.json
yarn init -y

# 4. 配置 workspaces
# 在 package.json 中添加 "workspaces": ["packages/*", "apps/*"]

# 5. 安装 Lerna
yarn add -D lerna

# 6. 初始化 Lerna
npx lerna init --independent

# 7. 修改 lerna.json，添加 useWorkspaces: true
```

### 3.2 安装依赖（Yarn Workspace 负责）

```bash
# 安装所有依赖（根 + 所有 workspace）
yarn install

# 为特定包安装依赖
yarn workspace @myorg/ui add react react-dom

# 为所有包安装开发依赖
yarn workspaces foreach -pt add -D typescript @types/node

# 查看依赖树
yarn workspaces list
yarn workspaces info
```

**Yarn Workspace 的智能 hoisting：**
```
根 node_modules/
├── react@18.2.0              ← 提升的公共依赖
├── typescript@5.0.0          ← 开发依赖
├── @myorg/
│   ├── core -> packages/core  ← 符号链接
│   ├── ui -> packages/ui      ← 符号链接
│   └── utils -> packages/utils← 符号链接
└── packages/
    ├── @myorg/core/
    │   └── node_modules/      ← 私有依赖
    ├── @myorg/ui/
    │   └── node_modules/      ← 私有依赖
    └── @myorg/utils/
        └── node_modules/      ← 私有依赖
```

### 3.3 开发和构建（Lerna 负责）

```bash
# 在所有包中运行 build 脚本
lerna run build

# 在特定包中运行开发服务器
lerna run dev --scope=@myorg/web-app

# 并行执行（更快）
lerna run build --parallel

# 按依赖顺序执行（依赖包先构建）
lerna run build --sort

# 只处理变更的包
lerna run build --since HEAD~1
```

### 3.4 版本和发布（Lerna 负责）

```bash
# 交互式版本更新
lerna version

# 使用约定式提交自动确定版本
lerna version --conventional-commits

# 发布到 npm
lerna publish

# 从 Git 标签发布
lerna publish from-git

# 预发布版本
lerna publish --dist-tag beta --preid beta
```

---

## 💡 四、核心优势分析

### 4.1 依赖管理优化

#### Yarn Workspace 的 workspace 协议

```json
{
  "name": "@myorg/ui",
  "dependencies": {
    "@myorg/core": "workspace:*",  // ✨ 关键：使用 workspace 协议
    "react": "^18.2.0"
  }
}
```

**优势：**
- ✅ 自动链接本地包，无需 `npm link`
- ✅ 版本号自动同步
- ✅ 避免循环依赖问题

#### 智能 Hoisting

```bash
# Yarn 会自动将公共依赖提升到根 node_modules
# 减少磁盘占用，加快安装速度

# 对比：单独使用 Lerna
# Lerna bootstrap 需要为每个包创建完整的 node_modules
# 磁盘占用大，安装慢
```

### 4.2 性能对比

| 操作 | Yarn Workspace | Lerna Bootstrap |
|------|---------------|-----------------|
| 首次安装 | ~30秒 | ~90秒 |
| 增量安装 | ~5秒 | ~30秒 |
| 磁盘占用 | 500MB | 1.5GB |
| 依赖解析 | 智能 | 基础 |

### 4.3 开发体验

```bash
# Yarn Workspace 提供的强大命令

# 在所有 workspace 中运行命令
yarn workspaces foreach -pt run build

# 查找包
yarn workspaces list --verbose

# 修复问题
yarn workspaces repair

# 查看依赖关系
yarn workspaces focus @myorg/ui --all
```

---

## 🛠️ 五、实战示例

### 5.1 完整的组件库项目

#### package.json
```json
{
  "name": "awesome-components",
  "private": true,
  "workspaces": [
    "packages/*",
    "examples/*"
  ],
  "scripts": {
    "dev": "lerna run dev --parallel",
    "build": "lerna run build",
    "test": "lerna run test",
    "lint": "lerna run lint",
    "release": "lerna publish --conventional-commits",
    "version": "lerna version --conventional-commits"
  },
  "devDependencies": {
    "lerna": "^7.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^14.0.0"
  },
  "lint-staged": {
    "*.{js,ts,jsx,tsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}
```

#### packages/button/package.json
```json
{
  "name": "@awesome/button",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "dev": "vite",
    "build": "tsup src/index.tsx --format esm,cjs --dts",
    "test": "vitest",
    "lint": "eslint src --ext .ts,.tsx"
  },
  "dependencies": {
    "@awesome/theme": "workspace:*",  // ✨ 使用 workspace 协议
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  },
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  }
}
```

#### packages/theme/package.json
```json
{
  "name": "@awesome/theme",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup src/index.ts --format esm,cjs --dts",
    "test": "vitest"
  },
  "dependencies": {
    "styled-components": "^6.0.0"
  }
}
```

### 5.2 完整工作流程

```bash
# 1. 克隆项目
git clone https://github.com/your-org/awesome-components.git
cd awesome-components

# 2. 安装依赖（Yarn Workspace）
yarn install

# 3. 开发模式（Lerna）
yarn dev

# 4. 修改代码
# 编辑 packages/button/src/Button.tsx

# 5. 构建（Lerna）
yarn build

# 6. 测试（Lerna）
yarn test

# 7. 提交代码（使用约定式提交）
git add .
git commit -m "feat(button): add new variant prop"

# 8. 发布（Lerna）
yarn release
# Lerna 会自动：
# - 分析 commit 确定版本号
# - 更新所有包的版本
# - 生成 changelog
# - 提交和打 tag
# - 发布到 npm
```

---

## 🔧 六、高级配置

### 6.1 Yarn 2+ (Berry) 配置

#### .yarnrc.yml
```yaml
# 使用 node_modules 链接器（兼容性更好）
nodeLinker: node-modules

# 启用 workspace 工具插件
plugins:
  - path: .yarn/plugins/@yarnpkg/plugin-workspace-tools.cjs
    spec: "@yarnpkg/plugin-workspace-tools"
  - path: .yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs
    spec: "@yarnpkg/plugin-interactive-tools"

# 指定 Yarn 版本
yarnPath: .yarn/releases/yarn-3.6.0.cjs

# 配置 npm registry
npmRegistryServer: "https://registry.npmjs.org"

# 启用零安装
enableGlobalCache: false

# 配置约束
constraintsPath: .yarn/constraints.pro
```

#### 安装 Yarn 2+
```bash
# 升级到 Yarn 2+
yarn set version berry

# 安装 workspace 插件
yarn plugin import workspace-tools

# 重新安装
yarn install
```

### 6.2 TypeScript 配置

#### 根 tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "strict": true,
    "moduleResolution": "node",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@awesome/*": ["packages/*"]
    }
  },
  "files": [],
  "references": [
    { "path": "./packages/core" },
    { "path": "./packages/button" },
    { "path": "./packages/theme" }
  ]
}
```

#### packages/button/tsconfig.json
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../theme" }
  ]
}
```

### 6.3 ESLint 配置

#### 根 .eslintrc.js
```javascript
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  env: {
    node: true,
    es6: true
  },
  overrides: [
    {
      files: ['packages/**/*.{ts,tsx}'],
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  ]
};
```

---

## 🐛 七、常见问题和解决方案

### 7.1 依赖冲突

**问题：** 不同包需要不同版本的同一依赖

**解决方案：**
```json
{
  "name": "@myorg/app",
  "dependencies": {
    "react": "workspace:~18.2.0",  // 使用 ~ 而不是 *
    "lodash": "workspace:^4.17.21"
  }
}
```

### 7.2 循环依赖

**问题：** 包 A 依赖包 B，包 B 又依赖包 A

**解决方案：**
```bash
# 使用 yarn 检测循环依赖
yarn workspaces list --verbose

# 重构代码，提取公共逻辑到新包
yarn lerna create @myorg/shared-utils
```

### 7.3 发布失败

**问题：** Lerna 发布时遇到权限错误

**解决方案：**
```bash
# 1. 检查 npm 登录状态
npm whoami

# 2. 重新登录
npm login

# 3. 使用 OTP（如果启用了 2FA）
lerna publish --otp=123456

# 4. 检查包名是否已被占用
npm view @myorg/button versions
```

### 7.4 安装速度慢

**问题：** yarn install 速度很慢

**解决方案：**
```bash
# 1. 清理缓存
yarn cache clean

# 2. 使用离线镜像
yarn config set npmRegistryServer "https://registry.npmmirror.com"

# 3. 启用零安装（Yarn 2+）
yarn set version berry
yarn config set enableGlobalCache true

# 4. 使用约束减少依赖
echo 'Package version constraints' > .yarn/constraints.pro
```

---

## 📊 八、最佳实践总结

### 8.1 推荐的工具链

```
Yarn Workspace (v1 或 v2+)  → 依赖管理
Lerna (v7+)                 → 版本和发布
TypeScript                  → 类型检查
ESLint + Prettier           → 代码质量
Husky + lint-staged         → Git hooks
Conventional Commits        → 语义化提交
```

### 8.2 目录结构最佳实践

```
my-monorepo/
├── .github/                # CI/CD 配置
├── .yarn/                  # Yarn 2+ 配置
├── packages/               # 可发布的库包
│   ├── core/              # 核心工具
│   ├── ui/                # UI 组件
│   └── utils/             # 工具函数
├── apps/                   # 应用项目
│   ├── web/               # Web 应用
│   └── mobile/            # 移动应用
├── tools/                  # 构建工具
├── scripts/                # 脚本
└── docs/                   # 文档
```

### 8.3 工作流程最佳实践

```bash
# 1. 每天开始工作
yarn install                # 确保依赖最新

# 2. 开发新功能
yarn workspaces foreach -pt run dev  # 并行开发

# 3. 提交代码
git add .
git commit -m "feat(ui): add new component"

# 4. 发布前检查
yarn build
yarn test
yarn lint

# 5. 发布
yarn release               # Lerna 自动处理
```

### 8.4 性能优化技巧

```bash
# 1. 使用缓存
yarn workspaces foreach -pt --cache run build

# 2. 只处理变更的包
lerna run build --since HEAD~1

# 3. 并行执行
lerna run test --parallel

# 4. 使用约束减少依赖
yarn constraints fix

# 5. 定期清理
yarn autoclean --init
```

---

## 🎓 九、迁移指南

### 9.1 从纯 Lerna 迁移到 Lerna + Yarn Workspace

```bash
# 1. 备份项目
git checkout -b migrate-to-yarn-workspace

# 2. 安装 Yarn
npm install -g yarn

# 3. 初始化 Yarn
yarn init -y

# 4. 配置 workspaces
# 在 package.json 中添加：
# "workspaces": ["packages/*"]

# 5. 修改 lerna.json
# 添加 "useWorkspaces": true

# 6. 清理并重新安装
rm -rf node_modules
rm package-lock.json
yarn install

# 7. 测试
yarn workspaces list
lerna ls
```

### 9.2 从 Yarn Workspace 迁移到 Lerna + Yarn Workspace

```bash
# 1. 安装 Lerna
yarn add -D lerna

# 2. 初始化 Lerna
npx lerna init --independent

# 3. 修改 lerna.json
# 添加 "useWorkspaces": true

# 4. 配置发布流程
# 添加 conventional-commits 等

# 5. 测试发布流程
lerna version --dry-run
```

---

## 📚 十、总结

### 10.1 核心要点

✅ **Yarn Workspace 负责：**
- 依赖安装和管理
- 本地包链接
- 智能 hoisting
- 快速的增量安装

✅ **Lerna 负责：**
- 版本管理
- 包发布
- changelog 生成
- 批量脚本执行

### 10.2 推荐配置

```json
{
  "workspaces": ["packages/*", "apps/*"],
  "useWorkspaces": true,
  "version": "independent",
  "npmClient": "yarn",
  "conventionalCommits": true
}
```

### 10.3 学习路径

1. **基础** → 掌握 Yarn Workspace 基本命令
2. **进阶** → 理解 Lerna 发布流程
3. **高级** → 集成 Conventional Commits 和 CI/CD
4. **专家** → 自定义插件和性能优化

---



# 提取一个包的案例

> v16 和 v17 子包的公共组件库。

## 提取步骤记录

将 `v16` 和 `v17` 两个子包中相同的 `MainLayout` 和 `Sidebar` 组件提取到本共享包中，步骤如下：

---

### 1. 创建 shared-component 包

```bash
# 在根目录执行
npx lerna create @react-playground/component ./packages
```

后将 `package.json` 中的 `name` 改为 `@react-playground/shared-component`。

### 2. 创建共享组件源码目录

```
packages/shared-component/src/
├── index.jsx       # 统一导出入口
├── MainLayout.jsx  # 共享的布局组件
└── Sidebar.jsx     # 共享的侧边栏组件
```

### 3. 改造 Sidebar 组件

原 `v16` 和 `v17` 的 `Sidebar.jsx` 中都硬编码了 `import routes from '../router'`（各自路由不同），并且标题不同（"Admin Panel" vs "React V17 Playground"）。

改造为通过 **props** 传入：

```jsx
function Sidebar({ routes, title }) { ... }
```

- `routes` — 路由配置数组，由父组件传入
- `title` — 侧边栏标题文字，由父组件传入

### 4. 改造 MainLayout 组件

原 `MainLayout` 直接渲染固定的 `<Sidebar />`，改造为透传 props：

```jsx
function MainLayout({ children, routes, sidebarTitle }) {
  return (
    <div className="app-layout">
      <Sidebar routes={routes} title={sidebarTitle} />
      <main className="main-content">{children}</main>
    </div>
  )
}
```

### 5. 配置 package.json

```json
{
  "main": "src/index.jsx",
  "peerDependencies": {
    "react": "^16.0.0 || ^17.0.0 || ^18.0.0",
    "react-router-dom": "^5.0.0"
  }
}
```

声明 `react` 和 `react-router-dom` 为 `peerDependencies`，确保在宿主包中使用已安装的版本，避免重复打包。
 `peerDependencies` 告诉使用者："我需要这个包，但我不直接安装它，你需要自己安装"

### 6. 更新 v16 子包

**`packages/v16/src/App.jsx`** 修改：
- 导入方式改为 `import { MainLayout } from '@react-playground/shared-component'`
- 传入 props：`<MainLayout routes={routes} sidebarTitle="Admin Panel">`

**删除的文件**（不再需要）：
- `packages/v16/src/components/MainLayout.jsx`
- `packages/v16/src/components/Sidebar.jsx`

### 7. 更新 v17 子包

**`packages/v17/src/App.jsx`** 修改：
- 导入方式改为 `import { MainLayout } from '@react-playground/shared-component'`
- 传入 props：`<MainLayout routes={routes} sidebarTitle="React V17 Playground">`

**删除的文件**（不再需要）：
- `packages/v17/src/components/MainLayout.jsx`
- `packages/v17/src/components/Sidebar.jsx`

### 8. 重建依赖链接

```bash
# 在根目录执行，使 @react-playground/shared-component 软链接生效
yarn install
```

### 9. 验证构建

```bash
# 分别验证两个子包能正常构建
cd packages/v16 && npx vite build
cd packages/v17 && npx vite build
```

---

## 文件结构

```
packages/shared-component/
├── package.json       # 包配置
├── README.md          # 本文档
└── src/
    ├── index.jsx      # 导出入口
    ├── MainLayout.jsx # 布局组件
    └── Sidebar.jsx    # 侧边栏组件
```

## 使用方式

在其他子包中通过包名直接引用：

```jsx
import { MainLayout, Sidebar } from '@react-playground/shared-component'

// MainLayout 需要传入 routes 和 sidebarTitle
<MainLayout routes={routes} sidebarTitle="标题">
  <YourPage />
</MainLayout>

// Sidebar 也可以独立使用
<Sidebar routes={routes} title="标题" />
```



# 软链接是什么

## 🔍 一、软链接到底长什么样？

### 在终端中查看
```bash
# 进入 node_modules 目录
cd node_modules/@myorg

# 查看详细信息（Linux/macOS）
ls -la

# 输出示例：
lrwxr-xr-x  1 user  staff  25 Jun  3 10:00 ui -> ../../packages/ui
lrwxr-xr-x  1 user  staff  28 Jun  3 10:00 shared-components -> ../../packages/shared-components
```

### 关键特征：
- **`l` 开头**：表示这是一个链接文件（link）
- **`->` 符号**：指向实际的目录位置
- **路径是相对路径**：`../../packages/ui` 表示从 `node_modules/@myorg` 向上两级，再进入 `packages/ui`

### 在文件管理器中：
- **Windows**：显示为快捷方式图标，但实际上是符号链接
- **macOS/Linux**：通常显示为普通文件夹，但属性会显示"别名"或"链接"

---

## 🏗️ 二、Yarn Workspaces 改变了什么结构？

### 📁 改变前（没有 Workspaces）

```
项目根目录/
├── packages/
│   ├── app/
│   │   ├── package.json
│   │   └── node_modules/          ← 每个包都有自己的 node_modules
│   └── ui/
│       ├── package.json
│       └── node_modules/          ← 重复的依赖！
└── node_modules/                  ← 根目录也有 node_modules
```

### 📁 改变后（启用 Yarn Workspaces）

```
项目根目录/
├── packages/
│   ├── app/
│   │   └── package.json           ← 只保留源码，没有 node_modules
│   └── ui/
│       └── package.json           ← 只保留源码，没有 node_modules
├── node_modules/
│   ├── react/                     ← 所有公共依赖提升到根目录
│   ├── lodash/
│   └── @myorg/
│       ├── app -> ../../packages/app        ← 软链接！
│       └── ui -> ../../packages/ui          ← 软链接！
└── yarn.lock                      ← 单一的 lock 文件
```

---

## 🔧 三、具体示例演示

### 假设项目结构：
```
my-monorepo/
├── package.json
├── packages/
│   ├── web-app/
│   │   └── package.json         # name: "@myorg/web-app"
│   └── shared-ui/
│       └── package.json         # name: "@myorg/shared-ui"
```

### 根目录 package.json：
```json
{
  "private": true,
  "workspaces": ["packages/*"],
  "dependencies": {
    "react": "^17.0.0"
  }
}
```

### web-app 的 package.json：
```json
{
  "name": "@myorg/web-app",
  "dependencies": {
    "@myorg/shared-ui": "workspace:*",
    "react": "^17.0.0"
  }
}
```

### 执行 `yarn install` 后的 node_modules 结构：

```
my-monorepo/node_modules/
├── react/                       # 实际的 react 包
├── @myorg/
│   ├── web-app -> ../../packages/web-app        # 软链接
│   └── shared-ui -> ../../packages/shared-ui    # 软链接
└── .bin/                        # 可执行文件链接
```

---

## 💡 四、软链接的工作原理

### 🎯 导入时发生了什么？

当你在代码中写：
```js
import { Button } from '@myorg/shared-ui';
```

Node.js 的模块解析过程：
1. 查找 `node_modules/@myorg/shared-ui`
2. 发现这是一个软链接，指向 `../../packages/shared-ui`
3. 实际读取 `packages/shared-ui` 目录中的文件
4. 执行该目录下的 `package.json` 中定义的入口文件

### 🔄 实时同步
- 修改 `packages/shared-ui/src/Button.js`
- 在 `web-app` 中立即生效（无需重新构建或安装）
- 这就是为什么开发 monorepo 如此高效！

---

## 🔍 五、如何验证软链接是否正常工作？

### 方法 1：终端命令
```bash
# 查看软链接目标
readlink node_modules/@myorg/shared-ui
# 输出：../../packages/shared-ui

# 验证是否能正确解析
node -e "console.log(require.resolve('@myorg/shared-ui'))"
# 输出：/path/to/my-monorepo/packages/shared-ui/dist/index.js
```

### 方法 2：编程方式验证
```js
// test-symlink.js
const fs = require('fs');
const path = require('path');

const symlinkPath = 'node_modules/@myorg/shared-ui';
const realPath = fs.realpathSync(symlinkPath);

console.log('软链接路径:', symlinkPath);
console.log('实际路径:', realPath);
console.log('是否相等:', path.resolve('packages/shared-ui') === realPath);
```

### 方法 3：IDE 验证
- 在 VS Code 中按住 `Ctrl` (Windows) 或 `Cmd` (macOS) 点击导入语句
- 应该直接跳转到 `packages/shared-ui` 中的源文件，而不是 `node_modules` 中的副本

---

## ⚠️ 六、常见问题和注意事项

### 1. **Windows 权限问题**
```bash
# 如果遇到权限错误，可能需要管理员权限
# 或者在 Git Bash 中运行（通常权限更宽松）
```

### 2. **编辑器缓存问题**
- 有时编辑器会缓存旧的模块路径
- 解决方案：重启编辑器或清除缓存

### 3. **构建工具配置**
某些构建工具需要特殊配置来处理软链接：

#### Webpack 配置：
```js
// webpack.config.js
module.exports = {
  resolve: {
    symlinks: false, // 保持软链接，不要解析为真实路径
  }
};
```

#### TypeScript 配置：
```json
// tsconfig.json
{
  "compilerOptions": {
    "preserveSymlinks": true
  }
}
```

### 4. **Docker 容器中的问题**
```dockerfile
# Dockerfile
# 软链接在容器中可能失效，需要确保整个 monorepo 被复制
COPY . /app
WORKDIR /app
RUN yarn install --frozen-lockfile
```

---

## 📊 七、软链接 vs 复制文件对比

| 特性 | 软链接 | 复制文件 |
|------|--------|----------|
| **磁盘空间** | 极少（只存储路径） | 重复占用空间 |
| **同步性** | 实时同步 | 需要手动同步 |
| **开发体验** | ✅ 极佳 | ❌ 麻烦 |
| **构建速度** | 快（无需复制） | 慢（需要复制） |
| **跨平台兼容性** | 需要注意 Windows | 无问题 |
| **调试体验** | 直接跳转到源码 | 跳转到副本 |

---

## 🎯 八、总结

**软链接的本质**：它就是一个**指向其他位置的快捷方式**，但在文件系统层面被透明处理。

**Yarn Workspaces 的魔法**：
- 🪄 自动创建软链接
- 📦 提升公共依赖到根目录  
- 🔗 保持本地包之间的实时连接
- ⚡ 让 monorepo 开发变得高效流畅

**记住**：软链接只改变 `node_modules` 的结构，不会修改你的源代码或 `package.json` 文件。它只是让 Node.js 在解析模块时"以为"这些包就在 `node_modules` 中，实际上它们指向你的源码目录！