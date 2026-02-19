---
title: "配置参考"
sidebarTitle: "配置参考"
description: "~/.openclaw/openclaw.json 的完整逐字段参考"
---

# 配置参考

`~/.openclaw/openclaw.json` 中所有可用字段。如需面向任务的概述，请参阅[配置](/gateway/configuration)。

配置格式为 **JSON5**（允许注释和尾逗号）。所有字段均为可选——省略时 OpenClaw 会使用安全的默认值。

---

## 通道（Channels）

每个通道在其配置段存在时会自动启动（除非设置了 `enabled: false`）。

### 私聊与群组访问

所有通道都支持私聊策略和群组策略：

| 私聊策略            | 行为                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（默认）   | 未知发送者会收到一次性配对码；所有者需要批准                    |
| `allowlist`         | 仅允许 `allowFrom` 中的发送者（或已配对的允许列表）             |
| `open`              | 允许所有入站私聊（需设置 `allowFrom: ["*"]`）                   |
| `disabled`          | 忽略所有入站私聊                                                |

| 群组策略              | 行为                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（默认）   | 仅允许匹配已配置白名单的群组                           |
| `open`                | 绕过群组白名单（提及门控仍然生效）                     |
| `disabled`            | 阻止所有群组/房间消息                                  |

::: info 说明
`channels.defaults.groupPolicy` 设置当提供商（Provider）的 `groupPolicy` 未设置时的默认值。
配对码在 1 小时后过期。每个通道待处理的私聊配对请求上限为 **3 个**。
Slack/Discord 有特殊回退机制：如果其提供商配置段完全缺失，运行时群组策略可能会解析为 `open`（并显示启动警告）。
:::


### WhatsApp

WhatsApp 通过网关的 Web 通道（Baileys Web）运行。当存在已链接的会话时会自动启动。

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 蓝色双勾（自聊模式下为 false）
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

::: details 多账户 WhatsApp

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- 出站命令默认使用 `default` 账户（如果存在）；否则使用第一个已配置的账户 ID（按排序）。
- 旧版单账户 Baileys 认证目录会被 `openclaw doctor` 迁移到 `whatsapp/default`。
- 按账户覆盖：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

:::


### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all
      linkPreview: true,
      streamMode: "partial", // off | partial | block
      draftChunk: {
        minChars: 200,
        maxChars: 800,
        breakPreference: "paragraph", // paragraph | newline | sentence
      },
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 5,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: { autoSelectFamily: false },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot Token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`，默认账户回退使用 `TELEGRAM_BOT_TOKEN` 环境变量。
- `configWrites: false` 阻止 Telegram 发起的配置写入（超级群组 ID 迁移、`/config set|unset`）。
- 草稿流式传输使用 Telegram `sendMessageDraft`（需要私聊话题）。
- 重试策略：参阅[重试策略](/concepts/retry)。

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 8,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "steipete"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      maxLinesPerMessage: 17,
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token：`channels.discord.token`，默认账户回退使用 `DISCORD_BOT_TOKEN` 环境变量。
- 使用 `user:<id>`（私聊）或 `channel:<id>`（服务器频道）作为投递目标；纯数字 ID 会被拒绝。
- 服务器 slug 为小写，空格替换为 `-`；频道键使用 slug 化名称（不含 `#`）。建议使用服务器 ID。
- Bot 发送的消息默认被忽略。`allowBots: true` 启用处理（Bot 自身的消息仍会被过滤）。
- `maxLinesPerMessage`（默认 17）即使消息未超过 2000 字符也会拆分过长的消息。

