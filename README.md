# 毛主席语录抽卡

一个纯前端静态网页项目，用抽卡的方式浏览毛泽东语录，并提供多语言界面与语录释义。

## 功能

- 单抽与连抽五张
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

推荐使用本地静态服务器运行：

```bash
python -m http.server 8000
```

启动后访问：

```text
http://localhost:8000
```

## 部署到 GitHub

1. 将项目推送到 GitHub 仓库。
2. 打开仓库 Settings。
3. 进入 Pages。
4. 在 Build and deployment 中选择 Deploy from a branch。
5. 选择 `main` 分支和 `/ (root)` 目录。
6. 保存后等待 GitHub Pages 发布完成。

## 项目结构

```text
.
├─ index.html
├─ bg.png
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

## 说明

- 语录数据与界面文案均保存在仓库内。
- 默认会根据浏览器语言自动选择界面语言，也会记住用户手动切换的语言。
- 项目适合直接部署到 GitHub Pages、Netlify、Vercel 等静态托管平台。