# 22 函数级剖析：runEmbeddedAttempt

核心文件：`src/agents/pi-embedded-runner/run/attempt.ts`

## 模块定位

`runEmbeddedAttempt` 是**单次 LLM 调用尝试**的完整生命周期管理器。它不负责 provider/model 轮换（那是 `runWithModelFallback` 的工作），只负责把当前指定的模型跑一次完整的 agent 循环。

## 一、五个执行阶段（精确顺序）

### 阶段 A：运行环境准备

```ts
// 1. 解析工作目录，chdir 到 effectiveWorkspace
process.chdir(effectiveWorkspace);

// 2. 技能环境变量覆盖
const shouldLoadSkillEntries = !params.skillsSnapshot || !params.skillsSnapshot.resolvedSkills;
const skillEntries = shouldLoadSkillEntries
  ? loadWorkspaceSkillEntries(effectiveWorkspace)
  : [];

restoreSkillEnv = params.skillsSnapshot
  ? applySkillEnvOverridesFromSnapshot({   // 有 snapshot：从快照恢复
      snapshot: params.skillsSnapshot,
      config: params.config,
    })
  : applySkillEnvOverrides({               // 无 snapshot：从磁盘加载
      skills: skillEntries ?? [],
      config: params.config,
    });

// 3. 生成 skillsPrompt（技能系统提示词段落）
const skillsPrompt = resolveSkillsPromptForRun({
  skillsSnapshot: params.skillsSnapshot,
  entries: shouldLoadSkillEntries ? skillEntries : undefined,
  config: params.config,
  workspaceDir: effectiveWorkspace,
});
```

### 阶段 B：工具与会话构建

```ts
// 1. 创建工具候选池
const sdkTools = createOpenClawCodingTools({
  exec: { ... },
  sandbox: params.sandbox,
  sessionKey: params.sessionKey,
  config: params.config,
  modelProvider: params.provider,
  modelId: params.modelId,
  // ...
});

// 2. 分流：builtInTools 永远为 []，所有工具走 customTools
const { builtInTools, customTools } = splitSdkTools({
  tools: sdkTools,
  sandboxEnabled: params.sandbox?.enabled,
});

// 3. client tools（OpenResponses hosted tools）
let clientToolCallDetected: { name: string; params: Record<string, unknown> } | null = null;
const clientToolDefs = params.clientTools
  ? toClientToolDefinitions(
      params.clientTools,
      (toolName, toolParams) => { clientToolCallDetected = { name: toolName, params: toolParams }; },
      { agentId: sessionAgentId, sessionKey: params.sessionKey },
    )
  : [];

const allCustomTools = [...customTools, ...clientToolDefs];

// 4. 创建 agent session
({ session } = await createAgentSession({
  cwd: resolvedWorkspace,
  agentDir,
  authStorage: params.authStorage,
  modelRegistry: params.modelRegistry,
  model: params.model,
  thinkingLevel: mapThinkingLevel(params.thinkLevel),
  tools: builtInTools,        // 永远为 []
  customTools: allCustomTools,
  sessionManager,
  settingsManager,
}));
```

### 阶段 C：运行前清理与订阅

```ts
// 1. 清理会话历史（多 provider 兼容）
const prior = await sanitizeSessionHistory({
  messages: activeSession.messages,
  modelApi: params.model.api,
  modelId: params.modelId,
  provider: params.provider,
  sessionManager,
  sessionId: params.sessionId,
  policy: transcriptPolicy,
});

// 2. 按 provider 做 turn 验证
const validatedGemini = transcriptPolicy.validateGeminiTurns
  ? validateGeminiTurns(prior)      // Gemini 严格交替 user→assistant
  : prior;
const validated = transcriptPolicy.validateAnthropicTurns
  ? validateAnthropicTurns(validatedGemini)  // Anthropic 严格交替 user→assistant
  : validatedGemini;

// 3. 限制历史轮次（DM 模式的 token 控制）
const truncated = limitHistoryTurns(
  validated,
  getDmHistoryLimitFromSessionKey(params.sessionKey, params.config),
);

// 4. 订阅 LLM 流式事件
const subscription = subscribeEmbeddedPiSession({ ... });

// 5. 注册活跃运行（用于并发控制）
setActiveEmbeddedRun(sessionId, handle);
```

