---
title: "接入 Discord"
sidebarTitle: "接入 Discord"
---

# 接入 Discord——让 AI 助手住进你的 Discord

通过这个教程，你可以在 Discord 里和你的 AI 助手直接对话，也可以把它拉进服务器里给大家用。

> **没有 Discord 账号？** 先去 [discord.com](https://discord.com) 注册一个免费账号。

---

## 新手快速接入（10 分钟搞定）

### 第一步：创建一个 Discord Bot

Discord Bot 就像一个会说话的账号，AI 助手通过这个账号和你对话。

1. 打开 [Discord 开发者门户](https://discord.com/developers/applications)（需要登录 Discord）
2. 点击右上角 **"New Application"**
3. 给你的应用起个名字（比如 `My AI Assistant`），点击 **"Create"**
4. 在左侧菜单选择 **"Bot"**，然后点击 **"Add Bot"** → 确认
5. 找到 **"Token"** 部分，点击 **"Reset Token"**，然后 **"Yes, do it!"**
6. 点击 **"Copy"** 复制这个 Token（很重要！先保存好）

**还需要开启一些权限：**

在 Bot 页面，往下滚动找到 **"Privileged Gateway Intents"**，开启：
- ✅ **Message Content Intent**（让 Bot 能读取消息内容）
- ✅ **Server Members Intent**（推荐开启）

### 第二步：邀请 Bot 进入你的服务器

1. 在左侧菜单选择 **"OAuth2"** → **"URL Generator"**
2. 在 **"SCOPES"** 里勾选：`bot` 和 `applications.commands`
3. 在 **"BOT PERMISSIONS"** 里勾选：
   - View Channels（查看频道）
   - Send Messages（发送消息）
   - Read Message History（阅读消息历史）
4. 复制最下方生成的 URL，粘贴到浏览器，选择你的服务器，点击"授权"

### 第三步：在 OpenClaw 里配置 Bot Token

运行命令：

```bash
openclaw channels login --channel discord
```

按提示输入你的 Bot Token，回车确认。

**或者直接编辑配置文件** `~/.openclaw/openclaw.json`，添加：

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "你的-Bot-Token-粘贴在这里",
    },
  },
}
```

### 第四步：重启网关，让配置生效

```bash
openclaw gateway restart
```

### 第五步：测试！

在 Discord 里，直接给你的 Bot 发一条私信！

第一次发消息时，Bot 会回复一个配对码，这是安全验证。你需要在终端里批准：

```bash
openclaw pairing list discord       # 查看等待批准的用户
openclaw pairing approve discord <CODE>  # 批准（把 CODE 替换成实际的码）
```

配对成功后，再发消息，AI 助手就会回复了！

---

## 常见问题

::: details Bot 在频道里不回复怎么办？

默认情况下，Bot 在服务器频道里只在被 @提及 时才会回复（保护，防止误触）。

在频道里输入 `@你的Bot名字 你好` 来触发回复。

如果想让 Bot 不需要 @ 也能回复，需要修改配置（进阶设置）。

:::

::: details Bot Token 是什么，忘记了怎么办？

Bot Token 是你的 Bot 的登录密码，非常重要。如果忘记了：
1. 去 [Discord 开发者门户](https://discord.com/developers/applications)
2. 找到你的应用 → Bot → Reset Token
3. 重新复制新 Token，重新配置

**Token 泄露了很危险**，别人可以用你的 Bot 做坏事。如果不小心泄露了，立即 Reset。

:::

::: details 可以在多个服务器里用同一个 Bot 吗？

可以！一个 Bot Token 可以把 Bot 邀请进任意多的服务器。在每个服务器里，你都需要单独批准配对请求。

:::

---

*以下是详细的技术文档，新手可以跳过。*

---

## 状态和技术说明

状态：已就绪，支持通过官方 Discord 网关进行私信和公会频道通信。


  - [配对](/channels/pairing) — Discord 私信默认为配对模式。

  - [斜杠命令](/tools/slash-commands) — 原生命令行为和命令目录。

  - [通道故障排查](/channels/troubleshooting) — 跨通道诊断和修复流程。


## 快速设置（技术版）


  ### 步骤 1：创建 Discord 机器人并启用 Intent

    在 Discord 开发者门户创建一个应用程序，添加机器人，然后启用：

    - **Message Content Intent**
    - **Server Members Intent**（角色白名单和基于角色的路由所必需；推荐用于名称到 ID 的白名单匹配）


  ### 步骤 2：配置 Token


```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "YOUR_BOT_TOKEN",
    },
  },
}
```

    默认账户的环境变量回退：

```bash
DISCORD_BOT_TOKEN=...
```


  ### 步骤 3：邀请机器人并启动网关

    使用消息权限将机器人邀请到你的服务器。

```bash
openclaw gateway
```


  ### 步骤 4：批准首次私信配对


```bash
openclaw pairing list discord
openclaw pairing approve discord <CODE>
```

    配对码在 1 小时后过期。


::: info 说明
Token 解析是账户感知的。配置 Token 值优先于环境变量回退。`DISCORD_BOT_TOKEN` 仅用于默认账户。
:::


## 运行时模型

- 网关拥有 Discord 连接。
- 回复路由是确定性的：Discord 入站回复路由回 Discord。
- 默认情况下（`session.dmScope=main`），直接聊天共享智能体主会话（`agent:main:main`）。
- 公会频道是隔离的会话键（`agent:<agentId>:discord:channel:<channelId>`）。
- 默认忽略群组私信（`channels.discord.dm.groupEnabled=false`）。
- 原生斜杠命令在隔离的命令会话中运行（`agent:<agentId>:discord:slash:<userId>`），同时仍携带 `CommandTargetSessionKey` 到路由的对话会话。

## 访问控制和路由


  **DM 策略：**

    `channels.discord.dmPolicy` 控制私信访问（旧版：`channels.discord.dm.policy`）：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `channels.discord.allowFrom` 包含 `"*"`；旧版：`channels.discord.dm.allowFrom`）
    - `disabled`

    如果 DM 策略不是 open，未知用户将被阻止（或在 `pairing` 模式下提示配对）。

    投递的 DM 目标格式：

    - `user:<id>`
    - `<@id>` 提及

    纯数字 ID 是模糊的，除非提供了明确的 user/channel 目标类型，否则会被拒绝。


  **公会策略：**

    公会处理由 `channels.discord.groupPolicy` 控制：

    - `open`
    - `allowlist`
    - `disabled`

    当 `channels.discord` 存在时，安全基线为 `allowlist`。

    `allowlist` 行为：

    - 公会必须匹配 `channels.discord.guilds`（推荐 `id`，也接受 slug）
    - 可选的发送者白名单：`users`（ID 或名称）和 `roles`（仅角色 ID）；如果配置了任一项，当发送者匹配 `users` 或 `roles` 时即被允许
    - 如果公会配置了 `channels`，非列出的频道将被拒绝
    - 如果公会没有 `channels` 块，该白名单公会中的所有频道都被允许

    示例：

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "123456789012345678": {
          requireMention: true,
          users: ["987654321098765432"],
          roles: ["123456789012345678"],
          channels: {
            general: { allow: true },
            help: { allow: true, requireMention: true },
          },
        },
      },
    },
  },
}
```

    如果你只设置了 `DISCORD_BOT_TOKEN` 而没有创建 `channels.discord` 块，运行时回退为 `groupPolicy="open"`（日志中有警告）。


  **提及和群组私信：**

    默认情况下，公会消息需要提及才能触发。

    提及检测包括：

    - 显式的机器人提及
    - 配置的提及模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 在支持的情况下，隐式的回复机器人行为

    `requireMention` 按公会/频道配置（`channels.discord.guilds...`）。

    群组私信：

    - 默认：忽略（`dm.groupEnabled=false`）
    - 可选通过 `dm.groupChannels` 的白名单（频道 ID 或 slug）


