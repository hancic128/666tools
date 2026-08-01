# DECISIONS

## [2026-08-01] 回归修复：3 个真实缺陷（Playwright 全量验证发现）

**背景**
Playwright 全量回归中发现并修复 3 处功能缺陷，均有浏览器实测复现。

1. **Python Dict → JSON 反向转换失败**（`utils/converters.ts`）
   - 现象：序列化输出 `dict(name='alice', age=30)`，粘贴回解析器报 "Unexpected token 'd'"；往返不闭环。
   - 修复：`pythonToJsonText` 支持 `dict(...)` 参数形式（`key=value`→`"key":`，`dict(`→`{`），用 `dictDepth`+`rawDepth` 区分 dict 括号与值内普通括号；保留字面量形式兼容。
   - 验证：`dict(...)`、嵌套 dict、空格 `=`、尾逗号、`{'key':...}` 字面量全部通过。

2. **UTC 日期→时间戳含秒时失效**（`views/TimeConverter.vue`）
   - 现象：datetime-local 输入 `22:13:20` 时 UTC 分支 `new Date(v + ':00Z')` 拼成 `22:13:20:00Z` 非法 → 结果全 "—"。
   - 修复：`parseDateTime` 仅在缺秒时补 `:00`，否则直接加 `Z`。
   - 验证：`22:13` → 1699999980、`22:13:20` → 1700000000 均正确。

3. **正则匹配高亮从未生效**（`views/RegexTool.vue`）
   - 现象：输出 `<mark class="match">`，CSS 选择器却是 `.mark.match`（要求 class 同时含 mark+match）→ 自定义高亮不匹配，落回浏览器默认黄色。
   - 修复：选择器改为 `mark.match`。
   - 验证：`getComputedStyle` 背景为 `rgba(99,102,241,0.3)`，3 处高亮正确。

**决策**
- 手册 `docs/test-cases.md` 同步修正 5 处断言描述（J-2 折叠语义、J-4 SQL 输出形态、C-5 YAML 宽松解析、T-3 时区秒值、R-1 选择器），保证下次回归不再误报。
- 新增 `.github/workflows/release.yml`：tag 触发 → 四平台（macOS x64/arm64、Windows x64/x86）制品 + 草稿 Release；`workflow_dispatch` 手动构建。

## [2026-08-01] 开源化：文档重组 + 许可证选型

**背景**
用户将本项目作为自己的开源项目发布。

**决策**
- 重写根 `Design.md`：从"从零实现规格"改为"实际实现架构说明"（中英双语，正文中文 + 标题/术语英文）
- 新增 `docs/test-cases.md`：全量 Playwright 用例手册，改动后用 AI + Playwright 回归验证
- README 采用中英两版：`README.md`（English）+ `README.zh-CN.md`（中文镜像）
- 许可证默认 **MIT**，版权人占位 `shark` —— **待用户确认/替换真实署名**
- 死代码已清理（2026-08-01）：删除 `JsonEditor.vue`、`ToolPlaceholder.vue`、`--tool-rest` CSS 变量，`npm run build` 通过（见 Design.md §12.1）

**理由**
开源项目需要与代码同步的架构文档、可自动回归的测试入口、面向国际的 README 与合规许可证；死代码在发布前清理。

**待确认**
- [ ] LICENSE 版权人署名
- [ ] git init / 首次提交 / 推送到远程

## [2026-08-01] HTML/XML 格式化用 DOMParser + 标签小写化

**背景**  
HTML 格式化用 DOMParser('text/html') 会输出大写标签并注入 head/body。

**决策**  
- XML 用 text/xml（保留大小写）；HTML 用 text/html 且标签名 lowerCase
- 空元素输出 `<tag />` 自闭合形式（可接受）

**理由**  
HTML 标签大小写不敏感，小写符合惯例；DOMParser 保证结构正确（自动补全/容错）。

## [2026-08-01] 排除 HTTP 请求实现，保留 Tauri 壳

**背景**  
用户要求按 Design.md 实现开发者工具箱，但排除 HTTP 请求相关实现。

**决策**  
- 整个移除 RestApiTool 页面、`composables/useRequest.ts`、`@tauri-apps/plugin-http` 依赖、`/rest` 路由及 Sidebar 对应项
- 保留 Tauri 2 桌面壳（1200×800，min 800×600，withGlobalTauri，CSP null）；含 shell 插件、不含 http 插件
- QrTool 用 `qrcode` 库替代设计中的手写简化版
- 实现分三阶段推进（Phase 1 基础设施+骨架+4 简单工具 → 验收）

**理由**  
RestApiTool 的全部功能即发 HTTP 请求，移除后无需 CORS 绕过插件；Tauri 壳按设计保留以得到桌面应用形态。

**备选方案**  
- 保留 RestApiTool UI 但模拟响应 — 否，无真实价值的占位复杂度
- 纯 Vue Web 应用（去 Tauri）— 否，用户明确选择桌面应用形态

## [2026-08-01] 版本选型

**背景**  
最新版本中有潜在兼容风险（vue-router 5、TypeScript 7）。

**决策**  
- vue-router 固定 `^4.6.4`（设计指定 Router 4）
- typescript 固定 `^5.9.3`（TS 7 为原生编译器重写，与 vue-tsc 兼容性不确定）
- vite 8.2 / @vitejs/plugin-vue 6（官方兼容）/ tauri CLI 2.11

**理由**  
严格模式 + vue-tsc 需要稳定类型体系；先保证可编译可验证。

**备选方案**  
- 追最新 vue-router 5 / TS 7 — 否，存在未知破坏性变更风险

