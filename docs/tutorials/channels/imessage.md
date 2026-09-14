---
title: "iMessage"
sidebarTitle: "iMessage"
description: "OpenClaw 通道接入：iMessage 当前使用内置 imessage 插件和 imsg。BlueBubbles 已移除。"
---

# iMessage（imsg）

::: warning 注意
新的 iMessage 部署请使用本页的内置 `imessage` 插件 + `imsg` 路线。

BlueBubbles 支持已经移除；旧的 `channels.bluebubbles` 配置需要迁移到 `channels.imessage`。
:::

这是当前推荐的 iMessage 集成方式。网关会启动 `imsg rpc`，并通过 stdio 上的 JSON-RPC 通信，不需要额外的守护进程或端口。

- [从 BlueBubbles 迁移](/tutorials/channels/imessage-from-bluebubbles)：旧配置迁移到 `channels.imessage`
- [配对](/tutorials/channels/pairing)：iMessage 私信默认为配对模式
- [配置参考](/tutorials/gateway/configuration-reference)：查看 iMessage 字段说明

---

## 快速设置

### 本地 Mac

先安装并确认 `imsg` 可用：

```bash
brew install steipete/tap/imsg
imsg rpc --help
```

然后在 OpenClaw 配置中启用 iMessage：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "/usr/local/bin/imsg",
      dbPath: "/Users/<you>/Library/Messages/chat.db",
    },
  },
}
```

重启网关让配置生效：

```bash
openclaw gateway restart
```

首次私信会走默认配对策略，需要批准一次：

```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

配对请求 1 小时后过期。

### 通过 SSH 使用远程 Mac

OpenClaw 只需要一个 stdio 兼容的 `cliPath`。如果 Messages 跑在另一台 Mac 上，可以把 `cliPath` 指向一个 SSH 包装脚本：

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

如果还要拉取附件，再配置 `remoteHost`：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "user@gateway-host", // 用于 SCP 附件获取
      includeAttachments: true,
    },
  },
}
```

如果未设置 `remoteHost`，OpenClaw 会尝试从 SSH 包装脚本中自动识别。

---

## 要求和权限（macOS）

- 运行 `imsg` 的 Mac 上必须已登录 Messages。
- 运行 OpenClaw/`imsg` 的进程上下文需要完全磁盘访问权限（Messages 数据库访问）。
- 需要自动化权限才能通过 Messages.app 发送消息。

::: tip 提示
权限按进程上下文授予。如果网关以无头方式运行（LaunchAgent/SSH），请在同一上下文中运行一次交互式命令以触发权限提示：

```bash
imsg chats --limit 1
# 或
imsg send <handle> "test"
```
:::

---

## 访问控制和路由

### DM 策略

`channels.imessage.dmPolicy` 控制直接消息：

- `pairing`（默认）
- `allowlist`
- `open`（需要 `allowFrom` 包含 `"*"`）
- `disabled`

白名单字段是 `channels.imessage.allowFrom`。条目可以是 handle，也可以是聊天目标，例如 `chat_id:*`、`chat_guid:*`、`chat_identifier:*`。

### 群组策略和提及

`channels.imessage.groupPolicy` 控制群组处理：

- `allowlist`（配置后的默认值）
- `open`
- `disabled`

群组发送者白名单是 `channels.imessage.groupAllowFrom`。如果没有设置它，运行时会在可用时回退到 `allowFrom`。

iMessage 没有原生提及元数据，因此提及门控依赖正则模式：

- `agents.entries.*.groupChat.mentionPatterns`
- `messages.groupChat.mentionPatterns`（回退）

如果没有配置模式，就无法强制提及门控。来自授权发送者的控制命令可以在群组中绕过提及门控。

### 会话和回复路由

- 私信使用直接路由，群组使用群组路由。
- 使用默认 `session.dmScope=main` 时，iMessage 私信会折叠到智能体主会话。
- 群组会话单独隔离，格式为 `agent:<agentId>:imessage:group:<chat_id>`。
- 回复会根据来源通道和目标元数据发回 iMessage。

有些多参与者 iMessage 线程可能以 `is_group=false` 到达。只要该 `chat_id` 已明确写在 `channels.imessage.groups` 下，OpenClaw 就会把它当作群组流量处理。

---

## 部署模式

::: details 专用 macOS 用户（独立 iMessage 身份）

使用专用 Apple ID 和 macOS 用户，让 iMessage 通道流量与你的个人 Messages 配置隔离。

典型流程：

1. 创建或登录专用 macOS 用户。
2. 在该用户中使用专用 Apple ID 登录 Messages。
3. 在该用户中安装 `imsg`。
4. 创建 SSH 包装器，让 OpenClaw 能在该用户上下文中运行 `imsg`。
5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

首次运行可能需要在该用户会话中完成 GUI 批准，包括自动化和完全磁盘访问。

:::

::: details 通过 Tailscale 的远程 Mac（示例）

常见拓扑：

- 网关运行在 Linux/VM 上
- iMessage + `imsg` 运行在你 tailnet 中的 Mac 上
- `cliPath` 包装器使用 SSH 运行 `imsg`
- `remoteHost` 用于 SCP 附件获取

示例：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "~/.openclaw/scripts/imsg-ssh",
      remoteHost: "bot@mac-mini.tailnet-1234.ts.net",
      includeAttachments: true,
      dbPath: "/Users/bot/Library/Messages/chat.db",
    },
  },
}
```

