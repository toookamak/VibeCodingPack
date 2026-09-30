# API 与接口设计

- **日期**：2026-08-21
- **版本**：v1.0
- **适用范围**：适用于前后端协作的 Web 应用项目，覆盖外部 API（前后端通信）和内部接口（模块间调用）的设计规范。本文使用通用场景示例，不绑定特定项目。

---

## 第一篇：外部 API 设计

外部 API 是前端与后端通信的契约。设计良好的 API 让前后端可以并行开发，减少沟通成本；设计糟糕的 API 则会导致反复返工和隐性 bug。

### 第一章：RESTful API 规范

#### 1.1 通用原则

设计外部 API 时遵循四个核心原则：

| 原则 | 含义 | 示例 |
|------|------|------|
| **接口自解释** | 看 URL 和方法就能知道这个接口做什么 | `GET /api/orders/123` 获取订单 123 |
| **一致性** | 同类资源用相同的模式 | 所有列表接口都用同样的分页参数 |
| **最小暴露** | 只返回调用方需要的字段 | 列表接口不返回详情页才用的大段文本 |
| **向前兼容** | 新版本不能破坏旧客户端 | 新增字段可以，删除字段需要版本控制 |

#### 1.2 URL 设计

**核心规则：资源用名词，不用动词。** HTTP 方法本身就是动词。

**资源命名**：

| 规则 | 示例 |
|------|------|
| 用复数名词表示集合 | `/api/articles`（不是 `/api/article`） |
| 用 `/{id}` 表示单个资源 | `/api/articles/42` |
| 嵌套表示从属关系 | `/api/articles/42/comments` |
| 扁平化表示独立资源 | `/api/comments`（评论也可以独立查询） |

**URL 层级设计**：

```
/api/{version}/{resource}                    # 资源集合
/api/{version}/{resource}/{id}               # 单个资源
/api/{version}/{resource}/{id}/{sub-resource} # 子资源
```

> **示例——博客平台场景**：
>
> ```
> /api/v1/articles            # 文章列表
> /api/v1/articles/42         # 文章 42 的详情
> /api/v1/articles/42/comments # 文章 42 的评论列表
> /api/v1/categories          # 分类列表
> /api/v1/users/7/profile     # 用户 7 的个人资料
> ```

**避免的写法**：

| 避免 | 原因 | 正确写法 |
|------|------|----------|
| `/api/getArticles` | 动词不应出现在 URL 中 | `GET /api/articles` |
| `/api/article/42` | 单数名词不一致 | `/api/articles/42` |
| `/api/articles/delete/42` | 用 HTTP 方法表达动作 | `DELETE /api/articles/42` |

#### 1.3 HTTP 方法

每种 HTTP 方法对应一种操作语义：

| 方法 | 语义 | 示例 | 幂等 |
|------|------|------|------|
| **GET** | 获取资源 | `GET /api/articles` | 是 |
| **POST** | 创建资源 | `POST /api/articles` | 否 |
| **PATCH** | 部分更新资源 | `PATCH /api/articles/42` | 否 |
| **PUT** | 整体替换资源 | `PUT /api/articles/42` | 是 |
| **DELETE** | 删除资源 | `DELETE /api/articles/42` | 是 |

**什么时候用 PATCH vs PUT**：

- **PATCH**：只修改部分字段（例如只改标题，不动正文）。前端传什么就更新什么。
- **PUT**：整体替换（例如表单提交了完整的文章内容）。未传的字段会被置为空或默认值。

实际项目中 PATCH 使用频率远高于 PUT，大部分更新场景都适合用 PATCH。

#### 1.4 查询参数

列表接口通常需要筛选、分页、排序能力，这些通过查询参数实现：

**分页参数**：

```
GET /api/articles?page=1&pageSize=20
```

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码，从 1 开始 |
| `pageSize` | number | 20 | 每页条数，最大 100 |

**筛选参数**：

```
GET /api/articles?status=published&category=tech
```

筛选参数直接用字段名命名，值为要筛选的值。多个条件取交集。

