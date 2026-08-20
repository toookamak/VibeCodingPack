========================================

========================================

项目：DogEar · 折耳书签
日期：2026-08-21
版本：v1.0


========================================
一、什么是组件化设计
========================================

组件化设计是将界面拆分为独立、可复用的组件单元的方法。
每个组件承担明确的职责，通过组合构建出完整的页面。

核心目标：
  - 减少重复代码，同一类 UI 只实现一次
  - 需求变更时只需修改一处
  - 新功能通过组合已有组件快速搭建
  - 保持项目结构清晰，降低维护成本

本项目采用"原子设计"作为组件拆分的方法论。


========================================
二、原子设计方法论
========================================

原子设计由 Brad Frost 提出，将组件按粒度从最小到最大分为五层。

2.1 五层结构

  第一层：原子（Atom）
    定义：最小的、不可再拆分的 UI 元素
    特征：没有业务逻辑，是纯视觉或纯交互的基础单元
    示例：按钮、输入框、标签、图标、开关、下拉框、分割线

  第二层：分子（Molecule）
    定义：由多个原子组合而成的、能完成一个独立小功能的单元
    特征：有明确的单一职责，比如"带图标的搜索框"
    示例：搜索框（输入框+图标+快捷键提示）、标签组、操作按钮组

  第三层：组织（Organism）
    定义：由分子和原子组合而成的、页面中的一个完整功能区块
    特征：有业务语义，能独立表达一个完整的信息或功能
    示例：书签卡片、列表行、侧边栏、弹窗、看板列

  第四层：模板（Template）
    定义：组织的布局组合，定义页面的骨架结构
    特征：用占位内容描述布局，不包含真实数据
    示例：工作台页面骨架（左侧栏+主内容区+右侧栏的布局关系）

  第五层：页面（Page）
    定义：模板填入真实数据后的最终产物
    特征：用户最终看到和操作的界面
    示例：导航页、工作台页面、整理模式页面

2.2 层级关系

  原子 → 组合成 → 分子 → 组合成 → 组织 → 布局为 → 模板 → 填充数据 → 页面

  上层可以使用下层，但下层不应依赖上层。
  同层之间可以组合，但应避免循环依赖。


========================================
三、AI 组件开发约束规则
========================================

以下规则用于约束 AI 在开发过程中的组件创建行为，
避免碎片化——即每个功能单独创建一个新组件的问题。

3.1 核心原则

  复用优先，扩展其次，新建最后。

  AI 在创建任何组件之前，必须先走"复用检查"流程。

3.2 复用检查流程

  步骤 1：检索组件注册表
    查看 COMPONENTS.md（项目中的组件注册文件），
    判断是否已有组件可以满足需求或通过扩展满足需求。

  步骤 2：判断是否可以扩展现有组件
    如果已有组件和新需求的结构相似度超过 60%，
    优先给现有组件增加 variant（变体）或 props（属性），
    而不是创建新组件。

  步骤 3：判断是否可以组合已有组件
    如果新功能可以拆解为多个已有组件的组合，
    用组合方式实现，不创建单体大组件。

  步骤 4：判断使用频率
    如果该组件只在一个地方使用，且没有复用可能，
    直接写在父组件内部，不独立抽取为单独组件。

  步骤 5：只有以上四个步骤都指向"需要新建"时，才允许新建组件。
    新建后必须更新 COMPONENTS.md。

3.3 扩展现有组件的判断标准

  以下情况应该扩展现有组件，不新建：

    - 布局结构相同，只是展示的内容不同
    - 可以通过 slot/children（插槽/子元素）来区分差异
    - 只是视觉样式不同，交互逻辑相同
    - 可以通过增加一个 variant 属性来覆盖新场景
    - 新需求是现有组件的"子集"或"超集"

  扩展的方式：

    - 增加 variant 属性：如 BookmarkCard 支持 grid / list / kanban 三种变体
    - 增加 size 属性：如 Button 支持 s / m / l 三种尺寸
    - 增加可选插槽：如 Modal 支持 title / footer / content 插槽
    - 增加布尔开关：如 Card 支持 selectable(true/false)、showCover(true/false)

