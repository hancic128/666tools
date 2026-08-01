# STATUS

## [2026-08-01] Playwright 全量回归 — 17 工具全通过，修复 3 缺陷 + 跨平台 CI

### 现状
- 按 `docs/test-cases.md` 全量 Playwright 回归 **17/17 工具 + 全局用例全部通过**（浏览器实测，含已知值断言）
- **修复 3 个真实缺陷**（见 DECISIONS.md）：
  1. Python Dict → JSON 反向解析失败（`converters.ts`，序列化器输出 `dict(...)` 解析器不支持）
  2. UTC 日期→时间戳含秒时失效（`TimeConverter.vue`，无条件追加 `:00Z`）
  3. 正则匹配高亮 CSS 选择器写错（`RegexTool.vue`，`.mark.match` → `mark.match`，样式从未生效）
- `npm run build` 修复后通过；修正 test-cases.md 中 5 处断言描述误差（J-2/J-4/C-5/T-3/R-1）
- **新增 `.github/workflows/release.yml`**：tag 触发构建 macOS x64/arm64 + Windows x64/x86 四平台制品并发布草稿 Release；`workflow_dispatch` 手动构建
- README 增补"发布与制品"章节（中英）

### 待办
- [x] LICENSE 版权人署名：`Angryshark128`
- [x] git init + 首次提交（`79dffb8`，身份 Angryshark708）+ 推送到远程
- [x] GitHub 公开仓库创建：https://github.com/Angryshark128/devtools（main 分支，已同步）
- [x] 推 tag `v0.1.0` 触发 CI，**四平台构建 + Release 全部通过**（草稿 Release 已含 6 个安装包）
- [x] 修复 CI：macos-x64 排队（macos-13 稀缺）→ 改 macos-14 交叉编译，node 20→22（提交 `672296d`）
- [x] README 增加应用截图（docs/screenshots/，提交 `da6f21c`）
- [x] 完整下载 6 个制品并文件级验证通过（大小逐字节核对 ✓）
  - macOS arm64/x64 DMG 挂载后应用二进制分别为 Mach-O arm64 / x86_64 ✓
  - Windows x64/x86 MSI 模板分别为 x64 / Intel(x86) ✓；NSIS exe 为合法安装器
- [x] **Release v0.1.0 已发布（正式，非草稿）**：https://github.com/Angryshark128/devtools/releases/tag/v0.1.0

## [2026-08-01] 开源化准备 — 文档重组完成

### 现状
- **`Design.md` 已重写**为与实际代码一致的架构/设计文档（17 工具、无 REST 客户端、utils 拆分、三态主题、qrcode 库等），中英双语
- **新增 `docs/test-cases.md`**：全量 Playwright 用例手册（全局 + 17 工具 + 快速回归清单），供每次改动后 AI 用 Playwright 自动验证
- **新增 `README.md`（英文）+ `README.zh-CN.md`（中文镜像）+ `LICENSE`（MIT，占位署名）**
- **死代码已清理**：删除 JsonEditor.vue / ToolPlaceholder.vue / `--tool-rest`，`npm run build` 通过，无残留引用

### 待办
- [ ] 确认 LICENSE 版权人署名（当前占位 `shark`）— P0
- [ ] git init + 首次提交 + 推送到远程 — P1
- [ ] 用 Playwright 按 `docs/test-cases.md` 全量回归一遍 — P1

## [2026-08-01] Phase 3 完成 — Mermaid + Playwright 全功能验证

### 现状
- **17/17 工具页全部完成**：MermaidTool（登录流程图渲染、三面板模式、缩放/平移、SVG/PNG 导出、暗色主题联动 via MutationObserver、localStorage 缓存）
- 打磨：侧边栏折叠/图钉/滚动条已修复

### Playwright 全功能验证结果
- 全部 17 个工具浏览器实测通过（见验证过程）
- **验证中发现并修复 3 个 bug**：
  1. SQL 格式化：所有词误大写 + 关键字后缺空格 + 高亮丢换行 → 重写 formatSql（仅关键字大写、AND/OR 条件换行、ORDER BY 合排）
  2. XML/HTML 高亮：闭合标签 `open` 漏 esc() 导致 HTML 解析破损（`<!--` 伪影）+ 属性值丢引号 → 修复 highlightTag
  3. HTML 标签 DOMParser 大写 → 输出小写化
