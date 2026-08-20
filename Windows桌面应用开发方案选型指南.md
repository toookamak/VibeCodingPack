# Windows 桌面应用开发方案选型指南

> 适用范围：个人 / 小规模团队、工具型应用、全程 AI 辅助开发、零许可证/零商业授权成本。
> 文档定位：对入围方案给出完整说明（流程、特点、成本复杂度、多平台适配、UI 美观度、生态成熟度、前置准备、发布条件），用于选型决策与后续查用。

---

## 0. 选型背景与约束

本文档基于以下约束条件筛选方案：

| 约束 | 说明 |
|---|---|
| 使用规模 | 个人 / 小规模团队，非千人规模高并发企业应用 |
| 应用类型 | 工具型应用（文件处理、阅读器、批量处理、数据工具等） |
| 开发方式 | 全程 AI 辅助开发，不依赖团队既有技能栈 |
| 许可证 | 仅接受免费方案，不接受需商业授权的框架/控件 |
| 复杂度 | 不做微服务架构，追求"能跑、好改、易分发" |

入围方案（6 条）：

1. **WPF（.NET 8）** — Windows 原生，工具型应用首选
2. **WinForms（.NET 8）** — Windows 原生，极简小工具
3. **Tauri 2** — 跨平台轻量（Rust + 系统 WebView）
4. **Electron** — 跨平台重型（Chromium + Node.js）
5. **Flutter Desktop** — 跨平台三端 UI 一致
6. **Python + PySide6 / customtkinter** — 脚本型快速工具

---

## 1. WPF（.NET 8，C#）

### 1.1 概述与开发流程

微软于 2006 年推出的 Windows 原生桌面框架，XAML 声明式 UI + C# 逻辑层，MVVM 模式。至今仍是 Windows 复杂业务客户端的事实标准。

```
dotnet new wpf -> 设计 XAML 界面 -> C# 实现 ViewModel -> Markdig 等库接入功能
-> 本地测试 -> dotnet publish 单文件发布 -> 安装包/免安装分发
```

### 1.2 特点与成本复杂度

- 矢量渲染、数据绑定（MVVM）、控件模板完全可定制、动画与样式能力强。
- 学习曲线：中高（MVVM 概念），但 AI 语料极充足，生成质量高。
- 开发效率：中高，复杂 UI 开发效率优于传统 Win32/WinForms。

### 1.3 多平台适配

- **仅 Windows**。不原生支持 macOS / Linux（可用 Avalonia 获得 WPF 体验并跨平台，属另一方案）。

### 1.4 UI 美观度

- **默认观感：中下**。默认控件仍是 2010 年前后风格，直接使用观感老旧。
- **上限：高**。模板/样式/动画完全自定义，配合开源控件库可达到现代水准：
  - HandyControl（中文社区活跃，Material 风控件库）
  - MaterialDesignInXAML（Material Design 风格）
  - ModernWpf（Win11 风格 Fluent UI）
- **结论：想要好看必须投入样式定制（AI 可代劳），原生控件不给免费的好看。**

### 1.5 生态成熟度

- **极高（18 年历史）**。文档、博客、开源控件、问题答案都极其丰富，AI 训练语料最厚实。
- 工具型常用库：Markdig（Markdown）、SQLite-net / Microsoft.Data.Sqlite、Newtonsoft.Json、LiveCharts2（图表）、Serilog（日志）。
- 商业控件（DevExpress / Telerik）需付费，本文档路线下不采用，开源替代基本够用。

### 1.6 前置准备条件

| 项目 | 说明 |
|---|---|
| 运行时 | 安装 .NET 8 SDK（https://dotnet.microsoft.com/download） |
| 编辑器 | 任意（VS Code + C# 扩展 / VS 2022 社区版均可） |
| 验证 | `dotnet --version` 输出 8.x |
| 创建工程 | `dotnet new wpf -n MyTool` |

无额外依赖，无许可证费用。

### 1.7 发布条件

- **单文件免安装**：`dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true`，产出约 60–80MB 单个 exe，双击即用，目标机无需安装 .NET。
- **安装包**：Inno Setup（免费）/ NSIS（免费）/ MSIX。
- **代码签名**：仅公网发布建议购买签名证书（几百元/年）；个人自用可跳过（会有 SmartScreen 提示，自己电脑可直接"仍要运行"）。
- **更新机制**：个人工具可手动覆盖版本；需要自动更新可接 Squirrel.Windows / Velopack（免费）。
- **长期维护**：.NET LTS 版本微软官方长期支持，风险低。

