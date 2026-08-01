# 开发者工具箱 · 设计文档 / Developer Toolbox · Design Document

> 本文档描述**当前实际代码实现**的完整设计，是开源项目的架构说明与贡献者指南。
> This document describes the **actual implementation** of the codebase — it serves as the architecture reference and contributor guide for the open-source project.
>
> 文档基于源码现状（2026-08-01）编写。若代码演进，请同步更新本文档。
> Written against the current source (2026-08-01). Keep this document in sync with the code.

## 1. 项目简介 / Overview

开发者工具箱（DevTools）是一个**本地优先的桌面工具集合**，整合了开发者日常最常用的 17 个转换/编码/调试工具，全部数据在浏览器本地处理，不上传任何内容。应用以 Tauri 2 打包为桌面应用，前端为纯 Web（Vue 3），可独立以浏览器方式运行。

DevTools is a **local-first desktop tool collection** bundling 17 everyday developer utilities. All processing happens in-browser; nothing is uploaded. It ships as a Tauri 2 desktop app with a pure-Web frontend (Vue 3) that also runs standalone in a browser.

**核心特性 / Key features**

- 17 个工具页，覆盖格式化、编码解码、转换、调试、生成五大类
- 明暗主题三态切换（亮色/暗色/跟随系统），localStorage 持久化
- 全工具复制反馈、Cmd+Enter 快捷键、实时计算
- 关键输入自动缓存（格式化器、Mermaid），断点续写

## 2. 技术栈 / Tech Stack

| 层 / Layer | 技术 / Tech | 版本 |
|---|---|---|
| 前端框架 / Framework | Vue 3（Composition API, `<script setup>`） | ^3.5.40 |
| 路由 / Router | Vue Router 4（hash history，懒加载） | ^4.6.4 |
| 构建 / Build | Vite | ^8.2.0 |
| 语言 / Language | TypeScript（strict，`vue-tsc` 类型检查） | ^5.9.3 |
| 桌面壳 / Desktop shell | Tauri 2（仅 shell 插件，无 HTTP 插件） | ^2.11 |
| 运行时依赖 / Runtime deps | mermaid（图表）、qrcode（二维码）、@tauri-apps/api | ^11.16 / ^1.5 / ^2.11 |

> 版本决策见 `.claude/DECISIONS.md`：vue-router 固定 4、TypeScript 固定 5.9（规避 TS 7 / router 5 破坏性变更）。
> Version pins (vue-router 4, TS 5.9) were chosen to avoid breaking changes; see `.claude/DECISIONS.md`.

### 2.1 开发 / 构建命令 / Commands

```bash
npm run dev        # 浏览器开发模式（Vite，端口 1420）
npm run tauri dev  # 桌面开发模式（Tauri + Vite）
npm run build      # 类型检查 vue-tsc --noEmit + 生产构建 → dist/
npm run tauri build # 打包桌面安装包
```

## 3. 项目结构 / Project Structure

```
Devtools/
├── index.html                    # HTML 入口（挂载 #app）
├── vite.config.ts                # @ 别名 → src/，端口 1420 strictPort，watch 忽略 src-tauri
├── tsconfig.json                 # strict、ES2021 target、noUnusedLocals/Parameters
├── package.json
├── src/
│   ├── main.ts                   # createApp + router 挂载
│   ├── App.vue                   # 根布局：Sidebar + router-view
│   ├── router.ts                 # 17 条路由（懒加载）+ / 重定向 → /json
│   ├── styles/main.css           # 设计系统：CSS 变量 + Reset + 共享布局类 + 双套高亮 token
│   ├── components/               # 6 个通用组件（见 §5）
│   ├── utils/                    # 11 个纯函数工具库（见 §6），与 UI 解耦、可单测
│   └── views/                    # 17 个工具页（见 §7）
└── src-tauri/                    # Tauri 2 壳
    ├── tauri.conf.json           # 窗口 1200×800(min 800×600)、CSP null、withGlobalTauri
    ├── Cargo.toml                # 依赖：tauri 2 + tauri-plugin-shell
    ├── capabilities/default.json # 仅 core:default 权限
    └── src/{lib.rs, main.rs}     # 仅注册 shell 插件，无业务逻辑
```

## 4. 架构设计 / Architecture

### 4.1 分层 / Layering

