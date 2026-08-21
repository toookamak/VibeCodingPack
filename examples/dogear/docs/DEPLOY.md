# DogEar 部署指南

- **日期**：2026-08-21
- **版本**：v1.0

---

## 1. 部署方案选择

### 1.1 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **Docker 本地部署** | 零成本、数据完全可控、无需公网暴露 | 需要本地服务器长期运行 | 个人自用、隐私优先 |
| **云服务器部署** | 高可用、公网可访问、自动扩容 | 持续成本、数据在第三方 | 需要公网访问的团队 |
| **Serverless 部署** | 按需付费、免运维、自动扩展 | 冷启动延迟、状态管理复杂 | 突发流量、API 网关 |

### 1.2 推荐方案

**本地 Docker + Tailscale 远程访问**

选择理由：
- **零公网暴露**：所有服务运行在本地，无需开放任何端口到公网
- **零成本**：Docker 社区版免费，Tailscale 个人版免费（最多 100 台设备）
- **数据安全**：书签数据始终在本地，同步仅通过 Raindrop API
- **远程访问**：通过 Tailscale 内网穿透，随时随地访问工作台和 API
- **简单维护**：一条命令启动/停止，无需运维复杂基础设施

---

## 2. 环境准备

### 2.1 前置条件

| 工具 | 版本要求 | 安装方式 |
|------|----------|----------|
| **Node.js** | v18+ | [官网下载](https://nodejs.org/) 或使用 nvm |
| **pnpm** | v8+ | `npm install -g pnpm` |
| **Docker Desktop** | v4.0+ | [官网下载](https://www.docker.com/products/docker-desktop/) |
| **Tailscale** | 最新版 | [官网下载](https://tailscale.com/download) |

验证安装：

```bash
node --version      # 应输出 v18.x.x 或更高
pnpm --version      # 应输出 8.x.x 或更高
docker --version    # 应输出 Docker version 24.x.x 或更高
tailscale --version # 应输出 1.x.x 或更高
```

### 2.2 环境变量配置

在项目根目录创建 `.env` 文件：

```bash
# ============================================
# DogEar 环境变量配置
# 复制此文件为 .env 并填入实际值
# ============================================

# --------------------------------------------
# Raindrop.io API 配置
# --------------------------------------------
# 从 https://app.raindrop.io/settings/integrations 获取
RAINDROP_API_TOKEN=your_raindrop_api_token_here

# Raindrop 用户 ID（可选，用于验证配置）
RAINDROP_USER_ID=

# --------------------------------------------
# DogEar API 服务配置
# --------------------------------------------
# API 服务监听端口
API_PORT=3000

# API 认证 Token（用于 Skill API 调用）
# 生成随机 Token: openssl rand -hex 32
API_AUTH_TOKEN=your_api_auth_token_here

# API 服务环境
NODE_ENV=production

# --------------------------------------------
# 数据库配置（本地文件存储）
# --------------------------------------------
# 数据目录（Docker 内路径）
DATA_DIR=/data

# 数据库文件名
DB_FILE=dogear.db

# --------------------------------------------
# AI 分类服务（可选）
# --------------------------------------------
# AI 服务 API Key（如 OpenAI、Anthropic 等）
AI_API_KEY=

# AI 服务模型
AI_MODEL=gpt-4o-mini

# --------------------------------------------
# Tailscale 配置（可选）
# --------------------------------------------
# Tailscale 认证密钥（用于自动认证）
# 从 https://login.tailscale.com/admin/settings/keys 获取
TAILSCALE_AUTHKEY=

# --------------------------------------------
# 工作台 Web 应用配置
# --------------------------------------------
# 工作台监听端口
WEB_PORT=5173

# API 服务地址（工作台访问 API 用）
# Docker 内使用: http://server:3000
# 本地开发使用: http://localhost:3000
VITE_API_BASE_URL=http://server:3000
```

---

## 3. Docker 部署

### 3.1 Dockerfile

#### 3.1.1 工作台（Web 应用）

创建 `apps/web/Dockerfile`：

```dockerfile
# ============================================
# DogEar 工作台 Dockerfile
# 多阶段构建：构建 → 运行
# ============================================

# 阶段 1: 构建
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@8 --activate

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/web/package.json ./apps/web/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源码
COPY packages/shared/ ./packages/shared/
COPY packages/db/ ./packages/db/
COPY apps/web/ ./apps/web/
COPY turbo.json pnpm-workspace.yaml ./

# 构建
RUN pnpm --filter @dogear/web build

# 阶段 2: 运行（Nginx）
FROM nginx:alpine

# 复制 Nginx 配置
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# 复制构建产物
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### 3.1.2 导航页（浏览器插件）

创建 `apps/extension/Dockerfile`：

```dockerfile
# ============================================
# DogEar 导航页 Dockerfile
# 打包为静态文件供浏览器安装
# ============================================

FROM node:18-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/extension/package.json ./apps/extension/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY packages/db/ ./packages/db/
COPY apps/extension/ ./apps/extension/
COPY turbo.json pnpm-workspace.yaml ./

RUN pnpm --filter @dogear/extension build

# 导出构建产物（用于后续打包）
FROM alpine AS export
COPY --from=builder /app/apps/extension/dist /dist
```

#### 3.1.3 API 服务

创建 `apps/server/Dockerfile`：

```dockerfile
# ============================================
# DogEar API 服务 Dockerfile
# 多阶段构建：构建 → 运行
# ============================================

# 阶段 1: 构建
FROM node:18-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@8 --activate

COPY package.json pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY apps/server/package.json ./apps/server/

RUN pnpm install --frozen-lockfile

COPY packages/shared/ ./packages/shared/
COPY packages/db/ ./packages/db/
COPY apps/server/ ./apps/server/
COPY turbo.json pnpm-workspace.yaml ./

RUN pnpm --filter @dogear/server build

# 阶段 2: 运行
FROM node:18-alpine

WORKDIR /app

# 安装 pnpm（生产依赖用）
RUN corepack enable && corepack prepare pnpm@8 --activate

# 复制构建产物和依赖
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/

# 创建数据目录
RUN mkdir -p /data

# 暴露端口
EXPOSE 3000

# 启动服务
CMD ["node", "dist/index.js"]
```

#### 3.1.4 Nginx 配置

创建 `apps/web/nginx.conf`：

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 256;

    # API 代理
    location /api/ {
        proxy_pass http://server:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 自描述端点代理
    location /.well-known/ {
        proxy_pass http://server:3000;
        proxy_set_header Host $host;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA 路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3.2 docker-compose.yml

创建项目根目录 `docker-compose.yml`：

```yaml
# ============================================
# DogEar Docker Compose 配置
# 多服务编排：工作台 + API 服务
# ============================================

version: '3.8'

services:
  # ------------------------------------------
  # 工作台（Web 应用）
  # ------------------------------------------
  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: dogear-web
    ports:
      - "${WEB_PORT:-5173}:80"
    depends_on:
      server:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - dogear-network

  # ------------------------------------------
  # API 服务
  # ------------------------------------------
  server:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    container_name: dogear-server
    ports:
      - "${API_PORT:-3000}:3000"
    volumes:
      # 数据持久化
      - dogear-data:/data
    environment:
      - NODE_ENV=${NODE_ENV:-production}
      - API_PORT=3000
      - API_AUTH_TOKEN=${API_AUTH_TOKEN}
      - RAINDROP_API_TOKEN=${RAINDROP_API_TOKEN}
      - RAINDROP_USER_ID=${RAINDROP_USER_ID:-}
      - DATA_DIR=/data
      - DB_FILE=${DB_FILE:-dogear.db}
      - AI_API_KEY=${AI_API_KEY:-}
      - AI_MODEL=${AI_MODEL:-gpt-4o-mini}
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - dogear-network

# ------------------------------------------
# 数据卷
# ------------------------------------------
volumes:
  dogear-data:
    driver: local

# ------------------------------------------
# 网络
# ------------------------------------------
networks:
  dogear-network:
    driver: bridge
```

### 3.3 构建与启动

#### 3.3.1 首次部署

```bash
# 1. 克隆项目
git clone https://github.com/your-username/dogear.git
cd dogear

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入 Raindrop API Token 等配置

# 3. 生成 API 认证 Token
# Windows PowerShell:
$env:API_AUTH_TOKEN = -join ((1..64) | ForEach-Object { '{0:x}' -f (Get-Random -Max 16) })
# 或使用 OpenSSL:
# openssl rand -hex 32

# 4. 构建并启动所有服务
docker compose up -d --build

# 5. 查看服务状态
docker compose ps

# 6. 查看日志
docker compose logs -f
```

#### 3.3.2 日常运维命令

```bash
# 启动服务
docker compose up -d

# 停止服务
docker compose down

# 重启服务
docker compose restart

# 查看服务状态
docker compose ps

# 查看实时日志
docker compose logs -f

# 查看特定服务日志
docker compose logs -f server
docker compose logs -f web

# 进入容器调试
docker compose exec server sh
docker compose exec web sh

# 更新并重新构建
docker compose up -d --build

# 清理未使用的镜像
docker image prune -f
```

---

## 4. Tailscale 配置

### 4.1 安装与认证

```bash
# 1. 安装 Tailscale（Windows）
# 下载并安装 https://tailscale.com/download/windows

# 2. 启动 Tailscale 并登录
tailscale up

# 3. 查看分配的 IP 地址
tailscale ip -4
# 输出示例: 100.64.0.1

# 4. 查看连接状态
tailscale status
```

### 4.2 服务暴露

在 Docker Compose 中添加 Tailscale 容器：

```yaml
services:
  # ... 其他服务 ...

  # ------------------------------------------
  # Tailscale Sidecar（可选）
  # ------------------------------------------
  tailscale:
    image: tailscale/tailscale:latest
    container_name: dogear-tailscale
    hostname: dogear
    cap_add:
      - NET_ADMIN
      - SYS_MODULE
    volumes:
      - tailscale-state:/var/lib/tailscale
      - /dev/net/tun:/dev/net/tun
    environment:
      - TS_AUTHKEY=${TAILSCALE_AUTHKEY}
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_SERVE_CONFIG=/config/serve.json
    # 挂载配置文件
    # 创建 config/serve.json 文件
    # 内容见下方
    depends_on:
      - web
      - server
    restart: unless-stopped
    networks:
      - dogear-network

volumes:
  tailscale-state:
    driver: local
```

创建 `config/serve.json` 配置文件：

```json
{
  "TCP": {
    "443": {
      "HTTPS": true
    }
  },
  "Web": {
    "dogear.your-tailnet.ts.net": {
      "Handlers": {
        "/": {
          "Proxy": "http://web:80"
        },
        "/api/": {
          "Proxy": "http://server:3000"
        },
        "/.well-known/": {
          "Proxy": "http://server:3000"
        }
      }
    }
  }
}
```

### 4.3 远程访问

配置完成后，通过 Tailscale 网络访问：

```bash
# 访问工作台
# https://dogear.your-tailnet.ts.net

# 访问 API 服务
# https://dogear.your-tailnet.ts.net/api/

# 验证服务可用性
curl https://dogear.your-tailnet.ts.net/.well-known/capabilities
```

**移动端访问**：
- 在手机上安装 Tailscale 应用
- 登录同一账号
- 直接访问 `https://dogear.your-tailnet.ts.net`

---

## 5. Raindrop API 对接

### 5.1 API Token 获取

1. 登录 [Raindrop.io](https://app.raindrop.io)
2. 点击左下角头像 → Settings
3. 选择左侧 Integrations 菜单
4. 在 Raindrop API 部分，点击 "Create app"
5. 填写应用信息：
   - **Name**: DogEar
   - **Description**: 个人书签增强工具
   - **Website**: http://localhost:3000
6. 创建后复制 Access Token

### 5.2 权限配置

Raindrop API Token 默认拥有以下权限：

| 权限 | 说明 | DogEar 用途 |
|------|------|-------------|
| `read` | 读取书签 | 同步拉取、搜索 |
| `write` | 创建/修改书签 | 同步推送、收藏 |
| `delete` | 删除书签 | 同步删除（谨慎） |

**安全建议**：
- 将 Token 存储在 `.env` 文件中，不要提交到 Git
- 定期轮换 Token（建议每 90 天）
- 如果 Token 泄露，立即在 Raindrop 设置中撤销并重新生成

---

## 6. 部署检查清单

### 6.1 环境准备

- [ ] Node.js v18+ 已安装
- [ ] pnpm v8+ 已安装
- [ ] Docker Desktop v4.0+ 已安装并运行
- [ ] Tailscale 已安装并登录

### 6.2 配置文件

- [ ] `.env` 文件已创建并配置
- [ ] `RAINDROP_API_TOKEN` 已填写
- [ ] `API_AUTH_TOKEN` 已生成（64 位随机字符串）
- [ ] `.env` 已添加到 `.gitignore`

### 6.3 Docker 部署

- [ ] 所有 Dockerfile 语法正确
- [ ] `docker-compose.yml` 配置正确
- [ ] `docker compose up -d --build` 执行成功
- [ ] 所有容器状态为 running
- [ ] 健康检查通过

### 6.4 服务验证

- [ ] 工作台可访问（http://localhost:5173）
- [ ] API 服务可访问（http://localhost:3000）
- [ ] 自描述端点正常（http://localhost:3000/.well-known/capabilities）
- [ ] Raindrop 同步功能正常
- [ ] AI 分类功能正常（如已配置）

### 6.5 Tailscale 配置

- [ ] Tailscale 已加入 Tailnet
- [ ] 分配了固定 IP 地址
- [ ] HTTPS 证书配置正确
- [ ] 远程访问测试通过

### 6.6 安全检查

- [ ] 环境变量未提交到 Git
- [ ] API Token 保密存储
- [ ] 防火墙规则正确（仅 Tailscale 端口开放）
- [ ] 日志中无敏感信息

---

## 快速参考卡

### 常用命令

| 命令 | 说明 |
|------|------|
| `docker compose up -d` | 启动所有服务 |
| `docker compose down` | 停止所有服务 |
| `docker compose logs -f` | 查看实时日志 |
| `docker compose ps` | 查看服务状态 |
| `tailscale ip -4` | 查看 Tailscale IP |
| `tailscale status` | 查看连接状态 |

### 服务地址

| 服务 | 本地地址 | Tailscale 地址 |
|------|----------|----------------|
| 工作台 | http://localhost:5173 | https://dogear.your-tailnet.ts.net |
| API 服务 | http://localhost:3000 | https://dogear.your-tailnet.ts.net/api |
| 自描述端点 | http://localhost:3000/.well-known/capabilities | https://dogear.your-tailnet.ts.net/.well-known/capabilities |

### 环境变量速查

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `RAINDROP_API_TOKEN` | ✅ | Raindrop API 访问令牌 |
| `API_AUTH_TOKEN` | ✅ | DogEar API 认证令牌 |
| `API_PORT` | ❌ | API 服务端口（默认 3000） |
| `WEB_PORT` | ❌ | 工作台端口（默认 5173） |
| `AI_API_KEY` | ❌ | AI 分类服务 API Key |
| `TAILSCALE_AUTHKEY` | ❌ | Tailscale 认证密钥 |

### 故障排查

| 问题 | 可能原因 | 解决方案 |
|------|----------|----------|
| 容器启动失败 | 端口被占用 | 修改 `.env` 中的端口配置 |
| API 返回 401 | Token 无效 | 检查 `API_AUTH_TOKEN` 配置 |
| Raindrop 同步失败 | Token 过期 | 在 Raindrop 设置中重新生成 Token |
| Tailscale 无法连接 | 认证失败 | 重新执行 `tailscale up` |
| 数据库错误 | 数据目录权限问题 | 检查 Docker 卷挂载权限 |

---

**文档维护**：本文档随项目更新，请确保与最新版本保持同步。