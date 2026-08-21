# 文档体系 HTML 阅读器 Spec

## Why

15 篇 Markdown 文档分散在根目录，阅读体验依赖编辑器，缺乏全局导航和搜索能力。需要一个自包含的 HTML 页面，将全部内容整合为可交互的在线文档，提升可读性和查找效率。

## What Changes

- 新增 `VibeCoding Pack.html`，自包含单文件 HTML
- 整合全部 15 篇文档内容（00-14）
- 左侧固定目录导航，支持折叠/展开
- 全文搜索功能
- 暗色/亮色主题切换
- 响应式布局，移动端可用
- 代码块语法高亮
- 表格样式美化
- 平滑滚动定位

## Impact

- 新增 1 个文件：`VibeCoding Pack.html`（根目录）
- 不修改现有 Markdown 文件

## ADDED Requirements

### Requirement: 全内容 HTML 阅读器

系统 SHALL 提供一个自包含的 HTML 文件，整合全部 15 篇文档内容，具备以下交互功能：

#### Scenario: 全局导航

- **WHEN** 用户打开 HTML 页面
- **THEN** 左侧显示固定目录树，包含全部 15 篇文档的章节结构，点击可跳转

#### Scenario: 全文搜索

- **WHEN** 用户在搜索框输入关键词
- **THEN** 实时高亮匹配结果，支持在全部文档中搜索

#### Scenario: 主题切换

- **WHEN** 用户点击主题切换按钮
- **THEN** 页面在亮色/暗色主题间切换，记住用户选择

#### Scenario: 内容完整

- **WHEN** 用户浏览任意一篇文档
- **THEN** 内容与对应 Markdown 文件完全一致，无遗漏

## MODIFIED Requirements

无

## Removed Requirements

无
