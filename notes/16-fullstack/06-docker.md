https://www.bilibili.com/video/BV1THKyzBER6/?spm_id_from=333.337.search-card.all.click&vd_source=d66a6fb5cb08fa8db4dd3bf2bd839f71

# Docker 全面指南

Docker 是一个开源的容器化平台，让开发者可以将应用程序及其依赖打包到一个可移植的容器中，然后发布到任何流行的 Linux 或 Windows 机器上。

## 一、Docker 核心概念

### 1. 什么是容器？
- **容器**：轻量级、可执行的独立软件包，包含运行应用程序所需的一切
- **与虚拟机的区别**：
  - 虚拟机：需要完整的操作系统，资源占用大，启动慢
  - 容器：共享宿主机内核，资源占用小，启动快（秒级）

### 2. Docker 核心组件
- **镜像 (Image)**：只读模板，包含创建容器的指令
- **容器 (Container)**：镜像的运行实例
- **仓库 (Repository)**：存储和分发镜像的地方（如 Docker Hub）
- **Dockerfile**：构建镜像的脚本文件
- **Docker Compose**：用于定义和运行多容器应用的工具

## 二、Docker 架构

```
+---------------------+
|     Docker Client   |  (用户交互)
+----------+----------+
           |
           | Docker API
           v
+----------+----------+
|    Docker Daemon    |  (后台服务，管理镜像、容器等)
+----------+----------+
           |
           | 驱动
           v
+----------+----------+
|   Container Runtime |  (如 containerd, runc)
+----------+----------+
           |
           v
+----------+----------+
|     Host OS Kernel  |  (Linux/Windows 内核)
+---------------------+
```

## 三、Docker 安装

### Linux (Ubuntu/Debian)
```bash
# 更新包索引
sudo apt-get update

# 安装依赖
sudo apt-get install apt-transport-https ca-certificates curl software-properties-common

# 添加 Docker 官方 GPG 密钥
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

# 添加 Docker 仓库
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

# 安装 Docker
sudo apt-get update
sudo apt-get install docker-ce

# 验证安装
sudo docker --version
sudo docker run hello-world
```

### macOS/Windows
- 下载 Docker Desktop：https://www.docker.com/products/docker-desktop/
- 安装后会自动配置环境

## 四、基础命令

### 镜像管理
```bash
# 搜索镜像
docker search nginx

# 拉取镜像
docker pull nginx:latest
docker pull ubuntu:20.04

# 列出本地镜像
docker images

# 删除镜像
docker rmi nginx:latest

# 构建镜像
docker build -t myapp:1.0 .
```

### 容器管理
```bash
# 运行容器
docker run -d -p 80:80 --name my-nginx nginx:latest

# 列出运行中的容器
docker ps

# 列出所有容器（包括停止的）
docker ps -a

# 停止容器
docker stop my-nginx

# 启动已停止的容器
docker start my-nginx

# 重启容器
docker restart my-nginx

# 删除容器
docker rm my-nginx

# 进入容器
docker exec -it my-nginx bash

# 查看容器日志
docker logs -f my-nginx
```

### 资源管理
```bash
# 查看容器资源使用
docker stats

# 限制 CPU 和内存
docker run -d --cpus="1.5" --memory="512m" nginx:latest
```

## 五、Dockerfile 详解

### 基本指令
```dockerfile
# 基础镜像
FROM node:18-alpine

# 维护者信息
LABEL maintainer="your.email@example.com"

# 工作目录
WORKDIR /app

# 复制文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 环境变量
ENV NODE_ENV=production

# 启动命令
CMD ["node", "app.js"]

# 替代 CMD，设置容器启动时执行的命令
ENTRYPOINT ["node", "app.js"]
```

### 构建最佳实践
```dockerfile
# 使用 .dockerignore 文件
# 减少构建上下文大小
# 避免包含不必要的文件

# 多阶段构建
# 减少最终镜像大小
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm install --only=production
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

## 六、Docker Compose

### docker-compose.yml 示例
```yaml
version: '3.8'

services:
  web:
    build: ./web
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      - db
    volumes:
      - ./web:/app
      - /app/node_modules

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 常用命令
```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f web

# 重新构建并启动
docker-compose up -d --build

# 执行命令
docker-compose exec web bash
```

## 七、实际应用场景

### 1. 开发环境一致性
```bash
# 项目根目录结构
my-project/
├── docker-compose.yml
├── web/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── api/
│   ├── Dockerfile
│   └── app.py
└── database/
    └── init.sql
```

