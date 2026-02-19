# 21 并发队列与Lane状态机实现实战（session/global 双层排队）

这篇是"并发控制"的实现手册，重点解决三件事：

1. 同会话不乱序。
2. 全局并发可控。
3. 重启后队列不僵死。

## 对应源码入口

- `src/process/command-queue.ts`
- `src/process/lanes.ts`
- `src/agents/pi-embedded-runner/lanes.ts`
- `src/gateway/server-lanes.ts`
- `src/agents/pi-embedded-runner/run.ts`
- `src/agents/pi-embedded-runner/runs.ts`

## 一、核心数据结构

### LaneState（完整字段）

```ts
type LaneState = {
  lane:           string;
  queue:          QueueEntry[];
  activeTaskIds:  Set<number>;
  maxConcurrent:  number;   // 默认 1（串行），setCommandLaneConcurrency 可修改
  draining:       boolean;  // 防重复 pump：true 时不再触发新一轮 drain
  generation:     number;   // 默认 0，resetAllLanes 时递增，让旧回调回写被忽略
};
```

### QueueEntry（完整字段）

```ts
type QueueEntry = {
  task:        () => Promise<unknown>;
  resolve:     (v: unknown) => void;
  reject:      (e: unknown) => void;
  enqueuedAt:  number;
  warnAfterMs: number;                         // 默认 2000ms（源码：opts?.warnAfterMs ?? 2_000）
  onWait?:     (waitedMs: number) => void;     // 触发后仅告警，不取消任务
};
```

超时告警触发条件：`if (waitedMs >= entry.warnAfterMs)` → 调 `onWait` + `diag.warn`。
**不是异常，不取消，只是告警**，让上层感知排队过久。

## 二、双层排队模型（run.ts）

`runEmbeddedPiAgent(...)` 不只排一次队，而是两层：

```ts
const sessionLane = resolveSessionLane(sessionKey || sessionId);
const globalLane  = resolveGlobalLane(params.lane);

// 外层：session 串行（同会话顺序保证）
// 内层：global 限流（跨会话资源门控）
await enqueue(sessionLane, () => enqueue(globalLane, task));
```

这就是"局部有序 + 全局限流"的本质。

### Lane 名称解析规则（源码精确）

```ts
// src/agents/pi-embedded-runner/lanes.ts

export function resolveSessionLane(key: string) {
  const cleaned = key.trim() || CommandLane.Main;
  return cleaned.startsWith("session:") ? cleaned : `session:${cleaned}`;
  // 幂等：已含前缀不再加；空 key 回落 Main
}

export function resolveGlobalLane(lane?: string) {
  const cleaned = lane?.trim();
  return cleaned ? cleaned : CommandLane.Main;
  // 空值默认走 CommandLane.Main
}
```

## 三、状态机流程

### 1) 入队

`enqueueCommandInLane(lane, task, opts)`：

1. 创建/获取 `LaneState`。
2. 记录 `enqueuedAt = Date.now()`，`warnAfterMs = opts?.warnAfterMs ?? 2_000`。
3. `push(entry)` 到 `queue`。
4. `drainLane(state)` 立即尝试拉起执行。

### 2) 出队执行

`drainLane(state)`：

1. `if (state.draining) return` — 防重入。
2. `while active < maxConcurrent && queue.length > 0` 循环拉起任务。
3. 任务成功：`completeTask(state, id)` → resolve + `pump()`。
4. 任务失败：`completeTask(state, id)` → reject + `pump()`（失败也 pump，不饿死后续）。

### 3) Probe Lane 特殊静默

```ts
// command-queue.ts
function isProbeLane(lane: string): boolean {
  return lane.startsWith("auth-probe:") || lane.startsWith("session:probe-");
}
```

probe lane 的任务失败时**不打错误日志**。
探针任务是试错用的，错误是预期行为，记录会产生误导性噪音。

### 4) 清理/恢复

**`clearCommandLane(lane)`**：只取消 queue 里未开始的任务，抛 `CommandLaneClearedError`；
不影响已 active 的任务。

**`resetAllLanes()`**：

```ts
// 源码注释（精确）：
// "Used after SIGUSR1 in-process restarts where interrupted tasks'
//  finally blocks may not run"
```

执行步骤：
1. `state.generation++` — 让旧回调回写时发现 generation 不匹配，直接忽略。
2. `state.activeTaskIds.clear()` — 强制归零（旧 finally 可能永远不跑了）。
3. 保留 `queue`，重新 `drainLane` — 积压任务继续执行。

这是"热重启后不僵死"的关键，generation 机制防止旧 finally 污染新状态。

**`waitForActiveTasks(timeoutMs)`**：

```ts
const POLL_INTERVAL_MS = 50;  // 轮询间隔（源码常量）
// 返回 { drained: boolean }，超时不 reject
```