**排序参数**：

```
GET /api/articles?sort=created_at&order=desc
```

| 参数 | 类型 | 说明 |
|------|------|------|
| `sort` | string | 排序字段名 |
| `order` | `'asc'` \| `'desc'` | 升序或降序，默认 `desc` |

**搜索参数**：

```
GET /api/articles?q=TypeScript
```

`q` 是通用搜索参数，在后端对标题、正文等字段做模糊匹配。

#### 1.5 响应结构

所有接口使用统一的响应结构，让前端可以用同一套逻辑处理所有返回：

**成功响应**：

```json
{
  "ok": true,
  "data": {
    "items": [...],
    "total": 156,
    "page": 1,
    "pageSize": 20
  }
}
```

**单条资源的成功响应**：

```json
{
  "ok": true,
  "data": {
    "id": 42,
    "title": "TypeScript 入门",
    "status": "published",
    "createdAt": "2026-08-20T10:00:00Z"
  }
}
```

**错误响应**：

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "标题不能为空",
    "details": [
      { "field": "title", "message": "必填字段" }
    ]
  }
}
```

**设计要点**：

- `ok` 字段让前端可以用 `if (result.ok)` 做统一判断，无需检查 HTTP 状态码
- `data` 字段承载业务数据，成功时始终存在
- `error` 字段承载错误信息，失败时始终存在
- 列表响应包含分页元数据（`total`、`page`、`pageSize`）

#### 1.6 状态码

常用 HTTP 状态码一览：

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| **200** | OK | GET 成功、PATCH 成功、PUT 成功 |
| **201** | Created | POST 创建资源成功 |
| **204** | No Content | DELETE 删除成功，无需返回 body |
| **400** | Bad Request | 请求参数错误（表单校验失败等） |
| **401** | Unauthorized | 未登录或 token 过期 |
| **403** | Forbidden | 已登录但无权限 |
| **404** | Not Found | 资源不存在 |
| **409** | Conflict | 资源冲突（例如重复创建） |
| **422** | Unprocessable Entity | 参数格式正确但语义错误（例如日期范围无效） |
| **429** | Too Many Requests | 请求频率超限 |
| **500** | Internal Server Error | 服务器内部错误 |

**使用规则**：

- 前 4 类错误（4xx）由客户端引起，后端应返回明确的错误信息
- 第 5 类错误（5xx）是服务端问题，前端只需展示通用提示
- 业务错误（如"余额不足"）优先用 400/422 + 自定义 error code，不要都返回 500

#### 1.7 API 响应结构示意图

```
┌──────────┐          ┌──────────────────────────────────────┐          ┌──────────┐
│          │  HTTP    │                                      │  HTTP    │          │
│  前端    │ ──────►  │           后端 API 服务              │ ──────►  │  前端    │
│  (组件)  │  Request │                                      │ Response │  (组件)  │
│          │          │                                      │          │          │
└──────────┘          └──────────────────────────────────────┘          └──────────┘
                                                                        │
     1. 发起请求                                                        │
     GET /api/v1/articles?page=1&pageSize=20                            │
     Header: Authorization: Bearer <token>                              │
                                                                        ▼
                                                              ┌─────────────────┐
                                                              │  统一响应结构    │
                                                              ├─────────────────┤
                                                              │                 │
     2. 成功响应 ◄─────────────────────────────────────────────│  {              │
     {                                                        │    "ok": true,  │
       "ok": true,                                            │    "data": {…}  │
       "data": { "items": [], "total": 156 }                 │  }              │
     }                                                        │                 │
                                                              │  ─ 或 ─         │
                                                              │                 │
     3. 错误响应 ◄─────────────────────────────────────────────│  {              │
     {                                                        │    "ok": false, │
       "ok": false,                                           │    "error": {…} │
       "error": { "code": "...", "message": "..." }          │  }              │
     }                                                        │                 │
                                                              └─────────────────┘
```

**请求-响应的数据流**：

```
前端组件 ──► Hook ──► API 函数 ──► fetch/axios ──► 后端路由 ──► 数据层
                                                              │
