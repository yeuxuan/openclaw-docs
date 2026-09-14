---
title: "Automations 自动化任务"
sidebarTitle: "Automations"
description: "OpenClaw Automations：用 Gateway 内置调度器在指定时间唤醒 Agent，也可以把结果发到聊天或 Webhook。"
---

# Automations 自动化任务

Automations 是 OpenClaw Gateway 内置的调度器。
它负责“到点叫醒 Agent”，适合日报、巡检、提醒、定期汇总。

当前推荐命令是 `openclaw automations`；`openclaw cron` 仍作为兼容别名。

第一次使用记住这个格式：

```bash
openclaw automations create "<时间>" "<要 Agent 做什么>" --name "<任务名>"
```

---

## 先做一个最小任务

创建一个一次性提醒：

```bash
openclaw automations create "2027-02-01T16:00:00Z" \
  "Reminder: check the cron docs draft" \
  --name "Reminder" \
  --session main \
  --wake now
```

看任务是否创建成功：

```bash
openclaw automations list
```

手动跑一次，不用等到时间：

```bash
openclaw automations run <jobId> --wait
```

`<jobId>` 从 `openclaw automations list` 里复制。

---

## 每天、每周、每隔多久

`automations create` 的第一个位置参数是时间。常用写法：

| 写法 | 意思 |
|------|------|
| `"0 7 * * *"` | 每天 7 点 |
| `"0 9 * * 1-5"` | 工作日 9 点 |
| `"every 1h"` | 每小时 |
| `"20m"` | 每 20 分钟 |
| `"2026-02-01T16:00:00Z"` | 指定 UTC 时间执行一次 |

第二个位置参数是给 Agent 的任务说明：

```bash
openclaw automations create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --tz "America/Los_Angeles" \
  --session isolated
```

::: tip 时区别靠猜
服务器不一定在你的城市。需要固定本地时间时，显式写 `--tz`。
中国大陆常用 `--tz "Asia/Shanghai"`。
:::

`--at`、`--every`、`--cron`、`--on-exit` 和 `--stream-command` 不只可用于创建，也可用于 `openclaw automations edit <jobId>` 修改已有任务。例如：

```bash
openclaw automations edit <jobId> \
  --on-exit "./watch.sh" \
  --on-exit-cwd /srv/app
```

如果旧的事件 trigger 脚本仍调用 `tools.call('exec', args)` 并读取 `.result.details`，升级后运行 `openclaw doctor --fix`。新版脚本直接调用 `exec(args)` 并从返回对象读字段；Doctor 只自动迁移能明确识别的持久化脚本，模糊或自定义逻辑会列出来让你手工改。

---

## 会话怎么选

`--session` 决定任务醒来时用哪个上下文。

| 值 | 适合场景 |
|----|----------|
| `main` | 复用主会话，适合继续跟踪同一件事 |
| `isolated` | 每次新会话，适合日报、巡检、批处理 |
| `current` | 在独立运行中读取创建时会话的有限历史，并把最终结果提交回同一会话 |
| `session:<id>` | 指定某个固定会话 |

不确定时，用 `isolated`，更干净。

隔离自动化无人值守：没有结果需要投递时，Agent 应返回 `NO_REPLY`，而不是
`HEARTBEAT_OK`。任务说明仍应让最终回复直接成为交付物，不要停在计划或确认。

`current` 不是直接占用原聊天执行：它会等待该会话的活跃 turn 结束，确认仍是同一代 session，再用 job/run 幂等键提交结果。WebChat 刷新后也能从 `chat.history` 看到；外部聊天通道还会完成一次正常持久投递，但不会重复发送同一结果。

WebChat/Control UI 对话没有外部通道路由时，只需提交到会话就算交付完成，不要求先配置聊天插件。若对话明确绑定了外部路由但运行时无法解析，已提交结果仍留在会话中，记录的是投递失败，不是 Agent 回合执行失败。

---

## 把结果发到聊天

让任务结束后把最终结果发到 Slack：