### 基于角色的智能体路由

使用 `bindings[].match.roles` 按角色 ID 将 Discord 公会成员路由到不同的智能体。基于角色的绑定仅接受角色 ID，在对等方或父对等方绑定之后、仅公会绑定之前评估。如果绑定还设置了其他匹配字段（例如 `peer` + `guildId` + `roles`），所有配置的字段必须都匹配。

```json5
{
  bindings: [
    {
      agentId: "opus",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
        roles: ["111111111111111111"],
      },
    },
    {
      agentId: "sonnet",
      match: {
        channel: "discord",
        guildId: "123456789012345678",
      },
    },
  ],
}
```

## 开发者门户设置


::: details 创建应用和机器人

    1. Discord Developer Portal -> **Applications** -> **New Application**
    2. **Bot** -> **Add Bot**
    3. 复制机器人 Token

  

:::


::: details 特权 Intent

    在 **Bot -> Privileged Gateway Intents** 中，启用：

    - Message Content Intent
    - Server Members Intent（推荐）

    Presence Intent 是可选的，仅在你需要接收在线状态更新时才需要。设置机器人在线状态（`setPresence`）不需要启用成员的在线状态更新。

  

:::


::: details OAuth scope 和基本权限

    OAuth URL 生成器：

    - scope：`bot`、`applications.commands`

    典型基本权限：

    - View Channels
    - Send Messages
    - Read Message History
    - Embed Links
    - Attach Files
    - Add Reactions（可选）

    除非明确需要，否则避免使用 `Administrator`。

  

:::


