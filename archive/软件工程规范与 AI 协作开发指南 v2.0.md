========================================
软件工程规范与 AI 协作开发指南
========================================

日期：2026-08-21
版本：v2.0

适用范围：
  适用于个人开发者与 AI 协作的中小型项目。
  以 Web 应用为主要场景，但方法论不限于特定技术栈。
  文中标注"范例"的部分为 DogEar·折耳书签项目的具体应用。


========================================
第一篇：工程原则
========================================

在讨论具体规范之前，先建立共识。
这些原则是后续所有规范的基础。
当规范之间出现矛盾时，回到原则做判断。


第一章：核心工程原则
========================================

1.1 可维护性优先于开发速度

  写得快但写得乱的代码，后续的修改成本会指数级增长。
  在 AI 协作场景中尤其明显——
  AI 可以很快产出大量代码，
  但如果结构混乱，后续对话中 AI 自己都无法正确理解和修改。

  实践含义：
    宁可多花 10 分钟讨论方案，不要急于动手写代码。
    宁可多拆一个文件，不要把逻辑堆在一起。
    宁可多写两行类型定义，不要用 any。

1.2 单一职责

  每个模块、每个文件、每个函数只负责一件事。

  判断方法：
    用一句话描述这个模块/文件/函数的职责。
    如果需要用"和""以及"来描述，说明职责过多。

  这个原则适用于所有层级：
    项目层级：每个 feature 模块只负责一个业务领域
    文件层级：每个文件只负责一个功能单元
    函数层级：每个函数只做一件事
    组件层级：每个组件只负责一种 UI 展示或交互

1.3 关注点分离

  不同性质的代码应该分开存放，不要混在一起：
    UI 代码和业务逻辑分开
    数据操作和数据展示分开
    配置和实现分开
    类型定义和运行逻辑分开

  为什么：
    混在一起会导致修改一个功能需要同时改动多个不相关的部分。
    分开后每个部分可以独立修改、独立测试、独立复用。

1.4 显式优于隐式

  代码应该清晰表达意图，不要依赖隐式行为。
    明确的类型定义优于 any
    明确的错误处理优于静默失败
    明确的配置优于硬编码的魔法值
    明确的函数名优于需要看实现才能理解的命名

1.5 渐进式复杂度

  不要一开始就做最复杂的方案。
  先用最简单的方式跑通，遇到瓶颈再优化。

  实践含义：
    第一版不需要考虑所有边界情况
    第一版不需要支持所有配置项
    第一版不需要做完美的性能优化
    但第一版的架构必须允许后续扩展

1.6 一致性

  同类操作的实现方式、代码风格、组织结构必须一致。
  一致性降低了认知负担——
  你和 AI 只需要理解一种模式，就能理解所有同类代码。

  实践含义：
    如果第一个 API 用 RESTful 风格，所有 API 都用
    如果第一个组件用函数组件，所有组件都用
    如果第一个模块的 hooks 放在 hooks.ts，所有模块都这样
    如果第一个表的时间字段叫 created_at，所有表都这样


========================================
第二篇：项目架构
========================================

本篇讨论如何从零规划一个项目的代码组织。
包括目录结构设计、模块划分、层级关系。


第二章：项目结构设计方法论
========================================

2.1 两种组织方式

  代码有两种基本组织方式：

  按技术角色组织（不推荐）：
    src/
    ├── components/     # 所有组件
    ├── hooks/          # 所有 hooks
    ├── services/       # 所有服务
    ├── types/          # 所有类型
    ├── utils/          # 所有工具

  问题：
    "修改书签功能"需要同时改动 components/、hooks/、
    services/、types/ 中各一个文件。
    四个相关文件散落在四个目录中。
    功能越做越多后，每个目录都变成一个巨大的平铺列表。

  按功能模块组织（推荐）：
    src/
    ├── features/
    │   ├── bookmarks/    # 书签相关的一切
    │   │   ├── components/
    │   │   ├── hooks.ts
    │   │   └── types.ts
    │   ├── folders/
    │   └── sync/
    ├── components/       # 跨模块共享的 UI 组件
    ├── lib/              # 跨模块共享的底层能力
    └── types/            # 跨模块共享的类型

  优势：
    "修改书签功能"的所有相关代码都在 features/bookmarks/ 下。
    功能边界清晰，模块可以独立理解和修改。

2.2 四层架构

  推荐将代码分为四层，从上到下依赖：

  第一层：页面层（Pages / Features）
    职责：具体页面和功能模块的实现
    依赖：可以依赖下面所有层
    位置：src/features/、src/app/

  第二层：组件层（Components）
    职责：可复用的 UI 组件
    依赖：只依赖第四层（工具层），不依赖第一层和第三层
    位置：src/components/

  第三层：业务层（Domain / Services）
    职责：业务逻辑、数据操作、外部 API 调用
    依赖：只依赖第四层，不依赖第一层和第二层
    位置：src/lib/、src/services/

  第四层：工具层（Utils）
    职责：纯函数、类型定义、常量
    依赖：不依赖任何其他层
    位置：src/utils/、src/types/

  依赖规则：
    上层可以依赖下层，下层不能依赖上层。
    同层之间尽量不依赖，如需要则通过接口/类型解耦。

  违规示例：
    lib/ 中的文件 import 了 components/ 中的组件 → 违规
    utils/ 中的函数调用了 services/ 中的 API → 违规
    components/ 中直接调用了数据库操作 → 违规（应通过 hooks）

  范例——DogEar 的层级划分：
    第一层（页面层）：features/nav-page、features/workbench、features/organize
    第二层（组件层）：components/ui（原子）、components/composite（分子）、components/layout（布局）
    第三层（业务层）：lib/db（数据库）、lib/sync（同步）、lib/skill-api（API）、lib/ai（AI 逻辑）
    第四层（工具层）：utils/（工具函数）、types/（类型定义）

2.3 目录结构的决策框架

  当不确定一个文件放在哪里时，问以下问题：

  问题 1：这个文件是否只被一个功能模块使用？
    是 → 放在该功能模块内部（features/xxx/ 下）
    否 → 继续问问题 2

  问题 2：这个文件是 UI 组件还是业务逻辑？
    UI 组件 → 放在 components/ 下
    业务逻辑 → 放在 lib/ 或 services/ 下

  问题 3：这个文件是否依赖 UI？
    是（如包含 JSX）→ 放在 components/ 下
    否（纯数据/逻辑）→ 放在 lib/ 下

  问题 4：这个文件是否是纯工具函数？
    是 → 放在 utils/ 下
    否 → 根据上面的判断放在合适的位置

2.4 模块的内部结构

  每个功能模块内部推荐的文件组织：

    features/
    ├── module-name/
    │   ├── index.ts           # 模块入口，导出公开接口
    │   ├── PageComponent.tsx  # 页面级容器组件
    │   ├── SubComponentA.tsx  # 子组件
    │   ├── SubComponentB.tsx  # 子组件
    │   ├── hooks.ts           # 本模块的 hooks（如果不超过 3 个）
    │   ├── types.ts           # 本模块的类型定义
    │   ├── constants.ts       # 本模块的常量
    │   └── utils.ts           # 本模块的工具函数

  如果模块内部有子功能需要进一步拆分：

    features/
    ├── module-name/
    │   ├── index.ts
    │   ├── PageComponent.tsx
    │   ├── sub-feature-a/     # 子功能目录
    │   │   ├── ComponentA.tsx
    │   │   └── hooks.ts
    │   ├── sub-feature-b/
    │   │   ├── ComponentB.tsx
    │   │   └── hooks.ts
    │   ├── types.ts
    │   └── constants.ts

  规则：
    模块入口 index.ts 只做导出，不写业务逻辑。
    模块内部的实现细节不对外暴露，
    外部只能 import 模块的 index.ts 导出的内容。
    子功能目录不应超过 2 层嵌套。

