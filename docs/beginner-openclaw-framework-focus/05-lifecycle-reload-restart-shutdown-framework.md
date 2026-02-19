# 05 生命周期框架（热重载、重启、优雅关停）

## 小白先懂（30秒）

- 这套模块就是“系统运维保险丝”。  
- 能不停机生效的就热更，不能热更的才重启。  
- 关停时要按顺序收尾，避免一半成功一半失败。

## 你先照着做（不求全懂）

1. 先做配置文件监听。  
2. 再做“变更分类”：热更 or 重启。  
3. 重启前先等队列尽量清空。  
4. 统一 close 流程，最后才关网络连接。

对应核心代码：
- `src/gateway/config-reload.ts`
- `src/gateway/server-reload-handlers.ts`
- `src/infra/restart.ts`
- `src/gateway/server-restart-sentinel.ts`
- `src/infra/restart-sentinel.ts`
- `src/gateway/server-close.ts`

## 步骤一：执行链路拆解（具体到函数）

1. 启动监听  
`startGatewayConfigReloader(...)` 启动 `chokidar` 监听配置文件。
2. 生成变更计划  
`buildGatewayReloadPlan(...)` 把变更路径分成：
- hot reload
- restart
- noop
3. 执行热更或重启  
- 热更：`applyHotReload(...)`
- 重启：`requestGatewayRestart(...)`
4. 重启延迟策略  
`deferGatewayRestartUntilIdle(...)` 轮询活动任务，空闲后才 `emitGatewayRestart()`。
5. 重启续接提示  
旧进程写 `writeRestartSentinel(...)`，新进程 `consumeRestartSentinel(...)` 后回送提示消息。
6. 关停收口  
`createGatewayCloseHandler(...)` 统一 stop 各类 sidecar/channel，再 broadcast shutdown，最后关 ws/http。

## 步骤二：实现细节（你实现时要照着做）

1. reload 不是“文件变了就重启”
- 先 diff 路径，再按规则分类。
- 否则会出现“任何小改动都重启”的抖动问题。

2. 重启前活动任务统计
- `queueSize`（命令队列）
- `pendingReplies`（待发送回复）
- `embeddedRuns`（运行中的 agent）
- 三者合计决定是否延迟重启。

3. `deferGatewayRestartUntilIdle` 的三个回调
- `onReady`: 已空闲，立刻重启
- `onTimeout`: 等太久，强制重启
- `onCheckError`: 统计失败，保守重启

4. 关停顺序（必须稳定）
- 停发现/暴露（bonjour/tailscale）
- 停 plugin services / channel / watcher
- 广播 `shutdown`
- 关闭 ws、http

5. sentinel 的价值
- 重启不是黑盒。
- 用户能在原 session 看到“已重启/重启失败”的结果消息。

## 最小复刻骨架（更贴近真实）

```ts
async function onConfigChange(paths: string[]) {
  const plan = classify(paths); // hot/restart/noop
  if (plan.restart) {
    await deferUntilIdle({ timeoutMs: 30_000 });
    emitSigusr1RestartOnce();
    return;
  }
  if (plan.hot) {
    await applyHotReload(plan);
  }
}

async function closeGateway() {
  await stopDiscoveryAndExposure();
  await stopChannelsAndPlugins();
  broadcastShutdown();
  await closeNetworkServers();
}
```


