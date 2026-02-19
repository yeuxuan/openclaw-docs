# 52 函数级剖析：exec-approval-manager

核心文件：`src/gateway/exec-approval-manager.ts`

## 模块定位

高风险命令（exec）执行前的人工审批状态机。
所有审批请求在这里注册、等待、决策，不接触文件系统，纯内存状态机。

## 一、核心数据结构（源码精确）

```ts
// exec-approval-manager.ts

const RESOLVED_ENTRY_GRACE_MS = 15_000;  // 已决条目保留 15 秒

type PendingEntry = {
  record:  ExecApprovalRecord;
  resolve: (decision: ExecApprovalDecision | null) => void;
  reject:  (err: Error) => void;
  timer:   ReturnType<typeof setTimeout>;
  promise: Promise<ExecApprovalDecision | null>;
};

export type ExecApprovalRecord = {
  id:                      string;
  request:                 ExecApprovalRequestPayload;
  createdAtMs:             number;
  expiresAtMs:             number;
  // 审批请求方元数据（best-effort，防止其他客户端重放审批 ID）
  requestedByConnId?:      string | null;
  requestedByDeviceId?:    string | null;
  requestedByClientId?:    string | null;
  resolvedAtMs?:           number;
  decision?:               ExecApprovalDecision;
  resolvedBy?:             string | null;
};
```

**全局默认值（`src/infra/exec-approvals.ts`）：**

```ts
export const DEFAULT_EXEC_APPROVAL_TIMEOUT_MS = 120_000;  // 120 秒

const DEFAULT_SECURITY:          ExecSecurity = "deny";
const DEFAULT_ASK:               ExecAsk      = "on-miss";
const DEFAULT_ASK_FALLBACK:      ExecSecurity = "deny";
const DEFAULT_AUTO_ALLOW_SKILLS              = false;
const DEFAULT_SOCKET = "~/.openclaw/exec-approvals.sock";
const DEFAULT_FILE   = "~/.openclaw/exec-approvals.json";
```

## 二、四个方法的精确行为

### create(request, timeoutMs, id?)

```ts
create(request, timeoutMs, id?): ExecApprovalRecord {
  const now = Date.now();
  const resolvedId = id && id.trim().length > 0 ? id.trim() : randomUUID();
  return { id: resolvedId, request, createdAtMs: now, expiresAtMs: now + timeoutMs };
}
```

只生成记录，**不写入 pending map**。注册是 `register()` 的职责，两步分离保证"先注册再回 accepted"的时序约束。

### register(record, timeoutMs)

```ts
register(record, timeoutMs): Promise<ExecApprovalDecision | null> {
  const existing = this.pending.get(record.id);
  if (existing) {
    if (existing.record.resolvedAtMs === undefined) return existing.promise;  // 幂等
    throw new Error(`approval id '${record.id}' already resolved`);          // 拒绝重注册
  }
  // 同步写入 pending map，返回 Promise
  // 超时后 resolve(null)，不 reject
}
```

**必须先调 `register()` 再发 "accepted" 响应**（源码注释：`"This ensures the approval ID is valid immediately after the 'accepted' response."`）。

### resolve(recordId, decision, resolvedBy?)

```ts
resolve(recordId, decision, resolvedBy?): boolean {
  const pending = this.pending.get(recordId);
  if (!pending) return false;
  if (pending.record.resolvedAtMs !== undefined) return false;  // 防双重决策
  clearTimeout(pending.timer);
  pending.record.resolvedAtMs = Date.now();
  pending.record.decision     = decision;
  pending.record.resolvedBy   = resolvedBy ?? null;
  pending.resolve(decision);  // resolve Promise
  setTimeout(() => {
    // 只有 map 中还是同一个 entry 才删（防误删新注册的同 id 条目）
    if (this.pending.get(recordId) === pending) this.pending.delete(recordId);
  }, RESOLVED_ENTRY_GRACE_MS);
  return true;
}
```

### awaitDecision(id) + getSnapshot(id)

```ts
awaitDecision(id): Promise<...> | null  // 找不到返回 null（不抛）
getSnapshot(id):   ExecApprovalRecord | null
```

`waitDecision` 时必须在 await 前先调 `getSnapshot`，因为 grace 期结束后条目会被删除，await 之后就取不到了（源码注释：`"Capture snapshot before await (entry may be deleted after grace period)"`）。

## 三、三个 RPC 方法（server-methods/exec-approval.ts）

### exec.approval.request（精确时序）

