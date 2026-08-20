# 最佳实践案例：DogEar 从零到一全流程

- **日期**：2026-08-21
- **版本**：v1.0
- **适用范围**：本文以 DogEar·折耳书签项目为案例，演示如何将文档体系（00-12 篇）的规范应用到真实项目中。
- **阅读建议**：建议先阅读 00-导读了解文档体系，再阅读本文理解实践方法。
- **案例来源**：DogEar 需求说明书 v0.1.0

---

## 全流程概览

从需求到部署，DogEar 项目经历了以下阶段。每个阶段都对应文档体系中的具体指南。

```
需求讨论 → 原型设计 → 技术设计 → 文档编写 → 开发实现 → 测试部署
  (06)       (05)       (02-04)    (00-12)     (01,07)     (07,10,12)
```

各阶段详细映射：

```
┌──────────────┬─────────────────────────────────────────────────────┐
│   阶段        │   对应文档体系                                       │
├──────────────┼─────────────────────────────────────────────────────┤
│ 需求分析      │ 06-AI协作开发指南（P1 需求讨论阶段）                  │
│ 产品设计      │ 05-用户体验设计指南                                  │
│ 数据模型      │ 02-数据库设计与数据模型                              │
│ API 设计      │ 03-API与接口设计                                    │
│ 组件设计      │ 04-组件设计规范                                     │
│ 开发规范      │ 01-开发规范与工程原则                                │
│ 测试质量      │ 07-测试与质量保障                                   │
│ 安全容错      │ 08-安全与容错设计                                   │
│ 性能优化      │ 09-性能与缓存策略                                   │
│ 部署上线      │ 10-部署与环境管理                                   │
│ 里程碑规划    │ 11-开发里程碑计划                                   │
│ 健康检查      │ 12-健康检查清单                                     │
│ 项目导读      │ 00-导读与项目概述                                   │
└──────────────┴─────────────────────────────────────────────────────┘
```

---

## 第一篇：项目启动

本篇展示如何从一份需求说明书出发，完成需求分析和优先级排序。
对应文档体系：06-AI协作开发指南（P1 需求讨论阶段）

### 第一章：需求分析

#### 1.1 需求来源梳理

DogEar 的需求来自用户与 AI 的多轮讨论，原始内容散落在多个话题中。梳理时需要将它们分类整理，消除重复，建立结构。

**按来源分类**：

| 需求来源 | 内容举例 | 需求类型 |
|----------|----------|----------|
| 基础需求 | 做一个基于 Raindrop 的书签工具 | 产品定位 |
| 痛点描述 | 浏览器插件收藏后只能写文字和标签，编辑维度单一 | 功能需求 |
| AI Agent | 通过 Skill API 让任意 AI 平台收藏链接 | 接口需求 |
| 工作台 | 整理模式、多视图、批量操作 | 交互需求 |
| 数据同步 | 本地优先 + 异步同步到 Raindrop | 架构需求 |
| 安全约束 | AI 操作边界、软删除、操作日志 | 非功能需求 |
| 导出 | HTML / Markdown / CSV / JSON 格式导出 | 功能需求 |
| 导航页 | 浏览器插件替换新标签页 | 功能需求 |

**按功能领域分组**（MECE 原则）：

```
DogEar 功能全景
├── Skill API（AI 能力接口层）
│   ├── 自描述机制
│   ├── 收藏 / 搜索 / 修改 / 列表 / 统计
│   ├── 安全策略（限速、禁止删除、操作日志）
│   └── AI 记忆（偏好学习）
├── 工作台（Web App）
│   ├── 整理模式（Inbox Zero 两阶段分拣）
│   ├── 多视图（网格 / 列表 / 看板）
│   ├── 内联编辑（标签、文件夹、状态）
│   ├── 批量操作
│   ├── 快捷键
│   ├── 工具面板（死链检测、重复检测、标签整理、统计）
│   └── 导出
├── 个人导航页（浏览器插件）
│   ├── 图标网格布局 + 分页
│   ├── 文件夹展开浮层
│   ├── Docker 常驻栏
│   ├── 搜索框
│   └── 隐私控制
└── 本地数据层（Core）
    ├── IndexedDB 存储
    ├── 同步引擎（双向）
    ├── 冲突处理
    ├── 操作日志 + 软删除
    └── 软删除恢复
```

#### 1.2 需求冲突识别

需求梳理过程中，DogEar 需求说明书暴露出几个真实的冲突点。识别冲突是需求分析的关键步骤——冲突如果不提前发现，会在开发阶段造成返工。

**冲突一：本地优先 vs 多平台可取**

需求说"本地优先，操作即时响应，异步同步到 Raindrop"，同时又强调"看中 Raindrop 的数据稳定性且多平台可取"。这两者之间存在张力：

- 本地优先意味着数据主要在 IndexedDB 中，浏览器清除数据可能丢失
- 多平台可取意味着数据需要在云端持久化

**解决思路**：以 Raindrop 为唯一可信数据源，本地 IndexedDB 作为缓存和操作缓冲层。所有写操作最终必须同步到 Raindrop，本地只是加速交互的中间层。同步引擎是整个系统的生命线。

**冲突二：个人使用 vs 架构可扩展**

需求明确说"纯个人工具，不考虑多人协作"，但同时提出"不排除将来产品化""架构要留有余地"。如果完全不做扩展性考虑，后续产品化时可能需要推倒重来。

**解决思路**：在数据模型和 API 层面预留扩展空间（如 user_id 字段、租户隔离意识），但不在 UI 和业务逻辑层面做多人协作的实现。具体来说：数据表加 `user_id` 字段但当前只有一个用户，API 加认证但只做 Bearer Token，不做角色权限。

**冲突三：Phase 1 范围 vs 功能列表庞大**

需求说"Phase 1 需要打通整个流程，功能后续根据体验慢慢扩展"，但 Phase 1 的功能列表已经包含：Skill API（5 个端点 + 安全策略 + 撤销机制）、本地数据层（IndexedDB + 双向同步引擎 + 冲突处理）、工作台（整理模式 + 多视图 + 内联编辑 + 批量操作 + 导出）、导航页（浏览器插件）。这已经是一个完整的应用了。

**解决思路**：在 Phase 1 内部再拆分子里程碑，每个子里程碑只做最小可验证的闭环。具体拆分见第七章。

#### 1.3 优先级排序

使用 MoSCoW 方法对 DogEar 的功能进行优先级排序。排序的核心标准是：**哪个功能最先打通核心闭环**。

**Must Have（Phase 1 必须）**：

| 功能 | 理由 |
|------|------|
| Skill API 收藏端点 | AI 收藏是核心入口 |
| 本地数据层（IndexedDB） | 所有功能的数据基础 |
| 同步引擎（Raindrop 双向） | 数据持久化保障 |
| 工作台基础视图 | 整理书签的主要界面 |
| 整理模式 | 处理积压书签的核心流程 |
| 工作台导出 | 备份需求 |

**Should Have（Phase 1 尽量，但可延后）**：