前端组件 ◄── Hook ◄── API 函数 ◄── fetch/axios ◄── 后端路由 ◄──┘
```

---

### 第一篇快速参考卡

**URL 设计**：

- [ ] 资源用复数名词（`/articles`，不是 `/article`）
- [ ] 不在 URL 中放动词（用 HTTP 方法表达动作）
- [ ] 嵌套不超过两层（`/articles/42/comments`）

**HTTP 方法**：

- [ ] GET 获取，POST 创建，PATCH 部分更新，DELETE 删除
- [ ] 大部分更新场景用 PATCH，而非 PUT

**查询参数**：

- [ ] 分页用 `page` + `pageSize`
- [ ] 排序用 `sort` + `order`
- [ ] 搜索用 `q`

**响应结构**：

- [ ] 统一用 `{ ok, data, error }` 结构
- [ ] 列表响应包含分页元数据
- [ ] 状态码与业务语义匹配（201 创建成功，204 删除成功）

---

## 第二篇：内部接口设计

内部接口是模块之间通信的契约。与外部 API 不同，内部接口运行在同一进程中，不需要网络传输和序列化，但同样需要规范——因为它是代码组织质量的直接体现。

### 第二章：数据层接口规范

#### 2.1 模块接口标准

每个实体模块都应提供标准的 CRUD 接口。无论项目用什么技术栈，以下接口模式都适用：

**标准接口列表**：

| 接口 | 功能 | 参数 | 返回值 |
|------|------|------|--------|
| `getXxxById` | 获取单条 | `id` | 实体或 null |
| `getXxxList` | 获取列表 | `filter?` | 实体数组 |
| `createXxx` | 创建 | `CreateXxxInput` | 新实体 |
| `updateXxx` | 更新 | `id` + `UpdateXxxInput` | 更新后的实体 |
| `deleteXxx` | 删除 | `id` | `void` |

**流程关系**：

```
  ┌─────────────┐
  │  组件层     │  用户交互触发操作
  └──────┬──────┘
         │ 调用
  ┌──────▼──────┐
  │  Hooks 层   │  状态管理、loading/error 处理
  └──────┬──────┘
         │ 调用
  ┌──────▼──────┐
  │  数据层     │  实际数据操作（数据库/API）
  └──────┬──────┘
         │ 返回
  ┌──────▼──────┐
  │  Hooks 层   │  更新状态
  └──────┬──────┘
         │ 返回
  ┌──────▼──────┐
  │  组件层     │  重新渲染
  └─────────────┘
```

#### 2.2 Input 类型设计

创建和更新操作分别使用不同的 Input 类型，因为两者的必填/可选字段天然不同。

**CreateInput 设计原则**：

- 只包含创建时必须提供的字段
- 不包含自动生成的字段（`id`、`createdAt`、`updatedAt`）
- 字段都是必填的（除非有合理的默认值）

**UpdateInput 设计原则**：

- 所有字段都是可选的（`Partial`）
- 只包含允许用户修改的字段
- 不包含只读字段（`id`、`createdAt`）

> **示例——电商后台场景**：文章实体的 Input 类型设计：
>
> ```ts
> // CreateInput：发布文章时需要提供的字段
> interface CreateArticleInput {
>   title: string        // 必填
>   content: string      // 必填
>   categoryId: number   // 必填
>   tags?: string[]      // 可选
> }
>
> // UpdateInput：编辑文章时可以修改的字段
> interface UpdateArticleInput {
>   title?: string       // 可选
>   content?: string     // 可选
>   categoryId?: number  // 可选
>   tags?: string[]      // 可选
>   status?: ArticleStatus // 可选
> }
> ```
>
> 注意：`CreateInput` 中没有 `status`（创建时默认为 `draft`），`UpdateInput` 中有 `status`（可以发布/撤回）。

#### 2.3 接口命名规范

函数命名遵循"动词 + 实体名"的模式：

| 操作 | 命名模式 | 示例 |
|------|----------|------|
| 获取单条 | `get{Entity}ById` | `getArticleById(42)` |
| 获取列表 | `get{Entity}List` | `getArticleList(filter)` |
| 创建 | `create{Entity}` | `createArticle(input)` |
| 更新 | `update{Entity}` | `updateArticle(id, input)` |
| 删除 | `delete{Entity}` | `deleteArticle(id)` |
| 检查存在 | `{entity}Exists` | `articleExists(42)` |
| 批量操作 | `batch{Action}{Entity}` | `batchDeleteArticles(ids)` |

**命名规则**：

- 实体名使用单数形式（`article`，不是 `articles`）
- 动词使用通用动词，不用特定技术术语（`get`，不是 `fetch`/`query`/`select`）
- 所有函数使用 camelCase

#### 2.4 代码示例

以下是一个完整的数据层接口定义示例：

```ts
// types/article.ts
interface Article {
  id: number
  title: string
  content: string
  categoryId: number
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  createdAt: string
  updatedAt: string
}

