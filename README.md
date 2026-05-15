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

这是一个原生 HTML + CSS + JavaScript 项目，直接部署为静态站点即可。

开发时可直接使用任意静态服务器运行源目录：

```bash
python -m http.server 8000
```

启动后访问：

```text
http://localhost:8000
```

生产发布建议走最小构建流程：

```bash
npm install
npm run build
npm run preview
```

预览服务默认监听：

```text
http://localhost:4173
```

说明：

- `npm run build` 会生成 `dist/`，并对 HTML 与所有 JavaScript 模块做 minify。
- `dist/` 中会额外生成 `.gz` 与 `.br` 预压缩文件。
- `npm run preview` 会按浏览器 `Accept-Encoding` 自动返回 Brotli 或 Gzip 压缩内容。
- 语言资源仍然保持按需动态加载，不会在首屏一次性下载全部语言包。

## 部署到 GitHub

1. 将项目推送到 GitHub 仓库。
2. 打开仓库 Settings。
3. 进入 Pages。
4. 在 Build and deployment 中将 Source 设置为 GitHub Actions。
5. 保持默认分支为 `main`，推送代码后工作流会自动执行 `npm ci` 和 `npm run build`。
6. 工作流会将 `dist/` 作为 Pages artifact 自动发布。
7. 也可以在仓库 Actions 页面手动触发 `Deploy GitHub Pages`。

## 项目结构

```text
.
├─ favicon.svg
├─ index.html
├─ bg.jpg
├─ scripts
│  ├─ build.mjs
│  └─ preview.mjs
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
- Node.js 构建脚本
- esbuild（用于 minify）

## 说明

- 语录数据与界面文案均保存在仓库内。
- 默认会根据浏览器语言或 `?lang=` 参数自动选择界面语言，也会记住用户手动切换的语言。
- 界面文案与语录数据按语言拆分成独立模块，用户进入页面后只会动态加载当前语言对应的资源文件。
- `dist/` 是发布产物目录，包含 minify 后的模块和对应的 `.gz`、`.br` 压缩文件。
- 项目适合直接部署到 GitHub Pages、Netlify、Vercel 等静态托管平台。