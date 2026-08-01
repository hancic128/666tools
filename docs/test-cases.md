# 测试用例手册 / Test Case Manual (Playwright)

> 目的：每次代码改动后，交由 AI 用 Playwright 浏览器自动验证全部 17 个工具，防止回归。
> Purpose: after every change, have an AI verify all 17 tools in a real browser via Playwright to catch regressions.
>
> 覆盖基线：当前实现（见 `../Design.md`）。文档与代码不同步时，以代码为准并回更新本文档。

## 0. 运行环境 / Environment

```bash
npm run dev        # 启动 Vite，dev server 在 http://localhost:1420
```

Playwright 打开 `http://localhost:1420` 即可。Tauri 壳不参与前端功能验证。

**约定 / Conventions**

- 输入区文本域 = `textarea.editor-input:not([readonly])`（每个页面第一个）；输出区 = `textarea.editor-input[readonly]`。
- 按钮统一用 `getByRole('button', { name: '...' })`；若页面有多个同名按钮，用 `.nth(i)`。
- 自定义下拉 Select：点击 `.select-trigger` → 点击 `.select-option` 文本项。
- 复制类按钮会短暂变为"已复制!"（1 秒），断言时留意时序。
- 需要剪贴板断言时，先 `context.grantPermissions(['clipboard-read', 'clipboard-write'])`。

**路由表 / Route map**

| 工具 | 路由 | 工具 | 路由 |
|---|---|---|---|
| 格式化 | `#/json` | Hash | `#/hash` |
| 转换 | `#/converter` | UUID | `#/uuid` |
| 时间 | `#/time` | 颜色 | `#/color` |
| 对比 | `#/diff` | Curl | `#/curl` |
| Mermaid | `#/mermaid` | 统计 | `#/text-stats` |
| Base64 | `#/base64` | 命名 | `#/case` |
| URL | `#/url` | 二维码 | `#/qr` |
| 正则 | `#/regex` | 进制 | `#/radix` |
| JWT | `#/jwt` | | |

---

## 1. 全局用例 / Global Cases

### G-1 默认重定向
- 打开 `/` → 应跳转到 `#/json`，标题显示"代码格式化"。

### G-2 主题切换与持久化
1. 点击侧边栏底部主题按钮（`aside .footer-btn` 最后一个）。
2. `document.documentElement` 应带 `dark` class；`localStorage['devtools-theme'] === 'dark'`。
3. 再点一次 → 带 `light` class。
4. 刷新页面 → 主题保持。
5. 置空 `localStorage['devtools-theme']` 并刷新 → 恢复跟随系统（无 `dark`/`light` class）。

```ts
await page.goto('http://localhost:1420/#/json')
await page.locator('aside .footer-btn').last().click()
expect(await page.evaluate(() => document.documentElement.className)).toContain('dark')
```

### G-3 侧边栏折叠 / 展开 / 图钉
1. 默认收起，宽度 64px（`aside.sidebar` 的 `width`）。
2. `mouseenter` 侧边栏 → 展开到 200px；`mouseleave` → 收起。
3. 点击图钉按钮（`.footer-btn` 第一个）→ 常驻展开，`localStorage['devtools-sidebar-pinned'] === '1'`；再点取消。

### G-4 导航高亮
- 点击任意 `.nav-item` → URL hash 变为对应路由，该项带 `active` class。
- 点击"格式化" → hash `#/json`，`.nav-item.active` 文案为"格式化"。

### G-5 复制反馈
- 任一工具点击"复制结果"类按钮 → 按钮文案短暂变为"已复制!"，1 秒后恢复。

---

## 2. 代码格式化 `#/json` / JsonFormatter

### J-1 JSON 折叠树 + 高亮
- 输入 `{"a":1,"b":[true,null,"x"]}`（第一个 textarea）。
- 点"格式化"（或 Cmd/Ctrl+Enter）。
- 期望：右侧 `.format-output.json-tree` 出现，含 `.f-tok.f-key` 的 `"a"`、`.f-tok.f-bool` 的 `true`、`.f-tok.f-number` 的 `1`、`.f-tok.f-null` 的 `null`；顶层 `[`/`{` 为可点击 `.f-fold`。

```ts
const input = page.locator('textarea.editor-input:not([readonly])').first()
await input.fill('{"a":1,"b":[true,null,"x"]}')
await page.getByRole('button', { name: '格式化' }).click()
const out = page.locator('.format-output')
await expect(out.locator('span.f-tok.f-key')).toContainText('a')
await expect(out.locator('span.f-tok.f-bool')).toContainText('true')
```

