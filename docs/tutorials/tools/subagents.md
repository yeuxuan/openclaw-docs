---
title: "子智能体"
sidebarTitle: "子智能体"
description: "OpenClaw 工具系统：子智能体（Sub-Agents）。子智能体（Sub-Agents）让主 Agent 可以启动并协调其他 Agent 来并行完成复杂任务。就像一个项目经理把工作分配给团队成…"
---

# 子智能体（Sub-Agents）

子智能体（Sub-Agents）让主 Agent 可以启动并协调其他 Agent 来并行完成复杂任务。就像一个项目经理把工作分配给团队成员一样，主 Agent 可以将大任务拆分成多个子任务，分发给专门的子 Agent 处理，最后汇总结果。

---

## 先讲人话

子智能体就是“主助手临时请来的帮手”。

比如你让 OpenClaw 同时看三个项目：

- 一个帮手看项目 A。
- 一个帮手看项目 B。
- 一个帮手看项目 C。
- 主助手最后把三份结果合成一份报告。

如果任务很小，比如“帮我改一句话”，不需要子智能体。
如果任务很大、能拆成几块，子智能体才有意义。

::: tip 新手建议
先不要急着打开很高的并发数。
子智能体越多，花费的模型 Token 越多，权限管理也越复杂。
:::

---

## 快速上手

多数普通对话不需要你手动“启用子智能体”。
能不能使用子智能体，取决于当前 Agent 的工具策略。官方当前说明里，`coding` 和 `full` 这类工具配置会暴露 `sessions_spawn`；偏消息聊天的配置可能不会暴露。

先在同一个会话里看可用工具：

```text
/tools
```

如果里面看不到 `sessions_spawn` 或 `subagents`，说明当前会话不能启动子智能体。
这时不要乱改配置，先确认你确实需要并行任务，再参考官方工具策略配置。

让主 Agent 协调子 Agent 的例子：

主 Agent 会根据任务复杂度自动决定是否启动子 Agent：

```text
帮我同时分析三个代码库的结构，并生成对比报告
```

主 Agent 会启动三个子 Agent，分别分析不同的代码库，然后汇总结果。

---

## 工作方式

```text
用户消息
    ↓
主 Agent 分析任务
    ↓
决定需要子 Agent
    ↓
启动子 Agent 1  启动子 Agent 2  启动子 Agent 3
    ↓                ↓               ↓
  完成任务A        完成任务B        完成任务C
    ↓                ↓               ↓
          主 Agent 收集结果
                ↓
          汇总并回复用户
```

`sessions_spawn` 在启动被接纳后返回 runId，不等待子任务完成；云 worker 创建子任务时可能先等待资源供应和节点注册，不能把它理解成永远即时返回。完成结果通过推送交回父会话，主 Agent 负责整合最终答案。

你平时不需要记住内部格式。
只要知道：子 Agent 不直接替你做最终决定，最后仍由主 Agent 汇总和回复。

---

## 完整配置示例

下面是“调节子智能体行为”的配置，不是新手第一天必填项。
字段路径要放在 `agents.defaults.subagents` 下面。

```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 8,        // 全局并发上限，默认 8
        maxSpawnDepth: 1,        // 默认不允许子 Agent 再继续生子 Agent
        maxChildrenPerAgent: 5,  // 每个会话最多同时挂几个子 Agent
        runTimeoutSeconds: 900,  // 单次运行超时；0 表示不设超时
        archiveAfterMinutes: 60, // 完成后多久自动归档
      },
    },
  },
}
```

---

## 在聊天里管理子智能体

当前可用的斜杠入口只负责观察。停止、继续指令和创建任务应使用当前 Agent 获准的原生控制工具，不要再套用旧的聊天子命令：

```text
/subagents list
/subagents log <id|#> [limit] [tools]
/subagents info <id|#>
```

常用入口：

| 命令 | 人话解释 |
|------|----------|
| `/subagents list` | 看当前有哪些子智能体 |
| `/subagents info <id|#>` | 查看指定子智能体详情 |
| `/subagents log <id|#>` | 看某个子智能体做了什么 |

