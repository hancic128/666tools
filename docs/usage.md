# 使用文档 / Usage Guide

> 开发者工具箱（666Tools）支持 **桌面应用、浏览器、Docker** 三种运行方式，所有数据处理均在本地完成，无网络请求、无账号。

## 目录

1. [运行方式](#运行方式)
   - [桌面应用（推荐）](#桌面应用推荐)
   - [浏览器开发模式](#浏览器开发模式)
   - [Docker 部署](#docker-部署)
2. [界面与操作](#界面与操作)
   - [导航与侧边栏](#导航与侧边栏)
   - [主题](#主题)
   - [快捷键](#快捷键)
   - [输入 / 输出编辑器](#输入--输出编辑器)
3. [工具说明](#工具说明)
4. [常见问题](#常见问题)

---

## 运行方式

### 桌面应用（推荐）

从 [Releases 页面](https://github.com/Angryshark128/666tools/releases/latest) 下载对应平台安装包：

| 平台 | 架构 |
|---|---|
| macOS | x64（Intel）· arm64（Apple Silicon） |
| Windows | x64 · x86（32 位） |

> macOS 安装包未签名，首次打开会出现 Gatekeeper 警告——右键应用 → 打开，或到「系统设置 → 隐私与安全性」允许。

### 浏览器开发模式

```bash
npm install
npm run dev        # 打开 http://localhost:1420
```

### Docker 部署

```bash
# 方式一：docker compose（推荐）
docker compose up -d            # 访问 http://localhost:1420

# 方式二：docker build + run
docker build -t 666tools .
docker run -d --name 666tools -p 1420:80 666tools
```

- 默认端口映射 `1420:80`，改端口在 `docker-compose.yml` 的 `ports` 调整。
- 路由为 hash 模式（`#/json`），无需 nginx 特殊配置。
- 拉取基础镜像失败时（国内网络），需为 Docker 配置镜像加速（`registry-mirrors`）。

---

## 界面与操作

### 导航与侧边栏

- 左侧 18 个工具按类别分组，点击切换。
- 侧边栏默认折叠（仅图标），鼠标悬停展开；点图钉按钮可常驻展开（状态持久化）。

### 主题

- 侧边栏底部按钮在 **亮色 / 暗色** 间切换，另有「跟随系统」档。
- 主题选择自动持久化到本地。

### 快捷键

| 快捷键 | 作用 |
|---|---|
| `Cmd/Ctrl + Enter` | 在当前页执行主操作（格式化 / 转换 / 编码等） |
| `Cmd/Ctrl + C`（复制按钮） | 复制结果到剪贴板（按钮短暂显示「已复制!」） |

### 输入 / 输出编辑器

- 所有输入/输出区**默认自动换行**：长行软换行，不产生横向滚动条；换行时自动隐藏行号。
- 输出区带 **token 级语法高亮**（JSON / SQL / Python / XML / HTML / YAML）。

---

## 工具说明

| 工具 | 路由 | 说明 |
|---|---|---|
| 代码格式化 | `#/json` | JSON（可折叠树）/ SQL / Python / XML / HTML 格式化 + 高亮；缩进 2/4 可调 |
| 格式转换 | `#/converter` | JSON ⇄ JSON String ⇄ YAML ⇄ Python Dict 互转；支持 `dict(...)` 反向解析 |
| 时间戳转换 | `#/time` | 时间戳⇄日期（s/ms/μs/ns 自动判定）、日期→时间戳、时长换算、实时时钟 |
| 文本对比 | `#/diff` | LCS 逐行对比；text / JSON / properties 三种模式 |
| Mermaid | `#/mermaid` | Mermaid 流程图渲染；缩放/平移；SVG/PNG 导出；暗色主题联动 |
| MD图片 | `#/md-image` | Markdown 转图片；5 套主题排版；3:4 / 1:1 / 9:16 比例；导出/复制 PNG |
| Base64 | `#/base64` | UTF-8 安全的 Base64 编解码，⇄ 交换 |
| URL | `#/url` | URL / 文本的百分号编码与解码 |
| 正则测试 | `#/regex` | 实时匹配高亮 + 匹配列表；支持 `g/i` 等 flag |
| JWT 解析 | `#/jwt` | 解析 Header/Payload，校验 exp/iat 有效期 |
| Hash | `#/hash` | MD5 + SHA-1/256/512（WebCrypto），实时计算 |
| UUID | `#/uuid` | 批量生成 v4；大小写/连字符可切换 |
| 颜色转换 | `#/color` | HEX/RGB/HSL 三向联动 + 取色器 + 20 预设 |
| Curl 转代码 | `#/curl` | curl → fetch / axios / Python / Go |
| 文本统计 | `#/text-stats` | 字符/词数等 11 项统计 + Top10 词频 |
| 大小写转换 | `#/case` | camelCase / snake_case / CONSTANT_CASE 等 9 种格式 |
| 二维码 | `#/qr` | 任意文本/URL 生成二维码，可调尺寸、导出 PNG |
| 进制转换 | `#/radix` | 2/8/10/16 进制互转，BigInt 支持大数，批量输入 |

---

## 常见问题

**Q：桌面版和浏览器版功能有差异吗？**
A：没有。Tauri 仅作桌面壳，工具逻辑与浏览器版完全一致。

**Q：Docker 启动后端口冲突？**
A：改 `docker-compose.yml` 的 `ports`（如 `"3000:80"`），重新 `docker compose up -d`。

**Q：格式化结果和我预期的不一样？**
A：SQL 采用紧凑风格（短列表单行、`COUNT(*)` 内联）；YAML/Python 为宽松解析（无冒号行视为空对象）。详见 [Design.md](./Design.md)。
