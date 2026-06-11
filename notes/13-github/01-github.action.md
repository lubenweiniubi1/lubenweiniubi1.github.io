# 🚀 GitHub Actions 深入教学：从入门到精通

基于最新资料（2024-2026），为您呈现完整的 GitHub Actions 学习路径。

---

## 📚 一、核心概念体系

### 1.1 基础架构
```
仓库 (Repository)
└── 工作流 (Workflow) - .github/workflows/*.yml
    └── 作业 (Job)
        └── 步骤 (Step)
            └── 动作 (Action)
```

### 1.2 核心组件详解

| 组件 | 说明 | 示例 |
|------|------|------|
| **Workflow** | 完整的自动化流程，由 YAML 文件定义 | `.github/workflows/ci.yml` |
| **Event** | 触发工作流的事件 | `push`, `pull_request`, `schedule` |
| **Job** | 工作流中的任务单元 | `build`, `test`, `deploy` |
| **Step** | 作业中的单个任务 | `checkout`, `setup-node` |
| **Action** | 可重用的代码单元 | `actions/checkout@v4` |
| **Runner** | 执行工作流的服务器 | `ubuntu-latest`, `self-hosted` |

---

## 💻 二、基础实战：创建第一个工作流

### 2.1 目录结构
```bash
your-repo/
└── .github/
    └── workflows/
        ├── ci.yml          # 持续集成
        ├── deploy.yml      # 部署流程
        └── release.yml     # 版本发布
```

### 2.2 简单 CI 工作流示例
```yaml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
```

---

## 🎯 三、高级功能详解

### 3.1 矩阵构建（Matrix Strategy）
```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20, 22]
        
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

### 3.2 环境与密钥管理
```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    
    steps:
      - name: Deploy to server
        env:
          API_KEY: ${{ secrets.PRODUCTION_API_KEY }}
          DATABASE_URL: ${{ vars.DATABASE_URL }}
        run: |
          echo "Deploying with API key: $API_KEY"
          ./deploy.sh
```

### 3.3 作业依赖与并发控制
```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
    outputs:
      build-hash: ${{ steps.hash.outputs.value }}
      
  test:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: npm test
      
  deploy:
    needs: [build, test]
    runs-on: ubuntu-latest
    concurrency: production-deploy
    steps:
      - run: ./deploy.sh
```

---

## 🔧 四、自定义 Action 开发

### 4.1 JavaScript Action
```javascript
// action.yml
name: 'My Custom Action'
description: 'A custom GitHub Action'
inputs:
  greeting:
    description: 'Greeting message'
    required: true
outputs:
  time:
    description: 'Current time'
runs:
  using: 'node20'
  main: 'dist/index.js'
```

```javascript
// index.js
const core = require('@actions/core');
const github = require('@actions/github');

try {
  const greeting = core.getInput('greeting');
  const time = new Date().toISOString();
  
  console.log(`${greeting}! Current time: ${time}`);
  core.setOutput('time', time);
  
  core.info('Action completed successfully');
} catch (error) {
  core.setFailed(error.message);
}
```

### 4.2 Docker Action
```dockerfile
# Dockerfile
FROM alpine:latest
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

```bash
#!/bin/bash
# entrypoint.sh
echo "Hello from Docker Action!"
echo "Input: $INPUT_MESSAGE"
```

---

## 📊 五、实用场景案例

### 5.1 自动发布 Release
```yaml
name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Get version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT
        
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ steps.version.outputs.VERSION }}
          name: Release ${{ steps.version.outputs.VERSION }}
          generate_release_notes: true
```

### 5.2 定时任务（Cron）
```yaml
name: Daily Backup

on:
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点执行

jobs:
  backup:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - name: Run backup script
        run: ./backup.sh
      - name: Upload backup
        uses: actions/upload-artifact@v4
        with:
          name: daily-backup
          path: backup/
```

### 5.3 PR 自动化
```yaml
name: PR Automation

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-label:
    runs-on: ubuntu-latest
    
    steps:
      - name: Add label
        uses: actions-ecosystem/action-add-labels@v1
        with:
          labels: |
            pending-review
            needs-testing
```

---

## 🎨 六、最佳实践

### 6.1 工作流优化
```yaml
# 使用缓存加速依赖安装
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### 6.2 错误处理
```yaml
- name: Run tests
  id: tests
  continue-on-error: true
  run: npm test
  
- name: Notify failure
  if: failure() && steps.tests.outcome == 'failure'
  uses: actions/github-script@v7
  with:
    script: |
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '⚠️ Tests failed! Please check the logs.'
      })
```

### 6.3 安全建议
- ✅ 使用最新版本的 Actions
- ✅ 定期轮换 secrets
- ✅ 限制环境访问权限
- ✅ 使用 `actions/checkout@v4` 而非旧版本
- ✅ 启用依赖审查

---

## 📈 七、资源推荐

### 官方文档
- [GitHub Actions 官方文档](https://docs.github.com/zh/actions)
- [Actions 市场](https://github.com/marketplace?type=actions)

### 学习资源
- **入门**: GitHub Actions 快速入门指南
- **进阶**: 自定义 Action 开发教程
- **实战**: 开源项目工作流分析

### 常用 Actions
- `actions/checkout@v4` - 代码检出
- `actions/setup-node@v4` - Node.js 环境
- `actions/cache@v3` - 依赖缓存
- `softprops/action-gh-release@v1` - 自动发布

---

## 💡 八、常见问题解答

**Q: 私有仓库的使用限制？**
- 免费额度：每月 2,000 分钟
- 超出后按分钟计费

**Q: 如何调试工作流？**
- 使用 `actions/github-script` 输出变量
- 查看 Actions 日志
- 本地测试：`act` 工具

**Q: 自托管 Runner 适用场景？**
- 需要特定硬件环境
- 访问内部网络资源
- 合规性要求

---

通过本教程，您应该能够：
✅ 理解 GitHub Actions 核心概念  
✅ 创建基础到高级的工作流  
✅ 开发自定义 Action  
✅ 应用于实际项目场景  

**下一步建议**：在您的项目中实践一个简单的工作流，逐步扩展功能！🚀