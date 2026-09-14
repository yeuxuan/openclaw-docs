---
title: "浏览器工具"
sidebarTitle: "浏览器工具"
description: "按托管浏览器、Chrome 登录态和远程节点选择 OpenClaw browser profile，使用快照、请求日志和页面文本排查自动化。"
---

# 浏览器工具（Browser Tool）

浏览器工具适合需要真实页面、登录状态、点击或填写表单的任务。先选对浏览器，再操作页面；Web 搜索和正文抓取不一定需要启动它。

## 先跑通托管浏览器

```bash
openclaw browser --browser-profile openclaw doctor
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://example.com
openclaw browser --browser-profile openclaw snapshot
```

`snapshot` 返回页面结构和元素引用，不是截图文件；`screenshot` 才生成图像。页面导航、重连或内容变化后，重新取快照，不要沿用失效 ref。

## 三种 profile

| Profile | 用途 | 前提 |
|---------|------|------|
| `openclaw` | 独立托管浏览器，默认 Agent 操作入口 | 不需要扩展，与日常 Profile 分开 |
| `user` | 通过 Chrome DevTools MCP 接入真实登录态 | 第一次附加可能弹远程调试确认，需要人在电脑前 |
| `chrome` | 通过 OpenClaw 扩展接入真实登录态 | 安装并配对[Chrome 扩展](/tutorials/tools/chrome-extension) |

不要把登录态接入当成隔离环境；页面上可见的敏感内容也可能被 Agent 读取。

## 正确的配置位置

浏览器配置位于顶层 `browser`，不是 `tools.browser`：

```json5
{
  browser: {
    enabled: true,
    defaultProfile: "openclaw",
    profiles: {
      openclaw: { cdpPort: 18800 },
      chrome: { driver: "extension" },
      remote: { cdpUrl: "https://browser.example.com" },
    },
  },
  tools: {
    profile: "coding",
    alsoAllow: ["browser"],
  },
}
```

`coding` 工具 profile 包含网页搜索/抓取，但不包含完整 browser，需通过 `alsoAllow` 加入；单独增加子 Agent allowlist 不能绕过前面的 profile 过滤。修改浏览器配置后重启 Gateway。

浏览器由 bundled plugin 提供。若 CLI、`browser.request` 和工具同时消失，检查是否禁用了 `plugins.entries.browser`。限制性 `plugins.allow` 应保留 `browser`，或通过显式顶层 `browser` 配置激活；只设置工具 allow 并不能代替插件启用。

## 远程 Gateway 与浏览器节点

Chrome 在另一台机器上时，可在那台机器运行配对的浏览器节点，Gateway 自动路由过去。不使用旧的 `remote: true` / `remoteUrl` 示例；普通远程 CDP 使用 profile 的 `cdpUrl`，节点则按节点连接和浏览器路由配置。

自动回退本机只允许在选中的节点尚未处理请求之前。一旦动作已到达节点，后续快照和设置仍留在同一节点，不会悄悄改用另一台浏览器。保留每次结果中的 host/node、profile 和 tab handle，完整路由见 [Browser Control API](/tutorials/tools/browser-control)。

Control UI Browser 面板跟随当前会话最近一次成功的浏览器目标；打开预览卡会选中那张卡的浏览器和标签页，不会修改 `browser.defaultProfile` 或其他会话的选择。没有已知路由的结果、沙箱浏览器结果不会冒充可点击的宿主预览。

## 快照、等待和诊断

- 元素未出现时先用 `openclaw browser wait "<selector>"`；selector 快照是当时的观察，无匹配会立即返回空结果，不会自动等到超时。
- `snapshot` 的 `query` 要求一行包含所有空白分隔词，大小写不敏感；它只搜索本次快照范围，原快照截断时应先扩大范围。
- `requests` 与 `errors` 读取已收集的请求/页面错误日志，默认取最近 50 项；`clear: true` 清空整个收集日志，包括被过滤或超限省略的条目。
- `text` 取第一个 selector 匹配，未指定时依次寻找 `article`、`main`、`body`；`maxChars` 为正数，默认和上限均为 40000，仍可能被输出预算进一步截断。
- `emulate` 按 device、colorScheme、timezoneId、locale 顺序应用并返回 `applied`；不是原子操作，中途失败可能已有部分生效。

这些是 Agent 的 browser 参数示例，不是 shell 命令：

```json
{ "action": "text", "profile": "openclaw", "targetId": "t1", "selector": "article", "maxChars": 6000 }
```

```json
{ "action": "requests", "profile": "openclaw", "targetId": "t1", "filter": "fetch", "limit": 20 }
```

`t1` 应替换为当前 tabs/open 结果的真实 handle。上述 requests/errors/text/emulate 需要 Playwright-backed profile，支持本机或节点，不适用于 Chrome MCP existing-session profile；后者用 snapshot 观察页面。PDF、下载拦截与 responsebody 也需要 Playwright 路径。

## 安全与故障边界

- 私网访问应按需要配置精确 `allowedHostnames`，不要默认放宽 SSRF 策略，也不要把主机例外当作任意通配支持。
- 标签页 URL 为空时，先区分导航策略拒绝与 DNS/地址校验暂时失败；能显示标题不代表已授权读取内容。
- 登录、2FA、验证码、摄像头和麦克风授权需要用户处理，不应伪造已完成。
- Playwright/浏览器二进制缺失时，先看 doctor 诊断，再按[Linux 浏览器排障](/tutorials/tools/browser-linux-troubleshooting)或[Docker 安装](/tutorials/installation/docker)处理，避免安装与当前 OpenClaw 不匹配的任意依赖。

继续阅读：[Browser CLI](/tutorials/cli/browser)、[Chrome 扩展](/tutorials/tools/chrome-extension)、[Browser Control API](/tutorials/tools/browser-control)。

上游来源：[Browser](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/tools/browser.md)。
