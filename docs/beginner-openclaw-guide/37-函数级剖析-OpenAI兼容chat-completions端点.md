# 37 函数级剖析：OpenAI 兼容 chat-completions 端点

核心文件：`src/gateway/openai-http.ts`

## 模块定位

实现 OpenAI API 兼容层，使得任何支持 OpenAI SDK 的客户端（如 Cursor、Continue、自定义脚本）能直接连接 OpenClaw 网关使用 agent 能力。

## 一、handleOpenAiHttpRequest（完整路由逻辑）

```ts
// src/gateway/openai-http.ts

export async function handleOpenAiHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  opts: {
    auth: ResolvedGatewayAuth;
    trustedProxies?: string[];
    rateLimiter?: AuthRateLimiter;
  }
): Promise<boolean>  // 返回 true 表示已处理该请求
```

**只处理一种请求：** `POST /v1/chat/completions`。其他路径返回 `false`（由上层继续路由）。

## 二、执行链路

```
POST /v1/chat/completions
    │
    ▼
1. 路径匹配：仅处理 POST /v1/chat/completions
    │
    ▼
2. authorizeGatewayConnect（Bearer token 鉴权）
   失败 → 401 / 429（限速）
    │
    ▼
3. 读取 + 解析 JSON body
   格式错误 → 400
    │
    ▼
4. 构建 agent prompt
   - system/developer → extraSystemPrompt
   - user/assistant/tool → 对话内容（归一为内部 ConversationEntry）
    │
    ▼
5. 解析 agentId + sessionKey
   - agentId：来自 X-OpenClaw-Agent 头 或 model 字段
   - sessionKey：来自 X-OpenClaw-Session 头 或自动生成
    │
    ▼
6. agentCommand(...) 执行 agent
    │
    ├─ 非流式（stream=false）→ 等待完成，返回一次性 chat.completion
    │
    └─ 流式（stream=true）→ SSE，监听 agent 事件 → chat.completion.chunk
                                           最后发送 [DONE]
```

## 三、prompt 构建（不是直接拼 messages）

```ts
// OpenAI messages → 内部统一格式

const entries: ConversationEntry[] = [];
for (const msg of body.messages) {
  if (msg.role === "system" || msg.role === "developer") {
    extraSystemPrompt = (extraSystemPrompt ? extraSystemPrompt + "\n\n" : "") + msg.content;
  } else {
    entries.push(normalizeToConversationEntry(msg));  // user/assistant/tool 统一处理
  }
}

// 从 ConversationEntry 生成 agent 可读文本
const prompt = buildPromptFromConversation(entries);
```

**为什么不直接拼 messages：**
- tool/function 类型消息结构不同，需要可控降级
- 不同来源（user/assistant/tool_result）需要统一格式后才能发给 agent

## 四、runId 设计

```ts
// runId 格式：chatcmpl_xxx（兼容 OpenAI 风格）

const runId = `chatcmpl_${generateShortId()}`;
```

既兼容调用方对 OpenAI 风格 ID 的预期（如 `chatcmpl-abc123`），也能映射到内部 agent run。

## 五、流式模式（SSE）

```ts
// 流式：监听 agent 事件 → 转换为 chat.completion.chunk

res.setHeader("Content-Type", "text/event-stream");
res.setHeader("Cache-Control", "no-cache");

agentEventEmitter.on("delta", (text) => {
  const chunk = buildChatCompletionChunk({ runId, text, model: resolvedModel });
  res.write(`data: ${JSON.stringify(chunk)}\n\n`);
});

agentEventEmitter.on("done", () => {
  res.write("data: [DONE]\n\n");
  res.end();
});
```

**"兜底补发"机制：** 如果因为某些原因没收到任何 delta（如 agent 直接返回完整结果），代码在执行完成后把整段结果补发一次，防止客户端空白。

## 六、错误处理策略

| 情况 | HTTP 状态码 | 响应格式 |
|------|-----------|---------|
| 鉴权失败 | 401 | `{"error": {...}}` OpenAI 风格 |
| 限速 | 429 | `{"error": {...}}` OpenAI 风格 |
| body 格式错误 | 400 | `{"error": {...}}` OpenAI 风格 |
| agent 执行失败 | 500 | `{"error": {...}}` OpenAI 风格 |

```ts
// OpenAI 风格错误对象
{
  "error": {
    "message": "...",
    "type": "invalid_request_error",
    "code": "...",
  }
}
```

## 七、agentId 解析（两种来源）

```ts
// 方式 1：自定义 Header（推荐）
const agentId = getHeader(req, "X-OpenClaw-Agent");

// 方式 2：model 字段（兼容不支持自定义头的客户端）
// 格式：model="agent/my-agent" 或 model="my-agent"
const agentId = parseAgentFromModel(body.model);
```

未指定 agentId 时，使用默认 agent。

## 八、sessionKey 解析

```ts
// 方式 1：自定义 Header
const sessionKey = getHeader(req, "X-OpenClaw-Session");

// 方式 2：自动生成（每次请求新 session）
const sessionKey = sessionKey ?? generateMainSessionKey(agentId);
```

**注意：** 如果不传 `X-OpenClaw-Session`，每次调用都是独立的新会话，没有上下文记忆。
传入相同的 sessionKey 可以实现多轮对话。

## 九、与标准 OpenAI API 的差异

| 特性 | OpenAI API | OpenClaw 兼容层 |
|------|-----------|----------------|
| Authentication | `Authorization: Bearer sk-...` | Bearer token（gateway 配置） |
| model 字段 | GPT-4、Claude 等 | 可用于指定 agentId |
| system message | 标准 | 合并为 extraSystemPrompt |
| tool/function calls | 原生支持 | 降级处理（转文本） |
| streaming | SSE | SSE（同格式）|
| 额外 header | 无 | `X-OpenClaw-Agent`、`X-OpenClaw-Session` |

## 十、自检清单

1. 只处理 `POST /v1/chat/completions`，其他路径返回 `false`（继续路由）。
2. 鉴权走 `authorizeGatewayConnect`（Bearer token），与 WS 握手复用同一函数。
3. `system`/`developer` 角色的消息合并为 `extraSystemPrompt`，不加入对话历史。
4. 流式模式必须发送 `data: [DONE]\n\n` 作为结束标记。
5. runId 格式 `chatcmpl_xxx` 兼容 OpenAI SDK 对响应 ID 格式的期望。
6. 不传 `X-OpenClaw-Session` 时每次请求创建新 session（无上下文）。

## 十一、开发避坑

1. **model 字段不传给 LLM**：`body.model` 用于解析 agentId，实际使用的模型由 agent 配置决定，不是 OpenAI 原本的 model 语义。
2. **tool_use 消息的处理**：当前实现将 tool_calls/tool_results 降级为文本格式（`normalizeToConversationEntry`），不走真正的 tool call 协议。
3. **Content-Type 检查**：请求必须是 `application/json`，否则 body 解析失败返回 400。
4. **流式连接超时**：SSE 连接长时间没有事件时，某些反向代理会主动断开——建议在 agent 配置中设置合理的 `timeoutMs`。
