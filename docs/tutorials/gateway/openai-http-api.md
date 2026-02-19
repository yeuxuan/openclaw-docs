---
title: "OpenAI Chat Completions"
sidebarTitle: "OpenAI Chat Completions"
---

# OpenAI Chat Completions（HTTP）

OpenClaw 的网关（Gateway）可以提供一个小型的 OpenAI 兼容 Chat Completions 端点。

此端点**默认禁用**。先在配置中启用它。

- `POST /v1/chat/completions`
- 与网关（Gateway）相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/chat/completions`

底层请求作为正常的网关（Gateway）智能体（Agent）运行执行（与 `openclaw agent` 相同的代码路径），因此路由/权限/配置与你的网关（Gateway）匹配。

---

## 认证

使用网关（Gateway）认证配置。发送 bearer Token：

- `Authorization: Bearer <token>`

注意：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 如果配置了 `gateway.auth.rateLimit` 且认证失败次数过多，端点返回 `429` 和 `Retry-After`。

---

## 选择智能体（Agent）

无需自定义头：将智能体（Agent）id 编码在 OpenAI 的 `model` 字段中：

- `model: "openclaw:<agentId>"`（示例：`"openclaw:main"`、`"openclaw:beta"`）
- `model: "agent:<agentId>"`（别名）

或通过头指定特定的 OpenClaw 智能体（Agent）：

- `x-openclaw-agent-id: <agentId>`（默认：`main`）

高级用法：

- `x-openclaw-session-key: <sessionKey>` 完全控制会话（Session）路由。

---

## 启用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设为 `true`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: true },
      },
    },
  },
}
```

---

## 禁用端点

将 `gateway.http.endpoints.chatCompletions.enabled` 设为 `false`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        chatCompletions: { enabled: false },
      },
    },
  },
}
```

---

## 会话（Session）行为

默认情况下端点是**每请求无状态的**（每次调用生成新的会话（Session）键）。

如果请求包含 OpenAI 的 `user` 字符串，网关（Gateway）会从中派生稳定的会话（Session）键，以便重复调用可以共享一个智能体（Agent）会话（Session）。

---

## 流式传输（SSE）

设置 `stream: true` 接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行是 `data: <json>`
- 流以 `data: [DONE]` 结束

---

## 示例

非流式：

```bash
curl -sS http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "messages": [{"role":"user","content":"hi"}]
  }'
```

流式：

```bash
curl -N http://127.0.0.1:18789/v1/chat/completions \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "messages": [{"role":"user","content":"hi"}]
  }'
```
