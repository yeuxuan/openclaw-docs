---
title: "工具调用 API"
sidebarTitle: "工具调用 API"
---

# 工具调用（HTTP）

OpenClaw 的网关（Gateway）暴露了一个简单的 HTTP 端点，用于直接调用单个工具。它始终启用，但受网关（Gateway）认证和工具策略门控。

- `POST /tools/invoke`
- 与网关（Gateway）相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/tools/invoke`

默认最大载荷大小为 2 MB。

---

## 认证

使用网关（Gateway）认证配置。发送 bearer Token：

- `Authorization: Bearer <token>`

注意：

- 当 `gateway.auth.mode="token"` 时，使用 `gateway.auth.token`（或 `OPENCLAW_GATEWAY_TOKEN`）。
- 当 `gateway.auth.mode="password"` 时，使用 `gateway.auth.password`（或 `OPENCLAW_GATEWAY_PASSWORD`）。
- 如果配置了 `gateway.auth.rateLimit` 且认证失败次数过多，端点返回 `429` 和 `Retry-After`。

---

## 请求体

```json
{
  "tool": "sessions_list",
  "action": "json",
  "args": {},
  "sessionKey": "main",
  "dryRun": false
}
```

字段：

- `tool`（string，必需）：要调用的工具名称。
- `action`（string，可选）：如果工具 schema 支持 `action` 且 args 载荷省略了它，则映射到 args 中。
- `args`（object，可选）：工具特定的参数。
- `sessionKey`（string，可选）：目标会话（Session）键。如果省略或为 `"main"`，网关（Gateway）使用配置的 main 会话（Session）键（遵循 `session.mainKey` 和默认智能体（Agent），或在全局作用域中使用 `global`）。
- `dryRun`（boolean，可选）：保留供将来使用；目前被忽略。

---

## 策略 + 路由行为

工具可用性通过与网关（Gateway）智能体（Agent）使用的相同策略链进行过滤：

- `tools.profile` / `tools.byProvider.profile`
- `tools.allow` / `tools.byProvider.allow`
- `agents.<id>.tools.allow` / `agents.<id>.tools.byProvider.allow`
- 群组策略（如果会话（Session）键映射到群组或通道（Channel））
- 子智能体（Agent）策略（使用子智能体（Agent）会话（Session）键调用时）

如果策略不允许某个工具，端点返回 **404**。

网关（Gateway）HTTP 默认还应用硬拒绝列表（即使会话（Session）策略允许该工具）：

- `sessions_spawn`
- `sessions_send`
- `gateway`
- `whatsapp_login`

你可以通过 `gateway.tools` 自定义此拒绝列表：

```json5
{
  gateway: {
    tools: {
      // 通过 HTTP /tools/invoke 额外阻止的工具
      deny: ["browser"],
      // 从默认拒绝列表中移除工具
      allow: ["gateway"],
    },
  },
}
```

为帮助群组策略解析上下文，你可以可选地设置：

- `x-openclaw-message-channel: <channel>`（示例：`slack`、`telegram`）
- `x-openclaw-account-id: <accountId>`（当存在多个账户时）

---

## 响应

- `200` → `{ ok: true, result }`
- `400` → `{ ok: false, error: { type, message } }`（无效请求或工具输入错误）
- `401` → 未授权
- `429` → 认证速率限制（设置了 `Retry-After`）
- `404` → 工具不可用（未找到或未在白名单中）
- `405` → 方法不允许
- `500` → `{ ok: false, error: { type, message } }`（意外的工具执行错误；消息已脱敏）

---

## 示例

```bash
curl -sS http://127.0.0.1:18789/tools/invoke \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "tool": "sessions_list",
    "action": "json",
    "args": {}
  }'
```