### J-2 折叠 / 展开交互
1. 默认折叠深度 2：输入 `{"a":{"b":{"c":1,"d":2}}}` → 深度 2 的 `$.a.b` 对象默认折叠，显示 `...N keys...`（标量不折叠）。
2. 点击该 `.f-ellipsis` → 展开出 `"c"/"d"`；再点 `.f-fold` → 再次折叠。
3. 点"全部折叠"→ 根节点也折叠（仅剩 1 个 ellipsis）；点"全部展开"→ 全部展开（0 个 ellipsis）。

### J-3 非法 JSON
- 输入 `{bad` → 输出区应显示 `JSON 解析错误`（`.format-error`），无树渲染。

### J-4 SQL 格式化
1. Header 第一个 Select 切到 `SQL`。
2. 输入 `select id,name from users where id=1 order by name;` → 点"格式化"。
3. 期望：`.format-output` 内关键字大写（含 `SELECT`/`FROM`/`WHERE`/`ORDER`），首行 `SELECT id,` 后换行，`ORDER BY` 合排（实际输出 `SELECT id,\nname\nFROM users\nWHERE id = 1\nORDER BY name ;`）。
4. 关键字高亮：`SELECT` 应为 `.f-tok.f-keyword`。

### J-5 Python / XML / HTML
- Python：`x=1 # comment` → 注释 `.f-tok.f-comment` 存在，尾随空格被清理。
- XML：`<root><a x="1">t</a></root>` → 输出自闭合/换行结构，`<a x="1">t</a>` 保留大小写。
- HTML：`<DIV><SPAN>t</SPAN></DIV>` → 标签名**小写**为 `<div>`/`<span>`。
- 非法 XML（如未闭合）→ 显示错误。

### J-6 缓存
- 输入一段内容 + 选 SQL + 缩进 4 → 刷新页面 → 输入、格式、缩进全部恢复。

### J-7 复制
- 点"复制结果"→ 剪贴板内容 = 格式化后的文本；按钮短暂显示"已复制!"。

---

## 3. 格式转换 `#/converter` / FormatConverter

### C-1 JSON → YAML
- 输入 `{"name":"alice","age":30,"tags":["a","b"]}`。
- 期望（只读输出区）：
```
name: alice
age: 30
tags:
  - a
  - b
```

### C-2 JSON → Python Dict
- Header 右侧 Select 切到 `Python Dict` → 输出 `dict(name='alice', age=30, tags=['a', 'b'])`。

### C-3 JSON → JSON String
- 切到 `JSON String` → 输出为带转义的外层引号字符串。

### C-4 交换 ⇄
- 点击"交换"→ 左侧 from/to 互换，原输出回填到输入框，并立即生成新方向的转换结果。

### C-5 反向解析
- YAML → JSON：`from=YAML`、`to=JSON`，输入上例 YAML → 输出原 JSON。
- Python → JSON：输入 `dict(name='alice', age=30)` → 输出 `{"name":"alice","age":30}`（支持 `dict(...)` 形式、嵌套 `dict(a=1, b=dict(c=2))`、空格 `key = value`）。
- Python 字面量形式：输入 `{'name': 'alice', 'age': 30, 'flag': True, 'none': None}` → 输出等价 JSON。
- 非法 JSON 源 → 输出区前缀 `⚠ 转换失败`。
- 注意：YAML 源对无 `:` 的垃圾行宽松解析为空对象 `{}`（手写解析器的宽容行为，非报错路径）。

---

## 4. 时间戳转换 `#/time` / TimeConverter

### T-1 时间戳 → 日期
- Tab 1（默认）输入 `1700000000`，单位"自动"。
- 期望：UTC 时间为 `Tue, 14 Nov 2023 22:13:20 GMT`（本地时区随机器）；结果卡片显示本地/UTC/ISO 三行。

```ts
await page.goto('http://localhost:1420/#/time')
await page.locator('.num-input').first().fill('1700000000')
await expect(page.locator('.result-card')).toContainText('Nov 14, 2023')
```

### T-2 单位 auto 判定
- 输入 `1700000000000`（毫秒）→ 同一日期；输入 `1700000000000000`（微秒）→ 同一日期。

### T-3 日期 → 时间戳
- Tab 2，datetime-local 输入 `2023-11-14T22:13:20`，时区 UTC。
- 期望：秒 `1700000000`、毫秒 `1700000000000`、微秒/纳秒按倍数扩展。
- 含秒/仅分钟两种输入都应在 UTC 下正确（`22:13` → 秒 `1699999980`）。