2.5 范例：DogEar 项目结构

    dogear/
    ├── docs/                          # 文档目录
    │   ├── COMPONENTS.md              # 组件设计规范
    │   ├── DATA_MODEL.md              # 数据模型规范
    │   ├── DEV_GUIDE.md               # 开发工程规范（本文档）
    │   └── CHANGELOG.md               # 变更日志
    │
    ├── src/
    │   ├── app/                       # 应用入口
    │   │   ├── layout.tsx             # 全局布局
    │   │   ├── routes.tsx             # 路由定义
    │   │   └── providers.tsx          # 全局 Provider
    │   │
    │   ├── components/                # 共享 UI 组件
    │   │   ├── ui/                    # 原子组件
    │   │   │   ├── Button.tsx
    │   │   │   ├── Input.tsx
    │   │   │   ├── Tag.tsx
    │   │   │   ├── Icon.tsx
    │   │   │   ├── Toggle.tsx
    │   │   │   ├── Select.tsx
    │   │   │   ├── Badge.tsx
    │   │   │   ├── Tooltip.tsx
    │   │   │   ├── Checkbox.tsx
    │   │   │   └── index.ts
    │   │   ├── composite/             # 分子组件
    │   │   │   ├── SearchBox.tsx
    │   │   │   ├── TagGroup.tsx
    │   │   │   ├── ActionBar.tsx
    │   │   │   ├── TabBar.tsx
    │   │   │   ├── StatDisplay.tsx
    │   │   │   ├── ProgressBar.tsx
    │   │   │   ├── DomainBar.tsx
    │   │   │   ├── KeyValueRow.tsx
    │   │   │   └── index.ts
    │   │   └── layout/                # 布局组件
    │   │       ├── Modal.tsx
    │   │       ├── Overlay.tsx
    │   │       ├── Sidebar.tsx
    │   │       ├── BatchBar.tsx
    │   │       ├── Toast.tsx
    │   │       └── index.ts
    │   │
    │   ├── features/                  # 功能模块
    │   │   ├── nav-page/              # 导航页
    │   │   │   ├── index.ts
    │   │   │   ├── NavPage.tsx
    │   │   │   ├── LinkIcon.tsx
    │   │   │   ├── WidgetBox.tsx
    │   │   │   ├── DockBar.tsx
    │   │   │   ├── FolderOverlay.tsx
    │   │   │   ├── Hero.tsx
    │   │   │   ├── TabNav.tsx
    │   │   │   ├── widgets/
    │   │   │   │   ├── PendingWidget.tsx
    │   │   │   │   ├── TodoWidget.tsx
    │   │   │   │   ├── RecentWidget.tsx
    │   │   │   │   └── StatsWidget.tsx
    │   │   │   ├── hooks.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── workbench/             # 工作台
    │   │   │   ├── index.ts
    │   │   │   ├── Workbench.tsx
    │   │   │   ├── BookmarkCard.tsx
    │   │   │   ├── GridView.tsx
    │   │   │   ├── ListView.tsx
    │   │   │   ├── KanbanView.tsx
    │   │   │   ├── KanbanColumn.tsx
    │   │   │   ├── ToolPanel.tsx
    │   │   │   ├── tools/
    │   │   │   │   ├── DeadLinkTool.tsx
    │   │   │   │   ├── DuplicateTool.tsx
    │   │   │   │   ├── TagCleanTool.tsx
    │   │   │   │   └── DomainStats.tsx
    │   │   │   ├── PendingTab.tsx
    │   │   │   ├── StatsTab.tsx
    │   │   │   ├── hooks.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   ├── organize/              # 整理模式
    │   │   │   ├── index.ts
    │   │   │   ├── OrganizePage.tsx
    │   │   │   ├── SortList.tsx
    │   │   │   ├── SortItem.tsx
    │   │   │   ├── PreviewPanel.tsx
    │   │   │   ├── RefineList.tsx
    │   │   │   ├── RefineItem.tsx
    │   │   │   ├── hooks.ts
    │   │   │   └── types.ts
    │   │   │
    │   │   └── settings/              # 设置（弹窗）
    │   │       ├── index.ts
    │   │       ├── SkillModal.tsx
    │   │       ├── ExportModal.tsx
    │   │       ├── SettingsModal.tsx
    │   │       ├── LogModal.tsx
    │   │       └── types.ts
    │   │
    │   ├── lib/                       # 底层能力
    │   │   ├── db/
    │   │   │   ├── connection.ts
    │   │   │   ├── migrations.ts
    │   │   │   ├── bookmarks.ts
    │   │   │   ├── folders.ts
    │   │   │   ├── tags.ts
    │   │   │   ├── configs.ts
    │   │   │   ├── preferences.ts
    │   │   │   └── logs.ts
    │   │   ├── sync/
    │   │   │   ├── engine.ts
    │   │   │   ├── queue.ts
    │   │   │   ├── raindrop.ts
    │   │   │   ├── conflict.ts
    │   │   │   └── types.ts
    │   │   ├── skill-api/
    │   │   │   ├── capabilities.ts
    │   │   │   ├── save.ts
    │   │   │   ├── search.ts
    │   │   │   ├── update.ts
    │   │   │   ├── list.ts
    │   │   │   ├── stats.ts
    │   │   │   ├── guard.ts
    │   │   │   └── types.ts
    │   │   └── ai/
    │   │       ├── classifier.ts
    │   │       ├── summarizer.ts
    │   │       ├── tagger.ts
    │   │       └── memory.ts
    │   │
    │   ├── hooks/                     # 共享 hooks
    │   │   ├── useBookmarks.ts
    │   │   ├── useFolders.ts
    │   │   ├── useTags.ts
    │   │   ├── useSync.ts
    │   │   ├── useSelection.ts
    │   │   └── useUndo.ts
    │   │
    │   ├── types/                     # 共享类型
    │   │   ├── bookmark.ts
    │   │   ├── folder.ts
    │   │   ├── tag.ts
    │   │   ├── sync.ts
    │   │   └── common.ts
    │   │
    │   └── utils/                     # 工具函数
    │       ├── url.ts
    │       ├── date.ts
    │       ├── export.ts
    │       ├── search.ts
    │       └── constants.ts
    │
    ├── public/                        # 静态资源
    ├── tests/                         # 测试文件
    │   ├── lib/
    │   │   ├── db/
    │   │   │   ├── bookmarks.test.ts
    │   │   │   └── folders.test.ts
    │   │   └── sync/
    │   │       └── engine.test.ts
    │   └── utils/
    │       ├── url.test.ts
    │       └── search.test.ts
    │
    ├── scripts/                       # 构建和部署脚本
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    └── PROJECT_CONTEXT.md


========================================
第三篇：代码规范
========================================

本篇讨论代码层面的具体规范：
文件怎么写、命名怎么定、类型怎么用、注释怎么加。


第三章：文件规范
========================================

