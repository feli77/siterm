# siterm

一个以终端作为完整交互界面的静态个人博客模板。访客既可以输入命令，也可以点击界面中的命令与文章；所有内容最终构建为普通静态文件。

## 功能

- 可执行的终端命令与接近 shell 的别名
- 文章列表、标签过滤、文章阅读和 hash 深链接
- 四套配色与本地偏好记忆
- 命令历史、方向键导航、Tab 补全和拼写建议
- 响应式桌面/移动端布局与键盘可访问性
- 浏览器本地留言簿
- GitHub Pages 自动部署工作流

## 本地运行

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

常用检查：

```bash
npm test
npm run test:e2e
npm run build
npm run preview
```

首次运行浏览器测试前，安装 Chromium：`npx playwright install chromium`。

## 自定义

最常修改的文件只有两个：

- `src/config/site.ts`：姓名、简介、所在地、邮箱、GitHub 地址和默认主题。
- `src/content/posts.ts`：文章元数据和正文区块。

可用主题是 `green`、`amber`、`ice` 和 `rose`，默认主题是 `amber`。命令行为集中在 `src/lib/commands.ts`，展示组件在 `src/App.tsx`，视觉样式在 `src/styles.css`。

## 命令

| 命令 | 作用 |
| --- | --- |
| `help` | 显示命令手册 |
| `about` | 查看个人简介 |
| `posts [tag]` | 浏览全部文章或按标签筛选 |
| `open <编号或 slug>` | 打开文章 |
| `tags` | 浏览标签 |
| `theme <名称>` | 切换配色 |
| `guestbook` | 查看留言簿 |
| `sign "留言"` | 在当前浏览器中留下留言 |
| `contact` | 查看联系方式 |
| `history` | 查看本次会话的命令历史 |
| `clear` | 清空终端输出 |
| `home` | 回到欢迎页 |

`ls`、`cat`、`man`、`pwd` 和 `neofetch` 也可以使用。

## 关于静态留言簿

纯静态站点不能自行保存所有访客共享的数据。模板默认把 `sign` 留言写入访客自己的 `localStorage`，所以它只在同一浏览器中可见。若需要公开共享留言，可以保持 UI 不变，将 `src/lib/guestbook.ts` 替换为 Giscus、GitHub Discussions、Supabase 或其他服务适配器。

## 部署到 GitHub Pages

仓库包含 `.github/workflows/deploy.yml`。在 GitHub 仓库的 **Settings → Pages → Build and deployment** 中把 Source 设为 **GitHub Actions**，随后推送到 `main` 即会运行测试、构建并部署 `dist/`。

Vite 的资源路径使用相对地址，因此用户站点和项目子路径均可部署；文章导航使用 hash，不依赖服务器重写规则。