### 阶段 D：prompt 执行与等待

```ts
// 1. before_agent_start hook（插件注入上下文）
let effectivePrompt = params.prompt;
if (hookRunner?.hasHooks("before_agent_start")) {
  try {
    const hookResult = await hookRunner.runBeforeAgentStart(
      { prompt: params.prompt, messages: activeSession.messages },
      { agentId: hookAgentId, sessionKey: params.sessionKey, ... },
    );
    if (hookResult?.prependContext) {
      effectivePrompt = `${hookResult.prependContext}\n\n${params.prompt}`;
    }
  } catch (hookErr) {
    log.warn(`before_agent_start hook failed: ${String(hookErr)}`);
    // 失败不阻断执行
  }
}

// 2. 检测并加载 prompt 中的图片
const promptWithImages = await detectAndLoadPromptImages(effectivePrompt);

// 3. 触发 LLM 调用（内部循环处理 compaction）
await activeSession.prompt(promptWithImages, { abortSignal });

// 4. 等待可能的 compaction 重试
const retryResult = await subscription.waitForCompactionRetry?.();

// 5. cache-TTL 时间戳追加（必须在 compaction 完成后）
// 注意：必须在 prompt + compaction retry 完成后才追加！
// 原因见 https://github.com/openclaw/openclaw/issues/9282
if (!timedOutDuringCompaction) {
  const shouldTrackCacheTtl =
    params.config?.agents?.defaults?.contextPruning?.mode === "cache-ttl" &&
    isCacheTtlEligibleProvider(params.provider, params.modelId);
  if (shouldTrackCacheTtl) {
    appendCacheTtlTimestamp(sessionManager, {
      timestamp: Date.now(),
      provider: params.provider,
      modelId: params.modelId,
    });
  }
}
```

### 阶段 E：收尾与返回

```ts
// finally 块：无论成功或失败都执行

// 1. 取消订阅
subscription.unsubscribe();

// 2. 清除活跃运行标记
clearActiveEmbeddedRun(sessionId, handle);

// 3. 等待工具运行结束后再 flush（防止"假缺失"错误）
await flushPendingToolResultsAfterIdle({
  agent: session?.agent,
  sessionManager,
  timeoutMs: DEFAULT_WAIT_FOR_IDLE_TIMEOUT_MS,
});

// 4. 恢复进程工作目录
process.chdir(prevCwd);

// 5. 恢复 skill 环境变量
restoreSkillEnv?.();

// 6. session.dispose() + lock release
```

## 二、关键函数精确签名

### sanitizeSessionHistory

```ts
// src/agents/pi-embedded-runner/google.ts

export async function sanitizeSessionHistory(params: {
  messages: AgentMessage[];
  modelApi?: string | null;
  modelId?: string;
  provider?: string;
  sessionManager: SessionManager;
  sessionId: string;
  policy?: TranscriptPolicy;
}): Promise<AgentMessage[]>
```

**内部处理链：**
1. `annotateInterSessionUserMessages` — 标注跨 session 的用户消息
2. `sanitizeSessionMessagesImages` — 图片清理（mode/toolCallId/signature 处理）
3. `sanitizeAntigravityThinkingBlocks` — 思考块清理（Gemini 特有）
4. `sanitizeToolCallInputs` — tool call 输入清理
5. `sanitizeToolUseResultPairing` — tool use 配对修复
6. `stripToolResultDetails` — 移除 tool 结果详情

### limitHistoryTurns

```ts
// src/agents/pi-embedded-runner/history.ts

export function limitHistoryTurns(
  messages: AgentMessage[],
  limit: number | undefined,
): AgentMessage[] {
  if (!limit || limit <= 0 || messages.length === 0) return messages;

  let userCount = 0;
  let lastUserIndex = messages.length;
  // 从后向前计数 user 轮次，超限时截断
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") {
      userCount++;
      if (userCount > limit) return messages.slice(lastUserIndex);
      lastUserIndex = i;
    }
  }
  return messages;
}
```

### setActiveEmbeddedRun / clearActiveEmbeddedRun

