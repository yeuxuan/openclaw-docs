# 51 函数级剖析：server-startup-memory

核心文件：`src/gateway/server-startup-memory.ts`

## 模块定位

网关启动时的 qmd 记忆后端预热器。
是可选侧车（sidecar），失败不影响主服务启动。

## 一、startGatewayMemoryBackend（精确行为）

```ts
export async function startGatewayMemoryBackend(params: {
  cfg: OpenClawConfig;
  log: { info: (msg: string) => void; warn: (msg: string) => void };
}) {
  // 1. 非 qmd backend 直接跳过（builtin 不需要预热）
  const backendConfig = resolveMemoryBackendConfig({ cfg: params.cfg, agentId: ... });
  if (backendConfig.backend !== "qmd") return;

  // 2. 解析默认 agentId（记忆按 agent 维度配置）
  const agentId = resolveDefaultAgentId(params.cfg);

  // 3. 尝试初始化 qmd manager（提前触发，暴露配置问题）
  const { manager, error } = await getMemorySearchManager({ cfg: params.cfg, agentId });

  if (manager) {
    params.log.info(`qmd memory startup initialization armed for agent "${agentId}"`);
  } else {
    params.log.warn(`qmd memory startup initialization failed for agent "${agentId}": ${error}`);
  }
}
```

成功日志格式（源码测试用例验证）：
```
'qmd memory startup initialization armed for agent "ops"'
```
失败日志格式（源码测试用例验证）：
```
'qmd memory startup initialization failed for agent "main": qmd missing'
```

## 二、调用方式（server-startup.ts 精确模式）

```ts
// src/gateway/server-startup.ts — startGatewaySidecars 内

void startGatewayMemoryBackend({ cfg: params.cfg, log: params.log }).catch((err) => {
  params.log.warn(`qmd memory startup initialization failed: ${String(err)}`);
});
```

三个关键点：
1. **`void`** — fire-and-forget，不 await，不阻塞主流程
2. **`.catch(warn)`** — 捕获异常转为 warn，不让异常冒泡
3. **函数本身也内部 catch** — 双重保护，即使内部代码抛出也不崩服务

## 三、为什么必须按 agentId 初始化

记忆后端是**按 agent 维度**配置的：
- 不同 agent 可以有不同的 qmd 路径和 collection
- 必须先确定 `defaultAgentId` 才能解析出正确的 qmd 配置
- 启动阶段选择 `resolveDefaultAgentId(cfg)` 作为预热目标

如果有多个 agent（`agents.list`），`resolveDefaultAgentId` 选择 `default=true` 的那个，
多个 `default=true` 时取第一个并打 warn。

## 四、设计意图：把故障前置

| 不预热 | 预热 |
|--------|------|
| 配置错误在第一次用户查询时才暴露 | 配置错误在启动时就暴露 |
| 用户遇到问题时处于对话上下文中，难以定位 | 运维人员看启动日志就能发现 |
| qmd 进程冷启动延迟在首次查询时叠加 | 冷启动延迟在启动阶段消耗 |

## 五、自检清单

1. `backend !== "qmd"` 时直接返回，不做任何操作（builtin 无需预热）。
2. 调用方用 `void ... .catch(warn)` 包裹，保证不阻塞网关上线。
3. 成功日志包含 `agentId`，便于定位是哪套 agent 配置的记忆初始化成功。
4. 失败日志包含 `agentId` + 错误原因，一条日志能定位问题。
5. 初始化失败不导致网关启动失败（仅 warn，主服务继续运行）。