```
views（工具页，组合组件 + 调用 utils）
   │
   ├── components/（可复用 UI：Button / Select / CodeEditor / JsonView / ViewHeader）
   │
   ├── utils/（纯函数：格式化、转换、加密、解析、高亮）← 可独立单测
   │
   └── styles/main.css（设计系统 + 布局类 + token 配色）
```

### 4.2 数据流 / Data Flow

- **单向输入→输出**：工具页用 `computed` 派生输出（格式化、转换、统计等），或 `watch` + 副作用（Hash 实时计算、二维码渲染、Mermaid 渲染）。
- **同步保护**：ColorTool 用 `syncing` 标志避免 HEX/RGB/HSL 三向联动时互相触发。
- **异步竞态保护**：MermaidTool 用 `renderSeq` 自增序号丢弃过期渲染结果。
- **持久化**：仅 localStorage（`devtools-*` 前缀），键见下表：

| localStorage 键 / Key | 用途 / Purpose |
|---|---|
| `devtools-theme` | 主题：`light` / `dark` / 缺省=跟随系统 |
| `devtools-sidebar-pinned` | 侧边栏图钉：`'1'` / `'0'` |
| `devtools-formatter-cache` | 格式化器输入 + 选项（`{input, format, indentSize, collapseDepth}`） |
| `devtools-mermaid-cache` | Mermaid 代码 |

### 4.3 路由 / Routing

`createWebHashHistory` + 懒加载（`() => import(...)`），共 17 条路由：

```
/ → redirect /json
/json /converter /time /diff /mermaid /base64 /url /regex /jwt
/hash /uuid /color /curl /text-stats /case /qr /radix
```

路由 `name` 与 Sidebar 的 `tool.name` 一一对应，用于导航高亮。

### 4.4 侧边栏配置驱动 / Config-driven Sidebar

Sidebar 内维护 `TOOLS` 数组（17 项），每项含 `{ name, path, label, color, icon }`。`icon` 为内联 SVG path 字符串，通过 `v-html` 注入；`color` 引用 `--tool-*` CSS 变量。**新增工具只需在数组中加一项 + 在 router.ts 注册路由**。

## 5. 组件设计 / Components

### 5.1 Button.vue
`variant: 'primary' | 'secondary' | 'ghost'`（默认 `secondary`），`size: 'sm' | 'md' | 'lg'`（默认 `md`），`disabled`。带 hover 过渡与 disabled 态。

### 5.2 Select.vue
自定义下拉：`modelValue` + `options: { value, label }[]` + `disabled` + `width`。emit `update:modelValue`。点击外部关闭（`document` click 监听），选中项高亮，`Transition` 展开动画。

### 5.3 CodeEditor.vue
通用代码编辑器：`modelValue` + `placeholder` + `readonly` + `language` + `lineNumbers`（默认 true）。左侧行号列与右侧 `textarea` 同步滚动。暴露 `focus()`。

### 5.4 JsonView.vue
只读 JSON 语法高亮展示（复用 `highlightJson`），用于 JWT Payload/Header 等只读场景。

### 5.5 ViewHeader.vue
工具页标题栏：`title` + `description` + `toolColor`（左侧 4px×18px 竖条颜色，默认品牌色）。右侧 `<slot />` 放操作区（Select / Button）。

### 5.6 Sidebar.vue
- 默认折叠 `64px`，hover 展开 `200px`；图钉（pin）后常驻展开。
- 主题三态：`light` / `dark` / `system`，`toggleTheme` 在 light↔dark 间切换，`system` 跟随 `prefers-color-scheme`（`matchMedia` 监听变化）。
- 路由高亮：`route.name === tool.name`；图标用工具区分色。
- 底部：图钉按钮 + 主题切换按钮。

## 6. 工具库 / Utils

均为**纯函数/无 UI 依赖**模块，可直接 node 单测。

### 6.1 `json.ts` — JSON 高亮
`highlightJson(code): string`。单条正则 token 化 JSON：key / string / number / boolean / null / punct，输出 `.tok-*` 类名（配色见 §8.3）。key 判定：字符串 token 后跳过空白紧跟 `:` 即为 key。