- 先前修复：Hash SHA 算法名、Regex/JWT 漏导入 Button

### 计划
- 全部交付完成。待用户验收最终结果

### 待办
- [ ] 用户最终验收 — P0
- [ ] （可选）后续增强：SQL 子查询缩进、JSON 路径导航、收藏工具等

## [2026-08-01] Phase 2 完成 — 12 个工具页

### 现状
- 完成全部 12 个工具页（17 个中仅剩 Mermaid）
- 简单工具：大小写（9 格式）、Hash（手写 MD5 + WebCrypto SHA1/256/512 + 全部）、颜色（HEX/RGB/HSL 联动 + 取色器 + 20 预设）
- 复杂工具：格式化（JSON 树折叠 + SQL/Python/XML/HTML 格式化高亮 + 缓存）、转换（YAML/Python 手写解析）、正则（实时高亮 + 匹配列表）、JWT（Header/Payload tab + 过期检测）、时间（3 tab + 实时时钟）、统计（11 项 + Top10 词频）、对比（LCS + text/json/properties）、Curl→代码（fetch/axios/python/go）、二维码（qrcode 库）
- 新增 utils：md5 / case / color / radix / jsonTree / formatter / converters / curl
- 修复：Hash SHA 算法名映射、Regex/JWT 漏导 Button、JsonFormatter 模板 input 解包、折叠交互

### 验证
- Node 单元断言：MD5(含UTF-8)、case、color、radix、YAML 往返、Python 解析、curl 解析、jsonTree、SQL 格式化全部通过
- 浏览器逐工具验证 12 个工具核心功能全部正确
- `npm run build` 0 错误

### 计划
- 等待用户验收 Phase 2
- Phase 3：Mermaid 图表 + 精细打磨（主题持久化确认、响应式细节）

### 待办
- [ ] 用户验收 Phase 2 — P0
- [ ] Phase 3：MermaidTool（渲染/缩放/导出/主题联动/缓存）
- [ ] Phase 3：打磨细节

## [2026-08-01] Phase 1 完成 — 基础设施 + 骨架 + 4 简单工具

### 现状
- 脚手架：Vite 8 + Vue 3 + TS strict + Router 4(hash) + Tauri 2 壳（无 http 插件）
- 设计系统 main.css（品牌/18 tool 色/语义色/明暗主题/reset/JSON token 配色）
- 骨架组件 8 个：App/Sidebar(17项,pin,主题)/ViewHeader/Button/Select/CodeEditor/JsonEditor/JsonView + utils(json/useCopy/useHotkey/radix)
- 已实现工具：Base64、URL、UUID、进制（含交换/Cmd+Enter/复制反馈）
- 13 个工具页为占位组件，待后续阶段实现
- **验证通过**：`npm run build` 0 错误；浏览器逐页验证 4 工具 + 暗色主题持久化；`npm run tauri dev` Rust 编译成功(33m)并启动窗口
- 版本决策见 DECISIONS.md（router 4 / TS 5.9 / qrcode 库）

### 计划
- 等待用户验收 Phase 1
- 验收通过后开始 Phase 2

### 待办
- [ ] 用户验收 Phase 1 — P0
- [ ] Phase 2：简单工具剩余（大小写/Hash含手写MD5/颜色）+ 复杂工具（格式化/转换/正则/JWT/时间/统计/Diff/Curl/二维码）
- [ ] Phase 3：Mermaid + 精细打磨

## [2026-08-01] 项目初始化

### 现状
- 项目根目录：`~/Project/Devtools`
- 存在 `Design.md`（开发者工具箱桌面应用设计文档，Vue 3 + Vite 8 + TS + Tauri 2）
- 尚未创建任何源码

### 计划
- 按 Design.md 实现全部 18 个工具页（排除 HTTP 请求相关实现）
- 已排除项：REST API 客户端的实际请求发送功能

### 待办
- [ ] 澄清实现范围（HTTP 排除范围、Tauri 是否保留）— P0
- [ ] 确认实现计划 — P0
- [ ] 基础设施（Vite + Vue + TS + Router + 设计系统）
- [ ] 骨架组件（Sidebar/ViewHeader/Button/Select/CodeEditor/JsonEditor/JsonView）
- [ ] 简单工具页
- [ ] 复杂工具页
- [ ] 重量级功能
