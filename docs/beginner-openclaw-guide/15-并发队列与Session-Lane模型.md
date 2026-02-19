# 15 并发队列与 Session-Lane 模型

## 模块目标

理解系统如何在并发请求下保持"同会话有序、全局可控"。

## 核心源码入口

- `src/agents/pi-embedded-runner/lanes.ts` — lane 名称解析
- `src/process/command-queue.ts` — 队列调度核心
- `src/process/lanes.ts` — CommandLane 常量定义
- `src/agents/pi-embedded-runner/runs.ts` — 活动运行注册表
- `src/gateway/server-lanes.ts` — 配置→并发映射

## 步骤一：双层排队模型

每次 `runEmbeddedPiAgent(...)` 都会排**两次队**，不是一次：

```
sessionLane = resolveSessionLane(sessionKey)
  → "session:user-abc"（同会话串行）

globalLane = resolveGlobalLane(params.lane)
  → CommandLane.Main（全局限流）

执行：enqueue(sessionLane, () => enqueue(globalLane, task))
```

这就是"局部有序 + 全局限流"的本质。

## 步骤二：Lane 名称规则（源码级）

```ts
// src/agents/pi-embedded-runner/lanes.ts

export function resolveSessionLane(key: string) {
  const cleaned = key.trim() || CommandLane.Main;
  // 幂等：已有 "session:" 前缀则不再加
  return cleaned.startsWith("session:") ? cleaned : `session:${cleaned}`;
}

export function resolveGlobalLane(lane?: string) {
  const cleaned = lane?.trim();
  // 空值默认走 Main lane
  return cleaned ? cleaned : CommandLane.Main;
}
```

`CommandLane` 的三个命名常量：`Main`、`Cron`、`Subagent`。

## 步骤三：QueueEntry 精确字段

```ts
type QueueEntry = {
  task:       () => Promise<unknown>;
  resolve:    (v: unknown) => void;
  reject:     (e: unknown) => void;
  enqueuedAt: number;
  warnAfterMs: number;   // 默认 2000ms，超时触发等待告警
  onWait?:    (waitedMs: number) => void;
};
```

`warnAfterMs` 默认值来自源码：`opts?.warnAfterMs ?? 2_000`。
排队期间每次 drain 循环检查：`if (waitedMs >= entry.warnAfterMs)` → 调 `onWait` + `diag.warn`。

## 步骤四：LaneState 精确字段

```ts
type LaneState = {
  lane:           string;
  queue:          QueueEntry[];
  activeTaskIds:  Set<number>;
  maxConcurrent:  number;   // 默认 1（串行）
  draining:       boolean;  // 防重复 pump
  generation:     number;   // 默认 0，reset 时递增，让旧回调失效
};
```

`generation` 是防"热重启后旧 finally 块写脏状态"的关键。

## 步骤五：Probe Lane 特殊处理

```ts
// command-queue.ts
function isProbeLane(lane: string): boolean {
  return lane.startsWith("auth-probe:") || lane.startsWith("session:probe-");
}
```

probe lane 的任务失败时**不打错误日志**，因为探针本来就是试错用的，报错是预期行为。

## 步骤六：Active Run Registry

`runs.ts` 维护一张 `Map<sessionId, EmbeddedPiQueueHandle>`，是 session 级的运行时控制台：

```ts
type EmbeddedPiQueueHandle = {
  queueMessage: (msg: string) => boolean;   // 流中注入消息
  isStreaming:  boolean;                    // 是否在流式输出
  isCompacting: boolean;                    // 是否在压缩上下文
  abort:        () => void;                 // 终止当前 run
};
```

**三个关键操作：**

1. `queueEmbeddedPiMessage(sessionId, msg)` → 返回 boolean
   - `false`：无活动 run（`no_active_run`）
   - `false`：未在流式阶段（`not_streaming`）
   - `false`：正在压缩（`compacting`）
   - `true`：成功插入

2. `clearActiveEmbeddedRun(sessionId, handle)` — 必须 handle 匹配才清理
   ```ts
   if (ACTIVE_EMBEDDED_RUNS.get(sessionId) === handle) {
     ACTIVE_EMBEDDED_RUNS.delete(sessionId);
   }
   ```
   防止新 run 注册后被旧 finally 块误删。

3. `waitForEmbeddedPiRunEnd(sessionId, timeoutMs)` → `Promise<boolean>`
   - 默认 timeout：`15000ms`
   - 最小 timeout：`Math.max(100, timeoutMs)`
   - 超时返回 `false`，run 结束返回 `true`

## 步骤七：并发配置入口

```ts
// src/gateway/server-lanes.ts
export function applyGatewayLaneConcurrency(cfg: Config) {
  setCommandLaneConcurrency(CommandLane.Cron,     cfg.cron?.maxConcurrentRuns ?? 1);
  setCommandLaneConcurrency(CommandLane.Main,     resolveAgentMaxConcurrent(cfg));
  setCommandLaneConcurrency(CommandLane.Subagent, resolveSubagentMaxConcurrent(cfg));
}
```

热重载时也会再次调用，保持运行时并发数与配置一致。

## 步骤八：resetAllLanes 设计意图

```ts
// command-queue.ts 源码注释（精确）：
// "Used after SIGUSR1 in-process restarts where interrupted tasks'
//  finally blocks may not run"
```

SIGUSR1 进程内重启时，被中断任务的 `finally` 可能不执行，
导致 `activeTaskIds` 残留旧条目——`resetAllLanes()` 通过递增 `generation` + `activeTaskIds.clear()` 强制恢复。

## 自检清单

1. 同一 session 连发多条消息，回复顺序是否稳定。
2. `resolveSessionLane` 对已有 `session:` 前缀的 key 是否幂等。
3. 空 key 是否回落到 `CommandLane.Main`。
4. `warnAfterMs` 超时是否触发告警（而不是报错终止）。
5. probe lane 的失败是否被静默处理。
6. `clearActiveEmbeddedRun` 是否做了 handle 匹配校验。
7. `waitForEmbeddedPiRunEnd` 超时返回 `false` 而不是 `reject`。
