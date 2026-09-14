---
title: "接入 Telegram（推荐新手）"
sidebarTitle: "接入 Telegram"
description: "OpenClaw 通道接入：用 Telegram Bot 连接 OpenClaw，适合第一次配置聊天通道。"
---

# 接入 Telegram

Telegram 通道的准备工作很少：创建一个 Bot，拿到 Token，写入 OpenClaw 配置，然后完成首次配对。

## 新手快速接入

### 第一步：创建 Telegram Bot，获取 Token

1. 打开 Telegram（手机或电脑版都可以）
2. 搜索 `@BotFather`（注意：必须是这个名字，有蓝色认证标识）
3. 点击"开始"或发送 `/start`
4. 发送命令 `/newbot`
5. BotFather 会问你起名字：
   - Full name（完整名称）：随便起，比如 `My AI Assistant`
   - Username（用户名）：必须以 `bot` 结尾，比如 `my_ai_bot`
6. 成功后，BotFather 会发给你一段 Token（看起来像 `7123456789:AAEBcd...`）

复制并妥善保存这个 Token。它相当于 Bot 的密码，不要发到群里、截图里或公开仓库里。

### 第二步：把 Token 填入 OpenClaw

Telegram 不是扫码登录通道，不使用 `openclaw channels login --channel telegram`。
它要做的是：把 BotFather 给你的 Token 写进 OpenClaw 配置。

```bash
openclaw config set channels.telegram.enabled true
openclaw config set channels.telegram.botToken "把你的Token粘贴到这里"
openclaw config set channels.telegram.dmPolicy pairing
```

注意：

- 保留英文双引号。
- 把 `把你的Token粘贴到这里` 换成 BotFather 给你的真实 Token。
- 不要把 Token 发到群里、截图里或公开仓库里。

写完配置后，先体检一次：

```bash
openclaw doctor
```

### 第三步：重启网关

```bash
openclaw gateway restart
```

### 第四步：和你的 Bot 说话

在 Telegram 搜索你刚创建的 Bot 用户名（比如 `my_ai_bot`），点击"开始"，发送一条消息。

第一次发消息时，Bot 会回复一条类似这样的消息：

```
配对请求
你的配对码是：ABC123
请在终端运行以下命令来批准：
openclaw pairing approve telegram ABC123
```

这是安全验证，用来防止陌生人直接使用你的 Bot。打开你电脑上的终端，运行：

```bash
# 先查看等待批准的配对请求（确认码是正确的）
openclaw pairing list telegram

# 批准（把 ABC123 换成 Bot 发给你的实际码）
openclaw pairing approve telegram ABC123
```

批准后，回到 Telegram 再发一条消息，OpenClaw 就会通过这个 Bot 回复。

::: tip 配对只需做一次
配对批准后，以后你发消息就不需要再批准了。如果你想让其他人也能用这个 Bot，需要分别批准他们的配对请求。
:::

---

## 常见问题

::: details Bot Token 是什么，为什么需要它？

Token 就是 Telegram 服务器识别你的 Bot 的凭证，类似于账号+密码的组合。有了 Token，OpenClaw 才能代表你的 Bot 发送和接收消息。

:::

::: details Bot 不回复消息，怎么办？

按顺序检查：

1. 确认网关在运行：`openclaw gateway status`
2. 确认 Telegram 连接正常：`openclaw channels status --probe`
3. 确认你已经批准了配对请求：`openclaw pairing list telegram`

还是不行？查看实时日志找线索：`openclaw logs --follow`

:::

::: details 能在 Telegram 群组里使用 Bot 吗？

可以。把 Bot 添加进群组，然后 @提及 Bot 来触发它（默认需要 @ 才响应）。

如果想让 Bot 不需要 @ 也能响应所有消息，需要修改配置：
1. 先在 BotFather 里关闭"隐私模式"（发送 `/setprivacy` 给 BotFather）
2. 然后在 OpenClaw 配置里设置 `requireMention: false`

:::

---

*以下是技术文档，新手可以在需要时参考。*

---

## 技术说明

状态：通过 grammY 实现的机器人私信 + 群组功能，已可投入生产使用。长轮询是默认模式；Webhook 模式可选。


- [配对](/tutorials/channels/pairing)：Telegram 默认私信策略为配对模式。
- [通道故障排查](/tutorials/channels/troubleshooting)：跨通道诊断和修复手册。
- [网关配置](/tutorials/gateway/configuration)：完整的通道配置模式和示例。


