# 导航与 Giscus 性能审计（2026-10-30）

本轮只修改本地源码、测试及说明，没有提交、推送或部署。已有按钮、雪花、句库、自定义 Giscus 主题等未提交改动完整保留，不计入本轮性能修改。没有更改文章/页面内容、缓存容量、预取预算、看板种子数据或播放器；没有新增依赖、SPA 框架、Service Worker 或全站预下载。

## 证据与最小修改

1. 原有导航已可独立启用，本轮未重新处理早期的音乐启用耦合问题。真实浏览器完整导航旅程只有最初一次主 frame Document，请勿将 Giscus iframe Document 当成主页面刷新。
2. 原 `comments.js` 在 before-page/init 间反复 appendChild 移动含 iframe 的宿主，retarget 又改写 src。真实 Chromium 单独对同一父节点执行 appendChild，亦新增一次 widget Document，并丢失 frame 内测试状态。这证明 DOM 移动本身有重载成本；不能归因为组件堆积。
3. 评论改为一次创建、始终连接 body 的宿主，以当前占位块预留高度；按位置/尺寸同步显示，离开时仅隐藏。普通路由不移动宿主、不修改 src。采用官方 postMessage `setConfig({term,backLink,theme})`，保留原有逐页哈希 term、specific/strict 映射和自定义主题。相同配置去重。官方依据：https://github.com/giscus/giscus/blob/main/ADVANCED-USAGE.md 。
4. 后续文章仍重新等待 IntersectionObserver；长文章滚动前不激活，留言板和授权回跳立即激活。过期观察回调和客户端脚本回调有页面/代次校验。显式“重新加载评论”才重设 src，保留已有 session/auth 参数。校验 message 来源和 source；载入超时/错误保留恢复入口。iframe Document load 本身不视为 widget 成功响应。
5. 原导航先获取 HTML/DOMParser，再等待所有 CSS 和逐个 JS，最后替换正文；HTML prefetch 不准备资产。此次 CSS 与脚本并行，仅对精确匹配的看板脚本清单分为 `briefing-sources → briefing`、`market-data → markets` 两组；各组内等前项执行完成，组间并行。未知清单仍串行，未把所有 script 设为 async。市场模块只读旧新闻偏好作迁移，不依赖新闻模块执行；初始化前新闻模块不写该偏好。
6. 等待超过 250ms 显示轻量状态并设置 aria-busy，保留旧正文/播放器；新导航可取消旧资产等待，底层共享资源继续完成和缓存。HTML 后、资产后均验证最新导航代次与取消信号，防止迟到替换。失败仍保留重试和原始链接。
7. 缓存仍为 6 页/120 秒、最多两个初始栏目预热、会话投机预算 12。没有真实命中率/公网体积依据，未调整策略。

## 本轮文件

- 生产逻辑：`themes/flyfish/source/js/{comments,navigation,page-assets}.js`。
- 等待提示的局部样式：`themes/flyfish/source/css/flyfish.css`，仅新增 navigation-pending 规则。
- 回归：`tools/verify-{comments,navigation,page-assets,navigation-diagnostics}.cjs`、`tools/check.cjs`。
- 可复现浏览器工具：`tools/{measure-navigation-diagnostics,check-giscus-browser,check-navigation-races,trace-navigation}.js`、`tools/summarize-navigation-diagnostics.cjs`；现有 `browser-navigation-check.js` 再次执行。旧测量工具的 visibleMs 更名为 automationWallMs，避免误作页面耗时。
- 本文及 `PERFORMANCE-NOTES.md` 的旧计时说明；没有本轮新增的页面模板或内容数据修改。

## 默认关闭的本地诊断

只在 localhost、127.0.0.1、[::1] 可以 enable，线上返回 false；默认关闭，不读取 URL 开关、不保存 localStorage、不上报、不自动打印。内存最多 5000 条。可在本地 DevTools 执行：

```js
FlyfishNavigationDiagnostics.enable();
FlyfishNavigationDiagnostics.clear();
// 操作一次导航后
FlyfishNavigationDiagnostics.records();
FlyfishNavigationDiagnostics.disable();
```

记录导航 ID/目的 pathname、HTML 来源（memory/in-flight/new）、请求 ID、原发起来源（prefetch/click）、请求开始/headers/body、解析、每个 CSS/JS 开始/结束/复用/失败、DOM 替换、同步 flyfish:page 分发、导航结果及两次 rAF 机会。取消/失败记录仍保留原导航/请求归属；共享资源沿最初发起者记录，后续复用另记 navId。路径去掉 query/hash，不记录 Giscus session、term 或其他鉴权参数；main-fetch 与 giscus-iframe 分开。

两次 rAF 仅是绘制机会代理；同步初始化只包含事件同步处理，不含后续异步请求/图片/字体/动画。真正 Layout/Paint/脚本开销使用 Chrome trace，不能称为“全部绘制完成”。