进入时快照 `activeAtStart`（当前所有 active 任务），每 50ms 检查这批 ID 是否都已完成。
**只等调用时已经 active 的任务**，不等后来新进来的任务。

## 四、并发配置入口

```ts
// src/gateway/server-lanes.ts
export function applyGatewayLaneConcurrency(cfg: Config) {
  setCommandLaneConcurrency(CommandLane.Cron,     cfg.cron?.maxConcurrentRuns ?? 1);
  setCommandLaneConcurrency(CommandLane.Main,     resolveAgentMaxConcurrent(cfg));
  setCommandLaneConcurrency(CommandLane.Subagent, resolveSubagentMaxConcurrent(cfg));
}
```

`setCommandLaneConcurrency` 写完 `maxConcurrent` 后立刻 `drainLane`，
"提高并发"的变更**实时生效**，不等下条消息触发。

热重载时再次调用同一函数，保持运行时与配置一致。

## 五、运行时控制（Active Run Registry）

`runs.ts` 维护 `ACTIVE_EMBEDDED_RUNS: Map<sessionId, EmbeddedPiQueueHandle>`：

```ts
type EmbeddedPiQueueHandle = {
  queueMessage: (msg: string) => boolean;
  isStreaming:  boolean;
  isCompacting: boolean;
  abort:        () => void;
};
```

### setActiveEmbeddedRun

```ts
// 日志区分：首次注册 vs 替换（"run_started" vs "run_replaced"）
ACTIVE_EMBEDDED_RUNS.set(sessionId, handle);
```

### queueEmbeddedPiMessage

返回 `false`（静默失败）的三种场景：
1. `no_active_run`：sessionId 无活动 run
2. `not_streaming`：run 存在但 `isStreaming=false`（还未进入流式阶段）
3. `compacting`：正在压缩上下文（`isCompacting=true`），不接受新消息

### clearActiveEmbeddedRun（handle 匹配校验）

```ts
// runs.ts 精确实现模式
if (ACTIVE_EMBEDDED_RUNS.get(sessionId) === handle) {
  ACTIVE_EMBEDDED_RUNS.delete(sessionId);
}
```

必须 handle 匹配才删除，防止"旧 finally 块误删新 run"的竞态。

### waitForEmbeddedPiRunEnd

```ts
// 默认超时：15000ms
// 最小超时：Math.max(100, timeoutMs)
// 超时返回 false（不 reject）
// run 正常结束返回 true
```

内部维护 `EMBEDDED_RUN_WAITERS: Map<sessionId, Set<(done: boolean) => void>>`，
run 结束时通知所有等待者。

## 六、可复刻最小实现

```ts
// === Lane 状态机 ===
async function runWithLanes(req: Req) {
  const sLane = resolveSessionLane(req.sessionKey);  // "session:xxx"
  const gLane = resolveGlobalLane(req.lane);         // "main" | "cron" | "subagent"
  return enqueue(sLane, () =>
    enqueue(gLane, async () => {
      const handle = { isStreaming: false, isCompacting: false, abort: () => {}, queueMessage: () => false };
      setActiveRun(req.sessionId, handle);
      try {
        return await doWork(req);
      } finally {
        clearActiveRun(req.sessionId, handle);  // handle 必须匹配才清理
      }
    }),
  );
}

// === resetAllLanes（SIGUSR1 热重启）===
function resetAllLanes() {
  for (const state of lanes.values()) {
    state.generation++;
    state.activeTaskIds.clear();
    drainLane(state);  // 让积压任务继续
  }
}
```

## 七、验收清单

1. 同一 session 连发 10 条消息，回复顺序稳定。
2. 两个 session 可并发执行，不互相阻塞。
3. `clearCommandLane` 不会取消已在执行中的任务。
4. `resetAllLanes` 后旧任务回调因 generation 不匹配而被忽略。
5. `waitForActiveTasks(timeout)` 能给出 `drained: true/false`，POLL_INTERVAL=50ms。
6. probe lane 的失败被静默处理，不打错误日志。
7. `clearActiveEmbeddedRun` 做了 handle 匹配，误删新 run 的场景验证。
8. `queueEmbeddedPiMessage` 在压缩中返回 false，不阻塞也不报错。

## 八、常见坑

1. 只有全局队列，没有 session 队列，导致串线。
2. reset 只 clear active，不做 generation，旧回调回写脏状态。
3. `clearActiveRun` 不校验 handle，误删新任务（高并发下必现）。
4. 忘了失败分支继续 pump，队列卡死。
5. probe lane 错误日志轰炸（应判断 isProbeLane 静默）。
6. `waitForActiveTasks` 等待所有队列任务而不是快照时已 active 的 —— 导致永远等不完。
