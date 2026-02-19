# 31 函数级剖析：send 与 agent 方法组

核心文件：
- `src/gateway/server-methods/send.ts`
- `src/gateway/server-methods/agent.ts`
- `src/gateway/protocol/schema/agent.ts`

## 模块定位

`send` 和 `agent` 是 gateway 最核心的两条对外方法：`send` 负责消息投递，`agent` 负责驱动智能体执行。两者都有幂等去重机制，但实现细节有差异。

## 一、inflightByContext —— 并发幂等屏障

```ts
// src/gateway/server-methods/send.ts  行 31-43

type InflightResult = {
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: ReturnType<typeof errorShape>;
  meta?: Record<string, unknown>;
};

const inflightByContext = new WeakMap<
  GatewayRequestContext,
  Map<string, Promise<InflightResult>>
>();

const getInflightMap = (context: GatewayRequestContext) => {
  let inflight = inflightByContext.get(context);
  if (!inflight) {
    inflight = new Map();
    inflightByContext.set(context, inflight);
  }
  return inflight;
};
```

**设计思路：**
- 外层 `WeakMap` 以 `GatewayRequestContext` 为 key，连接断开时自动 GC
- 内层 `Map<string, Promise>` 共享同一 idempotencyKey 的飞行中请求
- 同 key 并发请求复用同一 Promise，只真正发送一次

**内层 Map 的 key 格式（精确字符串）：**
```
send:${idempotencyKey}   // send 方法（行 71）
poll:${idempotencyKey}   // poll 方法（行 287）
```

## 二、去重两层机制

`send.ts` 同时有两层幂等保护：

```ts
// 第一层：context.dedupe（历史结果缓存，跨请求）
const dedupeKey = `send:${idem}`;
const cached = context.dedupe.get(dedupeKey);
if (cached) {
  respond(cached.ok, cached.payload, cached.error, { cached: true });
  return;
}

// 第二层：inflightByContext（同 key 并发合并同一 Promise）
const inflight = getInflightMap(context);
const existing = inflight.get(dedupeKey);
if (existing) {
  const result = await existing;
  respond(result.ok, result.payload, result.error);
  return;
}
```

| 层次 | 作用 | 范围 |
|------|------|------|
| `context.dedupe` | 已完成请求的结果缓存 | 跨连接生命周期 |
| `inflightByContext` | 飞行中请求并发合并 | 单次连接上下文 |

## 三、SendParamsSchema（精确 TypeBox 定义）

```ts
// src/gateway/protocol/schema/agent.ts  行 16-29

export const SendParamsSchema = Type.Object(
  {
    to: NonEmptyString,
    message: Type.Optional(Type.String()),
    mediaUrl: Type.Optional(Type.String()),
    mediaUrls: Type.Optional(Type.Array(Type.String())),
    gifPlayback: Type.Optional(Type.Boolean()),
    channel: Type.Optional(Type.String()),
    accountId: Type.Optional(Type.String()),
    /** Optional session key for mirroring delivered output back into the transcript. */
    sessionKey: Type.Optional(Type.String()),
    idempotencyKey: NonEmptyString,       // 必填（幂等键）
  },
  { additionalProperties: false },
);
```

## 四、AgentParamsSchema（精确 TypeBox 定义）

```ts
// src/gateway/protocol/schema/agent.ts  行 54-96

export const AgentParamsSchema = Type.Object(
  {
    message: NonEmptyString,              // 必填
    agentId: Type.Optional(NonEmptyString),
    to: Type.Optional(Type.String()),
    replyTo: Type.Optional(Type.String()),
    sessionId: Type.Optional(Type.String()),
    sessionKey: Type.Optional(Type.String()),
    thinking: Type.Optional(Type.String()),
    deliver: Type.Optional(Type.Boolean()),
    attachments: Type.Optional(Type.Array(Type.Unknown())),
    channel: Type.Optional(Type.String()),
    replyChannel: Type.Optional(Type.String()),
    accountId: Type.Optional(Type.String()),
    replyAccountId: Type.Optional(Type.String()),
    threadId: Type.Optional(Type.String()),
    groupId: Type.Optional(Type.String()),
    groupChannel: Type.Optional(Type.String()),
    groupSpace: Type.Optional(Type.String()),
    timeout: Type.Optional(Type.Integer({ minimum: 0 })),
    lane: Type.Optional(Type.String()),
    extraSystemPrompt: Type.Optional(Type.String()),
    inputProvenance: Type.Optional(
      Type.Object(
        {
          kind: Type.String({ enum: [...INPUT_PROVENANCE_KIND_VALUES] }),
          sourceSessionKey: Type.Optional(Type.String()),
          sourceChannel: Type.Optional(Type.String()),
          sourceTool: Type.Optional(Type.String()),
        },
        { additionalProperties: false },
      ),
    ),
    idempotencyKey: NonEmptyString,
    label: Type.Optional(SessionLabelString),
    spawnedBy: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);
```

## 五、sendPolicy 检查（agent 方法）

