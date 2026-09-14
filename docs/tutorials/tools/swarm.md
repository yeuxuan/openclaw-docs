---
title: "Swarm"
sidebarTitle: "Swarm"
description: "在 Code Mode 脚本中并发编排多个 Collector 子智能体，并收集结构化结果。"
---

# Swarm

Swarm 是实验性、默认关闭的多子智能体编排能力。它不引入图形 DSL，而是在 Code Mode 中使用 `Promise.all`、`while`、`if` 等普通 JavaScript/TypeScript 控制流。

## 启用

推荐在“Settings → Labs → Swarm”打开，也可以直接配置：

```json5
{
  tools: {
    codeMode: true,
    swarm: {
      enabled: true,
      maxConcurrent: 8,
      maxChildrenPerGroup: 50,
      maxTotalPerGroup: 200,
      waitTimeoutSecondsMax: 600,
    },
  },
}
```

Code Mode 还必须实际拥有 `sessions_spawn` 权限；Provider、Tool Policy、Sandbox 或 `subagents.allowAgents` 都可能继续限制目标 Agent。

## 基本模式

```javascript
phase("Independent review");

const reports = await Promise.all(
  ["auth", "storage", "recovery"].map((topic) =>
    agents.run(`Review ${topic} and return evidence.`, {
      label: `review-${topic}`,
      thinking: "high",
    }),
  ),
);

log(`Collected ${reports.length} reports.`);
return reports;
```

带 JSON Schema 时，Child 必须通过 `structured_output` 返回可验证数据；失败、超时或结构错误会让 Promise 拒绝。Collector Child 默认是叶节点，而且需要审批的动作会直接拒绝，不会弹出操作者审批窗口。

所有循环都要有明确上限。`maxTotalPerGroup` 只是失控保护，不应替代终止条件。大规模 Fan-out 还要给 Code Mode 的 Pending Tool Call 上限留出余量。

显式 Stop 指向父运行时，会取消它的 Collector 子树并阻止已选中的排队 Collector 开始；取消不完整会返回错误。父运行正常完成、yield 或超时则不会自动取消已接纳的子任务。具体 Gateway 与会话级停止范围见[子智能体](/tutorials/tools/subagents)。

Code Mode 的全局/Agent/模型启用优先级见 [Code Mode](/tutorials/reference/code-mode)；仅设置其资源限制不会启用它。

上游来源：[`docs/tools/swarm.md`](https://github.com/openclaw/openclaw/blob/main/docs/tools/swarm.md)。
