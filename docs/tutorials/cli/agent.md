---
title: "openclaw agent"
sidebarTitle: "agent"
---

# `openclaw agent`

`agent` 用来从 CLI 发起一次 Agent 回合。它适合脚本触发、自动化任务和指定 Agent 执行一次明确工作。

```bash
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --session-id 1234 --message "continue"
```

## 什么时候用

- 脚本需要让 Agent 做一件事。
- 想指定某个 Agent，而不是走默认路由。
- 想把结果送回某个聊天通道。

## 新手提醒

至少要告诉它目标：`--agent`、`--to` 或 `--session-id`。
`--deliver` 表示把回复送回通道；不加时通常只在 CLI 输出里看结果。

新手先从 [Agent 是什么](/tutorials/concepts/agent) 开始。

## JSON 报错后，先确认是否已经执行

`--json` 失败响应使用 `ok: false`、`error.type: "cli_error"`。如果 CLI 已从 Gateway 获得运行标识，还会有顶层 `runId` 和 `origin: "gateway"`，包括受理后超时、断线以及缓存的最终错误。

`origin` 只说明运行归 Gateway 所有，不证明任务已经失败或停止。断线后先检查对应会话记录和运行状态，再决定是否重试，避免重复发送、重复修改文件。没有这些字段也只代表 CLI 没观察到 Gateway 运行标识，不能据此断定任务从未执行。

统计字段 `costUsd` 优先累加逐次模型请求记录的成本，保留分层价格、重试模型和缓存价格；缺少逐次成本时只对固定价格估算，无法可靠计算的成本会省略，不能把省略当成零费用。