```ts
// src/gateway/server-methods/agent.ts  行 279-286

const sendPolicy = resolveSendPolicy({
  cfg,
  entry,
  sessionKey: canonicalKey,
  channel: entry?.channel,
  chatType: entry?.chatType,
});
if (sendPolicy === "deny") {
  respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "send blocked by session policy"));
  return;
}
```

```ts
// src/sessions/send-policy.ts

export type SessionSendPolicyDecision = "allow" | "deny";

export function normalizeSendPolicy(raw?: string | null): SessionSendPolicyDecision | undefined {
  const value = raw?.trim().toLowerCase();
  if (value === "allow") return "allow";
  if (value === "deny")  return "deny";
  return undefined;
}
```

## 六、agent 方法的「先接单后执行」

`agent` 方法不是阻塞型 RPC，设计为：

```ts
// 行 388（立刻写入 accepted）
context.dedupe.set(`agent:${idem}`, { ts: Date.now(), ok: true, payload: accepted });
respond(true, accepted);   // 立刻返回 "accepted"

// 后台异步执行
void (async () => {
  const result = await agentCommand(...);
  // 行 440（完成写入）
  context.dedupe.set(`agent:${idem}`, { ts: Date.now(), ok: true, payload });
  // 行 456（失败写入）
  context.dedupe.set(`agent:${idem}`, { ts: Date.now(), ok: false, payload, error });
})();
```

**为什么要先接单：**
- agent run 可能很长（模型推理 + 工具调用 + 子代理）
- 不能让网关请求线程长期阻塞
- accepted 中的 runId 可用于后续 `agent.wait` 轮询

## 七、deliverOutboundPayloads（含 mirror）

```ts
// src/infra/outbound/deliver.ts

export async function deliverOutboundPayloads(params: {
  cfg: OpenClawConfig;
  channel: Exclude<OutboundChannel, "none">;
  to: string;
  accountId?: string;
  payloads: ReplyPayload[];
  replyToId?: string | null;
  threadId?: string | number | null;
  identity?: OutboundIdentity;
  deps?: OutboundSendDeps;
  gifPlayback?: boolean;
  abortSignal?: AbortSignal;
  bestEffort?: boolean;
  onError?: (err: unknown, payload: NormalizedOutboundPayload) => void;
  onPayload?: (payload: NormalizedOutboundPayload) => void;
  mirror?: {
    sessionKey: string;   // providedSessionKey 或 derivedRoute.sessionKey
    agentId?: string;     // resolveSessionAgentId({ sessionKey, config: cfg }) 推导
    text?: string;
    mediaUrls?: string[];
  };
  silent?: boolean;
  skipQueue?: boolean;   // @internal：跳过写前队列（崩溃恢复用）
}): Promise<OutboundDeliveryResult[]>
```

**mirror 的作用：** 把发送内容回写到会话历史，保证"发出去的内容"在 session transcript 中可追踪。

## 八、resolveAgentDeliveryPlan

```ts
// src/infra/outbound/agent-delivery.ts

export type AgentDeliveryPlan = {
  baseDelivery: SessionDeliveryTarget;
  resolvedChannel: GatewayMessageChannel;
  resolvedTo?: string;
  resolvedAccountId?: string;
  resolvedThreadId?: string | number;
  deliveryTargetMode?: ChannelOutboundTargetMode;
};

export function resolveAgentDeliveryPlan(params: {
  sessionEntry?: SessionEntry;
  requestedChannel?: string;
  explicitTo?: string;
  explicitThreadId?: string | number;
  accountId?: string;
  wantsDelivery: boolean;
}): AgentDeliveryPlan
```

## 九、parseMessageWithAttachments（send 与 agent 共用）

```ts
// src/gateway/chat-attachments.ts

export async function parseMessageWithAttachments(
  message: string,
  attachments: ChatAttachment[] | undefined,
  opts?: { maxBytes?: number; log?: AttachmentLog },
): Promise<{
  message: string;
  images: Array<{ type: "image"; data: string; mimeType: string }>;
}>
```

**为什么 agent 也走这个函数：** WebUI/WS 客户端可以统一传图，底层执行链不区分来源。

## 十、自检清单

1. `inflightByContext` 是 `WeakMap`，连接断开时自动 GC，不会内存泄漏。
2. `context.dedupe` key 格式 `send:${idem}` / `poll:${idem}` / `agent:${idem}`，三者前缀不同不会碰撞。
3. `sendPolicy === "deny"` 时立刻返回 `INVALID_REQUEST`，不进入 agent 执行。
4. `agent` 方法的 dedupe 写了两次：先写 accepted，后写最终结果。
5. mirror 写回 session 需要 sessionKey（由 send.ts 推导，非 agent 强制要求）。

## 十一、开发避坑

1. **`deliver: false` 不等于不运行**：`agent` 的 deliver 控制是否把结果发到通道，agent 本身仍然执行。
2. **`inflightByContext` 不持久化**：进程重启后飞行中请求丢失；crash-recovery 靠 `context.dedupe` 持久化层。
3. **`agent` 的 `inputProvenance.kind`**：枚举值来自 `INPUT_PROVENANCE_KIND_VALUES`，不可随意传字符串。
4. **additionalProperties: false**：两个 schema 均为严格模式，多余字段导致验证失败（返回 400）。
