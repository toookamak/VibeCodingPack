# 部署与环境管理

- **日期**：2026-08-21
- **版本**：v1.0
- **适用范围**：适用于个人开发者与 AI 协作的中小型 Web 应用项目，涵盖从本地开发到生产部署的全流程。本文使用通用场景示例，不绑定特定项目。

---

## 第一篇：部署方案

部署是将开发完成的应用交付给用户访问的过程。选对部署方案直接影响运维成本、扩展能力和故障恢复速度。

### 第一章：方案选型

#### 1.1 三种部署方式对比

| 维度 | 本地 Docker | 云服务器 | Serverless |
|------|------------|----------|------------|
| 部署复杂度 | 中等（需编写 Dockerfile） | 较高（需配置服务器环境） | 低（平台托管） |
| 月度成本 | 硬件电费，无额外费用 | 50–500 元（根据配置） | 按调用量计费，低流量近乎免费 |
| 扩展能力 | 手动扩容，受硬件限制 | 可手动或自动扩容 | 自动弹性扩缩容 |
| 运维负担 | 需要自行维护服务器系统 | 需要自行维护应用环境和依赖 | 几乎为零 |
| 冷启动 | 无 | 无 | 有（通常 100ms–2s） |
| 适用场景 | 个人项目、内网服务 | 需要长期运行、稳定访问的项目 | 流量波动大、事件驱动的项目 |
| 数据持久化 | 本地磁盘/挂载卷 | 云磁盘/数据库服务 | 需搭配外部存储服务 |

#### 1.2 选择依据

选择部署方案时，从三个维度评估：

**1. 项目规模**

| 项目特征 | 推荐方案 |
|----------|----------|
| 个人博客、原型验证、内部工具 | Docker 本地部署 或 Serverless |
| 需要对外提供稳定服务的中小型应用 | 云服务器 |
| 流量波动大、有明显波峰波谷 | Serverless |
| 需要 WebSocket、长连接等持久化服务 | 云服务器 |

**2. 预算**

- 预算为零 → Docker 本地部署（用旧电脑或树莓派）
- 月预算 50 元以内 → Serverless（低流量场景）或最低配云服务器
- 月预算 100 元以上 → 云服务器（可选 2C4G 配置）

**3. 技术能力**

- 熟悉 Linux 运维 → 云服务器完全可控
- 不想管理服务器 → Serverless 或托管平台（如 Vercel、Netlify）
- 只需本地运行 → Docker 最为便捷

#### 1.3 部署方案对比表

| 方案 | 初始成本 | 月度成本 | 部署耗时 | 扩容难度 | 适合阶段 |
|------|---------|---------|---------|---------|---------|
| Docker 本地部署 | 0 | 0（电费） | 1–2 小时 | 高（受硬件限制） | 开发阶段、原型验证 |
| 云服务器 | 0–50 元 | 50–500 元 | 2–4 小时 | 中等（手动/自动扩容） | 成长期、稳定运营 |
| Serverless | 0 | 0–100 元 | 30 分钟–1 小时 | 低（自动扩容） | 验证期、流量不确定 |

> **实践建议**：大多数项目可以这样演进——开发阶段用 Docker 本地跑通，上线初期用 Serverless 验证市场，确认用户量稳定后迁移到云服务器获得更好的控制力。

---

### 第二章：Docker 部署

#### 2.1 Dockerfile 编写规范

以下是一个前端应用（以 Vite + React 为例）的生产级 Dockerfile 模板：

