---
title: "轮询通道配置"
sidebarTitle: "轮询通道"
---

# 轮询通道（Channel Polling）

并不是所有通道都支持实时推送（Push）。对于这类通道，OpenClaw 通过主动轮询（Polling）的方式定期检查是否有新消息到达。你可以手动触发轮询，也可以配合 Cron 实现自动定期轮询。

---

## 快速上手

**第一步：确认通道已配置**

```bash
openclaw channels list
```

**第二步：手动触发一次轮询**

```bash
# 对 WhatsApp 通道执行一次轮询
openclaw channels poll --channel whatsapp
```

**第三步：查看轮询结果**

```bash
openclaw logs --filter poll --limit 20
```

::: tip 轮询 vs 推送
如果你的通道支持推送（如 Gmail PubSub），推荐优先使用推送方式，实时性更好且资源消耗更少。查看 [Gmail PubSub 集成](./gmail-pubsub)。
:::

---

## 支持轮询的通道

| 通道 | 轮询支持 | 推送支持 | 推荐方式 |
|------|---------|---------|---------|
| WhatsApp | 是 | 否 | 轮询 |
| Discord（部分场景）| 是 | 是（Webhook）| 推送优先 |
| MS Teams | 是 | 部分支持 | 视配置而定 |
| Gmail | 是 | 是（PubSub）| 推送优先 |

---

## 技术说明

### CLI 命令

```bash
# 对指定通道执行单次轮询
openclaw channels poll --channel <channel-name>

# 对所有已配置通道执行轮询
openclaw channels poll --all

# 指定轮询超时时间（秒）
openclaw channels poll --channel whatsapp --timeout 30
```

---

### 通过 Gateway RPC 触发轮询

如果你的系统通过 Gateway API 管理 OpenClaw，可以通过 RPC 方法触发轮询：

```bash
# 通过 Gateway RPC 触发 WhatsApp 通道轮询
curl -X POST https://your-gateway/rpc \
  -H "Content-Type: application/json" \
  -d '{
    "method": "channels.poll",
    "params": {
      "channel": "whatsapp"
    }
  }'
```

---

### 使用 Cron 自动定期轮询

将轮询配置为定时任务，实现自动化：

```json5
{
  cron: {
    jobs: [
      {
        // 每 5 分钟轮询一次 WhatsApp
        schedule: "*/5 * * * *",
        agent: "whatsapp-handler",
        message: "检查 WhatsApp 是否有新消息，如有则处理",
        // 使用 Agent 工具触发轮询
        tools: ["poll_channel"]
      }
    ]
  }
}
```

---

### 通过 Agent 工具触发轮询

在 Agent 对话中，可以直接调用轮询工具：

```text
用户：检查一下 WhatsApp 有没有新消息
Agent：[调用 poll_channel 工具] 正在轮询 WhatsApp...
      发现 3 条新消息，正在处理...
```

---

### 各通道轮询行为差异

::: details WhatsApp 轮询说明
- 轮询间隔建议不低于 1 分钟，频繁请求可能触发限流
- 每次轮询返回自上次轮询以来的新消息
- 需要在通道配置中设置正确的 API 凭证
:::

::: details Discord 轮询说明
- Discord 支持 Webhook 推送，推荐优先使用
- 轮询主要用于无法配置 Webhook 的特殊场景
- 轮询使用 Discord Bot Token 读取消息历史
:::

::: details MS Teams 轮询说明
- Teams 的轮询通过 Graph API 实现
- 需要配置正确的 Azure AD 权限（`ChannelMessage.Read.All`）
- 建议轮询间隔 2-5 分钟
:::

---

::: warning 轮询频率注意事项
过于频繁的轮询可能导致：
- 触发第三方平台的 API 限流（Rate Limit）
- 增加不必要的资源消耗

建议根据业务需求合理设置轮询间隔，不必要时优先使用推送方式。
:::

---

_下一步：[Gmail PubSub 推送集成](./gmail-pubsub) | [Cron 定时任务](./cron-jobs) | [自动化概览](./index)_