3.4 可以新建组件的判断标准

  以下情况允许新建组件：

    - 功能语义完全不同（如"书签卡片"和"搜索框"是完全不同的功能）
    - 数据结构差异大，强行复用会导致大量条件分支，反而降低可读性
    - 复用会导致现有组件的 API 膨胀，变得不可理解
    - 属于不同的原子设计层级

3.5 组件命名规范

  - 原子层：使用通用 UI 词汇，如 Button、Input、Tag、Icon
  - 分子层：功能描述式命名，如 SearchBox、TagGroup、ActionBar
  - 组织层：业务语义命名，如 BookmarkCard、Sidebar、FolderOverlay
  - 避免用页面名或位置来命名组件（如 LeftPanel、TopSection），
    因为组件应该可在不同位置复用

3.6 组件 API 设计原则

  - 一个组件的 props 不宜超过 8 个，超过时应考虑拆分
  - 用 variant 而非多个布尔值来控制样式切换
    错误：showBorder / showShadow / showIcon 三个布尔
    正确：variant="compact" | "default" | "featured"
  - 用 children 或 slot 做内容注入，让组件不关心具体内容
  - 回调函数统一用 on 前缀：onClick、onSelect、onClose


========================================
四、组件注册表规范
========================================

每个项目应维护一份 COMPONENTS.md 文件，
作为组件的唯一索引，AI 和人类开发者共同维护。

4.1 注册表格式

  每个组件记录以下信息：
    - 组件名
    - 所属层级（Atom / Molecule / Organism）
    - 用途说明（一句话）
    - 核心 props
    - 支持的 variant（如有）
    - 使用位置（在哪些页面中使用）

4.2 注册表示例

  见本项目范例部分。


========================================
五、与 AI 协作的实际操作建议
========================================

5.1 在 Prompt 中注入约束规则

  在项目的 system prompt 或项目说明文件中，加入以下内容：

  ----
  组件开发准则：

  1. 新建任何组件前，先检查 COMPONENTS.md
  2. 能通过扩展 props/variant 解决的，不新建
  3. 新建组件必须声明所属层级（Atom/Molecule/Organism）
  4. 新建后必须更新 COMPONENTS.md
  5. 同层级、结构相似度超过 60% 的组件，必须合并
  ----

5.2 给 AI 的操作指令模板

  当你要求 AI 实现新功能时，可以这样表述：

  ----
  实现 [功能描述]。
  要求：
  - 先检查 COMPONENTS.md，看是否有可复用或可扩展的组件
  - 如果需要新建组件，说明为什么现有组件不适用
  - 新建后更新 COMPONENTS.md
  ----

5.3 代码审查要点

  每次 AI 交付代码后，检查：
    - 是否新建了不必要的组件（结构和已有组件高度相似）
    - 新组件是否已注册到 COMPONENTS.md
    - 组件的 props 设计是否合理（不超过 8 个，用 variant 而非多布尔）
    - 同类组件之间是否有代码重复


========================================
六、DogEar 项目范例
========================================

以下基于 DogEar·折耳书签的原型拆分，
展示如何用原子设计方法论整理组件，
以及如何通过合并减少组件数量。

6.1 组件注册表（COMPONENTS.md）

------ 第一层：Atom（原子）------

  Button
    层级：Atom
    用途：通用按钮
    props：variant(primary/secondary/ghost/danger), size(s/m/l), disabled, onClick, children
    使用位置：全局

  Input
    层级：Atom
    用途：通用输入框
    props：type(text/password), value, placeholder, onChange, prefix, suffix
    使用位置：全局

  Tag
    层级：Atom
    用途：标签/徽章
    props：variant(default/accent/success/warning/danger), size(s/m), closable, onClick, children
    使用位置：卡片、列表行、看板卡片、预览面板、分拣条目、日志来源标签

  Icon
    层级：Atom
    用途：图标展示
    props：name, size(s/m/l), color
    使用位置：全局

  Toggle
    层级：Atom
    用途：开关
    props：on, onChange, disabled
    使用位置：设置弹窗

  Select
    层级：Atom
    用途：下拉选择器
    props：options, value, onChange, placeholder
    使用位置：工作台排序、设置弹窗、编辑面板

  Badge
    层级：Atom
    用途：数量角标
    props：count, variant(accent/muted), overflow(显示 99+)
    使用位置：侧边栏导航入口、Tab 标签

  Tooltip
    层级：Atom
    用途：悬浮提示
    props：content, position(top/bottom/left/right), children
    使用位置：Docker 栏图标

  Checkbox
    层级：Atom
    用途：复选框
    props：checked, onChange, label
    使用位置：列表行、批量选择

  Divider
    层级：Atom
    用途：分割线
    使用位置：侧边栏


