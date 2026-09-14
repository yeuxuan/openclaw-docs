---
title: "openclaw automations"
sidebarTitle: "automations / cron"
description: "OpenClaw Automations CLI：创建、查看、运行、编辑和恢复定时任务；openclaw cron 仍作为兼容别名。"
---

# `openclaw automations`

`automations` 是当前推荐的自动化任务命令。旧的 `openclaw cron` 仍是兼容别名，但新脚本和新教程建议使用 `openclaw automations`。

```bash
openclaw automations list
openclaw automations show <jobId>
openclaw automations create "0 7 * * *" "Summarize overnight updates." --name "Morning brief"
openclaw automations run <jobId> --wait
```

## 创建任务

`create` 是 `add` 的别名。第一个位置参数写时间，第二个位置参数写 Agent 要做的事：

```bash
openclaw automations create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --agent ops \
  --session isolated
```

时间可写为：

- cron 表达式：`"0 9 * * 1"`
- 自然间隔：`"every 1h"`
- 简短间隔：`"20m"`
- ISO 时间：`"2027-02-01T16:00:00Z"`

需要本地时区时显式加 `--tz "Asia/Shanghai"`。

创建和编辑都支持 `--at`、`--every`、`--cron`、`--on-exit`、`--stream-command`。例如把已有任务改为命令退出时触发：

```bash
openclaw automations edit <jobId> --on-exit "./watch.sh" --on-exit-cwd /srv/app
```

## 投递到聊天

```bash
openclaw automations create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --session isolated \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

配置了多个通道时，隔离会话的 announce 任务必须明确 `--channel`，除非 `--to` 带 provider 前缀或保留的会话路由能确定通道。`--best-effort-deliver` 不会替你选择通道。

## 投递到 Webhook

```bash
openclaw automations create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/automations"
```

Webhook 与 `--announce`、`--channel`、`--to`、`--thread-id`、`--account` 互斥。私网、回环和特殊用途地址默认会被 SSRF 策略拒绝；只有明确可信的接收端才应加入 `cron.webhookSsrfPolicy.allowedHostnames`。

## 失败后的恢复

有失败路由或主 announce 目标的任务，默认在连续失败 2 次后告警并冷却 1 小时。可用 `openclaw automations edit` 的 `--failure-alert*` 参数为单个任务调整；`--no-failure-alert` 关闭普通失败告警，但不会关闭连续 10 次执行失败或 3 次计划计算失败后的自动禁用通知。

时间型循环任务连续执行失败 10 次会自动禁用；连续 3 次计算计划失败也会自动禁用。修复原因后运行：

```bash
openclaw automations list --all
openclaw automations enable <jobId>
```

`enable` 会清除自动禁用原因和失败计数。

终态运行历史保留 7 天，`lost` 行保留 24 小时，并受每任务/历史类型最新 2000 行的额外上限约束。

继续阅读：[Automations 自动化任务](/tutorials/automation/cron-jobs)、[自动化故障排查](/tutorials/automation/troubleshooting)。