3.1 文件体积约束

  约束规则：
    单个源文件不超过 300 行（含注释和空行）
    推荐控制在 200 行以内

  为什么是 300 行：
    这不是一个精确的科学数字，而是一个经验阈值。
    300 行以内的文件，开发者可以在一次屏幕滚动中理解全貌。
    超过 300 行，阅读和定位问题的效率显著下降。
    在 AI 协作场景中，
    300 行以内的文件更可能被完整放入 AI 的上下文中。

  文件接近 300 行时的处理流程：
    第一步：检查是否有独立的子组件可以抽取
    第二步：检查是否有业务逻辑可以提取到 hooks 或 services
    第三步：检查是否有工具函数可以提取到 utils
    第四步：如果拆分后每个文件都低于 200 行，说明拆分合理
    如果拆分后出现了只有一二十行的"碎片"文件，说明过度拆分

  常见的文件膨胀原因及解决方案：

    原因 A：一个组件文件包含了所有子组件
    解决：每个子组件独立为一个文件，父组件只负责组装

    原因 B：一个文件包含了组件和业务逻辑
    解决：业务逻辑提取到 hooks，组件只负责渲染

    原因 C：一个文件包含了多种不相关的工具函数
    解决：按职责拆分到不同的工具文件中

    原因 D：一个文件包含了过多的样式定义
    解决：样式和组件分离，或使用 CSS Modules

3.2 文件命名规范

  命名规则取决于文件内容的性质：

  组件文件（包含 React/Vue 组件）：
    PascalCase（大驼峰）
    如：BookmarkCard.tsx、SearchBox.tsx、ToolPanel.tsx
    文件名与组件名一致

  Hook 文件（包含自定义 Hook）：
    camelCase（小驼峰），use 前缀
    如：useBookmarks.ts、useSelection.ts

  工具/服务文件（包含纯函数或类）：
    camelCase（小驼峰）
    如：url.ts、date.ts、raindrop.ts、classifier.ts

  类型定义文件：
    camelCase（小驼峰）
    如：bookmark.ts、sync.ts、common.ts

  常量文件：
    camelCase（小驼峰）
    如：constants.ts

  测试文件：
    与被测试文件同名，加 .test 或 .spec 后缀
    如：bookmarks.test.ts、url.test.ts

  配置文件：
    使用工具约定的文件名
    如：tsconfig.json、vite.config.ts、.eslintrc.cjs

3.3 文件内容的排列顺序

  一个文件内部的内容应该有固定的排列顺序。
  一致性让阅读者知道"在哪里找什么"。

  组件文件的内容顺序：
    1. import 语句（外部依赖 → 内部模块 → 类型 → 样式）
    2. 类型定义（Props 等，如果只有本文件使用）
    3. 常量定义
    4. 辅助函数（纯函数，不依赖组件状态）
    5. 组件定义
    6. 导出

  Hook 文件的内容顺序：
    1. import 语句
    2. 类型定义
    3. Hook 函数定义
    4. 导出

  工具/服务文件的内容顺序：
    1. import 语句
    2. 类型定义
    3. 常量定义
    4. 函数定义（按调用关系或逻辑分组排列）
    5. 导出

3.4 import 顺序

  所有文件的 import 语句按以下顺序排列，
  每组之间空一行：

    第一组：外部依赖库
      import React, { useState } from 'react'
      import { useLiveQuery } from 'dexie-react-hooks'

    第二组：内部共享组件
      import { Button, Tag, Icon } from '@/components/ui'
      import { Modal } from '@/components/layout'

    第三组：内部业务模块
      import { getBookmarks } from '@/lib/db/bookmarks'
      import { useBookmarks } from '@/hooks/useBookmarks'

    第四组：类型导入
      import type { Bookmark, BookmarkFilter } from '@/types/bookmark'

    第五组：样式
      import styles from './Workbench.module.css'


第四章：命名规范
========================================

4.1 通用命名规则

  变量和函数：camelCase
    bookmarkCount, isExpanded, handleSelect, getBookmarks

  类型和接口：PascalCase
    Bookmark, BookmarkFilter, SyncStatus, ApiResponse

  常量：UPPER_SNAKE_CASE
    MAX_RETRY_COUNT, SYNC_INTERVAL_MS, DEFAULT_PAGE_SIZE

  枚举值：PascalCase 或 camelCase（选择一种，项目内统一）
    SyncStatus.Synced, SyncStatus.Pending
    或 'synced', 'pending'（字符串枚举用小写）

  CSS 类名：kebab-case 或 CSS Modules 的 camelCase
    .bookmark-card 或 styles.bookmarkCard

  文件夹名：kebab-case
    nav-page, skill-api, sub-feature-a

  环境变量：UPPER_SNAKE_CASE
    VITE_API_BASE_URL, VITE_RAINDROP_TOKEN

4.2 命名的具体化程度

  好的命名应该让读者不看实现就知道意图。

  变量命名：
    不好：data, list, item, temp, result
    好：bookmarks, pendingItems, selectedBookmark, syncResult

  函数命名：
    不好：process, handle, do, make
    好：fetchBookmarks, handleBookmarkSelect, createSyncJob, formatFileSize

  布尔变量用 is/has/can/should 前缀：
    isLoading, hasError, canRetry, shouldRefresh

  事件处理函数用 handle 前缀：
    handleClick, handleSubmit, handleFolderSelect

  回调函数用 on 前缀（用于 props）：
    onClick, onSubmit, onSelect, onChange

4.3 避免的命名

  避免缩写（除非是行业通用缩写）：
    不好：btn, txt, img, nav, cfg
    好：button, text, image, navigation, config
    例外：URL、API、ID、HTML 等通用缩写可以用

  避免数字后缀：
    不好：data1, data2, handler1, handler2
    如果需要区分，说明结构需要重构

  避免模糊的泛化命名：
    不好：utils.ts 里面放了几十个互不相关的函数
    好：url.ts（URL 相关）、date.ts（日期相关）、format.ts（格式化相关）


第五章：类型系统规范
========================================

5.1 类型安全的必要性

  在 AI 协作场景中，类型安全是最重要的防线之一。
  AI 可能写出逻辑正确但类型错误的代码，
  TypeScript 的类型检查能在编译阶段就发现问题，
  而不是等到运行时才报错。

5.2 类型定义的位置

  类型定义的位置取决于它的使用范围：

  仅在一个文件中使用的类型：
    定义在该文件的顶部（import 之后、组件/函数之前）

  在一个模块内多个文件共享的类型：
    定义在模块的 types.ts 中
    如 features/workbench/types.ts

  跨模块共享的类型：
    定义在 src/types/ 目录下
    如 types/bookmark.ts、types/sync.ts

  与 API 响应对应的类型：
    定义在 API 相关模块中
    如 lib/sync/types.ts

5.3 类型定义规范

  规则 1：函数参数和返回值必须有类型

    不好：
      function getBookmarks(filter) { ... }

    好：
      function getBookmarks(filter: BookmarkFilter): Promise<Bookmark[]> { ... }

  规则 2：组件必须定义 Props 类型

    不好：
      function BookmarkCard({ title, url, tags }) { ... }

    好：
      interface BookmarkCardProps {
        title: string
        url: string
        tags: string[]
        variant?: 'grid' | 'list' | 'kanban'
        onSelect?: (id: number) => void
      }
      function BookmarkCard({ title, url, tags, variant = 'grid', onSelect }: BookmarkCardProps) { ... }

  规则 3：禁止使用 any

    除非确实无法确定类型且加了注释说明原因。
    绝大多数情况下都可以用 unknown 代替 any。
    unknown 是类型安全的"我不知道"，any 是类型不安全的"我不在乎"。

    不好：
      const data: any = await fetch(...)

    好：
      const data: unknown = await fetch(...)
      // 后续通过类型守卫判断 data 的实际类型

  规则 4：使用 interface 还是 type

    用于对象结构的定义 → 用 interface（可以被 extends 和 implements）
    用于联合类型、交叉类型、工具类型 → 用 type
    项目内保持一致即可，不需要严格区分

  规则 5：API 响应必须有明确的类型

    不好：
      const response = await fetch(url)
      const data = await response.json() // data 是 any

    好：
      interface ApiResponse<T> {
        ok: boolean
        data: T
        error?: { code: string; message: string }
      }
      const response = await fetch(url)
      const result: ApiResponse<Bookmark[]> = await response.json()

