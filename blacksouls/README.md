# BLACK SOULS 手表版 · 宣传站

把手表游戏《BLACK SOULS》做成一个单页宣传站，核心是**在浏览器里直接玩到序章**。

- 纯静态：HTML / CSS / JS，**零依赖、零构建**
- 双击 `index.html` 即可浏览与游玩（不用起服务器）
- 可直接部署到 GitHub Pages / Vercel

## 目录

```
blacksouls-site/
├── index.html          页面结构（7 段：Hero / 这是什么 / 开始游戏 / 序章四步 / 原版对照 / 怎么做的 / 页脚）
├── styles.css          视觉与布局（含手表表盘的 466x538 坐标系）
├── story.js            剧本数据（由游戏工程的 src/game/story.js 转换而来）
├── game.js             可玩版状态机（标题 / 对话 / 选项 / 取名 / 切立绘）
├── main.js             页面交互（BGM 试听、大图查看、滚动淡入）
├── .nojekyll           给 GitHub Pages 用，关掉 Jekyll 处理
├── assets/
│   ├── img/ui/         标题底图、菜单框、光标、应用图标
│   ├── img/game/       游戏内素材：场景底板、立绘、整套 UI 图层
│   ├── img/device/     手表实机截图（390x450）
│   ├── img/pc/         原版 PC 画面（用于移植对照）
│   ├── img/dev/        开发环境截图
│   └── audio/          title.mp3（BGM）
├── _tools/
│   └── prepare-assets.ps1   素材准备脚本（复制 + 改名 + 压缩，可重复运行）
└── _test/              开发自检用（见下），**部署前请删除**
```

## 本地预览

双击 `index.html` 即可。也可以起个本地服务器：

```powershell
python -m http.server 8321 --bind 127.0.0.1 --directory "D:\deepseek\blacksouls-site"
# 然后打开 http://127.0.0.1:8321/
```

## 部署

GitHub Pages：把整个目录推到仓库，仓库 Settings → Pages 选分支根目录即可。
`.nojekyll` 已就位，`_test/` 已加进 `.gitignore`，用 git 推送的话不会带上它。

Vercel：新建项目指向该目录，无需任何构建命令与输出目录设置。

## 操作方式

| 操作 | 对应手表实机 |
|---|---|
| 滚轮 / ↑ ↓ / 上下滑 | 表冠旋转 |
| 点击 / Enter / 空格 | 点按屏幕 |
| 对话中点击 | 跳过打字机，立刻显示整句 |

## 已验证（无头浏览器实跑，非肉眼估计）

| 检查项 | 结果 |
|---|---|
| 全部 48 个资源 URL | 200 |
| 标题菜单（含光标） | PASS |
| 打字机对话 + 立绘 + 名牌 + ▼ | PASS |
| 逐字取名（点字 / 移格 / 決定削除翻页） | PASS |
| 是 / 否 选项窗 | PASS |
| 出身三选一 → 立绘切换为骑士 | PASS |
| 走完序章到「故事，要开始了——」 | PASS |
| 大图查看（打开 / Esc 关闭） | PASS |
| 重玩按钮回到标题 | PASS |
| 桌面 1440 宽 / 手机 390 宽布局 | 通过，无横向滚动 |

自检脚本在 `_test/`：`drive.html?s=0..4` 逐关校验，`interactive.html` 校验交互。
用法：站点跑起来后，用无头浏览器打开对应 URL 并截图，probe 文本在页面左下角。

## 素材来源（只读，未修改任何源文件）

| 用途 | 来源 |
|---|---|
| 游戏内素材与 BGM | `D:\Blacksouls\wearbs\my-application-13\src\assets` |
| 手表实机截图 | `C:\Users\PC\Pictures\bs\宣传素材` |
| 原版 PC 画面 | `C:\Users\PC\Pictures\bs` |

`_tools/prepare-assets.ps1` 只做复制、改名（中文名改英文 slug，避免 Pages 上 URL 编码 404）
和无透明需求截图的 JPEG 压缩。要重新生成素材，再跑一次即可（幂等）。

## 有意做出的三处改动

1. **补上标题菜单 END 行的底色**。`menu-box.png` 里 END 那一行的深色填充是缺失的
   （从原版截图抠菜单框时，把当时被选中光标覆盖的那块底色一起抠掉了，实机上会透出背景纹理）。
   网页版用同色纯黑补了一块底（`#menuPatch`）。
2. **CONTINUE 读取浏览器本地进度**。手表版没有存档功能，这是网页版新增的，
   页面上已注明。
3. **表冠改为滚轮 / 键盘 / 触摸**，页面上已注明。

## 已知差异

- 对话换行按源码常量 **14 字/行**（`SAY_W / SAY_FS = 296 / 21`）。
  但实机截图里同一句的第二行是 15 字，说明当时那版构建的换行宽度可能略有不同。
  若要完全对齐，改 `game.js` 里的 `SAY_W` 即可（一处常量）。

## 版权

《BLACK SOULS》手表版是**非官方的个人同人移植作品**，原作《BLACK SOULS》版权归
原作者 **寿司勇者トロ** 所有。本站与原作者、iQOO、vivo、蓝河 BlueOS 均无隶属或授权关系，
未使用上述任何一方的官方标识。个人非商业作品。

由 **击球手** 制作。
