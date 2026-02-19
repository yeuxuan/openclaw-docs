# 20 Hook插件注入状态机实现实战（优先级、并行、故障隔离）

这篇重点是“插件 Hook 如何安全插进主链路”。

## 对应源码入口

- `src/plugins/loader.ts`
- `src/plugins/registry.ts`
- `src/plugins/hook-runner-global.ts`
- `src/plugins/hooks.ts`
- `src/agents/pi-tools.before-tool-call.ts`
- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-subscribe.handlers.tools.ts`

## 一、注册态状态机（插件加载阶段）

### 1) 加载与注册

`loadOpenClawPlugins(...)` 会：

1. 发现候选插件。  
2. 逐个创建 `PluginRecord`。  
3. 通过 `createPluginRegistry(...)` 提供 API 给插件注册 `tool/hook/method/http/command`。  
4. 完成后 `initializeGlobalHookRunner(registry)`。

### 2) 冲突治理（关键）

`registry.ts` 内置硬约束：

1. `registerGatewayMethod`  
与 core method 或已注册 method 冲突时直接报错诊断。

2. `registerHttpRoute`  
路径重复直接报错诊断。

3. `registerCommand`  
走 `registerPluginCommand(...)`，重复命令会拒绝注册。

这一步决定“多插件并存”是否可控。

## 二、执行态状态机（Hook Runner）

核心在 `createHookRunner(...)`。

### 1) 调度规则

1. 按 hookName 取 handlers：`getHooksForName(...)`。  
2. 排序规则：`priority` 降序（高优先级先执行）。

### 2) 两种执行模型

1. `runVoidHook(...)`  
并行执行（`Promise.all`），用于 `agent_end/gateway_start/...` 观察型 hook。

2. `runModifyingHook(...)`  
顺序执行，用于可修改 hook（`before_agent_start`、`before_tool_call`），并通过 merge 规则合并结果。

### 3) 故障策略

默认 `catchErrors=true`：

1. 单个 hook 报错只记日志，不打断主流程。  
2. 若显式关闭 catchErrors，则抛出错误（通常只用于调试）。

## 三、主链路注入点（你复刻时必须照这个位置插）

### 1) Agent 启动前

`runEmbeddedAttempt(...)` 调 `runBeforeAgentStart(...)`，可 prepend 额外上下文。

### 2) 工具调用前

`runBeforeToolCallHook(...)` 调 `before_tool_call`：  
可改参数，也可 `block + blockReason` 直接拦截。

### 3) 工具调用后

`handleToolExecutionEnd(...)` fire-and-forget 调 `after_tool_call`，用于审计/指标。

### 4) 会话结束

`runAgentEnd(...)` 上报消息快照、success/error、duration。

## 四、可复刻最小实现

```ts
type Hook = { name: string; priority?: number; run: (evt: any, ctx: any) => Promise<any> };

function getHooks(name: string, all: Hook[]) {
  return all
    .filter((h) => h.name === name)
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
}

async function runModifyingHook(name: string, evt: any, ctx: any, hooks: Hook[]) {
  let acc: any = undefined;
  for (const h of getHooks(name, hooks)) {
    try {
      const next = await h.run(evt, ctx);
      if (next != null) acc = { ...(acc ?? {}), ...next };
    } catch (e) {
      console.error(`[hook] ${name} failed`, e); // catchErrors=true
    }
  }
  return acc;
}

async function runVoidHook(name: string, evt: any, ctx: any, hooks: Hook[]) {
  await Promise.all(
    getHooks(name, hooks).map(async (h) => {
      try {
        await h.run(evt, ctx);
      } catch (e) {
        console.error(`[hook] ${name} failed`, e);
      }
    }),
  );
}
```

## 五、验收清单

1. 高优先级 hook 先执行。  
2. `before_tool_call` 可拦截危险参数。  
3. 任一 hook 报错不会导致聊天主链崩溃。  
4. 并行 hook 不会阻塞 tool summary / 主回复。  
5. 冲突注册会出 diagnostics，而不是静默覆盖。

## 六、常见坑

1. 全部 hook 都串行，吞吐下降明显。  
2. 可修改 hook 没优先级，结果不可预测。  
3. 异常直接 throw，单插件拖垮全系统。  
4. 注入点放错位置（比如工具执行后才做 before 检查）。