**表情通知模式：** `off`（无通知）、`own`（Bot 的消息，默认）、`all`（所有消息）、`allowlist`（来自 `guilds.<id>.users` 的用户对所有消息的表情）。

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- 服务账户 JSON：内联（`serviceAccount`）或基于文件（`serviceAccountFile`）。
- 环境变量回退：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 使用 `spaces/<spaceId>` 或 `users/<userId|email>` 作为投递目标。

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      textChunkLimit: 4000,
      chunkMode: "length",
      mediaMaxMb: 20,
    },
  },
}
```

- **Socket 模式**需要同时提供 `botToken` 和 `appToken`（默认账户环境变量回退为 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加上 `signingSecret`（在根级别或按账户配置）。
- `configWrites: false` 阻止 Slack 发起的配置写入。
- 使用 `user:<id>`（私聊）或 `channel:<id>` 作为投递目标。

**表情通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

**线程会话隔离：** `thread.historyScope` 按线程（默认）或跨频道共享。`thread.inheritParent` 将父频道的对话记录复制到新线程。

| 操作组       | 默认值  | 说明                   |
| ------------ | ------- | ---------------------- |
| reactions    | 启用    | 添加/列出表情          |
| messages     | 启用    | 读取/发送/编辑/删除    |
| pins         | 启用    | 固定/取消固定/列出     |
| memberInfo   | 启用    | 成员信息               |
| emojiList    | 启用    | 自定义表情列表         |

### Mattermost

Mattermost 以插件形式提供：`openclaw plugins install @openclaw/mattermost`。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

聊天模式：`oncall`（在 @提及时响应，默认）、`onmessage`（每条消息都响应）、`onchar`（以触发前缀开头的消息）。

### Signal

```json5
{
  channels: {
    signal: {
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**表情通知模式：** `off`、`own`（默认）、`all`、`allowlist`（来自 `reactionAllowlist`）。

### iMessage

OpenClaw 生成 `imsg rpc`（通过 stdio 的 JSON-RPC）。无需守护进程或端口。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- 需要对 Messages 数据库的完全磁盘访问权限。
- 建议使用 `chat_id:<id>` 作为目标。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包装器；设置 `remoteHost` 以进行 SCP 附件获取。

::: details iMessage SSH 包装器示例

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

:::


### 多账户（所有通道）

为每个通道运行多个账户（每个账户有自己的 `accountId`）：

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- 省略 `accountId` 时使用 `default`（CLI + 路由）。
- 环境变量 Token 仅适用于 **default** 账户。
- 基础通道设置适用于所有账户，除非按账户单独覆盖。
- 使用 `bindings[].match.accountId` 将每个账户路由到不同的代理（Agent）。

### 群聊提及门控

群组消息默认**需要提及**（元数据提及或正则模式）。适用于 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群聊。

**提及类型：**

- **元数据提及**：原生平台 @提及。在 WhatsApp 自聊模式下被忽略。
- **文本模式**：`agents.list[].groupChat.mentionPatterns` 中的正则模式。始终检查。
- 提及门控仅在检测可行时才强制执行（原生提及或至少一个模式）。

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 设置全局默认值。通道可以通过 `channels.<channel>.historyLimit`（或按账户）覆盖。设为 `0` 禁用。

#### 私聊历史限制

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解析顺序：按私聊覆盖 → 提供商默认 → 无限制（全部保留）。

支持：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自聊模式

将你自己的号码加入 `allowFrom` 以启用自聊模式（忽略原生 @提及，仅响应文本模式）：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### 命令（聊天命令处理）

```json5
{
  commands: {
    native: "auto", // 在支持的平台上注册原生命令
    text: true, // 解析聊天消息中的 /命令
    bash: false, // 允许 !（别名：/bash）
    bashForegroundMs: 2000,
    config: false, // 允许 /config
    debug: false, // 允许 /debug
    restart: false, // 允许 /restart + 网关重启工具
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

::: details 命令详情

- 文本命令必须是以 `/` 开头的**独立**消息。
- `native: "auto"` 为 Discord/Telegram 启用原生命令，Slack 保持关闭。
- 按通道覆盖：`channels.discord.commands.native`（布尔值或 `"auto"`）。`false` 会清除之前注册的命令。
- `channels.telegram.customCommands` 添加额外的 Telegram Bot 菜单项。
- `bash: true` 启用 `! <cmd>` 执行宿主 Shell。需要 `tools.elevated.enabled` 且发送者在 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 启用 `/config`（读取/写入 `openclaw.json`）。
- `channels.<provider>.configWrites` 控制每个通道的配置修改权限（默认：true）。
- `allowFrom` 按提供商设置。设置后，它是**唯一**的授权来源（通道白名单/配对和 `useAccessGroups` 被忽略）。
- `useAccessGroups: false` 允许命令在未设置 `allowFrom` 时绕过访问组策略。

:::


---

## 代理默认值

### `agents.defaults.workspace`

默认值：`~/.openclaw/workspace`。

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

可选的代码仓库根目录，显示在系统提示的 Runtime 行中。如未设置，OpenClaw 会从工作区向上自动检测。

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skipBootstrap`

禁用工作区引导文件的自动创建（`AGENTS.md`、`SOUL.md`、`TOOLS.md`、`IDENTITY.md`、`USER.md`、`HEARTBEAT.md`、`BOOTSTRAP.md`）。

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

每个工作区引导文件截断前的最大字符数。默认值：`20000`。

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

所有工作区引导文件注入的最大总字符数。默认值：`24000`。

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 24000 } },
}
```

### `agents.defaults.userTimezone`

系统提示上下文中使用的时区（不是消息时间戳）。回退到主机时区。

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

系统提示中的时间格式。默认值：`auto`（操作系统偏好）。

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.1": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.1"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model.primary`：格式为 `provider/model`（例如 `anthropic/claude-opus-4-6`）。如果省略提供商，OpenClaw 假定为 `anthropic`（已弃用）。
- `models`：已配置的模型目录和 `/model` 的白名单。每个条目可包含 `alias`（快捷方式）和 `params`（提供商特定参数：`temperature`、`maxTokens`）。
- `imageModel`：仅在主模型不支持图像输入时使用。
- `maxConcurrent`：跨会话的最大并行代理运行数（每个会话仍然串行）。默认值：1。

**内置别名简写**（仅在模型在 `agents.defaults.models` 中时生效）：

| 别名           | 模型                            |
| -------------- | ------------------------------- |
| `opus`         | `anthropic/claude-opus-4-6`     |
| `sonnet`       | `anthropic/claude-sonnet-4-5`   |
| `gpt`          | `openai/gpt-5.2`                |
| `gpt-mini`     | `openai/gpt-5-mini`             |
| `gemini`       | `google/gemini-3-pro-preview`   |
| `gemini-flash` | `google/gemini-3-flash-preview` |