### T-4 时长转换
- Tab 3，输入 `90`、单位"分钟"→ 人类可读"1 小时 30 分钟"，毫秒 `5,400,000`。

### T-5 实时时钟
- 页面顶部 `.clock-ts` 每秒变化（等待 2 秒对比两次取值）。

---

## 5. 文本对比 `#/diff` / DiffTool

### D-1 文本 diff
- 左侧：`a\nb\nc`，右侧：`a\nx\nc`。
- 期望：`.diff-body` 出现 1 行 `.row-del`（内容 `b`）和 1 行 `.row-add`（内容 `x`），行号正确。

```ts
const left = page.locator('textarea.editor-input:not([readonly])').nth(0)
const right = page.locator('textarea.editor-input:not([readonly])').nth(1)
await left.fill('a\nb\nc'); await right.fill('a\nx\nc')
await expect(page.locator('.row-del')).toContainText('b')
await expect(page.locator('.row-add')).toContainText('x')
```

### D-2 JSON 对比
- Header Select 切 `JSON`。左侧 `{"a":1,"b":2}`，右侧 `{"a":1,"b":3}`。
- 期望：两边先被美化，`"b"` 所在行出现增/删差异（`.`、`"b"`、值所在行有差异）。

### D-3 properties 对比
- Select 切 `Properties`。左侧 `b=2\na=1`，右侧 `a=1\nc=3`。
- 期望：按 key 排序后对比，`b`/`c` 行出现增删；`.diff-key`（key 高亮）与 `.diff-val`（value 高亮）存在。

---

## 6. Base64 `#/base64` / Base64Tool

### B-1 编码
- 输入 `hello` → 输出 `aGVsbG8=`。

### B-2 UTF-8 中文
- 输入 `你好` → 输出 `5L2g5aW9`。

### B-3 解码 + 交换
- 输入 `aGVsbG8=` 并切"解码" → 输出 `hello`。
- 编码态点"交换"→ 输入变为 `aGVsbG8=`，模式自动切为解码，输出 `hello`。

### B-4 非法输入
- 解码态输入 `!!` → 输出 `⚠ 无法处理的输入`。

---

## 7. URL `#/url` / UrlTool

### U-1 编码
- 输入 `https://example.com/?q=你好世界` → 输出
  `https%3A%2F%2Fexample.com%2F%3Fq%3D%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C`。

### U-2 解码 + 交换
- 解码态输入上例编码串 → 还原原文；"交换"同样生效。

### U-3 非法解码
- 解码态输入 `%zz` → 输出 `⚠ 无效的 URL 编码`。

---

## 8. 正则测试 `#/regex` / RegexTool

### R-1 实时匹配高亮
- pattern 输入 `\d+`（`.pattern-input`），测试文本 `a1 b22 c333`。
- 期望：`mark.match`（`<mark class="match">`，CSS 选择器为 `mark.match`）出现 3 处；匹配列表 `.match-item` 3 项，位置分别为 `@1–2`、`@4–6`、`@8–11`。

```ts
await page.goto('http://localhost:1420/#/regex')
await page.locator('.pattern-input').fill('\\d+')
await page.locator('textarea.editor-input:not([readonly])').first().fill('a1 b22 c333')
await expect(page.locator('.mark.match')).toHaveCount(3)
await expect(page.locator('.match-item')).toHaveCount(3)
```

### R-2 非法正则
- pattern 输入 `(` → `.regex-error` 显示正则错误，无崩溃。

### R-3 flag 切换
- 关闭 `g` → 匹配列表仅 1 项（首个匹配）。
- 开启 `i`（如 pattern `hello`、文本 `Hello`）→ 大小写不敏感匹配。

### R-4 复制匹配
- 有匹配时点"复制 3 个匹配"→ 剪贴板为 3 行匹配文本。

---

## 9. JWT `#/jwt` / JwtTool