type ArticleStatus = Article['status']

interface ArticleFilter {
  status?: ArticleStatus
  categoryId?: number
  search?: string
  dateRange?: { start: string; end: string }
}

interface CreateArticleInput {
  title: string
  content: string
  categoryId: number
  tags?: string[]
}

interface UpdateArticleInput {
  title?: string
  content?: string
  categoryId?: number
  tags?: string[]
  status?: ArticleStatus
}

// lib/db/articles.ts
import type { Article, ArticleFilter, CreateArticleInput, UpdateArticleInput } from '@/types/article'

/** 获取单篇文章 */
function getArticleById(id: number): Article | null { /* ... */ }

/** 获取文章列表 */
function getArticleList(filter?: ArticleFilter): Article[] { /* ... */ }

/** 创建文章 */
function createArticle(input: CreateArticleInput): Article { /* ... */ }

/** 更新文章 */
function updateArticle(id: number, input: UpdateArticleInput): Article { /* ... */ }

/** 删除文章 */
function deleteArticle(id: number): void { /* ... */ }

export {
  getArticleById,
  getArticleList,
  createArticle,
  updateArticle,
  deleteArticle,
}
```

**要点**：

- 类型定义和实现分开（`types/` 和 `lib/`）
- 每个函数都有参数类型和返回值类型
- 每个公开函数都有 JSDoc 注释
- 通过 `index.ts` 统一导出，外部不直接引用内部文件

---

### 第二篇快速参考卡

**接口标准**：

- [ ] 每个实体模块提供 5 个标准 CRUD 接口
- [ ] `getXxxById`、`getXxxList`、`createXxx`、`updateXxx`、`deleteXxx`

**Input 类型**：

- [ ] `CreateInput`：只有创建时需要的字段，不含自动生成字段
- [ ] `UpdateInput`：所有字段可选（`Partial`），不含只读字段

**命名**：

- [ ] 动词 + 实体名（`getArticleById`）
- [ ] 实体用单数，函数用 camelCase

**代码组织**：

- [ ] 类型定义在 `types/`，实现在 `lib/`
- [ ] 模块入口 `index.ts` 统一导出
- [ ] 函数参数和返回值必须有类型

---

## 第三篇：错误处理

错误处理是 API 设计中最容易被忽视、也最容易出问题的部分。健壮的错误处理体系能防止一个小错误导致整个应用崩溃。

### 第三章：错误处理体系

#### 3.1 自定义错误类型

不要到处用通用的 `Error`，为不同的错误场景定义专门的错误类型：

**错误类型层次**：

```
AppError（基础错误类型）
├── ValidationError     — 数据校验失败
├── NotFoundError       — 资源不存在
├── PermissionError     — 权限不足
├── ConflictError       — 资源冲突（重复创建等）
├── NetworkError        — 网络请求失败
├── ExternalApiError    — 第三方 API 调用失败
└── UnknownError        — 未知错误（兜底）
```

**每个错误类型的结构**：

```ts
interface AppError {
  type: string          // 错误类型标识
  message: string       // 用户可读的错误信息
  code: string          // 机器可读的错误码
  details?: unknown     // 附加信息（如字段级校验错误）
}
```

**使用示例**：

```ts
// 校验失败
throw new ValidationError({
  message: '表单填写有误',
  details: [
    { field: 'title', message: '标题不能为空' },
    { field: 'email', message: '邮箱格式不正确' },
  ],
})

