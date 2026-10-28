# 新闻定时兜底

此 Worker 只检查线上采集时间，必要时触发现有 GitHub Pages 工作流。它不代理新闻、不接收公众触发请求，也不持有博客源码写入权限。

- GitHub 主定时：UTC 每小时 13、43 分钟。
- Cloudflare 独立检查：UTC 每小时 23、53 分钟。
- `release.json` 的 `news_checked_at` 距检查时间不足 20 分钟：跳过。
- 数据过期、无法读取或时间异常：先查询 GitHub；已有排队或运行中的任务则跳过，否则触发 `news-pages.yml` 的 `source` 分支。
- GitHub API 检查失败时不盲目重复触发，错误进入 Cloudflare Workers 日志。失败不会替换网站数据。

这提供独立触发渠道，不保证新闻源永远可用或整点准时。GitHub 构建、Cloudflare 或上游同时故障时仍可能延迟；页面继续保留最近成功内容及原时间。

## 部署

使用官方 Wrangler 4.154.0。在仓库根目录执行：

```powershell
npx --yes wrangler@4.154.0 login --device --browser=false --use-keyring --scopes account:read user:read workers:write workers_tail:read
npx --yes wrangler@4.154.0 deploy --config infra/news-watchdog/wrangler.jsonc
npx --yes wrangler@4.154.0 secret put GITHUB_NEWS_TOKEN --config infra/news-watchdog/wrangler.jsonc
npx --yes wrangler@4.154.0 tail --config infra/news-watchdog/wrangler.jsonc --format json
```

`GITHUB_NEWS_TOKEN` 必须使用专用 GitHub fine-grained token，仅选择 `FLYFISH567.github.io` 仓库，仓库权限仅 Actions: Read and write（Metadata 默认只读）。令牌仅输入 Cloudflare 的加密 Secret 或官方命令提示，禁止写入文件、提交、日志或聊天。到期前需轮换令牌。

`workers_dev` 和预览 URL 关闭，无公开执行接口。首次 Cron 配置传播可能需要 15 分钟。部署成功不等于定时成功，验收必须查看一次真实 `Scheduled` 日志；若触发了 GitHub，还要核对该次任务及线上 `release.json` 的任务编号和采集时间。

本地回归：`node tools/verify-news-watchdog.cjs`（已纳入 `npm test`）。
