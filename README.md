# 🦈 白鲨工具站

免费、干净、无需注册的**创作者工具箱** —— 视频无水印下载、文案提取、九宫格切图、图片加水印、配音朗读等 16 个实用工具，全部在浏览器本地运行，用户数据不上传。

## 特点

- **纯静态站点**：无需构建、无需数据库，任何静态托管都能跑
- **16 个创作者工具**：视频下载 / 九宫格切图 / 加水印 / 图片压缩 / 配音朗读 / 字数统计 / 二维码生成解码 / 图片格式转换 / 颜色工具 / Markdown / 文本对比 / 视频转GIF / 图片拼接 / 文字转图片 / 全能格式转换器
- **设计系统**：暖浅灰底 + 白卡 + 单一强调色，深浅色主题切换
- **本地优先**：绝大多数工具在浏览器本地完成，不上传文件
- **完整 SEO**：robots.txt + sitemap.xml + 每页独立 meta

## 目录结构

```
.
├── index.html            # 首页
├── tools.html            # 工具列表
├── nav.html              # 网址导航（含实时热搜 + 每日推荐）
├── ai.html               # AI 专区
├── about.html            # 关于
├── 404.html              # 404 页面
├── robots.txt / sitemap.xml
├── assets/
│   ├── css/style.css     # 全站设计系统
│   ├── js/common.js      # 导航/主题/壁纸/搜索
│   ├── js/site.js        # 卡片渲染
│   ├── data/*.json       # 工具清单 / 导航站点 / AI 推荐
│   └── vendor/           # 本地第三方库（无 CDN 依赖）
├── tools/                # 16 个工具页面（每个独立一页）
├── api/                  # 服务端模块（B站解析 / 抖音解析 / 热搜聚合）
└── functions/api/        # Cloudflare Pages Functions（云端 API）
```

## 两种部署方式

### 方式一：GitHub Pages（纯静态，最简单）

1. 把本仓库所有文件上传到 GitHub 仓库
2. 仓库 **Settings → Pages → Source** 选 `main` 分支、`/ (root)` 目录，保存
3. 1 分钟后访问 `https://你的用户名.github.io/仓库名/`

> ⚠️ **限制**：GitHub Pages 只能跑静态页面，**「视频无水印下载」和「实时热搜」会失效**（它们依赖 `functions/` 里的服务端接口，GitHub Pages 无法运行）。其余 14 个工具完全正常。

### 方式二：Cloudflare Pages 连接 GitHub 仓库（推荐，功能全开）

1. 先把仓库传到 GitHub（同上）
2. 打开 https://dash.cloudflare.com → **Workers 和 Pages → 创建 → Pages → 连接到 Git**
3. 选择你的仓库，构建命令留空、输出目录填 `/`（根目录）
4. 部署完成后，**16 个工具全部可用**（`functions/` 会自动变成云端 API）

> 说明：Cloudflare Pages 会自动识别 `functions/` 目录并部署为 API，无需任何配置。

## 本地预览

```bash
node server.js
# 打开 http://localhost:8765
```

`server.js` 是一个零依赖的静态服务器，同时提供本地版的 `/api/*` 接口（视频解析、下载代理、热搜），方便本地调试全部功能。

## 技术说明

- 前端：原生 HTML / CSS / JavaScript，无框架、无构建步骤
- 第三方库全部本地化（`assets/vendor/`）：二维码、YAML、MP3 编码、marked、jsQR、gifenc、ffmpeg.wasm
- 格式转换器使用 ffmpeg.wasm（9.8MB 压缩核心，浏览器端解压后运行，转换全程不联网）
- 服务端接口用同一份代码在本地（`server.js`）和云端（`functions/`）运行

## 添加新工具

1. 在 `tools/` 新建页面（可复制任一现有工具页的骨架）
2. 在 `assets/data/tools.json` 追加一条记录：

```json
{
  "id": "my-tool",
  "name": "我的工具",
  "desc": "一句话介绍",
  "category": "image",
  "icon": "🔧",
  "url": "tools/my-tool.html",
  "keywords": "关键词 便于搜索",
  "featured": true
}
```

保存后，首页、工具列表、站内搜索会自动出现这个工具。

## 免责声明

视频下载功能仅供个人学习使用，请尊重原作者版权；抖音解析需用户自备登录 Cookie，请勿高频使用。

## License

MIT