5.4 类型组织方式

  按实体组织类型定义：

    // types/bookmark.ts
    export interface Bookmark {
      id: number
      url: string
      title: string
      description: string | null
      note: string | null
      folderId: number | null
      status: BookmarkStatus
      starred: boolean
      priority: BookmarkPriority | null
      createdAt: string
      updatedAt: string
      deletedAt: string | null
    }

    export type BookmarkStatus = 'unread' | 'reading' | 'read' | 'archived'
    export type BookmarkPriority = 'low' | 'medium' | 'high'

    export interface BookmarkFilter {
      folderId?: number
      tags?: string[]
      status?: BookmarkStatus
      starred?: boolean
      search?: string
    }

    export interface CreateBookmarkInput {
      url: string
      title?: string
      note?: string
      folderId?: number
      tags?: string[]
    }

    export interface UpdateBookmarkInput {
      title?: string
      note?: string
      folderId?: number
      status?: BookmarkStatus
      starred?: boolean
      priority?: BookmarkPriority
      tags?: string[]
    }

  规则：
    实体类型（Bookmark）和它的 Filter、Input 类型放在同一个文件中
    相关的枚举类型（Status、Priority）也放在一起
    导出所有在文件外部使用的类型


第六章：注释与文档规范
========================================

6.1 注释原则

  注释不是越多越好。
  好的代码应该尽量自解释，
  注释只在必要时添加。

  必须添加注释的情况：
    复杂的业务逻辑（为什么这样做，而不是仅仅描述做了什么）
    不直观的算法或计算
    与外部系统的交互边界（API 调用、第三方库的特殊行为）
    临时方案和 TODO 标记
    绕过了某个限制的 hack（说明为什么需要 hack）

  不需要添加注释的情况：
    明显的操作（const bookmarks = await getBookmarks()）
    代码已经清楚表达的逻辑
    函数的参数说明（类型定义已经说明了）

6.2 注释格式

  行内注释：用于解释单行或小段代码
    // Raindrop API 每分钟限 120 次，保守设为 60
    const RATE_LIMIT = 60

  块注释：用于解释复杂的逻辑段落
    /*
     * 同步引擎的冲突处理逻辑：
     * 当本地和 Raindrop 都有修改时，以本地为准。
     * 但保留 Raindrop 的版本信息，以便用户在冲突视图中查看差异。
     */

  TODO 注释：标记待完成的工作
    // TODO: 实现标签的拖拽排序
    // TODO(#issue): 修复大列表的滚动性能

  JSDoc 注释：用于公共 API 的函数（特别是 lib/ 层的函数）
    /**
     * 从 IndexedDB 中获取书签列表
     * @param filter - 筛选条件
     * @returns 符合条件的书签数组
     */
    export async function getBookmarks(filter?: BookmarkFilter): Promise<Bookmark[]> { ... }

6.3 PROJECT_CONTEXT.md

  这不是代码注释，而是一份专门给 AI 看的项目上下文文件。
  每次新对话开始时，把它给 AI 看，
  让 AI 快速理解项目背景。

  内容模板：

    # 项目上下文

    ## 产品定位
    [一句话描述]

    ## 技术栈
    前端框架：[xxx]
    类型检查：TypeScript
    构建工具：Vite
    本地数据库：[xxx]
    样式方案：[xxx]

    ## 项目结构概要
    [简要的目录树，不需要列出所有文件]

    ## 核心规范摘要
    - 单文件不超过 300 行
    - 新组件前检查 COMPONENTS.md
    - 数据库变更前更新 DATA_MODEL.md
    - 所有变更记录到 CHANGELOG.md
    - 不使用 any 类型
    - 函数参数和返回值必须有类型定义

    ## 当前阶段
    [当前在做什么里程碑，优先级是什么]

    ## 已有文档索引
    - docs/COMPONENTS.md — 组件设计规范
    - docs/DATA_MODEL.md — 数据模型规范
    - docs/DEV_GUIDE.md — 开发工程规范
    - docs/CHANGELOG.md — 变更日志


========================================
第四篇：API 设计
========================================

本篇讨论如何设计 API 接口——
既包括面向外部的接口，也包括前端内部的数据层接口。


第七章：API 设计原则
========================================

7.1 通用原则

  原则 1：接口应该自解释
    通过 URL 和方法就能理解操作意图
    GET /api/bookmarks → 获取书签列表
    POST /api/bookmarks → 创建书签
    PATCH /api/bookmarks/123 → 修改书签

  原则 2：一致性
    同类操作的接口结构保持一致
    如果列表接口返回 { ok, data, meta }，
    所有列表接口都返回这个结构

  原则 3：最小暴露
    接口只暴露必要的信息
    不要返回数据库中的所有字段
    敏感字段（内部 ID、同步状态等）不暴露给外部

  原则 4：向前兼容
    新增字段不要求调用方修改代码
    删除或重命名字段需要版本控制

7.2 RESTful API 设计

  面向外部的 API（如 Skill API）遵循 RESTful 风格：

  URL 设计：
    资源用名词，不用动词
    /api/bookmarks         → 书签集合
    /api/bookmarks/:id     → 单个书签
    /api/folders           → 文件夹集合
    /api/folders/:id       → 单个文件夹
    /api/stats             → 统计信息

  HTTP 方法：
    GET     获取资源
    POST    创建资源
    PATCH   修改资源的部分字段
    PUT     替换整个资源（较少使用）
    DELETE  删除资源

  查询参数：
    GET /api/bookmarks?status=unread&folderId=3&limit=20&offset=0
    筛选条件用查询参数
    分页用 limit + offset 或 page + pageSize

  响应结构：

    成功响应：
    {
      "ok": true,
      "data": { ... }        // 单条数据
      // 或
      "data": [ ... ],       // 列表
      "meta": {              // 列表时包含分页信息
        "total": 100,
        "limit": 20,
        "offset": 0,
        "hasMore": true
      }
    }

    错误响应：
    {
      "ok": false,
      "error": {
        "code": "VALIDATION_ERROR",
        "message": "url 字段不能为空"
      }
    }

  状态码：
    200  成功
    201  创建成功
    400  请求参数错误
    401  未认证
    403  无权限（如 AI 尝试删除）
    404  资源不存在
    409  冲突（如创建重复的书签）
    429  超过限速
    500  服务器内部错误

