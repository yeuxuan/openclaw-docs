---
title: "会话管理"
sidebarTitle: "会话管理"
---

# 会话管理（Session Management）

OpenClaw 将 **每个智能体一个直接聊天会话** 作为主会话。直接聊天合并到 `agent:<agentId>:<mainKey>`（默认 `main`），而群组/通道聊天获得自己的键。`session.mainKey` 会被尊重。

使用 `session.dmScope` 控制 **直接消息** 如何分组：

- `main`（默认）：所有 DM 共享主会话以保持连续性。
- `per-peer`：按发送者 ID 跨通道隔离。
- `per-channel-peer`：按通道 + 发送者隔离（推荐用于多用户收件箱）。
- `per-account-channel-peer`：按账户 + 通道 + 发送者隔离（推荐用于多账户收件箱）。
  使用 `session.identityLinks` 将提供商前缀的对等 ID 映射到规范身份，以便在使用 `per-peer`、`per-channel-peer` 或 `per-account-channel-peer` 时，同一人跨通道共享 DM 会话。

---

## 安全 DM 模式（推荐用于多用户设置）

> **安全警告：** 如果你的智能体可以接收来自 **多人** 的 DM，你应该认真考虑启用安全 DM 模式。如果不启用，所有用户共享相同的对话上下文，这可能导致用户之间的私人信息泄露。

**使用默认设置时的问题示例：**

- Alice（`<SENDER_A>`）向你的智能体发消息谈论一个私人话题（例如医疗预约）
- Bob（`<SENDER_B>`）向你的智能体发消息问"我们在聊什么？"
- 因为两个 DM 共享同一会话，模型可能使用 Alice 之前的上下文回答 Bob