你配置的别名始终优先于默认值。

Z.AI GLM-4.x 模型会自动启用思维模式，除非你设置了 `--thinking off` 或自行定义了 `agents.defaults.models["zai/<model>"].params.thinking`。

### `agents.defaults.cliBackends`

可选的 CLI 后端，用于纯文本回退运行（无工具调用）。在 API 提供商故障时可作为备用。

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI 后端以文本为主；工具始终禁用。
- 设置 `sessionArg` 后支持会话。
- 当 `imageArg` 接受文件路径时支持图像传递。

### `agents.defaults.heartbeat`

周期性心跳运行。

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m 禁用
        model: "openai/gpt-5.2-mini",
        includeReasoning: false,
        session: "main",
        to: "+15555550123",
        target: "last", // last | whatsapp | telegram | discord | ... | none
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
      },
    },
  },
}
```

- `every`：持续时间字符串（ms/s/m/h）。默认值：`30m`。
- 按代理设置：设置 `agents.list[].heartbeat`。当任何代理定义了 `heartbeat` 时，**仅这些代理**运行心跳。
- 心跳运行完整的代理回合——更短的间隔会消耗更多 Token。

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        reserveTokensFloor: 24000,
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`：`default` 或 `safeguard`（长历史的分块摘要）。参阅[上下文压缩（Compaction）](/concepts/compaction)。
- `memoryFlush`：自动压缩前的静默代理回合，用于存储持久记忆。工作区只读时跳过。

### `agents.defaults.contextPruning`

从内存上下文中修剪**旧的工具结果**后再发送给 LLM。**不会**修改磁盘上的会话历史。

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // 持续时间（ms/s/m/h），默认单位：分钟
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

::: details cache-ttl 模式行为

- `mode: "cache-ttl"` 启用修剪处理。
- `ttl` 控制修剪再次运行的间隔（在上次缓存触碰之后）。
- 修剪首先对超大工具结果进行软裁剪，然后在需要时对较旧的工具结果进行硬清除。

**软裁剪**保留开头和结尾，在中间插入 `...`。

**硬清除**用占位符替换整个工具结果。

注意：

- 图像块永远不会被裁剪/清除。
- 比例基于字符（近似值），不是精确的 Token 计数。
- 如果助手消息少于 `keepLastAssistants` 条，则跳过修剪。

:::


参阅[会话修剪（Session Pruning）](/concepts/session-pruning)了解行为详情。

