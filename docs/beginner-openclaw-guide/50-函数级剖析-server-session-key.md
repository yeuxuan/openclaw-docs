# 50 函数级剖析：server-session-key

核心文件：`src/gateway/server-session-key.ts`

## 模块定位

runId → sessionKey 的反查桥接器。
WS/Agent 事件以 `runId` 为主键，UI/节点订阅以 `sessionKey` 路由，这个模块是两者之间的转换层。

## 一、resolveSessionKeyForRun（完整源码）

```ts
// src/gateway/server-session-key.ts

export function resolveSessionKeyForRun(runId: string) {
  // 1. 先查内存缓存（最快路径）
  const cached = getAgentRunContext(runId)?.sessionKey;
  if (cached) {
    return cached;
  }

  // 2. 缓存 miss → 扫描 session store（磁盘 I/O）
  const cfg = loadConfig();
  const storePath = resolveStorePath(cfg.session?.store);
  const store = loadSessionStore(storePath);
  const found = Object.entries(store).find(([, entry]) => entry?.sessionId === runId);
  const storeKey = found?.[0];

  if (storeKey) {
    // 3. 找到后转换为请求格式的 sessionKey
    const sessionKey = toAgentRequestSessionKey(storeKey) ?? storeKey;
    // 4. 回填缓存，后续调用走缓存路径
    registerAgentRunContext(runId, { sessionKey });
    return sessionKey;
  }

  return undefined;  // 找不到时不抛，返回 undefined
}
```

## 二、两层查找策略

| 层次 | 来源 | 成本 | 场景 |
|------|------|------|------|
| 第一层 | `runContextById` 内存 Map | O(1) | run 活跃时，已注册 context |
| 第二层 | `loadSessionStore()` 磁盘扫描 | O(n) | run 刚启动/重启后，缓存为空 |

找到后立刻 `registerAgentRunContext(runId, { sessionKey })`，让后续调用命中第一层。

## 三、AgentRunContext 结构（infra/agent-events.ts）

```ts
export type AgentRunContext = {
  sessionKey?:   string;
  verboseLevel?: VerboseLevel;
  isHeartbeat?:  boolean;
};

// 每个字段独立更新（merge 语义，不是整体覆盖）
export function registerAgentRunContext(runId: string, context: AgentRunContext) {
  const existing = runContextById.get(runId);
  if (!existing) {
    runContextById.set(runId, { ...context });
    return;
  }
  // 只更新有值的字段，避免用 undefined 覆盖已存在的值
  if (context.sessionKey   && existing.sessionKey   !== context.sessionKey)   existing.sessionKey   = context.sessionKey;
  if (context.verboseLevel && existing.verboseLevel !== context.verboseLevel) existing.verboseLevel = context.verboseLevel;
  if (context.isHeartbeat  !== undefined)                                     existing.isHeartbeat  = context.isHeartbeat;
}
```

## 四、调用时机

`resolveSessionKeyForRun` 被以下场景调用：

1. **事件转发**：WS 推送 `exec.approval.requested` 等事件时，需要知道向哪个 session 广播
2. **日志/监控**：按 runId 找到 sessionKey 后打上标签
3. **流式事件归属**：将 agent 流式输出关联到对应 session

## 五、loadSessionStore 的缓存机制（config/sessions/store.ts）

```ts
// loadSessionStore 内部有文件级缓存
// 先检查 SESSION_STORE_CACHE，比较 mtimeMs 判断是否过期
// 命中缓存返回 structuredClone（防外部修改污染缓存）
```

所以即使 store 扫描走磁盘，重复扫描同一文件时也能命中文件级缓存。

## 六、自检清单

1. 缓存命中时不触发 store 扫描（`getAgentRunContext` 有值即返回）。
2. 扫描后回填缓存，同一 runId 不会二次扫描。
3. 找不到时返回 `undefined`，不抛异常，调用方自行处理。
4. `registerAgentRunContext` 是 merge 语义，不会覆盖已有的 verboseLevel 或 isHeartbeat。
5. `toAgentRequestSessionKey(storeKey) ?? storeKey`：优先转换成请求格式，转换失败则原样使用。
