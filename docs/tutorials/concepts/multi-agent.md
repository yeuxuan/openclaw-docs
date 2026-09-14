---
title: 多智能体路由
sidebarTitle: "多智能体路由"
status: active
description: "OpenClaw 核心概念：多智能体路由。一个网关可以托管多个隔离智能体，并按通道、账户和对等体把入站消息路由到对应智能体。"
---

# 多智能体路由

多智能体路由用于在同一个网关中运行多个隔离智能体。每个智能体可以有独立的工作区、`agentDir` 和会话；入站消息通过 `bindings` 路由到对应智能体。

## 什么是"一个智能体"？

一个智能体（Agent）是一组独立的运行上下文，拥有自己的：

- 工作区（Workspace）（文件、AGENTS.md/SOUL.md/USER.md、本地笔记、人设规则）。
- 状态目录（`agentDir`），用于认证资料、模型注册表和每智能体配置。
- 会话与认证主存储，位于 `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`。

认证资料按智能体隔离。每个智能体从自己的 SQLite 状态库读取：

```text
~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite
```

不要在智能体之间重用 `agentDir`，否则会造成认证和会话冲突。OAuth 刷新材料默认也不应手工复制；需要独立账户时，应从目标 Agent 重新登录。只有可移植的静态 API key / token 配置才适合按官方支持方式共享。

技能通过每个工作区的 `skills/` 文件夹实现每智能体管理，共享技能从 `~/.openclaw/skills` 获取。参见[技能系统](/tutorials/tools/skills)。

网关默认托管一个智能体，也可以并行托管多个智能体。

工作区说明：每个智能体的工作区是默认 cwd，不是硬沙箱。相对路径在工作区内解析，但绝对路径仍可能访问宿主机其他位置，除非启用了沙箱。参见[沙箱](/tutorials/gateway/sandboxing)。

---

## 路径（快速映射）

- 配置：`~/.openclaw/openclaw.json`（或 `OPENCLAW_CONFIG_PATH`）
- 状态目录：`~/.openclaw`（或 `OPENCLAW_STATE_DIR`）
- 工作区：`~/.openclaw/workspace`（或 `~/.openclaw/workspace-<agentId>`）
- 智能体目录：`~/.openclaw/agents/<agentId>/agent`（或 `agents.entries.*.agentDir`）
- 会话与认证主存储：`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`
- 旧版/归档会话产物：`~/.openclaw/agents/<agentId>/sessions`

### 单智能体模式（默认）

如果不做任何操作，OpenClaw 运行单个智能体：

- `agentId` 默认为 `main`。
- 会话键为 `agent:main:<mainKey>`。
- 工作区默认为 `~/.openclaw/workspace`（或设置 `OPENCLAW_PROFILE` 时为 `~/.openclaw/workspace-<profile>`）。
- 状态默认为 `~/.openclaw/agents/main/agent`。

---

## 智能体助手

使用智能体向导添加新的隔离智能体：

```bash
openclaw agents add work
```

然后添加 `bindings`（或让向导完成）来路由入站消息。

验证：

```bash
openclaw agents list --bindings
```

---

## 多智能体和身份隔离

使用多个智能体时，每个 `agentId` 都有独立身份和状态：

- 不同的电话号码/账户（每通道 `accountId`）。
- 不同的人格（每智能体工作区文件如 `AGENTS.md` 和 `SOUL.md`）。
- 独立的认证 + 会话（除非显式启用，否则不会交叉通信）。

这样可以让多人共享一个网关服务器，同时保持各自的配置、会话和工作区隔离。

::: info 旧配置迁移
旧的 `agents.list` roster 会由 `openclaw doctor --fix` 迁移到 `agents.entries`。已有多 Agent 配置还会把过去依赖隐含默认 Agent 的通道与环境服务，物化成显式 binding 或目标，避免升级后靠顺序猜测路由。
:::

---

## 一个 WhatsApp 号码，多人使用（DM 分离）

你可以将不同的 WhatsApp DM 路由到不同的智能体，同时使用一个 WhatsApp 账户。通过发送者 E.164（如 `+15551234567`）配合 `peer.kind: "direct"` 匹配。回复仍然来自同一个 WhatsApp 号码，没有每智能体发送者身份。

重要细节：直接聊天合并到智能体的主会话键，因此真正的隔离需要每人一个智能体。

示例：

