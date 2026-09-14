---
title: "openclaw browser"
sidebarTitle: "browser"
---

# `openclaw browser`

`browser` 用来调试或控制 OpenClaw 浏览器能力，包括启动浏览器、打开网页、查看 tabs、截图、snapshot 和排查 CDP 连接。

```bash
openclaw browser profiles
openclaw browser start
openclaw browser open https://example.com
openclaw browser snapshot
openclaw browser doctor
```

## 什么时候用

- 浏览器工具启动失败。
- Agent 无法打开网页或拿不到页面内容。
- 想测试某个 browser profile。
- 想通过节点上的浏览器执行自动化。

## 新手排查顺序

```bash
openclaw browser doctor
openclaw browser start
openclaw browser tabs
```

高级接口见 [Browser Control API](/tutorials/tools/browser-control)。

## Chrome 扩展配对

```bash
openclaw browser extension install
openclaw browser extension status
openclaw browser extension pair
openclaw browser extension cdp --json
```

新版 native host 配合支持唤醒的扩展、自动本地设置，可让直连 loopback relay 在没有本地 Gateway 时启动。外部认证 CDP 客户端可使用它，但 `openclaw browser` 的操作仍需 Gateway；不是启动了 relay 就能脱离 Gateway 使用全部 CLI。详细条件见 [Chrome 扩展](/tutorials/tools/chrome-extension)。
