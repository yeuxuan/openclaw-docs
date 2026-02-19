---
title: "OpenResponses API"
sidebarTitle: "OpenResponses API"
---

# OpenResponses API（HTTP）

OpenClaw 的网关（Gateway）可以提供一个 OpenResponses 兼容的 `POST /v1/responses` 端点。

此端点**默认禁用**。先在配置中启用它。

- `POST /v1/responses`
- 与网关（Gateway）相同的端口（WS + HTTP 多路复用）：`http://<gateway-host>:<port>/v1/responses`

底层请求作为正常的网关（Gateway）智能体（Agent）运行执行（与
`openclaw agent` 相同的代码路径），因此路由/权限/配置与你的网关（Gateway）匹配。

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

无需自定义头：将智能体（Agent）id 编码在 OpenResponses 的 `model` 字段中：

- `model: "openclaw:<agentId>"`（示例：`"openclaw:main"`、`"openclaw:beta"`）
- `model: "agent:<agentId>"`（别名）

或通过头指定特定的 OpenClaw 智能体（Agent）：

- `x-openclaw-agent-id: <agentId>`（默认：`main`）

高级用法：

- `x-openclaw-session-key: <sessionKey>` 完全控制会话（Session）路由。

---

## 启用端点

将 `gateway.http.endpoints.responses.enabled` 设为 `true`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: true },
      },
    },
  },
}
```

---

## 禁用端点

将 `gateway.http.endpoints.responses.enabled` 设为 `false`：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: { enabled: false },
      },
    },
  },
}
```

---

## 会话（Session）行为

默认情况下端点是**每请求无状态的**（每次调用生成新的会话（Session）键）。

如果请求包含 OpenResponses 的 `user` 字符串，网关（Gateway）会从中派生稳定的会话（Session）键，
以便重复调用可以共享一个智能体（Agent）会话（Session）。

---

## 请求格式（支持的）

请求遵循 OpenResponses API 的基于 item 的输入格式。当前支持：

- `input`：字符串或 item 对象数组。
- `instructions`：合并到系统提示中。
- `tools`：客户端工具定义（function 工具）。
- `tool_choice`：过滤或要求客户端工具。
- `stream`：启用 SSE 流式传输。
- `max_output_tokens`：尽力输出限制（取决于提供商（Provider））。
- `user`：稳定的会话（Session）路由。

已接受但**当前被忽略**：

- `max_tool_calls`
- `reasoning`
- `metadata`
- `store`
- `previous_response_id`
- `truncation`

---

## Items（输入）

### `message`

角色：`system`、`developer`、`user`、`assistant`。

- `system` 和 `developer` 附加到系统提示中。
- 最近的 `user` 或 `function_call_output` item 成为"当前消息"。
- 更早的 user/assistant 消息作为上下文历史包含。

### `function_call_output`（基于轮次的工具）

将工具结果发送回模型：

```json
{
  "type": "function_call_output",
  "call_id": "call_123",
  "output": "{\"temperature\": \"72F\"}"
}
```

### `reasoning` 和 `item_reference`

为架构兼容性而接受，但在构建提示时被忽略。

---

## 工具（客户端 function 工具）

通过 `tools: [{ type: "function", function: { name, description?, parameters? } }]` 提供工具。

如果智能体（Agent）决定调用工具，响应返回一个 `function_call` 输出 item。
然后你发送一个包含 `function_call_output` 的后续请求以继续轮次。

---

## 图片（`input_image`）

支持 base64 或 URL 源：

```json
{
  "type": "input_image",
  "source": { "type": "url", "url": "https://example.com/image.png" }
}
```

允许的 MIME 类型（当前）：`image/jpeg`、`image/png`、`image/gif`、`image/webp`。
最大大小（当前）：10MB。

---

## 文件（`input_file`）

支持 base64 或 URL 源：

```json
{
  "type": "input_file",
  "source": {
    "type": "base64",
    "media_type": "text/plain",
    "data": "SGVsbG8gV29ybGQh",
    "filename": "hello.txt"
  }
}
```

允许的 MIME 类型（当前）：`text/plain`、`text/markdown`、`text/html`、`text/csv`、
`application/json`、`application/pdf`。