```json5
{
  agents: {
    ownership: "explicit",
    entries: {
      alex: { workspace: "~/.openclaw/workspace-alex" },
      mia: { workspace: "~/.openclaw/workspace-mia" },
    },
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

注意：

- DM 访问控制是每 WhatsApp 账户全局的（配对/白名单），不是每智能体的。
- 对于共享群组，将群组绑定到一个智能体或使用[广播群组](/tutorials/channels/broadcast-groups)。

---

## 路由规则（消息如何选择智能体）

绑定是确定性的，并且更具体的规则优先：

1. `peer` 匹配（精确 DM/群组/通道 ID）
2. `parentPeer` 匹配（线程继承）
3. `guildId + roles`（Discord 角色路由）
4. `guildId`（Discord）
5. `teamId`（Slack）
6. 通道的 `accountId` 匹配
7. 通道级别匹配（`accountId: "*"`）
8. 单 Agent 配置回退到唯一 owner；显式所有权 fleet 没有默认 Agent，未匹配消息必须补 binding 或 surface `agentId`

如果绑定设置了多个匹配字段（例如 `peer` + `guildId`），所有指定的字段都是必需的（`AND` 语义）。

---

## 多账户 / 多电话号码

支持多账户的通道（如 WhatsApp）使用 `accountId` 标识每个登录。每个 `accountId` 可以路由到不同的智能体，这样一台服务器可以托管多个电话号码而不混合会话。

---

## 概念

- `agentId`：一个"大脑"（工作区、每智能体认证、每智能体会话存储）。
- `accountId`：一个通道账户实例（如 WhatsApp 账户 `"personal"` vs `"biz"`）。
- `binding`：通过 `(channel, accountId, peer)` 以及可选的 guild/team ID 将入站消息路由到 `agentId`。
- 直接聊天合并到 `agent:<agentId>:<mainKey>`（每智能体"主键"；`session.mainKey`）。

---

## 示例：两个 WhatsApp → 两个智能体

`~/.openclaw/openclaw.json`（JSON5）：

```js
{
  agents: {
    ownership: "explicit",
    entries: {
      home: {
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      work: {
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    },
  },

  // 确定性路由：第一个匹配优先（最具体的在前）。
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // 可选的每对等体覆盖（示例：将特定群组发送到 work 智能体）。
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // 默认关闭：智能体间消息必须显式启用 + 加入白名单。
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // 可选覆盖。默认：~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // 可选覆盖。默认：~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

---

## 示例：WhatsApp 日常聊天 + Telegram 深度工作

按通道分离：将 WhatsApp 路由到快速的日常智能体，将 Telegram 路由到 Opus 智能体。

```json5
{
  agents: {
    ownership: "explicit",
    entries: {
      chat: {
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      opus: {
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    },
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

注意：

- 如果一个通道有多个账户，在绑定中添加 `accountId`（例如 `{ channel: "whatsapp", accountId: "personal" }`）。
- 要将单个 DM/群组路由到 Opus 而其余保持在 chat 上，为该对等体添加 `match.peer` 绑定；对等体匹配始终优先于通道级别规则。

---

## 示例：同一通道，一个对等体到 Opus

将 WhatsApp 保持在快速智能体上，但将一个 DM 路由到 Opus：

```json5
{
  agents: {
    ownership: "explicit",
    entries: {
      chat: {
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-5",
      },
      opus: {
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    },
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

对等体绑定始终优先，因此将它们放在通道级别规则之上。

---

## 绑定到 WhatsApp 群组的家庭智能体

将专用的家庭智能体绑定到单个 WhatsApp 群组，使用提及门控和更严格的工具策略：

```json5
{
  agents: {
    entries: {
      family: {
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    },
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

注意：

- 工具允许/拒绝列表是 工具，不是技能。如果技能需要运行二进制文件，确保 `exec` 被允许且二进制文件存在于沙箱中。
- 对于更严格的门控，设置 `agents.entries.*.groupChat.mentionPatterns` 并保持通道的群组白名单启用。

---

## 每智能体沙箱和工具配置

从 v2026.1.6 开始，每个智能体可以有自己的沙箱和工具限制：

```js
{
  agents: {
    ownership: "explicit",
    entries: {
      personal: {
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // 个人智能体无沙箱
        },
        // 无工具限制，所有工具可用
      },
      family: {
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // 始终沙箱化
          scope: "agent",  // 每智能体一个容器
          docker: {
            // 容器创建后的可选一次性设置
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // 仅 read 工具
          deny: ["exec", "write", "edit", "apply_patch"],    // 拒绝其他
        },
      },
    },
  },
}
```

注意：`setupCommand` 位于 `sandbox.docker` 下，在容器创建时运行一次。
当解析的 scope 为 `"shared"` 时，每智能体 `sandbox.docker.*` 覆盖被忽略。

优势：

- 安全隔离：限制不受信任智能体的工具
- 资源控制：沙箱化特定智能体同时保持其他智能体在宿主上
- 灵活策略：每智能体不同的权限

注意：`tools.elevated` 有全局门控，也有 `agents.entries.*.tools.elevated` 的每 Agent 门控；每 Agent 配置只能进一步收紧。需要每 Agent 边界时，使用 `agents.entries.*.tools` 拒绝 `exec`。对于群组定向，使用 `agents.entries.*.groupChat.mentionPatterns`，让 @提及映射到预期智能体。

参见[多智能体沙箱与工具](/tutorials/tools/multi-agent-sandbox-tools)了解详细示例。
