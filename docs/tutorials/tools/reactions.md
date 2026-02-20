---
title: "表情回应"
sidebarTitle: "表情回应"
---

# 表情回应（Reactions）

表情回应（Reactions）是 OpenClaw 跨通道的消息反馈机制，让 Agent 能够通过 👍、❤️、✅ 等表情符号快速表达对消息的响应——无需发送完整的文字回复。

---

## 为什么需要表情回应？

在自动化场景中，Agent 常常需要处理大量消息。对于"已收到"、"正在处理"、"完成"等简单状态，用表情回应代替文字回复，可以大幅减少通道的消息噪音，同时让用户一眼看出任务状态。

::: info 常见使用场景
- 👍 确认收到消息，正在处理
- ✅ 任务已完成
- ❌ 任务失败或拒绝执行
- ⏳ 任务正在等待中
- ❤️ 用户反馈、情感交互
:::

---

## 跨通道语义统一

不同聊天平台对表情回应的实现方式不同，OpenClaw 在内部统一了其语义：

| 平台 | 实现方式 | OpenClaw 统一语义 |
|------|----------|-------------------|
| Telegram | 消息反应（Message Reaction） | Reactions API |
| Discord | 消息表情（Message Emoji Reaction） | Reactions API |
| Slack | 表情回应（Emoji Reaction） | Reactions API |
| Web Chat | 内置表情面板 | Reactions API |

无论用户在哪个平台交互，Agent 都通过相同的接口发送表情回应，平台差异由 OpenClaw 内部处理。

---

## Agent 如何使用表情回应

Agent 通过内置工具发送表情回应：

```bash
# Agent 在任务开始时发送"收到"回应
openclaw run "处理用户请求时，先发送 👍 表示收到，完成后发送 ✅"
```

::: details 工具调用示例（开发者参考）

Agent 内部使用 `send_reaction` 工具：

```json5
{
  tool: "send_reaction",
  params: {
    messageId: "msg_12345",
    emoji: "👍"
  }
}
```

移除表情回应：

```json5
{
  tool: "remove_reaction",
  params: {
    messageId: "msg_12345",
    emoji: "👍"
  }
}
```
:::

---

## 配置

在配置文件中启用或禁用表情回应功能：

```json5
{
  tools: {
    reactions: {
      enabled: true,

      // 自定义语义映射
      semantics: {
        "received": "👍",
        "completed": "✅",
        "failed": "❌",
        "thinking": "🤔"
      }
    }
  }
}
```

::: tip 按通道单独配置
如果某个通道不支持表情回应，可以单独禁用：

```json5
{
  channels: {
    "my-webhook": {
      reactions: { enabled: false }
    }
  }
}
```
:::

---

## 注意事项

::: warning 平台限制
- Telegram 对表情回应有严格限制：只能使用 Telegram 内置的"精选表情"，不支持任意 Unicode 表情
- 某些旧版本的 Discord 机器人权限可能不包含"添加表情回应"，需要在机器人权限设置中单独开启
- 部分自定义通道（如 Webhook）可能不支持表情回应，会静默忽略该操作
:::

---

_下一步：[工具系统总览](/tutorials/tools/)_
