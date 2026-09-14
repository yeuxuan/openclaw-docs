---
title: "心跳"
sidebarTitle: "心跳"
description: "OpenClaw Gateway：心跳（网关（Gateway））。> 心跳 vs 定时任务？ 参阅 Cron vs Heartbeat 了解何时使用哪种方式。"
---

# 心跳（网关（Gateway））

> 心跳 vs 定时任务？ 参阅 [Cron vs Heartbeat](/tutorials/automation/cron-vs-heartbeat) 了解何时使用哪种方式。

心跳是 Automations 调度器维护的系统自动化：每个启用心跳的 Agent 都对应一个
`Heartbeat (agent-id)` 任务，可用 `openclaw cron list --all` 查看，但应修改
`agents.*.heartbeat` 配置，而不是直接编辑这条系统任务。

你可以把它想成“有人每半小时轻轻看一眼值班表”：
如果没事，就安静地记一声 OK；如果有事，再提醒你。

故障排查：[/automation/troubleshooting](/tutorials/automation/troubleshooting)

---

## 什么时候需要心跳

适合：

- 让 AI 定期检查待办、提醒、收件箱或队列。
- 让运维 Agent 定期看 Gateway 是否健康。
- 让助手白天偶尔确认有没有需要继续的任务。

不适合：

- 每天固定 9 点一定执行的任务。这个更像 [Cron 定时任务](/tutorials/automation/cron-jobs)。
- 需要百分百准时的闹钟。
- 你还没有跑通控制 UI 和基本聊天时。

新手可以先保持默认，不用急着改。

---

## 快速入门（初学者）

1. 先保持默认频率：通常每 `30m` 一次；Anthropic OAuth/token（包括复用 Claude CLI 登录）默认 `1h`。
2. 如果你想让它检查固定内容，把小清单写入心跳 monitor scratch。
3. 默认提醒发给 operator 的直接消息；需要跟随最近会话时再显式设置 `target: "last"`。
4. 如果不想夜里被打扰，可以设置活跃时段。
5. 不确定就先别改配置，等你真的需要后台提醒时再开细节。

配置示例：

```json5
{
  commands: {
    ownerAllowFrom: ["telegram:123456789"],
  },
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "owner",
        lightContext: true,
        isolatedSession: true,
        // activeHours: { start: "08:00", end: "24:00" },
      },
    },
  },
}
```

---

## 默认值

- 间隔：`30m`（Anthropic OAuth/token，包括复用 Claude CLI 登录时默认 `1h`）。设置 `agents.defaults.heartbeat.every` 或每 Agent 的 `agents.entries.*.heartbeat.every`；使用 `0m` 只禁用周期节拍。
- 默认投递：`owner`。优先取 `commands.ownerAllowFrom` 中第一个具体身份，再取通道的具体 `allowFrom`，不会把默认路由发到群组；无法解析 owner DM 时以 `reason=no-route` 跳过。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Follow the heartbeat monitor scratch context when provided. Recurring tasks are automations; create or change their schedules with the automations tool, not heartbeat scratch. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply NO_REPLY.`
- 心跳提示逐字作为计划用户消息发送，使用与普通 Agent turn 相同的系统提示词。
- `cron.enabled: false` 或 `OPENCLAW_SKIP_CRON=1` 会关闭计划心跳；没有独立的备用 timer，手动和事件驱动唤醒仍可用。
- 活跃时段（`heartbeat.activeHours`）在配置的时区中检查。
  在窗口外，心跳被跳过，直到下一个在窗口内的触发时刻。

`every: "0m"` 不会关闭定向的事件驱动唤醒。后台 exec 完成后的跟进仍可唤醒 Agent 一次，但不会重新建立周期计划。要限制这类 turn 能否执行命令，应使用工具策略和沙箱，而不是依赖心跳频率。

---

## 心跳提示的用途

默认提示刻意保持窄范围：只处理 monitor scratch 中明确写下的事项，不从旧对话
猜测或重复任务。收件箱轮询、日历扫描和固定签到应该建立独立的
[Automations](/tutorials/automation/cron-jobs)，不要把周期任务暗藏在 scratch 中。

如果你想让心跳做非常具体的事情（例如"检查 Gmail PubSub
统计"或"验证网关（Gateway）健康"），将 `agents.defaults.heartbeat.prompt`（或
`agents.entries.*.heartbeat.prompt`）设置为自定义正文（逐字发送）。

最简单的写法是把要求写清楚，不要写得像谜语：

```text
请检查 heartbeat monitor scratch 里的事项。
如果没有需要提醒我的事情，只回复 NO_REPLY。
如果有紧急事项，用三句话以内告诉我。
```

---

## 响应约定

- 如果没有需要关注的事项，回复 `NO_REPLY`。
- Agent 也可调用 `heartbeat_respond`：`notify: false` 保持静默，`notify: true` 配合 `notificationText` 发送警报；结构化结果优先于文本。
- 旧自定义提示仍可返回 `HEARTBEAT_OK`。它只在回复开头或结尾被识别，剩余文本不超过固定 300 字符时抑制；该预算不再可配置。
- 对于警报，只返回警报文本，不要混入静默确认。

在心跳之外，消息开头/结尾的 `HEARTBEAT_OK` 会被去除
并记录；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

新配置应使用 `NO_REPLY`；`HEARTBEAT_OK` 只是兼容旧提示的确认词。

---

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 仅禁用周期节拍）
        model: "anthropic/claude-opus-4-6",
        lightContext: false, // true 时不注入工作区 bootstrap 文件
        isolatedSession: false, // true 时每次使用无旧历史的新会话
        target: "owner", // owner | last | none | <channel id>
        to: "+15551234567", // 可选的通道（Channel）特定覆盖
        accountId: "ops-bot", // 可选的多账户通道（Channel）id
        prompt: "Follow the heartbeat monitor scratch context when provided. Recurring tasks are automations; create or change their schedules with the automations tool, not heartbeat scratch. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply NO_REPLY.",
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.entries.*.heartbeat` 在此基础上合并；如果任何智能体（Agent）有 `heartbeat` 块，仅这些智能体（Agent）运行心跳。
- `channels.defaults.heartbeatVisibility` 设置所有通道的可见性默认值。
- `channels.<channel>.heartbeatVisibility` 覆盖通道默认值。
- `channels.<channel>.accounts.<id>.heartbeatVisibility`（多账户通道）覆盖每通道设置。

