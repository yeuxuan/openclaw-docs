# 03 会话与并发框架（session key + lane + queue）

## 小白先懂（30秒）

- 这套模块就是“排队系统”。  
- 同一个会话必须按顺序排队，不同会话可以并行。  
- `sessionKey` 决定排到哪条队，`lane` 决定这条队能同时跑几个任务。

## 你先照着做（不求全懂）

1. 先固定生成 `sessionKey`（同会话永远同 key）。  
2. 再实现 `enqueueCommandInLane(sessionLane, task)`。  
3. 再给全局 lane 加并发上限。  
4. 最后实现 `runId -> sessionKey` 反查缓存。

对应核心代码：
- `src/agents/pi-embedded-runner/lanes.ts`
- `src/process/command-queue.ts`
- `src/gateway/server-lanes.ts`
- `src/gateway/server-session-key.ts`
- `src/config/sessions/session-key.ts`

## 步骤一：执行链路拆解（具体到函数）

1. 生成会话键  
`resolveSessionKey(...)`（`src/config/sessions/session-key.ts`）生成稳定 `sessionKey`。
2. 解析 lane  
`resolveSessionLane(...)` + `resolveGlobalLane(...)`。
3. 入队执行  
`enqueueCommandInLane(...)`（`src/process/command-queue.ts`）。
4. 应用并发配置  
`applyGatewayLaneConcurrency(...)` 设置 `Cron/Main/Subagent` 三类并发。
5. run 反查 session  
`resolveSessionKeyForRun(runId)` 从 run context 缓存和 session store 反查。

## 步骤二：实现细节（内部结构）

1. lane 的内部状态（`LaneState`）
- `queue`: 等待任务
- `activeTaskIds`: 正在运行任务
- `maxConcurrent`: 当前 lane 并发上限
- `generation`: reset 后防旧任务回写

2. `enqueueCommandInLane` 关键点
- 自动创建 lane（默认 `main`）。
- 入队后立刻 `drainLane(...)`。
- 每个任务有 `warnAfterMs/onWait`，可做排队告警。

3. `clearCommandLane` 与 `resetAllLanes`
- `clearCommandLane` 只清“未执行任务”，并抛 `CommandLaneClearedError`。
- `resetAllLanes` 会提升 `generation`，防止旧任务结束时污染新状态。

4. sessionKey 设计要点
- 直聊默认可归并到 main 会话桶。
- 群聊会话独立，避免群上下文污染私聊。

5. runId -> sessionKey 回填
- 先查 `getAgentRunContext(runId)`。
- 缓存没命中才查持久化 store。
- 查到后 `registerAgentRunContext(...)` 回填缓存。

## 最小复刻骨架（更贴近真实）

```ts
type Lane = { queue: Array<() => Promise<void>>; active: number; max: number };
const lanes = new Map<string, Lane>();

function setLaneConcurrency(name: string, max: number) {
  const lane = lanes.get(name) ?? { queue: [], active: 0, max: 1 };
  lane.max = Math.max(1, Math.floor(max));
  lanes.set(name, lane);
}

async function enqueue(name: string, task: () => Promise<void>) {
  const lane = lanes.get(name) ?? { queue: [], active: 0, max: 1 };
  lanes.set(name, lane);
  lane.queue.push(task);
  pump(name, lane);
}

function pump(name: string, lane: Lane) {
  while (lane.active < lane.max && lane.queue.length > 0) {
    const task = lane.queue.shift()!;
    lane.active += 1;
    void task().finally(() => {
      lane.active -= 1;
      pump(name, lane);
    });
  }
}
```


