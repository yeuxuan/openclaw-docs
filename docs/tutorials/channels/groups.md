---
title: "群组"
sidebarTitle: "群组"
---

# 群组

OpenClaw 在不同平台上统一处理群组聊天：WhatsApp、Telegram、Discord、Slack、Signal、iMessage、Microsoft Teams。

---

## 新手入门（2 分钟）

OpenClaw "运行"在你自己的消息账户上。没有单独的 WhatsApp 机器人用户。
如果 **你** 在一个群组中，OpenClaw 就能看到该群组并在其中响应。

默认行为：

- 群组是受限的（`groupPolicy: "allowlist"`）。
- 回复需要提及，除非你显式禁用提及门控。

翻译：白名单发送者可以通过提及 OpenClaw 来触发它。

> 摘要
>
> - **私信访问** 由 `*.allowFrom` 控制。
> - **群组访问** 由 `*.groupPolicy` + 白名单（`*.groups`、`*.groupAllowFrom`）控制。
> - **回复触发** 由提及门控（`requireMention`、`/activation`）控制。

快速流程（群组消息会发生什么）：

```
groupPolicy? disabled -> 丢弃
groupPolicy? allowlist -> 群组允许？ 否 -> 丢弃
requireMention? yes -> 被提及？ 否 -> 仅存储为上下文
否则 -> 回复
```

如果你想要...

| 目标                                        | 如何设置                                                       |
| ------------------------------------------- | -------------------------------------------------------------- |
| 允许所有群组但仅在 @提及时回复              | `groups: { "*": { requireMention: true } }`                    |
| 禁用所有群组回复                            | `groupPolicy: "disabled"`                                      |
| 仅特定群组                                  | `groups: { "<group-id>": { ... } }`（无 `"*"` 键）             |
| 仅你可以在群组中触发                        | `groupPolicy: "allowlist"`、`groupAllowFrom: ["+1555..."]`     |

---

## 会话键

- 群组会话使用 `agent:<agentId>:<channel>:group:<id>` 会话键（房间/频道使用 `agent:<agentId>:<channel>:channel:<id>`）。
- Telegram 论坛话题添加 `:topic:<threadId>` 到群组 ID，使每个话题有自己的会话。
- 直接聊天使用主会话（或如配置则按发送者）。
- 群组会话跳过心跳。

---

## 模式：个人私信 + 公开群组（单智能体）

是的 — 如果你的"个人"流量是 **私信**，"公开"流量是 **群组**，这工作得很好。

原因：在单智能体模式下，私信通常落在 **主** 会话键（`agent:main:main`）中，而群组始终使用 **非主** 会话键（`agent:main:<channel>:group:<id>`）。如果你使用 `mode: "non-main"` 启用沙箱，那些群组会话在 Docker 中运行，而你的主私信会话留在主机上。

这给你一个智能体"大脑"（共享工作空间 + 记忆），但两种执行姿态：

- **私信**：完整工具（主机）
- **群组**：沙箱 + 受限工具（Docker）

> 如果你需要真正分离的工作空间/角色（"个人"和"公开"绝不能混合），使用第二个智能体 + 绑定。参见 [多智能体路由](/concepts/multi-agent)。

示例（私信在主机上，群组沙箱化 + 仅消息工具）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // 群组/频道是非主的 -> 沙箱化
        scope: "session", // 最强隔离（每个群组/频道一个容器）
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // 如果 allow 非空，其他所有都被阻止（deny 仍然优先）。
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

想要"群组只能看到文件夹 X"而不是"无主机访问"？保持 `workspaceAccess: "none"` 并只挂载白名单路径到沙箱：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "~/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

相关：