### 2. 微服务架构
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports: ["80:80"]
    depends_on: [api-gateway]

  api-gateway:
    build: ./api-gateway
    ports: ["8000:8000"]
    depends_on: [user-service, product-service]

  user-service:
    build: ./services/user
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis

  product-service:
    build: ./services/product
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=mysecretpassword
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

### 3. CI/CD 集成
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Login to Docker Hub
      uses: docker/login-action@v2
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}
    
    - name: Build and push
      uses: docker/build-push-action@v4
      with:
        context: .
        push: true
        tags: myapp:${{ github.sha }}
```

## 八、最佳实践

### 1. 镜像优化
```dockerfile
# ❌ 不好的做法
FROM ubuntu:20.04
RUN apt-get update && apt-get install -y nodejs npm
COPY . .
RUN npm install
RUN npm run build

# ✅ 好的做法
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["node", "dist/app.js"]
```

### 2. 安全最佳实践
```bash
# 使用非 root 用户
docker run -u 1000:1000 nginx

# 限制容器权限
docker run --read-only --tmpfs /tmp nginx

# 扫描镜像漏洞
docker scan nginx
```

### 3. 网络配置
```bash
# 创建自定义网络
docker network create my-network

# 连接到网络
docker run -d --network my-network --name web nginx

# 容器间通信
docker run -d --network my-network my-app --db-host=db
```

## 九、常见问题解决

### 1. 磁盘空间清理
```bash
# 清理停止的容器、悬挂镜像、构建缓存
docker system prune -a

# 清理卷
docker volume prune

# 查看磁盘使用
docker system df
```

### 2. 性能监控
```bash
# 实时监控
docker stats

# 详细资源使用
docker inspect my-container

# 日志分析
docker logs --tail 100 my-container
```

### 3. 调试技巧
```bash
# 查看容器内部进程
docker top my-container

# 检查网络连接
docker network inspect my-network

# 进入容器调试
docker exec -it my-container sh

# 查看文件系统
docker export my-container -o container.tar
```

## 十、学习资源

### 官方文档
- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)

### 实用工具
- **Portainer**：Docker 管理界面
- **LazyDocker**：终端界面管理工具
- **Dive**：镜像分析工具
- **ctop**：容器监控工具

### 进阶学习
- Docker Swarm 集群管理
- Kubernetes 容器编排
- Docker 安全加固
- 多架构构建（ARM/AMD64）

## 总结

Docker 彻底改变了软件开发和部署方式：
- **开发环境一致性**：消除"在我机器上能运行"的问题
- **快速部署**：秒级启动应用
- **资源隔离**：安全地运行多个应用
- **持续集成/部署**：简化 CI/CD 流程
- **微服务架构**：理想的容器化支持



# WLS 的角色定位

## 🏗️ Docker 的两种运行模式

### **模式 1：Docker Desktop（本地虚拟机）** ⭐ 你当前使用的方式

**为什么在本地虚拟机中？**

```
┌─────────────────────────────────────┐
│   Windows/macOS Host                │
│   - 不支持 Linux 容器原生运行       │
│   - 需要 Linux 内核环境             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   轻量级 Linux 虚拟机 (WSL2/HyperKit)│
│   - 运行 Linux 内核                 │
│   - Docker Daemon (服务端)          │
│   - 容器运行环境                    │
└─────────────────────────────────────┘
```

**原因**：
1. **Windows/macOS 不是 Linux**：Docker 原生依赖 Linux 内核特性（cgroups、namespaces）
2. **需要 Linux 环境**：容器必须在 Linux 内核上运行
3. **本地开发便利**：不需要远程服务器，离线也能用

---

### **模式 2：远程 Docker 服务器** 🌐 你理解的"远端"

```
┌─────────────────────┐         网络         ┌─────────────────────┐
│   你的电脑          │ ────────────────→   │   远程服务器        │
│   Docker CLI        │                     │   Docker Daemon     │
│   (客户端)          │                     │   (服务端)          │
└─────────────────────┘                     └─────────────────────┘
```

**使用场景**：
- 生产环境部署
- 团队共享 Docker 服务器
- 云服务器上的 Docker

---

## 🔄 两种模式对比

| 特性 | Docker Desktop (本地) | 远程 Docker 服务器 |
|-----|---------------------|-------------------|
| **位置** | 本地虚拟机 (WSL2) | 远程物理机/云服务器 |
| **网络** | 本地命名管道 | 网络连接 (TCP/SSH) |
| **用途** | 本地开发测试 | 生产环境/团队协作 |
| **速度** | ⚡ 极快（本地） | 🐢 受网络影响 |
| **离线** | ✅ 可以 | ❌ 需要网络 |
| **配置** | 自动配置 | 需手动配置 |

---

## 🎯 为什么 Docker Desktop 选择本地虚拟机？

### **技术原因**

1. **Linux 内核依赖**
   ```bash
   # Docker 需要这些 Linux 特性：
   - cgroups (资源限制)
   - namespaces (进程隔离)
   - overlayfs (联合文件系统)
   - iptables (网络隔离)
   ```
   Windows/macOS 内核不提供这些！

2. **WSL2 的优势**
   - 轻量级虚拟化（比传统 VM 快）
   - 与 Windows 深度集成
   - 资源占用少
   - 启动速度快

### **用户体验原因**

1. **开箱即用**：安装 Docker Desktop 后，所有配置自动完成
2. **无需服务器**：个人开发者不需要购买/维护服务器
3. **离线开发**：飞机上、地铁里也能用
4. **快速迭代**：本地构建、测试、调试，速度极快

---

## 🌐 你也可以连接到远端！

虽然 Docker Desktop 默认使用本地虚拟机，但**完全可以配置连接到远程 Docker 服务器**：

### **方法 1：使用 DOCKER_HOST 环境变量**

```powershell
# PowerShell 中设置
$env:DOCKER_HOST="tcp://远程服务器IP:2375"

