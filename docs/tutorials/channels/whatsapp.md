---
title: "WhatsApp"
sidebarTitle: "WhatsApp"
---

# WhatsApp（Web 通道）

状态：通过 WhatsApp Web（Baileys）实现，已可投入生产使用。网关管理链接会话。


  - [配对](/channels/pairing) — 未知发送者的默认私信策略为配对模式。

  - [通道故障排查](/channels/troubleshooting) — 跨通道诊断和修复手册。

  - [网关配置](/gateway/configuration) — 完整的通道配置模式和示例。

---

## 快速设置


  ### 步骤 1：配置 WhatsApp 访问策略


```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15551234567"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```


  ### 步骤 2：链接 WhatsApp（QR 码）


```bash
openclaw channels login --channel whatsapp
```

    指定账户：

```bash
openclaw channels login --channel whatsapp --account work
```


  ### 步骤 3：启动网关


```bash
openclaw gateway
```


  ### 步骤 4：批准首次配对请求（如果使用配对模式）


```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <CODE>
```

    配对请求在 1 小时后过期。每个通道的待处理请求上限为 3 个。


::: info 说明
OpenClaw 推荐尽可能在独立号码上运行 WhatsApp。（通道元数据和引导流程针对该设置优化，但个人号码设置也受支持。）
:::

---

## 部署模式


::: details 专用号码（推荐）

    这是最清晰的运营模式：

    - 为 OpenClaw 使用独立的 WhatsApp 身份
    - 更清晰的私信白名单和路由边界
    - 较低的自聊天混淆概率

    最小策略模式：

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
  },
}
```

  

:::


::: details 个人号码回退

    引导向导支持个人号码模式并写入自聊天友好的基线：

    - `dmPolicy: "allowlist"`
    - `allowFrom` 包含你的个人号码
    - `selfChatMode: true`

    运行时，自聊天保护基于链接的自身号码和 `allowFrom`。

  

:::


::: details 仅 WhatsApp Web 通道范围

    当前 OpenClaw 通道架构中的消息平台通道基于 WhatsApp Web（`Baileys`）。

    内置聊天通道注册表中没有单独的 Twilio WhatsApp 消息通道。

  

:::

---

## 运行时模型

- 网关拥有 WhatsApp 套接字和重连循环。
- 出站发送需要目标账户有活跃的 WhatsApp 监听器。
- 状态和广播聊天被忽略（`@status`、`@broadcast`）。
- 直接聊天使用私信会话规则（`session.dmScope`；默认 `main` 将私信折叠到智能体主会话）。
- 群组会话被隔离（`agent:<agentId>:whatsapp:group:<jid>`）。

---

## 访问控制和激活


  **私信策略：**

    `channels.whatsapp.dmPolicy` 控制直接聊天访问：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    `allowFrom` 接受 E.164 格式号码（内部标准化）。

    多账户覆盖：`channels.whatsapp.accounts.<id>.dmPolicy`（和 `allowFrom`）对该账户优先于通道级别默认值。

    运行时行为详情：

    - 配对持久化在通道允许存储中，并与配置的 `allowFrom` 合并
    - 如果未配置白名单，链接的自身号码默认被允许
    - 出站 `fromMe` 私信从不自动配对


  **群组策略 + 白名单：**

    群组访问有两个层级：

    1. **群组成员白名单**（`channels.whatsapp.groups`）
       - 如果 `groups` 省略，所有群组都有资格
       - 如果 `groups` 存在，作为群组白名单（允许 `"*"`）

    2. **群组发送者策略**（`channels.whatsapp.groupPolicy` + `groupAllowFrom`）
       - `open`：绕过发送者白名单
       - `allowlist`：发送者必须匹配 `groupAllowFrom`（或 `*`）
       - `disabled`：阻止所有群组入站

    发送者白名单回退：

    - 如果 `groupAllowFrom` 未设置，运行时在可用时回退到 `allowFrom`

    注意：如果根本没有 `channels.whatsapp` 块，运行时群组策略回退实际上是 `open`。


  **提及 + /activation：**

    群组回复默认需要提及。

    提及检测包括：

    - 机器人身份的显式 WhatsApp 提及
    - 配置的提及正则模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 隐式回复机器人检测（回复发送者匹配机器人身份）

    会话级激活命令：

    - `/activation mention`
    - `/activation always`

    `activation` 更新会话状态（非全局配置）。它受所有者门控。

---

## 个人号码和自聊天行为

当链接的自身号码也存在于 `allowFrom` 中时，WhatsApp 自聊天保护激活：

- 跳过自聊天轮次的已读回执
- 忽略否则会 ping 你自己的提及 JID 自动触发行为
- 如果 `messages.responsePrefix` 未设置，自聊天回复默认使用 `[{identity.name}]` 或 `[openclaw]`

---

## 消息标准化和上下文


::: details 入站信封 + 回复上下文

    传入的 WhatsApp 消息被包装在共享的入站信封中。

    如果存在引用回复，上下文以此格式附加：

```text
[Replying to <sender> id:<stanzaId>]
<quoted body or media placeholder>
[/Replying]
```

    回复元数据字段在可用时也被填充（`ReplyToId`、`ReplyToBody`、`ReplyToSender`、发送者 JID/E.164）。

  

:::


::: details 媒体占位符和位置/联系人提取

    纯媒体入站消息使用占位符标准化，如：

    - `<media:image>`
    - `<media:video>`
    - `<media:audio>`
    - `<media:document>`
    - `<media:sticker>`

    位置和联系人载荷在路由前被标准化为文本上下文。

  

:::


::: details 待处理群组历史注入

    对于群组，未处理的消息可以被缓冲并在机器人最终被触发时作为上下文注入。

    - 默认限制：`50`
    - 配置：`channels.whatsapp.historyLimit`
    - 回退：`messages.groupChat.historyLimit`
    - `0` 禁用

    注入标记：

    - `[Chat messages since your last reply - for context]`
    - `[Current message - respond to this]`

  

:::


::: details 已读回执

    已读回执默认对接受的入站 WhatsApp 消息启用。

    全局禁用：

```json5
{
  channels: {
    whatsapp: {
      sendReadReceipts: false,
    },
  },
}
```

    按账户覆盖：

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        work: {
          sendReadReceipts: false,
        },
      },
    },
  },
}
```

    即使全局启用，自聊天轮次也跳过已读回执。

  