// 资源不存在
throw new NotFoundError({
  message: '文章不存在',
  code: 'ARTICLE_NOT_FOUND',
})

// 权限不足
throw new PermissionError({
  message: '没有权限编辑此文章',
  code: 'NO_PERMISSION',
})
```

#### 3.2 三层处理模型

错误处理分为三层，每层职责不同：

| 层级 | 位置 | 职责 | 处理方式 |
|------|------|------|----------|
| **数据层** | `lib/db/` | 抛出具体的业务错误 | throw 对应的错误类型 |
| **Hooks 层** | `hooks.ts` | 捕获错误，转换为 UI 可用的状态 | try/catch，设置 error 状态 |
| **组件层** | `.tsx` | 根据错误类型展示对应的 UI | 条件渲染错误提示 |

**关键原则**：数据层只管抛，Hooks 层只管接，组件层只管展示。不要跨层处理——数据层不要直接操作 UI 状态，组件层不要直接处理数据错误。

#### 3.3 错误处理流程图

```
用户操作（如点击"发布文章"）
        │
        ▼
┌───────────────────┐
│   组件层          │  调用 hook 方法
│   (ArticlePage)   │
└───────┬───────────┘
        │ handlePublish()
        ▼
┌───────────────────┐
│   Hooks 层        │  try {
│   (useArticles)   │    await publishArticle(id)
└───────┬───────────┘
        │           } catch (error) {
        ▼           根据错误类型设置对应状态
┌───────────────────┐ }
│   数据层          │
│   (articles.ts)   │──► 校验失败？──► throw ValidationError
└───────────────────┘──► 权限不足？──► throw PermissionError
                        │
                        ▼
              Hooks 层 catch 到错误
                        │
            ┌───────────┴───────────┐
            │  error instanceof     │
            │  ValidationError ?    │
            ├───────┬───────────────┤
            ▼ 是    │               ▼ 否
     设置表单错误   │     设置通用错误提示
     字段级提示     │
            │       │
            ▼       ▼