---

## 2. WinForms（.NET 8，C#）

### 2.1 概述与开发流程

Windows 最古老的托管桌面框架（2001 年起），拖控件 + 事件回调，几乎零学习门槛。

```
dotnet new winforms -> 设计器中拖控件 -> 写事件处理器 -> 发布单文件
```

### 2.2 特点与成本复杂度

- 开发速度最快，代码量最小，AI 生成一次成型的概率最高。
- 学习曲线：极低。适合三天内交付的内部小工具。
- 控件观感老旧、自定义能力弱（无 WPF 级别的模板系统）。

### 2.3 多平台适配

- **仅 Windows**。不可跨平台。

### 2.4 UI 美观度

- **默认观感：最低**。经典 Win32 风格控件，高 DPI 适配有历史包袱（.NET 6+ 有改善但一般）。
- **上限：中**。可用开源主题库提升：SunnyUI、MaterialSkin、Krypton、MetroFramework。
- **结论：定位是"快"而不是"美"；需要精美界面的场景请选 WPF。**

### 2.5 生态成熟度

- **极高**。20 余年积累，资料海量，商业控件生态庞大（本路线不用）。
- 工具型常用库与 WPF 通用（同属 .NET 生态）：SQLite、Json.NET 等。

### 2.6 前置准备条件

与 WPF 完全一致：安装 .NET 8 SDK，`dotnet new winforms` 即可。零依赖、零费用。

### 2.7 发布条件

- 单文件免安装发布（同 WPF 命令），体积约 50MB。
- 其余分发/签名/更新策略与 WPF 相同。

---

## 3. Tauri 2（Rust + Web 前端）

### 3.1 概述

用 Rust 写核心逻辑，前端用系统 WebView（Windows 上为 WebView2）渲染，前后端通过 IPC 通信。Electron 的轻量替代者。架构上本质是"**浏览器渲染 UI + 一个 Rust 小服务**"，两者通过 `invoke()` 双向调用。

### 3.1.1 项目结构

以默认的 `create-tauri-app`（Vite + React 模板）为例：

```
my-tauri-app/
├── src/                          # 前端渲染层（就是普通 Web 工程）
│   ├── index.html
│   ├── main.tsx                  # React 入口
│   ├── App.tsx                   # 界面组件
│   └── assets/                   # 静态资源
├── src-tauri/                    # Rust 后端（核心工程）
│   ├── src/
│   │   ├── main.rs               # 应用入口：窗口创建、插件注册、事件循环
│   │   └── lib.rs                # 定义 #[tauri::command] 命令
│   ├── capabilities/             # 2.x 权限模型（声明能调哪些系统能力）
│   │   └── default.json
│   ├── icons/                    # 应用图标（自动生成各尺寸）
│   ├── tauri.conf.json           # 核心配置：窗口尺寸、产品名、打包格式、更新服务器
│   ├── Cargo.toml                # Rust 依赖（tauri、tauri-plugin-*）
│   └── build.rs
├── package.json                  # 前端依赖 + 脚本（tauri dev / tauri build）
├── vite.config.ts
└── public/                       # 前端静态文件
```

**关键目录说明：**
- `src/` 与 `src-tauri/` 是严格分离的两层，靠 IPC 通信——前端永远拿不到文件系统等原生能力，必须经 Rust 命令中转。
- `tauri.conf.json` 是"总开关"：窗口行为、打包目标（NSIS/MSI/dmg）、自动更新地址都在这里配。
- `capabilities/default.json` 是 Tauri 2 的安全特性：**每个权限（读文件、写文件、弹窗）都要显式声明**，否则调用会失败。

### 3.1.2 开发流程（分步）

1. **创建工程**：`npm create tauri-app@latest`，交互式选择前端框架（Vanilla/Vue/React/Svelte）。
2. **开发前端**：`npm run tauri dev` 启动，窗口弹出，前端代码改完**即时热更新**（与纯 Web 开发体验一致）。
3. **定义 Rust 命令**：在 `lib.rs` 里写

   ```rust
   #[tauri::command]
   fn read_file(path: String) -> String {
       std::fs::read_to_string(path).unwrap_or_default()
   }
   ```

   并在 `main.rs` 的 `.invoke_handler(tauri::generate_handler![read_file])` 注册。
