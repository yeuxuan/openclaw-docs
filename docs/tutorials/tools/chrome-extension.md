---
title: "Chrome 扩展"
sidebarTitle: "Chrome 扩展"
description: "安装 OpenClaw 官方 Chrome 扩展，自动配对已有登录态标签页，区分本地、浏览器节点和远程 Gateway 连接。"
---

# Chrome 扩展：让 Agent 操作已登录的标签页

扩展通过 `chrome.debugger` 自动化当前 Chrome Profile 中获准访问的标签页。它不是聊天侧栏：弹窗只有连接状态、访问模式、当前标签页的暂停/允许操作与设置入口，没有聊天输入框或 Agent 会话管理面板。

## 本地安装

先启动一次 Chrome，确保用户数据目录已生成。macOS/Linux 可以自动注册 native host；Windows 当前使用手动配对。

```bash
openclaw browser extension install
```

保持命令运行。看到 native host 预注册成功后，安装[官方 Chrome Web Store 扩展](https://chromewebstore.google.com/detail/openclaw/kcdjddhmeafeomebliikmbpblkmkfoig)。首次正常配对无需重启 Chrome，也不需要提前打开弹窗。

需要开发版时，运行同一命令，然后在 `chrome://extensions` 打开开发者模式，加载命令打印的路径。不要猜扩展目录，也不要仅凭扩展名称判断是否为官方包。

```bash
openclaw browser extension status
openclaw browser extension path
openclaw config set browser.defaultProfile chrome
```

内置 `chrome` profile 使用 `driver: "extension"`。首次自动配对默认 **All tabs**；已存在的有效配对不会被覆盖，旧配对保留原访问模式。

## 访问范围

- **All tabs**：当前 Profile 中符合条件的普通标签页。
- **Selected tabs**：以 OpenClaw 标签组为访问边界，移入允许、移出撤销。
- **Pause/Allow**：单独暂停或恢复当前标签页。

无痕页面、`chrome://`、`chrome-extension://` 等内部页面不开放；`file://` 还需要 Chrome 的“允许访问文件网址”。Agent 新建标签初始化时可暂用 `about:blank`，但这不授权任意已有空白页；重连、导航或访问模式变化会结束临时许可。

::: warning 已登录的页面可能有敏感内容
扩展申请 `debugger`、`tabs`、`tabGroups`、`storage`、`alarms`、`nativeMessaging`，不申请 `activeTab` 或 `sidePanel`。能操作已登录标签页也意味着能读取其中获准页面的内容；不要把它理解为敏感数据自动不可见。高风险操作仍需正常授权。
:::

## 三种连接方式

| 场景 | 连接路径 | 条件 |
|------|----------|------|
| 本地 Gateway | 精确 `/browser/extension` 路由 | Gateway 运行；首次认证连接自动唤醒浏览器服务 |
| 浏览器节点 | Chrome 连同机 relay，节点连远程 Gateway | 浏览器节点在 Chrome 所在机器运行 |
| 扩展直连远程 Gateway | 手动配对到远程 `/browser/extension` | 远程拥有自己的 relay key，不能从本机自动取回 |

远程配对在远程 OpenClaw 环境生成：

```bash
openclaw browser extension pair --gateway-url wss://gateway.example.com
```

把完整配对串粘到扩展 **Settings → Advanced manual pairing**。非 loopback URL 必须用 `wss://`，代理必须保留精确的 `/browser/extension` WebSocket 路径，不能随意加路径前缀。不要使用旧的 `tools.browser.extension.gatewayUrl` 配置或 `/gateway` 地址示例。

## 不运行本地 Gateway 的独立 relay

`openclaw browser extension pair` 不带 `--gateway-url` 时生成本机 `/extension` relay 配对。具备新版 native host 和 relay 唤醒代码的扩展，可在 macOS/Linux 重连时启动独立 relay，不必额外运行本地 Gateway。

这条路径有严格条件：

- 打开 **Use automatic local setup**。
- 使用精确 `ws://127.0.0.1:<port>/extension`；`localhost` 或 IPv6 别名不会触发自动唤醒。
- 端口必须属于当前 extension-driver profile；已删除 profile 或过期端口会被拒绝，不自动切换其他 profile。
- 自动唤醒最多每分钟一次。不能假定 Store v2.2.0 已包含新唤醒代码；源码验证可用命令安装的 unpacked 开发副本。
- 独立 relay 默认只接受 v2 认证，配置读取失败不会降级到旧认证。

relay 在扩展或 CDP 客户端仍连接时保活；二者都断开后空闲十分钟退出，每三十秒检查一次。仅关闭 Chrome 不一定停止仍被 CDP 客户端使用的 relay。支持同一 owner 协议的 Gateway 可接入已有 relay，停止 Gateway 不会杀掉独立 relay 或其他客户端。

## 多客户端与重连

OpenClaw 和外部 CDP 客户端可以共用 relay，但仍操作同一批标签页，不是隔离浏览器。一个客户端导航后，另一个客户端的旧 snapshot ref 可能失效。

断线或 debugger 重新附加后应重新获取快照；如果客户端找不到目标，重连该客户端。原生 Fetch 状态不确定时，不会把失败操作盲目重试到新连接。debugger detach 失败时，先恢复 Chrome 访问，再尝试显式附加、Disconnect 或 Chrome 的 debugger Cancel，不要把“窗口没了”当成已清理完成。

```bash
openclaw browser extension cdp --json
```

该命令输出非秘密 endpoint 元数据，不输出 relay key。完整配对串仍应当作密码保护，不要放到日志或截图里。

## 常见故障与更新

```bash
openclaw browser doctor --browser-profile chrome
openclaw browser extension status --json
openclaw doctor
```

- **No native host was pre-registered**：先看前面的路径、所有者和权限错误；并非一定是 Chrome 未安装。
- **owned 但不能启动**：status 只是文件就绪快照，不会实际运行验证。升级后运行时路径失效，可重跑 `extension install` 修复属于 OpenClaw 的注册。
- **Relay unavailable**：`/browser/extension` 检查 Gateway；直连 `/extension` 检查 native host、新版扩展、自动设置和端口归属，再考虑一分钟节流。
- 升级不仅要更新 OpenClaw，也要更新扩展；开发副本重跑安装命令后，在 `chrome://extensions` 重新加载。

关闭自动设置会保留有效配对，但不再自动 bootstrap/唤醒。**Disconnect and disable automatic setup** 会撤销配对并退出。需要移除本机注册时使用 `openclaw browser extension uninstall-host`；它不会卸载 Chrome 内扩展，也不会删除开发副本或已有 relay key。

继续阅读：[浏览器工具](/tutorials/tools/browser)、[Browser Control API](/tutorials/tools/browser-control)。

上游来源：[Chrome extension](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/tools/chrome-extension.md)。
