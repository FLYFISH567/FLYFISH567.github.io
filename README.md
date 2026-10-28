# FLYFISHING

清新蓝白的 Hexo 个人博客，保留学习文章、生活小记、相册、足迹和音乐。

每日看板位于 `/briefing/`：综合要闻、国内外 AI 动态、Codex 雷达、开发与安全阅读，支持本机未读、收藏、订阅与自选行情。来源在浏览器中按周期更新，失败保留带日期的备用快照。发布前可运行 `npm run news:update` 更新快照，详细边界见内容维护指南。

- 访问网站：https://flyfish567.github.io/
- 源码分支：`source`（本分支）
- 发布分支：`main`（生成的网页）
- 内容维护说明：[CONTENT_GUIDE.md](CONTENT_GUIDE.md)

## 本地开发

需要 Node.js 22 或更高版本。

```powershell
git clone --branch source --single-branch https://github.com/FLYFISH567/FLYFISH567.github.io.git
cd FLYFISH567.github.io
npm ci
npm run server
```

默认在 http://localhost:4000/ 预览。正式生成和检查：

```powershell
npm run clean
npm run verify
```

## 需要保留的内容

- `source/_posts/`：47 篇文章与小记，原有短文和未写完的笔记均保留。
- `source/_data/`：相册、说说、追番、个人资料、独立足迹与心愿、最近在做。
- `_config.flyfish.yml`：音乐歌单与公开 API、图片地址、个人链接、显示配置。
- `themes/flyfish/`：新博客的模板、样式、脚本、地图数据和固定文章日期。
- `tools/fixtures/content-baseline.json`：原始内容的校验清单，测试不依赖本地备份。

旧安知鱼 / Landscape 主题及其依赖已移除；旧配置只保存在本地 `.refactor-backup/2026-10-24-cleanup/`，不上传。文章里引用的历史图片或视频地址不会随主题清理而修改。

## 更新与发布

先在 `source` 分支保存源码，再生成并发布静态网页：

```powershell
git add .
git commit -m "Update blog content"
git push origin source
npm run clean
npm run verify
npm run deploy
```

`npm run deploy` 会拉取当前远程历史，在独立工作树中把 `public/` 发布到 `_config.yml` 指定的 `main` 分支，需要本机 GitHub SSH 权限。使用普通追加提交，不强制推送；源码未提交或尚未同步到 GitHub 时会停止。源码始终留在 `source` 分支。不要把本地缓存、`node_modules`、备份、编辑器配置或凭据上传到仓库。