------ 第二层：Molecule（分子）------

  SearchBox
    层级：Molecule
    用途：搜索框（图标 + 输入框 + 快捷键提示）
    组成：Icon + Input
    props：placeholder, shortcutHint(如"⌘K"), onSearch, size(s/m)
    使用位置：导航页 Hero 区、工作台顶部栏

  TagGroup
    层级：Molecule
    用途：标签组（多个标签的排列）
    组成：多个 Tag
    props：tags(数组), maxVisible(超出折叠), onTagClick, onTagClose
    使用位置：书签卡片、列表行、预览面板、细分拣条目

  ActionBar
    层级：Molecule
    用途：操作按钮组
    组成：多个 Button
    props：actions(数组，每项含 label/icon/variant/onClick), layout(horizontal/vertical)
    使用位置：卡片悬浮操作、分拣条目、整理模式底部栏、批量操作栏

  TabBar
    层级：Molecule
    用途：标签栏切换
    组成：多个可点击的文字标签
    props：tabs(数组), activeKey, onChange, orientation(horizontal/vertical), badge(每项可选角标)
    使用位置：顶部页面切换、导航页内容标签、右侧面板 Tab、整理模式阶段切换

  StatDisplay
    层级：Molecule
    用途：数值+标签的统计展示
    组成：数字文本 + 描述文本
    props：value, label, color, size(s/m/l)
    使用位置：小组件、统计卡片

  ProgressBar
    层级：Molecule
    用途：进度条
    组成：背景条 + 填充条 + 文本
    props：value(0-100), label, color
    使用位置：整理模式进度

  DomainBar
    层级：Molecule
    用途：域名统计条目（域名 + 柱状条 + 数值）
    组成：文本 + 进度条 + 数字
    props：name, count, maxCount
    使用位置：工具面板域名统计

  KeyValueRow
    层级：Molecule
    用途：键值对展示行
    组成：左侧标签 + 右侧值
    props：label, value, action(可选的操作按钮)
    使用位置：统计面板、日志行