## 快速设置（技术版）


  ### 步骤 1：在 BotFather 中创建机器人 Token

    打开 Telegram 并与 @BotFather 聊天（确认 handle 正好是 `@BotFather`）。

    运行 `/newbot`，按提示操作，保存 Token。


  ### 步骤 2：配置 Token 和私信策略

    Telegram 不走 `channels login`。请把 Token 写进配置或环境变量。


```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

    环境变量回退：`TELEGRAM_BOT_TOKEN=...`（仅默认账户）。


  ### 步骤 3：重启网关并批准首次私信


```bash
openclaw gateway restart
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

    如果你还没有把 Gateway 安装成后台服务，就在一个终端里用 `openclaw gateway run` 前台启动，保持窗口不要关闭。

    配对码在 1 小时后过期。


  ### 步骤 4：将机器人添加到群组

    将机器人添加到你的群组，然后设置 `channels.telegram.groups` 和 `groupPolicy` 以匹配你的访问模型。


::: info 说明
Token 解析顺序与账户相关。实际上，配置值优先于环境变量回退，`TELEGRAM_BOT_TOKEN` 仅适用于默认账户。
:::


## Telegram 端设置


::: details 隐私模式和群组可见性

    Telegram 机器人默认使用 隐私模式，这限制了它们能接收哪些群组消息。

    如果机器人需要看到所有群组消息，可以：

    - 通过 `/setprivacy` 禁用隐私模式，或
    - 将机器人设为群组管理员。

    切换隐私模式时，在每个群组中移除并重新添加机器人，以便 Telegram 应用更改。



:::


::: details 群组权限

    管理员状态在 Telegram 群组设置中控制。

    管理员机器人接收所有群组消息，这对于始终在线的群组行为很有用。



:::


::: details 实用的 BotFather 开关

    - `/setjoingroups` 允许/拒绝群组添加
    - `/setprivacy` 控制群组可见性行为



:::


## 访问控制和激活


  私信策略：

    `channels.telegram.dmPolicy` 控制私信访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `channels.telegram.allowFrom` 接受数字 Telegram 用户 ID。`telegram:` / `tg:` 前缀被接受并标准化。
    引导向导接受 `@username` 输入并将其解析为数字 ID。
    如果你升级后配置中包含 `@username` 白名单条目，运行 `openclaw doctor --fix` 来解析它们（尽力而为；需要 Telegram 机器人 Token）。

    ### 查找你的 Telegram 用户 ID

    更安全的方式（无第三方机器人）：

    1. 私信你的机器人。
    2. 运行 `openclaw logs --follow`。
    3. 读取 `from.id`。

    官方 Bot API 方法：

```bash
curl "https://api.telegram.org/bot<bot_token>/getUpdates"
```

    第三方方法（隐私性较低）：`@userinfobot` 或 `@getidsbot`。


  群组策略和白名单：

    有两个独立的控制：

    1. 允许哪些群组（`channels.telegram.groups`）
       - 无 `groups` 配置：允许所有群组
       - 已配置 `groups`：作为白名单（显式 ID 或 `"*"`）

    2. 允许群组中的哪些发送者（`channels.telegram.groupPolicy`）
       - `open`
       - `allowlist`（默认）
       - `disabled`

    `groupAllowFrom` 用于群组发送者过滤。如果未设置，Telegram 回退到 `allowFrom`。
    `groupAllowFrom` 条目必须是数字 Telegram 用户 ID。

    示例：允许一个特定群组中的任何成员：

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```


  提及行为：

    群组回复默认需要提及。

    提及可以来自：

    - 原生 `@botusername` 提及，或
    - 提及模式：
      - `agents.entries.*.groupChat.mentionPatterns`
      - `messages.groupChat.mentionPatterns`

    会话级命令开关：

    - `/activation always`
    - `/activation mention`

    这些仅更新会话状态。使用配置进行持久化。

    持久化配置示例：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false },
      },
    },
  },
}
```

    获取群组聊天 ID：

    - 转发群组消息到 `@userinfobot` / `@getidsbot`
    - 或从 `openclaw logs --follow` 中读取 `chat.id`
    - 或检查 Bot API `getUpdates`


## 运行时行为

