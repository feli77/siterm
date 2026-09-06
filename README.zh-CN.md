# siterm

[English](./README.md) | [简体中文](./README.zh-CN.md)

一个以连续、终端原生界面呈现的静态个人博客模板。访客既可以输入命令，也可以直接激活 Transcript 中的相同命令；生产构建仍然只包含普通静态文件。

[在线演示](https://feli77.github.io/siterm/)

## 功能

- 可执行的终端命令与常见 shell 别名
- 文章浏览、标签过滤、文章阅读和基于 hash 的深链接
- 以 `amber` 为默认值的 `amber`、`green` 和 `mono` 三套 Terminal profile，并在本地保存偏好
- 命令历史、方向键导航、Tab 补全和拼写建议
- 响应式桌面/紧凑布局，以及支持键盘操作的命令目标
- 对留言进行安全规范化处理的浏览器本地 Guestbook
- 自动执行 Vitest、Playwright、生产构建和 GitHub Pages 部署检查

## 环境要求

推荐使用 Node.js 24，CI 也使用该版本。当前 Vite 工具链支持 Node.js `^20.19.0` 或 `>=22.12.0`。

## 安装

```bash
git clone https://github.com/feli77/siterm.git
cd siterm
npm install
```

## 本地开发

```bash
npm run dev
```

常用检查：

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

首次运行浏览器测试前，需要安装 Chromium：

```bash
npx playwright install chromium
```

## 自定义

大部分个人化配置集中在两个文件中：

- `src/config/site.ts`：姓名、简介、所在地、时区、联系方式、兴趣和默认 Terminal profile。
- `src/content/posts.ts`：文章元数据和按顺序排列的正文内容块。

你还可以替换 `public/favicon.svg`。命令解析器位于 `src/lib/commands.ts`，完整 Terminal session 位于 `src/App.tsx`，视觉系统位于 `src/styles.css`。

支持的 Terminal profile 是 `amber`、`green` 和 `mono`，默认值为 `amber`。

## 命令

| 命令 | 别名 | 作用 |
| --- | --- | --- |
| `help` | `man` | 显示命令指南 |
| `about` | `neofetch` | 显示已配置的站点所有者资料 |
| `posts [tag]` | `ls [tag]` | 浏览全部文章或按标签筛选 |
| `open <编号或 slug>` | `read`、`cat` | 打开文章 |
| `tags` | — | 列出可用标签 |
| `theme [名称]` | `theme --list` | 列出或切换 Terminal profile |
| `guestbook` | — | 查看本地 Guestbook |
| `sign "留言"` | — | 在当前浏览器中留下留言 |
| `contact` | `github` | 显示已配置的联系方式 |
| `history` | — | 显示当前 session 的命令历史 |
| `home` | — | 追加欢迎内容并返回根路由 |
| `clear` | — | 清空可见 Transcript，但保留历史记录 |
| `date` | — | 显示浏览器本地日期和时间 |
| `whoami` | — | 显示当前访客身份 |
| `pwd` | — | 显示趣味性的当前路径 |
| `echo <文本>` | — | 将文本输出到 Transcript |
| `sudo` | — | 运行权限被拒绝的彩蛋 |

## 静态 Guestbook 的行为

纯静态站点无法自行保存所有访客共享的数据。默认的 `sign` 命令把留言写入访客的 `localStorage`，因此这些留言只会在同一浏览器中显示。如果存储不可用，新留言仍会在当前 session 中保持可见。

公开共享的 Guestbook 需要 GitHub Discussions、Giscus、Supabase 或其他托管后端。这不是只替换 `src/lib/guestbook.ts` 就能完成的改动：异步集成还需要调整 `src/App.tsx` 中的状态与命令流程。

## 部署到 GitHub Pages

仓库包含 `.github/workflows/deploy.yml`。在 **Settings → Pages → Build and deployment** 中把 **Source** 设置为 **GitHub Actions**。此后每次推送到 `main` 都会安装依赖、运行单元测试和浏览器测试、构建 `dist/`，然后部署到 Pages。

Vite 使用相对资源路径，因此构建结果既能部署到用户站点，也能部署到仓库子路径。文章导航使用 URL hash，不需要服务器重写规则。