| 功能 | 理由 |
|------|------|
| 导航页浏览器插件 | 有价值但独立于核心闭环 |
| 看板视图 | 网格和列表已能覆盖主要场景 |
| 工具面板（死链/重复检测） | 便利功能，非核心 |
| Skill API 安全策略（限速、审计） | 个人使用场景下风险较低 |

**Could Have（Phase 2）**：

| 功能 | 理由 |
|------|------|
| AI 批量整理 | 需要先积累单条整理的使用经验 |
| AI 偏好学习 | 需要足够的数据积累 |
| 看板视图多维度切换 | 需要验证维度设计 |
| 导航页小组件 | 需要先验证导航页基础体验 |

**Won't Have（当前不做）**：

| 功能 | 理由 |
|------|------|
| 多用户/账号体系 | 明确为个人工具 |
| 云端部署 | 本地部署优先 |
| 移动端 | 需求明确不做 |
| 剪贴板监听 | Phase 3 考虑 |

#### 1.4 需求澄清清单

在项目正式启动前，需要与用户确认以下问题。这份清单直接来自 DogEar 需求中尚未明确的决策点：

| # | 问题 | 影响范围 | 建议 |
|---|------|----------|------|
| 1 | 工作台前端技术选型 | 整个工作台开发 | 建议 React + Vite，生态成熟 |
| 2 | 导航页插件技术选型 | 浏览器插件 | 建议 Manifest V3，兼容 Chrome/Edge |
| 3 | Skill API 后端技术选型 | API 层 | 建议 Node.js + Hono，轻量高效 |
| 4 | 部署方式确认 | 运维 | 建议本地 Docker + Tailscale |
| 5 | 状态管理方案 | 前端架构 | 建议 Zustand，轻量但够用 |
| 6 | Phase 1 范围是否裁剪 | 里程碑规划 | 建议导航页延后到 Phase 1.5 |
| 7 | 整理模式的两阶段流程是否确认 | UI 设计 | v0.2.0 已确认两阶段模式 |

---

### 第一篇快速参考卡

- [ ] 原始需求是否按来源和功能领域分类整理？
- [ ] 是否识别出需求之间的冲突点并形成解决思路？
- [ ] 是否用 MoSCoW 方法完成优先级排序？
- [ ] 是否列出需求澄清清单并与用户确认？
- [ ] 需求变更是否记录到需求文档的版本历史中？

---

## 第二篇：原型与设计

本篇展示如何基于需求进行信息架构和交互设计。
对应文档体系：05-用户体验设计指南

### 第二章：信息架构设计

#### 2.1 页面层级规划

DogEar 由三个独立的应用构成，每个应用有自己的页面层级：

```
DogEar 应用层级
├── 工作台（Web App）
│   ├── 主界面
│   │   ├── 侧边导航栏
│   │   ├── 顶部搜索栏 + 同步状态
│   │   ├── 主内容区（网格/列表/看板视图切换）
│   │   ├── 右侧工具面板（可折叠）
│   │   └── 底部状态栏
│   ├── 整理模式
│   │   ├── 左侧待处理列表
│   │   ├── 右侧预览面板
│   │   ├── 阶段一切拣（保留/删除/待定）
│   │   └── 阶段二细分拣（AI 建议采纳/修改）
│   └── 设置页面
│       ├── Raindrop 连接配置
│       ├── Skill API 配置
│       ├── 同步间隔设置
│       └── 隐私设置
├── 个人导航页（浏览器插件）
│   ├── 新标签页
│   │   ├── 时间/搜索区
│   │   ├── 页面标签区（横向/纵向可切换）
│   │   ├── 小组件区（稍后读/待办/最近/统计）
│   │   ├── 文件夹图标区
│   │   ├── 书签图标区
│   │   └── Docker 常驻栏
│   └── 插件设置页
└── Skill API（无 UI，接口文档即界面）
    ├── /.well-known/capabilities（自描述端点）
    ├── /api/v1/bookmarks（收藏/搜索/列表）
    ├── /api/v1/bookmarks/:id（单条操作）
    └── /api/v1/stats（统计信息）
```

#### 2.2 导航结构设计

工作台的导航栏采用左侧固定导航，按功能分组：

```
┌──────────────────────┐
│  DogEar · 工作台      │
├──────────────────────┤
│  📥 待处理            │  ← 整理模式入口
│  ⭐ 收藏              │  ← 全部书签视图
│  🕐 最近              │  ← 按时间排序
├──────────────────────┤
│  📁 文件夹树          │  ← Raindrop 同步的文件夹
│  🏷️ 标签云           │  ← 所有标签
├──────────────────────┤
│  📊 统计              │  ← 数据概览
│  📤 导出              │  ← 备份功能
│  📋 日志              │  ← 操作日志 + 同步日志
├──────────────────────┤
│  ⚙️ 设置              │
└──────────────────────┘
```

#### 2.3 功能分组

使用 MECE（互不遗漏、完全穷尽）原则对 DogEar 工作台的功能进行分组：

| 功能组 | 包含功能 | 对应导航项 |
|--------|----------|-----------|
| 入口 | 待处理队列、整理模式 | 待处理 |
| 浏览 | 网格/列表/看板视图、文件夹浏览、标签筛选 | 收藏、最近、文件夹树、标签云 |
| 编辑 | 内联编辑、批量操作、拖拽排序 | 内嵌在浏览视图中 |
| 工具 | 死链检测、重复检测、标签整理、域名统计 | 右侧工具面板 |
| 数据 | 同步状态、操作日志 | 日志 |
| 管理 | 导出、设置、Skill API 配置 | 导出、设置 |

### 第三章：状态设计

#### 3.1 书签状态模型

DogEar 的书签有阅读状态和同步状态两个维度：

**阅读状态**（用 `_status:` 标签约定实现，兼容 Raindrop）：

```
未读 ──→ 在读 ──→ 已读 ──→ 已整理
  ↑        │        │        │
  │        └────────┴────────┘
  │              （可回退）
  └────────────── 待处理队列
```

状态流转规则：
- 新收藏的书签默认为 `未读`，进入待处理队列
- 用户打开原文链接后标记为 `在读`
- 阅读完毕标记为 `已读`
- 完成分类收纳后标记为 `已整理`，退出待处理队列
- 任何状态都可以回退到前一个状态

**整理模式的分拣状态**（临时状态，不持久化到 Raindrop）：

```
待分拣 ──→ 保留 ──→ 进入阶段二细分拣
    │
    ├──→ 删除 ──→ 软删除（保留 7 天可恢复）
    │
    └──→ 待定 ──→ 稍后重新分拣
```

#### 3.2 同步状态设计

每条本地变更在同步队列中的状态流转：

```
待同步 ──→ 同步中 ──→ 已同步 ──→ （从队列移除）
    │            │
    │            └──→ 同步失败 ──→ 重试（最多 3 次）──→ 需人工干预
    │
    └──→ 已合并（Raindrop 侧有变更，已合并到本地）
```

同步队列的数据结构：

```ts
interface SyncQueueItem {
  id: string            // 队列项唯一 ID
  operation: 'create' | 'update' | 'delete'
  entityType: 'bookmark' | 'folder'
  entityId: string      // 本地实体 ID
  raindropId?: string   // Raindrop 侧的 ID
  payload: unknown      // 变更数据快照
  status: SyncStatus    // 待同步/同步中/已同步/同步失败
  retryCount: number    // 已重试次数
  createdAt: number     // 入队时间
  lastAttemptAt?: number // 上次尝试时间
  errorMessage?: string // 最近一次错误信息
}
```