### 分块流式传输（Block Streaming）

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom（使用 minMs/maxMs）
    },
  },
}
```

- 非 Telegram 通道需要显式设置 `*.blockStreaming: true` 来启用分块回复。
- 通道覆盖：`channels.<channel>.blockStreamingCoalesce`（以及按账户变体）。Signal/Slack/Discord/Google Chat 默认 `minChars: 1500`。
- `humanDelay`：分块回复之间的随机暂停。`natural` = 800–2500ms。按代理覆盖：`agents.list[].humanDelay`。

参阅[流式传输（Streaming）](/concepts/streaming)了解行为和分块详情。

### 输入指示器（Typing Indicators）

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- 默认值：私聊/提及时为 `instant`，未被提及的群聊为 `message`。
- 按会话覆盖：`session.typingMode`、`session.typingIntervalSeconds`。

参阅[输入指示器（Typing Indicators）](/concepts/typing-indicators)。

### `agents.defaults.sandbox`

可选的 **Docker 沙箱**，用于嵌入式代理。完整指南参阅[沙箱（Sandboxing）](/gateway/sandboxing)。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          cdpPort: 9222,
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

::: details 沙箱详情

**工作区访问：**

- `none`：按作用域在 `~/.openclaw/sandboxes` 下创建沙箱工作区
- `ro`：沙箱工作区在 `/workspace`，代理工作区以只读方式挂载在 `/agent`
- `rw`：代理工作区以读写方式挂载在 `/workspace`

**作用域：**

- `session`：按会话的容器 + 工作区
- `agent`：每个代理一个容器 + 工作区（默认）
- `shared`：共享容器和工作区（无跨会话隔离）

**`setupCommand`** 在容器创建后运行一次（通过 `sh -lc`）。需要网络出站、可写根目录、root 用户。

**容器默认使用 `network: "none"`** ——如果代理需要出站访问，请设为 `"bridge"`。

**入站附件**会被暂存到活动工作区的 `media/inbound/*` 中。

**`docker.binds`** 挂载额外的宿主目录；全局和按代理的绑定会合并。

**沙箱浏览器**（`sandbox.browser.enabled`）：容器中的 Chromium + CDP。noVNC URL 会注入系统提示。不需要在主配置中启用 `browser.enabled`。

- `allowHostControl: false`（默认）阻止沙箱会话控制宿主浏览器。
- `sandbox.browser.binds` 将额外的宿主目录仅挂载到沙箱浏览器容器中。设置后（包括 `[]`），它会替换浏览器容器的 `docker.binds`。

:::


构建镜像：

```bash
scripts/sandbox-setup.sh           # 主沙箱镜像
scripts/sandbox-browser-setup.sh   # 可选浏览器镜像
```

### `agents.list`（按代理覆盖）

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // 或 { primary, fallbacks }
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`：稳定的代理 ID（必填）。
- `default`：当多个代理设置了此项时，第一个生效（会记录警告）。如果都未设置，则列表中第一个条目为默认。
- `model`：字符串形式仅覆盖 `primary`；对象形式 `{ primary, fallbacks }` 同时覆盖两者（`[]` 禁用全局回退）。
- `identity.avatar`：工作区相对路径、`http(s)` URL 或 `data:` URI。
- `identity` 派生默认值：`ackReaction` 来自 `emoji`，`mentionPatterns` 来自 `name`/`emoji`。
- `subagents.allowAgents`：`sessions_spawn` 的代理 ID 白名单（`["*"]` = 任意；默认：仅限同一代理）。

---

## 多代理路由

在一个网关（Gateway）内运行多个隔离的代理。参阅[多代理（Multi-Agent）](/concepts/multi-agent)。

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### 绑定匹配字段

- `match.channel`（必填）
- `match.accountId`（可选；`*` = 任意账户；省略 = 默认账户）
- `match.peer`（可选；`{ kind: direct|group|channel, id }`）
- `match.guildId` / `match.teamId`（可选；特定通道使用）

**确定性匹配顺序：**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId`（精确匹配，无 peer/guild/team）
5. `match.accountId: "*"`（全通道）
6. 默认代理

在每个层级内，第一个匹配的 `bindings` 条目生效。

### 按代理访问配置

::: details 完全访问（无沙箱）

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

:::


::: details 只读工具 + 工作区

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

:::


::: details 无文件系统访问（仅消息）

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

:::


参阅[多代理沙箱与工具（Multi-Agent Sandbox & Tools）](/tools/multi-agent-sandbox-tools)了解优先级详情。

---

## 会话（Session）

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
    },
    mainKey: "main", // 旧版（运行时始终使用 "main"）
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

::: details 会话字段详情

- **`dmScope`**：私聊的分组方式。
  - `main`：所有私聊共享主会话。
  - `per-peer`：跨通道按发送者 ID 隔离。
  - `per-channel-peer`：按通道 + 发送者隔离（推荐用于多用户收件箱）。
  - `per-account-channel-peer`：按账户 + 通道 + 发送者隔离（推荐用于多账户）。
- **`identityLinks`**：将规范 ID 映射到带提供商前缀的对端，用于跨通道会话共享。
- **`reset`**：主要重置策略。`daily` 在本地时间 `atHour` 重置；`idle` 在 `idleMinutes` 后重置。同时配置时，先到期的生效。
- **`resetByType`**：按类型覆盖（`direct`、`group`、`thread`）。旧版 `dm` 可作为 `direct` 的别名。
- **`mainKey`**：旧版字段。运行时现在始终使用 `"main"` 作为主私聊桶。
- **`sendPolicy`**：按 `channel`、`chatType`（`direct|group|channel`，旧版 `dm` 别名）、`keyPrefix` 或 `rawKeyPrefix` 匹配。第一个 deny 生效。
- **`maintenance`**：`warn` 在驱逐时警告活动会话；`enforce` 执行修剪和轮转。

:::


---

## 消息（Messages）

```json5
{
  messages: {
    responsePrefix: "🦞", // 或 "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 禁用
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### 响应前缀

按通道/账户覆盖：`channels.<channel>.responsePrefix`、`channels.<channel>.accounts.<id>.responsePrefix`。

解析（最具体的优先）：账户 → 通道 → 全局。`""` 禁用并停止级联。`"auto"` 派生 `[{identity.name}]`。

**模板变量：**

| 变量              | 描述                 | 示例                        |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | 短模型名称           | `claude-opus-4-6`           |
| `{modelFull}`     | 完整模型标识符       | `anthropic/claude-opus-4-6` |
| `{provider}`      | 提供商名称           | `anthropic`                 |
| `{thinkingLevel}` | 当前思维级别         | `high`、`low`、`off`        |
| `{identity.name}` | 代理身份名称         | （同 `"auto"`）             |

变量不区分大小写。`{think}` 是 `{thinkingLevel}` 的别名。

### 确认表情（Ack Reaction）

- 默认为活动代理的 `identity.emoji`，否则为 `"👀"`。设为 `""` 禁用。
- 范围：`group-mentions`（默认）、`group-all`、`direct`、`all`。
- `removeAckAfterReply`：回复后移除确认表情（仅 Slack/Discord/Telegram/Google Chat）。

### 入站去抖动

将来自同一发送者的快速纯文本消息批量合并为单个代理回合。媒体/附件会立即刷新。控制命令绕过去抖动。

### TTS（文本转语音）

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` 控制自动 TTS。`/tts off|always|inbound|tagged` 按会话覆盖。
- `summaryModel` 覆盖自动摘要的 `agents.defaults.model.primary`。
- API 密钥回退到 `ELEVENLABS_API_KEY`/`XI_API_KEY` 和 `OPENAI_API_KEY`。

---

## 对话（Talk）

Talk 模式（macOS/iOS/Android）的默认值。

```json5
{
  talk: {
    voiceId: "elevenlabs_voice_id",
    voiceAliases: {
      Clawd: "EXAVITQu4vr4xnSDxMaL",
      Roger: "CwhRBWXzGAHq8TQ4Fs17",
    },
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_128",
    apiKey: "elevenlabs_api_key",
    interruptOnSpeech: true,
  },
}
```

- 语音 ID 回退到 `ELEVENLABS_VOICE_ID` 或 `SAG_VOICE_ID`。
- `apiKey` 回退到 `ELEVENLABS_API_KEY`。
- `voiceAliases` 允许 Talk 指令使用友好名称。

---

## 工具（Tools）

### 工具配置文件

`tools.profile` 在 `tools.allow`/`tools.deny` 之前设置基础白名单：

| 配置文件    | 包含                                                                                      |
| ----------- | ----------------------------------------------------------------------------------------- |
| `minimal`   | 仅 `session_status`                                                                       |
| `coding`    | `group:fs`、`group:runtime`、`group:sessions`、`group:memory`、`image`                     |
| `messaging` | `group:messaging`、`sessions_list`、`sessions_history`、`sessions_send`、`session_status`  |
| `full`      | 无限制（与未设置相同）                                                                     |

### 工具组

| 组                 | 工具                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`、`process`（`bash` 可作为 `exec` 的别名）                                         |
| `group:fs`         | `read`、`write`、`edit`、`apply_patch`                                                   |
| `group:sessions`   | `sessions_list`、`sessions_history`、`sessions_send`、`sessions_spawn`、`session_status`  |
| `group:memory`     | `memory_search`、`memory_get`                                                            |
| `group:web`        | `web_search`、`web_fetch`                                                                |
| `group:ui`         | `browser`、`canvas`                                                                      |
| `group:automation` | `cron`、`gateway`                                                                        |
| `group:messaging`  | `message`                                                                                |
| `group:nodes`      | `nodes`                                                                                  |
| `group:openclaw`   | 所有内置工具（不包括提供商插件）                                                          |

### `tools.allow` / `tools.deny`

全局工具允许/拒绝策略（拒绝优先）。不区分大小写，支持 `*` 通配符。即使 Docker 沙箱关闭也会应用。

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

进一步限制特定提供商或模型的工具。顺序：基础配置文件 → 提供商配置文件 → allow/deny。

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

控制提升（宿主）执行访问：

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["steipete", "1234567890123"],
      },
    },
  },
}
```

- 按代理覆盖（`agents.list[].tools.elevated`）只能进一步限制。
- `/elevated on|off|ask|full` 按会话存储状态；内联指令适用于单条消息。
- 提升的 `exec` 在宿主上运行，绕过沙箱。

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.2"],
      },
    },
  },
}
```

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // 或 BRAVE_API_KEY 环境变量
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        maxChars: 50000,
        maxCharsCap: 50000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

配置入站媒体理解（图像/音频/视频）：

```json5
{
  tools: {
    media: {
      concurrency: 2,
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "&#123;&#123;MediaPath&#125;&#125;"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

::: details 媒体模型条目字段

**提供商条目**（`type: "provider"` 或省略）：

- `provider`：API 提供商 ID（`openai`、`anthropic`、`google`/`gemini`、`groq` 等）
- `model`：模型 ID 覆盖
- `profile` / `preferredProfile`：认证配置文件选择

**CLI 条目**（`type: "cli"`）：

- `command`：要运行的可执行文件
- `args`：模板化参数（支持 &#123;&#123;MediaPath&#125;&#125;、&#123;&#123;Prompt&#125;&#125;、&#123;&#123;MaxChars&#125;&#125; 等）

**通用字段：**

- `capabilities`：可选列表（`image`、`audio`、`video`）。默认值：`openai`/`anthropic`/`minimax` → image，`google` → image+audio+video，`groq` → audio。
- `prompt`、`maxChars`、`maxBytes`、`timeoutSeconds`、`language`：按条目覆盖。
- 失败时回退到下一个条目。

提供商认证遵循标准顺序：认证配置文件 → 环境变量 → `models.providers.*.apiKey`。

:::


### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        model: "minimax/MiniMax-M2.1",
        maxConcurrent: 1,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`：生成的子代理的默认模型。如果省略，子代理继承调用者的模型。
- 按子代理的工具策略：`tools.subagents.tools.allow` / `tools.subagents.tools.deny`。

---

## 自定义提供商和基础 URL

OpenClaw 使用 pi-coding-agent 模型目录。通过配置中的 `models.providers` 或 `~/.openclaw/agents/<agentId>/agent/models.json` 添加自定义提供商。

```json5
{
  models: {
    mode: "merge", // merge（默认）| replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- 使用 `authHeader: true` + `headers` 满足自定义认证需求。
- 使用 `OPENCLAW_AGENT_DIR`（或 `PI_CODING_AGENT_DIR`）覆盖代理配置根目录。

### 提供商示例

::: details Cerebras（GLM 4.6 / 4.7）

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Cerebras 使用 `cerebras/zai-glm-4.7`；Z.AI 直连使用 `zai/glm-4.7`。

:::


::: details OpenCode Zen

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

设置 `OPENCODE_API_KEY`（或 `OPENCODE_ZEN_API_KEY`）。快捷方式：`openclaw onboard --auth-choice opencode-zen`。

:::


::: details Z.AI（GLM-4.7）

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

设置 `ZAI_API_KEY`。`z.ai/*` 和 `z-ai/*` 可作为别名。快捷方式：`openclaw onboard --auth-choice zai-api-key`。

- 通用端点：`https://api.z.ai/api/paas/v4`
- 编码端点（默认）：`https://api.z.ai/api/coding/paas/v4`
- 如需通用端点，请定义一个带有基础 URL 覆盖的自定义提供商。

:::


::: details Moonshot AI（Kimi）

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 256000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

如需中国端点：`baseUrl: "https://api.moonshot.cn/v1"` 或 `openclaw onboard --auth-choice moonshot-api-key-cn`。

:::


::: details Kimi Coding

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi-coding/k2p5" },
      models: { "kimi-coding/k2p5": { alias: "Kimi K2.5" } },
    },
  },
}
```

Anthropic 兼容，内置提供商。快捷方式：`openclaw onboard --auth-choice kimi-code-api-key`。

:::


::: details Synthetic（Anthropic 兼容）

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.1" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.1": { alias: "MiniMax M2.1" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

基础 URL 应省略 `/v1`（Anthropic 客户端会自动追加）。快捷方式：`openclaw onboard --auth-choice synthetic-api-key`。

:::


::: details MiniMax M2.1（直连）

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.1" },
      models: {
        "minimax/MiniMax-M2.1": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.1",
            name: "MiniMax M2.1",
            reasoning: false,
            input: ["text"],
            cost: { input: 15, output: 60, cacheRead: 2, cacheWrite: 10 },
            contextWindow: 200000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

设置 `MINIMAX_API_KEY`。快捷方式：`openclaw onboard --auth-choice minimax-api`。

:::


::: details 本地模型（LM Studio）

参阅[本地模型（Local Models）](/gateway/local-models)。简而言之：在高性能硬件上通过 LM Studio Responses API 运行 MiniMax M2.1；保留合并的托管模型作为回退。

:::


---

## 技能（Skills）

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn
    },
    entries: {
      "nano-banana-pro": {
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`：仅用于内置技能的可选白名单（托管/工作区技能不受影响）。
- `entries.<skillKey>.enabled: false` 禁用技能，即使是内置/已安装的。
- `entries.<skillKey>.apiKey`：为声明了主要环境变量的技能提供便捷配置。

---

## 插件（Plugins）

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        config: { provider: "twilio" },
      },
    },
  },
}
```

- 从 `~/.openclaw/extensions`、`<workspace>/.openclaw/extensions` 以及 `plugins.load.paths` 加载。
- **配置变更需要重启网关。**
- `allow`：可选白名单（仅列出的插件会加载）。`deny` 优先。

参阅[插件（Plugins）](/tools/plugin)。

---

## 浏览器（Browser）

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "chrome",
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` 禁用 `act:evaluate` 和 `wait --fn`。
- 远程配置文件为仅附加模式（禁用启动/停止/重置）。
- 自动检测顺序：如果是基于 Chromium 的默认浏览器 → Chrome → Brave → Edge → Chromium → Chrome Canary。
- 控制服务：仅本地回环（端口来自 `gateway.port`，默认 `18791`）。

---

## 界面（UI）

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // 表情、短文本、图片 URL 或 data URI
    },
  },
}
```

- `seamColor`：原生应用 UI 的强调色（Talk Mode 气泡色调等）。
- `assistant`：控制 UI 身份覆盖。回退到活动代理身份。

---

## 网关（Gateway）

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // 或 OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // 用于 mode=trusted-proxy；参阅 /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    tools: {
      // 额外的 /tools/invoke HTTP 拒绝项
      deny: ["browser"],
      // 从默认 HTTP 拒绝列表中移除的工具
      allow: ["gateway"],
    },
  },
}
```

::: details 网关字段详情

- `mode`：`local`（运行网关）或 `remote`（连接到远程网关）。非 `local` 时网关拒绝启动。
- `port`：单一复用端口，用于 WS + HTTP。优先级：`--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`。
- `bind`：`auto`、`loopback`（默认）、`lan`（`0.0.0.0`）、`tailnet`（仅 Tailscale IP）或 `custom`。
- **认证**：默认必需。非本地回环绑定需要共享 Token/密码。引导向导默认生成 Token。
- `auth.mode: "trusted-proxy"`：将认证委托给身份感知的反向代理，并信任来自 `gateway.trustedProxies` 的身份头（参阅[受信代理认证（Trusted Proxy Auth）](/gateway/trusted-proxy-auth)）。
- `auth.allowTailscale`：为 `true` 时，Tailscale Serve 身份头满足认证（通过 `tailscale whois` 验证）。当 `tailscale.mode = "serve"` 时默认为 `true`。
- `auth.rateLimit`：可选的认证失败限流器。按客户端 IP 和认证范围应用（共享密钥和设备 Token 独立跟踪）。被阻止的尝试返回 `429` + `Retry-After`。
  - `auth.rateLimit.exemptLoopback` 默认为 `true`；设为 `false` 可对 localhost 流量也进行限流（适用于测试环境或严格的代理部署）。
- `tailscale.mode`：`serve`（仅 tailnet，本地回环绑定）或 `funnel`（公开，需要认证）。
- `remote.transport`：`ssh`（默认）或 `direct`（ws/wss）。使用 `direct` 时，`remote.url` 必须为 `ws://` 或 `wss://`。
- `gateway.remote.token` 仅用于远程 CLI 调用；不启用本地网关认证。
- `trustedProxies`：终止 TLS 的反向代理 IP。仅列出你控制的代理。
- `gateway.tools.deny`：HTTP `POST /tools/invoke` 额外阻止的工具名称（扩展默认拒绝列表）。
- `gateway.tools.allow`：从默认 HTTP 拒绝列表中移除的工具名称。

:::


### OpenAI 兼容端点

- Chat Completions：默认禁用。通过 `gateway.http.endpoints.chatCompletions.enabled: true` 启用。
- Responses API：`gateway.http.endpoints.responses.enabled`。
- Responses URL-input 强化：
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`

### 多实例隔离

在同一主机上以唯一端口和状态目录运行多个网关：

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

便捷标志：`--dev`（使用 `~/.openclaw-dev` + 端口 `19001`）、`--profile <name>`（使用 `~/.openclaw-<name>`）。

参阅[多网关（Multiple Gateways）](/gateway/multiple-gateways)。

---

## 钩子（Hooks）

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:&#123;&#123;messages[0].id&#125;&#125;",
        messageTemplate: "From: &#123;&#123;messages[0].from&#125;&#125;\nSubject: &#123;&#123;messages[0].subject&#125;&#125;\n&#123;&#123;messages[0].snippet&#125;&#125;",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.2-mini",
      },
    ],
  },
}
```

认证：`Authorization: Bearer <token>` 或 `x-openclaw-token: <token>`。

**端点：**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - 仅当 `hooks.allowRequestSessionKey=true`（默认：`false`）时才接受请求载荷中的 `sessionKey`。
- `POST /hooks/<name>` → 通过 `hooks.mappings` 解析

::: details 映射详情

- `match.path` 匹配 `/hooks` 之后的子路径（例如 `/hooks/gmail` → `gmail`）。
- `match.source` 匹配通用路径的载荷字段。
- 模板如 &#123;&#123;messages[0].subject&#125;&#125; 从载荷中读取。
- `transform` 可以指向一个返回钩子动作的 JS/TS 模块。
  - `transform.module` 必须是相对路径且保持在 `hooks.transformsDir` 内（绝对路径和路径遍历会被拒绝）。
- `agentId` 路由到特定代理；未知 ID 回退到默认值。
- `allowedAgentIds`：限制显式路由（`*` 或省略 = 允许全部，`[]` = 拒绝全部）。
- `defaultSessionKey`：无显式 `sessionKey` 的钩子代理运行的可选固定会话键。
- `allowRequestSessionKey`：允许 `/hooks/agent` 调用方设置 `sessionKey`（默认：`false`）。
- `allowedSessionKeyPrefixes`：显式 `sessionKey` 值（请求 + 映射）的可选前缀白名单，例如 `["hook:"]`。
- `deliver: true` 将最终回复发送到通道；`channel` 默认为 `last`。
- `model` 覆盖此钩子运行的 LLM（如果设置了模型目录，必须是允许的模型）。

:::


### Gmail 集成

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- 配置后网关启动时自动运行 `gog gmail watch serve`。设置 `OPENCLAW_SKIP_GMAIL_WATCHER=1` 禁用。
- 不要在网关旁边单独运行 `gog gmail watch serve`。

---

## 画布宿主（Canvas Host）

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // 或 OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- 通过网关端口以 HTTP 提供代理可编辑的 HTML/CSS/JS 和 A2UI：
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- 仅限本地：保持 `gateway.bind: "loopback"`（默认）。
- 非本地回环绑定：画布路由需要网关认证（Token/密码/受信代理），与其他网关 HTTP 接口相同。
- 节点 WebView 通常不发送认证头；节点配对并连接后，网关允许私有 IP 回退，使节点可以加载画布/A2UI 而不会将密钥泄露到 URL 中。
- 将实时重载客户端注入到提供的 HTML 中。
- 目录为空时自动创建起始 `index.html`。
- 同时在 `/__openclaw__/a2ui/` 提供 A2UI。
- 变更需要重启网关。
- 对于大型目录或 `EMFILE` 错误，请禁用实时重载。

---

## 发现（Discovery）

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal`（默认）：从 TXT 记录中省略 `cliPath` + `sshPort`。
- `full`：包含 `cliPath` + `sshPort`。
- 主机名默认为 `openclaw`。使用 `OPENCLAW_MDNS_HOSTNAME` 覆盖。

### 广域（DNS-SD）

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

在 `~/.openclaw/dns/` 下写入单播 DNS-SD 区域。对于跨网络发现，需配合 DNS 服务器（推荐 CoreDNS）+ Tailscale 分割 DNS。

设置：`openclaw dns setup --apply`。

---

## 环境（Environment）

### `env`（内联环境变量）

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- 内联环境变量仅在进程环境中缺少该键时才应用。
- `.env` 文件：CWD `.env` + `~/.openclaw/.env`（均不覆盖已有变量）。
- `shellEnv`：从登录 Shell 配置文件中导入缺失的预期键。
- 参阅[环境（Environment）](/help/environment)了解完整优先级。

### 环境变量替换

在任何配置字符串中使用 `${VAR_NAME}` 引用环境变量：

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- 仅匹配大写名称：`[A-Z_][A-Z0-9_]*`。
- 缺失/空变量在配置加载时抛出错误。
- 使用 `$${VAR}` 转义为字面量 `${VAR}`。
- 与 `$include` 配合使用。

---

## 认证存储

```json5
{
  auth: {
    profiles: {
      "anthropic:me@example.com": { provider: "anthropic", mode: "oauth", email: "me@example.com" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
    },
    order: {
      anthropic: ["anthropic:me@example.com", "anthropic:work"],
    },
  },
}
```

- 按代理的认证配置文件存储在 `<agentDir>/auth-profiles.json`。
- 旧版 OAuth 从 `~/.openclaw/credentials/oauth.json` 导入。
- 参阅 [OAuth](/concepts/oauth)。

---

## 日志（Logging）

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- 默认日志文件：`/tmp/openclaw/openclaw-YYYY-MM-DD.log`。
- 设置 `logging.file` 指定稳定路径。
- 使用 `--verbose` 时 `consoleLevel` 提升为 `debug`。

---

## 向导（Wizard）

由 CLI 向导（`onboard`、`configure`、`doctor`）写入的元数据：

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## 身份（Identity）

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
      },
    ],
  },
}
```

由 macOS 引导助手写入。派生默认值：

- `messages.ackReaction` 来自 `identity.emoji`（回退到 👀）
- `mentionPatterns` 来自 `identity.name`/`identity.emoji`
- `avatar` 接受：工作区相对路径、`http(s)` URL 或 `data:` URI

---

## Bridge（旧版，已移除）

当前版本不再包含 TCP Bridge。节点通过网关 WebSocket 连接。`bridge.*` 键不再属于配置模式（移除前验证会失败；`openclaw doctor --fix` 可以清除未知键）。

::: details 旧版 Bridge 配置（历史参考）

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

:::


---

## 定时任务（Cron）

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    sessionRetention: "24h", // 持续时间字符串或 false
  },
}
```

- `sessionRetention`：已完成的定时任务会话在修剪前保留多长时间。默认值：`24h`。

参阅[定时任务（Cron Jobs）](/automation/cron-jobs)。

---

## 媒体模型模板变量

在 `tools.media.*.models[].args` 中展开的模板占位符：

| 变量               | 描述                                              |
| ------------------ | ------------------------------------------------- |
| &#123;&#123;Body&#125;&#125;         | 完整的入站消息正文                                |
| &#123;&#123;RawBody&#125;&#125;      | 原始正文（无历史/发送者包装）                     |
| &#123;&#123;BodyStripped&#125;&#125; | 去除群组提及后的正文                              |
| &#123;&#123;From&#125;&#125;         | 发送者标识符                                      |
| &#123;&#123;To&#125;&#125;           | 目标标识符                                        |
| &#123;&#123;MessageSid&#125;&#125;   | 通道消息 ID                                       |
| &#123;&#123;SessionId&#125;&#125;    | 当前会话 UUID                                     |
| &#123;&#123;IsNewSession&#125;&#125; | 创建新会话时为 `"true"`                           |
| &#123;&#123;MediaUrl&#125;&#125;     | 入站媒体伪 URL                                    |
| &#123;&#123;MediaPath&#125;&#125;    | 本地媒体路径                                      |
| &#123;&#123;MediaType&#125;&#125;    | 媒体类型（image/audio/document/...）              |
| &#123;&#123;Transcript&#125;&#125;   | 音频转录文本                                      |
| &#123;&#123;Prompt&#125;&#125;       | CLI 条目的已解析媒体提示                          |
| &#123;&#123;MaxChars&#125;&#125;     | CLI 条目的已解析最大输出字符数                    |
| &#123;&#123;ChatType&#125;&#125;     | `"direct"` 或 `"group"`                           |
| &#123;&#123;GroupSubject&#125;&#125; | 群组主题（尽力获取）                              |
| &#123;&#123;GroupMembers&#125;&#125; | 群组成员预览（尽力获取）                          |
| &#123;&#123;SenderName&#125;&#125;   | 发送者显示名称（尽力获取）                        |
| &#123;&#123;SenderE164&#125;&#125;   | 发送者电话号码（尽力获取）                        |
| &#123;&#123;Provider&#125;&#125;     | 提供商提示（whatsapp、telegram、discord 等）      |

---

## 配置包含（`$include`）

将配置拆分为多个文件：

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**合并行为：**

- 单文件：替换包含的对象。
- 文件数组：按顺序深度合并（后面的覆盖前面的）。
- 同级键：在包含之后合并（覆盖包含的值）。
- 嵌套包含：最多 10 层深度。
- 路径：相对路径（相对于包含文件）、绝对路径或 `../` 父级引用。
- 错误：对缺失文件、解析错误和循环包含提供清晰的错误消息。

---

_相关：[配置](/gateway/configuration) · [配置示例](/gateway/configuration-examples) · [Doctor](/gateway/doctor)_
