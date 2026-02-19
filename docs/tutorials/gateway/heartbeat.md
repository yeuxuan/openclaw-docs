---
title: "心跳"
sidebarTitle: "心跳"
---

# 心跳（网关（Gateway））

> **心跳 vs 定时任务？** 参阅 [Cron vs Heartbeat](/automation/cron-vs-heartbeat) 了解何时使用哪种方式。

心跳在主会话（Session）中运行**周期性智能体（Agent）轮次**，使模型能够
在不打扰你的情况下展示任何需要关注的事项。

故障排查：[/automation/troubleshooting](/automation/troubleshooting)

---

## 快速入门（初学者）

1. 保持心跳启用（默认 `30m`，Anthropic OAuth/setup-token 为 `1h`）或设置你自己的频率。
2. 在智能体（Agent）工作区（Workspace）中创建一个简短的 `HEARTBEAT.md` 检查清单（可选但推荐）。
3. 决定心跳消息的发送目标（默认为 `target: "last"`）。
4. 可选：启用心跳推理传递以增加透明度。
5. 可选：将心跳限制在活跃时段（本地时间）。

配置示例：

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
        // activeHours: { start: "08:00", end: "24:00" },
        // includeReasoning: true, // 可选：也发送单独的 `Reasoning:` 消息
      },
    },
  },
}
```

---

## 默认值

- 间隔：`30m`（当检测到 Anthropic OAuth/setup-token 认证模式时为 `1h`）。设置 `agents.defaults.heartbeat.every` 或每智能体（Agent）的 `agents.list[].heartbeat.every`；使用 `0m` 禁用。
- 提示正文（可通过 `agents.defaults.heartbeat.prompt` 配置）：
  `Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.`
- 心跳提示**逐字**作为用户消息发送。系统
  提示包含一个"Heartbeat"部分，运行在内部被标记。
- 活跃时段（`heartbeat.activeHours`）在配置的时区中检查。
  在窗口外，心跳被跳过，直到下一个在窗口内的触发时刻。

---

## 心跳提示的用途

默认提示故意设计得较宽泛：

- **后台任务**："Consider outstanding tasks" 提示智能体（Agent）审查
  后续工作（收件箱、日历、提醒、排队工作）并展示任何紧急事项。
- **人工签到**："Checkup sometimes on your human during day time" 提示
  偶尔发送轻量的"需要什么帮助吗？"消息，但通过使用你配置的
  本地时区（参阅 [/concepts/timezone](/concepts/timezone)）避免夜间打扰。

如果你想让心跳做非常具体的事情（例如"检查 Gmail PubSub
统计"或"验证网关（Gateway）健康"），将 `agents.defaults.heartbeat.prompt`（或
`agents.list[].heartbeat.prompt`）设置为自定义正文（逐字发送）。

---

## 响应约定

- 如果没有需要关注的事项，回复 **`HEARTBEAT_OK`**。
- 在心跳运行期间，当 `HEARTBEAT_OK` 出现在回复的**开头或结尾**时，OpenClaw 将其视为确认。该 Token 会被去除，如果剩余内容 **≤ `ackMaxChars`**（默认：300），回复将被丢弃。
- 如果 `HEARTBEAT_OK` 出现在回复的**中间**，它不会被特殊处理。
- 对于警报，**不要**包含 `HEARTBEAT_OK`；仅返回警报文本。

在心跳之外，消息开头/结尾的 `HEARTBEAT_OK` 会被去除
并记录；仅包含 `HEARTBEAT_OK` 的消息会被丢弃。

---

## 配置

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 默认：30m（0m 禁用）
        model: "anthropic/claude-opus-4-6",
        includeReasoning: false, // 默认：false（可用时传递单独的 Reasoning: 消息）
        target: "last", // last | none | <channel id>（核心或插件，例如 "bluebubbles"）
        to: "+15551234567", // 可选的通道（Channel）特定覆盖
        accountId: "ops-bot", // 可选的多账户通道（Channel）id
        prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        ackMaxChars: 300, // HEARTBEAT_OK 后允许的最大字符数
      },
    },
  },
}
```

