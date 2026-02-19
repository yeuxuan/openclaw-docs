# 48 函数级剖析：server-lanes

核心文件：`src/gateway/server-lanes.ts`

## 模块定位

这是"配置 → 并发控制"的唯一桥接点。
Gateway 启动、热重载时都会调它，不走这里，`config` 里改的并发数不会真正生效。

## 步骤一：applyGatewayLaneConcurrency 精确实现

```ts
// src/gateway/server-lanes.ts（源码结构）
export function applyGatewayLaneConcurrency(cfg: Config) {
  // Cron lane：定时任务并发上限
  setCommandLaneConcurrency(CommandLane.Cron, cfg.cron?.maxConcurrentRuns ?? 1);

  // Main lane：主智能体回合并发上限
  setCommandLaneConcurrency(CommandLane.Main, resolveAgentMaxConcurrent(cfg));

  // Subagent lane：子智能体并发上限
  setCommandLaneConcurrency(CommandLane.Subagent, resolveSubagentMaxConcurrent(cfg));
}
```

三条 lane 对应 `src/process/lanes.ts` 里的 `CommandLane` 常量：

| Lane | 常量 | 默认并发 | 控制对象 |
|------|------|---------|---------|
| `CommandLane.Cron` | `"cron"` | `1` | 定时任务 |
| `CommandLane.Main` | `"main"` | 来自配置 | 主智能体回合 |
| `CommandLane.Subagent` | `"subagent"` | 来自配置 | 子智能体 |

## 步骤二：两个 resolve 函数的行为

**`resolveAgentMaxConcurrent(cfg)`**

从配置里拉 `agents.maxConcurrentRuns`（或等效字段），
兜底回 `1`（保证至少串行，不会并发爆炸）。

**`resolveSubagentMaxConcurrent(cfg)`**

从 `agents.subagentMaxConcurrentRuns` 拉值，
独立于主 agent 的并发计数，使子智能体不会挤占主回合的 slot。

## 步骤三：调用时机

**启动时（一次）：**
```ts
// src/gateway/server-startup.ts（等效位置）
applyGatewayLaneConcurrency(cfg);
```

**热重载时（每次配置变更）：**
```ts
// src/gateway/server-reload-handlers.ts
applyGatewayLaneConcurrency(newCfg);
```

热重载只修改 lane 的 `maxConcurrent` 字段，不清空已排队任务，
所以排队中的任务在下一次 `drainLane` 时会自动按新上限调度。

## 步骤四：setCommandLaneConcurrency 下游行为

```ts
// src/process/command-queue.ts
export function setCommandLaneConcurrency(lane: string, n: number) {
  const state = getLaneState(lane);  // 不存在则创建
  state.maxConcurrent = Math.max(1, n);  // 至少 1
  drainLane(state);  // 立即尝试拉起等待任务
}
```

写完 `maxConcurrent` 后立刻 `drainLane`，
让"提高并发"的配置变更**实时生效**，不用等下一条消息触发。

## 步骤五：为什么 session lane 不在这里配置

session lane（如 `"session:user-abc"`）是**动态创建**的，
粒度是每个会话，`maxConcurrent` 固定为 `1`（强制串行），
不需要也不能通过配置文件调整。

只有 `Cron / Main / Subagent` 这三条**全局命名 lane** 才通过 `applyGatewayLaneConcurrency` 配置。

## 自检清单

1. 修改配置后热重载，`Cron/Main/Subagent` 的并发数是否立即变化。
2. `resolveAgentMaxConcurrent` 返回 `0` 时是否被强制 clamp 为 `1`。
3. `applyGatewayLaneConcurrency` 是否在启动和热重载两处都被调用。
4. 新建 session lane 时 `maxConcurrent` 是否始终为 `1`。
