# 21 函数级剖析：runEmbeddedPiAgent

核心文件：`src/agents/pi-embedded-runner/run.ts`

## 模块定位

`runEmbeddedPiAgent` 是 embedded agent 的顶层调度函数。负责：双层队列串行化、context window 预检、auth profile 轮换、overflow 自动恢复（compaction + toolResult 截断）。

## 一、双层 Lane 入队（精确源码）

```ts
// src/agents/pi-embedded-runner/lanes.ts

export function resolveSessionLane(key: string) {
  const cleaned = key.trim() || CommandLane.Main;
  return cleaned.startsWith("session:") ? cleaned : `session:${cleaned}`;
}

export function resolveGlobalLane(lane?: string) {
  const cleaned = lane?.trim();
  return cleaned ? cleaned : CommandLane.Main;
}
```

**执行结构：**
```ts
const sessionLane = resolveSessionLane(params.sessionKey?.trim() || params.sessionId);
const globalLane = resolveGlobalLane(params.lane);

return enqueueSession(() =>      // session lane：同 session 串行
  enqueueGlobal(async () => {    // global lane：保护全局共享资源
    // ...主逻辑
  })
);
```

| Lane | key 格式 | 作用 |
|------|---------|------|
| session lane | `session:${sessionKey}` | 保证同一 session 的请求串行 |
| global lane | `CommandLane.Main` 或自定义 | 保护 model registry / auth store 等全局资源 |

## 二、Context Window 预检（硬门槛）

```ts
// src/agents/context-window-guard.ts

export const CONTEXT_WINDOW_HARD_MIN_TOKENS = 16_000;   // block 阈值
export const CONTEXT_WINDOW_WARN_BELOW_TOKENS = 32_000; // warn 阈值

export function evaluateContextWindowGuard(params: {
  info: ContextWindowInfo;
  warnBelowTokens?: number;   // 默认 CONTEXT_WINDOW_WARN_BELOW_TOKENS
  hardMinTokens?: number;     // 默认 CONTEXT_WINDOW_HARD_MIN_TOKENS
}): ContextWindowGuardResult {
  const tokens = Math.max(0, Math.floor(params.info.tokens));
  return {
    ...params.info,
    tokens,
    shouldWarn: tokens > 0 && tokens < warnBelow,    // tokens < 32_000 → 告警
    shouldBlock: tokens > 0 && tokens < hardMin,      // tokens < 16_000 → 抛 FailoverError
  };
}
```

**`resolveContextWindowInfo` 返回类型：**
```ts
type ContextWindowInfo = {
  tokens: number;
  source: "model" | "modelsConfig" | "agentContextTokens" | "default";
};
// 优先级：modelsConfig > model > agentContextTokens > default
```

## 三、Auth Profile 轮换

### resolveAuthProfileOrder

```ts
// src/agents/auth-profiles/order.ts  行 20-155

export function resolveAuthProfileOrder(params: {
  cfg?: OpenClawConfig;
  store: AuthProfileStore;
  provider: string;
  preferredProfile?: string;
}): string[]  // 返回排好序的 profileId 数组
```

**排序优先级：**
1. `preferredProfile`（显式指定）排最前
2. 有 explicitOrder：可用（非冷却）的在前，冷却中的在后
3. 无 explicitOrder：round-robin，按类型（oauth > token > api_key）和 `lastUsed`（最旧优先）
4. 冷却中的 profile 追加到末尾

### advanceAuthProfile（第 354-379 行）

```ts
const advanceAuthProfile = async (): Promise<boolean> => {
  if (lockedProfileId) {
    return false;  // 用户锁定 profile，禁止轮换
  }
  let nextIndex = profileIndex + 1;
  while (nextIndex < profileCandidates.length) {
    const candidate = profileCandidates[nextIndex];
    if (candidate && isProfileInCooldown(authStore, candidate)) {
      nextIndex += 1;  // 跳过冷却中的 profile
      continue;
    }
    try {
      await applyApiKeyInfo(candidate);  // 切换到新 profile
      profileIndex = nextIndex;
      thinkLevel = initialThinkLevel;    // 重置 thinking level
      attemptedThinking.clear();          // 清空 thinking 尝试记录
      return true;
    } catch (err) {
      nextIndex += 1;
    }
  }
  return false;  // 所有 profile 耗尽
};
```

### applyApiKeyInfo（第 329-352 行）

```ts
const applyApiKeyInfo = async (candidate?: string): Promise<void> => {
  apiKeyInfo = await resolveApiKeyForCandidate(candidate);
  if (!apiKeyInfo.apiKey) {
    if (apiKeyInfo.mode !== "aws-sdk") {
      throw new Error(`No API key resolved for provider "${model.provider}"`);
    }
    lastProfileId = apiKeyInfo.profileId ?? candidate;
    return;
  }
  if (model.provider === "github-copilot") {
    const copilotToken = await resolveCopilotApiToken({ githubToken: apiKeyInfo.apiKey });
    authStorage.setRuntimeApiKey(model.provider, copilotToken.token);
  } else {
    authStorage.setRuntimeApiKey(model.provider, apiKeyInfo.apiKey);
  }
  lastProfileId = apiKeyInfo.profileId;
};
```

## 四、Context Overflow 恢复链（精确常量与顺序）

```ts
// src/agents/pi-embedded-runner/run.ts  第 411-413 行

const MAX_OVERFLOW_COMPACTION_ATTEMPTS = 3;
let overflowCompactionAttempts = 0;
let toolResultTruncationAttempted = false;
```

**恢复流程（while 循环内）：**