### W-1 完整解析
输入样例（Header/Payload 均 JSON，exp 在未来）：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiYWxpY2UiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.signature
```
- 期望：
  - Header tab 显示 `{"alg":"HS256","typ":"JWT"}`（JsonView 高亮）。
  - Payload tab 显示 `sub/name/iat/exp`；顶部徽标"有效"（`.badge-valid`）。
  - exp/iat 两行 claim 存在，exp 行显示剩余时间（`text-remaining`）。
  - 底部 `.signature-bar` 显示 `signature`。

```ts
const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiYWxpY2UiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTkwMDAwMDAwMH0.signature'
await page.locator('textarea.editor-input:not([readonly])').first().fill(jwt)
await expect(page.locator('.badge-valid')).toContainText('有效')
await expect(page.locator('.signature-bar')).toContainText('signature')
```

### W-2 过期判定
- 构造 payload `exp` 为过去值（如 `iat:1000000000, exp:1500000000`）→ 徽标"已过期"（`.badge-expired`），exp 行含"已过期"。
  - 该 payload 的 b64url：`eyJpYXQiOjEwMDAwMDAwMDAsImV4cCI6MTUwMDAwMDAwMH0`。

### W-3 格式错误
- 输入不足三段（如 `abc.def`）→ 提示"JWT 需包含三段"。
- 输入乱码 → 提示解析失败。

### W-4 Payload 非 JSON
- payload 段为纯文本 b64url（如 `hello` → `aGVsbG8`）→ Payload tab 原文展示（字符串），不报错。

---

## 10. Hash `#/hash` / HashTool

### H-1 MD5
- 输入 `abc` → MD5 行值 `900150983cd24fb0d6963f7d28e17f72`（默认"全部"）。

```ts
await page.goto('http://localhost:1420/#/hash')
await page.locator('textarea.editor-input:not([readonly])').first().fill('abc')
await expect(page.locator('.hash-row', { hasText: 'MD5' })).toContainText('900150983cd24fb0d6963f7d28e17f72')
```

### H-2 SHA-256
- 同输入 → SHA-256 行值 `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`。

### H-3 算法切换 + 实时
- 点 `SHA-1` pill → 仅 1 行，值 40 字符十六进制。
- 修改输入 → 各哈希值立即更新（无按钮）。

### H-4 UTF-8 中文
- 输入 `你好` → MD5 值应为 `7eca689f0d3389d9dea66ae112e5cfd7`（UTF-8 编码）。

### H-5 复制全部
- "复制全部"→ 剪贴板为 `MD5: …` / `SHA-1: …` 多行。

---

## 11. UUID `#/uuid` / UuidTool

### I-1 批量生成
- 默认 5 个，均匹配 UUID v4 正则 `^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`。

### I-2 数量/格式切换
- Select 切 `1 个` → 1 项。
- 切"大写"→ 全部大写；切"无连字符"→ 无 `-`。
- 点"重新生成"→ 值变化。

### I-3 单项复制
- 点击某个 `.uuid-item` → 出现"已复制!"角标，剪贴板为该 UUID。

---

## 12. 颜色 `#/color` / ColorTool

### L-1 HEX 驱动
- 默认 `#6366F1`（色块预览同色）。
- 修改 HEX 输入为 `#ff0000` → RGB `255/0/0`，HSL `0/100/50`，色块变红。

```ts
await page.goto('http://localhost:1420/#/color')
const hex = page.locator('input.mono').first()
await hex.fill('#ff0000')
const r = page.locator('input[type=number]').nth(0)
await expect(r).toHaveValue('255')
```

### L-2 RGB 驱动
- R 改 0（其余不变）→ HEX 变 `#00FF00`，HSL 更新。

### L-3 HSL 驱动
- HSL 改 `h=240,s=100,l=50` → HEX `#0000FF`，RGB `0/0/255`。

### L-4 预设色板
- 点击某个色块 → 各字段同步为该色，选中色块带 `active`。

---

## 13. Curl 转代码 `#/curl` / CurlTool

### K-1 Fetch 生成
- 输入：`curl -X POST https://api.example.com/users -H "Content-Type: application/json" -d '{"name":"alice"}'`
- 期望（Fetch tab）：含 `fetch("https://api.example.com/users"`、`method: "POST"`、`"Content-Type": "application/json"`、`body: "{\"name\":\"alice\"}"`。

### K-2 Python / Go
- 切 `Python requests` → 含 `requests.request("POST"` 且用 `json=`（因 Content-Type 含 json）。
- 切 `Go net/http` → 含 `http.NewRequest("POST"`、`strings.NewReader`。

### K-3 未识别 URL
- 输入 `hello world` → 输出 `⚠ 未识别到 URL`。

### K-4 高级参数
- 输入 `curl -u admin:secret https://api.example.com/data` → Go 输出含 `req.SetBasicAuth("admin", "secret")`。

---

## 14. 文本统计 `#/text-stats` / TextStats

### S-1 基础统计
- 输入 `Hello 世界\n\nfoo foo bar`：
  - 总字符 16、中文字符 2、词数 5（Hello/世界/foo/foo/bar）。

### S-2 词频
- 期望 Top 10 首位 `foo` 计 2（条形容器 `.freq-row` 第一行），`freq-count` 为 `2`。
- 中文按字：输入 `你好你好` → 首位"你"计 2。

