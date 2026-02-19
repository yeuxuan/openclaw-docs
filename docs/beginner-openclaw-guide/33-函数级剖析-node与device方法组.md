# 33 函数级剖析：node 与 device 方法组

核心文件：
- `src/gateway/server-methods/nodes.ts`
- `src/gateway/node-registry.ts`
- `src/gateway/server-methods/devices.ts`
- `src/gateway/server-node-subscriptions.ts`
- `src/gateway/server-node-events.ts`
- `src/gateway/node-invoke-sanitize.ts`
- `src/gateway/node-command-policy.ts`

## 模块定位

Node 方法组负责"远端节点"（手机/IoT/桌面客户端）的双向通信：operator 可向节点发指令并等待结果，节点也可主动发事件触发 agent。Device 方法组负责设备配对和 token 管理。

## 一、NodeRegistry（精确字段类型）

```ts
// src/gateway/node-registry.ts  行 38-41

export class NodeRegistry {
  private nodesById = new Map<string, NodeSession>();       // key=nodeId
  private nodesByConn = new Map<string, string>();          // key=connId, value=nodeId
  private pendingInvokes = new Map<string, PendingInvoke>(); // key=requestId (randomUUID)
```

**PendingInvoke 类型（行 23-29）：**
```ts
type PendingInvoke = {
  nodeId: string;
  command: string;
  resolve: (value: NodeInvokeResult) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
```

三类状态的作用：
| Map | key | 用途 |
|-----|-----|------|
| `nodesById` | nodeId | 查询节点会话信息 |
| `nodesByConn` | connId | 连接断开时找到对应 nodeId 清理 |
| `pendingInvokes` | requestId (UUID) | 等待节点返回结果 |

## 二、invoke 方法（行 107-155）

```ts
// src/gateway/node-registry.ts

async invoke(params: {
  nodeId: string;
  command: string;
  params?: unknown;
  timeoutMs?: number;
  idempotencyKey?: string;
}): Promise<NodeInvokeResult> {
  // ...
  const timeoutMs = typeof params.timeoutMs === "number" ? params.timeoutMs : 30_000; // 行 138
  return await new Promise<NodeInvokeResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      this.pendingInvokes.delete(requestId);
      resolve({
        ok: false,
        error: { code: "TIMEOUT", message: "node invoke timed out" },
      });
    }, timeoutMs);
    this.pendingInvokes.set(requestId, {
      nodeId: params.nodeId,
      command: params.command,
      resolve, reject, timer,
    });
  });
}
```

**默认超时：30_000 ms（30 秒）**。超时后 Promise resolve（而非 reject），返回 `{ ok: false, error: { code: "TIMEOUT" } }`。

## 三、handleInvokeResult（行 157-181）

```ts
// src/gateway/node-registry.ts

handleInvokeResult(params: {
  id: string;       // requestId
  nodeId: string;   // 双重校验：requestId 对上了还要验 nodeId
  ok: boolean;
  payload?: unknown;
  payloadJSON?: string | null;
  error?: { code?: string; message?: string } | null;
}): boolean {
  const pending = this.pendingInvokes.get(params.id);
  if (!pending) return false;           // 不存在（超时已清理或重复回调）
  if (pending.nodeId !== params.nodeId) return false;  // nodeId 不匹配，拒绝
  clearTimeout(pending.timer);
  this.pendingInvokes.delete(params.id);
  pending.resolve({
    ok: params.ok,
    payload: params.payload,
    payloadJSON: params.payloadJSON ?? null,
    error: params.error ?? null,
  });
  return true;
}
```

**requestId + nodeId 双重校验：** 防止恶意节点用别人的 requestId 抢答，造成安全漏洞。
**迟到结果：** 超时后迟来的 result 因 `pendingInvokes.delete` 已执行，`get` 返回 undefined，return false（静默丢弃）。

## 四、sanitizeNodeInvokeParamsForForwarding

```ts
// src/gateway/node-invoke-sanitize.ts

export function sanitizeNodeInvokeParamsForForwarding(opts: {
  command: string;
  rawParams: unknown;
  client: GatewayClient | null;
  execApprovalManager?: ExecApprovalManager;
}):
  | { ok: true; params: unknown }
  | { ok: false; message: string; details?: Record<string, unknown> }
{
  if (opts.command === "system.run") {
    // 委托到专用审批模块做 exec 审批检查
    return sanitizeSystemRunParamsForForwarding({
      rawParams: opts.rawParams,
      client: opts.client,
      execApprovalManager: opts.execApprovalManager,
    });
  }
  // 其他命令直接透传 rawParams，不做任何清洗
  return { ok: true, params: opts.rawParams };
}
```

**结论：** 只有 `system.run` 需要额外审批处理，其他命令原样转发。

## 五、DEFAULT_DANGEROUS_NODE_COMMANDS

