# 📚 GitHub Pages 完全新手指南

## 🎯 一、GitHub Pages 是什么？

**GitHub Pages** 是 GitHub 提供的**免费静态网站托管服务**，让你可以轻松地将 HTML、CSS、JavaScript 等静态文件托管在 GitHub 上，自动部署成可访问的网站。

### ✨ 核心特点
- ✅ **完全免费** - 无需购买服务器
- ✅ **简单易用** - 通过 Git 上传即可自动部署
- ✅ **自动 HTTPS** - 所有网站自动获得 HTTPS 证书
- ✅ **全球 CDN** - 访问速度快
- ✅ **版本控制** - 与 Git 完美集成

### 📌 适合的网站类型
- 个人博客/技术博客
- 项目文档
- 个人作品集
- 开源项目展示
- 简单的静态网站

---

## 🚀 二、部署到 GitHub Pages 详细步骤

### 步骤 1️⃣：准备工作

#### 1.1 确保你有：
- ✅ 一个 GitHub 账号（没有的话去 [github.com](https://github.com) 免费注册）
- ✅ 本地安装了 Git（没有的话去 [git-scm.com](https://git-scm.com) 下载安装）
- ✅ 你的网站文件（至少要有 `index.html`）

#### 1.2 网站文件结构示例：
```
my-website/
├── index.html          # 首页（必须！）
├── about.html          # 关于页面（可选）
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── script.js       # JavaScript 文件
└── images/
    └── logo.png        # 图片资源
```

---

### 步骤 2️⃣：创建 GitHub 仓库

#### 2.1 登录 GitHub
访问 [github.com](https://github.com) 并登录你的账号

#### 2.2 创建新仓库
1. 点击右上角的 **"+"** → **"New repository"**
2. 填写仓库信息：
   - **Repository name**: 
     - 如果是个人主页：`你的用户名.github.io`（例如：`zhangsan.github.io`）
     - 如果是项目网站：任意名字（例如：`my-project`）
   - **Description**: 可选，填写项目描述
   - **Public**: 选择公开（GitHub Pages 免费版只支持公开仓库）
   - **Initialize this repository**: 不勾选（我们后面手动上传）

3. 点击 **"Create repository"**

---

### 步骤 3️⃣：上传代码到 GitHub

#### 3.1 在本地项目文件夹中初始化 Git

打开终端（Windows 用 Git Bash，Mac/Linux 用 Terminal），进入你的项目文件夹：

```bash
# 进入你的项目文件夹
cd /path/to/your/project

# 初始化 Git 仓库
git init
```

#### 3.2 配置 Git 用户信息（首次使用需要）

```bash
# 设置用户名（换成你的 GitHub 用户名）
git config --global user.name "Your Name"

# 设置邮箱（换成你的 GitHub 邮箱）
git config --global user.email "your.email@example.com"
```

#### 3.3 添加文件到 Git

```bash
# 添加所有文件到暂存区
git add .

# 或者只添加特定文件
git add index.html
git add css/style.css
```

#### 3.4 提交代码

```bash
# 创建提交记录
git commit -m "Initial commit - 首次提交网站文件"
```

#### 3.5 关联远程仓库并推送

```bash
# 关联 GitHub 仓库（把下面的 URL 换成你的仓库地址）
git remote add origin https://github.com/你的用户名/你的仓库名.git

# 推送到 GitHub（main 是默认分支名，旧仓库可能是 master）
git push -u origin main
```

**注意**：如果提示需要输入用户名和密码，输入你的 GitHub 账号信息。建议使用 GitHub Personal Access Token 代替密码。

---

### 步骤 4️⃣：启用 GitHub Pages

#### 4.1 进入仓库设置
1. 在 GitHub 仓库页面，点击 **"Settings"** 标签
2. 在左侧菜单找到并点击 **"Pages"**

#### 4.2 配置 Pages
在 **"Build and deployment"** 部分：

**Source 选项**（选择一种）：

**选项 A：从分支部署（推荐新手）**
```
Source: Deploy from a branch
Branch: main (或 master) / root
```
- 这意味着 GitHub Pages 会直接使用你推送的文件

**选项 B：使用 GitHub Actions（适合需要构建的项目）**
```
Source: GitHub Actions
```
- 适合 Vue、React 等需要构建的前端框架

#### 4.3 保存设置
点击 **"Save"** 按钮

---

### 步骤 5️⃣：等待部署并访问

#### 5.1 等待部署完成
- 提交后 GitHub Pages 需要 1-2 分钟来部署
- 刷新 **Settings → Pages** 页面可以看到部署状态

#### 5.2 访问你的网站
部署成功后，你会看到类似这样的网址：
```
https://你的用户名.github.io
```
或
```
https://你的用户名.github.io/你的仓库名
```

点击链接即可访问你的网站！

---

## 📝 三、配置文件详解（带详细备注）

### 3.1 `.gitignore` 文件（可选但推荐）

在项目根目录创建 `.gitignore` 文件，用于指定哪些文件**不需要**上传到 GitHub：

```gitignore
# .gitignore 文件
# 这个文件告诉 Git 哪些文件或文件夹不需要被追踪和上传

# 忽略 node_modules 文件夹（如果使用 npm）
node_modules/

# 忽略操作系统生成的文件
.DS_Store        # macOS 系统文件
Thumbs.db        # Windows 缩略图缓存

# 忽略编辑器配置文件
.vscode/         # VS Code 配置
.idea/           # IntelliJ IDEA 配置
*.swp            # Vim 临时文件

# 忽略构建输出文件夹（如果使用构建工具）
dist/
build/

# 忽略环境变量文件（包含敏感信息）
.env
.env.local

# 忽略日志文件
*.log
```

**作用**：避免上传不必要的文件，保持仓库整洁。

---

### 3.2 `README.md` 文件（推荐）

在项目根目录创建 `README.md`，这是项目的说明文档：

```markdown
# 我的网站

这是一个使用 GitHub Pages 托管的静态网站。

## 🚀 快速开始

### 本地预览
直接在浏览器中打开 `index.html` 即可预览。

### 部署到 GitHub Pages
1. 确保已安装 Git
2. 初始化仓库：`git init`
3. 添加文件：`git add .`
4. 提交：`git commit -m "Initial commit"`
5. 推送：`git push -u origin main`

## 📁 项目结构

```
my-website/
├── index.html          # 首页
├── about.html          # 关于页面
├── css/
│   └── style.css       # 样式文件
├── js/
│   └── script.js       # JavaScript 文件
└── images/             # 图片资源
```

## 📝 更新日志

### 2026-06-11
- ✨ 首次创建项目
- 🎨 添加基础页面结构
```

**作用**：让其他人（或未来的你）了解项目信息。

---

### 3.3 `index.html` 文件示例（带备注）

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <!-- 设置字符编码为 UTF-8，支持中文 -->
    <meta charset="UTF-8">
    
    <!-- 设置视口，让网页在移动设备上正常显示 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- 网站标题，会显示在浏览器标签页上 -->
    <title>我的 GitHub Pages 网站</title>
    
    <!-- 引入外部 CSS 样式文件 -->
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <!-- 页面主要内容 -->
    <header>
        <h1>👋 欢迎来到我的网站！</h1>
        <nav>
            <a href="index.html">首页</a>
            <a href="about.html">关于</a>
        </nav>
    </header>

    <main>
        <section>
            <h2>关于这个网站</h2>
            <p>这是一个使用 GitHub Pages 部署的静态网站。</p>
            <p>访问地址：<a href="https://你的用户名.github.io">https://你的用户名.github.io</a></p>
        </section>
    </main>

    <footer>
        <p>&copy; 2026 我的网站. 保留所有权利.</p>
    </footer>

    <!-- 引入外部 JavaScript 文件 -->
    <script src="js/script.js"></script>
</body>
</html>
```

---

### 3.4 `css/style.css` 样式文件示例

```css
/* style.css - 网站样式文件 */

/* 全局样式重置 */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* 页面整体样式 */
body {
    font-family: 'Arial', sans-serif;  /* 字体 */
    line-height: 1.6;                  /* 行高 */
    color: #333;                       /* 文字颜色 */
    background-color: #f5f5f5;         /* 背景颜色 */
}

/* 容器样式，限制最大宽度并居中 */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* 头部样式 */
header {
    background-color: #2c3e50;         /* 深蓝色背景 */
    color: white;                      /* 白色文字 */
    padding: 2rem 0;
    text-align: center;
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
}

/* 导航栏样式 */
nav {
    margin-top: 1rem;
}

nav a {
    color: white;
    text-decoration: none;             /* 去掉下划线 */
    margin: 0 15px;
    font-size: 1.1rem;
}

nav a:hover {
    text-decoration: underline;        /* 鼠标悬停时显示下划线 */
}

/* 主要内容区域 */
main {
    padding: 2rem 0;
}

section {
    background-color: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 2rem;
}

section h2 {
    color: #2c3e50;
    margin-bottom: 1rem;
    font-size: 1.8rem;
}

section p {
    margin-bottom: 1rem;
    line-height: 1.8;
}

/* 页脚样式 */
footer {
    background-color: #2c3e50;
    color: white;
    text-align: center;
    padding: 1.5rem 0;
    margin-top: 2rem;
}

/* 响应式设计 - 在小屏幕上调整样式 */
@media (max-width: 768px) {
    header h1 {
        font-size: 1.8rem;
    }
    
    nav {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    
    nav a {
        margin: 5px 0;
    }
}
```

---

### 3.5 `js/script.js` JavaScript 文件示例

```javascript
// script.js - 网站交互脚本

// 等待页面加载完成后再执行代码
document.addEventListener('DOMContentLoaded', function() {
    
    // ========== 控制台输出欢迎信息 ==========
    console.log('👋 欢迎来到我的网站！');
    console.log('网站已成功加载！');
    
    // ========== 添加当前年份到页脚 ==========
    const currentYear = new Date().getFullYear();
    const footer = document.querySelector('footer p');
    
    if (footer) {
        // 将页脚中的年份替换为当前年份
        footer.innerHTML = footer.innerHTML.replace(/2026/, currentYear);
    }
    
    // ========== 导航链接点击效果 ==========
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // 添加点击动画效果
            this.style.transform = 'scale(0.95)';
            
            // 0.2秒后恢复原状
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 200);
        });
    });
    
    // ========== 返回顶部按钮（可选） ==========
    // 创建返回顶部按钮
    const backToTopBtn = document.createElement('button');
    backToTopBtn.textContent = '↑ 回到顶部';
    backToTopBtn.style.position = 'fixed';
    backToTopBtn.style.bottom = '20px';
    backToTopBtn.style.right = '20px';
    backToTopBtn.style.padding = '10px 15px';
    backToTopBtn.style.backgroundColor = '#2c3e50';
    backToTopBtn.style.color = 'white';
    backToTopBtn.style.border = 'none';
    backToTopBtn.style.borderRadius = '5px';
    backToTopBtn.style.cursor = 'pointer';
    backToTopBtn.style.display = 'none'; // 初始隐藏
    
    document.body.appendChild(backToTopBtn);
    
    // 滚动时显示/隐藏按钮
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });
    
    // 点击按钮返回顶部
    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // 平滑滚动
        });
    });
    
    // ========== 打印欢迎信息到控制台 ==========
    console.log('%c🎉 网站加载成功！', 'color: green; font-size: 16px; font-weight: bold;');
    console.log('%c💡 小提示：按 F12 可以打开开发者工具查看控制台信息', 'color: #2c3e50;');
    
});
```

---

## 🔧 四、常见问题和解决方案

### ❓ 问题 1：网站无法访问，显示 404 错误

**解决方案**：
1. 检查仓库名称是否正确（个人主页必须是 `用户名.github.io`）
2. 确认 `index.html` 文件在仓库根目录
3. 等待 2-5 分钟，GitHub Pages 需要时间部署
4. 检查 Settings → Pages 中的部署状态

---

### ❓ 问题 2：样式或图片不显示

**解决方案**：
1. 检查文件路径是否正确（区分大小写！）
2. 确保所有文件都已推送到 GitHub
3. 清除浏览器缓存（Ctrl + Shift + Delete）

---

### ❓ 问题 3：更新代码后网站没有变化

**解决方案**：
1. 确保已执行 `git push` 推送更新
2. 等待 1-2 分钟让 GitHub Pages 重新部署
3. 强制刷新浏览器（Ctrl + F5）

---

### ❓ 问题 4：如何绑定自己的域名？

**步骤**：
1. 在仓库根目录创建 `CNAME` 文件（无扩展名）
2. 文件内容写你的域名（例如：`www.yourdomain.com`）
3. 在域名服务商处添加 CNAME 记录：
   - 主机记录：`www`
   - 记录类型：`CNAME`
   - 记录值：`你的用户名.github.io`
4. 在 GitHub Pages 设置中启用 "Enforce HTTPS"

---

## 📊 五、完整部署流程图

```
┌─────────────────────────────────────────────────┐
│  1. 准备网站文件（至少要有 index.html）         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  2. 创建 GitHub 仓库                             │
│     - 个人主页：用户名.github.io                 │
│     - 项目网站：任意名称                         │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  3. 本地初始化 Git 并上传代码                    │
│     - git init                                   │
│     - git add .                                  │
│     - git commit -m "message"                    │
│     - git push -u origin main                    │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  4. 在 GitHub 启用 Pages                         │
│     Settings → Pages → 选择分支 → Save           │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  5. 等待 1-2 分钟，访问网站                      │
│     https://用户名.github.io                     │
└─────────────────────────────────────────────────┘
```

---

## 🎓 六、下一步学习建议

1. **学习 HTML/CSS/JavaScript** - 掌握前端基础知识
2. **了解 Git 高级用法** - 分支管理、版本回退等
3. **尝试静态站点生成器** - 如 Jekyll、Hugo、Hexo
4. **学习响应式设计** - 让网站在手机上也能良好显示
5. **探索 GitHub Actions** - 自动化部署流程

---

## 💡 小贴士

- ✨ **首次部署可能需要等待 2-5 分钟**
- 🔒 **所有 GitHub Pages 网站都自动支持 HTTPS**
- 📱 **记得测试网站在手机上的显示效果**
- 🎨 **可以从简单的页面开始，逐步完善**
- 📚 **遇到问题可以查看 GitHub 官方文档**

---

祝你部署成功！有任何问题随时提问！🚀