---

## 15. 大小写 `#/case` / CaseConverter

### M-1 各格式
- 输入 `my_variable_name` → 依次点击格式按钮断言：
  - camelCase `myVariableName`、PascalCase `MyVariableName`、CONSTANT_CASE `MY_VARIABLE_NAME`、kebab-case `my-variable-name`、Sentence case `My variable name`。

```ts
await page.goto('http://localhost:1420/#/case')
await page.locator('textarea.editor-input:not([readonly])').first().fill('my_variable_name')
const out = page.locator('textarea.editor-input[readonly]').first()
await page.getByRole('button', { name: 'camelCase' }).click()
await expect(out).toHaveValue('myVariableName')
```

### M-2 缩写与混合
- 输入 `XMLHttpRequest2` → snake_case `xml_http_request_2`，CONSTANT_CASE `XML_HTTP_REQUEST_2`。

---

## 16. 二维码 `#/qr` / QrTool

### N-1 生成
- 输入 `https://example.com` → canvas 渲染（`.qr-canvas` 有内容，无 `.qr-error`）。

```ts
await page.goto('http://localhost:1420/#/qr')
await page.locator('textarea.qr-input').fill('https://example.com')
await page.waitForFunction(() => {
  const c = document.querySelector('canvas.qr-canvas') as HTMLCanvasElement | null
  if (!c) return false
  const d = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data
  return d.some((v) => v !== 0) // 存在非透明像素
})
```

### N-2 尺寸
- Select 切 `512px` → canvas `width/height` 变为 512。

### N-3 导出
- 点"下载 PNG"触发下载；点"复制图片"（需剪贴板权限）反馈"已复制!"。

### N-4 空输入
- 清空输入 → canvas 被清空，显示"二维码将显示在这里"。

---

## 17. 进制转换 `#/radix` / RadixTool

### X-1 十进制 → 十六进制
- from=10、to=16（默认），输入 `255` → 输出 `ff`。

```ts
await page.goto('http://localhost:1420/#/radix')
await page.locator('textarea.editor-input:not([readonly])').first().fill('255')
await expect(page.locator('textarea.editor-input[readonly]').first()).toHaveValue('ff')
```

### X-2 批量 + 大数
- 输入 `255 1024` → 输出 `ff`/`400` 两行。
- 输入 `123456789012345678901234567890` → 输出 BigInt 精确保留的十六进制。

### X-3 交换与非法
- 点"交换"→ from/to 互换且输入回填。
- 输入 `zz` → 输出 `⚠ 无法解析: zz`。

---

## 18. Mermaid `#/mermaid` / MermaidTool

### E-1 默认渲染
- 页面加载（默认示例登录流程图）→ `.mermaid-canvas svg` 存在，无 `.mermaid-error`。

```ts
await page.goto('http://localhost:1420/#/mermaid')
await expect(page.locator('.mermaid-canvas svg').first()).toBeVisible()
```

### E-2 面板模式
- 切"仅代码"→ 预览面板消失；切"仅预览"→ 代码面板消失；"双栏"→ 两者都在。

### E-3 缩放 / 平移
- 点"＋"→ 右侧 `%` 提示上升（25%→…），点"重置"→ 回到 100%。
- Ctrl+滚轮可缩放（模拟 wheel 事件）。

### E-4 语法错误
- 代码改为乱码 → `.mermaid-error` 显示"渲染失败"。

### E-5 主题联动
- 切换侧边栏暗色 → 渲染重跑（MutationObserver），SVG 主题样式变化（人工目测或对比 svg 字符串）。

### E-6 导出与缓存
- 点"SVG"下载 `.svg`、点"PNG"下载 2x PNG、"复制源码"复制 SVG 文本。
- 修改代码 → 刷新 → 代码从 `devtools-mermaid-cache` 恢复。

---

## 19. 快速回归清单 / Quick Regression Checklist

改动后优先跑一遍以下冒烟：

1. `npm run build` 通过（vue-tsc + vite）。
2. 打开 `/` → 跳转 `#/json`，侧边栏 17 项，主题/图钉正常。
3. 每个路由 `page.goto` 后无控制台报错、无空白页。
4. 用上文每节第一条用例做各工具冒烟。
5. 桌面端：`npm run tauri dev` 窗口 1200×800 可启动（Rust 编译异常时排查）。

> 提示：Playwright 复用 dev server 即可；涉及 localStorage 的用例先 `context.clearCookies()` / 清空指定键，避免用例间相互干扰。