┌───────────────────┐
│   组件层          │  根据 error 状态渲染
│   (ArticlePage)   │  - 表单字段标红 + 提示
└───────────────────┘  - 或顶部错误横幅
```

#### 3.4 错误处理代码示例

**数据层——抛出错误**：

```ts
// lib/db/articles.ts
function createArticle(input: CreateArticleInput): Article {
  // 校验
  if (!input.title.trim()) {
    throw new ValidationError({
      message: '标题不能为空',
      details: [{ field: 'title', message: '必填字段' }],
    })
  }

  if (input.title.length > 100) {
    throw new ValidationError({
      message: '标题过长',
      details: [{ field: 'title', message: '不超过 100 个字符' }],
    })
  }

  // ... 创建逻辑
}
```

**Hooks 层——捕获并转换状态**：

```ts
// features/articles/hooks.ts
function useCreateArticle() {
  const [error, setError] = useState<AppError | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(input: CreateArticleInput) {
    setError(null)
    setIsSubmitting(true)
    try {
      const article = createArticle(input)
      return { ok: true, data: article }
    } catch (err) {
      if (err instanceof AppError) {
        setError(err)
      } else {
        setError(new UnknownError({ message: '创建失败，请稍后重试' }))
      }
      return { ok: false, error: err }
    } finally {
      setIsSubmitting(false)
    }
  }

  return { handleCreate, error, isSubmitting }
}
```

**组件层——展示错误**：

```tsx
// features/articles/CreateArticlePage.tsx
function CreateArticlePage() {
  const { handleCreate, error, isSubmitting } = useCreateArticle()
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  async function onSubmit(input: CreateArticleInput) {
    const result = await handleCreate(input)
    if (!result.ok) {
      if (result.error instanceof ValidationError && result.error.details) {
        // 字段级错误，展示在对应字段下方
        const fieldErrors = parseFieldErrors(result.error.details)
        setFormErrors(fieldErrors)
      }
      // 通用错误由 error 状态驱动的 toast 展示
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Input
        label="标题"
        error={formErrors.title}    // 字段级错误
      />
      {error && error.type === 'UNKNOWN' && (
        <ErrorBanner message={error.message} />  // 通用错误
      )}
    </form>
  )
}
```

**外部 API 错误处理**：

```ts
// lib/api/client.ts
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options)
    const result = await response.json()

    if (!result.ok) {
      // 将后端错误码映射为前端错误类型
      switch (result.error.code) {
        case 'VALIDATION_ERROR':
          throw new ValidationError(result.error)
        case 'NOT_FOUND':
          throw new NotFoundError(result.error)
        case 'UNAUTHORIZED':
          throw new PermissionError(result.error)
        default:
          throw new UnknownError(result.error)
      }
    }

    return result.data
  } catch (err) {
    if (err instanceof AppError) throw err
    // 网络错误
    throw new NetworkError({ message: '网络请求失败，请检查网络连接' })
  }
}
```

---

### 第三篇快速参考卡

**错误类型**：

- [ ] 定义专门的错误类型（`ValidationError`、`NotFoundError` 等），不用通用 `Error`
- [ ] 每个错误包含 `type`、`message`、`code`、`details` 四个字段

**三层处理**：

- [ ] 数据层：只抛出错误（throw）
- [ ] Hooks 层：只捕获错误（try/catch），转换为 UI 状态
- [ ] 组件层：只展示错误（条件渲染）

**关键规则**：

- [ ] 不跨层处理（数据层不碰 UI，组件层不碰数据错误）
- [ ] 兜底用 `UnknownError`，捕获所有未预期的错误
- [ ] 外部 API 错误通过错误码映射为内部错误类型

---

## 第四篇：兼容性设计

API 的变更不可避免，但变更不能破坏现有的使用者。向前兼容是 API 设计的底线。

### 第四章：向前兼容

#### 4.1 兼容性原则

两条基本规则：

| 操作 | 是否兼容 | 处理方式 |
|------|----------|----------|
| **新增字段** | ✅ 兼容 | 直接添加，旧客户端会忽略新字段 |
| **新增接口** | ✅ 兼容 | 直接添加，旧客户端不会调用新接口 |
| **修改字段类型** | ❌ 不兼容 | 必须通过新版本接口 |
| **删除字段** | ❌ 不兼容 | 必须通过新版本接口，或先标记为废弃 |
| **修改字段语义** | ❌ 不兼容 | 必须通过新版本接口 |

**新增字段的注意事项**：

- 新字段必须有默认值，否则旧客户端解析时该字段为 `undefined`
- 列表接口新增排序字段时，确保默认排序行为不变

**删除字段的过渡流程**：

```
阶段 1：标记废弃
  在文档和响应头中标记字段为 deprecated，保留返回
  ↓
阶段 2：观察期（至少一个版本周期）
  监控是否还有客户端使用该字段
  ↓
阶段 3：移除字段
  确认无使用后，在新版本中移除