- 配置键和默认值：[网关配置](/gateway/configuration#agentsdefaultssandbox)
- 调试工具为何被阻止：[沙箱 vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated)
- 绑定挂载详情：[沙箱](/gateway/sandboxing#custom-bind-mounts)

---

## 显示标签

- UI 标签在可用时使用 `displayName`，格式为 `<channel>:<token>`。
- `#room` 保留用于房间/频道；群组聊天使用 `g-<slug>`（小写，空格 -> `-`，保留 `#@+._-`）。

---

## 群组策略

控制每个通道如何处理群组/房间消息：

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // 数字 Telegram 用户 ID（向导可解析 @username）
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| 策略          | 行为                                                     |
| ------------- | -------------------------------------------------------- |
| `"open"`      | 群组绕过白名单；提及门控仍然适用。                       |
| `"disabled"`  | 完全阻止所有群组消息。                                   |
| `"allowlist"` | 仅允许匹配配置白名单的群组/房间。                         |

说明：

- `groupPolicy` 与提及门控（需要 @提及）分开。
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams：使用 `groupAllowFrom`（回退：显式 `allowFrom`）。
- Discord：白名单使用 `channels.discord.guilds.<id>.channels`。
- Slack：白名单使用 `channels.slack.channels`。
- Matrix：白名单使用 `channels.matrix.groups`（房间 ID、别名或名称）。使用 `channels.matrix.groupAllowFrom` 限制发送者；也支持按房间 `users` 白名单。
- 群组私信分开控制（`channels.discord.dm.*`、`channels.slack.dm.*`）。
- Telegram 白名单可以匹配用户 ID（`"123456789"`、`"telegram:123456789"`、`"tg:123456789"`）或用户名（`"@alice"` 或 `"alice"`）；前缀不区分大小写。
- 默认是 `groupPolicy: "allowlist"`；如果你的群组白名单为空，群组消息会被阻止。

快速思维模型（群组消息的评估顺序）：

1. `groupPolicy`（open/disabled/allowlist）
2. 群组白名单（`*.groups`、`*.groupAllowFrom`、通道特定白名单）
3. 提及门控（`requireMention`、`/activation`）

---

## 提及门控（默认）

群组消息需要提及，除非按群组覆盖。默认值在每个子系统的 `*.groups."*"` 下。

回复机器人消息视为隐式提及（当通道支持回复元数据时）。这适用于 Telegram、WhatsApp、Slack、Discord 和 Microsoft Teams。

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

说明：

- `mentionPatterns` 是不区分大小写的正则表达式。
- 提供显式提及的平台仍然通过；模式是回退。
- 按智能体覆盖：`agents.list[].groupChat.mentionPatterns`（多个智能体共享群组时有用）。
- 提及门控仅在提及检测可用时（原生提及或已配置 `mentionPatterns`）强制执行。
- Discord 默认值在 `channels.discord.guilds."*"` 中（可按公会/频道覆盖）。
- 群组历史上下文在通道间统一包装，是 **仅待处理** 的（由于提及门控跳过的消息）；使用 `messages.groupChat.historyLimit` 作为全局默认值，`channels.<channel>.historyLimit`（或 `channels.<channel>.accounts.*.historyLimit`）进行覆盖。设置 `0` 禁用。

---

## 群组/频道工具限制（可选）

某些通道配置支持限制 **特定群组/房间/频道内** 可用的工具。

- `tools`：为整个群组允许/拒绝工具。
- `toolsBySender`：群组内按发送者覆盖（键为发送者 ID/用户名/邮箱/电话号码，取决于通道）。使用 `"*"` 作为通配符。

解析顺序（最具体的优先）：

1. 群组/频道 `toolsBySender` 匹配
2. 群组/频道 `tools`
3. 默认（`"*"`）`toolsBySender` 匹配
4. 默认（`"*"`）`tools`

示例（Telegram）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

说明：

- 群组/频道工具限制在全局/智能体工具策略之上应用（deny 仍然优先）。
- 某些通道对房间/频道使用不同的嵌套（如 Discord `guilds.*.channels.*`、Slack `channels.*`、MS Teams `teams.*.channels.*`）。

---

## 群组白名单

当配置了 `channels.whatsapp.groups`、`channels.telegram.groups` 或 `channels.imessage.groups` 时，键作为群组白名单。使用 `"*"` 允许所有群组同时设置默认提及行为。

常见意图（复制/粘贴）：

1. 禁用所有群组回复

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. 仅允许特定群组（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. 允许所有群组但需要提及（显式）

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. 仅所有者可以在群组中触发（WhatsApp）

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

---

## 激活（仅所有者）

群组所有者可以切换按群组激活：

- `/activation mention`
- `/activation always`

所有者由 `channels.whatsapp.allowFrom` 决定（或未设置时由机器人自身 E.164 决定）。以独立消息发送命令。其他平台目前忽略 `/activation`。

---

## 上下文字段

群组入站载荷设置：

- `ChatType=group`
- `GroupSubject`（如已知）
- `GroupMembers`（如已知）
- `WasMentioned`（提及门控结果）
- Telegram 论坛话题还包含 `MessageThreadId` 和 `IsForum`。

智能体系统提示在新群组会话的第一轮包含群组介绍。它提醒模型像人类一样响应，避免 Markdown 表格，避免输入字面 `\n` 序列。

---

## iMessage 特定说明

- 路由或白名单时优先使用 `chat_id:<id>`。
- 列出聊天：`imsg chats --limit 20`。
- 群组回复始终返回到相同的 `chat_id`。

---

## WhatsApp 特定说明

参见 [群组消息](/channels/group-messages) 了解 WhatsApp 专有行为（历史注入、提及处理细节）。
