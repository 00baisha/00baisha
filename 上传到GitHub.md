# 📤 把网站上传到 GitHub（手把手版）

包已经准备好了，位置：**`D:\deepseek\baisha-tools-github`**（10.7MB，54 个文件）

---

## 第一步：注册 / 登录 GitHub

打开 https://github.com → 注册或登录（邮箱即可，免费）

## 第二步：创建一个新仓库

1. 右上角 **+** → **New repository**
2. **Repository name** 填：`baisha-tools`
3. 选 **Public**（公开）——免费账号用 Pages 必须公开
4. **不要**勾选 "Add a README file"（我们自己的要传上去）
5. 点 **Create repository**

## 第三步：上传文件（两种方法，选一个）

### 方法 A：网页上传（简单，但文件多时慢）

1. 进入刚创建的仓库页面
2. 点 **uploading an existing file** 链接（或 Add file → Upload files）
3. 打开 `D:\deepseek\baisha-tools-github` 文件夹，**全选里面的所有文件和文件夹**（Ctrl+A），拖进浏览器上传区
4. 等上传完成（约 10MB，有点慢，耐心等）
5. 下方 **Commit changes** 点一下

> ⚠️ 网页上传单文件上限 25MB。我们已经把 ffmpeg 核心压缩到 9.8MB，**所以能传上去**。（原始的 30MB 文件已排除，不影响使用）

### 方法 B：GitHub Desktop（推荐，更稳更快）

1. 下载安装 https://desktop.github.com
2. 登录你的 GitHub 账号
3. **File → Add local repository** → 选择 `D:\deepseek\baisha-tools-github`
   - 如果提示不是仓库，点 **create a repository** 用它创建
4. 左下角填提交信息（随便写，如 `我的工具站`）→ 点 **Commit to main**
5. 右上角点 **Publish repository** → 取消勾选 "Keep this code private" → 点 **Publish**

---

## 第四步：让网站上线（选一个）

### 🅰️ 用 GitHub Pages（最简单，但部分功能受限）

1. 进入仓库 → **Settings** → 左侧 **Pages**
2. **Source** 选 `Deploy from a branch`
3. **Branch** 选 `main`、目录选 `/ (root)` → **Save**
4. 等 1-3 分钟，刷新页面，顶部会出现网址：
   **`https://你的用户名.github.io/baisha-tools/`**

**⚠️ 这样上线后：**
- ✅ 14 个本地工具全部正常（九宫格、加水印、压缩、配音、格式转换等）
- ❌ 「视频无水印下载」失效
- ❌ 「网址导航」里的实时热搜失效

原因：这两个功能需要服务端接口（`functions/` 目录），GitHub Pages 只能跑静态页面。

### 🅱️ 用 Cloudflare Pages 连接 GitHub（推荐，16 个工具全部可用）

1. 打开 https://dash.cloudflare.com 注册/登录（免费）
2. **Workers 和 Pages** → **创建** → **Pages** → **连接到 Git**
3. 授权 GitHub → 选择 `baisha-tools` 仓库
4. 构建设置：**构建命令留空**，**输出目录填 `/`**
5. 点 **保存并部署**，1 分钟后得到网址 `xxxx.pages.dev`

**这样 16 个工具全部可用**，而且以后你在 GitHub 更新代码，Cloudflare 会自动重新部署。

---

## 常见问题

**Q：上传卡住/失败？**
A：多半是文件太多。用 GitHub Desktop（方法 B）更稳。

**Q：GitHub Pages 打开了但样式全乱？**
A：等 2-3 分钟（首次部署 CDN 需要时间），或按 Ctrl+F5 强制刷新。

**Q：想改内容怎么办？**
A：本地改完 `D:\deepseek\baisha-tools` 里的文件 → 重新复制到 `baisha-tools-github` → 在 GitHub Desktop 里提交推送，或在网页上重新上传改动的那几个文件。

**Q：以后想加新工具？**
A：告诉我（AI 助手）"加一个 XX 工具"，我做完后重新给你更新包。
