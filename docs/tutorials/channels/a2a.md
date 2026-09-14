---
title: "A2A Agent 通道"
sidebarTitle: "A2A"
description: "通过 Agent2Agent 1.0 JSON-RPC 让外部 Agent 发现并调用 OpenClaw，或向可信 Peer 发消息。"
---

# A2A Agent 通道

A2A 插件实现 Linux Foundation Agent2Agent 1.0 JSON-RPC 协议。外部 Agent
可以读取公开 Agent Card，再用独立 Bearer Token 把文本任务提交给 OpenClaw；
OpenClaw 也可以主动向已配置 Peer 发送消息。

## 最小配置

```json5
{
  channels: {
    a2a: {
      enabled: true,
      advertisedUrl: "https://openclaw.example.com",
      peers: {
        hermes: {
          token: "${A2A_HERMES_TOKEN}",
        },
      },
    },
  },
}
```

每个 Peer 使用不同的高熵 Token。反向代理后请把 `advertisedUrl` 设置成外部
HTTPS Origin；省略时会根据 discovery 请求推导。

## Agent Card 与任务入口

Agent Card 不需要认证：

```bash
curl http://127.0.0.1:18789/.well-known/agent-card.json
```

它会公开 Gateway JSON-RPC 入口以及可见 Agent。用 `exposeAgents` 限制公开的
Agent ID；省略或空数组会列出所有已配置 Agent。

提交任务：

```bash
curl http://127.0.0.1:18789/a2a/v1 \
  -H "Authorization: Bearer $A2A_HERMES_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "request-1",
    "method": "SendMessage",
    "params": {
      "message": {
        "messageId": "message-1",
        "role": "ROLE_USER",
        "parts": [{ "text": "Summarize the latest project updates." }]
      }
    }
  }'
```

后续请求带相同 `contextId` 可延续对话。加入
`"configuration": { "returnImmediately": true }` 会立即返回 working 状态，
再用 `GetTask` 轮询。

当前插件会诚实拒绝 `CancelTask`：A2A 插件尚无终止已派发 Agent run 的接口，
不会假装任务已取消而后台继续执行。

## 主动发送到 Peer

```json5
{
  channels: {
    a2a: {
      enabled: true,
      peers: {
        hermes: {
          token: "${A2A_HERMES_TOKEN}",
          url: "https://hermes.example.com/a2a/v1",
          outboundToken: "${A2A_HERMES_OUTBOUND_TOKEN}",
        },
      },
    },
  },
}
```

发送目标写为 `a2a:hermes`。插件直接调用配置 URL，不会自动读取远端 Agent
Card；没有 `url` 的 Peer 只能入站，不能接收出站消息。

## 安全边界

- Agent Card 故意公开；公网部署必须限制 `exposeAgents` 并使用 HTTPS。
- 所有 JSON-RPC 任务都需要 Peer Token，没有匿名任务模式。
- 每个 Peer 与 `contextId` 使用隔离 DM 会话，不继承主操作员会话。
- 请求最大 1 MiB，提取文本最大 64 KiB。
- 默认每个 Peer 每分钟 30 次；只有在额外受保护网络中才设为 `0`。
- 入站请求不能指定任意代理目标或出站 URL。

当前只支持文本和结构化 JSON 数据，不支持文件、二进制、流式 SSE、Push、任务
列表、多租户路由和真正取消。任务只保存在内存：终态最多 24 小时或 500 条，
Gateway 重启后清空。

继续阅读：[通道路由](/tutorials/channels/channel-routing)、
[Gateway 安全](/tutorials/gateway/security)。