```dockerfile
# 第一阶段：构建
FROM node:20-alpine AS builder
WORKDIR /app

# 先复制依赖文件，利用 Docker 缓存层
COPY package.json package-lock.json ./
RUN npm ci

# 再复制源码并构建
COPY . .
RUN npm run build

# 第二阶段：运行（多阶段构建，最终镜像不含源码和 node_modules）
FROM nginx:alpine

# 复制构建产物到 nginx 的静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**关键原则**：

- **多阶段构建**：构建阶段和运行阶段分开，最终镜像不包含源码和构建工具，体积通常从 1GB+ 压缩到 50MB 以内
- **依赖缓存**：先复制 `package.json` 和 lock 文件，安装依赖后再复制源码。源码变更不会重新安装依赖，构建速度更快
- **基础镜像选择**：优先使用 `alpine` 变体，体积小、安全性好

#### 2.2 Docker Compose 配置

当应用需要多个服务协作时（如前端 + 数据库 + 缓存），使用 Docker Compose 编排：

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 前端应用
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
      - API_BASE_URL=http://api:3000
    depends_on:
      - api
    restart: unless-stopped

  # API 服务（如果有后端）
  api:
    build: ./api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/mydb
      - REDIS_URL=redis://cache:6379
    depends_on:
      - db
      - cache
    restart: unless-stopped

  # 数据库
  db:
    image: postgres:16-alpine
    volumes:
      - db_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=mydb
    ports:
      - "5432:5432"
    restart: unless-stopped

  # 缓存
  cache:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  db_data:
  redis_data:
```

**配置要点**：

- **数据持久化**：数据库和缓存必须使用 `volumes` 挂载，否则容器重建后数据丢失
- **服务依赖**：使用 `depends_on` 声明启动顺序（注意：它只保证启动顺序，不保证服务就绪，应用层需要做好重试）
- **重启策略**：`unless-stopped` 表示除了手动停止外，容器崩溃或服务器重启后自动恢复

#### 2.3 环境变量管理

`.env` 文件的组织方式：

```
# 项目根目录结构
project/
├── .env                 # 默认配置（可提交到版本控制，不含敏感信息）
├── .env.development     # 开发环境专用
├── .env.production      # 生产环境专用（不提交到版本控制）
├── .env.example         # 环境变量模板（提交到版本控制，供团队参考）
└── .dockerignore        # 排除 .env 文件，避免镜像泄露敏感信息
```

**`.env.example` 示例**：

```bash
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# API 配置
API_BASE_URL=http://localhost:3000
API_TIMEOUT=5000

# 认证
JWT_SECRET=your-secret-here
```

**`.dockerignore` 必须包含**：

```
.env
.env.*
node_modules
.git
dist
```

**安全原则**：

- 敏感信息（密码、密钥、Token）永远不写入代码和版本控制
- `.env.production` 不提交到 Git，通过服务器环境变量或密钥管理服务注入
- `.env.example` 提交到 Git，作为环境变量的文档和模板

---

## 第二篇：CI/CD

CI/CD（持续集成/持续部署）的核心目标是让"代码从提交到上线"的流程自动化、可重复、可追溯。

### 第三章：简化持续集成

#### 3.1 Git Hook

Git Hook 在特定 Git 操作前后自动执行脚本。个人项目中最有价值的两个 Hook：

**pre-commit**：提交前自动运行代码检查，防止不规范的代码进入版本控制。

```bash
# 安装 Husky（Git Hook 管理工具）
npm install -D husky

# 初始化
npx husky init
```

在 `.husky/pre-commit` 中配置：

```bash
#!/bin/sh
npx lint-staged
```

在 `package.json` 中配置 `lint-staged`（只检查暂存区的文件）：

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

**pre-push**：推送前运行类型检查和测试，确保推送到远程的代码是可用的。

在 `.husky/pre-push` 中配置：

```bash
#!/bin/sh
npm run type-check
npm run test
```

#### 3.2 构建脚本

