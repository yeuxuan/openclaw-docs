---
title: "Slack"
sidebarTitle: "Slack"
---

# Slack

状态：通过 Slack 应用集成实现的私信 + 频道功能，已可投入生产使用。默认模式为 Socket Mode；HTTP Events API 模式也受支持。


  - [配对](/channels/pairing) — Slack 私信默认为配对模式。

  - [斜杠命令](/tools/slash-commands) — 原生命令行为和命令目录。

  - [通道故障排查](/channels/troubleshooting) — 跨通道诊断和修复手册。

---

## 快速设置


  **Socket Mode（默认）：**


      ### 步骤 1：创建 Slack 应用和 Token

        在 Slack 应用设置中：

        - 启用 **Socket Mode**
        - 创建 **App Token**（`xapp-...`），带 `connections:write` 权限
        - 安装应用并复制 **Bot Token**（`xoxb-...`）


      ### 步骤 2：配置 OpenClaw


```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        环境变量回退（仅默认账户）：

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```


      ### 步骤 3：订阅应用事件

        订阅以下机器人事件：

        - `app_mention`
        - `message.channels`、`message.groups`、`message.im`、`message.mpim`
        - `reaction_added`、`reaction_removed`
        - `member_joined_channel`、`member_left_channel`
        - `channel_rename`
        - `pin_added`、`pin_removed`

        同时启用 App Home 的 **Messages Tab** 以支持私信。


      ### 步骤 4：启动网关


```bash
openclaw gateway
```


  **HTTP Events API 模式：**


      ### 步骤 5：为 HTTP 配置 Slack 应用


        - 将模式设为 HTTP（`channels.slack.mode="http"`）
        - 复制 Slack **Signing Secret**
        - 将 Event Subscriptions + Interactivity + Slash command Request URL 设为相同的 Webhook 路径（默认 `/slack/events`）


      ### 步骤 6：配置 OpenClaw HTTP 模式


```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
```


      ### 步骤 7：多账户 HTTP 使用唯一 Webhook 路径

        支持按账户的 HTTP 模式。

        为每个账户设置不同的 `webhookPath` 以避免注册冲突。

---

## Token 模型

- Socket Mode 需要 `botToken` + `appToken`。
- HTTP 模式需要 `botToken` + `signingSecret`。
- 配置 Token 覆盖环境变量回退。
- `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` 环境变量回退仅适用于默认账户。
- `userToken`（`xoxp-...`）仅支持配置（无环境变量回退），默认为只读行为（`userTokenReadOnly: true`）。
- 可选：如果你想让出站消息使用活跃智能体的身份（自定义 `username` 和图标），添加 `chat:write.customize`。`icon_emoji` 使用 `:emoji_name:` 语法。

::: tip 提示
对于操作/目录读取，配置时优先使用用户 Token。对于写入，优先使用机器人 Token；仅当 `userTokenReadOnly: false` 且机器人 Token 不可用时，才允许用户 Token 写入。
:::

---

