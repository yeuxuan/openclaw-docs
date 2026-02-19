---
title: "命令队列"
sidebarTitle: "命令队列"
---

# 命令队列（Command Queue）（2026-01-16）

我们通过一个微小的进程内队列串行化入站自动回复运行（所有通道），以防止多个智能体运行冲突，同时仍然允许跨会话的安全并行。

---

## 原因

- 自动回复运行可能很昂贵（LLM 调用），当多个入站消息几乎同时到达时可能发生冲突。
- 串行化避免了对共享资源（会话文件、日志、CLI stdin）的竞争，并降低了上游速率限制的几率。

---

## 工作原理

- 一个通道感知的 FIFO 队列以可配置的并发上限排空每个通道（未配置的通道默认为 1；main 默认为 4，subagent 为 8）。
- `runEmbeddedPiAgent` 按 **会话键**（通道 `session:<key>`）入队，以保证每个会话仅有一个活跃运行。
- 每个会话运行然后排入 **全局通道**（默认 `main`），以便整体并行度受 `agents.defaults.maxConcurrent` 限制。
- 当启用详细日志时，排队的运行如果等待超过约 2 秒才开始，会发出简短通知。
- 输入指示器（Typing indicator）在入队时立即触发（当通道支持时），因此在等待轮到时用户体验保持不变。

---

## 队列模式（每通道）

入站消息可以导向当前运行、等待后续轮次或两者兼有：

- `steer`：立即注入当前运行（在下一个工具边界后取消待处理的工具调用）。如果未在流式输出中，回退到 followup。
- `followup`：在当前运行结束后排入下一个智能体轮次。
- `collect`：将所有排队的消息合并为 **单次** 后续轮次（默认）。如果消息目标不同的通道/线程，则单独排空以保持路由。
- `steer-backlog`（又名 `steer+backlog`）：立即导向 **并** 保留消息用于后续轮次。
- `interrupt`（旧版）：中止该会话的活跃运行，然后运行最新消息。
- `queue`（旧版别名）：等同于 `steer`。

steer-backlog 意味着你可以在导向运行后获得后续响应，因此流式表面可能看起来像重复。如果你想每条入站消息只有一个响应，推荐使用 `collect`/`steer`。
发送 `/queue collect` 作为独立命令（每会话）或设置 `messages.queue.byChannel.discord: "collect"`。

默认值（当配置中未设置时）：

- 所有界面 → `collect`

通过 `messages.queue` 全局或每通道配置：

```json5
{
  messages: {
    queue: {
      mode: "collect",
      debounceMs: 1000,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

---

## 队列选项

选项适用于 `followup`、`collect` 和 `steer-backlog`（以及 `steer` 回退到 followup 时）：

- `debounceMs`：在开始后续轮次之前等待安静（防止"继续，继续"）。
- `cap`：每会话最大排队消息数。
- `drop`：溢出策略（`old`、`new`、`summarize`）。

summarize 保留被丢弃消息的简短要点列表，并将其作为合成后续提示注入。
默认值：`debounceMs: 1000`、`cap: 20`、`drop: summarize`。

---

## 每会话覆盖

- 发送 `/queue <mode>` 作为独立命令来存储当前会话的模式。
- 选项可以组合：`/queue collect debounce:2s cap:25 drop:summarize`
- `/queue default` 或 `/queue reset` 清除会话覆盖。

---

## 范围和保证

- 适用于所有使用网关回复管道的入站通道的自动回复智能体运行（WhatsApp web、Telegram、Slack、Discord、Signal、iMessage、webchat 等）。
- 默认通道（`main`）对入站 + 主心跳是进程范围的；设置 `agents.defaults.maxConcurrent` 以允许多个会话并行。
- 可能存在额外的通道（如 `cron`、`subagent`），以便后台作业可以与入站回复并行运行而不阻塞。
- 每会话通道保证同一时间只有一个智能体运行触及给定的会话。
- 无外部依赖或后台工作线程；纯 TypeScript + promises。

---

## 故障排除

- 如果命令似乎卡住，启用详细日志并查找"queued for …ms"行以确认队列正在排空。
- 如果需要队列深度信息，启用详细日志并观察队列计时行。