### 6.2 `jsonTree.ts` — JSON 树 + 折叠
- `defaultCollapsedPaths(value, collapseDepth): Set<string>`：深度 ≥ collapseDepth 的节点默认折叠。
- `renderJsonTree(value, collapsed, indentSize): string`：渲染整棵树为高亮 HTML（`.f-tok.*` 类）。折叠路径格式 `$` / `$.key` / `$[index]`（可嵌套）。数组显示索引行。
- 折叠交互：节点以 `data-path` 标记，点击 `[`/`{` 或 `...N items...` 预览切换折叠。

### 6.3 `formatter.ts` — SQL/Python/XML/HTML 格式化 + 高亮
- `formatSql(sql, indent)`：token 化 + 关键字断行（`SELECT/FROM/WHERE/…` 换行，`AND/OR` 条件换行、`ORDER BY` 合排）+ 括号缩进。
- `highlightSql(code)`：注释 `--`、引号字符串、数字、关键字（全大写）→ `.f-tok.*`。
- `formatPython(code)`：清理尾随空格 + 压缩多余空行（**非真实重排缩进**）。
- `highlightPython(code)`：注释、装饰器 `@`、三引号/引号字符串、数字、关键字、内置函数。
- `formatXml / formatHtml`：`DOMParser` 解析。XML 用 `text/xml`（保留大小写，有 `parsererror` 抛错）；HTML 用 `text/html`（标签名**小写化**）。空元素输出自闭合 `<tag />`。
- `highlightXml(code)`：注释 / 标签（tag 名、attr、attr 值分别着色）/ 文本。

### 6.4 `converters.ts` — 格式互转
支持 `'json' | 'json-string' | 'yaml' | 'python'` 四种格式：
- 解析 `parseSource(text, format)`：
  - `json-string`：外层 JSON.parse 后再尝试二次 parse。
  - `yaml`：**手写缩进解析器**——支持 map/list/嵌套块、`- `列表项、`true/false/null/~/数字/引号字符串` 标量、内联 map。
  - `python`：字符串级重写为 JSON（单引号→双引号、`True/False/None`→`true/false/null`、裸键加引号、去尾逗号）再 `JSON.parse`。
- 序列化 `serializeValue(value, format)`：
  - `yaml`：递归缩进输出，字符串按需加引号。
  - `python`：合法标识符键用 `dict(key=value)` 形式，否则 `{'key': value}`。

### 6.5 `case.ts` — 大小写转换
`convertCase(input, format)`，9 种格式（camel/pascal/snake/kebab/const/sentence/title/lower/upper）。`splitWords` 正则按词边界拆分（支持 camelCase、snake_case、kebab-case、空格、数字、连续大写缩写）。

### 6.6 `color.ts` — 颜色转换
`hexToRgb`、`rgbToHex`（大写）、`rgbToHsl`、`hslToRgb` + `PRESET_COLORS`（20 色 Tailwind 预设）。

### 6.7 `curl.ts` — curl 解析 + 代码生成
`parseCurl(cmd): ParsedCurl`（URL / method / headers / data / auth / insecure），引号感知 token 化。`toFetch` / `toAxios` / `toPython` / `toGo` 生成对应代码（Python 自动按 Content-Type 用 `json=` 或 `data=`；Go 含 `http.NewRequest` + BasicAuth）。

### 6.8 `md5.ts` — 手写 MD5
Web Crypto API 不含 MD5，故手写实现（约 95 行）。UTF-8 编码（`TextEncoder`），输出 32 位小写十六进制。

### 6.9 `radix.ts` — 进制转换
`parseRadix`（BigInt，自动剥离 `0x/0b/0o` 前缀，支持负数）、`formatRadix`、`convertRadix`（按空白/逗号批量，非法项输出 `⚠ 无法解析`）。

### 6.10 `useCopy.ts` — 复制反馈
`{ copied, copy }`：复制后 `copied` 置 true，1 秒自动恢复。

### 6.11 `useHotkey.ts` — 快捷键
`useCmdEnter(handler)`：绑定 Cmd/Ctrl+Enter，自动清理监听。

## 7. 工具页 / Views

所有工具页共享布局：`ViewHeader`（标题 + 操作区）+ 内容区。分栏用共享类 `.split`（等宽面板）+ `.panel`（带 panel-header / panel-body）。配色统一用各自 `--tool-*`。

