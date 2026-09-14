---
title: "后台任务 Tasks"
sidebarTitle: "后台任务"
description: "OpenClaw 自动化：Tasks 是后台工作的流水账，用来查看 cron、子智能体、CLI 后台运行等任务是否成功。"
---

# 后台任务 Tasks

Tasks 不是“定时器”，也不是“会话”。
它更像一本工作登记簿：谁在后台做了什么、什么时候开始、现在跑到哪、最后成功还是失败。

比如你让 OpenClaw 做一个后台任务：

- cron 定时任务跑了一次
- 子智能体被派出去做研究
- CLI 发起了一次 Agent 运行
- 某个后台媒体生成任务还没结束

这些都会留下 Task 记录，方便你回头查。

---

## 什么时候会产生 Task

| 来源 | 会不会产生 Task | 说明 |
|------|-----------------|------|
| Cron 执行 | 会 | 每次执行都会记录 |
| 子智能体 | 会 | 方便看子任务是否完成 |
| CLI Agent 命令 | 会 | 适合排查脚本触发的运行 |
| 普通聊天 | 通常不会 | 普通对话属于会话本身 |
| Heartbeat | 通常不会 | Heartbeat 是当前会话的跟进机制 |

一句话：离开当前对话、在后台跑的工作，更可能会产生 Task。

---

## 常用命令

```bash
openclaw tasks list
openclaw tasks show <task-id>
openclaw tasks cancel <task-id>
openclaw tasks audit
```

如果任务很多，可以筛选：

```bash
openclaw tasks list --status running
openclaw tasks list --runtime cron
```

---

## 状态怎么看

| 状态 | 人话解释 |
|------|----------|
| `queued` | 已登记，正在等开始 |
| `running` | 正在执行 |
| `succeeded` | 成功完成 |
| `failed` | 执行失败 |
| `timed_out` | 超时 |
| `cancelled` | 被你取消 |
| `lost` | OpenClaw 找不到它的运行状态了 |

`lost` 不一定代表任务真的没做完，它表示 OpenClaw 已经拿不到可信状态，需要你看日志或任务详情确认。

独立 CLI 的 audit/maintenance 不能凭自己的空运行注册表，就把 Gateway 中仍活跃的 CLI task 标成 lost；只有 Gateway 维护流程拥有这项活性判断。自动化也先查持久运行历史再判断丢失，不能将本机看不到运行等同于远端已经结束。

---

## 什么时候看 Tasks

- cron 说跑了，但你没收到结果
- 子智能体一直没回消息
- 后台任务太多，想知道谁还在跑
- 想取消一个跑太久的任务
- 想审计最近的自动化有没有失败

排查顺序：

```bash
openclaw tasks list
openclaw tasks show <task-id>
openclaw logs --follow
```

先看任务登记，再看具体任务，最后看日志。

---

## 和 Cron、Heartbeat 的区别

- Cron 决定什么时候运行。
- Heartbeat 让当前会话稍后继续。
- Tasks 记录后台运行发生了什么。

所以 Tasks 不替代 Cron，也不替代 Heartbeat。它只是让你知道“后台那件事到底怎么样了”。
