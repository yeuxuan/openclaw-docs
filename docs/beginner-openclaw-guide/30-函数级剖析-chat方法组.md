# 30 函数级剖析：chat 方法组

核心文件：`src/gateway/server-methods/chat.ts`

## 模块定位

chat 方法组负责**会话交互**的全部入口：发送消息（chat.send）、中止运行（chat.abort）、注入 assistant 消息（chat.inject）、查询历史（chat.history）。

## 一、chat.send（完整流程）

### 参数签名

```ts
// chat.send 请求参数

params: {
  sessionKey: string;
  message: string;
  thinking?: boolean;
  deliver?: boolean;
  attachments?: Attachment[];
  timeoutMs?: number;
  idempotencyKey?: string;
}
```

### 幂等检查

```ts
// context.dedupe 防止重复发送

const clientRunId = params.idempotencyKey ?? generateRunId();
const dedupeKey = `chat:${clientRunId}`;

// 1. dedupe 命中（已有相同 key 的运行结果）→ 返回缓存
const cached = context.dedupe.get(dedupeKey);
if (cached) return cached;

// 2. chatAbortControllers 中已有运行 → 返回 in_flight
const existing = chatAbortControllers.get(clientRunId);
if (existing) return { status: "in_flight", runId: clientRunId };

// 3. 否则创建新 AbortController，注册到 chatAbortControllers
```

### ChatAbortControllerEntry 类型

```ts
type ChatAbortControllerEntry = {
  controller: AbortController;
  sessionId: string;
  sessionKey: string;
  startedAtMs: number;
  expiresAtMs: number;   // 自动过期，防止泄漏
};

// 存储结构
const chatAbortControllers: Map<string, ChatAbortControllerEntry> = new Map();
```

### 执行时序

```
chat.send 收到
    │
    ▼
1. 校验参数 + 附件格式
2. 识别 stop 命令（直接 abortChatRunsForSessionKey）
3. 幂等检查（dedupe + abortControllers）
4. 立即回 ACK：{ status: "started", runId }
    │
    ▼
5. 异步触发 agent 执行（不阻塞当前帧）
    │
    ▼
6. 执行完成后 broadcastChatFinal(...)
```

**为什么先 ACK 再执行：** 前端能立刻显示"任务已开始"，不阻塞等待模型完成。

## 二、chat.abort

### abortChatRunById

```ts
// 按 runId 中止，验证 sessionKey 归属

function abortChatRunById(
  ops: ChatOps,
  params: { runId: string; sessionKey: string; stopReason?: string }
): { aborted: boolean }

// 安全检查：确认 runId 对应的 sessionKey 与参数一致才允许中止
// 防止跨会话中止他人的 run
```

### abortChatRunsForSessionKey

```ts
// 按 sessionKey 中止所有运行

function abortChatRunsForSessionKey(
  ops: ChatOps,
  params: { sessionKey: string; stopReason?: string }
): { aborted: boolean; runIds: string[] }

// 找出所有 chatAbortControllers 中 sessionKey 匹配的 entry
// 逐一调用 controller.abort()
// 返回被中止的 runId 列表
```

## 三、chat.inject（直接注入 assistant 消息）

### 参数与流程

```ts
// chat.inject 参数
params: {
  sessionKey: string;
  message: string;
  label?: string;    // 可选显示标签
}
```

### appendAssistantTranscriptMessage

```ts
// 内部调用链

const { messageId } = await appendAssistantTranscriptMessage({
  sessionKey: params.sessionKey,
  message: params.message,
  label: params.label,
});

// appendAssistantTranscriptMessage 内部：
// 1. 通过 sessionKey 解析 transcriptPath
// 2. SessionManager.open(transcriptPath).appendMessage(messageBody)
//    ← 必须用 SessionManager，不能直接 JSONL 追加！
//    原因：Pi transcript 是 parentId 链，手工追加会断链
```

### 广播

```ts
// inject 完成后，广播到前端（不经过模型调用）

await broadcastChatFinal({
  sessionKey: params.sessionKey,
  runId: `inject-${messageId}`,   // ← inject 特有的 runId 前缀
  state: "final",
  payloads: [{ text: params.message }],
});
```

## 四、broadcastChatFinal（双路广播）

```ts
// 双路广播：所有 WS 客户端 + 特定 session 的 node

function broadcastChatFinal(params: ChatFinalParams) {
  // 路 1：广播给所有已连接的 WS operator 客户端
  context.broadcast("chat", payload);

  // 路 2：通过 node 协议发给 session 关联的 node
  context.nodeSendToSession(params.sessionKey, "chat", payload);

  // 清理 run 映射
  agentRunSeq.delete(params.runId);
}
```

## 五、chat.history

```ts
// 读取会话 transcript 消息

params: {
  sessionKey: string;
  limit?: number;        // 消息数量上限
  byteLimit?: number;    // 字节数上限
}

// 返回
{
  messages: TranscriptMessage[];
  thinking: boolean;       // 是否启用 thinking 模式
  verbose: boolean;        // 是否启用 verbose 模式
  sessionConfig: {...};    // 其他会话配置
}
```

- 去 envelope（移除内部元数据包装）
- 做字节上限裁剪（`byteLimit` 从最新消息向前截）
- 返回 thinking/verbose 等会话侧配置

## 六、完整数据流

```
客户端 chat.send
    │
    ├─ [幂等] dedupe.get(chat:runId) → 缓存命中直接返回
    │
    ├─ [并发保护] abortControllers.has(runId) → in_flight
    │
    └─ [新运行]
           │
           ▼
       立即回 {status: "started", runId}
           │
           ▼
       异步 agentCommand(...)
           │
           ▼
       (流式) server-chat.ts 把 assistant 事件 → chat delta
           │
           ▼
       完成后 broadcastChatFinal
           │
           ├── context.broadcast("chat", payload)    → 所有 WS 客户端
           └── context.nodeSendToSession(...)         → 关联 node
```

## 七、自检清单

1. `idempotencyKey` 由客户端提供（可选），系统也会生成 `clientRunId` 作为 fallback。
2. `ChatAbortControllerEntry.expiresAtMs` 确保长时间无活动的 controller 自动过期，不泄漏内存。
3. `abortChatRunById` 会校验 `sessionKey` 归属，防止跨会话中止。
4. `chat.inject` 的 `runId` 格式为 `inject-${messageId}`，区别于正常的 `chat:${clientRunId}`。
5. `appendAssistantTranscriptMessage` 必须通过 `SessionManager.appendMessage`，不能裸写 JSONL。
6. `broadcastChatFinal` 同时走 `context.broadcast`（全 WS）和 `context.nodeSendToSession`（特定 node）两路。

## 八、开发避坑

1. **不要直接写 transcript 文件**：Pi transcript 是 `parentId` 链，手工 JSONL 追加会导致断链，后续 compaction/history 读取出错。必须用 `SessionManager.appendMessage`。
2. **stop 命令是特殊路径**：`message` 内容被识别为 stop 指令时，直接调用 `abortChatRunsForSessionKey`，不走正常的 agent 执行路径。
3. **attach 附件有大小限制**：超过限制在入口即报错，不会流转到 agent 层。
4. **chat delta 不来自 chat.ts**：流式 token 来自 `server-chat.ts` 的 agent 事件总线，`chat.ts` 只负责启动和收尾。
