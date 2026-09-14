---
title: "Code Mode：用代码编排工具"
sidebarTitle: "Code Mode"
description: "OpenClaw Code Mode 的启用优先级、QuickJS 工具调用、等待恢复和失败后的安全核对。"
---

# Code Mode：用代码编排工具

Code Mode 让模型用一小段 JavaScript/TypeScript 查找和调用工具，减少一次向模型暴露的大量工具定义。它仍遵守原有权限、审批、沙箱、插件 hook 与审计规则，不是绕过工具策略的执行入口。

这里讲的是 **OpenClaw 通用 Agent runtime 的 Code Mode**：外层 `exec` 接收 JSON `{ code, language }`，在 QuickJS-WASI worker 中运行。不要把其他 coding harness 的同名功能、原始 JavaScript 输入格式或 shell `exec.command` 直接套进来。

## 启用与模型覆盖

默认关闭。在 Control UI 的 **Settings → Agents & Tools → Labs → Code Mode** 打开后，保存的是全局 `"auto"`，下一轮生效，不需要重启 Gateway：

```json5
{
  tools: { codeMode: "auto" },
}
```

- `false`：默认不启用，但 Agent/模型的更具体设置仍可覆盖。
- `true`：默认给有工具的运行启用，具体覆盖仍可关闭。
- `"auto"`：仅给 Provider 目录标为 `compat.codeMode: "preferred"` 的模型启用。
- 对象配置未写 `enabled` 时仍为关闭；只调整内存、输出或超时限制不会自动启用。

按优先级，从上往下取第一个显式启用设置：

1. `agents.entries.<agent>.models["provider/model"].codeMode`
2. `agents.entries.<agent>.tools.codeMode`（或对象的 `enabled`）
3. `agents.defaults.models["provider/model"].codeMode`
4. 全局 `tools.codeMode`（或对象的 `enabled`，默认 `false`）

模型行只接受布尔值，不能写 `"auto"`；也不能把 `codeMode` 放在 `"openai/*"` 这样的通配模型行上，否则配置校验会拒绝。

```json5
{
  tools: { codeMode: "auto" },
  agents: {
    defaults: {
      models: {
        "openai/gpt-5.6-luna": {
          agentRuntime: { id: "openclaw" },
          codeMode: true,
        },
      },
    },
    entries: {
      research: {
        models: {
          "openai/gpt-5.6-luna": { codeMode: false },
        },
      },
    },
  },
}
```

上例仅让 `research` Agent 在该模型上关闭 Code Mode。运行时选择与启用开关是两件事：`agentRuntime.id` 单独选用 OpenClaw runtime；这些开关不控制 Codex 原生 Code Mode。模型覆盖也不会增加工具权限或改变全局/Agent 的资源限制。

## 工具怎么调用

启用后，模型看到外层 `exec`、`wait` 和必须直接暴露的工具。脚本中使用快速索引列出的异步全局函数，或通过 `catalog.search()` 获取可调用 handle，再用 `describe()` 核实参数；MCP 工具走独立的 `MCP` 命名空间。

不要猜工具名，也不要递归调用外层 `exec` / `wait`。QuickJS 里没有直接文件系统、网络、子进程、环境变量、`import` 或 `require`；这些能力必须经过已授权工具。

每个工具 Promise 都要 `await` 或显式处理拒绝。未等待调用或定时器回调里的未处理错误，也会令 cell 失败，不能因为脚本已返回就认为所有动作成功。

## 什么时候调用 wait

只有外层结果为 `status: "waiting"` 时，才把它的顶层 `runId` 传给 `wait`。不要把后台 shell 在 `value` 内返回的 `sessionId` 当成 Code Mode ID；shell 进程需要在新的 cell 中通过已启用的进程工具处理。

挂起快照只存于当前进程，绑定原运行和会话，不写数据库。取消原运行/工具调用会释放快照并取消待执行工作；若外部操作不支持取消，它可能仍然完成，但不能重新唤醒已关闭的脚本。运行中和挂起后的恢复共享同一个 cell 生命周期。

## 失败后不要直接重放整段代码

- 语法、转换或宿主明确证明“没有潜在变更开始”的错误，可修正后重新调用，审批与 hook 会重新检查。
- 若先前调用可能已写入、发送或部分成功，先进入一次受限的只读核对，确认真实状态。
- 若核对仍有未完成工作，运行时可允许一次有界恢复：关闭 Code Mode，恢复真实名称和参数 schema 的直接工具/Tool Search；已完成或效果不明的同一调用不得原样重复。
- 这一恢复只允许一次变更尝试，之后仍可读状态或查 schema，不能不断盲试写操作。普通截图、窗口和光标观察不消耗这次变更机会；浏览器准备、输入或处理对话框属于变更。
- 取消、明确的终止结果、策略拒绝和审批要求不会因“恢复”而失效，也不会恢复已消耗的授权。

## 输出和限制

常用默认值如下，单位要区分：

| 配置 | 默认值 |
|------|--------|
| `timeoutMs` | 10000 毫秒 |
| `memoryLimitBytes` | 64 MiB |
| `maxOutputBytes` | 65536 字节 |
| `maxSnapshotBytes` | 10 MiB |
| `maxPendingToolCalls` | 16 |
| `snapshotTtlSeconds` | 900 秒 |

每个嵌套工具结果分别受 `maxOutputBytes` 限制；guest 累计输出与最终值/错误诊断共享跨所有 wait 的输出预算。成功输出超大时会截断，但仍是成功；错误截断保留开头原因并以 `[error truncated]` 标记，不会变成成功。结果还可能受到当前模型的上下文和持久化限制。

完成的嵌套调用以有界、脱敏、仅供展示的活动保存；模型重放只保留实际模型调用，不会凭空增加子工具消息。开始事件和中间更新仍是临时数据，缺失的旧活动不能由脚本源码反推回来。

若已启用但 QuickJS-WASI 无法加载，本轮失败关闭，不会静默暴露所有普通工具。

## 排查顺序

1. 确认本轮选中的模型和 runtime，再核对四级覆盖；全局 Labs 开关并不总是最终值。
2. 检查当前工具策略是否允许所需工具。
3. 区分外层 waiting/runId 与后台命令 sessionId。
4. 看原始失败原因、审批记录和真实系统状态，再决定能否继续。
5. 查看 [Tool Search](/tutorials/tools/tool-search)、[Exec 工具](/tutorials/tools/exec) 与 [Swarm](/tutorials/tools/swarm)。

上游来源：[OpenClaw Code Mode](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/tools/code-mode.md)。