不要为了等待结果反复刷 `/subagents list`。子智能体完成后会把结果宣布回主会话。

## 宣布流程（Announce）

Announce 指完成结果向请求者交接，不是启动时再次询问要做什么。任务通过子会话的 `[Subagent Task]` 消息传入；fork 历史中的旧任务只是上下文，不是当前子任务。需要等待结果的父 Agent 应调用 `sessions_yield`，让完成事件成为下一次模型可见消息，而不是轮询状态。

---

## 工具策略（Tool Policy）

你可以限制子 Agent 可以使用的工具，避免子 Agent 拥有过多权限：

```json5
{
  tools: {
    profile: "coding",
    alsoAllow: ["sessions_spawn", "subagents"],
  },
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 3,
      },
    },
  },
}
```

::: tip 最小权限原则
子 Agent 通常只需要完成特定任务，不需要完整权限。
具体允许哪些工具，要以当前版本的工具策略和 `/tools` 输出为准。
:::

比如只让子 Agent 查网页，就不要给它运行命令的权限。
这能减少误操作，也更容易排查问题。

---

## 认证继承

原生子 Agent 使用目标 Agent 身份解析认证，不是无条件复制父运行里的全部凭据：

::: details 认证继承说明
- 先读取目标 Agent 的 agentDir 本地认证 overlay。
- 共享 auth profiles 作为 fallback 合并，冲突时 Agent 配置优先。
- 共享 fallback 仍然可用，因此这不是完全隔离的每 Agent 认证边界。
:::

---

## 上下文传递

非线程绑定的原生子智能体默认 `isolated`，不自动拿主会话完整记录；线程绑定 spawn 遵循 `threadBindings.defaultSpawnContext`，默认 `fork`。需要独立审阅时显式设置 `context: "isolated"`。返回的 `context` 才是实际初始化方式，fork 超过父上下文上限时可能落到 isolated。

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "openai/gpt-5.4-mini",
        thinking: "low",
      },
    },
  },
}
```

::: warning
传递过多上下文会增加 Token 消耗。
显式隔离通常更省，也更不容易把无关信息带进去。
:::

简单理解：给帮手看的材料越多，成本越高，也越容易把无关信息带进去。
默认值通常已经够用。

---

## 停止子 Agent

在请求者聊天发送 `/stop` 会停止会话工作、清队列并取消活跃子树。线程解绑则使用 `/session unbind`，只解绑、不关闭底层 Agent 会话。

```text
/stop
```

Gateway 的 `chat.abort` 携带 runId 时按指定父运行取消其子树；不带 runId 的普通 chat.abort 不级联。会话级 `sessions.abort` 会请求取消后代，但清理排队 follow-up 还需 `clearQueued: true`。取消不完整会报告错误和失败数量，应检查剩余[后台任务](/tutorials/automation/tasks)后重试，不能把接纳请求当成全部已停止。

父任务正常完成、yield 或超时不会自动取消已接纳的子任务。非沙箱下会话工具默认 `agent` 可见范围；需要当前及派生会话范围时显式设 `tree`，更严用 `self`，详见[会话工具](/tutorials/concepts/session-tool)。

---

## 使用限制

| 限制项 | 默认值 | 说明 |
|--------|--------|------|
| 最大并发数 | 8 | `agents.defaults.subagents.maxConcurrent`，全局并发上限 |
| 单个超时 | 0 | `runTimeoutSeconds`，0 表示不设默认超时 |
| 嵌套深度 | 1 | `maxSpawnDepth`，默认不允许子 Agent 再启动子 Agent |
| 每个会话子数量 | 5 | `maxChildrenPerAgent`，限制一个会话下面同时挂多少子 Agent |

::: details 修改限制配置
```json5
{
  agents: {
    defaults: {
      subagents: {
        maxConcurrent: 5,
        runTimeoutSeconds: 300,
        maxSpawnDepth: 1,
      },
    },
  },
}
```
:::

---

_下一步：[斜杠命令（Slash Commands）](/tutorials/tools/slash-commands) | [工具系统总览](/tutorials/tools/)_