`package.json` 中 `scripts` 的组织原则：从简单到复杂，每一步都是可独立执行的原子操作。

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",

    "lint": "eslint src/ --ext .ts,.tsx",
    "lint:fix": "eslint src/ --ext .ts,.tsx --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,json,css}\"",
    "type-check": "tsc --noEmit",

    "test": "vitest run",
    "test:watch": "vitest",

    "check": "npm run lint && npm run type-check && npm run test",
    "deploy": "npm run check && npm run build"
  }
}
```

**命名约定**：

- `dev` / `build` / `preview`：基础操作
- `lint` / `lint:fix` / `format`：代码风格
- `type-check`：类型检查
- `test` / `test:watch`：测试
- `check`：一键运行所有检查（lint + type-check + test）
- `deploy`：检查通过后再构建

#### 3.3 自动化检查

三个检查步骤的定位和关系：

| 检查项 | 工具 | 作用 | 运行时机 |
|--------|------|------|----------|
| `lint` | ESLint | 检查代码风格和常见错误 | 每次提交前 |
| `type-check` | TypeScript (`tsc --noEmit`) | 检查类型错误 | 推送前、CI 中 |
| `test` | Vitest / Jest | 检查功能逻辑正确性 | 推送前、CI 中 |

**建议的执行顺序**：lint → type-check → test

原因：lint 最快（通常 5 秒内），type-check 其次（通常 10–30 秒），test 最慢。如果 lint 就失败了，后面的步骤就不需要运行，节省时间。

#### 3.4 CI 流程图

```
代码提交
    │
    ▼
┌─────────────────┐
│  pre-commit Hook │ ← 本地自动运行
│  lint + format   │
└────────┬────────┘
         │ 通过
         ▼
┌─────────────────┐
│  pre-push Hook   │ ← 推送前自动运行
│  type-check      │
│  test            │
└────────┬────────┘
         │ 通过
         ▼
┌─────────────────┐
│  push 到远程仓库  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  CI 服务器运行    │ ← GitHub Actions / GitLab CI
│  lint            │
│  type-check      │
│  test            │
│  build           │
└────────┬────────┘
         │ 全部通过
         ▼
┌─────────────────┐
│  部署到目标环境   │ ← 可选：自动或手动触发
└─────────────────┘
```

**简化方案**：如果不想配置远程 CI，本地的 Git Hook（pre-commit + pre-push）已经能覆盖大部分场景。核心原则是——**在代码离开你的机器之前，尽可能多地发现问题**。

---

## 第三篇：环境管理

环境管理的核心问题：同一套代码在开发、测试、生产环境中的行为应该一致，但配置不同。

### 第四章：配置分层

#### 4.1 环境差异

| 配置项 | 开发环境 | 测试环境 | 生产环境 |
|--------|---------|---------|---------|
| API 地址 | `http://localhost:3000` | `https://staging-api.example.com` | `https://api.example.com` |
| 数据库 | SQLite 本地文件 | 测试专用 PostgreSQL | 生产 PostgreSQL |
| 日志级别 | `debug`（详细输出） | `info`（正常输出） | `warn`（只记录警告和错误） |
| 缓存 | 关闭或内存缓存 | Redis 测试实例 | Redis 生产实例 |
| 错误上报 | 关闭 | 开启（测试 Sentry 项目） | 开启（生产 Sentry 项目） |
| 性能监控 | 关闭 | 关闭 | 开启 |
| HTTPS | 不需要 | 需要 | 必须 |

#### 4.2 优先级链

配置的读取遵循优先级规则：**环境变量 > 配置文件 > 代码默认值**。

```
环境变量（最高优先级）
    │  覆盖
    ▼
配置文件（.env / config.json）
    │  覆盖
    ▼
代码中的默认值（最低优先级）
```

**实际应用**：

```ts
// 代码中的默认值（兜底）
const config = {
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableSentry: process.env.ENABLE_SENTRY === 'true' || false,
  port: Number(process.env.PORT) || 3000,
}
```

**为什么要分层**：

- **默认值**保证代码在没有外部配置时也能运行（降低开发环境的配置门槛）
- **配置文件**覆盖默认值，用于同一环境下的个性化调整
- **环境变量**覆盖配置文件，用于不同环境的差异化配置，且不会泄露到代码中

#### 4.3 Feature Flag

Feature Flag（功能开关）允许在不重新部署的情况下控制功能的启用和关闭。

**适用场景**：