### 作用域和优先级

- `agents.defaults.heartbeat` 设置全局心跳行为。
- `agents.list[].heartbeat` 在此基础上合并；如果任何智能体（Agent）有 `heartbeat` 块，**仅这些智能体（Agent）**运行心跳。
- `channels.defaults.heartbeat` 设置所有通道（Channel）的可见性默认值。
- `channels.<channel>.heartbeat` 覆盖通道（Channel）默认值。
- `channels.<channel>.accounts.<id>.heartbeat`（多账户通道（Channel））覆盖每通道（Channel）设置。

### 每智能体（Agent）心跳

如果任何 `agents.list[]` 条目包含 `heartbeat` 块，**仅这些智能体（Agent）**
运行心跳。每智能体（Agent）块在 `agents.defaults.heartbeat`
基础上合并（因此你可以一次设置共享默认值并按智能体（Agent）覆盖）。

示例：两个智能体（Agent），只有第二个运行心跳。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m",
        target: "last",
      },
    },
    list: [
      { id: "main", default: true },
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "whatsapp",
          to: "+15551234567",
          prompt: "Read HEARTBEAT.md if it exists (workspace context). Follow it strictly. Do not infer or repeat old tasks from prior chats. If nothing needs attention, reply HEARTBEAT_OK.",
        },
      },
    ],
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
    list: [
      {
        id: "ops",
        heartbeat: {
          every: "1h",
          target: "telegram",
          to: "12345678",
          accountId: "ops-bot",
        },
      },
    ],
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

- `every`：心跳间隔（持续时间字符串；默认单位 = 分钟）。
- `model`：可选的心跳运行模型覆盖（`provider/model`）。
- `includeReasoning`：启用时，也传递单独的 `Reasoning:` 消息（与 `/reasoning on` 相同格式）。
- `session`：可选的心跳运行会话（Session）键。
  - `main`（默认）：智能体（Agent）主会话（Session）。
  - 显式会话（Session）键（从 `openclaw sessions --json` 或[会话（Session）CLI](/cli/sessions) 复制）。
  - 会话（Session）键格式：参阅[会话（Session）](/concepts/session)和[群组](/channels/groups)。
- `target`：
  - `last`（默认）：传递到最后使用的外部通道（Channel）。
  - 显式通道（Channel）：`whatsapp` / `telegram` / `discord` / `googlechat` / `slack` / `msteams` / `signal` / `imessage`。
  - `none`：运行心跳但**不向外部传递**。
- `to`：可选的接收者覆盖（通道（Channel）特定 id，例如 WhatsApp 的 E.164 或 Telegram 聊天 id）。
- `accountId`：可选的多账户通道（Channel）账户 id。当 `target: "last"` 时，如果解析的最后通道（Channel）支持账户，则账户 id 应用于该通道（Channel）；否则被忽略。如果账户 id 与解析通道（Channel）的已配置账户不匹配，传递将被跳过。
- `prompt`：覆盖默认提示正文（不合并）。
- `ackMaxChars`：传递前 `HEARTBEAT_OK` 后允许的最大字符数。
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
- 仅心跳回复**不会**保持会话（Session）存活；最后的 `updatedAt`
  被恢复，因此空闲过期正常运作。

---

## 可见性控制

默认情况下，`HEARTBEAT_OK` 确认被抑制，而警报内容被
传递。你可以按通道（Channel）或按账户调整：

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false # 隐藏 HEARTBEAT_OK（默认）
      showAlerts: true # 显示警报消息（默认）
      useIndicator: true # 发出指示器事件（默认）
  telegram:
    heartbeat:
      showOk: true # 在 Telegram 上显示 OK 确认
  whatsapp:
    accounts:
      work:
        heartbeat:
          showAlerts: false # 为此账户抑制警报传递