## 独立冷/热样本：方法与限制

同一台机器真实 Chromium，本地生成站点，HTML 固定延迟 200ms；HTTP 缓存用 CDP 禁用，saveData 在测试上下文抑制投机预取，外部 HTTPS 屏蔽。每条路径 5 个独立新上下文，先测未访问目标 cold，再返回来源测同文档内存 warm。前后各 45 个上下文、90 次目标导航。保留实际动画，不修改生产数据。warm 是人为构造内存命中，不能推算真实访客命中率。TTFB 样本含本地固定延迟，不能代表 GitHub Pages TTFB。

耗时取页面内 performance.now()，从 navigation.start 到 committed navigation.end（正文已替换、同步初始化已执行），没有计入自动化 RPC。此指标不是所有资源可见或最终绘制完成时间。前后分批执行，没有随机交错 A/B；连未涉及资源改动的路径也普遍变化，存在浏览器/运行时波动，不能把整段差值全部归因于改动，更不能生成公网提升百分比。

数值为中位数 [最小–最大]，单位 ms，每格 n=5。

| 路径 | 冷：前 | 冷：后 | 内存热：前 | 内存热：后 |
|---|---:|---:|---:|---:|
| 1 首页 → 文章 | 378.3 [349.0–389.0] | 271.4 [257.1–273.9] | 44.9 [43.3–58.8] | 19.2 [17.0–20.8] |
| 2 文章 → 文章详情 | 328.9 [314.6–344.1] | 270.7 [255.4–278.0] | 26.4 [21.5–32.5] | 12.4 [10.4–15.5] |
| 3 文章详情 → 首页 | 325.1 [311.2–345.2] | 308.4 [299.5–348.6] | 17.6 [13.9–20.0] | 12.5 [8.8–14.5] |
| 4 首页 → 日常/相册 | 242.3 [234.2–246.1] | 224.8 [221.0–230.0] | 12.4 [11.2–17.1] | 7.8 [7.6–8.8] |
| 5 相册 → 相册详情 | 229.7 [225.7–240.6] | 224.1 [217.1–227.1] | 10.2 [9.0–15.7] | 6.8 [5.0–7.3] |
| 6 相册详情 → 首页 | 313.6 [286.0–372.1] | 280.9 [270.0–289.9] | 12.6 [9.6–20.6] | 9.1 [8.3–10.1] |
| 7 首页 → 每日看板 | 451.9 [375.7–521.7] | 337.8 [321.1–393.3] | 48.4 [33.0–61.1] | 23.7 [22.8–26.0] |
| 8 每日看板 → 工具箱 | 444.0 [359.8–485.8] | 313.6 [300.4–319.9] | 17.5 [14.2–23.2] | 7.6 [7.4–8.0] |
| 9 工具箱 → 音乐 | 245.0 [236.7–249.7] | 224.2 [221.8–230.7] | 28.4 [22.7–30.9] | 14.3 [12.9–14.8] |

各路径 cold 的 5 次样本共 5 个目标 HTML 请求，warm 为 0；该受控样本未出现重复目标 HTML 请求。悬停/点击共用请求另由回归测试验证，不将这个无预取样本用于推断预取效果。

首页 → 每日看板，cold 分段（n=5）：

| 分段 | 前 | 后 |
|---|---:|---:|
| HTML 等待（至开始解析） | 225.5 [209.2–236.1] | 219.1 [209.9–226.4] |
| DOMParser | 5.3 [4.2–7.5] | 2.7 [2.2–4.0] |
| 页面资产准备 | 35.2 [18.9–65.8] | 11.0 [6.0–17.6] |
| 正文 DOM 替换 | 1.9 [1.1–2.0] | 0.8 [0.7–1.2] |
| 同步页面初始化 | 132.3 [130.4–225.2] | 92.3 [77.6–138.2] |
| 第二次 rAF 机会代理 | 464.4 [388.3–552.9] | 346.8 [329.2–405.1] |

资产等待的局部样本支持缩短下载等待链；整段导航差异仍受上述混杂影响。另用受控延迟（CSS300ms、新闻源160ms、市场源40ms、两个消费者20ms）验证两根脚本在 CSS 未完成时已开始、消费者各自等生产者、市场消费者无需等新闻源，且页面真实按钮可操作。

原始页面内记录：`output/playwright/diagnostics-{before,after}.{txt,json}`，包含每次请求来源、分段、TTFB 与范围。单次首页到看板 trace：`output/playwright/trace-{before,after}.json`。trace 中 FunctionCall/Layout/Paint 的 inclusive 时长存在嵌套和交叠，不相加、不换算 CPU/绘制占比；单次 trace 不作为稳定收益结论。

## Giscus 真浏览器只读验证