- 新功能灰度发布：先给 10% 的用户开放，观察没问题再全量发布
- 紧急回滚：发现新功能有严重 bug，关闭开关即可回滚，不需要重新部署
- A/B 测试：同时运行两个版本，按用户比例分配

**实现方式**：

```ts
// 简单实现：配置文件驱动
const featureFlags = {
  NEW_CHECKOUT_FLOW: process.env.FF_NEW_CHECKOUT === 'true',
  DARK_MODE: process.env.FF_DARK_MODE === 'true',
  BETA_SEARCH: process.env.FF_BETA_SEARCH === 'true',
}

// 使用方式
if (featureFlags.NEW_CHECKOUT_FLOW) {
  // 新版结账流程
} else {
  // 旧版结账流程
}
```

**管理原则**：

- 每个 Feature Flag 必须有明确的启用条件和过期计划
- 功能稳定上线后，及时移除对应的 Feature Flag 和旧代码
- 不要在代码中堆积大量已失效的 Feature Flag，它们会显著增加理解成本

#### 4.4 环境配置优先级链图

```
┌─────────────────────────────────────────────────┐
│                 配置来源优先级                     │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  1. 环境变量（最高优先级）                     │ │
│  │     • 运行时通过 OS 或容器注入                  │ │
│  │     • 不进入代码和镜像                         │ │
│  │     • 适合：敏感信息、环境差异化配置              │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │ 覆盖 ↓                       │
│  ┌──────────────────┴──────────────────────────┐ │
│  │  2. 配置文件（.env / config.json）            │ │
│  │     • 按环境区分的文件                          │ │
│  │     • .env.development / .env.production      │ │
│  │     • 适合：非敏感的环境配置                     │ │
│  └──────────────────┬──────────────────────────┘ │
│                     │ 覆盖 ↓                       │
│  ┌──────────────────┴──────────────────────────┐ │
│  │  3. 代码默认值（最低优先级）                    │ │
│  │     • 写在代码中的兜底值                       │ │
│  │     • 保证无配置时也能运行                      │ │
│  │     • 适合：合理的默认行为                      │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
└─────────────────────────────────────────────────┘
```

---

## 第四篇：备份与恢复

数据是项目最核心的资产。代码丢失可以通过版本控制恢复，但数据丢失往往是不可逆的。备份策略的目标是：**在数据丢失时，能以最短时间、最小损失恢复到可用状态**。

### 第五章：备份策略

#### 5.1 自动备份

**数据库自动备份方案**：

```bash
#!/bin/bash
# backup-db.sh — 数据库定时备份脚本
# 建议通过 cron 每天凌晨 2 点执行

BACKUP_DIR="/backups/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
KEEP_DAYS=30

# 执行备份
pg_dump -U $DB_USER -h $DB_HOST $DB_NAME | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# 清理超过 30 天的旧备份
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$KEEP_DAYS -delete
```

**Cron 定时任务配置**（每天凌晨 2 点执行）：

```bash
# 编辑 crontab
crontab -e

# 添加定时任务
0 2 * * * /path/to/backup-db.sh >> /var/log/backup.log 2>&1
```

**云服务器的自动备份**：

| 云服务商 | 自动备份功能 | 建议配置 |
|----------|-------------|---------|
| 阿里云 | 快照策略 | 每天自动快照，保留 7 天 |
| 腾云 | 快照策略 | 每天自动快照，保留 7 天 |
| AWS | EBS Snapshots | 每日自动快照，保留 14 天 |

#### 5.2 手动导出

为用户提供数据导出功能，确保用户对自己的数据有控制权。

**导出功能设计原则**：

| 原则 | 说明 |
|------|------|
| 格式通用 | 使用 CSV、JSON 等通用格式，不使用专有格式 |
| 数据完整 | 导出包含所有用户数据，不留遗漏 |
| 可导入 | 导出的数据应该能被重新导入（虽然不一定是同一个系统） |
| 操作简单 | 一键导出，不需要复杂配置 |