#### 3.3 空状态设计

DogEar 有多种空状态场景，每个场景都需要设计对应的引导：

| 场景 | 空状态表现 | 引导动作 |
|------|-----------|----------|
| 首次使用，无书签 | "开始收藏你的第一个链接" | 展示 3 种收藏方式：AI Agent / 手动输入 / Raindrop 同步 |
| 有待处理书签 | 专属待处理视图，进度条 | 进入整理模式 |
| 无待处理书签 | "🎉 Inbox Zero！所有书签已整理" | 提供新建收藏入口 |
| 搜索无结果 | "没有找到匹配的书签" | 建议修改关键词或浏览全部 |
| 同步未连接 | "Raindrop 未连接" | 引导配置 Raindrop Token |
| 导出为空 | "没有可导出的数据" | 提示先收藏一些书签 |

---

### 第二篇快速参考卡

- [ ] 页面层级是否覆盖了所有应用（工作台/导航页/Skill API）？
- [ ] 导航结构是否符合 MECE 原则？
- [ ] 书签状态模型是否包含阅读状态和同步状态两个维度？
- [ ] 同步队列状态流转是否覆盖了失败重试场景？
- [ ] 所有空状态场景是否有对应的引导设计？

---

## 第三篇：技术设计

本篇展示如何基于需求进行数据模型、API 和组件设计。
对应文档体系：02-数据库设计、03-API设计、04-组件设计

### 第四章：数据模型设计

#### 4.1 实体识别

从 DogEar 需求中识别出以下核心实体：

| 实体 | 描述 | 存储位置 |
|------|------|----------|
| Bookmark | 书签主数据，含 Raindrop 同步字段 | IndexedDB + Raindrop |
| Folder | 文件夹结构 | IndexedDB + Raindrop |
| Tag | 标签（通过标签约定扩展维度） | IndexedDB + Raindrop |
| SyncQueue | 同步变更队列 | IndexedDB |
| OperationLog | 操作日志（支持撤销） | IndexedDB |
| UserPreference | AI 偏好数据（Phase 2） | 服务端 |
| NavigationPage | 导航页配置（布局、Docker 栏等） | IndexedDB |

#### 4.2 实体关系图

```
┌─────────────┐     ┌─────────────┐
│   Folder     │     │    Tag       │
│─────────────│     │─────────────│
│ id           │     │ id           │
│ name         │     │ name         │
│ parentId     │     │ color        │
│ raindropId   │     │ usageCount   │
│ order        │     └──────┬──────┘
└──────┬──────┘            │
       │ 1:N               │ M:N
       ▼                   ▼
┌─────────────────────────────────┐
│           Bookmark              │
│─────────────────────────────────│
│ id                              │
│ url                             │
│ title                           │
│ note          （用户备注）        │
│ excerpt       （AI 摘要）         │
│ favicon       （图标缓存）        │
│ folderId      → Folder          │
│ tags          → Tag[]           │
│ status        （阅读状态）        │
│ syncStatus    （同步状态）        │
│ raindropId    （Raindrop 侧 ID） │
│ isDeleted     （软删除标记）      │
│ deletedAt     （删除时间）        │
│ createdAt                       │
│ updatedAt                       │
└───────────┬─────────────────────┘
            │
            │ 1:N
            ▼
┌─────────────┐     ┌─────────────────┐
│ SyncQueue    │     │ OperationLog    │
│─────────────│     │─────────────────│
│ id           │     │ id              │
│ operation    │     │ operation       │
│ entityType   │     │ entityType      │
│ entityId     │     │ entityId        │
│ payload      │     │ beforeSnapshot  │
│ status       │     │ afterSnapshot   │
│ retryCount   │     │ createdAt       │
│ createdAt    │     └─────────────────┘
└─────────────┘
```

#### 4.3 字段设计

**Bookmark 核心表**：

| 字段 | 类型 | 说明 | 同步到 Raindrop |
|------|------|------|----------------|
| `id` | string | 本地唯一 ID | 否（本地生成） |
| `raindropId` | number? | Raindrop 侧 ID | 否（Raindrop 返回） |
| `url` | string | 书签 URL | 是 |
| `title` | string | 标题 | 是 |
| `note` | string | 用户备注 | 是 |
| `excerpt` | string | AI 生成摘要 | 否（仅本地） |
| `favicon` | string | 图标 Base64/URL | 否（仅本地） |
| `folderId` | string | 所属文件夹 | 是（映射为 Raindrop collection） |
| `tags` | string[] | 标签列表 | 是 |
| `status` | enum | 阅读状态（标签约定 `_status:xxx`） | 是（通过标签） |
| `syncStatus` | enum | 同步状态 | 否（仅本地） |
| `isDeleted` | boolean | 软删除标记 | 否（仅本地） |
| `deletedAt` | number? | 删除时间戳 | 否（仅本地） |
| `createdAt` | number | 创建时间 | 是 |
| `updatedAt` | number | 更新时间 | 是 |

**标签约定扩展维度**：

DogEar 使用 Raindrop 的标签系统实现多维度数据，通过前缀约定区分：

| 标签约定 | 用途 | 示例 |
|----------|------|------|
| `_status:xxx` | 阅读状态 | `_status:unread`、`_status:reading` |
| `_scene:xxx` | 情景/用途 | `_scene:learning`、`_scene:work` |
| `_priority:xxx` | 优先级 | `_priority:high`、`_priority:low` |
| `_temporal:xxx` | 时效性 | `_temporal:permanent`、`_temporal:temporary` |
| `_project:xxx` | 项目关联 | `_project:dogear` |

前缀使用下划线，与用户自定义标签区分开。

### 第五章：API 设计

#### 5.1 Skill API 设计

DogEar 的 Skill API 设计遵循三个原则：自描述、安全边界、平台无关。

**自描述机制**：

AI 平台绑定时只需提供 Base URL 和 Token，通过访问 `/.well-known/capabilities` 端点自动发现可用能力：

```json
// GET /.well-known/capabilities
{
  "name": "DogEar Bookmark Skill",
  "version": "1.0.0",
  "description": "个人书签收藏与管理的 AI 能力接口",
  "capabilities": [
    {
      "name": "save_bookmark",
      "description": "收藏一个链接，自动抓取元数据、分类、打标签",
      "parameters": {
        "url": { "type": "string", "required": true, "description": "要收藏的 URL" },
        "note": { "type": "string", "required": false, "description": "用户备注" }
      },
      "example": "save_bookmark(url='https://example.com/article', note='设计参考')"
    },
    {
      "name": "search_bookmarks",
      "description": "搜索书签，支持自然语言和条件筛选",
      "parameters": {
        "query": { "type": "string", "required": true, "description": "搜索关键词" },
        "filters": {
          "type": "object",
          "required": false,
          "properties": {
            "folder": { "type": "string" },
            "tags": { "type": "array", "items": { "type": "string" } },
            "status": { "type": "string", "enum": ["unread", "reading", "read", "organized"] }
          }
        }
      }
    },
    {
      "name": "update_bookmark",
      "description": "修改单条书签的文件夹、标签、备注或状态"
    },
    {
      "name": "list_bookmarks",
      "description": "列出书签，支持筛选和分页"
    },
    {
      "name": "get_stats",
      "description": "获取收藏统计信息，无输入参数"
    }
  ],
  "rateLimits": {
    "requestsPerMinute": 60,
    "writesPerMinute": 10
  }
}
```