```bash
openclaw automations create "0 7 * * *" \
  "Summarize overnight updates." \
  --name "Morning brief" \
  --session isolated \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

常见投递参数：

| 参数 | 作用 |
|------|------|
| `--announce` | 让 runner 把最终回复发出去 |
| `--channel <name>` | 投递通道，例如 `slack`、`telegram` |
| `--to <target>` | 投递目标，例如 Slack channel ID |
| `--no-deliver` | 不做 runner fallback 投递 |

如果任务本身能用 `message` 工具发消息，`--announce` 是兜底投递，不是唯一投递路径。

当自动化里的 `exec` 需要审批时，已连接的 Control UI、TUI 或 macOS App
会收到卡片。选择“总是允许”会创建仅绑定该自动化、Agent、精确命令、工作目录
和环境的 standing grant；编辑或删除任务会使授权失效。聊天通道不会接收这类
审批卡。管理命令见 [执行审批](/tutorials/tools/exec-approvals)。

如果 Gateway 配置了多个聊天通道，隔离会话的 announce 任务必须明确写 `--channel`，除非 `--to` 已带 provider 前缀或保留的会话路由能够唯一确定通道。`--best-effort-deliver` 不会替你猜通道。

---

## 把结果发到 Webhook

如果你要把 cron 结果交给外部系统，用 `--webhook`：

```bash
openclaw automations create "0 18 * * 1-5" \
  "Summarize today's deploys as JSON." \
  --name "Deploy digest" \
  --webhook "https://example.invalid/openclaw/cron"
```

`--webhook` 会在任务完成后 POST 运行结果。

Webhook 默认受严格 SSRF 防护：回环、私网、链路本地和其他特殊用途地址会被拒绝。如果接收端确实位于可信私网，只放行精确主机：

```json5
{
  cron: {
    webhookSsrfPolicy: {
      allowedHostnames: ["127.0.0.1"],
    },
  },
}
```

不要为了省事设置宽泛的 `dangerouslyAllowPrivateNetwork: true`。

不要把 `--webhook` 和聊天投递参数混用：

- 不要同时用 `--announce`
- 不要同时用 `--channel`
- 不要同时用 `--to`
- 不要同时用 `--thread-id`
- 不要同时用 `--account`

Webhook 是给系统收结果；聊天投递是给人看结果。两条路选一条。

---

## 多 Agent 怎么指定

如果你有多个 Agent，用 `--agent`：

```bash
openclaw automations create "0 6 * * *" \
  "Check ops queue" \
  --name "Ops sweep" \
  --session isolated \
  --agent ops
```

清掉任务上的 Agent 绑定：

```bash
openclaw automations edit <jobId> --clear-agent
```

---

## 常用命令

```bash
openclaw automations list
openclaw automations show <jobId>
openclaw automations runs --id <jobId>
openclaw automations run <jobId> --wait
openclaw automations edit <jobId> --name "New name"
openclaw automations remove <jobId>
```

`openclaw automations create` 是 `openclaw automations add` 的别名。
新任务建议用 `create`，因为它更像一句自然语言命令：先写时间，再写任务。

## 连续失败后任务不见了

任务已有失败路由或主 announce 目标时，默认连续执行失败 2 次后告警，冷却 1 小时。路由优先级是：

1. 任务自己的 `failureAlert` 路由字段。
2. `delivery.failureDestination`，再叠加全局 `cron.failureAlert` 目标。
3. 任务的主 announce 目标。

`failureAlert: false` 可关闭该任务的执行失败与必要投递失败告警，但不会关闭自动禁用安全通知；全局 `cron.failureAlert.enabled: false` 只关闭继承，任务自己的 `failureAlert` 仍可重新启用。`delivery.bestEffort: true` 会压制继承/默认执行告警，但不会覆盖任务显式策略。

“任务执行成功但最终投递失败”会记录为 `status: "ok"`、`completionStatus: "failed"`，不会增加执行失败 streak。它可通过另一个已解析的失败目标立即告警，但仍遵守共享的 1 小时冷却；不会再次向刚失败的主目标重投。

时间型循环任务连续执行失败 10 次会自动禁用；连续 3 次计划计算失败也会自动禁用。默认列表隐藏已禁用任务，排查时运行：

```bash
openclaw automations list --all
openclaw automations enable <jobId>
```

修好根因后再 `enable`，它会清除自动禁用原因和失败计数。

终态运行历史保留 7 天，`lost` 行保留 24 小时；每个任务、每种历史类型最多保留最新 2000 行。`cron.sessionRetention`（默认 `24h`）清理的是隔离运行会话，不等于运行历史保留期。

---

## 没按时执行怎么办

按顺序查：

```bash
openclaw gateway status
openclaw automations list --all
openclaw automations runs --id <jobId>
openclaw logs --follow
```

常见原因：

- Gateway 没在运行。
- 时区不是你以为的时区。
- 模型认证失败。
- 目标聊天通道没有权限。
- Webhook 地址不可达或返回错误。

---

## 继续阅读

- [openclaw automations](/tutorials/cli/cron)
- [Automations vs Heartbeat](/tutorials/automation/cron-vs-heartbeat)
- [自动化故障排查](/tutorials/automation/troubleshooting)
