# 14 AI Hook与插件注入框架原理与实现（可扩展但不失控）

这篇重点是：怎么“开放扩展点”，又不让插件把主流程搞崩。

## 核心源码入口

- `src/plugins/loader.ts`
- `src/plugins/registry.ts`
- `src/plugins/hook-runner-global.ts`
- `src/plugins/hooks.ts`
- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-tools.before-tool-call.ts`
- `src/agents/pi-tool-definition-adapter.ts`
- `src/agents/pi-embedded-subscribe.handlers.tools.ts`

## 总体状态机

`发现插件 -> 注册能力 -> 构建 HookRunner -> 按优先级调度 -> 主链路注入 -> 错误隔离`

## 模块一 插件加载与注册

`loadOpenClawPlugins(...)` 关键步骤：

1. 发现候选插件（workspace/global/bundled）
2. `loadPluginManifestRegistry(...)` 读取清单
3. `createPluginRegistry(...)` 提供注册 API
4. 插件 `register(api)` 执行注册
5. 完成后 `initializeGlobalHookRunner(registry)`

`registry.ts` 会统一收集：

1. hooks
2. tools
3. gateway methods
4. http routes
5. commands

## 模块二 Hook 调度器核心规则

`createHookRunner(...)` 的两个执行模型：

### 1. `runVoidHook(...)`

1. 按 hookName 找到处理器
2. 按 priority 排序
3. `Promise.all` 并行执行
4. 默认 `catchErrors=true`，单个 hook 失败只记日志

### 2. `runModifyingHook(...)`

1. 按 priority 顺序执行
2. 每个 handler 可以返回修改结果
3. 通过 merge 规则合并

`before_agent_start` 合并规则是：

1. `systemPrompt` 后者覆盖前者
2. `prependContext` 按顺序拼接

## 模块三 注入点设计（最关键）

### Agent 启动前

`run/attempt.ts`：

1. 检查 `hookRunner.hasHooks("before_agent_start")`
2. 执行 `runBeforeAgentStart(...)`
3. 若有 `prependContext`，拼到 prompt 前面

### 工具调用前

`runBeforeToolCallHook(...)`：

1. 可返回 `block=true` 阻断
2. 可返回 `params` 改写参数
3. 异常默认只记日志并放行原参数

### 工具调用后

`toToolDefinitions(...)`：

1. 成功路径调用 `runAfterToolCall(...)`
2. 错误路径同样调用 `runAfterToolCall(...)`

这保证了审计完整性。

### Agent 结束

`run/attempt.ts` 末尾 fire `runAgentEnd(...)`：

1. 传递 success/error/duration/messagesSnapshot
2. 用于日志、指标、落库

## 模块四 冲突与故障治理

插件冲突处理不是“后注册覆盖前注册”：

1. method 冲突：拒绝并写 diagnostic
2. route 冲突：拒绝并写 diagnostic
3. command 冲突：拒绝并写 diagnostic

Hook 运行故障策略：

1. 默认 `catchErrors=true`，主链路不停
2. 调试时可切 `catchErrors=false`，快速暴露问题

## 最小复刻骨架

```ts
class HookRunner {
  constructor(private hooks: HookRegistration[], private catchErrors = true) {}

  private list(name: string) {
    return this.hooks
      .filter((h) => h.name === name)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  }

  async runVoid(name: string, evt: unknown, ctx: unknown) {
    await Promise.all(this.list(name).map((h) => this.safe(() => h.fn(evt, ctx))));
  }

  async runModifying<T>(name: string, evt: unknown, ctx: unknown, merge: (a: T | undefined, b: T) => T) {
    let acc: T | undefined;
    for (const h of this.list(name)) {
      const out = await this.safe(() => h.fn(evt, ctx));
      if (out !== undefined && out !== null) acc = acc === undefined ? out : merge(acc, out);
    }
    return acc;
  }

  private async safe<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try { return await fn(); } catch (e) { if (!this.catchErrors) throw e; return undefined; }
  }
}
```

## 自检清单

1. modifying hook 是否严格按 priority 顺序执行。
2. void hook 是否并行执行且不会阻塞主回复。
3. before_tool_call 是否支持阻断与改参。
4. after_tool_call 是否在失败分支同样触发。
5. 单个 hook 报错是否不会导致整个对话失败。