**端点定义**：

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/.well-known/capabilities` | 自描述端点 |
| POST | `/api/v1/bookmarks` | 收藏新书签 |
| GET | `/api/v1/bookmarks` | 列出书签（支持筛选参数） |
| GET | `/api/v1/bookmarks/:id` | 获取单条书签 |
| PATCH | `/api/v1/bookmarks/:id` | 修改书签 |
| DELETE | `/api/v1/bookmarks/:id` | 软删除书签 |
| POST | `/api/v1/bookmarks/:id/restore` | 恢复已删除书签 |
| GET | `/api/v1/stats` | 获取统计信息 |

**请求/响应格式**：

```ts
// 统一响应格式
interface ApiResponse<T> {
  ok: boolean
  data: T
  error?: {
    code: string       // 错误码
    message: string    // 用户可读的错误信息
  }
  meta?: {
    total?: number     // 总数（分页时）
    page?: number      // 当前页
    limit?: number     // 每页条数
  }
}

// 收藏请求示例
// POST /api/v1/bookmarks
{
  "url": "https://example.com/design-guide",
  "note": "很好的设计参考文档"
}

// 收藏响应示例
{
  "ok": true,
  "data": {
    "id": "bm_abc123",
    "url": "https://example.com/design-guide",
    "title": "Design Guide - Example",
    "excerpt": "一篇关于设计方法论的文章...",
    "folderId": "folder_design",
    "tags": ["_status:unread", "_scene:learning", "design"],
    "status": "unread",
    "createdAt": 1755763200000
  }
}
```

#### 5.2 Raindrop API 集成

DogEar 需要与 Raindrop.io 的 API 进行对接。设计要点：

**认证方式**：Raindrop API 使用 OAuth2 Bearer Token。Token 由用户在设置中配置，存储在本地。

**限频策略**：Raindrop API 有调用频率限制。DogEar 的同步引擎采用以下策略：
- 写入队列每 30 秒轮询一次
- 每次最多推送 5 条变更
- 遇到 429 限频时退避等待，按响应头的 `Retry-After` 值等待

**数据映射**：

| DogEar 字段 | Raindrop 字段 | 映射说明 |
|-------------|--------------|----------|
| `id` | `id` | Raindrop 自动分配 |
| `url` | `link` | 直接映射 |
| `title` | `title` | 直接映射 |
| `note` | `note` | 直接映射 |
| `folderId` | `collection.id` | 映射到 Raindrop collection |
| `tags` | `tags` | 直接映射 |
| `excerpt` | — | 不同步（仅本地） |
| `favicon` | — | 不同步（仅本地） |
| `status` | — | 通过 `_status:` 标签约定间接同步 |

#### 5.3 错误处理

DogEar 的错误分为三个层级：

| 错误层级 | 示例 | 处理策略 |
|----------|------|----------|
| 网络错误 | 连接超时、DNS 失败 | 重试 3 次，间隔递增（1s/3s/9s），失败后标记"需人工干预" |
| API 错误 | Token 过期、限频 | Token 过期引导重新授权；限频按 Retry-After 等待 |
| 业务错误 | URL 无效、书签不存在 | 返回具体错误码和提示，不重试 |

**错误码设计**：

| 错误码 | HTTP 状态 | 含义 |
|--------|-----------|------|
| `NETWORK_ERROR` | 503 | 网络不可用 |
| `AUTH_EXPIRED` | 401 | Token 过期 |
| `RATE_LIMITED` | 429 | 请求过于频繁 |
| `NOT_FOUND` | 404 | 书签不存在 |
| `VALIDATION_ERROR` | 400 | 参数校验失败 |
| `SYNC_CONFLICT` | 409 | 同步冲突 |
| `AI_SERVICE_UNAVAILABLE` | 503 | AI 分类服务不可用 |

### 第六章：组件规划

#### 6.1 原子设计层级

DogEar 工作台的组件遵循原子设计方法论：

```
原子（Atoms）
├── Button, Input, Tag, Icon, Badge
├── Checkbox, Radio, Toggle
├── Tooltip, Popover
└── Spinner, Skeleton

分子（Molecules）
├── SearchBar（Input + Button + Icon）
├── TagSelector（Tag[] + Input + Dropdown）
├── FolderPicker（Tree + Search）
├── BookmarkCard（Icon + Title + Tags + Actions）
├── StatusBadge（Badge + 状态映射）
└── SyncIndicator（Spinner + 状态文本）

组织（Organisms）
├── NavigationSidebar（Logo + NavItems + Settings）
├── BookmarkGrid（BookmarkCard[] + 布局控制）
├── BookmarkList（BookmarkCard[] + 列表模式）
├── InboxQueue（列表 + 预览面板 + 操作按钮）
├── ToolPanel（Tab[] + 各工具面板）
├── BatchToolbar（Checkbox[] + 批量操作按钮）
└── ExportDialog（FormatPicker + FilterPicker + ProgressBar）

模板（Templates）
├── MainLayout（Sidebar + Header + Content + ToolPanel）
├── InboxLayout（QueueList + PreviewPanel）
└── SettingsLayout（Section[] + Form）