4. **前端调用**：`const content = await invoke('read_file', { path });`——参数名自动转 camelCase。
5. **声明权限**：若命令用到官方插件（如 `tauri-plugin-fs`），在 `capabilities/default.json` 里加权限声明。
6. **配置与打包**：改好 `tauri.conf.json` 后 `npm run tauri build`，自动产出 NSIS/MSI 安装包。
7. **发布**：可选接 updater 插件（需要一个静态文件服务器放版本 json + 签名后的安装包）。

**典型调试循环**：改前端 → 浏览器自动刷新 → 需要系统能力时调 invoke → 看 Rust 端 `println!`/日志 → 修 bug → 继续。前端渲染问题可以直接开浏览器 DevTools（Ctrl+Shift+I）。

### 3.2 特点与成本复杂度

- 安装包 8–15MB（Electron 的 1/15），内存占用约 50–150MB。
- 前端技术（HTML/CSS/JS）做 UI，自由度与精美度上限最高。
- 学习曲线：中高。前端部分 AI 语料充足；Rust 部分（调用系统能力、文件读写、进程等）语料相对少，复杂逻辑偶尔需人工修正。
- 工具型应用通常只需很薄的 Rust 桥接层，整体成本可控。

### 3.3 多平台适配

- **Windows / macOS / Linux 一套代码**。Win 10 老版本需要系统预装 WebView2 运行时（Win11 自带）。

### 3.4 UI 美观度

- **上限：最高（web 级）**。可组合 Tailwind CSS、shadcn/ui、Framer Motion 等任意前端方案。
- 渲染 Markdown 直接用 markdown-it + highlight.js + KaTeX，开箱即用且效果好。
- 默认无内置主题，全部由前端自由发挥——**对"要好看"是最省力的路线**。

### 3.5 生态成熟度

- **较新但增速快**。Tauri 2.x 已稳定；官方插件（文件系统、对话框、剪贴板、托盘、通知、自动更新）成熟。
- 第三方插件远少于 Electron，但工具型应用用官方插件基本够。
- Rust crate 生态（serde、tauri-plugin-*）持续扩张。

### 3.6 前置准备条件

| 项目 | 说明 |
|---|---|
| Rust 工具链 | https://rustup.rs，`rustc --version` 验证 |
| C++ 编译链 | VS 2022 生成工具 / MSVC Build Tools（Windows 编译 Rust 必需） |
| Node.js | 18+（仅用于前端构建） |
| WebView2 | Win11 自带；Win10 需系统安装 WebView2 运行时（免费） |
| 创建工程 | `npm create tauri-app@latest` |

全部免费，无许可证费用。

### 3.7 发布条件

- 打包：`npm run tauri build` 自动产出 NSIS 安装包 / MSI / MSIX。
- 体积：8–15MB。
- 运行时：目标机需 WebView2（Win11 预装，Win10 安装包可引导安装）。
- 代码签名：公网发布建议签名；自用可跳过。
- 自动更新：内置 updater 插件（需一个静态文件服务器放版本文件）。
- 注意：Windows 上无法直接交叉构建 macOS 安装包（macOS 包需在 Mac 上构建）。

### 3.8 典型应用举例

- **局域网文件传输**：Flying Carpet（Tauri 2 开源案例，无需服务器跨设备传文件）。
- **跨平台文件管理器**：Spacedrive（虚拟化本地/云文件系统，Rust + Tauri）。
- **Markdown 编辑器/阅读器**：MDJunction、各类笔记工具——markdown-it 渲染 + Tauri 读写本地文件，正是典型形态。
- **个人效率工具**：剪贴板管理、批量重命名、图片压缩/格式转换、壁纸下载器、启动器类工具。
- **系统状态类**：内存/CPU 监控、网络测速、定时提醒、端口检测。
- **适用画像总结**：**单窗口为主、UI 以 Web 技术实现、需要轻量读写本地文件、要漂亮但不要重型运行时**的工具。

---

## 4. Electron（Chromium + Node.js + Web 前端）

### 4.1 概述

把整个 Chromium 浏览器和 Node.js 打包进应用。VS Code、Slack、Discord、Notion 等大量知名产品使用。架构上由**主进程**（Node.js 环境，管系统能力）+ **渲染进程**（Chromium 环境，画 UI）+ **preload 桥接**（安全地连通两边的桥梁）三部分组成。

### 4.1.1 项目结构

以 `electron-forge` / 官方快速开始模板为例：