**修复方法：** 设置 `dmScope` 以按用户隔离会话：

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    // 安全 DM 模式：按通道 + 发送者隔离 DM 上下文。
    dmScope: "per-channel-peer",
  },
}
```

**何时启用：**

- 你有多个发送者的配对审批
- 你使用包含多个条目的 DM 白名单
- 你设置了 `dmPolicy: "open"`
- 多个电话号码或账户可以向你的智能体发消息

注意：

- 默认值是 `dmScope: "main"` 以保持连续性（所有 DM 共享主会话）。这对单用户设置没问题。
- 对于同一通道上的多账户收件箱，推荐 `per-account-channel-peer`。
- 如果同一人通过多个通道联系你，使用 `session.identityLinks` 将他们的 DM 会话合并到一个规范身份。
- 你可以使用 `openclaw security audit` 验证你的 DM 设置（参见[安全](/cli/security)）。

---

## 网关是事实来源

所有会话状态由 **网关拥有**（"主控" OpenClaw）。UI 客户端（macOS 应用、WebChat 等）必须查询网关获取会话列表和 Token 计数，而不是读取本地文件。

- 在 **远程模式** 中，你关心的会话存储位于远程网关主机上，而非你的 Mac。
- UI 中显示的 Token 计数来自网关存储字段（`inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`）。客户端不会解析 JSONL 记录来"修正"总数。

---

## 状态存储位置

- 在 **网关主机** 上：
  - 存储文件：`~/.openclaw/agents/<agentId>/sessions/sessions.json`（每智能体）。
- 记录：`~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`（Telegram 主题会话使用 `.../<SessionId>-topic-<threadId>.jsonl`）。
- 存储是一个 `sessionKey -> { sessionId, updatedAt, ... }` 的映射。删除条目是安全的；它们会按需重建。
- 群组条目可能包含 `displayName`、`channel`、`subject`、`room` 和 `space` 以在 UI 中标记会话。
- 会话条目包含 `origin` 元数据（标签 + 路由提示），以便 UI 可以解释会话的来源。
- OpenClaw **不会** 读取旧版 Pi/Tau 会话文件夹。

---

## 会话修剪

OpenClaw 默认在 LLM 调用之前从内存上下文中修剪 **旧的工具结果**。这 **不会** 重写 JSONL 历史。参见 [/concepts/session-pruning](/concepts/session-pruning)。

---

## 压缩前记忆刷新

当会话接近自动压缩时，OpenClaw 可以运行一次 **静默记忆刷新** 轮次，提醒模型将持久笔记写入磁盘。仅在工作区可写时运行。参见[记忆](/concepts/memory)和[压缩](/concepts/compaction)。

---

## 传输映射 → 会话键

- 直接聊天遵循 `session.dmScope`（默认 `main`）。
  - `main`：`agent:<agentId>:<mainKey>`（跨设备/通道的连续性）。
    - 多个电话号码和通道可以映射到同一智能体主键；它们作为一个对话的传输通道。
  - `per-peer`：`agent:<agentId>:dm:<peerId>`。
  - `per-channel-peer`：`agent:<agentId>:<channel>:dm:<peerId>`。
  - `per-account-channel-peer`：`agent:<agentId>:<channel>:<accountId>:dm:<peerId>`（accountId 默认为 `default`）。
  - 如果 `session.identityLinks` 匹配了提供商前缀的对等 ID（例如 `telegram:123`），规范键替换 `<peerId>`，以便同一人跨通道共享会话。
- 群聊隔离状态：`agent:<agentId>:<channel>:group:<id>`（房间/通道使用 `agent:<agentId>:<channel>:channel:<id>`）。
  - Telegram 论坛主题在群组 ID 后附加 `:topic:<threadId>` 以实现隔离。
  - 旧版 `group:<id>` 键仍然被识别用于迁移。
- 入站上下文仍可能使用 `group:<id>`；通道从 `Provider` 推断并规范化为标准 `agent:<agentId>:<channel>:group:<id>` 形式。
- 其他来源：
  - Cron 作业：`cron:<job.id>`
  - Webhook：`hook:<uuid>`（除非由钩子显式设置）
  - 节点运行：`node-<nodeId>`

---

## 生命周期

- 重置策略：会话被重用直到过期，过期在下一条入站消息时评估。
- 每日重置：默认为 **网关主机本地时间凌晨 4:00**。当会话的最后更新早于最近的每日重置时间时，会话就是过期的。
- 空闲重置（可选）：`idleMinutes` 添加滑动空闲窗口。当同时配置了每日和空闲重置时，**先到期的那个** 强制创建新会话。
- 旧版仅空闲：如果你设置了 `session.idleMinutes` 而没有任何 `session.reset`/`resetByType` 配置，OpenClaw 保持仅空闲模式以向后兼容。
- 每类型覆盖（可选）：`resetByType` 让你为 `direct`、`group` 和 `thread` 会话覆盖策略（thread = Slack/Discord 线程、Telegram 主题、连接器提供的 Matrix 线程）。
- 每通道覆盖（可选）：`resetByChannel` 为通道覆盖重置策略（适用于该通道的所有会话类型，优先于 `reset`/`resetByType`）。
- 重置触发器：精确 `/new` 或 `/reset`（加上 `resetTriggers` 中的任何额外项）开始新会话 ID 并将消息剩余部分传递。`/new <model>` 接受模型别名、`provider/model` 或提供商名称（模糊匹配）来设置新会话模型。如果单独发送 `/new` 或 `/reset`，OpenClaw 运行一个简短的"hello"问候轮次确认重置。
- 手动重置：从存储中删除特定键或删除 JSONL 记录；下一条消息重建它们。
- 隔离的 cron 作业始终为每次运行创建新的 `sessionId`（不重用空闲会话）。

---

## 发送策略（可选）

按通道/聊天类型阻止投递，无需列出单个 ID。

```json5
{
  session: {
    sendPolicy: {
      rules: [
        { action: "deny", match: { channel: "discord", chatType: "group" } },
        { action: "deny", match: { keyPrefix: "cron:" } },
        // 匹配原始会话键（包含 `agent:<id>:` 前缀）。
        { action: "deny", match: { rawKeyPrefix: "agent:main:discord:" } },
      ],
      default: "allow",
    },
  },
}
```

运行时覆盖（仅所有者）：

- `/send on` → 允许此会话
- `/send off` → 拒绝此会话
- `/send inherit` → 清除覆盖并使用配置规则
  将这些作为独立消息发送以便注册。

---

## 配置（可选重命名示例）

```json5
// ~/.openclaw/openclaw.json
{
  session: {
    scope: "per-sender", // 保持群组键独立
    dmScope: "main", // DM 连续性（对共享收件箱设置 per-channel-peer/per-account-channel-peer）
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      // 默认值：mode=daily，atHour=4（网关主机本地时间）。
      // 如果你也设置了 idleMinutes，先到期的那个优先。
      mode: "daily",
      atHour: 4,
      idleMinutes: 120,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    mainKey: "main",
  },
}
```

---

## 检查

- `openclaw status` — 显示存储路径和最近的会话。
- `openclaw sessions --json` — 转储每个条目（用 `--active <minutes>` 过滤）。
- `openclaw gateway call sessions.list --params '{}'` — 从运行中的网关获取会话（使用 `--url`/`--token` 访问远程网关）。
- 在聊天中发送 `/status` 作为独立消息，查看智能体是否可达、使用了多少会话上下文、当前 thinking/verbose 开关，以及 WhatsApp web 凭证上次刷新时间（帮助发现重新链接需求）。
- 发送 `/context list` 或 `/context detail` 查看系统提示词和注入的工作区文件中有什么（以及最大的上下文贡献者）。
- 发送 `/stop` 作为独立消息来中止当前运行，清除该会话的排队后续，并停止从它派生的任何子智能体运行（回复包含已停止的计数）。
- 发送 `/compact`（可选说明）作为独立消息来摘要化较旧的上下文并释放窗口空间。参见 [/concepts/compaction](/concepts/compaction)。
- JSONL 记录可以直接打开以查看完整轮次。

---

## 提示

- 保持主键专用于 1:1 流量；让群组保持自己的键。
- 自动化清理时，删除单个键而非整个存储，以保留其他地方的上下文。

---

## 会话来源元数据

每个会话条目记录其来源（尽力）在 `origin` 中：

- `label`：人类标签（从对话标签 + 群组主题/通道解析）
- `provider`：规范化的通道 ID（包括扩展）
- `from`/`to`：入站信封中的原始路由 ID
- `accountId`：提供商账户 ID（多账户时）
- `threadId`：通道支持时的线程/主题 ID
  origin 字段为直接消息、通道和群组填充。如果连接器仅更新投递路由（例如保持 DM 主会话新鲜），它仍应提供入站上下文以便会话保持其解释元数据。扩展可以通过在入站上下文中发送 `ConversationLabel`、`GroupSubject`、`GroupChannel`、`GroupSpace` 和 `SenderName` 并调用 `recordSessionMetaFromInbound`（或将相同的上下文传递给 `updateLastRoute`）来实现。
