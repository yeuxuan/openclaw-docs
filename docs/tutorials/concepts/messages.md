---
title: "消息"
sidebarTitle: "消息"
---

# 消息（Messages）

本页将 OpenClaw 处理入站消息、会话（Session）、队列、流式输出（Streaming）和推理可见性的方式串联起来。

---

## 消息流（高层概览）

```text
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

关键配置项位于配置中：

- `messages.*` 用于前缀、队列和群组行为。
- `agents.defaults.*` 用于块流式输出和分块默认值。
- 通道覆盖（`channels.whatsapp.*`、`channels.telegram.*` 等）用于上限和流式输出开关。

参见[配置](/gateway/configuration)了解完整 schema。

---

## 入站去重

通道可以在重新连接后重新投递相同的消息。OpenClaw 保持一个以 channel/account/peer/session/message id 为键的短期缓存，以便重复投递不会触发另一次智能体运行。

---

## 入站防抖

来自 **同一发送者** 的快速连续消息可以通过 `messages.inbound` 批量合并为单次智能体轮次。防抖按通道 + 对话范围，使用最新消息进行回复线程/ID。

配置（全局默认 + 每通道覆盖）：

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

注意：

- 防抖仅适用于 **纯文本** 消息；媒体/附件立即刷新。
- 控制命令绕过防抖，因此它们保持独立。

---

## 会话和设备

会话由网关拥有，而非客户端。

- 直接聊天合并到智能体主会话键。
- 群组/通道获得自己的会话键。
- 会话存储和记录位于网关主机上。

多个设备/通道可以映射到同一会话，但历史不会完全同步回每个客户端。建议：对于长对话使用一个主设备以避免上下文分歧。Control UI 和 TUI 始终显示网关支持的会话记录，因此它们是事实来源。

详情：[会话管理](/concepts/session)。

---

## 入站正文和历史上下文

OpenClaw 将 **提示正文** 与 **命令正文** 分开：

- `Body`：发送给智能体的提示文本。这可能包含通道信封和可选的历史包装器。
- `CommandBody`：用于指令/命令解析的原始用户文本。
- `RawBody`：`CommandBody` 的旧版别名（保留兼容性）。

当通道提供历史记录时，使用共享的包装器：

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

对于 **非直接聊天**（群组/通道/房间），**当前消息正文** 带有发送者标签前缀（与历史条目使用的样式相同）。这使智能体提示中的实时消息和排队/历史消息保持一致。

历史缓冲区是 **仅待处理的**：它们包含 _未_ 触发运行的群组消息（例如，提及门控的消息）并 **排除** 已在会话记录中的消息。

指令剥离仅适用于 **当前消息** 部分，以保持历史完整。提供历史包装的通道应将 `CommandBody`（或 `RawBody`）设置为原始消息文本，将 `Body` 保持为组合提示。历史缓冲区可通过 `messages.groupChat.historyLimit`（全局默认）和每通道覆盖如 `channels.slack.historyLimit` 或 `channels.telegram.accounts.<id>.historyLimit`（设置 `0` 禁用）配置。

---

## 队列和后续

如果运行已经在活动中，入站消息可以排队、导向到当前运行或收集用于后续轮次。

- 通过 `messages.queue`（和 `messages.queue.byChannel`）配置。
- 模式：`interrupt`、`steer`、`followup`、`collect`，加上 backlog 变体。

详情：[队列](/concepts/queue)。

---

## 流式输出、分块和批处理

块流式输出在模型产生文本块时发送部分回复。分块遵守通道文本限制，避免拆分围栏代码。

关键设置：

- `agents.defaults.blockStreamingDefault`（`on|off`，默认 off）
- `agents.defaults.blockStreamingBreak`（`text_end|message_end`）
- `agents.defaults.blockStreamingChunk`（`minChars|maxChars|breakPreference`）
- `agents.defaults.blockStreamingCoalesce`（基于空闲的批处理）
- `agents.defaults.humanDelay`（块回复之间的仿人延迟）
- 通道覆盖：`*.blockStreaming` 和 `*.blockStreamingCoalesce`（非 Telegram 通道需要显式 `*.blockStreaming: true`）

详情：[流式输出 + 分块](/concepts/streaming)。

---

## 推理可见性和 Token

OpenClaw 可以暴露或隐藏模型推理：

- `/reasoning on|off|stream` 控制可见性。
- 推理内容在模型产生时仍然计入 Token 使用。
- Telegram 支持将推理流输入草稿气泡。

详情：[思考 + 推理指令](/tools/thinking) 和 [Token 使用](/reference/token-use)。

---

## 前缀、线程和回复

出站消息格式化集中在 `messages` 中：

- `messages.responsePrefix`、`channels.<channel>.responsePrefix` 和 `channels.<channel>.accounts.<id>.responsePrefix`（出站前缀级联），加上 `channels.whatsapp.messagePrefix`（WhatsApp 入站前缀）
- 通过 `replyToMode` 和每通道默认值进行回复线程

详情：[配置](/gateway/configuration#messages) 和通道文档。
