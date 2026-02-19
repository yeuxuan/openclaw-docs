---
title: "群组消息"
sidebarTitle: "群组消息"
---

# 群组消息（WhatsApp Web 通道）

目标：让 Clawd 加入 WhatsApp 群组，仅在被提及时唤醒，并将该线程与个人私信会话分开。

注意：`agents.list[].groupChat.mentionPatterns` 现在也被 Telegram/Discord/Slack/iMessage 使用；本文档侧重于 WhatsApp 特定行为。对于多智能体设置，请按智能体设置 `agents.list[].groupChat.mentionPatterns`（或使用 `messages.groupChat.mentionPatterns` 作为全局回退）。

---

## 已实现的功能（2025-12-03）

- 激活模式：`mention`（默认）或 `always`。`mention` 需要一个 ping（真正的 WhatsApp @提及通过 `mentionedJids`、正则模式或机器人的 E.164 号码在文本中的任意位置）。`always` 在每条消息上唤醒智能体，但它应仅在能增加有意义价值时才回复；否则返回静默标记 `NO_REPLY`。默认值可在配置中设置（`channels.whatsapp.groups`）并通过 `/activation` 按群组覆盖。当设置了 `channels.whatsapp.groups` 时，它还充当群组白名单（包含 `"*"` 以允许所有群组）。
- 群组策略：`channels.whatsapp.groupPolicy` 控制是否接受群组消息（`open|disabled|allowlist`）。`allowlist` 使用 `channels.whatsapp.groupAllowFrom`（回退：显式 `channels.whatsapp.allowFrom`）。默认为 `allowlist`（在你添加发送者之前被阻止）。
- 按群组的会话：会话键形如 `agent:<agentId>:whatsapp:group:<jid>`，因此像 `/verbose on` 或 `/think high`（作为独立消息发送）这样的命令仅作用于该群组；个人私信状态不受影响。群组线程跳过心跳。
- 上下文注入：**仅待处理**的群组消息（默认 50 条）——即_未_触发运行的消息——以 `[Chat messages since your last reply - for context]` 为前缀注入，触发行在 `[Current message - respond to this]` 下。已在会话中的消息不会被重新注入。
- 发送者展示：每个群组批次现在以 `[from: Sender Name (+E164)]` 结尾，以便 Pi 知道谁在说话。
- 阅后即焚/一次性查看：我们在提取文本/提及之前解包这些消息，因此其中的 ping 仍然会触发。
- 群组系统提示：在群组会话的第一轮（以及每当 `/activation` 更改模式时），我们在系统提示中注入一段简短说明，如 `You are replying inside the WhatsApp group "<subject>". Group members: Alice (+44...), Bob (+43...), … Activation: trigger-only … Address the specific sender noted in the message context.` 如果元数据不可用，我们仍会告诉智能体这是一个群聊。

---

## 配置示例（WhatsApp）

在 `~/.openclaw/openclaw.json` 中添加 `groupChat` 块，这样即使 WhatsApp 在文本正文中去掉了可见的 `@`，显示名称 ping 仍然有效：

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          historyLimit: 50,
          mentionPatterns: ["@?openclaw", "\\+?15555550123"],
        },
      },
    ],
  },
}
```

说明：

- 正则表达式不区分大小写；它们覆盖了像 `@openclaw` 这样的显示名称 ping 和带或不带 `+`/空格的原始号码。
- WhatsApp 在用户点击联系人时仍通过 `mentionedJids` 发送规范提及，因此号码回退很少需要，但作为安全网很有用。

### 激活命令（仅限所有者）

使用群聊命令：

- `/activation mention`
- `/activation always`

只有所有者号码（来自 `channels.whatsapp.allowFrom`，或未设置时为机器人自己的 E.164）可以更改此设置。在群组中作为独立消息发送 `/status` 可查看当前激活模式。

---

## 如何使用

1. 将你的 WhatsApp 账户（运行 OpenClaw 的那个）添加到群组。
2. 说 `@openclaw …`（或包含号码）。只有白名单发送者可以触发，除非你设置 `groupPolicy: "open"`。
3. 智能体提示将包含最近的群组上下文以及末尾的 `[from: …]` 标记，以便它能回复正确的人。
4. 会话级指令（`/verbose on`、`/think high`、`/new` 或 `/reset`、`/compact`）仅适用于该群组的会话；作为独立消息发送以使其注册。你的个人私信会话保持独立。

---

## 测试/验证

- 手动烟雾测试：
  - 在群组中发送 `@openclaw` ping 并确认收到引用发送者名称的回复。
  - 发送第二个 ping 并验证历史块已包含，然后在下一轮清除。
- 检查网关日志（使用 `--verbose` 运行）查看 `inbound web message` 条目，显示 `from: <groupJid>` 和 `[from: …]` 后缀。

---

## 已知注意事项

- 心跳有意跳过群组以避免嘈杂的广播。
- 回声抑制使用组合的批次字符串；如果你在没有提及的情况下连续发送两次相同的文本，只有第一次会得到响应。
- 会话存储条目将显示为会话存储中的 `agent:<agentId>:whatsapp:group:<jid>`（默认为 `~/.openclaw/agents/<agentId>/sessions/sessions.json`）；缺少条目只是意味着群组尚未触发过运行。
- 群组中的输入指示器遵循 `agents.defaults.typingMode`（默认：未被提及时为 `message`）。