```
my-electron-app/
├── package.json                  # 主入口 main 字段指向主进程文件
├── main.js                       # 主进程：创建窗口、生命周期、系统能力
├── preload.js                    # 预加载脚本：contextBridge 暴露安全 API
├── renderer/                     # 渲染进程（本质就是一个网页）
│   ├── index.html                # 界面
│   ├── renderer.js               # 前端逻辑
│   └── styles.css
├── assets/                       # 图标、静态资源
├── build/                        # 打包配置与产物
├── forge.config.js               # electron-forge 打包/启动配置
└── node_modules/
```

**关键角色说明：**
- **主进程（main.js）**：应用的大脑。负责创建/管理窗口、读写文件、托盘、系统集成；相当于 Node.js 服务端。
- **渲染进程（renderer/）**：就是普通网页，跑 Chromium。**默认拿不到任何系统能力**（安全设计）。
- **preload.js**：唯一的合法桥梁。用 `contextBridge.exposeInMainWorld()` 把经过筛选的 API 挂到 `window` 上，渲染进程只能用它暴露的东西。

### 4.1.2 开发流程（分步）

1. **创建工程**：`npm init electron-app@latest my-app`（或 `npm create @quick-start/electron` 的脚手架，可选 Vue/React 模板）。
2. **启动调试**：`npm start` 弹出应用窗口。渲染进程自带 DevTools（Ctrl+Shift+I），主进程日志输出在终端。
3. **主进程建窗口**：`main.js` 中 `new BrowserWindow({ webPreferences: { preload } })` 加载 `index.html`。
4. **preload 暴露 API**：

   ```js
   // preload.js
   const { contextBridge, ipcRenderer } = require('electron');
   contextBridge.exposeInMainWorld('appAPI', {
       readFile: (p) => ipcRenderer.invoke('read-file', p),
   });
   ```

5. **主进程处理 IPC**：

   ```js
   // main.js
   ipcMain.handle('read-file', async (e, p) => require('fs').readFileSync(p, 'utf8'));
   ```

6. **渲染进程调用**：`window.appAPI.readFile(path)` 拿到文件内容。
7. **打包**：`npm run make`（forge）或 electron-builder 产出 NSIS 安装包。
8. **发布**：接 electron-updater 自动更新（需文件服务器）；macOS 需在 Mac 上签名打包。

**典型调试循环**：改渲染进程代码 → Ctrl+R 刷新窗口（或 DevTools 热重载）→ 改主进程代码 → 重启应用（主进程改动不会热更新，`npm start` 重启即可）→ 反复迭代。

### 4.2 特点与成本复杂度

- 生态最大、前端技能全复用、任何 Web 能力开箱即用。
- 学习曲线：低（纯前端开发）。
- **代价：体积 150–250MB、内存常驻 300MB+**，旧电脑（4GB 内存）体验差。
- 对于个人工具型应用，这个体积/内存开销通常是"不必要的重"。

### 4.3 多平台适配

- Windows / macOS / Linux 一套代码。
- macOS 安装包（dmg）构建与签名需要在 macOS 环境下完成。

### 4.4 UI 美观度

- 同 Tauri：**上限最高（web 级）**，前端生态任意选用。

### 4.5 生态成熟度

- **最高**。npm 生态数百万包，桌面端三方模块（托盘、自动更新、窗口管理）最成熟，问题答案最多，AI 语料最充足。

### 4.6 前置准备条件

| 项目 | 说明 |
|---|---|
| Node.js | 18+（https://nodejs.org） |
| 创建工程 | `npm create @quick-start/electron` 或 electron-forge 脚手架 |
| 首次安装 | `npm install` 会下载 Chromium 二进制，网络慢需配镜像 |

全部免费（MIT）。

### 4.7 发布条件

- 打包：electron-builder / electron-forge 产出 NSIS 安装包、dmg、deb 等。
- 体积：150–250MB。
- 代码签名：Windows 公网发布建议签名；macOS 发布必须 Apple 开发者证书 + 公证（约 688 元/年）。
- 自动更新：electron-updater 成熟，需文件服务器。

### 4.8 典型应用举例