| 同一路径序列 | 修改前 widget Document | 修改后 widget Document |
|---|---:|---:|
| 首篇滚动激活 | 1 | 1 |
| 后续两篇交替共 5 次 | 每次 3，共 15 | 0 |
| 返回首页 | 1 | 0 |
| 留言板立即加载 | 3 | 0 |
| 正常路径合计 | 20 | 1 |
| 主 frame Document（含初始进入） | 1 | 1 |

单独强制执行的同父 appendChild 探针前后各额外 1 个 widget Document，**不计入正常路径**。该探针会主动破坏浏览上下文，测试后重新建立 frame 内状态标记；普通导航保持同一 frame 标记和 iframe.src。

验证 official setConfig 的两个文章 term 和留言板 term 彼此不同，而且实际 Giscus discussion API 查询确实分别使用这三个 term；backLink 随页更新，主题切换使用当前自定义深/浅主题。未将所有文章合到一个讨论。首页宿主隐藏，390px 占位与宿主位置/宽度一致，无水平溢出；窄屏截图也检查过。另测试已有 iframe 后进入长文章，在屏外仍隐藏并等滚动才配置。

测试不登录、不修改 GitHub 数据、不发评论；frame 内测试状态连续性只能说明浏览上下文保留，不能替代真实账号 OAuth/会话过期全流程。已有登录参数保留有自动化覆盖，实际已登录跨页与授权回跳仍需用户在自己的会话复核。另有明确的上游限制：官方 Widget 的 AuthContext.origin 来自 iframe 首次 URL，setConfig 的 backLink 只更新讨论链接，不改变 OAuth redirect_uri；未登录访客在后续页面点击登录可能回到首次加载评论的页面。这里保留已登录 iframe 状态，不额外引入登录跳转恢复逻辑。依据： https://github.com/giscus/giscus/blob/main/components/Widget.tsx 、https://github.com/giscus/giscus/blob/main/lib/context.ts 。

结果：`output/playwright/giscus-{before,final}.txt`、`giscus-persistent-mobile.png`。测试只输出 pathname 与布尔检查，不输出私密参数。

## 回归结果

- `npm run verify`：构建成功，28 组项目检查通过（最终日志 `tmp/navigation-audit-verify-final.log`）。
- JSDOM：默认关闭/本地开启诊断和隐私、取消/最新导航、慢资产等待反馈、资产并发/依赖/共享取消/失败重试；评论持久宿主/独立 term/懒加载/迟到回调/主题/安全消息/显式重试保留鉴权参数/iframe 错误文档超时和有效握手。
- Chromium：九条原始路径、内存热回访、首页重入、浏览器前进后退与滚动恢复、850ms 预取与点击同请求；真正重叠的慢 HTML 与资产取消、迟到响应、离线/首次资产失败与重试、直接 URL 刷新。
- 音乐：本地 60 秒静音 WAV 实际播放，跨页 audio 对象相同、未暂停且 currentTime 持续增长；不据此推断外部音乐服务稳定性。
- 相册灯箱和下一张、文章目录/进度/代码复制、看板/市场、工具箱、旅行地图、搜索、灵感、390px 菜单/主题/本地偏好，均通过；无未捕获页面 JS 异常。现有小鱼/开屏/动画对应自动化也通过，未关闭这些功能。

## 复现与后续

1. `npm run verify`，再单独运行 `node tools/serve-performance.cjs`（127.0.0.1:4041，仅本地200ms延迟夹具）。
2. `npx --package @playwright/cli playwright-cli open http://127.0.0.1:4041 --headed`。
3. `npx --package @playwright/cli playwright-cli run-code --filename=tools/measure-navigation-diagnostics.js`；保存结果后用 `node tools/summarize-navigation-diagnostics.cjs 输出.txt` 汇总。运行 check-navigation-races.js、browser-navigation-check.js；Giscus 只读核验使用 check-giscus-browser.js，需能访问 giscus.app，尚未发布的自定义 CSS 在测试中映射到本地构建文件。
4. trace-navigation.js 返回单次 traceEvents，可保存为 Chrome Performance 能导入的 JSON。手动录制时开启 Preserve log，按 Frame/Type 分开 Fetch 与 widget iframe Document；冷样本用新上下文和 Disable cache，热样本明确区分 HTTP 热与页面内存热；每路径至少五次。不要在导出 HAR 中泄露登录参数。
5. 本轮未做 Firefox/Safari、屏幕阅读器、实际登录/过期 OAuth、真实公网慢网及真实 HTTP 热缓存分布测试；移动终端测试为 Chromium 390px 模拟。持久宿主为绝对定位，需要在未来新增影响文档定位的布局/弹层时复核。ResizeObserver 不可用时仍有滚动/resize/动画结束同步，但该回退分支未做旧浏览器实测。
6. 真实缓存命中率、公共网络体积/压缩、长期 TTFB 与 CPU/Paint 占比仍未获得足够证据，留作后续。暂不调大缓存、不精简种子、不更换框架。
