# DogEar 项目上下文

> 本文件用于每次新对话开始时让 AI 快速理解项目背景。请在对话开始时将本文件内容作为上下文提供。

---

## 项目背景

DogEar（折耳书签）是一个基于 Raindrop.io 的个人书签增强工具。

- **定位**：以 Raindrop 为数据底层，通过 Skill API + 工作台 + 个人导航页三部分构建书签管理闭环
- **核心理念**：本地优先、AI 能力以 Skill 形式暴露、纯个人工具、安全隐私优先
- **目标用户**：个人用户（自用），有大量书签收藏和整理需求

## 技术栈

| 类别 | 技术选型 |
|------|----------|
| 前端框架 | React + TypeScript + Vite |
| 样式方案 | Tailwind CSS |
| 本地数据库 | Dexie.js（IndexedDB 封装） |
| 状态管理 | Zustand |
| 构建工具 | Vite + pnpm workspace + Turborepo |
| 后端服务 | Node.js + Hono |
| 数据同步 | Raindrop.io API |
| 浏览器插件 | Manifest V3 |

## 项目结构概要

```
dogear/
├── apps/
│   ├── web/              # 工作台（React Web App）
│   ├── extension/        # 导航页（浏览器插件）
│   └── server/           # Skill API 服务端
├── packages/
│   ├── shared/           # 共享类型和工具
│   └── db/               # 数据库层（Dexie.js）
└── docs/                 # 项目文档
```

## 核心规范

- 单文件不超过 300 行
- 新组件前检查组件清单（`docs/COMPONENTS.md`）
- 数据库变更前更新数据模型文档（`docs/DATA_MODEL.md`）
- 所有变更记录到 `CHANGELOG.md`
- 不使用 `any` 类型
- 函数参数和返回值必须有类型定义

## 当前阶段

**Phase 1 — 核心闭环开发中**

## 已有文档索引

| 文档 | 说明 |
|------|------|
| `01-需求说明书.md` | 产品需求文档 |
| `02-最佳实践案例.md` | 全流程最佳实践 |
| `docs/DESIGN.md` | 技术设计文档 |
| `docs/API.md` | API 接口清单 |
| `docs/DATA_MODEL.md` | 数据库设计 |
| `docs/COMPONENTS.md` | 组件注册表 |
| `docs/MILESTONES.md` | 里程碑计划 |
| `CHANGELOG.md` | 变更日志 |
| `docs/DEPLOY.md` | 部署指南 |
| `docs/HEALTH_CHECK.md` | 健康检查记录 |