```

优先级：每账户 → 每通道（Channel）→ 通道（Channel）默认 → 内置默认。

### 每个标志的作用

- `showOk`：当模型返回仅 OK 回复时发送 `HEARTBEAT_OK` 确认。
- `showAlerts`：当模型返回非 OK 回复时发送警报内容。
- `useIndicator`：为 UI 状态展示发出指示器事件。

如果**三个都**为 false，OpenClaw 完全跳过心跳运行（不调用模型）。

### 每通道（Channel）vs 每账户示例

```yaml
channels:
  defaults:
    heartbeat:
      showOk: false
      showAlerts: true
      useIndicator: true
  slack:
    heartbeat:
      showOk: true # 所有 Slack 账户
    accounts:
      ops:
        heartbeat:
          showAlerts: false # 仅为 ops 账户抑制警报
  telegram:
    heartbeat:
      showOk: true
```

### 常见模式

| 目标                                     | 配置                                                                                     |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| 默认行为（静默 OK，警报开启）            | _（无需配置）_                                                                           |
| 完全静默（无消息，无指示器）             | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: false }` |
| 仅指示器（无消息）                       | `channels.defaults.heartbeat: { showOk: false, showAlerts: false, useIndicator: true }`  |
| 仅在一个通道（Channel）显示 OK           | `channels.telegram.heartbeat: { showOk: true }`                                          |

---

## HEARTBEAT.md（可选）

如果工作区（Workspace）中存在 `HEARTBEAT.md` 文件，默认提示会告诉
智能体（Agent）读取它。把它当作你的"心跳检查清单"：小巧、稳定、
每 30 分钟包含一次是安全的。

如果 `HEARTBEAT.md` 存在但实际上是空的（仅空行和 markdown
标题如 `# Heading`），OpenClaw 跳过心跳运行以节省 API 调用。
如果文件缺失，心跳仍然运行，由模型决定做什么。

保持简短（简短的检查清单或提醒）以避免提示膨胀。

`HEARTBEAT.md` 示例：

```md
# 心跳检查清单

- 快速扫描：收件箱中有紧急事项吗？
- 如果是白天，在没有其他待处理事项时做一个轻量签到。
- 如果任务被阻塞，写下_缺少什么_，下次问 Peter。
```

### 智能体（Agent）可以更新 HEARTBEAT.md 吗？

可以 — 如果你要求它。

`HEARTBEAT.md` 只是智能体（Agent）工作区（Workspace）中的一个普通文件，所以你可以在
普通聊天中告诉智能体（Agent）：

- "更新 `HEARTBEAT.md` 以添加每日日历检查。"
- "重写 `HEARTBEAT.md` 使其更短并专注于收件箱后续跟进。"

如果你希望这主动发生，你也可以在
心跳提示中包含一行明确的内容："If the checklist becomes stale, update HEARTBEAT.md
with a better one."

安全提示：不要在 `HEARTBEAT.md` 中放置密钥（API 密钥、电话号码、私有 Token）
— 它会成为提示上下文的一部分。

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

## 推理传递（可选）

默认情况下，心跳仅传递最终的"回答"负载。

如果你需要透明度，启用：

- `agents.defaults.heartbeat.includeReasoning: true`

启用后，心跳也会传递一条前缀为
`Reasoning:` 的单独消息（与 `/reasoning on` 相同格式）。当智能体（Agent）
管理多个会话（Session）/代码库且你想看到它为什么决定联系
你时这很有用 — 但它也可能泄露比你期望的更多内部细节。建议在群聊中保持关闭。

---

## 成本意识

心跳运行完整的智能体（Agent）轮次。更短的间隔消耗更多 Token。保持
`HEARTBEAT.md` 简短，如果你
只需要内部状态更新，考虑使用更便宜的 `model` 或 `target: "none"`。
