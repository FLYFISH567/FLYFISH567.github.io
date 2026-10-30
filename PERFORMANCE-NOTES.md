# 页面导航性能优化记录

记录范围：本文的前后耗时与字节数为导航优化阶段的历史样本，之后的界面和灵感扩充会改变资源体积；当前累计改动及最新检查结果见 `DELIVERY-CHECKLIST.md`。不把这些历史数字当作最终版本的实时测量。

本次只修改本地源码和验证工具，没有提交、推送或部署。原有未提交的 `flyfish.js` 和 `flyfish.css` 主题切换修改完整保留。

## 已确认的问题

1. `navigation.js` 的 `enabled` 初值为 false，唯一的启用调用来自 `global-music.js` 的 `applyList()`。首页不会主动加载歌单，因此普通访客在未打开播放器、或歌单失败时会走整页刷新。修改前 Chromium 的七次导航均创建了新的 document。
2. 悬停预取与点击只共享前 250 毫秒。更慢的预取尚未完成时，点击会另发相同 HTML 请求。
3. 所有页面都加载看板、行情、旅行地图、工具箱等专用代码。首页还有 365 条句库以外的多项不使用模块。原始首页加载 32 个 JS/CSS 资源。
4. CSS 并非都能按文件名直接拆分：`briefing.css` 同时包含首页近况和警示页样式，`shelf.css` 包含共用生活导航样式，因此这两份仍保留全站加载，避免视觉变化。

## 修改

- `themes/flyfish/source/js/navigation.js`：导航自行初始化并幂等启用；去掉音乐前提。统一管理预取和点击的进行中请求；点击延长同一请求的超时，不再在 250 毫秒后重复请求。消费者可以独立取消；无消费者的前台请求会取消，迟到响应不能覆盖新页面；超时后可立即重试。
- 缓存仍限制为 6 页、2 分钟；自动预热仍最多两个栏目，省流量、2G 和隐藏页不预取，Giscus 授权参数不进入预取或页面缓存。保留每会话预取预算。没有预先下载整站。
- 保留前进后退、位置恢复和原生锚点；增加 BFCache 返回及原生离站时的滚动位置保存。失败保留当前内容、音乐与重试/直接打开入口。
- `global-music.js`：仅移除 `applyList()` 中对导航的启用调用，播放器加载和播放流程不变。
- `layout.ejs` 与新增 `page-assets.js`：按页引入看板/行情、工具箱、旅行地图、句库、书影音筛选与 404 游戏专用脚本，以及行情/工具箱专用 CSS。静态直达仍由正常 defer 标签加载。局部导航先补齐对应 CSS 和脚本依赖，再替换内容并发送已有 `flyfish:page` 生命周期事件。脚本在同一版本会话中只加载一次；失败可重试，当前页面不被清空。
- 未修改文章、页面内容数据、视觉 CSS、图片、播放器节点或全局鱼群节点；未引入新依赖或 SPA 框架。
- 新增资源加载回归；扩充导航、预取与音乐检查。`tools/serve-performance.cjs`、`tools/measure-navigation.js`、`tools/browser-navigation-check.js` 用于本地可复现浏览器验证，不进入生成站点。

## Chromium 对比实测

测试使用同一台机器的真实 Chromium、新建浏览器上下文、本地静态服务器，HTML 固定延迟 200ms，响应头 `Cache-Control: public, max-age=600`。性能测量保留浏览器 HTTP 缓存，用 CDP 屏蔽外部 HTTPS 服务，减少服务端波动；减少动效以测量内容替换而非动画时间。首页载入后等 500ms，再按固定顺序点击。以下为单次样本，不是公网 SLA 或性能提升百分比。

计时为触发链接点击至 URL 和页面内容标识更新完成，未单独归因 JS CPU 时间、布局或最终图片绘制。

| 操作（按顺序） | 修改前 ms | 修改后 ms | 修改前/后整页刷新 |
|---|---:|---:|---|
| 首页 → 文章（预热） | 135 | 78 | 是 / 否 |
| 文章 → 首页 | 152 | 20 | 是 / 否 |
| 首页 → 日常（预热） | 112 | 43 | 是 / 否 |
| 日常 → 首页（重复访问） | 144 | 21 | 是 / 否 |
| 首页 → 每日看板（首次） | 449 | 346 | 是 / 否 |
| 每日看板 → 工具箱（首次） | 400 | 304 | 是 / 否 |
| 工具箱 → 音乐（首次） | 437 | 239 | 是 / 否 |