7.3 内部数据层接口

  前端和本地数据层之间不通过 HTTP 通信，
  而是通过 TypeScript 函数调用。
  但也需要设计清晰的接口规范。

  接口设计原则：
    每个实体一个模块（lib/db/bookmarks.ts、lib/db/folders.ts）
    每个模块导出标准的 CRUD 函数
    输入输出都有明确的类型定义

  标准 CRUD 接口模板：

    // 查询
    export async function getItems(filter?: ItemFilter): Promise<Item[]>
    export async function getItemById(id: number): Promise<Item | null>

    // 创建
    export async function createItem(input: CreateItemInput): Promise<Item>

    // 更新
    export async function updateItem(id: number, input: UpdateItemInput): Promise<Item>

    // 删除
    export async function softDeleteItem(id: number): Promise<void>
    export async function restoreItem(id: number): Promise<void>

  输入类型（Input）的设计：
    创建时必填的字段放在 CreateItemInput 中标记为 required
    创建时可选的字段标记为 optional
    更新时所有字段都是 optional（只更新传入的字段）

  范例——Bookmarks 数据层接口：

    lib/db/bookmarks.ts 导出的函数：
      getBookmarks(filter?: BookmarkFilter): Promise<Bookmark[]>
      getBookmarkById(id: number): Promise<Bookmark | null>
      createBookmark(input: CreateBookmarkInput): Promise<Bookmark>
      updateBookmark(id: number, input: UpdateBookmarkInput): Promise<Bookmark>
      softDeleteBookmark(id: number): Promise<void>
      restoreBookmark(id: number): Promise<void>
      searchBookmarks(query: string): Promise<Bookmark[]>

7.4 错误处理规范

  所有与外部系统的交互必须有错误处理。

  错误类型分类：

    业务错误：用户的操作不符合业务规则
      如：创建书签时 URL 为空
      处理：返回明确的错误信息，告诉用户怎么修正

    系统错误：基础设施出了问题
      如：IndexedDB 不可用、网络断开
      处理：重试 + 降级 + 通知用户

    外部依赖错误：第三方服务不可用
      如：Raindrop API 超时、LLM 服务 500
      处理：重试（有退避策略）+ 降级 + 记录日志

  错误处理的层次：

    数据层（lib/）：
      抛出有意义的错误，不要吞掉错误
      错误类型用自定义的 Error 子类区分

    Hooks 层：
      捕获数据层的错误
      转换为 UI 可用的状态（isLoading, error, data）

    组件层：
      根据 error 状态展示对应的 UI
      提供重试按钮（如果错误可恢复）

  自定义错误类型：

    class AppError extends Error {
      code: string
      recoverable: boolean
      constructor(code: string, message: string, recoverable: boolean = false) {
        super(message)
        this.code = code
        this.recoverable = recoverable
      }
    }

    class SyncError extends AppError { ... }
    class DatabaseError extends AppError { ... }
    class ValidationError extends AppError { ... }

  使用场景：

    // 数据层
    async function createBookmark(input: CreateBookmarkInput): Promise<Bookmark> {
      if (!input.url) {
        throw new ValidationError('URL_REQUIRED', 'url 字段不能为空')
      }
      // ...
    }

    // Hooks 层
    function useCreateBookmark() {
      const [error, setError] = useState<AppError | null>(null)
      const create = async (input: CreateBookmarkInput) => {
        try {
          setError(null)
          const bookmark = await createBookmark(input)
          return bookmark
        } catch (e) {
          if (e instanceof AppError) {
            setError(e)
          } else {
            setError(new AppError('UNKNOWN', '未知错误'))
          }
        }
      }
      return { create, error }
    }

    // 组件层
    function CreateBookmarkForm() {
      const { create, error } = useCreateBookmark()
      return (
        <div>
          {/* 表单内容 */}
          {error && <ErrorMessage error={error} onRetry={error.recoverable ? () => create(input) : undefined} />}
        </div>
      )
    }


========================================
第五篇：测试规范
========================================

第八章：测试策略
========================================

8.1 测试的目标

  测试不是为了追求覆盖率数字，
  而是为了：
    保护核心功能不被意外破坏
    让重构有信心（改了代码后跑一遍测试就知道有没有破坏什么）
    让 AI 的代码交付可以被自动验证

8.2 测试金字塔

  测试分为三层，从下到上数量递减：

    底层：单元测试
      数量：最多
      速度：最快
      范围：单个函数、单个模块
      工具：Vitest / Jest
      重点：lib/ 层的纯函数、数据操作、工具函数

    中层：集成测试
      数量：中等
      速度：中等
      范围：多个模块协作完成一个功能
      工具：Vitest + Testing Library / jsdom
      重点：hooks 的行为、组件和数据层的交互

    顶层：端到端测试
      数量：最少
      速度：最慢
      范围：完整的用户流程
      工具：Playwright / Cypress
      重点：核心用户路径（收藏 → 浏览 → 整理）

8.3 必须测试的内容

  以下代码必须有测试：

    数据层（lib/db/）：
      所有 CRUD 函数
      正常流程 + 边界条件 + 异常情况

    同步层（lib/sync/）：
      同步引擎的推送和拉取逻辑
      冲突处理
      重试逻辑

    工具函数（utils/）：
      URL 解析
      日期格式化
      搜索逻辑
      导出格式生成

    复杂 hooks：
      涉及状态流转的 hooks
      涉及多步操作的 hooks

  以下代码不需要自动化测试：

    纯 UI 组件的视觉表现（手动验收）
    简单的展示组件（如 StatDisplay 只是显示数值）
    弹窗的开关逻辑
    布局组件

8.4 测试编写规范

  测试文件的位置：
    放在 tests/ 目录下，与被测试的文件保持相同的目录结构

    lib/db/bookmarks.ts → tests/lib/db/bookmarks.test.ts
    utils/url.ts → tests/utils/url.test.ts

  测试的结构（AAA 模式）：
    Arrange（准备）→ Act（执行）→ Assert（断言）

    示例：
      describe('getBookmarks', () => {
        it('应该返回所有未删除的书签', async () => {
          // Arrange
          await createBookmark({ url: 'https://a.com', title: 'A' })
          await createBookmark({ url: 'https://b.com', title: 'B' })
          await softDeleteBookmark(2)  // 删除第二条

          // Act
          const result = await getBookmarks()

          // Assert
          expect(result).toHaveLength(1)
          expect(result[0].title).toBe('A')
        })

        it('应该按状态筛选书签', async () => {
          // Arrange
          await createBookmark({ url: 'https://a.com', title: 'A' })
          await updateBookmark(1, { status: 'read' })
          await createBookmark({ url: 'https://b.com', title: 'B' })

          // Act
          const result = await getBookmarks({ status: 'unread' })

          // Assert
          expect(result).toHaveLength(1)
          expect(result[0].title).toBe('B')
        })

        it('应该在数据库为空时返回空数组', async () => {
          // Act
          const result = await getBookmarks()

          // Assert
          expect(result).toHaveLength(0)
        })
      })

  每个测试函数的命名：
    用自然语言描述测试的场景和预期结果
    "应该返回所有未删除的书签"
    "应该在 URL 为空时抛出验证错误"
    "应该在网络断开时返回缓存数据"

  测试覆盖的三个维度：

    正常流程：
      输入正确的参数，得到正确的结果
      这是最基本的测试

    边界条件：
      空输入（null、undefined、空字符串、空数组）
      极端值（超长字符串、极大数值）
      单条记录
      零条记录

    异常情况：
      参数类型错误
      操作不存在的资源
      外部服务不可用
      并发操作冲突

8.5 让 AI 写测试的约束

  在 prompt 中明确：

    "为以下代码编写单元测试：
    - 文件路径：[路径]
    - 测试文件放在 tests/ 目录下对应位置
    - 覆盖正常流程和至少 2 个异常场景
    - 测试函数名用自然语言描述场景
    - 使用 AAA 模式（Arrange-Act-Assert）
    - 不要 mock 底层数据库，直接使用内存数据库"


========================================
第六篇：开发流程
========================================

本篇讨论从需求到上线的完整开发流程。
包括里程碑规划、日常开发循环、版本管理。


第九章：里程碑规划
========================================

