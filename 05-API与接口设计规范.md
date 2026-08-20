========================================
05 · API与接口设计规范
========================================

版本：v1.0
日期：2026-08-21
适用范围：项目的外部接口与内部数据层接口
所属阶段：全生命周期 · 开发规范

---

## 0.1 本章解决什么问题

接口是系统各部分协作的契约。契约不清晰将导致联调失败、错误被吞、外部对接困难、字段变更波及全部调用方。本章规范对外接口（RESTful）与内部数据层接口（TypeScript 函数）的设计，并统一错误处理模型。

---

## 第一篇：对外接口设计

### 1.1 URL 设计

- 资源以名词表示，不以动词命名：`/api/bookmarks` 而非 `/api/getBookmarks`；
- 集合与单体：`/api/bookmarks`、`/api/bookmarks/:id`；
- 层级关系：`/api/folders/:id/bookmarks`。

### 1.2 HTTP 方法

| 方法 | 语义 | 示例 |
|------|------|------|
| GET | 获取 | `GET /api/bookmarks` |
| POST | 创建 | `POST /api/bookmarks` |
| PATCH | 局部更新 | `PATCH /api/bookmarks/:id` |
| PUT | 整体替换 | 较少使用 |
| DELETE | 删除 | `DELETE /api/bookmarks/:id` |

### 1.3 查询参数

筛选条件以查询参数表达；分页采用 `limit` + `offset` 或 `page` + `pageSize`：

```
GET /api/bookmarks?status=unread&folderId=3&limit=20&offset=0
```

### 1.4 统一响应结构

所有接口采用同构响应，便于调用方统一解析：

**成功**：
```json
{ "ok": true, "data": [...], "meta": { "total": 100, "limit": 20, "offset": 0, "hasMore": true } }
```

**错误**：
```json
{ "ok": false, "error": { "code": "VALIDATION_ERROR", "message": "url 字段不能为空" } }
```

### 1.5 状态码

| 状态码 | 语义 |
|--------|------|
| 200 / 201 | 成功 / 创建成功 |
| 400 | 参数错误 |
| 401 / 403 | 未认证 / 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（重复创建等） |
| 429 | 超出限速 |
| 500 | 服务端错误 |

### 1.6 向前兼容

- 新增字段不要求调用方变更；
- 删除或重命名字段须版本化（如 `/api/v2/...`）；
- 不得破坏既有调用方。

---

## 第二篇：内部数据层接口

前端与本地数据层（如 IndexedDB）以 TypeScript 函数调用，仍需明确契约。

### 2.1 模块组织

每个实体一个模块（`lib/db/bookmarks.ts` 等），导出标准 CRUD 函数。

### 2.2 CRUD 模板

```ts
getItems(filter?: ItemFilter): Promise<Item[]>
getItemById(id: number): Promise<Item | null>
createItem(input: CreateItemInput): Promise<Item>
updateItem(id: number, input: UpdateItemInput): Promise<Item>
softDeleteItem(id: number): Promise<void>
restoreItem(id: number): Promise<void>
```

### 2.3 Input 类型设计

- `CreateXxxInput`：必填字段为 required，可选为 optional；
- `UpdateXxxInput`：全部字段 optional（仅更新传入字段）。

**范例**：
```ts
createBookmark(input: CreateBookmarkInput): Promise<Bookmark>
updateBookmark(id: number, input: UpdateBookmarkInput): Promise<Bookmark>
searchBookmarks(query: string): Promise<Bookmark[]>
```

---

## 第三篇：错误处理

### 3.1 错误分类

| 类型 | 定义 | 处理策略 |
|------|------|---------|
| 业务错误 | 违反业务规则 | 返回明确信息，指导修正 |
| 系统错误 | 基础设施故障 | 重试 + 降级 + 通知 |
| 外部依赖错误 | 第三方不可用 | 退避重试 + 降级 + 日志 |

### 3.2 三层处理模型

```
数据层：抛出带语义的错误，不吞掉
Hooks 层：捕获并转换为 UI 状态（loading/error/data）
组件层：按错误状态渲染，可恢复时提供重试
```

### 3.3 自定义错误类型

```ts
class AppError extends Error {
  code: string
  recoverable: boolean
}
class ValidationError extends AppError {}
class DatabaseError extends AppError {}
class SyncError extends AppError {}
```

数据层抛出具体子类；组件层依据 `recoverable` 决定是否提供重试入口。

---

## 第四篇：AI 协作要点

### 4.1 接口约束提示词

> 对外接口遵循 RESTful，返回统一结构 {ok, data, meta/error}；内部数据层按 CRUD 模板导出函数，输入输出必须有类型；错误以 AppError 子类分类抛出。

### 4.2 常见偏差

| 偏差 | 纠正 |
|------|------|
| 响应结构不一 | 统一为 {ok, data, meta/error} |
| 吞掉错误 | 抛出具体 AppError |
| 动词命名 URL | 改为资源名词 + 正确方法 |
| 接口无类型 | 补齐输入/返回类型 |

---

## 快速参考卡

- ✅ 对外：RESTful（名词 URL、正确方法、统一响应结构、状态码规范）。
- ✅ 对内：每实体一模块，标准 CRUD + Input 类型。
- ✅ 错误：三分类；三层处理（抛→捕→展）；AppError 子类。
- ✅ 向前兼容：加字段不破调用，删字段走版本。
- ⛔ 不采用动词 URL；不吞错误；不输出无类型接口。
