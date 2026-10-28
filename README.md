# FLYFISHING

清新蓝白的 Hexo 个人博客，保留学习文章、生活小记、相册、足迹和音乐。

每日看板位于 `/briefing/`：综合要闻、国内外 AI 动态、Codex 雷达、开发与安全阅读，支持本机未读、收藏、订阅与自选行情。来源在浏览器中按周期更新，失败保留带日期的备用快照。发布前可运行 `npm run news:update` 更新快照，详细边界见内容维护指南。

- 访问网站：https://flyfish567.github.io/
- 源码分支：`source`（本分支）
- 默认与源码分支：`source`；GitHub Actions 构建并发布 Pages，`main` 保留旧静态版本历史。
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

在 `source` 分支维护源码，检查通过后推送即可自动发布：

```powershell
git add .
git commit -m "Update blog content"
npm run clean
npm run verify
git push origin source
```

`.github/workflows/pages.yml` 在源码推送、每小时第 17 分钟（UTC），或手动触发时执行：安装锁定依赖 → 恢复线上最近成功快照 → 多源采集 → 刷新行情备用值 → 构建和完整检查 → Pages 发布 → 核对线上版本、资讯新鲜度与关键页面。任何构建/校验失败均不替换线上站点；某个新闻源失败时保留该源原日期的数据。默认分支必须为 `source`，Pages 发布方式必须为 GitHub Actions，`github-pages` 环境须允许 `source` 分支部署。

手动重跑可以在 [Actions 页面](https://github.com/FLYFISH567/FLYFISH567.github.io/actions/workflows/pages.yml) 点击 Run workflow，或在已登录 GitHub CLI 的本机运行 `npm run deploy`。此命令检查源码已提交并推送，然后触发相同流水线；不再向 `main` 复制网页。线上 `release.json` 记录源码提交、任务编号与本次采集时间。

GitHub 定时任务可能排队延迟，公共仓库连续 60 天无活动时定时任务可能自动停用；这不是分钟级实时服务。看板超过 3 小时未收到后台采集会提示更新延迟，失败记录在任务摘要与来源说明中。定期查看 Actions 状态，保持 GitHub 的失败工作流通知开启；若自动停用，在 Actions 页面重新启用。不要把缓存、依赖、备份或凭据上传到仓库。