- Telegram 由网关进程管理。
- 路由是确定性的：Telegram 入站消息回复到 Telegram（模型不选择通道）。
- 入站消息被标准化为共享的通道信封，包含回复元数据和媒体占位符。
- 群组会话按群组 ID 隔离。论坛话题追加 `:topic:<threadId>` 以保持话题隔离。
- 私信消息可以携带 `message_thread_id`；OpenClaw 使用线程感知的会话键路由它们，并保留线程 ID 用于回复。
- 长轮询使用 grammY runner，按聊天/线程排序。整体 runner sink 并发使用 `agents.defaults.maxConcurrent`。
- Telegram Bot API 不支持已读回执（`sendReadReceipts` 不适用）。

## 功能参考


::: details Telegram 私信中的草稿流式传输

    OpenClaw 可以使用 Telegram 草稿气泡（`sendMessageDraft`）流式传输部分回复。

    要求：

    - `channels.telegram.streamMode` 不是 `"off"`（默认：`"partial"`）
    - 私聊
    - 入站更新包含 `message_thread_id`
    - 机器人话题已启用（`getMe().has_topics_enabled`）

    模式：

    - `off`：不进行草稿流式传输
    - `partial`：从部分文本频繁更新草稿
    - `block`：使用 `channels.telegram.draftChunk` 进行分块草稿更新

    `draftChunk` 块模式的默认值：

    - `minChars: 200`
    - `maxChars: 800`
    - `breakPreference: "paragraph"`

    `maxChars` 受 `channels.telegram.textChunkLimit` 限制。

    草稿流式传输仅限私信；群组/频道不使用草稿气泡。

    如果你想要早期的真实 Telegram 消息而不是草稿更新，使用块流式传输（`channels.telegram.blockStreaming: true`）。

    Telegram 专属推理流：

    - `/reasoning stream` 在生成时将推理发送到草稿气泡
    - 最终答案在不包含推理文本的情况下发送



:::


::: details 格式化和 HTML 回退

    出站文本使用 Telegram `parse_mode: "HTML"`。

    - 类 Markdown 文本被渲染为 Telegram 安全的 HTML。
    - 原始模型 HTML 被转义以减少 Telegram 解析失败。
    - 如果 Telegram 拒绝解析后的 HTML，OpenClaw 以纯文本重试。

    链接预览默认启用，可通过 `channels.telegram.linkPreview: false` 禁用。



:::


::: details 原生命令和自定义命令

    Telegram 命令菜单在启动时通过 `setMyCommands` 注册。

    原生命令默认值：

    - `commands.native: "auto"` 为 Telegram 启用原生命令

    添加自定义命令菜单条目：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

    规则：

    - 名称会被标准化（去除前导 `/`，转小写）
    - 有效模式：`a-z`、`0-9`、`_`，长度 `1..32`
    - 自定义命令不能覆盖原生命令
    - 冲突/重复会被跳过并记录日志

    说明：

    - 自定义命令仅是菜单条目；不会自动实现行为
    - 插件/技能命令即使不在 Telegram 菜单中显示，输入时仍可工作

    如果原生命令被禁用，内置命令会被移除。自定义/插件命令如果已配置仍可能注册。

    常见设置失败：

    - `setMyCommands failed` 通常意味着到 `api.telegram.org` 的出站 DNS/HTTPS 被阻止。

    ### 设备配对命令（`device-pair` 插件）

    当安装了 `device-pair` 插件时：

    1. `/pair` 生成设置码
    2. 在 iOS 应用中粘贴该码
    3. `/pair approve` 批准最新的待处理请求

    更多详情：[配对](/tutorials/channels/pairing)。



:::


::: details 内联按钮

    配置内联键盘范围：

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

    按账户覆盖：

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

    范围：

    - `off`
    - `dm`
    - `group`
    - `all`
    - `allowlist`（默认）

    旧版 `capabilities: ["inlineButtons"]` 映射为 `inlineButtons: "all"`。

    消息操作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

    回调点击以文本形式传递给智能体：
    `callback_data: <value>`



:::


::: details Telegram 消息操作（智能体和自动化）

    Telegram 工具操作包括：

    - `sendMessage`（`to`、`content`，可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）
    - `react`（`chatId`、`messageId`、`emoji`）
    - `deleteMessage`（`chatId`、`messageId`）
    - `editMessage`（`chatId`、`messageId`、`content`）

    通道消息操作提供人机工程学别名（`send`、`react`、`delete`、`edit`、`sticker`、`sticker-search`）。

    门控配置：

    - `channels.telegram.actions.sendMessage`
    - `channels.telegram.actions.editMessage`
    - `channels.telegram.actions.deleteMessage`
    - `channels.telegram.actions.reactions`
    - `channels.telegram.actions.sticker`（默认：禁用）

    表情回应移除语义：[/tools/reactions](/tutorials/tools/reactions)