:::

---

## 投递、分块和媒体


::: details 文本分块

    - 默认分块限制：`channels.whatsapp.textChunkLimit = 4000`
    - `channels.whatsapp.chunkMode = "length" | "newline"`
    - `newline` 模式优先使用段落边界（空行），然后回退到按长度安全分块
  

:::


::: details 出站媒体行为

    - 支持图片、视频、音频（PTT 语音笔记）和文档载荷
    - `audio/ogg` 被改写为 `audio/ogg; codecs=opus` 以兼容语音笔记
    - 通过 `gifPlayback: true` 在视频发送时支持动画 GIF 播放
    - 发送多媒体回复载荷时，标题应用于第一个媒体项
    - 媒体源可以是 HTTP(S)、`file://` 或本地路径
  

:::


::: details 媒体大小限制和回退行为

    - 入站媒体保存上限：`channels.whatsapp.mediaMaxMb`（默认 `50`）
    - 自动回复的出站媒体上限：`agents.defaults.mediaMaxMb`（默认 `5MB`）
    - 图片自动优化（调整大小/质量扫描）以适应限制
    - 媒体发送失败时，第一项回退发送文本警告而不是静默丢弃响应
  

:::

---

## 确认回应

WhatsApp 支持通过 `channels.whatsapp.ackReaction` 在入站接收时立即进行确认回应。

```json5
{
  channels: {
    whatsapp: {
      ackReaction: {
        emoji: "👀",
        direct: true,
        group: "mentions", // always | mentions | never
      },
    },
  },
}
```

行为说明：

- 在入站消息被接受后立即发送（回复前）
- 失败被记录但不阻止正常回复投递
- 群组模式 `mentions` 在提及触发的轮次上回应；群组激活 `always` 作为此检查的绕过
- WhatsApp 使用 `channels.whatsapp.ackReaction`（旧版 `messages.ackReaction` 在此处不使用）

---

## 多账户和凭据


::: details 账户选择和默认值

    - 账户 ID 来自 `channels.whatsapp.accounts`
    - 默认账户选择：如存在则为 `default`，否则为第一个配置的账户 ID（排序后）
    - 账户 ID 在内部查找时被标准化
  

:::


::: details 凭据路径和旧版兼容性

    - 当前认证路径：`~/.openclaw/credentials/whatsapp/<accountId>/creds.json`
    - 备份文件：`creds.json.bak`
    - `~/.openclaw/credentials/` 中的旧版默认认证在默认账户流程中仍被识别/迁移
  

:::


::: details 登出行为

    `openclaw channels logout --channel whatsapp [--account <id>]` 清除该账户的 WhatsApp 认证状态。

    在旧版认证目录中，`oauth.json` 被保留，而 Baileys 认证文件被移除。

  

:::

---

## 工具、操作和配置写入

- 智能体工具支持包括 WhatsApp 回应操作（`react`）。
- 操作门控：
  - `channels.whatsapp.actions.reactions`
  - `channels.whatsapp.actions.polls`
- 通道发起的配置写入默认启用（通过 `channels.whatsapp.configWrites=false` 禁用）。

---

## 故障排查


::: details 未链接（需要 QR 码）

    症状：通道状态报告未链接。

    修复：

```bash
openclaw channels login --channel whatsapp
openclaw channels status
```

  

:::


::: details 已链接但断开连接/重连循环

    症状：已链接账户反复断开连接或重连尝试。

    修复：

```bash
openclaw doctor
openclaw logs --follow
```

    如需要，使用 `channels login` 重新链接。

  

:::


::: details 发送时无活跃监听器

    当目标账户没有活跃的网关监听器时，出站发送会快速失败。

    确保网关正在运行且账户已链接。

  

:::


::: details 群组消息意外被忽略

    按此顺序检查：

    - `groupPolicy`
    - `groupAllowFrom` / `allowFrom`
    - `groups` 白名单条目
    - 提及门控（`requireMention` + 提及模式）

  

:::


::: details Bun 运行时警告

    WhatsApp 网关运行时应使用 Node。Bun 被标记为不兼容稳定的 WhatsApp/Telegram 网关操作。
  

:::

---

## 配置参考指引

主要参考：

- [配置参考 - WhatsApp](/gateway/configuration-reference#whatsapp)

高信号 WhatsApp 字段：

- 访问：`dmPolicy`、`allowFrom`、`groupPolicy`、`groupAllowFrom`、`groups`
- 投递：`textChunkLimit`、`chunkMode`、`mediaMaxMb`、`sendReadReceipts`、`ackReaction`
- 多账户：`accounts.<id>.enabled`、`accounts.<id>.authDir`、账户级覆盖
- 运维：`configWrites`、`debounceMs`、`web.enabled`、`web.heartbeatSeconds`、`web.reconnect.*`
- 会话行为：`session.dmScope`、`historyLimit`、`dmHistoryLimit`、`dms.<id>.historyLimit`

---

## 相关

- [配对](/channels/pairing)
- [通道路由](/channels/channel-routing)
- [故障排查](/channels/troubleshooting)