```bash
#!/usr/bin/env bash
exec ssh -T bot@mac-mini.tailnet-1234.ts.net imsg "$@"
```

使用 SSH 密钥，让 SSH 和 SCP 都能非交互式运行。

:::

::: details 多账户模式

iMessage 支持在 `channels.imessage.accounts` 下按账户配置。每个账户可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb` 和历史设置等字段。

:::

---

## 媒体、分块和投递目标

::: details 附件和媒体

- 入站附件摄取是可选的：`channels.imessage.includeAttachments`
- 当设置了 `remoteHost` 时，可通过 SCP 获取远程附件路径
- 出站媒体大小使用 `channels.imessage.mediaMaxMb`（默认 16 MB）

:::

::: details 出站分块

- 文本分块限制：`channels.imessage.textChunkLimit`（默认 4000）
- 分块模式：`channels.imessage.chunkMode`
  - `length`（默认）
  - `newline`（段落优先分割）

:::

::: details 地址格式

优先使用显式目标：

- `chat_id:123`（适合稳定路由）
- `chat_guid:...`
- `chat_identifier:...`

也可以使用直接 handle：

- `+1555...`
- `tel:+1555...`
- `imessage:+1555...`
- `sms:+1555...`
- `user@example.com`

联系人名称或混合字母数字别名必须带服务前缀：

- `auto:<contact>`：让 Messages 选择 iMessage 或 SMS
- `imessage:<contact>`：必须走 iMessage
- `sms:<contact>`：必须走 SMS

裸联系人名称和混合别名现在会被拒绝，不再尝试当成电话号码。已有自动化如果用了这类目标，需要补上 `auto:`、`imessage:` 或 `sms:` 明确投递意图。

```bash
imsg chats --limit 20
```

:::

---

## 配置写入

iMessage 默认允许通道发起的配置写入（用于 `/config set|unset`，当 `commands.config: true` 时）。

禁用：

```json5
{
  channels: {
    imessage: {
      configWrites: false,
    },
  },
}
```

---

## 故障排查

::: details imsg 未找到或 RPC 不支持

验证二进制文件和 RPC 支持：

```bash
imsg rpc --help
openclaw channels status --probe
```

如果探测报告 RPC 不支持，请更新 `imsg`。

:::

::: details 私信被忽略

检查：

- `channels.imessage.dmPolicy`
- `channels.imessage.allowFrom`
- 配对批准（`openclaw pairing list imessage`）

:::

::: details 群组消息被忽略

检查：

- `channels.imessage.groupPolicy`
- `channels.imessage.groupAllowFrom`
- `channels.imessage.groups` 白名单行为
- 提及模式配置（`agents.entries.*.groupChat.mentionPatterns`）

:::

::: details 远程附件失败

检查：

- `channels.imessage.remoteHost`
- 从网关主机到运行 Messages 的 Mac 的 SSH/SCP 密钥认证
- 远程路径在运行 Messages 的 Mac 上的可读性

:::

::: details 错过了 macOS 权限提示

在同一用户/会话上下文的交互式 GUI 终端中重新运行并批准提示：

```bash
imsg chats --limit 1
imsg send <handle> "test"
```

确认运行 OpenClaw/`imsg` 的进程上下文已授予完全磁盘访问和自动化权限。

:::

---

## 配置参考指引

- [配置参考 - iMessage](/tutorials/gateway/configuration-reference)
- [网关配置](/tutorials/gateway/configuration)
- [配对](/tutorials/channels/pairing)
- [BlueBubbles](/tutorials/channels/bluebubbles)
