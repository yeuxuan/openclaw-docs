---
title: "Show Widget"
sidebarTitle: "Show Widget"
description: "在控制 UI、原生 App 或 Discord Activity 中渲染自包含 HTML/SVG Widget。"
---

# Show Widget

`show_widget` 把自包含 HTML 或 SVG 结果放到当前会话界面。控制 UI 使用沙箱 iframe，iOS、Android、macOS 和 Linux Quick Chat 使用隔离 WebView；Discord 需要先启用 [Activities](/tutorials/channels/discord-activities)。

必填字段只有：

- `title`：卡片与文档标题。
- `widget_code`：自包含 HTML/SVG，最长 262,144 个字符；Discord 上限 48 KiB。

Discord Activity 还可使用可选的 `button_label`；这个字段只属于 Discord presenter，不会出现在 Canvas schema 中。

控制 UI 中还可以把 Widget 固定到 Session Dashboard，并声明精确能力，例如允许访问的 HTTPS Origin、只读数据 Binding、插件 action 或特定 Cron Job。用户必须先审阅这些声明。

## 交互和安全

Widget 内的按钮可以在用户真实点击后调用 `sendPrompt(text)`，把普通文本作为新用户消息发回会话。文本最长 4,000 字符，不能以 `/` 开头，每个文档每分钟最多 10 次。

固定到 Dashboard 后，`openclaw.host.controlUiBaseUrl` 会在宿主初始化后提供 Control UI origin 与 base path；应在点击处理器中读取，而不是页面加载时缓存。已授权的插件写操作可通过 `openclaw.action.run(actionId, params?)` 调用。用户点击的 HTTP/HTTPS 链接由宿主以 `noopener`、`noreferrer` 打开；脚本直接 `window.open` 仍被沙箱禁止。

内联 Widget 默认不能访问网络。固定到 Dashboard 的 Widget 也只能访问用户批准的精确 HTTPS Origin。iframe 不启用 `allow-same-origin`，脚本不能读取控制 UI、Gateway 或其他 Widget 的 Origin 数据。

Widget 代码仍然来自 Agent，应按“愿意在隔离环境运行的代码”来审阅，不能把 Token、密码或隐私数据直接写进 HTML。

上游来源：[`docs/tools/show-widget.md`](https://github.com/openclaw/openclaw/blob/main/docs/tools/show-widget.md)。