:::


::: details 回复线程标签

    Telegram 支持在生成输出中使用显式回复线程标签：

    - `[[reply_to_current]]` 回复触发消息
    - `[[reply_to:<id>]]` 回复特定 Telegram 消息 ID

    `channels.telegram.replyToMode` 控制处理方式：

    - `off`（默认）
    - `first`
    - `all`

    注意：`off` 禁用隐式回复线程。显式 `[[reply_to_*]]` 标签仍然有效。



:::


::: details 论坛话题和线程行为

    论坛超级群组：

    - 话题会话键追加 `:topic:<threadId>`
    - 回复和输入状态指向话题线程
    - 话题配置路径：
      `channels.telegram.groups.<chatId>.topics.<threadId>`

    通用话题（`threadId=1`）特殊情况：

    - 消息发送省略 `message_thread_id`（Telegram 拒绝 `sendMessage(...thread_id=1)`）
    - 输入状态操作仍包含 `message_thread_id`

    话题继承：话题条目继承群组设置，除非被覆盖（`requireMention`、`allowFrom`、`skills`、`systemPrompt`、`enabled`、`groupPolicy`）。

    模板上下文包含：

    - `MessageThreadId`
    - `IsForum`

    私信线程行为：

    - 带有 `message_thread_id` 的私聊保持私信路由，但使用线程感知的会话键/回复目标。



:::


::: details 音频、视频和贴纸

    ### 音频消息

    Telegram 区分语音笔记和音频文件。

    - 默认：音频文件行为
    - 在智能体回复中使用 `[[audio_as_voice]]` 标签强制以语音笔记发送

    消息操作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

    ### 视频消息

    Telegram 区分视频文件和视频笔记。

    消息操作示例：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/video.mp4",
  asVideoNote: true,
}
```

    视频笔记不支持标题；提供的消息文本会单独发送。

    ### 贴纸

    入站贴纸处理：

    - 静态 WEBP：下载并处理（占位符 `<media:sticker>`）
    - 动画 TGS：跳过
    - 视频 WEBM：跳过

    贴纸上下文字段：

    - `Sticker.emoji`
    - `Sticker.setName`
    - `Sticker.fileId`
    - `Sticker.fileUniqueId`
    - `Sticker.cachedDescription`

    贴纸缓存文件：

    - `~/.openclaw/telegram/sticker-cache.json`

    贴纸会被描述一次（如可能）并缓存，以减少重复的视觉调用。

    启用贴纸操作：

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

    发送贴纸操作：

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

    搜索缓存贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```



:::


::: details 表情回应通知

    Telegram 表情回应作为 `message_reaction` 更新到达（与消息载荷分开）。

    启用后，OpenClaw 入队系统事件如：

    - `Telegram reaction added: thumbs-up by Alice (@alice) on msg 42`

    配置：

    - `channels.telegram.reactionNotifications`：`off | own | all`（默认：`own`）
    - `channels.telegram.reactionLevel`：`off | ack | minimal | extensive`（默认：`minimal`）

    说明：

    - `own` 表示仅用户对机器人发送的消息的回应（通过发送消息缓存尽力匹配）。
    - Telegram 在回应更新中不提供线程 ID。
      - 非论坛群组路由到群组聊天会话
      - 论坛群组路由到群组通用话题会话（`:topic:1`），而非精确的原始话题

    轮询/Webhook 的 `allowed_updates` 自动包含 `message_reaction`。



:::


::: details 从 Telegram 事件和命令写入配置

    通道配置写入默认启用（`configWrites !== false`）。

    Telegram 触发的写入包括：

    - 群组迁移事件（`migrate_to_chat_id`）更新 `channels.telegram.groups`
    - `/config set` 和 `/config unset`（需要启用命令）

    禁用：

```json5
{
  channels: {
    telegram: {
      configWrites: false,
    },
  },
}
```



:::