- **代码编辑器/IDE**：VS Code（Electron 最成功的案例，证明复杂桌面应用完全可行）。
- **笔记/知识管理**：Obsidian、Notion 桌面版、语雀桌面版。
- **即时通讯/协作**：Slack、Discord、飞书桌面版。
- **效率/工具**：1Password、Postman 桌面版、GitHub Desktop、Typora（Markdown 写作）。
- **开发工具类**：微信开发者工具、各种云厂商 CLI 配套 GUI。
- **适用画像总结**：**需要深度系统集成（托盘/全局快捷键/多窗口）、要复用庞大 npm 生态、对安装体积不敏感、团队（或 AI）熟悉 Web 技术栈**的应用。凡是 VS Code 形态的"重型工具"，Electron 都是被验证过的路线。

---

## 5. Flutter Desktop（Dart）

### 5.1 概述

Google 的自绘引擎（Skia/Impeller），一套 Dart 代码渲染三端（含移动端）且像素级一致。与 Tauri/Electron 不同，Flutter **不依赖系统浏览器**，而是自己绘制每一个像素（类似游戏引擎渲染 UI），因此三端观感天然统一。系统能力（文件、托盘、系统对话框）通过插件（plugin）经 **platform channel** 调用原生代码。

### 5.1.1 项目结构

```
my_flutter_app/
├── lib/                          # Dart 代码（唯一的业务代码区）
│   ├── main.dart                 # 入口：runApp()
│   ├── app.dart                  # 应用根 Widget（主题、路由）
│   ├── pages/                    # 页面（阅读器页面、设置页面…）
│   ├── widgets/                  # 可复用组件
│   └── services/                 # 数据/逻辑层（文件读取、解析…）
├── windows/                      # Windows 宿主工程（C++/CMake，一般不用动）
│   ├── runner/                   # Win32 窗口壳
│   ├── flutter/                  # 生成的桥接代码
│   └── CMakeLists.txt
├── macos/  linux/  android/  ios/ # 各平台宿主工程（不跨平台可不建）
├── pubspec.yaml                  # 依赖声明（等价于 package.json）
├── assets/                       # 图片、字体、资源文件
├── test/                         # 单元测试
└── .dart_tool/  build/           # 生成目录
```

**关键目录说明：**
- `lib/` 是全部业务代码所在，99% 的开发都发生在这里；各平台目录只是"壳"，基本不需要手改。
- `pubspec.yaml` 声明依赖（类似 npm），`flutter pub add <包名>` 添加。
- 插件依赖原生代码：Windows 上用 Rust/C++ 插件较少见，多为 Dart 实现或走 platform channel。

### 5.1.2 开发流程（分步）

1. **创建工程**：`flutter create --platforms=windows my_tool`（加 `--platforms=macos,linux` 可一并生成跨平台骨架）。
2. **启动调试**：`flutter run -d windows` 弹出窗口；改 Dart 代码自动**热重载**（几秒生效，保留运行状态）。
3. **搭建页面**：用 Widget 组合 UI（类似 React 组件，但都是 Dart）：

   ```dart
   void main() => runApp(const MaterialApp(home: ReaderPage()));
   ```

4. **接入系统能力**：`flutter pub add file_picker`（选择文件）、`shared_preferences`（存储配置）等插件，用其异步 API 即可。
5. **写业务逻辑**：文件解析、Markdown 渲染（`flutter_markdown` 包）、状态管理（`provider` / `riverpod`）。
6. **单元测试**：`flutter test` 运行 `test/` 下的 Dart 测试。
7. **打包**：`flutter build windows` 产出 release 目录，再用 Inno Setup / NSIS 封装安装包。
8. **发布**：自动更新需借助第三方方案（如 `auto_updater` 类插件 + 自建更新逻辑），没有 Tauri/Electron 那么开箱即用。

**典型调试循环**：改 `lib/` 代码 → 按 `r` 热重载看效果 → 界面问题用 Flutter DevTools（布局检查器）定位 → 逻辑问题打断点调试 → 反复迭代。

### 5.2 特点与成本复杂度

- 渲染性能好，UI 动画流畅；三端（Win/Mac/移动）观感完全一致是最大卖点。
- 学习曲线：中（Dart 语言 + Widget 概念）。
- **桌面端生态弱**：大量插件只支持移动端，Windows 专属插件少；复杂表格/大文档编辑类场景方案少。
- AI 桌面语料弱于移动端，复杂逻辑偶尔需人工介入。

### 5.3 多平台适配

- Windows / macOS / Linux / iOS / Android 一套代码（桌面适配度按此顺序递减）。

### 5.4 UI 美观度