```ts
// src/gateway/node-command-policy.ts

export const DEFAULT_DANGEROUS_NODE_COMMANDS = [
  ...CAMERA_DANGEROUS_COMMANDS,    // ["camera.snap", "camera.clip"]
  ...SCREEN_DANGEROUS_COMMANDS,    // ["screen.record"]
  ...CONTACTS_DANGEROUS_COMMANDS,  // ["contacts.add"]
  ...CALENDAR_DANGEROUS_COMMANDS,  // ["calendar.add"]
  ...REMINDERS_DANGEROUS_COMMANDS, // ["reminders.add"]
  ...SMS_DANGEROUS_COMMANDS,       // ["sms.send"]
];
```

这些命令在 operator 未显式开放时默认拒绝。运行时白名单由 `resolveNodeCommandAllowlist(cfg, node)` 按平台生成：

```ts
export function resolveNodeCommandAllowlist(
  cfg: OpenClawConfig,
  node?: Pick<NodeSession, "platform" | "deviceFamily">,
): Set<string>
```

平台默认集：ios / android / macos / linux / windows / unknown，各自有不同的可用命令集。

## 六、node.event 的 7 种类型

```ts
// src/gateway/server-node-events.ts

export const handleNodeEvent = async (ctx: NodeEventContext, nodeId: string, evt: NodeEvent) => {
  switch (evt.event) {
    case "voice.transcript":   // 语音转录 → 触发 agentCommand
    case "agent.request":      // 节点发起代理请求（带 deliver/channel/to/timeout）
    case "chat.subscribe":     // 订阅 sessionKey 推送
    case "chat.unsubscribe":   // 取消订阅
    case "exec.started":       // exec 开始 → enqueueSystemEvent
    case "exec.finished":      // exec 结束（含 exitCode/timedOut/output）
    case "exec.denied":        // exec 被拒绝（含 reason/command）
    default:
      return;
  }
};
```

**NodeEvent 类型：**
```ts
export type NodeEvent = {
  event: string;          // 字符串匹配，非 enum
  payloadJSON?: string | null;
};
```

## 七、节点订阅管理

订阅关系由 `createNodeSubscriptionManager()` 管理，维护 node → session 双向索引：

```
node.event("chat.subscribe")
    │
    ▼
subscriptionManager.subscribe(nodeId, sessionKey)
    │
    ▼
session 有推送时 → subscriptionManager.getNodeIds(sessionKey) → 广播
```

- 支持按 sessionKey 精准广播（只推送订阅了该 session 的节点）
- 节点断开时自动清理所有订阅

## 八、devices 方法组

```ts
// src/gateway/server-methods/devices.ts

"device.pair.list"    // 返回: { pending: PendingRequest[], paired: PairedDevice[] }
"device.pair.approve" // params: { requestId }; 成功后广播 device.pair.resolved{ decision:"approved" }
"device.pair.reject"  // params: { requestId }; 成功后广播 device.pair.resolved{ decision:"rejected" }
"device.token.rotate" // params: { deviceId, role, scopes? }; 返回新 token
"device.token.revoke" // params: { deviceId, role }; 返回 revokedAtMs
```

## 九、summarizeDeviceTokens（token 脱敏）

```ts
// src/infra/device-pairing.ts

export function summarizeDeviceTokens(
  tokens: Record<string, DeviceAuthToken> | undefined,
): DeviceAuthTokenSummary[] | undefined {
  if (!tokens) return undefined;
  const summaries = Object.values(tokens)
    .map((token) => ({
      role: token.role,
      scopes: token.scopes,
      createdAtMs: token.createdAtMs,
      rotatedAtMs: token.rotatedAtMs,
      revokedAtMs: token.revokedAtMs,
      lastUsedAtMs: token.lastUsedAtMs,
      // 注意：token.token（明文 token 字符串）被完全省略
    }))
    .toSorted((a, b) => a.role.localeCompare(b.role));
  return summaries.length > 0 ? summaries : undefined;
}

export type DeviceAuthTokenSummary = {
  role: string;
  scopes: string[];
  createdAtMs: number;
  rotatedAtMs?: number;
  revokedAtMs?: number;
  lastUsedAtMs?: number;
  // 无 token 字段 —— 这就是"脱敏"
};
```

**脱敏原则：** 去掉 `token` 明文字段，只保留元信息（角色、权限、时间戳）。

## 十、自检清单

1. `pendingInvokes` key 是 `randomUUID()`，不是业务 ID，防止碰撞。
2. `handleInvokeResult` 必须同时匹配 requestId AND nodeId，缺一不可。
3. invoke 超时后 resolve（不是 reject），上层可正常处理超时返回值。
4. 只有 `system.run` 走 exec 审批链，其他命令直接透传参数。
5. `summarizeDeviceTokens` 完全省略 `token.token` 字段，token 不会通过 pair.list 泄露。

## 十一、开发避坑

1. **`system.execApprovals.*` 必须走专用审批方法**：不能通过 `node.invoke` 直接调用，nodes.ts 里有明确检查。
2. **迟到的 invoke result 静默丢弃**：不报错，调用方已拿到 TIMEOUT 结果，后续 result 无用。
3. **voice.transcript 触发完整 agent run**：不是简单消息转发，会走 agentCommand 完整链路。
4. **device.pair.resolved 是广播事件**：所有连接的客户端（包括 admin UI）都会收到，可用于实时更新配对状态。