### 7.1 代码格式化 JsonFormatter（`/json`，JSON 绿色 #10B981）
- 五种格式：JSON / SQL / Python / XML / HTML。
- **JSON 折叠树**：核心特性。解析后渲染为 HTML 树（`jsonTree.ts`），深度 ≥ collapseDepth 默认折叠；点击 `[`/`{` 或预览文本切换；"全部展开/全部折叠"按钮。折叠状态用 `reactive(new Set<string>())`。
- SQL/Python/XML/HTML 输出带 `.f-tok.*` 语法高亮。
- 选项：缩进 2/4，折叠深度 -1（不折叠）~4。
- 缓存 `devtools-formatter-cache`；Cmd+Enter = 格式化并复制；"格式化"按钮与"复制结果"均触发 `copyOutput`。

### 7.2 格式转换 FormatConverter（`/converter`，紫色 #8B5CF6）
JSON ↔ JSON String ↔ YAML ↔ Python Dict 双向互转。⇄ 按钮交换源/目标格式并把输出回填输入。输出为只读 computed，Cmd+Enter 复制。

### 7.3 时间戳转换 TimeConverter（`/time`，蓝色 #3B82F6）
三个 Tab：**时间戳→日期**（单位 auto/s/ms/μs/ns，auto 按位数判断；输出本地/UTC/ISO）、**日期→时间戳**（datetime-local 输入，本地/UTC 时区，输出 s/ms/μs/ns）、**时长转换**（ms/s/min/h/d/w 互算 + 人类可读如"1 天 2 小时"）。顶部实时时钟每秒刷新。

### 7.4 文本对比 DiffTool（`/diff`，橙色 #F97316）
- **LCS（最长公共子序列）** 动态规划实现，`diffResult` 逐行标记 same/add/del。
- 三种格式：`text` 行级对比；`json` 先美化再逐行对比；`properties` 过滤含 `=` 行、trim、**排序**后对比，并高亮 `key=value`。
- 双栏 split view + 行号；add 绿底 / del 红底 / 空行灰底。

### 7.5 Base64 编解码 Base64Tool（`/base64`，粉色 #EC4899）
编码：`btoa(String.fromCharCode(...TextEncoder.encode(...)))`（UTF-8 安全）；解码：`atob` → bytes → `TextDecoder`。交换按钮、Cmd+Enter。

### 7.6 URL 编解码 UrlTool（`/url`，青色 #14B8A6）
`encodeURIComponent` / `decodeURIComponent`。交换、Cmd+Enter。

### 7.7 正则测试 RegexTool（`/regex`，玫红 #F43F5E）
`/pattern/flags` 输入框 + g/i/m 三个 flag 开关（默认 g）。实时匹配高亮（`<mark class="match">`，品牌色 30% 透明度），底部匹配列表（序号 + 内容 + 位置 `@start–end`）。非 g 模式只显示首个匹配；单次 exec 上限 10 万次防死循环。"复制 N 个匹配"。

### 7.8 JWT 解析 JwtTool（`/jwt`，紫色 #8B5CF6）
粘贴自动解析。Base64url 解码三段：Header / Payload 分 tab（JsonView 高亮）；Payload 非 JSON 时按原文展示。底部 Signature 栏。`exp` 过期检测（有效/已过期 + 人类可读剩余时间）、`iat` 签发时间展示。

### 7.9 Hash 生成 HashTool（`/hash`，青色 #06B6D4）
算法 pills：MD5 / SHA-1 / SHA-256 / SHA-512 / 全部。MD5 用 `utils/md5.ts` 手写实现，其余用 `crypto.subtle`。`watch` 实时计算（immediate）。"复制全部"输出 `Name: value` 列表。

### 7.10 UUID 生成 UuidTool（`/uuid`，黄绿 #84CC16）
`crypto.randomUUID()` 批量生成（1–20 个，默认 5），格式：标准 / 大写 / 无连字符。点击单个复制（带局部"已复制!"反馈），"复制全部"。

### 7.11 颜色转换 ColorTool（`/color`，琥珀 #F59E0B）
左侧大色块 + 原生取色器（`input[type=color]`），右侧 HEX / RGB / HSL 三组输入框，三向联动（`syncing` 防抖环）。底部 20 色 Tailwind 预设色板。"复制 HEX"。

### 7.12 Curl 转代码 CurlTool（`/curl`，灰蓝 #64748B）
解析 curl 命令 → 生成 4 种代码：JavaScript Fetch / Axios / Python requests / Go net/http（语言 tab 切换，computed 实时）。未识别 URL 时输出提示。

