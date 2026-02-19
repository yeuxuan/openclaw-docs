---
title: "重试策略"
sidebarTitle: "重试策略"
---

# 重试策略（Retry Policy）

---

## 目标

- 按 HTTP 请求重试，而非按多步流程重试。
- 仅重试当前步骤以保持顺序。
- 避免重复非幂等操作。

---

## 默认值

- 尝试次数：3
- 最大延迟上限：30000 毫秒
- 抖动：0.1（10%）
- 提供商默认值：
  - Telegram 最小延迟：400 毫秒
  - Discord 最小延迟：500 毫秒

---

## 行为

### Discord

- 仅在速率限制错误（HTTP 429）时重试。
- 当可用时使用 Discord `retry_after`，否则使用指数退避。

### Telegram

- 在临时错误（429、超时、连接/重置/关闭、临时不可用）时重试。
- 当可用时使用 `retry_after`，否则使用指数退避。
- Markdown 解析错误不重试；它们回退到纯文本。

---

## 配置

在 `~/.openclaw/openclaw.json` 中按提供商设置重试策略：

```json5
{
  channels: {
    telegram: {
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
    discord: {
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

---

## 注意事项

- 重试按请求应用（消息发送、媒体上传、反应、投票、贴纸）。
- 复合流程不重试已完成的步骤。