::: details 长轮询 vs Webhook

    默认：长轮询。

    长轮询模式下，OpenClaw 只有在一条 Telegram update 成功分发后，才会把“我已经处理到这里了”的重启水位写入磁盘。
    如果处理函数失败，这条 update 仍然可以在当前进程里重试，也不会被写成“重启后不用再处理”。

    这句话对排错很需要留意：不要把“看到了 update”误以为“update 已经安全完成”。真正安全的是成功分发后的水位记录。

    Webhook 模式：

    - 设置 `channels.telegram.webhookUrl`
    - 设置 `channels.telegram.webhookSecret`（设置 Webhook URL 时必需）
    - 可选 `channels.telegram.webhookPath`（默认 `/telegram-webhook`）
    - 可选 `channels.telegram.webhookHost`（默认 `127.0.0.1`）

    Webhook 模式的默认本地监听器绑定到 `127.0.0.1:8787`。

    如果你的公共端点不同，在前面放置反向代理，将 `webhookUrl` 指向公共 URL。
    当你需要外部入站时，设置 `webhookHost`（例如 `0.0.0.0`）。



:::


::: details 限制、重试和 CLI 目标

    - `channels.telegram.textChunkLimit` 默认为 4000。
    - `channels.telegram.chunkMode="newline"` 在按长度分割前优先使用段落边界（空行）。
    - `channels.telegram.mediaMaxMb`（默认 5）限制入站 Telegram 媒体下载/处理大小。
    - `channels.telegram.timeoutSeconds` 覆盖 Telegram API 客户端超时（如未设置，应用 grammY 默认值）。
    - 群组上下文历史使用 `channels.telegram.historyLimit` 或 `messages.groupChat.historyLimit`（默认 50）；`0` 禁用。
    - 私信历史控制：
      - `channels.telegram.dmHistoryLimit`
      - `channels.telegram.dms["<user_id>"].historyLimit`
    - 出站 Telegram API 重试可通过 `channels.telegram.retry` 配置。

    CLI 发送目标可以是数字聊天 ID 或用户名：

```bash
openclaw message send --channel telegram --target 123456789 --message "hi"
openclaw message send --channel telegram --target @name --message "hi"
```



:::


## 故障排查


::: details 机器人不响应非提及的群组消息

    - 如果 `requireMention=false`，Telegram 隐私模式必须允许完全可见性。
      - BotFather：`/setprivacy` -> 禁用
      - 然后在群组中移除并重新添加机器人
    - `openclaw channels status` 会在配置期望未提及的群组消息时发出警告。
    - `openclaw channels status --probe` 可以检查显式数字群组 ID；通配符 `"*"` 无法进行成员资格探测。
    - 快速会话测试：`/activation always`。



:::


::: details 机器人完全看不到群组消息

    - 当 `channels.telegram.groups` 存在时，群组必须被列出（或包含 `"*"`）
    - 验证机器人在群组中的成员资格
    - 查看日志：`openclaw logs --follow` 了解跳过原因



:::


::: details 命令部分工作或完全不工作

    - 授权你的发送者身份（配对和/或数字 `allowFrom`）
    - 即使群组策略为 `open`，命令授权仍然适用
    - `setMyCommands failed` 通常表示到 `api.telegram.org` 的 DNS/HTTPS 可达性问题



:::


::: details 轮询或网络不稳定

    - Node 22+ 和自定义 fetch/代理可能因 AbortSignal 类型不匹配而触发立即中止行为。
    - 某些主机先将 `api.telegram.org` 解析为 IPv6；损坏的 IPv6 出站可能导致间歇性 Telegram API 故障。
    - 验证 DNS 应答：

```bash
dig +short api.telegram.org A
dig +short api.telegram.org AAAA
```



:::


更多帮助：[通道故障排查](/tutorials/channels/troubleshooting)。

## Telegram 配置参考指引

主要参考：