------ 第三层：Organism（组织）------

  LinkIcon
    层级：Organism
    用途：链接/书签的图标展示，支持书签和文件夹两种形态
    组成：Icon（favicon 或首字母）+ 标签文本
    props：
      variant: bookmark | folder
      favicon: 图标 URL
      label: 显示名称
      folderPreview: 文件夹内前4个小图（variant=folder 时使用）
      size: s | m | l
      onClick: 点击回调
      tooltip: 悬浮提示文本（Docker 场景使用）
    说明：
      导航页的书签图标、文件夹图标、Docker 栏中的图标
      本质上都是"一个可点击的图标+标签"，
      只是 icon 来源和交互行为不同，合并为一个组件。
      Docker 场景通过加 tooltip 和 size 区分。
    使用位置：导航页内容区、文件夹浮层、Docker 栏

  BookmarkCard
    层级：Organism
    用途：书签的卡片展示，支持三种视图模式
    组成：封面区 + 标题 + 元数据 + TagGroup + ActionBar
    props：
      variant: grid | list | kanban
      data: 书签数据对象（title/url/domain/tags/folder/status/cover/createdAt）
      selectable: 是否可选中
      selected: 是否已选中
      onSelect: 选中回调
      onAction: 操作回调（移动/标签/已读/归档/删除）
    说明：
      网格视图的卡片、列表视图的行、看板视图的卡片
      本质上都是"一条书签的不同展示方式"，
      数据结构完全相同，只是布局不同。
      合并为一个组件，通过 variant 切换布局。
    使用位置：工作台网格视图、列表视图、看板视图

  KanbanColumn
    层级：Organism
    用途：看板视图中的一列
    组成：列头（标题 + 计数）+ 列体（多个 BookmarkCard variant=kanban）
    props：title, count, items, color, onItemAction
    使用位置：工作台看板视图

  Sidebar
    层级：Organism
    用途：工作台左侧导航面板
    组成：多个导航分组，每组含多个入口项
    props：
      sections: 导航分组数据
      activeKey: 当前选中项
      onSelect: 选中回调
    使用位置：工作台左侧

  ToolPanel
    层级：Organism
    用途：工作台右侧工具面板容器
    组成：TabBar + 内容区域
    props：
      open: 是否展开
      activeTab: 当前 Tab
      onTabChange: Tab 切换回调
      children: 各 Tab 的内容插槽
    使用位置：工作台右侧

  PreviewPanel
    层级：Organism
    用途：内容预览面板（展示书签详细信息）
    组成：标题 + URL + AI 摘要 + TagGroup + 打开按钮
    props：
      data: 书签详细数据
      onOpen: 在浏览器中打开的回调
    使用位置：整理模式右侧预览区、工作台待处理预览（侧滑或内嵌）

  SortItem
    层级：Organism
    用途：分拣模式中的条目（保留/删除/待定的操作项）
    组成：图标 + 标题 + 域名 + ActionBar（保留/删除/待定）
    props：
      data: 书签数据
      status: null | keep | del | maybe
      onAction: 操作回调
      active: 是否为当前选中
    使用位置：整理模式阶段一列表

  OrganizeItem
    层级：Organism
    用途：细分拣中的归档条目（AI 建议 + 确认/修改）
    组成：标题 + AI 建议（文件夹 + 标签）+ 操作按钮
    props：
      data: 书签数据
      aiSuggestion: AI 建议数据（folder + tags）
      onAccept: 采纳回调
      onEdit: 修改回调
    使用位置：整理模式阶段二列表

  WidgetBox
    层级：Organism
    用途：导航页小组件容器
    组成：标题 + 内容区（可变）
    props：
      title: 小组件标题
      icon: 标题图标
      size: 1x1 | 2x1 | 2x2
      children: 内容（可为数值、列表、自定义）
      onClick: 整体点击回调
    说明：
      所有导航页小组件（稍后读、待办、最近访问、本周统计）
      共用同一个容器组件，通过 children 传入不同内容。
      稍后读：children = StatDisplay（数量）+ 提示文本
      待办：children = StatDisplay（数量）+ 提示文本
      最近访问：children = 迷你列表
      本周统计：children = StatDisplay（数量）+ 提示文本
    使用位置：导航页小组件区

  DockBar
    层级：Organism
    用途：导航页底部常驻 Docker 栏
    组成：半透明背景容器 + 多个 LinkIcon（variant=bookmark, tooltip=true）
    props：
      items: Docker 内容列表
      onItemClick: 点击回调
    使用位置：导航页底部

  DataTable
    层级：Organism
    用途：通用数据表格
    组成：表头行 + 多个数据行
    props：
      columns: 列定义
      rows: 数据
      onRowClick: 行点击回调
    使用位置：日志弹窗

  Modal
    层级：Organism
    用途：通用模态弹窗容器
    组成：遮罩层 + 面板（头部 + 内容区）
    props：
      open: 是否打开
      title: 标题
      onClose: 关闭回调
      children: 内容插槽
      width: 宽度
    使用位置：Skill API / 导出 / 设置 / 日志 弹窗

  Overlay
    层级：Organism
    用途：浮层容器（非模态，点击外部可关闭）
    组成：半透明背景 + 面板
    props：
      open: 是否打开
      onClose: 关闭回调
      children: 内容插槽
    使用位置：导航页文件夹展开浮层

  BatchBar
    层级：Organism
    用途：底部批量操作栏
    组成：计数 + 分隔线 + 多个操作按钮
    props：
      show: 是否显示
      count: 选中数量
      actions: 操作按钮列表
    使用位置：工作台、整理模式

  Toast
    层级：Organism
    用途：操作反馈通知
    组成：消息文本 + 撤销按钮
    props：
      show: 是否显示
      message: 消息内容
      undoable: 是否可撤销
      onUndo: 撤销回调
    使用位置：全局


------ 组件统计 ------

  原子（Atom）：    10 个
  分子（Molecule）： 8 个
  组织（Organism）：18 个
  合计：            36 个

  对比原始拆分的 63 个，减少了 27 个组件（减少 43%）。