::: details 复制 ID

    启用 Discord 开发者模式，然后复制：

    - 服务器 ID
    - 频道 ID
    - 用户 ID

    在 OpenClaw 配置中推荐使用数字 ID 以便可靠审计和探测。

  

:::


## 原生命令和命令授权

- `commands.native` 默认为 `"auto"`，对 Discord 启用。
- 按通道覆盖：`channels.discord.commands.native`。
- `commands.native=false` 显式清除之前注册的 Discord 原生命令。
- 原生命令授权使用与普通消息处理相同的 Discord 白名单/策略。
- 命令可能在 Discord UI 中对未授权用户仍然可见；执行仍会强制 OpenClaw 授权并返回"未授权"。

参见[斜杠命令](/tools/slash-commands)了解命令目录和行为。

## 功能详情


::: details 回复标签和原生回复

    Discord 支持智能体输出中的回复标签：

    - `[[reply_to_current]]`
    - `[[reply_to:<id>]]`

    由 `channels.discord.replyToMode` 控制：

    - `off`（默认）
    - `first`
    - `all`

    注意：`off` 禁用隐式回复线程。显式的 `[[reply_to_*]]` 标签仍然有效。

    消息 ID 在上下文/历史中展示，以便智能体可以定向特定消息。

  

:::


::: details 历史、上下文和线程行为

    公会历史上下文：

    - `channels.discord.historyLimit` 默认 `20`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    DM 历史控制：

    - `channels.discord.dmHistoryLimit`
    - `channels.discord.dms["<user_id>"].historyLimit`

    线程行为：

    - Discord 线程作为频道会话路由
    - 父线程元数据可用于父会话关联
    - 线程配置继承父频道配置，除非存在特定于线程的条目

    频道主题作为**不受信任的**上下文注入（不作为系统提示）。

  

:::


::: details 表情回应通知

    按公会的表情回应通知模式：

    - `off`
    - `own`（默认）
    - `all`
    - `allowlist`（使用 `guilds.<id>.users`）

    表情回应事件被转换为系统事件并附加到路由的 Discord 会话。

  

:::


::: details 配置写入

    默认启用通道发起的配置写入。

    这影响 `/config set|unset` 流程（当启用命令功能时）。

    禁用：

```json5
{
  channels: {
    discord: {
      configWrites: false,
    },
  },
}
```

  

:::


::: details 网关代理

    通过 `channels.discord.proxy` 将 Discord 网关 WebSocket 流量路由通过 HTTP(S) 代理。

```json5
{
  channels: {
    discord: {
      proxy: "http://proxy.example:8080",
    },
  },
}
```

    按账户覆盖：

```json5
{
  channels: {
    discord: {
      accounts: {
        primary: {
          proxy: "http://proxy.example:8080",
        },
      },
    },
  },
}
```

  

:::


::: details PluralKit 支持

    启用 PluralKit 解析以将代理消息映射到系统成员身份：

```json5
{
  channels: {
    discord: {
      pluralkit: {
        enabled: true,
        token: "pk_live_...", // optional; needed for private systems
      },
    },
  },
}
```

    说明：

    - 白名单可以使用 `pk:<memberId>`
    - 成员显示名称按名称/slug 匹配
    - 查找使用原始消息 ID 并受时间窗口限制
    - 如果查找失败，代理消息被视为机器人消息并被丢弃，除非 `allowBots=true`

  

:::


::: details 在线状态配置

    在线状态更新仅在你设置了状态或活动字段时才会应用。

    仅设置状态的示例：

```json5
{
  channels: {
    discord: {
      status: "idle",
    },
  },
}
```

    活动示例（自定义状态是默认的活动类型）：

```json5
{
  channels: {
    discord: {
      activity: "Focus time",
      activityType: 4,
    },
  },
}
```

    直播示例：

```json5
{
  channels: {
    discord: {
      activity: "Live coding",
      activityType: 1,
      activityUrl: "https://twitch.tv/openclaw",
    },
  },
}
```

    活动类型映射：

    - 0: Playing
    - 1: Streaming（需要 `activityUrl`）
    - 2: Listening
    - 3: Watching
    - 4: Custom（使用活动文本作为状态内容；emoji 可选）
    - 5: Competing

  

:::


::: details Discord 中的执行审批

    Discord 支持在私信中基于按钮的执行审批，并可选择在原始频道中发布审批提示。

    配置路径：

    - `channels.discord.execApprovals.enabled`
    - `channels.discord.execApprovals.approvers`
    - `channels.discord.execApprovals.target`（`dm` | `channel` | `both`，默认：`dm`）
    - `agentFilter`、`sessionFilter`、`cleanupAfterResolve`

    当 `target` 为 `channel` 或 `both` 时，审批提示在频道中可见。只有配置的审批者可以使用按钮；其他用户收到临时拒绝消息。审批提示包含命令文本，因此仅在受信任的频道中启用频道投递。如果无法从会话键中导出频道 ID，OpenClaw 回退到私信投递。

    如果审批因未知审批 ID 而失败，请验证审批者列表和功能启用状态。

    相关文档：[执行审批](/tools/exec-approvals)

  