# 然后运行 docker 命令，就会连接到远程服务器
docker ps
```

### **方法 2：使用 SSH 连接**

```powershell
# 通过 SSH 连接到远程 Docker
docker -H ssh://user@remote-server ps
```

### **方法 3：修改配置文件**

```json
// ~/.docker/config.json
{
  "hosts": ["tcp://远程服务器IP:2375"]
}
```

---

## 📊 实际使用场景

### **场景 1：本地开发**（最常见）

```powershell
# 在本地 WSL2 虚拟机中运行
docker pull nginx
docker run -p 8080:80 nginx
```

**流程**：
```
PowerShell → docker.exe → WSL2 虚拟机 → 运行容器
```

### **场景 2：连接到公司服务器**

```powershell
# 配置连接到公司 Docker 服务器
$env:DOCKER_HOST="tcp://192.168.1.100:2375"
docker ps  # 列出远程服务器上的容器
```

**流程**：
```
PowerShell → docker.exe → 网络 → 远程服务器 → 运行容器
```

### **场景 3：云服务器部署**

```powershell
# 连接到阿里云 ECS 上的 Docker
$env:DOCKER_HOST="tcp://47.93.xxx.xxx:2375"
docker deploy myapp  # 部署到云端
```

---

## 🔍 如何判断当前连接到哪里？

```powershell
# 查看 Docker 信息
docker info

# 关键字段：
# - Server Version: Docker 服务端版本
# - Operating System: 服务端操作系统
# - Kernel Version: 内核版本（Linux 才能运行容器）
```

**本地 Docker Desktop 的输出**：
```
Operating System: Docker Desktop
Kernel Version: 5.15.133.1-microsoft-standard-WSL2
OSType: linux
Architecture: x86_64
```

**远程服务器的输出**：
```
Operating System: Ubuntu 22.04 LTS
Kernel Version: 5.15.0-91-generic
OSType: linux
Architecture: x86_64
```

---

## 💡 总结

| 问题 | 答案 |
|-----|------|
| **Docker 服务端只能在虚拟机里吗？** | ❌ 不是！可以在任何 Linux 服务器上 |
| **为什么 Docker Desktop 用虚拟机？** | ⚙️ Windows/macOS 需要 Linux 内核环境 |
| **可以连接到远端吗？** | ✅ 可以！通过 DOCKER_HOST 配置 |
| **默认为什么是本地？** | 🚀 本地开发更方便、更快、可离线 |

**关键理解**：
- **Docker Desktop** = 本地开发工具（包含虚拟机）
- **Docker 本身** = 客户端-服务器架构（可以连接任何地方）

你当前使用的是 **Docker Desktop 的本地模式**，这是为了方便本地开发而设计的！如果需要连接到远程服务器，只需简单配置即可。