9.1 里程碑的设计原则

  原则 1：每个里程碑产出可运行的成果
    不是"写完了数据层"（不可演示），而是"能收藏一条链接并看到它"（可演示）。
    用户视角的功能完成，不是技术视角的分层完成。

  原则 2：按用户场景排列，不按技术层排列
    不好：先做数据库 → 再做 API → 再做 UI（瀑布式）
    好：先跑通"收藏并查看"的完整链路 → 再丰富视图 → 再加整理功能

  原则 3：每个里程碑 1~2 周
    太短（几天）→ 频繁切换上下文，开销大
    太长（一个月）→ 失去反馈循环，风险累积

  原则 4：先跑通再完善
    第一版用最简单的方式实现——能用就行。
    后续里程碑再优化体验（好看、流畅、有动画）。

9.2 里程碑规划的方法

  步骤 1：列出所有需要实现的功能
    从需求文档中提取功能清单。

  步骤 2：确定核心路径
    用户从零开始使用产品，最短的操作路径是什么？
    优先实现这条路径上的功能。

  步骤 3：按场景分组
    把功能按用户场景分组，每个场景对应一个里程碑。

  步骤 4：估计每个里程碑的工作量
    和 AI 讨论，让 AI 估计实现每个功能需要改动的文件数和代码量。

  步骤 5：排列顺序
    前置依赖放在前面（如数据库操作必须在 UI 之前）。
    核心场景放在前面，辅助功能放在后面。

9.3 里程碑模板

    里程碑编号：M[x]
    名称：[名称]
    预计时间：第 x~y 周
    目标：[一句话描述这个里程碑完成后能做什么]

    功能清单：
      - [ ] 功能 A（描述 + 验收标准）
      - [ ] 功能 B
      - [ ] 功能 C

    技术任务：
      - [ ] 新增/修改 xxx 文件
      - [ ] 数据库迁移 Mxxx

    前置依赖：
      - [ ] M[x-1] 完成

    验收标准：
      [可执行的验收清单]

9.4 范例：DogEar 里程碑规划

    M1：基础骨架 + 最简收藏（第 1~2 周）
      目标：跑通"收藏一条链接"的完整流程
      功能：项目脚手架、IndexedDB 连接、书签 CRUD、
           Skill API save_bookmark、工作台列表视图
      验收：发一条链接给 API → 工作台能看到这条书签

    M2：导航页基础（第 3 周）
      目标：导航页能展示书签和文件夹
      功能：导航页框架、图标组件、数据渲染、Docker 栏
      验收：导航页能正确展示书签和文件夹图标，点击可用

    M3：工作台完善（第 4~5 周）
      目标：三种视图 + 侧边栏 + 基础操作
      功能：侧边栏、网格/列表/看板视图、内联编辑、批量操作、快捷键
      验收：三种视图正常切换，能批量操作，快捷键可用

    M4：整理模式（第 6~7 周）
      目标：两阶段分拣完整可用
      功能：分拣列表、预览面板、保留/删除/待定、细分拣
      验收：完成 10 条书签的完整分拣流程

    M5：Raindrop 同步（第 8~9 周）
      目标：与 Raindrop 双向同步跑通
      功能：Raindrop API 封装、同步引擎、冲突处理
      验收：双向同步正常，浏览器插件收藏的能拉取过来

    M6：AI 能力（第 10 周）
      目标：Skill API 完整 + AI 自动分类
      功能：全部 Skill 端点、自描述接口、AI 分类/摘要、安全策略
      验收：AI 发链接能自动收藏分类

    M7：导航页完善（第 11 周）
      目标：导航页功能完整
      功能：页面标签、小组件、Docker 拖拽、搜索、隐私控制
      验收：导航页功能完整

    M8：收尾（第 12 周）
      目标：全部功能完成，可日常使用
      功能：导出、设置、日志、工具面板、软删除、整体测试
      验收：全部功能可用


第十章：日常开发循环
========================================

10.1 每个功能的开发循环

  对于每个需要实现的功能，遵循以下循环：

  步骤 1：明确需求
    告诉 AI 这个功能要做什么、属于哪个里程碑。
    简洁描述，不需要写正式需求文档。

  步骤 2：AI 出方案
    要求 AI 在写代码之前先输出方案：
    - 需要新增/修改哪些文件
    - 每个文件负责什么
    - 是否需要数据模型变更
    - 是否有依赖关系（需要先完成什么）
    - 预估代码量

  步骤 3：审核方案
    用以下检查点快速判断：
      □ 文件数量合理吗？（一个小功能不需要 10 个新文件）
      □ 文件放在正确的目录下吗？
      □ 有没有复用已有组件？
      □ 是否涉及数据模型变更？如果有，DATA_MODEL.md 更新了吗？
      □ 是否破坏已有的代码结构？

  步骤 4：分批实现
    大功能拆成多批，每批完成后检查再继续。
    批次划分建议：
      第一批：类型定义 + 数据层接口
      第二批：hooks + 业务逻辑
      第三批：UI 组件
      第四批：集成和调试

  步骤 5：验收
    功能验收 + 质量验收（见第十一章）

  步骤 6：更新文档
    确认 AI 更新了 COMPONENTS.md、DATA_MODEL.md、CHANGELOG.md。

10.2 和 AI 沟通的技巧

  技巧 1：先说方案再写代码
    "先别写代码，告诉我你打算怎么实现。"
    防止 AI 在错误方向上浪费时间。

  技巧 2：提供足够的上下文
    "当前项目的 BookmarkCard 组件支持 grid/list/kanban 三种 variant，
    现在需要在 kanban variant 中支持拖拽。"
    比"给我加个拖拽功能"有效得多。

  技巧 3：限制范围
    "这次只做拖拽的视觉反馈，不处理数据持久化。"
    防止 AI 过度发挥。

  技巧 4：分步确认
    "先实现数据层的接口，我确认后再做 UI。"
    小步推进，降低返工风险。

  技巧 5：给参考而非空描述
    "布局类似这种结构：[截图/链接/手绘草图]"
    视觉参考比文字描述准确得多。

  技巧 6：问题描述要具体
    不好的反馈："这个不对。"
    好的反馈："卡片标题超过 2 行时应该截断并显示省略号，
    现在的行为是完整显示导致卡片高度不一致。"

10.3 AI 偏差的处理策略

  偏差类型 1：方向性错误
    现象：AI 理解的需求和你的意图不同
    处理：立即停下，重新描述需求。
    不要在错误方向上继续。
    "等一下，我要的不是这个。我说的是..."

  偏差类型 2：结构违规
    现象：AI 创建了不该创建的文件、放错了目录、新建了可复用的组件
    处理：要求删除并按规范重做。
    引用规范文档："根据 COMPONENTS.md，应该复用 BookmarkCard 组件。"

  偏差类型 3：代码质量问题
    现象：单文件超长、有 any、硬编码、缺少错误处理
    处理：逐条列出不符合规范的地方，要求修正。
    "这个文件有 450 行，需要拆分。
    第 23 行有 any 类型，需要定义具体类型。
    第 67 行的 API 地址是硬编码的，需要提取到配置。"

  偏差类型 4：上下文丢失
    现象：长对话后 AI 忘记了之前的约定
    处理：提醒约束条件，或开启新对话。
    "注意：我们之前约定过组件用 BookmarkCard 的 variant 实现，
    不是新建组件。"

