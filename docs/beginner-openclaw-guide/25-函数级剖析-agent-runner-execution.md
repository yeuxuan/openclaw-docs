# 25 函数级剖析: agent-runner-execution

## 模块目标

拆解上层自动回复如何调用底层智能体，并处理回退、流式和最终结果。

## 核心文件

- `src/auto-reply/reply/agent-runner-execution.ts`

## 步骤一：实现拆解（函数级）

主函数：`runAgentTurnWithFallback(params)`

核心阶段：
1. 初始化 runId、注册 run 上下文
2. 构造流式处理闭包（partial/block/tool）
3. 调 `runWithModelFallback(...)` 包住整个执行循环
4. 每个候选模型里调用 `runEmbeddedPiAgent(...)`（或 CLI provider 走 `runCliAgent(...)`）
5. 循环内按错误类型走不同恢复分支
6. 输出 `AgentRunLoopResult`（`success` 或 `final`）

## 步骤二：返回类型（两种，不对称）

```ts
// src/auto-reply/reply/agent-runner-execution.ts
export type AgentRunLoopResult =
  | {
      kind: "success";
      runResult: Awaited<ReturnType<typeof runEmbeddedPiAgent>>;
      fallbackProvider?: string;   // fallback 后实际使用的 provider
      fallbackModel?: string;      // fallback 后实际使用的 model
      didLogHeartbeatStrip: boolean;        // 是否裁剪了心跳文本前缀
      autoCompactionCompleted: boolean;     // 是否发生了自动压缩
      directlySentBlockKeys?: Set<string>; // 工具 flush 期间直接发出的 block key（去重用）
    }
  | { kind: "final"; payload: ReplyPayload }; // 直接终止（错误 payload 或特定退出路径）
```

`kind: "final"` 意味着调用方**不需要再做任何回复拼装**，直接透传给通道。
`kind: "success"` 意味着 runResult 需要上层继续处理（拼装 payload、发送到通道）。

## 步骤三：三个重试防护标志（各只允许一次）

```ts
let didResetAfterCompactionFailure = false;  // 压缩失败后重置 session，只允许一次
let didRetryTransientHttpError = false;       // 瞬时 HTTP 错误重试，只允许一次
// fallbackProvider / fallbackModel 跟踪当前实际使用的模型
let fallbackProvider = params.followupRun.run.provider;
let fallbackModel    = params.followupRun.run.model;
```

这三个标志保证"无限重试漏洞"不会出现：
- 压缩失败最多重置一次，之后直接返回用户可读的错误。
- 瞬时 HTTP 错误（如 502/503）最多重试一次，之后走 fallback 或失败。

## 步骤四：run 上下文追踪（可观测性基础）

```ts
const runId = params.opts?.runId ?? crypto.randomUUID();
params.opts?.onAgentRunStart?.(runId);

if (params.sessionKey) {
  registerAgentRunContext(runId, {
    sessionKey: params.sessionKey,
    verboseLevel: params.resolvedVerboseLevel,
    isHeartbeat: params.isHeartbeat,
  });
}
```

`registerAgentRunContext` 让 runId 与 sessionKey 关联，后续日志、流式事件可以按 runId 追踪归属。

## 步骤五：Context overflow 双路径（最关键，最易漏实现）

OpenClaw 的 context overflow 有**两条独立路径**，都需要处理：

**路径 A：runEmbeddedPiAgent 抛出异常**
```ts
// run.ts 抛 isContextOverflowError(err)
// → runWithModelFallback 捕获后走 fallback 或继续循环
```

**路径 B：error 藏在 meta 里（不抛异常）**
```ts
// agent-runner-execution.ts 循环内检查
const embeddedError = runResult.meta?.error;
if (
  embeddedError &&
  isContextOverflowError(embeddedError.message) &&
  !didResetAfterCompactionFailure &&
  (await params.resetSessionAfterCompactionFailure(embeddedError.message))
) {
  didResetAfterCompactionFailure = true;
  return {
    kind: "final",
    payload: {
      text: "⚠️ Context limit exceeded. I've reset our conversation to start fresh - please try again.\n\nTo prevent this, increase your compaction buffer by setting `agents.defaults.compaction.reserveTokensFloor` to 4000 or higher in your config.",
    },
  };
}
```