### 7.13 文本统计 TextStats（`/text-stats`，蓝色 #3B82F6）
11 项统计：总字符 / 不含空格 / 字节数 / 词数 / 总行 / 非空行 / 段落数 / 中文字符 / 英文字母 / 数字 / 标点（`\p{P}\p{S}`）。**Top 10 词频**：中文按字、英文按词（正则 `[一-龥]+|[a-zA-Z]+`），条形图可视化。

### 7.14 大小写转换 CaseConverter（`/case`，紫色 #8B5CF6）
9 种命名格式按钮（3×3 语义网格），computed 实时转换，Cmd+Enter 复制。

### 7.15 二维码生成 QrTool（`/qr`，绿色 #10B981）
使用 **`qrcode` npm 库**（`QRCode.toCanvas`，容错级 M，margin 2）。尺寸 128–512px 五种。导出：下载 PNG、复制图片（`ClipboardItem`）、复制文本。输入为空时清空画布。

### 7.16 进制转换 RadixTool（`/radix`，橙色 #F97316）
2/8/10/16 进制互转，**BigInt** 支持大数；批量输入（空格/换行分隔）。⇄ 交换进制，Cmd+Enter。

### 7.17 Mermaid 图表 MermaidTool（`/mermaid`，粉 #FF6B9D）
- 三种面板模式：双栏 / 仅代码 / 仅预览。
- 渲染：`mermaid.initialize`（主题随当前明暗自动切换 `dark`/`default`，`securityLevel: 'loose'`，`useMaxWidth: false`）；`MutationObserver` 监听 `documentElement` class 变化实现主题联动；`renderSeq` 丢弃过期结果。
- 预览交互：Ctrl+滚轮缩放（0.25x–4x），拖拽平移，＋/－/重置按钮。
- 导出：SVG 下载、PNG 下载（2x 分辨率白底）、复制 SVG 源码。
- 预置登录流程图示例；代码缓存 `devtools-mermaid-cache`。

## 8. 设计系统 / Design System（`src/styles/main.css`）

### 8.1 主题变量 / Theme Tokens
- 品牌色：`--brand-primary #6366F1` / `-dark #4F46E5` / `-light #818CF8`。
- 语义色：success #10B981、warning #F59E0B、error #EF4444、info #3B82F6。
- **17 个工具区分色** `--tool-*`（见 §7 各页色值）。
- 背景/文字/边框：`--bg-primary/secondary/tertiary`、`--bg-hover`、`--text-primary/secondary/muted`、`--border`，亮暗两套取值。
- 阴影：`--shadow-sm/md/lg`（暗色下加深）。
- 间距 `--space-xs 4 / sm 8 / md 12 / lg 16 / xl 24`；圆角 `--radius-sm 4 / md 6 / lg 8 / xl 12`；字号 `--font-size-xs 11 / sm 12 / base 13 / lg 14 / xl 16 / 2xl 18`。
- 字体：sans 含 PingFang SC / Microsoft YaHei；mono 为 SF Mono / Monaco / Cascadia Code。
- 侧边栏宽：`--sidebar-collapsed 64px` / `--sidebar-expanded 200px`。

### 8.2 暗色模式 / Dark Mode
两层机制：显式 `.dark` class 覆盖变量；未显式 `.light` 时 `@media (prefers-color-scheme: dark)` 自动启用暗色。Sidebar 负责维护 `documentElement` 的 class。

### 8.3 高亮 token 配色 / Syntax Highlight Tokens
两套独立 token 体系，均亮/暗双色：

- **JSON 高亮** `.tok-key/.tok-string/.tok-number/.tok-bool/.tok-punct`：
  - 亮色：`#0b6bcf / #a05a2c / #1a7f37 / #0a6f9b / #6b7280`
  - 暗色（VS Code Dark 风格）：`#9cdcfe / #ce9178 / #b5cea8 / #569cd6 / #8a919e`
- **格式化器高亮** `.f-tok.f-keyword/.f-string/.f-number/.f-bool/.f-null/.f-key/.f-comment/.f-builtin/.f-decorator/.f-tag/.f-attr/.f-punct`：
  - 亮色：`#7c3aed / #1a7f37 / #c2410c / #0e7490 / #0e7490 / #be123c / #64748b(斜体) / #2563eb / #a16207 / #be123c / #c2410c`
  - 暗色：`#c678dd / #98c379 / #d19a66 / #56b6c2 / #56b6c2 / #e06c75 / #5c6370(斜体) / #61afef / #e5c07b / #e06c75 / #d19a66`

