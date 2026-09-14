---
title: "Browser Control API"
sidebarTitle: "浏览器控制 API"
---

# Browser Control API：给本机集成用的浏览器遥控口

OpenClaw 的浏览器工具平时由 Agent 自动使用。Browser Control API 是更底层的本地接口，适合调试、脚本集成和高级自动化。

普通用户先看 [浏览器工具](/tutorials/tools/browser)。这一页是给“我要自己写脚本控制浏览器”的人看的。

---

## 它能做什么？

Gateway 会在本机提供一组浏览器控制接口，常见能力包括：

- 启动或停止浏览器。
- 打开、聚焦、关闭标签页。
- 获取页面快照和截图。
- 导航到 URL。
- 点击、输入、等待。
- 查看控制台、网络请求、错误。
- 管理 Cookie、Local Storage、权限和地理位置。

你可以把它理解成：Agent 平时用的是遥控器，这个 API 是遥控器背后的按键线路。

---

## 安全边界

这个接口应该只给本机或可信内网使用。

如果 Gateway 配了共享 token 或密码，浏览器控制接口也需要认证：

```http
Authorization: Bearer <gateway token>
```

或使用 Gateway 密码对应的认证方式。

::: warning
不要把浏览器控制接口直接暴露到公网。它能操作浏览器，也可能访问登录状态里的网页。
:::

---

## 标签页身份和路由

后续操作优先沿用 tabs/open 返回的 `suggestedTargetId` 或 `tabId`（如 `t1`），并保存 host/node 和 profile；handle 不是跨所有浏览器通用的 ID。Control UI 的 `browser.request` 可传 `target: "host"`，或 `target: "node"` 配 `node: "<node-id>"`，profile 放在 `query.profile`。显式路由不会回退另一宿主，也不会授予额外权限。

列表中 URL 校验失败时，标签身份和标题仍可保留，但 `url` 为空：`urlUnavailableReason: "navigation_blocked"` 表示策略拒绝，`navigation_check_failed` 表示暂时无法校验（如 DNS 失败）。后者可刷新重查，不能只因空 URL 就判断策略拒绝；后续读取/动作仍要各自检查权限。

selector 快照没有匹配时立即返回空结果，不等待元素出现。先用 `openclaw browser wait "<selector>"` 等待，再取快照。这个行为不改变整页或 frame 传输失败的超时处理。

## Playwright 能力范围

高级点击、输入、AI 快照、元素截图和 PDF 导出通常需要 Playwright。

如果你看到类似“Playwright 不可用”的错误，先更新或重新安装 OpenClaw。Docker 环境还要确认 Chromium 浏览器二进制已安装并持久化。

---

## 什么时候用它？

适合：

- 调试浏览器工具为什么点不到元素。
- 写内部脚本控制 OpenClaw 浏览器。
- 连接远程 Chrome CDP。
- 需要截图、PDF、请求日志的自动化流程。

不适合：

- 普通网页搜索。
- 只想让 Agent 打开页面看一眼。
- 没有认证保护的远程暴露。

---

## 继续阅读

- [浏览器工具](/tutorials/tools/browser)
- [WSL2 远程 Chrome 排查](/tutorials/tools/browser-wsl2-windows-remote-cdp-troubleshooting)
- [Gateway 认证](/tutorials/gateway/authentication)