页面（Pages）
├── DashboardPage（主界面）
├── InboxPage（整理模式）
├── FolderPage（文件夹视图）
├── TagPage（标签视图）
├── StatsPage（统计视图）
├── LogPage（日志视图）
└── SettingsPage（设置页）
```

#### 6.2 核心组件清单

DogEar 工作台 Phase 1 需要实现的核心组件：

| 组件 | 层级 | 优先级 | 说明 |
|------|------|--------|------|
| `BookmarkCard` | 分子 | P0 | 书签卡片，所有视图的基础单元 |
| `BookmarkGrid` | 组织 | P0 | 网格视图容器 |
| `BookmarkList` | 组织 | P0 | 列表视图容器 |
| `NavigationSidebar` | 组织 | P0 | 左侧导航栏 |
| `InboxQueue` | 组织 | P0 | 整理模式主容器 |
| `TagSelector` | 分子 | P0 | 标签选择器 |
| `FolderPicker` | 分子 | P0 | 文件夹选择器 |
| `SearchBar` | 分子 | P1 | 全局搜索 |
| `BatchToolbar` | 组织 | P1 | 批量操作栏 |
| `ToolPanel` | 组织 | P1 | 右侧工具面板 |
| `ExportDialog` | 组织 | P2 | 导出弹窗 |
| `SyncIndicator` | 分子 | P1 | 同步状态指示器 |

#### 6.3 组件决策

Phase 1 建议的技术选型：

| 能力 | 选择 | 理由 |
|------|------|------|
| UI 组件库 | shadcn/ui | 轻量、可定制、无运行时开销 |
| 图标 | Lucide React | 与 shadcn/ui 生态一致 |
| 拖拽 | @dnd-kit | 现代化、TypeScript 友好、支持多容器 |
| 状态管理 | Zustand | 轻量、API 简洁、适合中小型项目 |
| 本地数据库 | Dexie.js（IndexedDB 封装） | API 简洁、支持复杂查询、类型安全 |
| 样式方案 | Tailwind CSS | 与 shadcn/ui 配合 |
| 表单 | React Hook Form + Zod | 类型安全的表单校验 |

**不需要自建的组件**：Button、Input、Badge、Tooltip、Popover 等基础 UI 组件，使用 shadcn/ui 提供的。

**需要自建的组件**：BookmarkCard、InboxQueue、InboxPreview、ToolPanel 等业务组件，这些是 DogEar 特有的。

---

### 第三篇快速参考卡

- [ ] 核心实体是否识别完整（Bookmark/Folder/Tag/SyncQueue/OperationLog）？
- [ ] 数据模型是否预留了多用户扩展空间（user_id 字段）？
- [ ] 标签约定前缀是否统一使用下划线 `_` 与用户标签区分？
- [ ] API 响应是否有统一格式（ok/data/error/meta）？
- [ ] 同步限频策略是否处理了 Raindrop 的 429 响应？
- [ ] 错误处理是否覆盖了网络/API/业务三个层级？
- [ ] 组件是否按原子设计层级组织？
- [ ] 复用决策是否合理（基础 UI 用库，业务组件自建）？

---

## 第四篇：开发实现

本篇展示如何规划里程碑和进行 AI 协作编码。
对应文档体系：01-开发规范、11-里程碑计划、06-AI协作

### 第七章：里程碑规划

#### 7.1 DogEar 的里程碑划分

Phase 1 的功能范围较大，需要拆分为子里程碑。拆分原则：每个子里程碑结束时，应该有一个可运行、可验证的闭环。

```
Phase 1 — 核心闭环
│
├── M1: 基础设施
│   ├── 项目脚手架搭建
│   ├── IndexedDB 数据层
│   ├── 基础 UI 框架
│   └── Raindrop API 对接
│
├── M2: 收藏与同步
│   ├── Skill API 收藏端点
│   ├── 同步引擎（本地→Raindrop）
│   ├── 同步引擎（Raindrop→本地）
│   └── 操作日志 + 软删除
│
├── M3: 工作台
│   ├── 导航栏 + 多视图
│   ├── 内联编辑
│   ├── 批量操作
│   ├── 整理模式（两阶段）
│   └── 快捷键
│
└── M4: 补全与部署
    ├── 工具面板（死链检测/重复检测/统计）
    ├── 导出功能
    ├── 导航页浏览器插件
    └── 部署上线
```

#### 7.2 每个里程碑的功能清单

**M1：基础设施**

| 功能 | 交付物 | 验证方式 |
|------|--------|----------|
| 项目脚手架 | 前端 + 后端项目结构 | `npm run dev` 能启动 |
| IndexedDB 数据层 | Bookmark/Folder/Tag/SyncQueue/OperationLog 表 | 能增删改查 |
| 基础 UI 框架 | MainLayout + NavigationSidebar | 页面能正常渲染 |
| Raindrop API 对接 | Token 验证 + 基础请求封装 | 能获取 Raindrop 数据 |

**M2：收藏与同步**

| 功能 | 交付物 | 验证方式 |
|------|--------|----------|
| Skill API 收藏端点 | POST /api/v1/bookmarks | AI 能收藏链接 |
| 自描述端点 | GET /.well-known/capabilities | 返回能力清单 |
| 本地→Raindrop 同步 | SyncQueue 引擎 | 本地收藏后 Raindrop 能看到 |
| Raindrop→本地 同步 | 增量拉取 + 冲突处理 | Raindrop 改动后本地能同步 |
| 操作日志 + 软删除 | OperationLog + 恢复机制 | 操作可回滚 |

**M3：工作台**

| 功能 | 交付物 | 验证方式 |
|------|--------|----------|
| 多视图 | 网格 / 列表视图切换 | 两种视图都能正常展示 |
| 内联编辑 | 标签/文件夹/状态编辑 | 悬浮卡片可编辑 |
| 批量操作 | 多选 + 批量移动/打标/删除 | 选中多条后可批量操作 |
| 整理模式 | 两阶段分拣流程 | 待处理列表可逐条处理 |
| 快捷键 | ⌘K/N/Enter/E/D/S/←→/Esc | 键盘操作流畅 |

**M4：补全与部署**

| 功能 | 交付物 | 验证方式 |
|------|--------|----------|
| 工具面板 | 死链检测/重复检测/域名统计 | 右侧面板可使用 |
| 导出 | HTML/Markdown/CSV/JSON | 导出文件可验证 |
| 导航页 | 浏览器插件新标签页 | 新标签页展示书签 |
| 部署 | Docker 配置 + Tailscale | 远程可访问 |

#### 7.3 开发循环示例

以"本地数据层"模块为例，展示六步开发循环（对应 06-AI协作开发指南的开发循环方法论）：

**步骤 1：明确目标**

```
目标：实现 DogEar 的 IndexedDB 数据层，支持 Bookmark 实体的 CRUD 操作。

技术栈：
- Dexie.js（IndexedDB 封装库）
- TypeScript 类型定义

验证标准：
- 能创建书签
- 能读取书签列表
- 能更新书签
- 能软删除书签
- 能恢复已删除的书签
```

**步骤 2：方案讨论**

```
AI 提问：Bookmark 表的字段设计需要先确认。Raindrop 的书签有 link、title、note、tags、collection，
DogEar 需要额外增加 excerpt、favicon、status、syncStatus、isDeleted、deletedAt。

