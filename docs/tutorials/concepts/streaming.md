---
title: "流式输出与分块"
sidebarTitle: "流式输出与分块"
description: "解释 OpenClaw 的块流式输出、Telegram 草稿流、分块算法、合并策略和相关配置项。"
---

# 流式输出（Streaming）+ 分块

OpenClaw 里有两种容易混淆的“流式输出”：

- 块流式输出：助手生成内容时，按较大的文本块发送普通通道消息。它不是 Token 级增量。
- Telegram 草稿流：只在 Telegram 上可用。生成期间更新草稿气泡，结束后再发送最终消息。

目前外部通道消息没有真正的 Token 级流式输出。Telegram 草稿流是唯一的部分流界面。

---

## 块流式输出（通道消息）

块流式输出在助手输出可用时以粗粒度块发送。

```text
Model output
  └─ text_delta/events
       ├─ (blockStreamingBreak=text_end)
       │    └─ chunker emits blocks as buffer grows
       └─ (blockStreamingBreak=message_end)
            └─ chunker flushes at message_end
                   └─ channel send (block replies)
```

图例：

- `text_delta/events`：模型流事件（对于非流式模型可能稀疏）。
- `chunker`：`EmbeddedBlockChunker` 应用最小/最大边界 + 断点偏好。
- `channel send`：实际的出站消息（块回复）。

相关配置：

- `agents.defaults.blockStreamingDefault`：`"on"`/`"off"`（默认 off）。
- 通道覆盖：`*.blockStreaming`（及每账户变体）强制每通道 `"on"`/`"off"`。
- `agents.defaults.blockStreamingBreak`：`"text_end"` 或 `"message_end"`。
- `agents.defaults.blockStreamingChunk`：`{ minChars, maxChars, breakPreference? }`。
- `agents.defaults.blockStreamingCoalesce`：`{ minChars?, maxChars?, idleMs? }`（发送前合并流式块）。
- 通道硬上限：`*.textChunkLimit`（如 `channels.whatsapp.textChunkLimit`）。
- 通道分块模式：`*.chunkMode`（`length` 默认，`newline` 在长度分块之前按空行（段落边界）拆分）。
- Discord 软上限：`channels.discord.maxLinesPerMessage`（默认 17）拆分高回复以避免 UI 裁剪。

边界语义：

- `text_end`：分块器发出后立即流式传输块；在每个 `text_end` 时刷新。
- `message_end`：等到助手消息完成，然后刷新缓冲输出。

即使 `message_end` 如果缓冲文本超过 `maxChars`，仍然使用分块器，因此可能在最后发出多个块。

---

## 分块算法（低/高边界）

块分块由 `EmbeddedBlockChunker` 实现：

- 低边界：缓冲区达到 `minChars` 后才发出，强制刷新除外。
- 高边界：优先在 `maxChars` 之前找断点；找不到时按 `maxChars` 硬切。
- 断点偏好：`paragraph` → `newline` → `sentence` → `whitespace` → 硬断。
- 代码围栏：不会在围栏内部拆分。必须按 `maxChars` 硬切时，会关闭再重新打开围栏，保证 Markdown 仍然有效。

`maxChars` 被限制在通道 `textChunkLimit`，因此你不能超过每通道上限。

---

## 合并（合并流式块）

启用块流式输出后，OpenClaw 可以在发送前合并连续文本块。这样既能让用户尽早看到内容，也不会一行一行刷屏。

- 合并等待 空闲间隙（`idleMs`）后才刷新。
- 缓冲区受 `maxChars` 限制，超出时刷新。
- `minChars` 防止微小片段发送，直到累积足够文本（最终刷新总是发送剩余文本）。
- 连接符从 `blockStreamingChunk.breakPreference` 派生（`paragraph` → `\n\n`，`newline` → `\n`，`sentence` → 空格）。
- 通道覆盖可通过 `*.blockStreamingCoalesce`（包括每账户配置）。
- Signal/Slack/Discord 的默认合并 `minChars` 提升到 1500，除非被覆盖。

---

## 块间仿人节奏

启用块流式输出后，可以在第一个块之后给后续块加随机暂停。这样多气泡回复不会显得像机器连续刷出来。

- 配置：`agents.defaults.humanDelay`（通过 `agents.entries.*.humanDelay` 每智能体覆盖）。
- 模式：`off`（默认）、`natural`（800–2500ms）、`custom`（`minMs`/`maxMs`）。
- 只适用于块回复，不影响最终回复或工具摘要。

---

## "流式分块还是全部输出"

这映射到：

- 流式分块：`blockStreamingDefault: "on"` 加 `blockStreamingBreak: "text_end"`，生成过程中逐块发送。非 Telegram 通道还需要 `*.blockStreaming: true`。
- 结束时全部流出：`blockStreamingBreak: "message_end"`，完成后统一刷新；内容很长时仍可能拆成多个块。
- 无块流式输出：`blockStreamingDefault: "off"`，只发送最终回复。

通道说明：非 Telegram 通道默认不开块流式输出，除非显式设置 `*.blockStreaming: true`。Telegram 可以通过 `channels.telegram.streamMode` 使用草稿流，不需要打开块回复。

配置位置提醒：`blockStreaming*` 默认值位于 `agents.defaults` 下，不是根配置。

---

## Telegram 草稿流（类 Token）

Telegram 是唯一支持草稿流的通道：

- 在 带主题的私聊 中使用 Bot API `sendMessageDraft`。
- `channels.telegram.streamMode: "partial" | "block" | "off"`。
  - `partial`：用最新流文本更新草稿。
  - `block`：以分块块更新草稿（相同的分块器规则）。
  - `off`：无草稿流。
- 草稿分块配置（仅用于 `streamMode: "block"`）：`channels.telegram.draftChunk`（默认：`minChars: 200`，`maxChars: 800`）。
- 草稿流与块流式输出是独立的；块回复默认关闭，仅在非 Telegram 通道上通过 `*.blockStreaming: true` 启用。
- 最终回复仍然是普通消息。
- `/reasoning stream` 将推理写入草稿气泡（仅 Telegram）。

当草稿流活跃时，OpenClaw 为该回复禁用块流式输出以避免双重流。

```text
Telegram (private + topics)
  └─ sendMessageDraft (draft bubble)
       ├─ streamMode=partial → update latest text
       └─ streamMode=block   → chunker updates draft
  └─ final reply → normal message
```

图例：

- `sendMessageDraft`：Telegram 草稿气泡（非真正消息）。
- `final reply`：普通 Telegram 消息发送。