```ts
// 1. 参数校验
// 2. manager.create(request, timeoutMs, explicitId)
// 3. 写入 requestedByConnId/DeviceId/ClientId（best-effort 元数据）
// 4. manager.register(record, timeoutMs)  ← 同步写入 pending，必须在响应前
// 5. broadcast "exec.approval.requested"（dropIfSlow: true）
// 6. forwarder?.handleRequested(...)（fire-and-forget）
// 7. if twoPhase: respond({ status: "accepted", id, createdAtMs, expiresAtMs })
// 8. await decisionPromise
// 9. respond({ id, decision, createdAtMs, expiresAtMs })
```

`twoPhase=true` 时走两阶段协议：先回 `accepted`，再等最终 decision。
单阶段（`twoPhase=false`，旧语义）直接等到 decision 才回一次响应。

### exec.approval.waitDecision

```ts
// 1. manager.awaitDecision(id) → null 表示不存在
// 2. 不存在 → error "approval expired or not found"
// 3. manager.getSnapshot(id) ← 在 await 之前，防 grace 过期后取不到
// 4. await decision（可能是 null = timeout）
// 5. respond({ id, decision, createdAtMs, expiresAtMs })
```

### exec.approval.resolve

```ts
// 1. 校验 decision 必须是 "allow-once" | "allow-always" | "deny"
// 2. resolvedBy = client.connect.client.displayName ?? client.connect.client.id
// 3. manager.resolve(id, decision, resolvedBy) → false = 已过期或不存在
// 4. broadcast "exec.approval.resolved"（dropIfSlow: true）
// 5. forwarder?.handleResolved(...)（fire-and-forget）
// 6. respond({ ok: true })
```

## 四、ExecSecurity 与 ExecAsk 类型

```ts
type ExecSecurity = "deny" | "allowlist" | "full";
type ExecAsk      = "off"  | "on-miss"   | "always";
```

审批判定规则（`requiresExecApproval`）：
- `always`：一律人工审批
- `on-miss + allowlist`：命令不满足白名单 OR 分析失败 → 审批
- 其他情况：不审批

## 五、最小复刻骨架（含 grace 窗口）

```ts
const GRACE_MS = 15_000;
type Decision = "allow-once" | "allow-always" | "deny" | null;
type Entry = {
  record:   { id: string; resolvedAtMs?: number; decision?: Decision; resolvedBy?: string | null };
  resolve:  (d: Decision) => void;
  promise:  Promise<Decision>;
  timer:    ReturnType<typeof setTimeout>;
};

const pending = new Map<string, Entry>();

function register(id: string, timeoutMs: number): Promise<Decision> {
  const exist = pending.get(id);
  if (exist && !exist.record.resolvedAtMs) return exist.promise;  // 幂等
  if (exist?.record.resolvedAtMs)          throw new Error("already resolved");

  let done!: (d: Decision) => void;
  const promise = new Promise<Decision>((r) => (done = r));
  const entry: Entry = {
    record: { id },
    resolve: done,
    promise,
    timer: setTimeout(() => {
      entry.record.resolvedAtMs = Date.now();
      done(null);  // 超时 → null，不 reject
      setTimeout(() => { if (pending.get(id) === entry) pending.delete(id); }, GRACE_MS);
    }, timeoutMs),
  };
  pending.set(id, entry);
  return promise;
}

function resolveDecision(id: string, decision: Exclude<Decision, null>, by?: string): boolean {
  const entry = pending.get(id);
  if (!entry || entry.record.resolvedAtMs !== undefined) return false;  // 幂等拒绝
  clearTimeout(entry.timer);
  entry.record.resolvedAtMs = Date.now();
  entry.record.decision     = decision;
  entry.record.resolvedBy   = by ?? null;
  entry.resolve(decision);
  setTimeout(() => { if (pending.get(id) === entry) pending.delete(id); }, GRACE_MS);
  return true;
}
```

## 六、自检清单

1. `register()` 在 `create()` 之后、"accepted" 响应之前同步调用。
2. 同一 id 二次 `register()`（未决）返回同一 Promise（幂等）。
3. 同一 id 已决后再 `register()` 抛错。
4. `resolve()` 二次调用返回 `false`（幂等拒绝）。
5. `waitDecision` 里 `getSnapshot` 在 await 之前调用。
6. 超时结果是 `null`，不是 `reject`。
7. `resolve()` 的删除定时器先校验 `map.get(id) === entry` 再删除。
8. `twoPhase=false` 时只有一次响应（等待最终 decision）。