```ts
// src/agents/pi-embedded-runner/runs.ts

export function setActiveEmbeddedRun(sessionId: string, handle: EmbeddedPiQueueHandle) {
  const wasActive = ACTIVE_EMBEDDED_RUNS.has(sessionId);
  ACTIVE_EMBEDDED_RUNS.set(sessionId, handle);
  logSessionStateChange({
    sessionId,
    state: "processing",
    reason: wasActive ? "run_replaced" : "run_started",
  });
}

export function clearActiveEmbeddedRun(sessionId: string, handle: EmbeddedPiQueueHandle) {
  // 只清除匹配 handle 的运行（防止清除已被替换的新运行）
  if (ACTIVE_EMBEDDED_RUNS.get(sessionId) === handle) {
    ACTIVE_EMBEDDED_RUNS.delete(sessionId);
    logSessionStateChange({ sessionId, state: "idle", reason: "run_completed" });
    notifyEmbeddedRunEnded(sessionId);
  } else {
    diag.debug(`run clear skipped: sessionId=${sessionId} reason=handle_mismatch`);
  }
}
```

### flushPendingToolResultsAfterIdle

```ts
// src/agents/pi-embedded-runner/wait-for-idle-before-flush.ts

export async function flushPendingToolResultsAfterIdle(opts: {
  agent: IdleAwareAgent | null | undefined;
  sessionManager: ToolResultFlushManager | null | undefined;
  timeoutMs?: number;   // 默认 DEFAULT_WAIT_FOR_IDLE_TIMEOUT_MS
}): Promise<void> {
  await waitForAgentIdleBestEffort(opts.agent, opts.timeoutMs ?? DEFAULT_WAIT_FOR_IDLE_TIMEOUT_MS);
  opts.sessionManager?.flushPendingToolResults?.();
}
```

**为什么必须等待 idle 再 flush：** 工具可能还在异步执行中，过早 flush 会导致 tool result 丢失，前端看到"假缺失"错误。

## 三、appendCacheTtlTimestamp（位置敏感）

```ts
// src/agents/pi-embedded-runner/cache-ttl.ts

export function appendCacheTtlTimestamp(sessionManager: unknown, data: CacheTtlEntryData): void {
  const sm = sessionManager as {
    appendCustomEntry?: (customType: string, data: unknown) => void;
  };
  if (!sm?.appendCustomEntry) return;
  try {
    sm.appendCustomEntry(CACHE_TTL_CUSTOM_TYPE, data);
  } catch {
    // ignore persistence failures
  }
}
```

**关键约束（Issue #9282）：** 必须在 `prompt + compaction retry` 完成后追加。原因：如果在 prompt 前追加，自定义条目会插入在 compaction 和下一个 prompt 之间，破坏 `prepareCompaction()` 的 last-entry-type 检查，导致双重 compaction。

## 四、自检清单

1. `splitSdkTools` 返回 `builtInTools: []`（永远空），所有工具在 `customTools`。
2. `before_agent_start` hook 失败只 warn，不中断执行（catch 住了）。
3. `clearActiveEmbeddedRun` 检查 handle 匹配，防止清除已被替换的新运行。
4. `appendCacheTtlTimestamp` 必须在 compaction retry 完成后调用（时序敏感）。
5. `timedOutDuringCompaction=true` 时跳过 cache-TTL 追加（state 不一致，不安全）。
6. `flushPendingToolResultsAfterIdle` 在 finally 中调用，确保清理执行。

## 五、开发避坑

1. **process.chdir** 有全局副作用，finally 必须恢复 `prevCwd`，否则影响后续所有文件操作。
2. **skill 环境变量** 同理，`applySkillEnvOverrides` 返回的 `restoreSkillEnv` 必须在 finally 中调用。
3. **timeout 处理**：超时触发 abort，若在 compaction 期间超时会设置 `timedOutDuringCompaction=true` 标记，避免误判为普通模型超时。
4. **clientToolCall 路径**：`toClientToolDefinitions` 注册的工具被调用时设置 `clientToolCallDetected`，`run.ts` 在返回时检查此标记，设置 `stopReason="tool_calls"`。