讨论结论：
- 使用 Dexie.js 定义数据库 Schema
- 主键用 `id`（自动生成 UUID）
- `raindropId` 建索引，用于同步时快速查找
- `status` 和 `isDeleted` 建索引，用于筛选
- 同步队列和操作日志作为独立的表
```

**步骤 3：编码实现**

```
目录结构：
features/
├── data-layer/
│   ├── index.ts           # 模块入口，导出 db 实例和 CRUD 函数
│   ├── schema.ts          # Dexie 数据库 Schema 定义
│   ├── bookmark.ts        # Bookmark CRUD 操作
│   ├── sync-queue.ts      # SyncQueue 操作
│   ├── operation-log.ts   # OperationLog 操作
│   └── types.ts           # 数据层相关类型定义
```

**步骤 4：逐文件审查**

```
审查清单：
- schema.ts: Schema 定义是否包含所有必要索引？（raindropId, status, isDeleted, createdAt）
- bookmark.ts: CRUD 函数参数和返回值是否有类型定义？
- bookmark.ts: 是否有误用 any？
- sync-queue.ts: 队列操作是否有并发安全考虑？
- 每个文件是否在 300 行以内？
```

**步骤 5：运行验证**

```
验证步骤：
1. npm run dev 启动项目
2. 打开浏览器控制台
3. 调用 createBookmark() 创建一条书签
4. 调用 listBookmarks() 确认返回
5. 调用 updateBookmark() 修改标题
6. 调用 softDeleteBookmarks() 软删除
7. 调用 restoreBookmark() 恢复
8. 检查 IndexedDB 面板确认数据正确
```

**步骤 6：Git 提交**

```
git add features/data-layer/
git commit -m "feat(data): implement IndexedDB data layer with Bookmark CRUD"
```

### 第八章：AI 协作编码示例

#### 8.1 模块拆分示例

DogEar 工作台可以拆分为以下独立功能模块：

```
features/
├── data-layer/           # M1: 本地数据层
├── raindrop-sync/        # M2: Raindrop 同步引擎
├── skill-api/            # M2: Skill API 后端
├── workspace/            # M3: 工作台主体
│   ├── views/            #   多视图（网格/列表）
│   ├── inbox/            #   整理模式
│   ├── inline-edit/      #   内联编辑
│   ├── batch/            #   批量操作
│   └── shortcuts/        #   快捷键
├── tools/                # M4: 工具面板
│   ├── dead-link/        #   死链检测
│   ├── duplicate/        #   重复检测
│   └── stats/            #   域名统计
├── export/               # M4: 导出
├── navigation/           # M4: 导航页浏览器插件
└── settings/             # 设置页面
```

每个模块独立开发、独立测试，模块间通过共享的类型定义和数据层接口通信。

#### 8.2 代码组织示例

DogEar 项目的完整目录结构：

```
dogear/
├── apps/
│   ├── web/                    # 工作台 Web App
│   │   ├── src/
│   │   │   ├── app/            # 路由和页面入口
│   │   │   ├── features/       # 功能模块
│   │   │   ├── components/     # 跨模块共享组件
│   │   │   ├── hooks/          # 跨模块共享 hooks
│   │   │   ├── lib/            # 业务逻辑（数据层、同步、API 客户端）
│   │   │   ├── types/          # 跨模块共享类型
│   │   │   └── utils/          # 工具函数
│   │   ├── package.json
│   │   └── vite.config.ts
│   ├── extension/              # 导航页浏览器插件
│   │   ├── src/
│   │   │   ├── popup/          # 插件弹窗
│   │   │   ├── newtab/         # 新标签页
│   │   │   └── shared/         # 共享逻辑
│   │   ├── manifest.json
│   │   └── package.json
│   └── server/                 # Skill API 后端
│       ├── src/
│       │   ├── routes/         # API 路由
│       │   ├── middleware/     # 中间件（认证、限速、日志）
│       │   ├── services/       # 业务服务（Raindrop 对接、AI 分类）
│       │   └── types/          # 类型定义
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/                 # 跨应用共享代码
│   │   ├── types/              # 共享类型定义
│   │   ├── constants/          # 共享常量
│   │   └── utils/              # 共享工具函数
│   └── db/                     # 数据库层（Dexie）
│       ├── src/
│       │   ├── schema.ts
│       │   ├── bookmark.ts
│       │   ├── sync-queue.ts
│       │   └── operation-log.ts
│       └── package.json
├── docs/                       # 项目文档
│   ├── COMPONENTS.md
│   ├── DATA_MODEL.md
│   └── CHANGELOG.md
├── package.json                # Monorepo 根配置
├── pnpm-workspace.yaml
└── turbo.json
```

**关键设计决策**：

- 使用 pnpm workspace + Turborepo 管理 Monorepo
- 数据库层抽为独立 package，工作台和 Skill API 后端都可以使用
- 共享类型放在 `packages/shared`，避免跨应用的类型不一致
- 浏览器插件独立管理，通过 `shared/` 共享数据层

#### 8.3 AI 协作对话示例

以下是一个典型的 AI 协作编码对话，展示从需求描述到代码实现的完整过程：

**用户**：实现整理模式的阶段一分拣功能。待处理列表中每条书签有三个按钮：保留、删除、待定。选中后右侧预览面板显示书签详情。

**AI（方案讨论）**：

整理模式的阶段一需要以下几个组件：

1. `InboxPage` — 页面容器，左右分栏布局
2. `InboxList` — 左侧待处理列表
3. `InboxListItem` — 单条书签（标题 + URL + AI 摘要 + 三个操作按钮）
4. `InboxPreview` — 右侧预览面板（标题/URL/AI摘要/建议分类/建议标签）
5. `InboxToolbar` — 底部工具栏（统计信息 + 批量操作 + 进入阶段二）

数据流：从 `data-layer` 查询 `status: 'unread'` 的书签 → 渲染列表 → 用户操作 → 更新本地状态 → 操作记录到 `operation-log` → 加入 `sync-queue`。

是否同意这个方案？

**用户**：同意，开始实现。先做 InboxPage 和 InboxList 的基础结构。

**AI（编码实现）**：

```ts
// features/workspace/inbox/InboxPage.tsx
// 左右分栏布局：左侧列表 + 右侧预览

import { useState } from 'react'
import { InboxList } from './InboxList'
import { InboxPreview } from './InboxPreview'
import { InboxToolbar } from './InboxToolbar'
import { useInboxBookmarks } from './hooks'
import type { Bookmark } from '@/types/bookmark'