```
检测到 contextOverflowError
    │
    ▼
1. 尝试 compaction（最多 3 次，非 compaction_failure 错误才执行）
   overflowCompactionAttempts++ → compactEmbeddedPiSessionDirect(...)
   成功 → autoCompactionCount++ + continue（重试 prompt）
    │
    ▼（compaction 失败或达 MAX = 3）
2. 尝试 toolResult 截断（只尝试一次）
   !toolResultTruncationAttempted
   sessionLikelyHasOversizedToolResults({ messages, contextWindowTokens })
   有超大 → truncateOversizedToolResultsInSession(...)
   成功 → overflowCompactionAttempts = 0（重置！允许再 compact）+ continue
    │
    ▼（全部失败）
3. 返回用户可读错误
   "Context overflow: prompt too large for the model."
```

**toolResult 过大判定（`tool-result-truncation.ts`）：**
```ts
const MAX_TOOL_RESULT_CONTEXT_SHARE = 0.3;        // 单条不超过 context 30%
export const HARD_MAX_TOOL_RESULT_CHARS = 400_000; // 硬上限 40 万字符

// maxChars = min(contextWindowTokens * 0.3 * 4, 400_000)
// 超过此值的 toolResult 视为 oversized，触发截断
```

**截断保留规则：**
- 最少保留 `MIN_KEEP_CHARS = 2_000` 字符
- 在 `keepChars * 0.8` 处尽量在换行符截断（不切断单行）
- 追加提示：`"[Content truncated — original was too large..."]`

## 五、主循环关键分支

```ts
while (true) {
  const attempt = await runEmbeddedAttempt({ ... });
  const { aborted, promptError, timedOut, timedOutDuringCompaction, ... } = attempt;

  // 1. context overflow → 见上方恢复链
  if (contextOverflowError) { ... }

  // 2. promptError（非 overflow）→ 尝试 thinking fallback 或 profile 轮换
  if (promptError && !aborted) {
    if (isRoleOrderingError) { return userFriendlyError; }
    if (isImageSizeError)    { return userFriendlyError; }
    if (isFailoverError && (await advanceAuthProfile())) { continue; }
    // 无法 advance → throw promptError
  }

  // 3. thinking level 回退（不支持当前 level）
  const fallbackThinking = pickFallbackThinkingLevel({ attempted: attemptedThinking });
  if (fallbackThinking && !aborted) { thinkLevel = fallbackThinking; continue; }

  // 4. auth/rate-limit/billing/timeout → shouldRotate
  const shouldRotate = (!aborted && failoverFailure) || (timedOut && !timedOutDuringCompaction);
  if (shouldRotate) {
    await markAuthProfileFailure({ ... });
    if (await advanceAuthProfile()) { continue; }
    throw new FailoverError(...);  // 触发上层 model fallback
  }

  // 5. 成功
  return buildEmbeddedRunPayloads({ ... });
}
```

## 六、buildEmbeddedRunPayloads 签名

```ts
// src/agents/pi-embedded-runner/run/payloads.ts  行 25-52

export function buildEmbeddedRunPayloads(params: {
  assistantTexts: string[];
  toolMetas: ToolMetaEntry[];
  lastAssistant: AssistantMessage | undefined;
  lastToolError?: { toolName: string; meta?: string; error?: string;
                    mutatingAction?: boolean; actionFingerprint?: string; };
  config?: OpenClawConfig;
  sessionKey: string;
  provider?: string;
  verboseLevel?: VerboseLevel;
  reasoningLevel?: ReasoningLevel;
  toolResultFormat?: ToolResultFormat;
  inlineToolResultsAllowed: boolean;
}): Array<{
  text?: string;
  mediaUrl?: string;
  mediaUrls?: string[];
  replyToId?: string;
  isError?: boolean;
  audioAsVoice?: boolean;
  replyToTag?: boolean;
  replyToCurrent?: boolean;
}>
```

## 七、成功返回结构（第 926-948 行）

```ts
return {
  payloads,        // buildEmbeddedRunPayloads 的结果
  meta: {
    durationMs,
    agentMeta: {
      sessionId, provider, model: model.id,
      usage,            // 所有循环累积 token（tool-use loop 包括在内）
      lastCallUsage,    // 最后一次 API 调用的 token（反映实际 context 大小）
      promptTokens,     // prompt 部分 tokens
      compactionCount,  // auto compaction 次数（autoCompactionCount > 0 才附加）
    },
    aborted,
    stopReason: attempt.clientToolCall ? "tool_calls" : undefined,
    pendingToolCalls: ...,  // clientToolCall 转换结果
  },
  didSendViaMessagingTool,
  messagingToolSentTexts,
  messagingToolSentTargets,
};
```

## 八、自检清单

1. `shouldBlock`（tokens < 16_000）直接抛 `FailoverError`，不进入主循环。
2. `advanceAuthProfile` 遇到 `lockedProfileId` 直接返回 false，不尝试切换。
3. overflow 恢复顺序：compaction（最多 3 次）→ toolResult 截断（仅一次）→ 错误响应。
4. tool 截断成功后 `overflowCompactionAttempts = 0`，允许再次 compact。
5. `markAuthProfileGood` + `markAuthProfileUsed` 仅在**正常返回**时调用。

## 九、开发避坑

1. **timeout 等于隐性 rate limit**：`timedOut && !timedOutDuringCompaction` → 触发 profile 轮换标记。
2. **`lastCallUsage` vs `usage`**：前者反映 context 实际大小，后者是累积值（工具循环叠加），不能混用。
3. **overflow 截断后 attempts 归零**：截断成功后 compaction 计数归零，让 compact 有机会再次执行。
4. **思考级别降级（thinking fallback）**：不支持的 thinking level 会自动降级重试，不算失败。