```

#### 4.2 版本控制策略

当 API 需要做出不兼容变更时，通过版本号隔离：

**URL 版本（推荐）**：

```
/api/v1/articles
/api/v2/articles
```

- 优点：直观、易于路由、易于缓存
- 缺点：URL 数量膨胀

**Header 版本**：

```
GET /api/articles
Accept-Version: v2
```

- 优点：URL 简洁
- 缺点：不直观、调试不便、缓存复杂

**选择建议**：

| 场景 | 推荐方案 |
|------|----------|
| 团队规模小、变更频率低 | URL 版本，简单直接 |
| API 由外部团队消费 | URL 版本，方便文档和调试 |
| 内部微服务之间 | Header 版本，URL 更简洁 |

**版本升级策略**：

- `v1` → `v2`：只在 v1 有破坏性变更时才升版本号
- v1 不要轻易废弃，至少维护一个主要版本
- 同时支持的版本不超过 2 个（维护成本随版本数指数增长）

#### 4.3 兼容性检查清单

每次修改 API 接口前，按以下清单逐项检查：

**变更前检查**：

- [ ] 这次修改是否新增字段？→ 直接加，确保有默认值
- [ ] 这次修改是否删除字段？→ 先标记废弃，观察后再删
- [ ] 这次修改是否改变了字段类型？→ 需要新版本接口
- [ ] 这次修改是否改变了字段语义？→ 需要新版本接口
- [ ] 这次修改是否改变了默认行为？→ 需要评估影响范围

**变更后检查**：

- [ ] 旧版本客户端是否仍然正常工作？
- [ ] 新增字段在旧客户端中是否被安全忽略？
- [ ] 错误响应结构是否保持一致？
- [ ] 分页响应的格式是否改变？
- [ ] 文档是否已更新？

**内部接口的兼容性**（数据层/Hooks 层）：

- [ ] 修改接口签名是否影响了所有调用方？
- [ ] 新增必填参数是否会导致调用方报错？
- [ ] 修改返回类型是否会导致消费方类型错误？

> **示例——博客平台场景**：需要给文章列表接口新增"阅读数"字段。
>
> ✅ 正确做法：直接在返回数据中新增 `viewCount` 字段，旧客户端会忽略它。
>
> ❌ 错误做法：把原来的 `content` 字段改为 `body`（字段重命名），所有使用 `content` 的客户端都会报错。

---

### 第四篇快速参考卡

**兼容性原则**：

- [ ] 新增字段 = 兼容（确保有默认值）
- [ ] 删除/改类型/改语义 = 不兼容（需要新版本）

**版本控制**：

- [ ] 破坏性变更必须升版本号（`/api/v1/` → `/api/v2/`）
- [ ] 同时维护不超过 2 个版本
- [ ] 删除字段走"标记废弃 → 观察 → 移除"三步流程

**每次修改前**：

- [ ] 这次改动会破坏现有调用方吗？
- [ ] 旧客户端能安全处理新的响应结构吗？
- [ ] 文档和类型定义是否同步更新了？

---

## 附录：快速参考卡汇总

### API 设计要点

- [ ] URL 用名词不用动词，用复数不用单数
- [ ] 用 HTTP 方法表达操作语义（GET/POST/PATCH/DELETE）
- [ ] 统一响应结构 `{ ok, data, error }`
- [ ] 列表接口支持分页（`page` + `pageSize`）、排序（`sort` + `order`）、搜索（`q`）
- [ ] 状态码与业务语义匹配

### 内部接口要点

- [ ] 每个实体模块提供标准 5 个 CRUD 接口
- [ ] CreateInput 只含创建字段，UpdateInput 所有字段可选
- [ ] 函数命名用"动词 + 实体名"（`getArticleById`）
- [ ] 类型定义和实现分开存放

### 错误处理要点

- [ ] 定义专门的错误类型层次，不用通用 Error
- [ ] 三层处理：数据层抛出 → Hooks 层捕获 → 组件层展示
- [ ] 兜底用 UnknownError，确保所有错误都被处理
- [ ] 外部 API 错误码映射为内部错误类型

### 兼容性要点

- [ ] 新增字段直接加，删除字段走废弃流程
- [ ] 破坏性变更必须升版本号
- [ ] 同时维护不超过 2 个版本
- [ ] 每次修改前检查是否破坏现有调用方

---

## 附录：核心原则摘要

| 领域 | 核心原则 |
|------|----------|
| **外部 API** | 自解释、一致性、最小暴露、向前兼容 |
| **内部接口** | 标准 CRUD、类型分离、命名统一 |
| **错误处理** | 专门类型、三层分工、兜底覆盖 |
| **兼容性** | 新增安全、删除谨慎、版本隔离 |