- **默认观感：高**。Material Design 3 现成组件，三端一致。
- 桌面端定制需要额外工作（桌面布局、键盘快捷键、鼠标交互默认偏移动端思维）。

### 5.5 生态成熟度

- **移动端：极高；桌面端：中**。pub.dev 上桌面可用插件需要逐个确认平台支持。
- Markdown 渲染：flutter_markdown 可用，但编辑器级体验弱于 web 系。

### 5.6 前置准备条件

| 项目 | 说明 |
|---|---|
| Flutter SDK | https://flutter.dev，`flutter doctor` 验证 |
| Windows 构建链 | Visual Studio 2022（需勾选"使用 C++ 的桌面开发"工作负载）、CMake |
| 创建工程 | `flutter create --platforms=windows mytool` |

全部免费（BSD-3 类开源协议）。

### 5.7 发布条件

- `flutter build windows` 生成 release 目录，需用 Inno Setup / NSIS 二次封装为安装包。
- 体积：30–60MB。
- 代码签名：建议同前；自用可跳过。

### 5.8 典型应用举例

- **开源笔记应用**：AppFlowy（Notion 开源替代，Flutter 桌面端的旗舰案例，证明复杂编辑器类界面可行）。
- **远程桌面工具**：RustDesk（UI 层用 Flutter，配 Rust 核心，桌面 + 移动端一套 UI）。
- **待办/生产力**：Superlist（跨平台任务管理）。
- **个人工具**：词典、壁纸管理、记账、图片浏览、音乐播放器等需要"三端观感完全一致"的工具。
- **适用画像总结**：**要求 Windows / macOS / 手机端 UI 像素级一致、愿意接受桌面生态相对较新**的应用。如果你的工具未来要出手机版，Flutter 是三端统一成本最低的路线。

---

## 6. Python + PySide6 / customtkinter

### 6.1 概述与开发流程

两种风格：
- **PySide6**（Qt for Python）：成熟的 Qt 控件库，LGPL 协议，动态链接使用免费。
- **customtkinter**：基于 Tkinter 的现代化扁平 UI 库，MIT 协议，极简。

```
pip install pyside6 / customtkinter -> 写 Python 逻辑 -> PyInstaller 打包为 exe
```

### 6.2 特点与成本复杂度

- Python 生态最强（pandas、正则、请求、科学计算），**数据处理/批量脚本型工具首选**。
- 开发速度最快（脚本思维），AI 语料海量。
- 打包体积中等偏大（约 40–100MB），PyInstaller 单文件启动偏慢、偶发杀毒软件误报。

### 6.3 多平台适配

- Windows / macOS / Linux 均可（Python 解释器跨平台），但打包为独立 exe 主要面向 Windows。

### 6.4 UI 美观度

- **customtkinter**：中上。扁平现代风格，几行代码出好看的暗色界面，适合内部工具。
- **PySide6**：中。Qt 原生控件风格偏传统，定制精美需较大投入。
- **结论：够用不惊艳**；对外展示型产品不推荐。

### 6.5 生态成熟度

- **Python 生态：海量**（处理逻辑部分无可匹敌）。
- **GUI 生态：一般**。控件与桌面集成（托盘、开机自启、系统集成）弱于 WPF/Qt 原生方案。
- PySide6 继承 Qt 生态，控件成熟；customtkinter 年轻但够用。

### 6.6 前置准备条件

| 项目 | 说明 |
|---|---|
| Python | 3.9+（https://python.org） |
| 依赖安装 | `pip install PySide6` 或 `pip install customtkinter` |
| 打包工具 | `pip install pyinstaller` |

- 许可证：PySide6 为 LGPL，动态链接使用免费；customtkinter 为 MIT，无限制。

### 6.7 发布条件

- 打包：PyInstaller（`pyinstaller -F -w main.py`）产出单文件 exe。
- 体积：40–100MB；冷启动 1–3 秒（单文件模式解压导致）。
- 代码签名：强烈建议（未签名 Python exe 更容易触发杀软/SmartScreen 拦截）。
- 注意：单文件模式若被杀软误报，可改用目录模式（onedir）打包。

---

## 7. 横向对比总结表

