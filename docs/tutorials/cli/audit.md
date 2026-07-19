---
title: "Audit 审计命令"
sidebarTitle: "Audit"
description: "用 openclaw audit 查看元数据级运行、工具和消息审计记录。"
---

# Audit 审计命令

`openclaw audit` 不是用来看聊天正文的。
它更像“谁在什么时候做了什么动作”的操作账本。

适合回答这类问题：

- 哪个 Agent 跑过这次任务
- 哪个工具调用失败了
- 某条消息是入站还是出站
- 一段时间里系统整体活动如何

如果你要看聊天内容本身，应该去会话记录、transcript 或聊天界面，不是这里。

---

## 先记住它查的是什么

Audit 记录的是元数据，不是正文。

也就是说，它会保留：

- 时间
- agent id
- run id
- 工具名
- 成功 / 失败 / 超时 / blocked 等状态
- 部分消息方向和通道信息

它不会把完整消息正文当成审计主存储。

这对排障和留痕很重要，因为你既能查活动，又不必把所有聊天正文都当成审计日志保存。

---

## 常见用法

```bash
openclaw audit
openclaw audit --agent main --status failed
openclaw audit --kind tool_action --limit 50 --json
openclaw audit --kind message --direction outbound --channel telegram --json
openclaw audit --run 8c69f72e-8b11-4c54-98d5-1a3dd67450c3
```

如果你在做自动化排障，最常用的是 `--status failed`、`--kind tool_action` 和 `--json`。

---

## 最实用的过滤条件

- `--agent <id>`：只看某个 Agent
- `--session <key>`：只看某个会话相关运行
- `--run <id>`：追一个具体 run
- `--kind <kind>`：`agent_run`、`tool_action`、`message`
- `--status <status>`：比如 `failed`、`blocked`、`timed_out`
- `--direction <direction>`：消息方向，`inbound` 或 `outbound`
- `--channel <channel>`：例如 `telegram`、`discord`
- `--after` / `--before`：按时间范围查
- `--limit <count>`：控制一页大小
- `--json`：机器可读输出

---

## 两种排障思路

### 1. 从失败结果往回查

比如某个 Agent 明明应该回复，却没回复：

```bash
openclaw audit --agent main --status failed --limit 20
```

先确认有没有失败 run、失败 tool action，还是其实消息根本没进来。

### 2. 从消息链路往前查

比如用户说“Telegram 收到了消息，但没有发出去”：

```bash
openclaw audit --kind message --channel telegram --limit 50 --json
```

你可以先看入站有没有记录，再看出站有没有记录。
这样能很快分清是“没收到”还是“收到了但处理失败”。

---

## 和 transcript / logs 的区别

三者别混：

- `audit`：看元数据留痕，适合追运行链路
- `logs`：看运行时日志，适合抓错误堆栈和详细原因
- `transcript` / 聊天界面：看具体对话内容

最常见的正确姿势是：

1. 先用 `audit` 缩小失败范围
2. 再用 `logs` 找真正报错点
3. 必要时再看对应会话内容

---

## 什么时候需要先配网关侧审计

`openclaw audit` 能查到什么，取决于 Gateway 侧到底有没有启用对应审计类别。

如果你想理解底层数据模型、保留期和配置项，继续看：

- [Gateway 审计总览](/tutorials/gateway/audit)

---

## 相关页面

- [Gateway 审计总览](/tutorials/gateway/audit)
- [CLI Gateway 命令](/tutorials/cli/gateway)
- [会话管理](/tutorials/concepts/session)
- [调试与排障](/tutorials/help/debugging)