10.4 版本管理

  Git 分支策略（简化版，个人项目不需要复杂的分支模型）：

    main 分支：
      稳定版本，可运行、可部署。
      只合并经过验收的代码。

    feature 分支：
      每个功能/里程碑一个分支。
      开发完成后合并到 main。
      命名：feature/m1-scaffold、feature/m2-nav-page

    fix 分支：
      修复 bug 时使用。
      命名：fix/sync-retry-error

  提交信息规范（Conventional Commits）：

    格式：<type>(<scope>): <description>

    type 类型：
      feat      新功能
      fix       修复 bug
      refactor  重构（不改变行为）
      style     代码风格调整（不影响逻辑）
      docs      文档变更
      test      添加或修改测试
      chore     构建工具、配置文件等变更

    scope 范围（可选）：
      组件名、模块名、文件名

    示例：
      feat(workbench): add kanban view
      fix(sync): handle network timeout in retry logic
      refactor(bookmarks): extract BookmarkCard variant logic
      docs: update DATA_MODEL.md with projects table

  提交粒度：
    一个提交完成一个逻辑上的变更。
    不要把"改了 A 功能 + 修了 B bug + 调了 C 样式"放在一个提交里。
    但也不要把一个函数的修改拆成三个提交。


========================================
第七篇：质量保障
========================================

本篇讨论如何验收 AI 的交付物、如何进行代码审查、
如何确保项目质量在发展过程中不退化。


第十一章：验收标准
========================================

11.1 三层验收

  每个功能交付后，进行三层验收：

  第一层：功能验收
    问：这个功能按预期工作吗？

    方法：按验收清单逐项操作。
    验收清单在里程碑规划时确定。
    每条验收项是一个具体的操作 + 预期结果。

    好的验收项：
      □ 点击"网格"按钮 → 切换到网格视图，卡片按网格排列
      □ 输入搜索关键词 → 列表实时过滤，只显示匹配项
      □ 没有任何书签时 → 显示空状态引导

    不好的验收项：
      □ 搜索功能正常（太模糊）
      □ 界面美观（太主观）

  第二层：质量验收
    问：代码合格吗？

    方法：按质量检查清单逐项检查。

    结构检查：
      □ 是否有文件超过 300 行？
      □ 新文件放在了正确的目录下吗？
      □ 目录嵌套是否超过 4 层？
      □ 是否复用了已有的组件？

    类型检查：
      □ TypeScript 编译是否有错误？（npm run tsc --noEmit）
      □ 是否有 any 类型？
      □ 函数参数和返回值是否有类型？

    命名检查：
      □ 文件名是否符合规范（组件 PascalCase，工具 camelCase）？
      □ 变量和函数名是否清晰表达意图？
      □ 是否有一致性问题（同类东西用了不同的命名方式）？

    文档检查：
      □ COMPONENTS.md 是否更新？
      □ DATA_MODEL.md 是否更新？
      □ CHANGELOG.md 是否有记录？

  第三层：体验验收
    问：用起来舒服吗？

    方法：以用户视角走一遍完整流程。

    检查项：
      □ 空状态有引导吗？（没有书签时不是一片空白）
      □ 加载状态有提示吗？（数据加载时不是一片空白）
      □ 操作有即时反馈吗？（点了按钮有反应）
      □ 错误有明确提示吗？（出错了知道出了什么错、怎么解决）
      □ 操作可撤销吗？（误操作能恢复）
      □ 快捷键可用吗？（键盘操作体验）

11.2 如何给 AI 描述 bug

  描述 bug 的标准格式：

    操作步骤：
      1. 打开工作台
      2. 切换到看板视图
      3. 拖拽一张卡片到另一列

    预期结果：
      卡片移动到目标列，状态变为目标列的状态

    实际结果：
      卡片消失了，没有出现在任何一列中

    环境信息：
      浏览器：Chrome 120
      书签数量：15 条
      视图模式：看板

  要点：
    描述操作步骤，让 AI 能复现
    明确说"应该怎样"和"实际怎样"
    提供环境信息
    如果有错误信息或控制台输出，附上


第十二章：代码审查
========================================