最大大小（当前）：5MB。

当前行为：

- 文件内容被解码并添加到**系统提示**中，而非用户消息中，
  因此它是临时的（不会持久化到会话（Session）历史中）。
- PDF 被解析提取文本。如果文本很少，前几页会被光栅化
  为图片并传递给模型。

PDF 解析使用 Node 友好的 `pdfjs-dist` 旧版构建（无 worker）。现代
PDF.js 构建期望浏览器 workers/DOM 全局对象，因此不在网关（Gateway）中使用。

URL 获取默认值：

- `files.allowUrl`：`true`
- `images.allowUrl`：`true`
- `maxUrlParts`：`8`（每请求基于 URL 的 `input_file` + `input_image` 部分总数）
- 请求受到保护（DNS 解析、私有 IP 阻止、重定向限制、超时）。
- 可选的主机名白名单按输入类型支持（`files.urlAllowlist`、`images.urlAllowlist`）。
  - 精确主机：`"cdn.example.com"`
  - 通配符子域：`"*.assets.example.com"`（不匹配顶级域名）

---

## 文件 + 图片限制（配置）

默认值可在 `gateway.http.endpoints.responses` 下调整：

```json5
{
  gateway: {
    http: {
      endpoints: {
        responses: {
          enabled: true,
          maxBodyBytes: 20000000,
          maxUrlParts: 8,
          files: {
            allowUrl: true,
            urlAllowlist: ["cdn.example.com", "*.assets.example.com"],
            allowedMimes: [
              "text/plain",
              "text/markdown",
              "text/html",
              "text/csv",
              "application/json",
              "application/pdf",
            ],
            maxBytes: 5242880,
            maxChars: 200000,
            maxRedirects: 3,
            timeoutMs: 10000,
            pdf: {
              maxPages: 4,
              maxPixels: 4000000,
              minTextChars: 200,
            },
          },
          images: {
            allowUrl: true,
            urlAllowlist: ["images.example.com"],
            allowedMimes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
            maxBytes: 10485760,
            maxRedirects: 3,
            timeoutMs: 10000,
          },
        },
      },
    },
  },
}
```

省略时的默认值：

- `maxBodyBytes`：20MB
- `maxUrlParts`：8
- `files.maxBytes`：5MB
- `files.maxChars`：200k
- `files.maxRedirects`：3
- `files.timeoutMs`：10s
- `files.pdf.maxPages`：4
- `files.pdf.maxPixels`：4,000,000
- `files.pdf.minTextChars`：200
- `images.maxBytes`：10MB
- `images.maxRedirects`：3
- `images.timeoutMs`：10s

安全说明：

- URL 白名单在获取前和重定向跳转时强制执行。
- 白名单主机名不会绕过私有/内部 IP 阻止。
- 对于面向互联网的网关（Gateway），除应用级防护外还应应用网络出口控制。
  参阅[安全](/gateway/security)。

---

## 流式传输（SSE）

设置 `stream: true` 接收 Server-Sent Events（SSE）：

- `Content-Type: text/event-stream`
- 每个事件行是 `event: <type>` 和 `data: <json>`
- 流以 `data: [DONE]` 结束

当前发出的事件类型：

- `response.created`
- `response.in_progress`
- `response.output_item.added`
- `response.content_part.added`
- `response.output_text.delta`
- `response.output_text.done`
- `response.content_part.done`
- `response.output_item.done`
- `response.completed`
- `response.failed`（出错时）

---

## 用量

当底层提供商（Provider）报告 Token 计数时，`usage` 会被填充。

---

## 错误

错误使用 JSON 对象：

```json
{ "error": { "message": "...", "type": "invalid_request_error" } }
```

常见情况：

- `401` 认证缺失/无效
- `400` 无效的请求体
- `405` 方法不允许

---

## 示例

非流式：

```bash
curl -sS http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "input": "hi"
  }'
```

流式：

```bash
curl -N http://127.0.0.1:18789/v1/responses \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'x-openclaw-agent-id: main' \
  -d '{
    "model": "openclaw",
    "stream": true,
    "input": "hi"
  }'
```