**导出功能的典型入口**：

- 用户设置页面 → "导出我的数据"
- 管理后台 → "数据备份" → "导出全部数据"
- API 端点：`GET /api/export?format=csv&scope=orders`

#### 5.3 恢复路径

数据丢失时的恢复步骤：

```
数据丢失事件
    │
    ▼
┌─────────────────┐
│  1. 评估影响范围  │ → 哪些数据丢失了？丢失了多长时间的数据？
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. 确定恢复方式  │ → 自动备份恢复 / 手动数据导入 / 从副本恢复
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. 执行恢复      │ → 按照备份文件恢复数据
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. 验证数据完整性 │ → 抽样检查关键数据是否正确恢复
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  5. 恢复服务      │ → 确认无误后恢复对外服务
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  6. 事后复盘      │ → 分析原因，完善备份策略，防止再次发生
└─────────────────┘
```

**恢复时间目标（RTO）和恢复点目标（RPO）**：

| 指标 | 含义 | 个人项目建议值 |
|------|------|---------------|
| RTO（恢复时间目标） | 从灾难发生到服务恢复的时间 | < 4 小时 |
| RPO（恢复点目标） | 可以容忍丢失多长时间的数据 | < 24 小时（即每天备份一次） |

#### 5.4 备份检查清单

定期（每月一次）检查以下项目：

- [ ] 最近一次自动备份是否成功执行
- [ ] 备份文件是否可以正常解压和恢复
- [ ] 备份保留策略是否生效（旧备份是否按时清理）
- [ ] 敏感数据是否已加密存储
- [ ] 备份脚本中的密码/密钥是否已轮换
- [ ] 是否有新的数据源需要加入备份范围
- [ ] 恢复文档是否与当前系统架构一致
- [ ] 异地备份是否配置（防止机房级灾难）

---

### 快速参考卡

**部署方案选择**：

- [ ] 开发/原型阶段：Docker 本地部署
- [ ] 稳定运营阶段：云服务器
- [ ] 流量不确定阶段：Serverless
- [ ] Dockerfile 使用多阶段构建，基础镜像用 alpine
- [ ] 敏感信息通过环境变量注入，不写入代码或镜像

**CI/CD 流程**：

- [ ] pre-commit Hook：lint + format
- [ ] pre-push Hook：type-check + test
- [ ] CI 服务器：lint → type-check → test → build
- [ ] 核心原则：代码离开本机前尽可能多地发现问题

**环境管理**：

- [ ] 配置优先级：环境变量 > 配置文件 > 代码默认值
- [ ] `.env.example` 提交到 Git，`.env.production` 不提交
- [ ] Feature Flag 有过期计划，功能上线后及时清理

**备份恢复**：

- [ ] 数据库每天自动备份，保留 30 天
- [ ] 提供用户数据导出功能（CSV/JSON）
- [ ] 每月验证一次备份可恢复性
- [ ] RTO < 4 小时，RPO < 24 小时
- [ ] 异地备份防止机房级灾难

---

## 附录：部署与环境管理核心规范摘要

### 部署规范

1. 根据项目规模、预算、技术能力选择部署方案
2. Dockerfile 使用多阶段构建，减小镜像体积
3. 敏感配置通过环境变量注入，使用 `.dockerignore` 排除敏感文件
4. 数据库和缓存服务必须配置数据持久化

### CI/CD 规范

5. 使用 Git Hook 在本地拦截不规范的代码
6. 检查顺序：lint → type-check → test（从快到慢）
7. CI 流程应覆盖代码质量检查和构建验证

### 环境管理规范

8. 配置分层：环境变量 > 配置文件 > 代码默认值
9. 每个环境有独立的配置文件，通过文件名区分
10. Feature Flag 有明确的启用条件和过期计划

### 备份恢复规范

11. 数据库自动备份每天执行，保留 30 天
12. 提供用户数据导出功能，格式通用
13. 每月验证备份的可恢复性
14. 恢复流程有明确的步骤文档