6.2 合并对照表

  以下列出原始拆分中被合并的组件及其合并依据：

  合并 1：S1-I1 + S1-D1 + S1-I2 → LinkIcon
    原组件：书签图标 + Docker 图标项 + 文件夹图标
    合并依据：三者本质都是"可点击的图标 + 标签"，
              区别仅在 icon 来源（favicon / 首字母 / 文件夹拼合）和附加行为（tooltip）。
              通过 variant 和 props 区分即可。
    减少：2 个组件

  合并 2：S2-C1 + S2-C2 + S2-C4 → BookmarkCard
    原组件：网格卡片 + 列表行 + 看板卡片
    合并依据：三者展示的是同一条书签数据，只是布局方式不同。
              数据结构完全相同（title/url/domain/tags/folder/status/cover/createdAt），
              通过 variant 切换布局样式。
    减少：2 个组件

  合并 3：S2-R1-2 + S2-R1-3 + S2-R1-4 + S2-R1-5 → 统一 ToolModule 设计思路
    原组件：死链检测 + 重复收藏 + 标签整理 + 域名统计
    说明：这四个虽然注册为独立模块，但共用了相同的容器结构：
          标题 + 状态/数据 + 操作按钮。
          可用一个通用的 ToolSection 容器来包裹，
          各工具的具体内容通过 children 传入。
          不强制合并为一个组件，但共用容器。
    减少：3 个组件（4个独立模块 → 1个容器 + 4个内容块）

  合并 4：S3-L1-1 + S2-P1 → SortItem（扩展后兼顾两个场景）
    原组件：分拣条目 + 待处理列表项
    合并依据：两者结构相同（标题 + 域名 + 操作按钮），
              区别在操作按钮的不同和状态标记。
              通过 props 区分场景即可。
    减少：1 个组件

  合并 5：S1-W1/W2/W3/W4 → 共用 WidgetBox
    原组件：稍后读 + 待办 + 最近访问 + 本周统计 四个独立小组件
    合并依据：四者容器结构完全相同（标题 + 内容区），
              只是内容不同。用 WidgetBox 做通用容器，
              内容通过 children 传入。
    减少：3 个组件

  合并 6：M2/M3/M4 的弹窗容器 → 共用 Modal
    原组件：导出弹窗 + 设置弹窗 + 日志弹窗 各自独立的弹窗容器
    合并依据：弹窗的容器结构（遮罩 + 面板 + 头部 + 关闭按钮）完全相同，
              区别只在内容。用 Modal 做通用容器。
    减少：2 个容器（3个弹窗容器 → 1个 Modal）


6.3 每个页面使用到的组件清单

  导航页（S1）使用组件：
    原子层：Input, Icon, Tag
    分子层：SearchBox, TabBar
    组织层：LinkIcon, WidgetBox, DockBar, Overlay

  工作台（S2）使用组件：
    原子层：Button, Input, Tag, Icon, Select, Badge, Checkbox, Divider
    分子层：SearchBox, TabBar, TagGroup, ActionBar, StatDisplay, DomainBar, KeyValueRow
    组织层：Sidebar, BookmarkCard, KanbanColumn, ToolPanel, DataTable, Modal, BatchBar, Toast

  整理模式（S3）使用组件：
    原子层：Button, Tag, Icon
    分子层：TabBar, TagGroup, ActionBar, ProgressBar
    组织层：SortItem, OrganizeItem, PreviewPanel, BatchBar, Toast


========================================
七、维护与迭代
========================================

7.1 何时更新 COMPONENTS.md

  - 新建组件时：添加条目
  - 合并组件时：删除被合并的条目，更新合并后的条目
  - 修改组件 props 时：更新 props 描述
  - 每次 AI 交付代码后：对照检查是否遗漏更新

7.2 定期审查

  建议每隔一段时间（如每完成一个 Phase）做一次组件审查：
    - 是否有结构相似但未合并的组件
    - 是否有只用了一次的组件（考虑合并回父组件）
    - 是否有 props 过多的组件（考虑拆分）
    - COMPONENTS.md 是否与实际代码一致

7.3 组件的生命周期

  新建 → 使用 → 发现相似组件 → 合并 → 更新注册表
  新建 → 使用 → 发现职责过重 → 拆分 → 更新注册表
  新建 → 使用 → 不再使用 → 标记废弃 → 清理