| 首页资源指标 | 修改前 | 修改后 |
|---|---:|---:|
| JS/CSS 资源请求数 | 32 | 23 |
| JS 解码后字节数 | 218426 | 158679 |
| CSS 解码后字节数 | 175012 | 156274 |

这些是解码后的大小，不能当作线上 gzip/Brotli 传输量。Pages 静态 JS 的只读 HEAD 检查仍返回 `max-age=600` 和 ETag；站点现有 `ff_asset` 内容哈希参数保留。本次不改变托管端缓存或压缩策略。

原始测量：`output/playwright/performance-before.txt`、`performance-after.txt`。浏览器回归结果：`output/playwright/navigation-regression.txt`。

## 验证

- `npm run verify`：构建成功，27 组项目检查通过，包括音乐、小鱼、开屏、动画、灯箱、阅读进度、地图、工具箱、看板、行情、搜索、评论、导航等。
- 自动化新增/扩充：独立启用导航、启用幂等、下载和新标签排除、缓存过期和容量、慢预取请求复用、消费者取消、迟到响应、卡住的请求超时与重试、资源依赖顺序/并发去重/失败重试、BFCache 滚动恢复。
- Chromium 完整路径：主页 → 文章 → 带代码文章 → 主页；主页 → 日常 → 相册详情/灯箱/下一张 → 主页；主页 → 看板 → 工具箱 → 音乐，并往返旅行地图。
- 上述完整路径在手动刷新前只有一个主 document 请求。850ms 的预取与立即点击共用一个 HTML 请求；页面模块重复进入没有再次下载/执行相同版本脚本。
- 音频使用本地 60 秒静音 WAV 替代远端音源：真实 HTMLAudioElement 处于播放状态，跨页对象相同且 currentTime 持续增加。没有测试外部音乐服务授权或可用性。
- 手机 390px 菜单、地图、搜索、深色偏好、回首页的灵感入口、静态 URL 刷新通过。断网或专用脚本首次加载失败时当前页保留，重试成功。未出现未捕获的页面 JS 异常。
- 评论挂载和切页/主题行为由现有评论测试验证；浏览器回归不向外部服务发帖，也不替代真实 GitHub OAuth 或公共服务端验收。

## 复现

在仓库根目录：

```powershell
npm run verify
node tools/serve-performance.cjs
```

另开终端（需要已有 Node/npm；Playwright CLI 可通过 npx 使用）：

```powershell
npx --package @playwright/cli playwright-cli open http://127.0.0.1:4041/ --headed
npx --package @playwright/cli playwright-cli run-code --filename=tools/measure-navigation.js
npx --package @playwright/cli playwright-cli run-code --filename=tools/browser-navigation-check.js
npx --package @playwright/cli playwright-cli close
```

验证后停止本地服务器即可。只监听 127.0.0.1，音频夹具由验证服务器临时生成，不写入 public。修改前数据来自修改前代码构建；需要重新做 A/B 时应在独立工作区构建对应旧版本，保留相同服务器与浏览器条件。

也可以用 Chrome DevTools Network 勾选 Preserve log，分别测试缓存开启与关闭：先停用/不打开音乐，依次执行上述路径，确认主文档 Document 数量不增加、Fetch 同目标没有重复，并用 Performance 记录点击后脚本与布局时间。首次进专用页面应看到其模块加载，重复进入不再执行；断网后应保留旧页面并提供恢复入口。

## 限制及后续

- 实测平台为 Chromium；Firefox/Safari 未做真实设备回归。代码沿用现有 Fetch、AbortController、DOMParser、Promise 等现代浏览器能力，不支持这些能力时继续使用原生静态导航。
- 专用页面首次访问仍需下载其资源；网络差时可能等待，资源加载失败会保留当前页面。外部图片、新闻、行情、音乐与 Giscus 服务仍有独立延迟。
- 内存缓存可能保留两分钟内的静态页面。部署跨版本更新宜刷新页面；本次不引入复杂的服务工作线程缓存。
- 仍存在较大的公共主题 CSS 和内嵌看板/地图数据。后续可分别审计共用样式、静态 HTML 数据体积、图片策略，并单独测量脚本 CPU 与布局开销，避免本次同时改变视觉和内容。