export function InboxPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const { bookmarks, markAs } = useInboxBookmarks()

  const selectedBookmark = bookmarks.find(b => b.id === selectedId)

  return (
    <div className="flex h-full">
      <div className="flex flex-col border-r" style={{ width: 360 }}>
        <InboxList
          bookmarks={bookmarks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMark={markAs}
        />
        <InboxToolbar
          total={bookmarks.length}
          onSelectAll={handleSelectAll}
          onEnterPhaseTwo={handleEnterPhaseTwo}
        />
      </div>
      <InboxPreview bookmark={selectedBookmark} />
    </div>
  )
}
```

**用户**：Review 通过。测试一下——点击保留按钮后，列表应该实时移除该条目。

**AI（验证）**：

```
验证步骤：
1. 启动 dev server
2. 收藏 3 条书签（确保它们出现在待处理列表）
3. 点击第一条的"保留"按钮
4. 确认：该条目从列表消失，右侧预览自动切换到下一条
5. 底部统计从 "3 未处理" 变为 "2 未处理"
6. 检查 IndexedDB：该书签的 status 仍为 unread（阶段一只是标记保留，不改状态）
7. 检查 operation_log：记录了一条"标记保留"操作
```

**用户**：验证通过，提交代码。

```
git add features/workspace/inbox/
git commit -m "feat(inbox): implement phase-1 triage with list, preview and toolbar"
```

---

### 第四篇快速参考卡

- [ ] Phase 1 是否拆分为 3-4 个可独立验证的子里程碑？
- [ ] 每个里程碑的功能清单是否有对应的验证方式？
- [ ] 模块拆分是否遵循单一职责原则？
- [ ] 项目目录结构是否按功能模块组织？
- [ ] AI 协作是否遵循六步循环（目标→讨论→编码→审查→验证→提交）？
- [ ] 每个里程碑结束后是否确保 main 分支可运行？

---

## 第五篇：测试与部署

本篇展示如何进行验收检查和部署上线。
对应文档体系：07-测试与质量、10-部署与环境、12-健康检查

### 第九章：验收检查

#### 9.1 功能验收示例

以 DogEar 的"收藏书签"功能为例，展示功能验收清单：

**验收场景**：AI 通过 Skill API 收藏一个链接

| 检查项 | 期望结果 | 状态 |
|--------|----------|------|
| AI 调用 save_bookmark 端点 | 返回 200 + 书签数据 | |
| 书签出现在 IndexedDB | id/url/title/tags 正确 | |
| 书签出现在工作台列表 | 标题和标签正确显示 | |
| 状态默认为"未读" | `_status:unread` 标签存在 | |
| 进入待处理队列 | 整理模式能看到该书签 | |
| AI 自动分类 | 文件夹和标签有建议值 | |
| 30 秒后同步到 Raindrop | Raindrop 中能找到该书签 | |
| 收藏重复 URL | 返回已有书签，不重复创建 | |
| 收藏无效 URL | 返回 VALIDATION_ERROR | |
| 网络断开时收藏 | 本地保存成功，同步队列待同步 | |

**验收场景**：整理模式分拣

| 检查项 | 期望结果 | 状态 |
|--------|----------|------|
| 点击"保留" | 书签从列表移除，统计更新 | |
| 点击"删除" | 书签标记软删除，从列表移除 | |
| 点击"待定" | 书签标记待定，移至列表底部 | |
| 全部处理完毕 | 显示 Inbox Zero 提示 | |
| 操作可撤销 | 底部出现撤销提示条 | |
| 键盘 Enter/E/D/S | 与按钮操作效果一致 | |
| ← → 切换 | 左右方向键切换选中项 | |

#### 9.2 体验验收示例

以 DogEar 的整理模式为例，展示体验验收清单：

| 检查项 | 期望结果 | 状态 |
|--------|----------|------|
| 页面加载 | 首屏 < 1s，列表 < 2s | |
| 列表滚动 | 500+ 条书签滚动流畅，无卡顿 | |
| 卡片操作反馈 | 点击按钮后 < 200ms 响应 | |
| 预览面板切换 | 切换书签后预览立即更新 | |
| 键盘操作 | 所有快捷键响应及时 | |
| 空状态 | 无待处理时展示友好提示 | |
| 移动端适配 | 虽然不做移动端，但大屏平板上可用 | |

### 第十章：健康检查

#### 10.1 代码审查示例

以 DogEar 的同步引擎为例，展示代码审查要点：

**审查维度一：文件体积**

| 文件 | 行数 | 是否达标 | 备注 |
|------|------|----------|------|
| `sync-engine.ts` | 280 | ✅ | 接近 300 行限制，后续可能需要拆分 |
| `sync-engine.test.ts` | 150 | ✅ | — |
| `conflict-resolver.ts` | 180 | ✅ | — |

**审查维度二：依赖层级**

```
检查项：
- sync-engine.ts 是否 import 了 components/ 下的组件？
  → 否 ✅（业务层不依赖 UI 层）
- sync-engine.ts 是否 import 了 utils/ 下的函数？
  → 是，import 了 date.ts 和 queue.ts ✅（业务层可以依赖工具层）
- conflict-resolver.ts 是否直接操作了 IndexedDB？
  → 否 ✅（通过 data-layer 模块间接操作）
```

**审查维度三：错误处理**

```
检查项：
- 网络请求是否有 try-catch？
  → 是 ✅
- 重试逻辑是否有最大次数限制？
  → 是，MAX_RETRY_COUNT = 3 ✅
- 限频响应是否按 Retry-After 等待？
  → 是 ✅
- 是否有可能导致死循环的逻辑？
  → 重试有上限，轮询有间隔，不会 ✅
```

**审查维度四：类型安全**

```
检查项：
- 是否使用了 any？
  → 搜索结果：0 处 any ✅
- 函数参数和返回值是否有类型？
  → 是 ✅
- SyncQueueItem 的 status 是否用枚举约束？
  → 是，type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' ✅