| 维度 | WPF | WinForms | Tauri 2 | Electron | Flutter | Python/PySide6 |
|---|---|---|---|---|---|---|
| 平台范围 | 仅 Win | 仅 Win | Win/Mac/Linux | Win/Mac/Linux | Win/Mac/Linux/移动 | Win/Mac/Linux |
| 安装体积 | 60–80MB | ~50MB | **8–15MB** | 150–250MB | 30–60MB | 40–100MB |
| 内存占用 | 100–200MB | 30–80MB | 50–150MB | 300MB+ | 100–200MB | 50–150MB |
| UI 美观度上限 | 高（需定制） | 低 | **最高（Web）** | **最高（Web）** | 高（默认好） | 中 |
| 默认观感 | 中下 | 最低 | 看前端 | 看前端 | 高 | 中 |
| 生态成熟度 | 极高 | 极高 | 中（增速快） | 最高 | 桌面端中 | Python 极强/GUI 一般 |
| AI 开发可靠性 | 高 | 极高 | 中高 | 极高 | 中 | 极高 |
| 学习曲线 | 中高 | 极低 | 中高 | 低 | 中 | 低 |
| 开发速度 | 中高 | 最快 | 中高 | 高 | 中 | 最快 |
| 许可证 | 免费 | 免费 | MIT | MIT | 免费 | LGPL/MIT 免费 |
| 系统集成（托盘/自启） | 原生强 | 原生强 | 官方插件 | 插件成熟 | 较弱 | 较弱 |
| 单文件双击即用 | 支持 | 支持 | 需安装包 | 需安装包 | 需安装包 | 支持 |

---

## 8. 选型决策建议

### 决策树

```
工具只在 Windows 上用？
├─ 是 → 需要界面精美？
│    ├─ 是 → WPF（配 HandyControl / MaterialDesign 控件库）
│    └─ 否 → WinForms（最快交付）或 WPF（给后续留余地）
└─ 否（要跨平台）→ 对体积/内存敏感？
     ├─ 是 → Tauri 2
     └─ 否 → Electron
特殊场景：
- 数据处理/批量脚本为主 → Python
- 必须与手机端 UI 一致 → Flutter
```

### 结合本仓库场景（mdread，Markdown 阅读器工具）

| 诉求 | 推荐 | 理由 |
|---|---|---|
| 自用/Windows 单平台 | **WPF + Markdig** | 本地文件集成最自然、单文件分发、AI 最稳 |
| 要跨平台/想要好看 | **Tauri + markdown-it + highlight.js** | 体积小、Markdown 渲染 web 生态最成熟 |

### 通用建议

1. **个人自用工具优先 WPF**：交付链路最短，AI 生成质量最稳，发布最简单。
2. **想要"好看又不费劲"优先 Tauri**：前端样式生态就是最大的免费 UI 工厂。
3. **Electron 仅在"需要海量 npm 桌面模块"时选**，工具型应用通常用不到，且体积代价大。
4. **脚本/数据处理型工具直接用 Python**，不要强行套 GUI 框架。

---

## 9. 附录

### 9.1 免费开源控件/库速查

| 用途 | 推荐库（按方案） |
|---|---|
| Markdown 渲染 | WPF: Markdig；Tauri/Electron: markdown-it + highlight.js；Flutter: flutter_markdown；Python: markdown 库 |
| 现代化 UI | WPF: HandyControl / MaterialDesignInXAML；WinForms: SunnyUI；Python: customtkinter |
| 图表 | .NET: LiveCharts2；Web: ECharts / Chart.js |
| 本地存储 | .NET: SQLite-net / Microsoft.Data.Sqlite；Web: SQLite（Tauri SQL 插件 / better-sqlite3） |
| 打包 | .NET: dotnet publish + Inno Setup；Tauri: 内置 bundle；Electron: electron-builder |

### 9.2 常见坑

- **WPF 高 DPI**：声明 PerMonitorV2 兼容清单，否则高分屏模糊。
- **Electron/Tauri 渲染进程安全**：禁用 nodeIntegration（Tauri 2 默认安全），避免渲染层注入。
- **PyInstaller 杀软误报**：改用 onedir 模式或加代码签名。
- **Tauri 在 Win10**：确认目标机有 WebView2，或安装包引导安装。
- **.NET 单文件发布**：self-contained 体积大是正常的，framework-dependent 模式需目标机装 .NET。

### 9.3 发布时间线（首次发布 checklist）

1. 功能完成 + 本机实测
2. 决定发布形态（免安装单文件 / 安装包）
3. 决定是否代码签名（自用可跳过）
4. 决定更新方式（自用：手动覆盖；对外：接自动更新）
5. 打包 + 在干净虚拟机/新电脑上验证"双击即用"
