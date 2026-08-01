# DevTools · 开发者工具箱

> **17 个常用开发者工具，一个本地优先的桌面应用。**
> 无需账号、无遥测、无网络请求，所有数据处理都在本机完成。

开发者工具箱是一个面向开发者的桌面工具集合——格式化、编码、转换、调试、生成五大类，全部数据**本地处理**。技术栈 Vue 3 + Vite + TypeScript，Tauri 2 打包为跨平台桌面应用，也可作为纯 Web 应用运行。

![built with](https://img.shields.io/badge/built%20with-Vue%203-42b883) ![version](https://img.shields.io/badge/version-0.1.0-6366f1) ![license](https://img.shields.io/badge/license-MIT-green)

> English docs see [README.md](./README.md)

## 应用截图

| 代码格式化 · 亮色 | 代码格式化 · 暗色 |
|---|---|
| ![JSON 格式化亮色](docs/screenshots/json-light.png) | ![JSON 格式化暗色](docs/screenshots/json-dark.png) |
| **Mermaid 图表** | **颜色转换** |
| ![Mermaid 图表](docs/screenshots/mermaid.png) | ![颜色转换](docs/screenshots/color.png) |

## 功能特性

- **17 个工具**：格式化、转换、时间、对比、Mermaid、Base64、URL、正则、JWT、Hash、UUID、颜色、Curl、统计、命名、二维码、进制
- **本地优先 & 隐私**：工具逻辑零网络请求，适合处理内部/敏感数据
- **亮/暗/跟随系统** 三态主题，自动持久化
- **复制反馈、交换、Cmd/Ctrl+Enter** 快捷键
- **实时计算**：Hash / 正则 / 命名 / 进制 / Curl / 颜色 / JWT / 对比 / 统计 / UUID / 二维码 / Mermaid
- **输入缓存**：格式化器、Mermaid 编辑器自动保存
- **零依赖算法**：手写 MD5、YAML 与 Python Dict 解析器、JSON 树折叠、LCS diff（见 [`src/utils/`](./src/utils)）

## 工具清单

| 类别 | 工具 | 路由 |
|---|---|---|
| 格式化 | JSON / SQL / Python / XML / HTML（含 JSON 树折叠） | `#/json` |
| 转换 | JSON ⇄ JSON String ⇄ YAML ⇄ Python Dict | `#/converter` |
| 时间 | 时间戳 ⇄ 日期 · 时长换算 | `#/time` |
| 对比 | LCS 文本 / JSON / properties 差异 | `#/diff` |
| 图表 | Mermaid → SVG（缩放/平移/导出） | `#/mermaid` |
| 编码 | Base64 · URL 编解码 | `#/base64` `#/url` |
| 调试 | 正则测试 · JWT 解析（exp/iat） | `#/regex` `#/jwt` |
| 生成 | Hash（MD5/SHA）· UUID v4 · 二维码 · 进制 | `#/hash` `#/uuid` `#/qr` `#/radix` |
| 开发 | 颜色转换 · curl→代码 · 文本统计 · 大小写 | `#/color` `#/curl` `#/text-stats` `#/case` |

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vue 3（Composition API）、Vue Router 4、TypeScript（strict） |
| 构建 | Vite 8、`vue-tsc` 类型检查 |
| 桌面 | Tauri 2（仅 shell 插件） |
| 运行时依赖 | `mermaid`、`qrcode` |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org) ≥ 20
- （桌面打包才需要）[Rust](https://rustup.rs) 及平台 Tauri 依赖

### 浏览器开发模式

```bash
npm install
npm run dev        # http://localhost:1420
```

### 桌面开发模式

```bash
npm run tauri dev
```

### 构建

```bash
npm run build       # 类型检查 + Web 构建 → dist/
npm run tauri build # 打包桌面安装包
```

## 项目结构

```
src/
├── main.ts / App.vue / router.ts   # 入口、根布局（Sidebar + router-view）、懒加载路由
├── styles/main.css                 # 设计系统：CSS 变量、reset、布局类、语法高亮 token
├── components/                     # Button / Select / CodeEditor / JsonView / ViewHeader / Sidebar …
├── utils/                          # 纯函数：formatter / converters / md5 / jsonTree / curl / case / color / radix …
└── views/                          # 17 个工具页
docs/
└── test-cases.md                   # 全量 Playwright 测试用例手册
```

## 测试

完整测试手册覆盖每个工具，含具体步骤与 Playwright 断言：**[docs/test-cases.md](./docs/test-cases.md)**。

```bash
npm run dev   # 然后按手册用 Playwright 验证 http://localhost:1420
```

> 设计与架构说明：**[Design.md](./Design.md)**

## 发布与制品

推送 `v*` tag 会触发 [`.github/workflows/release.yml`](./.github/workflows/release.yml)，构建并发布草稿 Release，包含以下平台的安装包：

| 平台 | 架构 |
|---|---|
| macOS | x64（Intel）· arm64（Apple Silicon） |
| Windows | x64 · x86（32 位） |

`workflow_dispatch` 可手动跑构建矩阵（不发布）。安装包未签名，macOS 首次打开会有 Gatekeeper 警告。

## 参与贡献

1. Fork 并从 `main` 分支开发。
2. 新增工具：创建 `src/views/YourTool.vue`，在 `src/router.ts` 注册路由，并在 `src/components/Sidebar.vue` 的 `TOOLS` 数组加一项（图标 + 颜色）。
3. 新逻辑尽量放入 `src/utils/` 纯函数，便于单测。
4. 运行 `npm run build`（必须通过），并按 `docs/test-cases.md` 验证新增/改动工具。
5. 提交 PR 并附简短说明。

## License

[MIT](./LICENSE)