- `channels.telegram.enabled`：启用/禁用通道启动。
- `channels.telegram.botToken`：机器人 Token（BotFather）。
- `channels.telegram.tokenFile`：从文件路径读取 Token。
- `channels.telegram.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.telegram.allowFrom`：私信白名单（数字 Telegram 用户 ID）。`open` 需要 `"*"`。`openclaw doctor --fix` 可以将旧版 `@username` 条目解析为 ID。
- `channels.telegram.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.telegram.groupAllowFrom`：群组发送者白名单（数字 Telegram 用户 ID）。`openclaw doctor --fix` 可以将旧版 `@username` 条目解析为 ID。
- `channels.telegram.groups`：按群组默认值 + 白名单（使用 `"*"` 设置全局默认值）。
  - `channels.telegram.groups.<id>.groupPolicy`：按群组覆盖 groupPolicy（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.requireMention`：提及门控默认值。
  - `channels.telegram.groups.<id>.skills`：技能过滤器（省略 = 所有技能，空 = 无）。
  - `channels.telegram.groups.<id>.allowFrom`：按群组发送者白名单覆盖。
  - `channels.telegram.groups.<id>.systemPrompt`：群组的额外系统提示。
  - `channels.telegram.groups.<id>.enabled`：`false` 时禁用该群组。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`：按话题覆盖（与群组相同的字段）。
  - `channels.telegram.groups.<id>.topics.<threadId>.groupPolicy`：按话题覆盖 groupPolicy（`open | allowlist | disabled`）。
  - `channels.telegram.groups.<id>.topics.<threadId>.requireMention`：按话题提及门控覆盖。
- `channels.telegram.capabilities.inlineButtons`：`off | dm | group | all | allowlist`（默认：allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`：按账户覆盖。
- `channels.telegram.replyToMode`：`off | first | all`（默认：`off`）。
- `channels.telegram.textChunkLimit`：出站分块大小（字符）。
- `channels.telegram.chunkMode`：`length`（默认）或 `newline`，在按长度分块前先在空行处（段落边界）分割。
- `channels.telegram.linkPreview`：切换出站消息的链接预览（默认：true）。
- `channels.telegram.streamMode`：`off | partial | block`（草稿流式传输）。
- `channels.telegram.mediaMaxMb`：入站/出站媒体上限（MB）。
- `channels.telegram.retry`：出站 Telegram API 调用的重试策略（attempts、minDelayMs、maxDelayMs、jitter）。
- `channels.telegram.network.autoSelectFamily`：覆盖 Node autoSelectFamily（true=启用，false=禁用）。在 Node 22 上默认禁用以避免 Happy Eyeballs 超时。
- `channels.telegram.proxy`：Bot API 调用的代理 URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`：启用 Webhook 模式（需要 `channels.telegram.webhookSecret`）。
- `channels.telegram.webhookSecret`：Webhook 密钥（设置 webhookUrl 时必需）。
- `channels.telegram.webhookPath`：本地 Webhook 路径（默认 `/telegram-webhook`）。
- `channels.telegram.webhookHost`：本地 Webhook 绑定主机（默认 `127.0.0.1`）。
- `channels.telegram.actions.reactions`：Telegram 工具回应的门控。
- `channels.telegram.actions.sendMessage`：Telegram 工具消息发送的门控。
- `channels.telegram.actions.deleteMessage`：Telegram 工具消息删除的门控。
- `channels.telegram.actions.sticker`：Telegram 贴纸操作的门控 : 发送和搜索（默认：false）。
- `channels.telegram.reactionNotifications`：`off | own | all` : 控制哪些回应触发系统事件（未设置时默认：`own`）。
- `channels.telegram.reactionLevel`：`off | ack | minimal | extensive` : 控制智能体的回应能力（未设置时默认：`minimal`）。

- [配置参考 - Telegram](/tutorials/gateway/configuration-reference)

Telegram 特有的高信号字段：

- 启动/认证：`enabled`、`botToken`、`tokenFile`、`accounts.*`
- 访问控制：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`、`groups.*.topics.*`
- 命令/菜单：`commands.native`、`customCommands`
- 线程/回复：`replyToMode`
- 流式传输：`streamMode`、`draftChunk`、`blockStreaming`
- 格式化/投递：`textChunkLimit`、`chunkMode`、`linkPreview`、`responsePrefix`
- 媒体/网络：`mediaMaxMb`、`timeoutSeconds`、`retry`、`network.autoSelectFamily`、`proxy`
- Webhook：`webhookUrl`、`webhookSecret`、`webhookPath`、`webhookHost`
- 操作/功能：`capabilities.inlineButtons`、`actions.sendMessage|editMessage|deleteMessage|reactions|sticker`
- 回应：`reactionNotifications`、`reactionLevel`
- 写入/历史：`configWrites`、`historyLimit`、`dmHistoryLimit`、`dms.*.historyLimit`

## 相关

- [配对](/tutorials/channels/pairing)
- [通道路由](/tutorials/channels/channel-routing)
- [故障排查](/tutorials/channels/troubleshooting)