## 访问控制和路由


  **私信策略：**

    `channels.slack.dmPolicy` 控制私信访问（旧版：`channels.slack.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.slack.allowFrom` 包含 `"*"`；旧版：`channels.slack.dm.allowFrom`）
    - `disabled`

    私信标志：

    - `dm.enabled`（默认 true）
    - `channels.slack.allowFrom`（首选）
    - `dm.allowFrom`（旧版）
    - `dm.groupEnabled`（群组私信默认 false）
    - `dm.groupChannels`（可选 MPIM 白名单）

    私信配对使用 `openclaw pairing approve slack <code>`。


  **频道策略：**

    `channels.slack.groupPolicy` 控制频道处理：

    - `open`
    - `allowlist`
    - `disabled`

    频道白名单位于 `channels.slack.channels` 下。

    运行时说明：如果 `channels.slack` 完全缺失（仅环境变量设置）且 `channels.defaults.groupPolicy` 未设置，运行时回退到 `groupPolicy="open"` 并记录警告。

    名称/ID 解析：

    - 频道白名单条目和私信白名单条目在启动时会在 Token 允许的情况下解析
    - 未解析的条目保持原配置


  **提及和频道用户：**

    频道消息默认进行提及门控。

    提及来源：

    - 显式应用提及（`<@botId>`）
    - 提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人的线程行为

    按频道控制（`channels.slack.channels.<id|name>`）：

    - `requireMention`
    - `users`（白名单）
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`、`toolsBySender`

---

## 命令和斜杠行为

- Slack 的原生命令自动模式为 **关闭**（`commands.native: "auto"` 不为 Slack 启用原生命令）。
- 使用 `channels.slack.commands.native: true`（或全局 `commands.native: true`）启用原生 Slack 命令处理器。
- 启用原生命令时，在 Slack 中注册对应的斜杠命令（`/<command>` 名称）。
- 如果未启用原生命令，你可以通过 `channels.slack.slashCommand` 运行单个配置的斜杠命令。

默认斜杠命令设置：

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

斜杠会话使用隔离键：

- `agent:<agentId>:slack:slash:<userId>`

并且仍然对目标会话会话（`CommandTargetSessionKey`）执行命令。

---

## 线程、会话和回复标签

- 私信路由为 `direct`；频道为 `channel`；MPIM 为 `group`。
- 使用默认 `session.dmScope=main` 时，Slack 私信折叠到智能体主会话。
- 频道会话：`agent:<agentId>:slack:channel:<channelId>`。
- 线程回复可以在适用时创建线程会话后缀（`:thread:<threadTs>`）。
- `channels.slack.thread.historyScope` 默认为 `thread`；`thread.inheritParent` 默认为 `false`。
- `channels.slack.thread.initialHistoryLimit` 控制新线程会话开始时获取多少现有线程消息（默认 `20`；设置 `0` 禁用）。

回复线程控制：

- `channels.slack.replyToMode`：`off|first|all`（默认 `off`）
- `channels.slack.replyToModeByChatType`：按 `direct|group|channel` 设置
- 直接聊天的旧版回退：`channels.slack.dm.replyToMode`

支持手动回复标签：

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

注意：`replyToMode="off"` 禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍然有效。

---

## 媒体、分块和投递


::: details 入站附件

    Slack 文件附件从 Slack 托管的私有 URL 下载（Token 认证的请求流程），在获取成功且大小限制允许时写入媒体存储。

    运行时入站大小上限默认为 `20MB`，除非通过 `channels.slack.mediaMaxMb` 覆盖。

  

:::


::: details 出站文本和文件

    - 文本分块使用 `channels.slack.textChunkLimit`（默认 4000）
    - `channels.slack.chunkMode="newline"` 启用段落优先分割
    - 文件发送使用 Slack 上传 API，可包含线程回复（`thread_ts`）
    - 出站媒体上限在配置时遵循 `channels.slack.mediaMaxMb`；否则通道发送使用媒体管道的 MIME 类型默认值
  

:::


::: details 投递目标

    首选显式目标：

    - `user:<id>` 用于私信
    - `channel:<id>` 用于频道

    Slack 私信在发送到用户目标时通过 Slack 会话 API 打开。

  

:::

---

## 操作和门控

Slack 操作由 `channels.slack.actions.*` 控制。

当前 Slack 工具中的可用操作组：

| 组          | 默认值 |
| ----------- | ------ |
| messages    | 启用   |
| reactions   | 启用   |
| pins        | 启用   |
| memberInfo  | 启用   |
| emojiList   | 启用   |

---

## 事件和运营行为

- 消息编辑/删除/线程广播映射为系统事件。
- 表情回应添加/移除事件映射为系统事件。
- 成员加入/离开、频道创建/重命名、置顶添加/移除事件映射为系统事件。
- 当 `configWrites` 启用时，`channel_id_changed` 可以迁移频道配置键。
- 频道话题/描述元数据被视为不可信上下文，可以注入到路由上下文中。

---

## Manifest 和权限检查清单


::: details Slack 应用 manifest 示例

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": false
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "chat:write",
        "channels:history",
        "channels:read",
        "groups:history",
        "im:history",
        "mpim:history",
        "users:read",
        "app_mentions:read",
        "reactions:read",
        "reactions:write",
        "pins:read",
        "pins:write",
        "emoji:read",
        "commands",
        "files:read",
        "files:write"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "reaction_added",
        "reaction_removed",
        "member_joined_channel",
        "member_left_channel",
        "channel_rename",
        "pin_added",
        "pin_removed"
      ]
    }
  }
}
```

  

:::


::: details 可选用户 Token 权限范围（读取操作）

    如果你配置了 `channels.slack.userToken`，典型的读取权限范围有：

    - `channels:history`、`groups:history`、`im:history`、`mpim:history`
    - `channels:read`、`groups:read`、`im:read`、`mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read`（如果你依赖 Slack 搜索读取）

  

:::

---

## 故障排查


::: details 频道中无回复

    按顺序检查：

    - `groupPolicy`
    - 频道白名单（`channels.slack.channels`）
    - `requireMention`
    - 按频道 `users` 白名单

    有用的命令：

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  

:::


::: details 私信被忽略

    检查：

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy`（或旧版 `channels.slack.dm.policy`）
    - 配对批准/白名单条目

```bash
openclaw pairing list slack
```

  

:::


::: details Socket Mode 未连接

    验证机器人 + 应用 Token 以及 Slack 应用设置中的 Socket Mode 启用状态。
  

:::


::: details HTTP 模式未接收事件

    验证：

    - Signing Secret
    - Webhook 路径
    - Slack Request URL（Events + Interactivity + Slash Commands）
    - 每个 HTTP 账户的唯一 `webhookPath`

  

:::


::: details 原生/斜杠命令未触发

    确认你的意图是：

    - 原生命令模式（`channels.slack.commands.native: true`）并在 Slack 中注册了对应的斜杠命令
    - 还是单斜杠命令模式（`channels.slack.slashCommand.enabled: true`）

    同时检查 `commands.useAccessGroups` 和频道/用户白名单。

  

:::

---

## 配置参考指引

主要参考：

- [配置参考 - Slack](/gateway/configuration-reference#slack)

  高信号 Slack 字段：
  - 模式/认证：`mode`、`botToken`、`appToken`、`signingSecret`、`webhookPath`、`accounts.*`
  - 私信访问：`dm.enabled`、`dmPolicy`、`allowFrom`（旧版：`dm.policy`、`dm.allowFrom`）、`dm.groupEnabled`、`dm.groupChannels`
  - 频道访问：`groupPolicy`、`channels.*`、`channels.*.users`、`channels.*.requireMention`
  - 线程/历史：`replyToMode`、`replyToModeByChatType`、`thread.*`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
  - 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`
  - 运维/功能：`configWrites`、`commands.native`、`slashCommand.*`、`actions.*`、`userToken`、`userTokenReadOnly`

---

## 相关

- [配对](/channels/pairing)
- [通道路由](/channels/channel-routing)
- [故障排查](/channels/troubleshooting)
- [配置](/gateway/configuration)
- [斜杠命令](/tools/slash-commands)
