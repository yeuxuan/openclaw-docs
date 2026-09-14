---
title: "Goal 会话目标"
sidebarTitle: "Goal"
description: "OpenClaw 工具系统：用 /goal 为当前会话设置一个持久目标，并跟踪完成、阻塞和 token 预算状态。"
---

# Goal 会话目标

Goal 是绑定在当前 OpenClaw 会话上的一个持久目标。它适合长任务：让用户、Agent 和 TUI 都能看到“这一轮到底要完成什么”。

Goal 不是后台任务、提醒、Cron 或 Standing Order。它把当前会话的目标固定下来；Control UI 的开始和恢复还会接纳一轮运行，但不等于创建定时调度。

---

## 快速使用

设置目标：

```text
/goal start 修复 PR 里的 CI 失败，验证后推送
```

查看当前目标：

```text
/goal
```

暂停：

```text
/goal pause 等待 CI 结果
```

恢复：

```text
/goal resume
```

完成：

```text
/goal complete 已修复并验证
```

清除：

```text
/goal clear
```

---

## 适合什么场景

- PR 收尾：修复、验证、复审、推送、更新 PR。
- Bug 定位：复现、找根因、修补、验证修复有效。
- 文档更新：读相关资料、写页面、补交叉链接、构建验证。
- 维护任务：检查当前状态、做有限改动、跑对应检查、报告结果。

如果工作需要脱离当前会话运行、定时重复、拆成多个托管子任务，请看 [Task Flow](/tutorials/automation/taskflow)、[任务](/tutorials/automation/tasks)、[Cron 定时任务](/tutorials/automation/cron-jobs) 或 [Standing Orders](/tutorials/automation/standing-orders)。

---

## 命令参考

- `/goal` 或 `/goal status`：查看当前目标。
- `/goal start <objective>`：创建新目标。
- `/goal edit <objective>`：只改目标文本，保留状态和 token 计量。
- `/goal set <objective>`、`/goal create <objective>`：`start` 的别名。
- `/goal pause [note]`：暂停目标。
- `/goal resume [note]`：恢复暂停、阻塞或预算受限的目标。
- `/goal complete [note]`：标记完成。
- `/goal done [note]`：`complete` 的别名。
- `/goal block [note]`：标记阻塞。
- `/goal blocked [note]`：`block` 的别名。
- `/goal clear`：从会话清除目标。

一个会话同一时间只能有一个 Goal。即使旧目标已完成，开始新目标前也要先 `/goal clear`。`/goal start` 没有 token-budget flag；预算由 `create_goal` 工具设置。

---

## 状态

- `active`：正在追这个目标。
- `paused`：用户暂停了目标。
- `blocked`：目标被真实阻塞。
- `budget_limited`：达到 token 预算。
- `usage_limited`：为后续使用量限制预留的状态。
- `complete`：目标完成。

`/new` 和 `/reset` 会清除当前会话 Goal，因为它们表示开始新的会话上下文。

---

## Token 预算

Goal 可以带 token 预算。达到预算后，状态会变成 `budget_limited`，目标不会被删除，但 Agent 不会继续主动追这个目标，直到你恢复或清除。

Token 预算只是会话目标护栏，不是账单上限。模型额度、费用统计和上下文窗口仍由 OpenClaw 正常的使用量控制负责。

---

## Agent 工具

OpenClaw 暴露了三个目标工具给 Agent Harness：

- `get_goal`：读取当前会话目标和预算状态。
- `create_goal`：只有用户、系统或开发者明确要求时才创建目标。
- `update_goal`：把目标标记为 `complete` 或 `blocked`。

模型不能悄悄暂停、恢复、清除或替换目标。这些动作需要通过 `/goal` 这类会话控制完成。

## Control UI 的 Goal 输入模式

从命令选择器选 **Goal**，输入目标并发送。该模式下 `clear` 或 `/stop` 都是目标的字面文本，不会变成命令；取消则把内容留为普通聊天草稿。

开始会一起保存目标、用户输入和运行接纳；接纳失败则保留草稿，不留下空转目标。Start/Resume 要求空闲、本地且历史可恢复的会话，不会排队或 steer 到另一轮运行。

输入框上方的目标条可编辑、暂停/恢复、清除和展开。Edit/Pause/Clear 不发送斜杠命令、不新增聊天轮次；Resume 会通过正常聊天接纳继续工作，但内部续跑输入不显示成人类消息。断开连接或有待处理 Goal 操作时不可再次修改，展开查看仍可用。

集成方重试结构化 Goal 请求时，应保留原 `operationId`、`issuedAtMs`、目标与 payload。操作回执有效期 24 小时；同 ID 不同请求会拒绝。`replayed: true` 是原操作结果，不是当前目标快照，需刷新会话；幂等保护不保证外部工具副作用恰好发生一次。
