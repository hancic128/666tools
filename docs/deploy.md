# 部署文档 / Deployment Guide

> 开发者工具箱的 Web 版本通过 **GitHub Actions 构建制品 + 手动上传 EdgeOne Pages** 的方式部署。所有工具均为纯前端计算，无服务端依赖，产物为纯静态文件。

## 目录

1. [部署流程总览](#部署流程总览)
2. [第一步：打 tag 触发构建](#第一步打-tag-触发构建)
3. [第二步：下载构建制品](#第二步下载构建制品)
4. [第三步：上传到 EdgeOne Pages](#第三步上传到-edgeone-pages)
5. [绑定自定义域名（可选）](#绑定自定义域名可选)
6. [版本更新](#版本更新)
7. [常见问题](#常见问题)

---

## 部署流程总览

```
打 v* tag
   ↓
GitHub Actions 自动构建（web-dist 工作流）
   ↓
Actions 页面下载 web-dist.zip 制品
   ↓
解压后上传到 EdgeOne Pages 项目
   ↓
默认域名（xxx.edgeone.app）访问验证
```

- 工作流文件：[`.github/workflows/web-dist.yml`](../.github/workflows/web-dist.yml)
- 构建产物基于 `base: './'` 生成，所有资源路径均为相对路径，**根路径或子路径部署均可用**
- 路由为 hash 模式（`#/json`），静态托管天然支持，**无需配置任何重写规则或边缘函数**

## 第一步：打 tag 触发构建

只有推送 `v*` 格式的 tag 才会触发构建，例如：

```bash
git tag v0.2.0
git push origin v0.2.0
```

推送后两个工作流会**并行执行**：

| 工作流 | 产物 | 用途 |
|---|---|---|
| `release.yml` | 各平台桌面安装包 | 发布 GitHub Release |
| `web-dist.yml` | `web-dist` 制品 | 上传 EdgeOne Pages |

> tag 命名建议递增版本号，如 `v0.1.0` → `v0.2.0`；重复推送相同 tag 不会重新触发（需删除后重建，不推荐）。

## 第二步：下载构建制品

1. 打开仓库 **Actions** 页，找到 **web-dist** 工作流，点进最新一次运行
2. 等待构建完成（状态变绿，约 1 分钟）
3. 页面底部 **Artifacts** 区域 → 点击 **web-dist** 下载 `web-dist.zip`
4. 解压后即为完整站点文件：`index.html`、`favicon.png`、`assets/`

> 制品默认保留 90 天，过期后需要重新打 tag 构建。

## 第三步：上传到 EdgeOne Pages

1. 登录 [腾讯云控制台](https://console.cloud.tencent.com)，进入 **EdgeOne（边缘安全加速平台）**
2. 快速入门中选 **Pages** → **创建项目**
3. 框架选「静态网站 / 无框架」，项目名建议 `666tools`
4. 把解压出的所有文件（`index.html` + `favicon.png` + `assets/` 目录）整体上传，点击部署
5. 部署完成后获得默认访问域名（形如 `xxx.edgeone.app`），浏览器打开即可验证 17 个工具是否正常

> 默认域名**免备案、自动 HTTPS**，适合先快速验证；正式使用再绑定自定义域名。

## 绑定自定义域名（可选）

1. 自定义域名需先完成 **ICP 备案**（腾讯云控制台 → ICP 备案，仅中国大陆域名需要）
2. 将域名 DNS 接入 EdgeOne（CNAME 或 NS 方式）
3. 在 Pages 项目设置中绑定该域名，EdgeOne 自动签发并续期 HTTPS 证书

## 版本更新

每次更新站点内容，重复前三步：

```bash
git add . && git commit -m "feat: xxx"
git tag v0.3.0
git push origin v0.3.0
```

下载新制品后在 EdgeOne Pages 项目里重新上传覆盖即可。

## 常见问题

**Q：上传后页面空白 / 资源 404？**
A：确认上传的是解压后的 `dist` **内容**（`index.html` 在根目录），而不是把 `dist` 文件夹整体传进去；同时确认浏览器地址为根路径或子路径都对应正确的上传位置（产物为相对路径构建，两种均可）。

**Q：桌面安装包和 Web 版代码一样吗？**
A：同源同构建。桌面版（Tauri）与 Web 版共用同一套 Vue 前端，Web 版部署不依赖桌面运行时。

**Q：不想打 tag，能手动触发构建吗？**
A：当前策略刻意保持「仅 tag 触发」，保证每个线上版本都有对应版本号可追溯。如需临时验证，可本地 `npm run build` 后直接上传本地 `dist/`。
