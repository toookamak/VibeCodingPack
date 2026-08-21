# Tasks

## 任务概览

将 15 篇 Markdown 文档整合为一个自包含的 HTML 页面，包含导航、搜索、主题切换等交互功能。

---

- [ ] Task 1: 创建 HTML 阅读器

  将全部 15 篇文档内容整合为单文件 HTML，包含完整的交互功能。

  - [ ] SubTask 1.1: 创建 HTML 基础结构（DOCTYPE、head、CSS 变量、主题切换）
  - [ ] SubTask 1.2: 实现左侧固定目录导航树（15 篇文档的章节结构，支持折叠/展开）
  - [ ] SubTask 1.3: 实现全文搜索功能（实时高亮匹配结果）
  - [ ] SubTask 1.4: 实现暗色/亮色主题切换（localStorage 记忆用户选择）
  - [ ] SubTask 1.5: 整合 00-14 共 15 篇文档的全部 Markdown 内容转为 HTML
  - [ ] SubTask 1.6: 实现代码块样式和表格美化
  - [ ] SubTask 1.7: 实现响应式布局和移动端适配
  - [ ] SubTask 1.8: 验证所有内容完整无遗漏

# Task Dependencies

- SubTask 1.1-1.4 为基础框架，可并行开发
- SubTask 1.5 依赖 1.1-1.4 完成后整合内容
- SubTask 1.6-1.8 为收尾工作