### 每智能体（Agent）心跳

如果任何 `agents.entries.*` 条目包含 `heartbeat` 块，仅这些智能体（Agent）
运行心跳。每智能体（Agent）块在 `agents.defaults.heartbeat`
基础上合并（因此你可以一次设置共享默认值并按智能体（Agent）覆盖）。

示例：两个智能体（Agent），只有第二个运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "owner",
      },
    },
    ownership: "explicit",
    entries: {
      main: {},
      ops: {
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Follow the heartbeat monitor scratch context when provided. Recurring tasks are automations; create or change their schedules with the automations tool, not heartbeat scratch. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply NO_REPLY.",
        },
      },
    },
  },
}
```

### 活跃时段示例

将心跳限制在特定时区的工作时间：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
        activeHours: {
          start: "09:00",
          end: "22:00",
          timezone: "America/New_York", // 可选；如果设置了 userTimezone 则使用它，否则使用主机时区
        },
      },
    },
  },
}
```

在此窗口外（东部时间上午 9 点之前或晚上 10 点之后），心跳被跳过。窗口内的下一个计划触发时刻将正常运行。

### 多账户示例

使用 `accountId` 指定多账户通道（Channel）（如 Telegram）上的特定账户：

```json5
{
  agents: {
    entries: {
      ops: {
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678",
          accountId: "ops-bot",
        },
      },
    },
  },
  channels: {
    telegram: {
      accounts: {
        "ops-bot": { botToken: "YOUR_TELEGRAM_BOT_TOKEN" },
      },
    },
  },
}
```

### 字段说明

- `every`：心跳间隔（时间长度字符串；默认单位 = 分钟）。
- `model`：可选的心跳运行模型覆盖（`provider/model`）。
- `lightContext`：为 `true` 时使用轻量 bootstrap 上下文，不注入工作区 bootstrap 文件；monitor scratch 仍会注入。
- `isolatedSession`：为 `true` 时每次心跳使用无历史的新会话，可显著降低周期 Token 成本。
- `session`：可选的心跳运行会话（Session）键。
  - `main`（默认）：智能体（Agent）主会话（Session）。
  - 显式会话（Session）键（从 `openclaw sessions --json` 或[会话（Session）CLI](/tutorials/concepts/session) 复制）。
  - 会话（Session）键格式：参阅[会话（Session）](/tutorials/concepts/session)和[群组](/tutorials/channels/groups)。
- `target`：
  - `owner`（默认）：投递给明确配置的 operator DM，不会推断群组目标。
  - `last`：显式跟随最后使用的外部会话，包括群组。
  - 显式通道（Channel）：`whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`。
  - `none`：运行心跳但不向外部传递。
- `to`：可选的接收者覆盖（通道（Channel）特定 id，例如 WhatsApp 的 E.164 或 Telegram 聊天 id）。
- `accountId`：可选的多账户通道（Channel）账户 id。当 `target: "last"` 时，如果解析的最后通道（Channel）支持账户，则账户 id 应用于该通道（Channel）；否则被忽略。如果账户 id 与解析通道（Channel）的已配置账户不匹配，传递将被跳过。
- `prompt`：覆盖默认提示正文（不合并）。
- `timeoutSeconds`：心跳 turn 超时；未设置时先取全局超时，否则取 `min(every, 600 秒)`。
- `activeHours`：将心跳运行限制在时间窗口。对象包含 `start`（HH:MM，包含）、`end`（HH:MM 不包含；`24:00` 允许表示一天结束），和可选的 `timezone`。
  - 省略或 `"user"`：如果设置了 `agents.defaults.userTimezone` 则使用它，否则回退到主机系统时区。
  - `"local"`：始终使用主机系统时区。
  - 任何 IANA 标识符（例如 `America/New_York`）：直接使用；如果无效，回退到上述 `"user"` 行为。
  - 在活跃窗口外，心跳被跳过，直到窗口内的下一个触发时刻。