**复刻时必须同时实现两条路径**，否则路径 B 会导致 runResult 看起来成功，实际上回复内容是空的错误信息。

## 步骤六：四种精确的用户可见错误消息（源码字面量）

```ts
// 1. Context overflow（来自 isContextOverflowError 分支）
"⚠️ Context overflow — prompt too large for this model. Try a shorter message or a larger-context model."

// 2. Role ordering conflict（assistant/user 顺序错误）
"⚠️ Message ordering conflict - please try again. If this persists, use /new to start a fresh session."

// 3. Compaction failure + session reset（meta.error 路径）
"⚠️ Context limit exceeded. I've reset our conversation to start fresh - please try again.\n\nTo prevent this, increase your compaction buffer by setting `agents.defaults.compaction.reserveTokensFloor` to 4000 or higher in your config."

// 4. 通用失败兜底
"⚠️ Agent failed before reply: {trimmedMessage}.\nLogs: openclaw logs --follow"
// 注：瞬时 HTTP 错误走 sanitizeUserFacingText 处理后进此分支
```

这些消息是面向用户展示的，不是日志。复刻时保留这套错误语义，避免用户看到裸 stack trace。

## 步骤七：CLI provider 分支（特殊路径）

```ts
// isCliProvider(provider) 为 true 时，不走 runEmbeddedPiAgent，走 runCliAgent
if (isCliProvider(provider)) {
  // runCliAgent 的入参与 runEmbeddedPiAgent 高度对称，但内部实现不同
  // cliSessionId = getCliSessionId(activeSessionEntry, provider)
  result = await runCliAgent({ sessionId, sessionKey, sessionFile, workspaceDir,
                                config, prompt, provider, model, thinkLevel,
                                timeoutMs, runId, cliSessionId, images, ... });
}
```

CLI provider 的 `result` 类型与 embedded run 一致，上层代码统一处理。

## 步骤八：directlySentBlockKeys 去重机制

```ts
const directlySentBlockKeys = new Set<string>();
// 工具执行期间的 flush 会直接发送 block，记录 key
// 防止上层再次发送同一 block（重复出现在回复里）
// 最终通过 AgentRunLoopResult.directlySentBlockKeys 传递给调用方
```

## 步骤九：结合 runWithModelFallback 的循环结构

```ts
// 整个执行包在 runWithModelFallback 里
const fallbackResult = await runWithModelFallback({
  cfg, provider, model, agentDir, fallbacksOverride,
  run: (provider, model) => {
    // 通知上层模型选定（支持 onModelSelected 回调）
    params.opts?.onModelSelected?.({ provider, model, thinkLevel });
    // 根据 provider 类型走 embedded 或 CLI 路径
    if (isCliProvider(provider)) { return runCliAgent(...); }
    return runEmbeddedPiAgent(...);
  },
  onError: async ({ provider, model, error, attempt, total }) => {
    // 每次候选失败时回调，可用于日志/监控
  },
});
fallbackProvider = fallbackResult.provider;
fallbackModel    = fallbackResult.model;
runResult        = fallbackResult.result;
```

## 自检清单

1. 是否同时处理了 thrown overflow 和 meta.error overflow 两条路径。
2. `didResetAfterCompactionFailure` / `didRetryTransientHttpError` 是否各只触发一次。
3. 四种用户消息是否都有对应的分支，而不是全部走 `"Agent failed before reply"` 兜底。
4. `directlySentBlockKeys` 是否传递给了调用方，避免 block 重复发送。
5. CLI provider 分支与 embedded 分支是否都接入了 `runWithModelFallback`。
6. `registerAgentRunContext` 是否在 run 开始时调用，结束后是否清理。

## 开发避坑

1. 不要把 overflow 的两条路径合并——meta.error 路径不抛异常，必须主动检查。
2. `resetSessionAfterCompactionFailure` 是异步的（可能涉及文件 IO），不要忘记 await。
3. 重试标志是局部变量，不是全局单例——每次 `runAgentTurnWithFallback` 调用都有独立的标志。
4. `kind: "final"` 返回前不要再做任何回复拼装，否则会出现"双重回复"。