### 8.4 共享布局类 / Shared Layout Classes
- `.tool-page`：工具页根（全高纵向 flex）。
- `.split`：等宽分栏容器（`> .panel { flex: 1 }`）。
- `.panel / .panel-header / .panel-title / .panel-body`：面板 + 标签头 + 滚动内容区。

### 8.5 Reset & 基础
`box-sizing: border-box`；`html/body` 100% 高、`overflow: hidden`（App 内滚动）；8px 滚动条；选中文本品牌色底白字；按钮/输入继承字体、去默认边框。

## 9. 通用交互模式 / Common Interaction Patterns

| 模式 / Pattern | 说明 / Detail |
|---|---|
| 复制反馈 | `useCopy`，复制后按钮变"已复制!"，1 秒恢复 |
| 交换 ⇄ | Base64 / URL / 格式转换 / 进制：交换方向并把输出回填输入 |
| Cmd+Enter | 格式化 / 转换 / Base64 / URL / 大小写 / 进制（部分工具同时触发复制） |
| 实时计算 | Hash / Regex / Case / Radix / Curl / Color / JWT / Diff / 统计 / UUID / QR / Mermaid 用 `watch`/`computed` 自动更新 |
| localStorage 缓存 | 格式化器（输入+选项）、Mermaid（代码） |

## 10. Tauri 壳 / Desktop Shell

- 窗口 1200×800，最小 800×600，标题"开发者工具箱"，`withGlobalTauri: true`，CSP `null`（开发宽松）。
- 插件仅 `tauri-plugin-shell`（Rust `lib.rs` 注册）；`capabilities/default.json` 仅 `core:default`。
- **不含 HTTP 插件**（原设计中的 REST 客户端已移除，详见 `.claude/DECISIONS.md`）。
- identifier `com.shark.devtools`，productName `DevTools`，版本 0.1.0。

## 11. 与早期设计的差异 / Deviations from the Original Design

本节记录实现过程中对初始 `Design.md` 的偏离，作为开源读者理解代码的注脚：

1. **移除 REST API 客户端**（RestApiTool / `composables/useRequest.ts` / `@tauri-apps/plugin-http` / `/rest` 路由 / Sidebar 项）。理由：其全部功能即发 HTTP 请求，移除后无需 CORS 绕过插件；保留 Tauri 壳以维持桌面应用形态。
2. **结构重组**：`composables/useRequest.ts` 不复存在；改为 `utils/`（纯函数）+ `useCopy.ts` / `useHotkey.ts`（composable），路由抽到独立 `router.ts`（懒加载）。
3. **二维码用 `qrcode` 库**替代设计中的手写简化版。
4. **侧边栏**：折叠宽 64px（原设计 56px）；主题为亮/暗/跟随系统三态（原设计仅两态）。
5. **高亮 token 扩展**：新增格式化器 `.f-tok.*` 体系（SQL/Python/XML/HTML），JSON 高亮收敛为 `.tok-*` 五色。
6. **Md5 / YAML / Python 解析器**为手写实现（零运行时依赖），详见 §6。

## 12. 开源准备 / Open-Source Readiness

### 12.1 已清理的死代码 / Removed Dead Code
已删除（2026-08-01，开源化前）：
- `src/components/JsonEditor.vue`（REST 客户端遗留）
- `src/components/ToolPlaceholder.vue`（开发期占位页）
- `--tool-rest` CSS 变量（无工具使用）

保留：`public/` 图标、`scripts/gen-icon.mjs`（打包图标用）。

### 12.2 建议的增强方向 / Suggested Enhancements
（源自 `.claude/STATUS.md` 待办，非当前实现）
- SQL 子查询缩进、JSON 路径导航、收藏工具、国际化（i18n）、单元测试接入（utils 已纯函数化，便于直接测试）。

### 12.3 开源注意事项 / Notes
- 应用内所有文本为中文；开源时如需国际化，优先抽 `utils/`（无 UI 依赖）后处理 UI 文案。
- `localStorage` 键以 `devtools-` 前缀隔离，避免与宿主页面冲突。
- 所有数据本地处理，无遥测、无网络请求——这是项目向开源社区强调的隐私卖点。
