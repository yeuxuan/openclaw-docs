---
title: "输入指示器"
sidebarTitle: "输入指示器"
---

# 输入指示器（Typing Indicators）

当运行活跃时，输入指示器会发送到聊天通道。使用 `agents.defaults.typingMode` 控制 **何时** 开始输入，使用 `typingIntervalSeconds` 控制 **多久** 刷新一次。

---

## 默认值

当 `agents.defaults.typingMode` **未设置** 时，OpenClaw 保持旧版行为：

- **直接聊天**：模型循环开始后立即开始输入。
- **有提及的群聊**：立即开始输入。
- **没有提及的群聊**：仅当消息文本开始流式输出时才开始输入。
- **心跳运行**：输入被禁用。

---

## 模式

将 `agents.defaults.typingMode` 设置为以下之一：

- `never` — 永远不显示输入指示器。
- `instant` — 模型循环 **一开始** 就开始输入，即使运行后来只返回静默回复 Token。
- `thinking` — 在 **第一个推理增量** 时开始输入（需要运行的 `reasoningLevel: "stream"`）。
- `message` — 在 **第一个非静默文本增量** 时开始输入（忽略 `NO_REPLY` 静默 Token）。

"触发多早"的顺序：
`never` → `message` → `thinking` → `instant`

---

## 配置

```json5
{
  agent: {
    typingMode: "thinking",
    typingIntervalSeconds: 6,
  },
}
```

你可以按会话覆盖模式或节奏：

```json5
{
  session: {
    typingMode: "message",
    typingIntervalSeconds: 4,
  },
}
```

---

## 注意事项

- `message` 模式不会为仅静默回复显示输入（如用于抑制输出的 `NO_REPLY` Token）。
- `thinking` 仅在运行流式推理（`reasoningLevel: "stream"`）时触发。如果模型不发出推理增量，输入不会开始。
- 心跳永远不显示输入，无论模式如何。
- `typingIntervalSeconds` 控制 **刷新节奏**，不是开始时间。默认值是 6 秒。
