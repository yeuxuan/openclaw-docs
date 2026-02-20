---
title: "自动化模块概览"
sidebarTitle: "自动化"
---

# 自动化（Automation）

OpenClaw 提供了三种强大的自动化方式，让你的 Agent 无需手动干预就能自动响应事件、定时执行任务或接收外部触发。无论是持续监控、定时报告还是外部系统集成，都能轻松实现。

---

## 三种自动化方式

### 1. Hooks（事件钩子）

当系统内部发生特定事件时自动触发脚本执行。适合在 Agent 生命周期的关键节点插入自定义逻辑。

- 会话启动/结束时执行初始化或清理
- 消息收发时做日志记录或内容过滤
- 工具调用前后做审计和监控

[查看 Hooks 文档 →](./hooks)

---

### 2. Cron（定时任务）

使用标准 cron 表达式，在精确的时间点自动触发 Agent 执行任务。适合周期性、有时间要求的工作。

- 每天早上 9 点生成工作日报
- 每周五下午汇总本周数据
- 每小时检查一次系统状态

[查看 Cron 定时任务文档 →](./cron-jobs)

---

### 3. Webhook（外部触发）

通过 HTTP 接口让外部服务主动触发 OpenClaw 的 Agent 执行。适合与第三方系统集成。

- GitHub Actions 完成后触发通知 Agent
- 外部监控系统告警时自动响应
- 任意 HTTP 客户端按需触发任务

[查看 Webhook 文档 →](./webhook)

---

## 扩展功能

| 功能 | 说明 | 文档 |
|------|------|------|
| Cron vs Heartbeat | 了解两种持续运行模式的区别和选择建议 | [对比说明](./cron-vs-heartbeat) |
| 轮询通道（Poll） | 对不支持推送的通道主动轮询新消息 | [轮询配置](./poll) |
| Gmail PubSub | 实时接收 Gmail 邮件通知，无需轮询 | [Gmail 集成](./gmail-pubsub) |
| OAuth 认证监控 | 监控 Token 过期，防止服务中断 | [认证监控](./auth-monitoring) |
| 故障排查 | Cron、Heartbeat、Webhook 常见问题解决 | [故障排查](./troubleshooting) |

---

::: tip 从哪里开始？
- 如果你是第一次使用自动化功能，推荐从 **[Hooks 事件钩子](./hooks)** 开始，理解事件驱动机制。
- 如果你有明确的定时需求，直接看 **[Cron 定时任务](./cron-jobs)**。
- 如果需要对接外部系统，查看 **[Webhook 外部触发](./webhook)**。
:::

---

_下一步：[Hooks 事件钩子](./hooks) | [Cron 定时任务](./cron-jobs) | [Webhook 外部触发](./webhook)_
