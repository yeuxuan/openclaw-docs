---
title: "Code Mode 执行器：Node 与 QuickJS"
sidebarTitle: "Code Mode 执行器"
description: "为 OpenClaw Code Mode 选择 Node 或 QuickJS 执行器，理解 node:vm、WASI 隔离、等待状态和升级迁移边界。"
---

# Code Mode 执行器：Node 与 QuickJS

Code Mode 启用后默认使用 Node。需要更硬的 guest 隔离时，显式选择 QuickJS。两者运行相同的普通 JavaScript cell，使用相同的 `exec` / `wait` 和工具桥；“选择执行器”与“启用 Code Mode”是两件事。

| 执行器 | 适合场景 | 实现 | 挂起状态 |
|--------|----------|------|----------|
| `node`（默认） | 信任在 Gateway 主机上运行的编排代码 | worker thread 中的 Node `node:vm` | 保留活动 worker 与上下文 |
| `quickjs` | 需要隔离不可信 guest 代码 | bundled executor plugin 提供的 QuickJS-WASI worker | 序列化 VM 快照 |

::: danger Node `node:vm` 不是安全边界
worker 可以避免堵住 Gateway 主事件循环，但仍共享 Gateway 进程的操作系统权限。不要用它执行敌对 JavaScript。需要更强边界时用 QuickJS，并按风险继续使用独立系统用户、容器或主机。
:::

无论选择哪个执行器，经工具桥发起的调用仍执行 OpenClaw 的工具策略、审批、hook、会话归属和审计。QuickJS 隔离代码本身，但如果工具策略授予了强能力，guest 仍能调用那些工具。

## 配置执行器

在 Settings → Agents & Tools → Labs → Code Mode executor 中选择，或写入：

```json5
{
  tools: {
    codeMode: {
      enabled: true,
      executor: "node",
    },
  },
}
```

需要按模型自动启用，同时保留执行器选择时：

```json5
{
  tools: {
    codeMode: {
      enabled: "auto",
      executor: "quickjs",
    },
  },
}
```

按 Agent 覆盖：

```json5
{
  agents: {
    entries: {
      research: {
        tools: { codeMode: { executor: "quickjs" } },
      },
    },
  },
}
```

QuickJS 的 bundled plugin ID 是 `code-mode-quickjs`。显式选择该 executor 会激活它，即使通用插件开关关闭或 `plugins.allow` 没列出；但 `plugins.deny` 或 `plugins.entries.code-mode-quickjs.enabled: false` 仍会阻止加载。

配置的执行器不可用时，本轮以 `runtime_unavailable` 失败，不会偷偷回退到 Node，也不会改为暴露所有直接工具。

## 等待、内存和重启边界

- 一个 cell 从开始到所有 `wait` 都固定使用同一执行器；改配置只影响新 cell。
- Node 挂起时保留活动上下文；QuickJS 可以释放 worker，并在 `wait` 时恢复快照。
- 两种挂起都只是进程内临时状态，Gateway 重启后不会恢复。
- `timeoutMs`、输出限制、并发调用限制、挂起容量和 `snapshotTtlSeconds` 对两者都生效。
- `maxSnapshotBytes` 只约束 QuickJS 序列化快照；Node 没有这种快照。
- `memoryLimitBytes` 对 QuickJS 是 guest 内存限制；对 Node 只是 V8 worker heap 的尽力预算，不是安全边界，也不限制整个 Gateway RSS。

## 从旧配置升级

Doctor 和符合条件的启动迁移会把：

```json5
{ runtime: "quickjs-wasi" }
```

迁移为：

```json5
{ executor: "quickjs" }
```

已有 `executor` 时它优先。迁移只保留执行器选择，不会擅自改变 Code Mode 的启用状态和资源限制。

启用优先级、工具调用和失败恢复见 [Code Mode](/tutorials/reference/code-mode)。

上游来源：[`docs/tools/code-mode/executors.md`](https://github.com/openclaw/openclaw/blob/fb4653dbea6650c0fae516151fa87fda5ee4aaf9/docs/tools/code-mode/executors.md)。