---

## 传递行为

- 心跳默认在智能体（Agent）的主会话（Session）中运行（`agent:<id>:<mainKey>`），
  或在 `session.scope = "global"` 时为 `global`。设置 `session` 覆盖到
  特定通道（Channel）会话（Session）（Discord/WhatsApp 等）。
- `session` 仅影响运行上下文；传递由 `target` 和 `to` 控制。
- 要传递到特定通道（Channel）/接收者，设置 `target` + `to`。使用
  `target: "last"` 时，传递使用该会话（Session）的最后外部通道（Channel）。
- 如果主队列繁忙，心跳被跳过并稍后重试。
- 如果 `target` 解析不到外部目标，运行仍然发生但不
  发送出站消息。
- 仅心跳回复不会保持会话（Session）存活；最后的 `updatedAt`
  被恢复，因此空闲过期正常运作。

---

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认被抑制，而警报内容被
传递。你可以按通道（Channel）或按账户调整：

```yaml
channels:
  defaults:
    heartbeatVisibility:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示警报消息（默认）
      useIndicator: true # 发出指示器事件（默认）
  telegram:
    heartbeatVisibility:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeatVisibility:
          showAlerts: false # 为此账户抑制警报传递
```

优先级：每账户 → 每通道（Channel）→ 通道（Channel）默认 → 内置默认。

### 每个标志的作用

- `showOk`：当模型返回仅 OK 回复时发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时发送警报内容。
- `useIndicator`：为 UI 状态显示发出指示器事件。

如果三个都为 false，OpenClaw 完全跳过心跳运行（不调用模型）。

### 每通道（Channel）vs 每账户示例

```yaml
channels:
  defaults:
    heartbeatVisibility:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeatVisibility:
      showOk: true # 所有 Slack 账户
    accounts:
      ops:
        heartbeatVisibility:
          showAlerts: false # 仅为 ops 账户抑制警报
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标                                     | 配置                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，警报开启）            | _（无需配置）_                                                                                     |
| 完全静默（无消息，无指示器）             | `channels.defaults.heartbeatVisibility: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）                       | `channels.defaults.heartbeatVisibility: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个通道（Channel）显示 OK           | `channels.telegram.heartbeatVisibility: { showOk: true }`                                          |

---

## Monitor scratch（可选）

每个心跳系统任务都有一份保存在共享 SQLite 状态库里的私有 scratch。它就是当前的
“心跳检查清单”，内容会附加到心跳提示中，不会出现在 `cron list` 或运行历史里。

先从 `openclaw cron list --all` 取得心跳 job id，再管理 scratch：

```bash
openclaw cron scratch <jobId>
openclaw cron scratch <jobId> --set "..."
openclaw cron scratch <jobId> --file notes.md
openclaw cron scratch <jobId> --unset
```

写入支持 `--expected-revision <n>` 比较并交换，避免覆盖并发修改；大小上限 256 KiB。
心跳 turn 里的 `heartbeat_respond` 也可用 `scratch` 字符串整体替换它。

如果 scratch 只有空行、注释、标题、围栏标记或空清单，OpenClaw 会跳过本轮以节省调用；
没有 scratch 时仍会运行，让模型根据默认提示决定是否需要动作。保持清单短小，例如：

```md
# 心跳检查清单

- 快速扫描：收件箱中有紧急事项吗？
- 如果是白天，在没有其他待处理事项时做一个轻量签到。
- 如果任务被阻塞，写下_缺少什么_，下次问 Peter。
```

旧安装若仍有工作区 `HEARTBEAT.md`，运行 `openclaw doctor --fix`：Doctor 会先物化
系统 monitor，把清单导入 scratch，把有效旧 `tasks:` 转为独立自动化任务，将原文件
归档到状态目录下的 `backups/heartbeat-migration/` 后移除。当前运行时不会再读取
`HEARTBEAT.md`。

安全提示：不要在 scratch 中放置 API Key、电话号码或私有 Token，因为它会进入提示上下文。

---

## 手动唤醒（按需）

你可以入队系统事件并触发立即心跳：

```bash
openclaw system event --text "Check for urgent follow-ups" --mode now
```

如果多个智能体（Agent）配置了 `heartbeat`，手动唤醒会立即运行每个
智能体（Agent）的心跳。

使用 `--mode next-heartbeat` 等待下一个计划的触发时刻。

---

## 成本意识

心跳运行完整的智能体（Agent）轮次。更短的间隔消耗更多 Token。保持
monitor scratch 简短，如果你
只需要内部状态更新，考虑使用更便宜的 `model` 或 `target: "none"`。
