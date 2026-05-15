# 毛主席语录抽卡

一个纯前端静态网页项目，用抽卡的方式浏览毛泽东语录，并提供多语言界面与语录释义。

## 功能

- 单抽
- 多语言界面切换
- 语录原文、来源与释义展示
- 最近抽取历史记录
- 针对移动端优化的响应式布局
- 纯静态资源，无后端依赖

## 支持语言

- 简体中文
- 繁體中文
- English
- 日本語
- 한국어
- Français
- Deutsch

## 本地运行

这是一个原生 HTML + CSS + JavaScript 项目，不需要 npm，也不需要任何构建步骤，直接部署源目录中的静态文件即可。

开发时可直接使用任意静态服务器运行源目录：

```bash
python -m http.server 8000
```

启动后访问：

```text
http://localhost:8000
```

生产发布时，将仓库根目录中的这些内容直接作为站点文件发布即可：

- `index.html`
- `bg.jpg`
- `favicon.svg`
- `js/`

说明：

- 页面入口就是根目录下的 `index.html`。
- JavaScript 采用浏览器原生 ES Modules，语言资源仍按需动态加载。
- 不需要构建产物目录，也不需要在部署平台执行 `npm install` 或 `npm run build`。

## 部署到 GitHub

1. 将项目推送到 GitHub 仓库。
2. 打开仓库 Settings。
3. 进入 Pages。
4. 在 Build and deployment 中将 Source 设置为 GitHub Actions。
5. 保持默认分支为 `main`，推送代码后工作流会直接整理静态文件并发布。
6. 工作流不会执行 npm 安装或构建。
7. 也可以在仓库 Actions 页面手动触发 `Deploy GitHub Pages`。

## 部署到 Cloudflare Pages

这是一个纯静态站点，Cloudflare Pages 中不要再配置 Node 构建。

仓库根目录已包含 `wrangler.jsonc`，即使后台暂时还在执行 `npx wrangler deploy`，Wrangler 也会只上传 `dist/`，不会再把仓库根目录和 `node_modules/` 当作静态资源目录。

推荐设置：

- Framework preset: `None`
- Build command: 留空
- Build output directory: `dist`

如果你之前已经在 Cloudflare 项目里配过 `npm install`、`npm run build`、`wrangler deploy` 或其他构建命令，建议先清空这些旧设置，再重新触发部署。

说明：

- 现在仓库内的 Cloudflare 部署源是 `dist/`。
- 如果你只是想让部署恢复成功，保留后台的 `npx wrangler deploy` 也可以。
- 如果你连构建日志里的 npm / npx 都不想看到，就必须在 Cloudflare 后台把自定义 Deploy command 删掉；这个动作不能通过仓库文件覆盖。

## 项目结构

```text
.
├─ .github
│  └─ workflows
│     └─ deploy-pages.yml
├─ favicon.svg
├─ index.html
├─ bg.jpg
└─ js
   ├─ app.js
   ├─ data
   │  ├─ quotes.js
   │  └─ quotes
   │     └─ locales
   └─ i18n
      ├─ index.js
      └─ locales
```

## 技术栈

- HTML5
- CSS3
- 原生 JavaScript ES Modules
- GitHub Pages 静态发布

## 说明

- 语录数据与界面文案均保存在仓库内。
- 默认会根据浏览器语言或 `?lang=` 参数自动选择界面语言，也会记住用户手动切换的语言。
- 界面文案与语录数据按语言拆分成独立模块，用户进入页面后只会动态加载当前语言对应的资源文件。
- 项目适合直接部署到 GitHub Pages、Cloudflare Pages、Netlify、Vercel 等静态托管平台。