```

#### 10.2 安全检查示例

以 DogEar 的 Skill API 为例，展示安全检查清单：

| 检查项 | 结果 | 说明 |
|--------|------|------|
| 认证 | ✅ Bearer Token 认证 | 所有 API 端点需要 Token |
| AI 操作边界 | ✅ 禁止删除操作 | AI 调用 delete 返回 403 |
| 限速 | ✅ 每分钟 60 次 | 超限返回 429 |
| Token 存储 | ✅ 本地加密存储 | 不明文写入文件 |
| 输入校验 | ✅ URL 格式校验 | 无效 URL 返回 400 |
| 操作日志 | ✅ 所有写操作记录 | 支持审计和回滚 |
| 软删除 | ✅ 7 天保留期 | 过期自动清理 |
| CORS | ✅ 仅允许本地和 Tailscale 地址 | 不允许任意来源 |

### 第十一章：部署方案

#### 11.1 DogEar 的部署决策

需求说明书中列出了三种部署方案：本地 Docker、云服务器、Serverless。DogEar 选择**本地 Docker + Tailscale**，理由如下：

| 方案 | 优势 | 劣势 | DogEar 适用度 |
|------|------|------|--------------|
| 本地 Docker | 完全控制、零运维成本 | 仅本机/内网可用 | ⭐⭐⭐⭐ |
| 云服务器 | 公网可访问 | 需要付费、安全风险 | ⭐⭐ |
| Serverless | 无服务器管理 | 有冷启动、不适合长期运行的同步引擎 | ⭐⭐ |
| 本地 Docker + Tailscale | 安全、免费、可远程访问 | 需要安装 Tailscale | ⭐⭐⭐⭐⭐ |

**Tailscale 方案优势**：
- 零公网暴露，安全风险最低
- 免费额度足够个人使用
- 跨设备（手机/平板）也能通过 Tailscale 访问工作台
- 同步引擎在本地运行，不受 Serverless 超时限制

#### 11.2 部署检查清单

DogEar 上线前的检查项：

**Docker 部署**：

- [ ] `docker-compose.yml` 配置完整（前端 + 后端 + 数据目录挂载）
- [ ] 环境变量通过 `.env` 文件管理（Raindrop Token、API Token）
- [ ] `.env` 文件已加入 `.gitignore`
- [ ] 数据目录（IndexedDB 持久化）挂载到宿主机
- [ ] 健康检查端点返回正常状态

**Tailscale 配置**：

- [ ] Tailscale 已安装并登录
- [ ] Docker 容器通过 Tailscale 网络暴露
- [ ] Skill API 的 Base URL 配置为 Tailscale 内网地址
- [ ] AI 平台绑定时使用 Tailscale 地址 + Token

**安全检查**：

- [ ] 服务不暴露到公网
- [ ] Token 使用强随机生成
- [ ] 操作日志正常记录
- [ ] 软删除清理任务正常运行
- [ ] 无敏感信息出现在日志中

**功能验证**：

- [ ] 首次启动自动初始化 IndexedDB
- [ ] 首次启动引导用户配置 Raindrop Token
- [ ] 收藏→同步→工作台浏览 完整流程通过
- [ ] 整理模式→分拣→同步 完整流程通过
- [ ] 导出功能四种格式均可正常生成

---

### 第五篇快速参考卡

- [ ] 功能验收是否覆盖了正常流程和异常流程？
- [ ] 体验验收是否覆盖了性能指标（首屏/滚动/响应时间）？
- [ ] 代码审查是否检查了文件体积、依赖层级、错误处理、类型安全？
- [ ] 安全检查是否覆盖了认证、操作边界、限速、输入校验、日志？
- [ ] 部署配置是否包含环境变量管理和数据持久化？
- [ ] 上线前是否完整走通了核心流程？

---

## 第六篇：经验总结

### 第十二章：关键决策回顾

#### 12.1 决策记录

DogEar 项目中的关键决策及其理由：

| 决策 | 选择 | 理由 | 替代方案 |
|------|------|------|----------|
| 数据底层 | Raindrop API | 用户已有的数据存储，多平台可取 | 自建后端数据库 |
| 本地数据层 | IndexedDB + Dexie.js | 浏览器原生、离线可用、TypeScript 友好 | localStorage（容量小）、IndexedDB 裸 API（复杂） |
| 同步策略 | 本地优先 + 异步同步 | 操作即时响应，不被网络延迟阻塞 | 实时同步（受 Raindrop 限频影响） |
| 冲突处理 | 默认以本地为准 | 个人工具，用户总是对的 | 时间戳优先（可能丢失用户意图） |
| AI 解耦 | Skill API + 自描述 | 不绑定特定 AI 平台，任何 AI 都能接入 | 硬编码 AI 接口 |
| 多维度数据 | 标签约定前缀 | 兼容 Raindrop 标签系统，无需修改 Raindrop | 新建自定义字段（Raindrop 不支持） |
| 前端框架 | React + Vite | 生态成熟、AI 协作友好 | Vue（生态略小）、Next.js（过重） |
| 部署方式 | 本地 Docker + Tailscale | 安全、免费、可远程访问 | 云服务器（成本高）、Serverless（不适合长期运行） |
| 组件库 | shadcn/ui | 轻量可定制、无运行时开销 | Ant Design（过重）、Material UI（风格不符） |
| 整理模式 | 两阶段分拣 | 先筛"留不留"再筛"怎么放"，认知负担低 | 一步到位（选项过多，容易遗漏） |

#### 12.2 常见陷阱

从 DogEar 项目中总结的常见陷阱和规避方法：

| 陷阱 | 表现 | 规避方法 |
|------|------|----------|
| 范围蔓延 | Phase 1 功能越加越多，从"打通流程"变成"做完整个应用" | 严格按 MoSCoW 排序，MUST 功能之外的一律延后 |
| 过早优化 | 第一版就考虑多设备同步、并发锁、缓存策略 | 遵循渐进式复杂度原则，先跑通再优化 |
| 需求冲突未识别 | 开发到一半才发现"本地优先"和"多平台可取"有矛盾 | 启动前完成需求冲突识别，形成明确的解决思路 |
| AI 协作失控 | 一次性让 AI "做一个完整的工作台"，产出大量不可控代码 | 使用六步开发循环，每步有明确目标和验证标准 |
| 标签约定混乱 | 标签前缀不统一，和用户自定义标签混淆 | 定义标签约定文档，前缀统一使用下划线 `_` |
| 同步引擎过度设计 | 第一版就实现双向冲突合并、操作变换、CRDT | 第一版只做"本地→Raindrop 推送 + Raindrop→本地 拉取"，冲突以本地为准 |
| 忽略空状态 | 功能正常时体验好，但无数据时界面空白一片 | 设计阶段就列出所有空状态场景并设计引导 |

#### 12.3 可复用模式

从 DogEar 项目中提炼的可复用模式：

**模式一：标签约定扩展维度**

当底层数据平台不支持自定义字段时，通过标签前缀约定实现多维度数据：

```
约定格式：_{维度}:{值}
示例：_status:unread、_scene:learning、_priority:high
规则：
- 前缀统一使用下划线 _，与用户标签区分
- 每个维度一个前缀，值用英文
- 在读取时过滤前缀标签，在 UI 层映射为可读名称
```

**模式二：本地优先 + 异步同步架构**

适用于需要离线可用且操作流畅的个人工具：

```
架构要点：
1. 所有写操作先写本地存储，即时响应用户
2. 变更写入同步队列
3. 后台引擎按限频策略逐条推送
4. 定时拉取远端变更，合并到本地
5. 冲突处理默认以本地为准
6. 提供操作日志支持回滚
```

**模式三：AI 自描述能力接口**

适用于需要让任意 AI 平台接入的 Skill API：

```
实现要点：
1. 提供 /.well-known/capabilities 端点
2. 返回完整的能力清单（名称、描述、参数、示例）
3. 附带限速策略信息
4. AI 通过链接自动发现能力，无需用户手动配置
5. 统一的请求/响应格式
```

**模式四：两阶段分拣**

适用于 Inbox Zero 类的待处理队列整理场景：

```
流程设计：
阶段一：筛选（保留/删除/待定）
- 目标：快速过滤掉不需要的条目
- 操作：轻量级，一键选择
- 输出：保留列表 + 待定列表

阶段二：分类（采纳建议/修改）
- 目标：为保留的条目分配分类
- 操作：参考 AI 建议，批量采纳或逐条修改
- 输出：所有保留条目完成分类收纳
```

---

### 快速参考卡

- [ ] 是否记录了项目中的所有关键决策及其理由？
- [ ] 是否识别并规避了常见陷阱（范围蔓延、过早优化、需求冲突、AI 失控）？
- [ ] 是否从项目中提炼了可复用的模式（标签约定、本地优先、自描述接口、两阶段分拣）？
- [ ] 决策记录是否在项目文档中可追溯？

---

## 附录：DogEar 项目文档索引

| 编号 | 文档 | DogEar 中的应用 |
|------|------|----------------|
| 00 | 导读与项目概述 | DogEar 项目上下文文件的编写依据 |
| 01 | 开发规范与工程原则 | 代码组织、命名、类型、注释规范 |
| 02 | 数据库设计与数据模型 | Bookmark/SyncQueue/OperationLog 表设计 |
| 03 | API与接口设计 | Skill API 端点、Raindrop 集成、错误处理 |
| 04 | 组件设计规范 | 原子设计层级、组件清单、技术选型 |
| 05 | 用户体验设计指南 | 信息架构、状态设计、空状态处理 |
| 06 | AI协作开发指南 | 需求讨论、开发循环、模块拆分 |
| 07 | 测试与质量保障 | 功能验收、体验验收清单 |
| 08 | 安全与容错设计 | AI 操作边界、软删除、操作日志 |
| 09 | 性能与缓存策略 | 首屏加载、列表滚动、同步引擎性能 |
| 10 | 部署与环境管理 | Docker + Tailscale 部署方案 |
| 11 | 开发里程碑计划 | Phase 1 拆分为 M1-M4 四个子里程碑 |
| 12 | 健康检查清单 | 代码审查、安全检查、部署前验证 |
| 13 | 最佳实践案例（本文） | DogEar 项目的全流程实践记录 |