:::


## 工具和操作门控

Discord 消息操作包括消息传递、频道管理、审核、在线状态和元数据操作。

核心示例：

- 消息传递：`sendMessage`、`readMessages`、`editMessage`、`deleteMessage`、`threadReply`
- 表情回应：`react`、`reactions`、`emojiList`
- 审核：`timeout`、`kick`、`ban`
- 在线状态：`setPresence`

操作门控位于 `channels.discord.actions.*` 下。

默认门控行为：

| 操作组                                                                                                                                                             | 默认  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| reactions、messages、threads、pins、polls、search、memberInfo、roleInfo、channelInfo、channels、voiceStatus、events、stickers、emojiUploads、stickerUploads、permissions | 启用  |
| roles                                                                                                                                                                    | 禁用 |
| moderation                                                                                                                                                               | 禁用 |
| presence                                                                                                                                                                 | 禁用 |

## 语音消息

Discord 语音消息显示波形预览，需要 OGG/Opus 音频加元数据。OpenClaw 自动生成波形，但需要网关主机上可用的 `ffmpeg` 和 `ffprobe` 来检查和转换音频文件。

要求和限制：

- 提供**本地文件路径**（URL 被拒绝）。
- 省略文本内容（Discord 不允许在同一负载中包含文本 + 语音消息）。
- 接受任何音频格式；OpenClaw 在需要时转换为 OGG/Opus。

示例：

```bash
message(action="send", channel="discord", target="channel:123", path="/path/to/audio.mp3", asVoice=true)
```

## 故障排查


::: details 使用了不允许的 Intent 或机器人看不到公会消息

    - 启用 Message Content Intent
    - 当你依赖用户/成员解析时启用 Server Members Intent
    - 更改 Intent 后重启网关

  

:::


::: details 公会消息意外被阻止

    - 验证 `groupPolicy`
    - 验证 `channels.discord.guilds` 下的公会白名单
    - 如果公会存在 `channels` 映射，仅允许列出的频道
    - 验证 `requireMention` 行为和提及模式

    有用的检查：

```bash
openclaw doctor
openclaw channels status --probe
openclaw logs --follow
```

  

:::


::: details 设置 requireMention 为 false 但仍被阻止

    常见原因：

    - `groupPolicy="allowlist"` 但没有匹配的公会/频道白名单
    - `requireMention` 配置在错误的位置（必须在 `channels.discord.guilds` 或频道条目下）
    - 发送者被公会/频道 `users` 白名单阻止

  

:::


::: details 权限审计不匹配

    `channels status --probe` 权限检查仅适用于数字频道 ID。

    如果你使用 slug 键，运行时匹配仍然可以工作，但探测无法完全验证权限。

  

:::


::: details 私信和配对问题

    - DM 禁用：`channels.discord.dm.enabled=false`
    - DM 策略禁用：`channels.discord.dmPolicy="disabled"`（旧版：`channels.discord.dm.policy`）
    - 在 `pairing` 模式下等待配对批准

  

:::


::: details 机器人对机器人循环

    默认忽略机器人发送的消息。

    如果你设置了 `channels.discord.allowBots=true`，请使用严格的提及和白名单规则以避免循环行为。

  

:::


## 配置参考指引

主要参考：

- [配置参考 - Discord](/gateway/configuration-reference#discord)

高信号 Discord 字段：

- 启动/认证：`enabled`、`token`、`accounts.*`、`allowBots`
- 策略：`groupPolicy`、`dm.*`、`guilds.*`、`guilds.*.channels.*`
- 命令：`commands.native`、`commands.useAccessGroups`、`configWrites`
- 回复/历史：`replyToMode`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`
- 投递：`textChunkLimit`、`chunkMode`、`maxLinesPerMessage`
- 媒体/重试：`mediaMaxMb`、`retry`
- 操作：`actions.*`
- 在线状态：`activity`、`status`、`activityType`、`activityUrl`
- 功能：`pluralkit`、`execApprovals`、`intents`、`agentComponents`、`heartbeat`、`responsePrefix`

## 安全和运维

- 将机器人 Token 视为密钥（在受监管环境中推荐使用 `DISCORD_BOT_TOKEN`）。
- 授予最小权限的 Discord 权限。
- 如果命令部署/状态过期，重启网关并使用 `openclaw channels status --probe` 重新检查。

## 相关

- [配对](/channels/pairing)
- [通道路由](/channels/channel-routing)
- [故障排查](/channels/troubleshooting)
- [斜杠命令](/tools/slash-commands)
