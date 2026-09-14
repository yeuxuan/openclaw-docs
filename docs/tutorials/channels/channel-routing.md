---
title: "通道路由"
sidebarTitle: "通道路由"
description: "OpenClaw 通道接入：通道与路由。OpenClaw 将回复路由回消息来源的通道。模型不会选择通道；路由是确定性的，由主机配置控制。"
---

# 通道与路由

OpenClaw 将回复路由回消息来源的通道。模型不会选择通道；路由是确定性的，由主机配置控制。

---

## 关键术语

- 通道（Channel）：`whatsapp`、`telegram`、`discord`、`slack`、`signal`、`imessage`、`webchat`。
- AccountId：每个通道的账户实例（支持时）。
- AgentId：隔离的工作区 + 会话存储（"大脑"）。
- SessionKey：用于存储上下文和控制并发的桶键。

---

## 会话键格式（示例）

私信会折叠到智能体（Agent）的主会话：

- `agent:<agentId>:<mainKey>`（默认：`agent:main:main`）

群组和频道按通道隔离：

- 群组：`agent:<agentId>:<channel>:group:<id>`
- 频道/房间：`agent:<agentId>:<channel>:channel:<id>`

线程：

- Slack/Discord 线程在基础键后追加 `:thread:<threadId>`。
- Telegram 论坛话题在群组键中嵌入 `:topic:<topicId>`。

示例：

- `agent:main:telegram:group:-1001234567890:topic:42`
- `agent:main:discord:channel:123456:thread:987654`

---

## 路由规则（如何选择智能体）

路由为每条入站消息选择一个智能体：

1. 精确对等匹配（`bindings` 中的 `peer.kind` + `peer.id`）。
2. 父级对等匹配（线程继承）。
3. 公会 + 角色匹配（Discord）通过 `guildId` + `roles`。
4. 公会匹配（Discord）通过 `guildId`。
5. 团队匹配（Slack）通过 `teamId`。
6. 账户匹配（通道上的 `accountId`）。
7. 通道匹配（该通道上的任意账户，`accountId: "*"`）。
8. 单 Agent 配置回退到唯一 owner；`agents.ownership: "explicit"` 的多 Agent fleet
   不设默认目标，未匹配消息必须补 `bindings` 或对应 surface 的 `agentId`。

当一个绑定包含多个匹配字段（`peer`、`guildId`、`teamId`、`roles`）时，所有提供的字段必须都匹配该绑定才会生效。

匹配的智能体决定使用哪个工作区和会话存储。

---

## 广播组（运行多个智能体）

广播组允许你在OpenClaw 正常回复时为同一个对等方运行多个智能体（例如：在 WhatsApp 群组中，经过提及/激活门控后）。

配置：

```json5
{
  broadcast: {
    strategy: "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"],
    "+15555550123": ["support", "logger"],
  },
}
```

参见：[广播组](/tutorials/channels/broadcast-groups)。

---

## 配置概览

- `agents.entries`：以 ID 为键的智能体定义（工作区、模型等）。
- `bindings`：将入站通道/账户/对等方映射到智能体。

示例：

```json5
{
  agents: {
    entries: {
      support: { name: "Support", workspace: "~/.openclaw/workspace-support" },
    },
  },
  bindings: [
    { match: { channel: "slack", teamId: "T123" }, agentId: "support" },
    { match: { channel: "telegram", peer: { kind: "group", id: "-100123" } }, agentId: "support" },
  ],
}
```

---

## 会话存储

运行时会话存储在状态目录下每个 Agent 的 SQLite 数据库中（默认
`~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`）。旧版
`sessions/sessions.json` 与 JSONL 只作为迁移或归档材料；Gateway 启动和
`openclaw doctor --fix` 会导入仍在使用的旧数据。离线迁移场景仍可通过
`session.store` 和 `{agentId}` 模板选择旧存储路径。

---

## WebChat 行为

WebChat 附加到选定的智能体，默认使用该智能体的主会话。因此，WebChat 允许你在一个界面中查看该智能体的跨通道上下文。

---

## 回复上下文

入站回复包含：

- `ReplyToId`、`ReplyToBody` 和 `ReplyToSender`（可用时）。
- 引用上下文以 `[Replying to ...]` 块的形式追加到 `Body` 中。

这在所有通道中是一致的。