12.1 个人项目的代码审查

  在个人 + AI 协作的场景中，
  代码审查不是"别人审你的代码"，
  而是你审 AI 写的代码。

  审查不需要逐行阅读每一行代码。
  重点审查以下方面：

  12.1.1 结构审查

    检查代码的组织方式是否符合规范。

    快速方法：
      看文件列表——新增了哪些文件、放在哪里。
      如果文件列表看起来合理，结构通常没问题。
      如果一个功能新增了 15 个文件，需要问 AI 为什么。

  12.1.2 边界审查

    检查代码是否处理了异常情况。

    关注点：
      外部 API 调用有没有 try/catch？
      用户输入有没有校验？
      空数据（null、空数组）有没有处理？
      有没有不安全的类型断言（as）？

    快速方法：
      搜索 catch、if (null、if (!、as
      这些关键词周围的代码需要重点关注。

  12.1.3 依赖审查

    检查新增的 import 是否合理。

    关注点：
      是否引入了新的第三方库？如果有，体积和必要性如何？
      是否有循环依赖？（A import B，B import A）
      是否有不该出现的依赖？（如 lib/ import 了 components/）

    快速方法：
      检查 package.json 是否有新增依赖。
      检查新增文件的 import 语句。

  12.1.4 接口审查

    检查新代码与已有代码的接口是否兼容。

    关注点：
      修改了已有的函数签名吗？（如果改了，所有调用方都要更新）
      新增的 Props 是可选的还是必填的？（必填的 Props 变更是 breaking change）
      数据库新增的字段是必填的吗？（旧数据怎么处理？）

12.2 审查的频率

  不是每写一行都要审查。
  按以下节奏审查：

    小功能完成后：快速检查结构和类型
    里程碑完成后：完整审查（结构 + 边界 + 依赖 + 接口）
    重构完成后：重点审查接口兼容性和测试覆盖


========================================
第八篇：重构
========================================

第十三章：重构方法论
========================================

13.1 什么是重构

  重构：改变代码的内部结构，不改变外部行为。

  重构不是：
    加新功能（改变行为）
    修 bug（改变行为——从错误变正确）
    性能优化（可能改变行为——缓存逻辑影响结果）

  重构是：
    把大文件拆成小文件（功能不变）
    把重复代码提取为公共函数（功能不变）
    把目录结构重新组织（功能不变）
    把复杂函数简化（功能不变）

13.2 什么时候重构

  信号 1：文件持续膨胀
    每次改这个文件都变大。
    从 100 行长到 300 行再到 500 行。
    说明这个文件承担了过多职责。

  信号 2：修改牵连广泛
    "改一个按钮的样式"需要改 5 个文件。
    说明耦合过紧。

  信号 3：新功能无处安放
    "这个功能放在哪个目录都不对"。
    说明目录结构不够用了。

  信号 4：重复代码
    同样的逻辑在 3 个以上的地方出现。
    修改一处时容易遗漏其他处。

  信号 5：AI 频繁犯同类错误
    AI 每次写类似的代码都用不同的方式。
    说明缺少抽象，AI 没有可参考的模式。

  信号 6：测试困难
    "这个函数没法单独测试，因为它依赖太多东西"。
    说明职责过重或耦合过紧。

13.3 重构方案模板

  重构前必须写方案。方案模板：

    重构方案

    一、问题描述
      当前是什么情况，为什么需要重构。
      具体的信号是什么。

    二、重构目标
      重构完成后应该是什么样子。
      用具体的指标：
        "所有文件不超过 200 行"
        "修改任意视图只需要改 1 个文件"
        "新组件的创建有明确的参考模板"

    三、影响范围
      哪些文件/模块会被改动？
      哪些功能可能受影响？
      需要同步更新哪些文档？

    四、重构步骤
      拆分为可独立验证的小步骤：
        步骤 1：提取公共函数到 utils/
          → 验证：测试通过，功能不变
        步骤 2：拆分组件文件
          → 验证：页面正常渲染，样式不变
        步骤 3：调整目录结构
          → 验证：所有 import 路径正确，构建成功
        步骤 4：更新文档
          → 验证：文档与代码一致

    五、验证方法
      如何确认重构没有破坏已有功能：
        - 运行全部测试
        - 按验收清单手动检查核心流程
        - 检查 TypeScript 编译无错误

    六、回滚方案
      重构前 Git commit 当前状态。
      如果重构出问题，回退到这个 commit。

13.4 重构的约束规则

  规则 1：重构和功能开发严格分开
    不要在同一个分支/提交中既重构又加功能。
    重构只改变结构，不改变行为。
    如果需要同时做，拆成两个步骤。

  规则 2：小步重构
    每次只做一个小变化，验证无误后再做下一个。
    不要一口气重构整个项目。

  规则 3：每步之后项目必须可用
    重构过程中的任何时刻，项目都应该是可运行的。
    不要出现"改了一半，暂时跑不了"的状态。

  规则 4：重构后必须跑测试
    如果有测试 → 跑全部测试
    如果没有测试 → 按验收清单手动检查
    重构不写测试是最大的风险。

  规则 5：重构后更新文档
    目录结构变了 → 更新 PROJECT_CONTEXT.md 中的结构概要
    组件拆分/合并了 → 更新 COMPONENTS.md
    不要让文档和代码脱节。


========================================
第九篇：部署与运维
========================================

第十四章：部署策略
========================================

14.1 部署方式选择

  根据项目特点选择部署方式：

  个人本地使用：
    Docker Compose 一键部署
    数据存储在本地
    通过 Tailscale/FRP 远程访问
    最简单、最安全

  有少量外部访问需求：
    云服务器 + Docker
    需要考虑域名、SSL、防火墙
    数据存储在服务器上

  零运维需求：
    Vercel / Cloudflare Pages（前端静态部署）
    Serverless Functions（API）
    不需要管理服务器
    但有限制（如函数执行时间、冷启动）

14.2 Docker 部署方案

  Dockerfile 编写原则：
    使用多阶段构建（减小镜像体积）
    只安装生产依赖
    使用非 root 用户运行
    固定基础镜像版本

  docker-compose.yml 的内容：
    应用服务
    数据卷挂载（持久化数据）
    网络配置
    环境变量
    健康检查

  环境变量管理：
    不要把敏感信息写在 docker-compose.yml 中
    使用 .env 文件（不提交到 Git）
    或使用 Docker secrets

14.3 持续集成（简化版）

  个人项目不需要完整的 CI/CD 系统。
  但以下自动化值得做：

    Git hook（pre-commit）：
      提交前自动运行 TypeScript 类型检查
      提交前自动运行 ESLint
      提交前检查单文件行数

    构建脚本：
      npm run check → 类型检查 + lint + 测试
      npm run build → 生产构建
      npm run deploy → 构建 + 部署

  这些脚本放在 package.json 的 scripts 中。
  每次发布前手动执行一遍即可。

14.4 备份策略

  自动备份：
    定时脚本导出数据到文件
    备份频率：每天一次
    保留策略：保留最近 30 天的备份

  手动备份：
    应用内的导出功能（HTML/MD/CSV/JSON）
    用户按需触发

  备份存储：
    本地备份 + 异地备份（如 NAS、云存储）
    不要把备份和原始数据放在同一台机器上


========================================
第十篇：与 AI 协作的约束机制
========================================

本篇汇总所有与 AI 协作的约束规则，
方便你直接复制到项目的规范文档中。


第十五章：AI 约束规则汇总
========================================

15.1 工程约束（写入 DEV_GUIDE.md 或 PROJECT_CONTEXT.md）

    代码工程规则（必须遵守）：

    1. 文件体积
       单个源文件不超过 300 行。
       如果预估超过 300 行，先说明拆分方案再写代码。

    2. 文件夹深度
       目录嵌套不超过 4 层。

    3. 单一职责
       每个文件只做一件事。
       一个文件同时包含 UI 和业务逻辑时必须拆分。

    4. 已有文件优先
       新建文件前先检查是否有可复用或可扩展的已有文件。
       功能相似度超过 60% 时扩展已有文件，不新建。

    5. 一致性
       写新代码前先阅读已有代码的风格，保持一致。
       需要改变风格时先说明理由。

    6. 类型安全
       所有函数参数和返回值必须有类型定义。
       不允许使用 any。
       组件必须定义 Props 类型。

    7. 命名规范
       组件文件：PascalCase
       工具/hook 文件：camelCase
       变量和函数：camelCase
       类型和接口：PascalCase
       常量：UPPER_SNAKE_CASE

    8. 注释
       复杂业务逻辑必须注释（说明为什么，不只是做了什么）
       外部系统交互必须注释
       临时方案和 TODO 必须标记

    9. 错误处理
       外部 API 调用必须有 try/catch
       用户输入必须校验
       错误信息必须对用户友好

    10. 禁止的行为
        组件中直接调用数据库操作（通过 hooks）
        lib/ 中引用 UI 组件
        硬编码配置值
        无错误处理的外部 API 调用
        一次提交改动超过 10 个文件

15.2 组件约束（写入 COMPONENTS.md）

    组件开发准则：

    1. 新建组件前先检查组件注册表
    2. 能通过增加 variant/props 解决的不新建
    3. 新建组件必须声明所属层级（Atom/Molecule/Organism）
    4. 新建后必须更新 COMPONENTS.md
    5. 同层级、结构相似度超过 60% 的组件必须合并

15.3 数据库约束（写入 DATA_MODEL.md）

    数据库开发准则：

    1. 表结构的唯一事实来源是 DATA_MODEL.md
    2. 变更前必须先更新文档，再执行变更
    3. 变更必须有迁移脚本（up + down）
    4. 删除操作必须确认数据已备份
    5. 新增字段必须说明旧数据如何处理
    6. 枚举值变更必须同步更新所有使用旧值的记录
    7. 版本号必须随变更递增

15.4 文档约束

    文档维护准则：

    1. 新增/修改组件 → 更新 COMPONENTS.md
    2. 新增/修改表或字段 → 更新 DATA_MODEL.md
    3. 任何代码变更 → 在 CHANGELOG.md 中记录
    4. 重大架构变更 → 更新 PROJECT_CONTEXT.md

15.5 测试约束

    测试编写准则：

    1. lib/ 层的函数必须有单元测试
    2. 测试覆盖正常流程和至少 2 个异常场景
    3. 测试文件放在 tests/ 目录下，与被测文件保持相同目录结构
    4. 使用 AAA 模式（Arrange-Act-Assert）
    5. 测试函数名用自然语言描述场景

15.6 重构约束

    重构准则：

    1. 重构和功能开发分开，不在同一个提交中
    2. 重构前必须写方案，确认后再执行
    3. 小步重构，每步可独立验证
    4. 重构前后行为不变
    5. 重构后必须跑测试
    6. 重构后必须更新文档

15.7 如何在对话中有效约束 AI

    对话开始时：
      提供 PROJECT_CONTEXT.md 的内容
      明确本次任务的范围和约束

    AI 出方案时：
      检查方案是否符合项目结构
      检查是否有组件/数据库的复用和扩展

    AI 写代码时：
      分批交付，每批检查
      不要让 AI 一次性输出超过 5 个文件的代码

    AI 交付后：
      按验收清单检查
      按质量检查清单审查
      确认文档更新