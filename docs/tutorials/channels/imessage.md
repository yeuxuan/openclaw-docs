---
title: "iMessage"
sidebarTitle: "iMessage"
---

# iMessage（旧版：imsg）

::: warning 注意
对于新的 iMessage 部署，请使用 <a href="/channels/bluebubbles">BlueBubbles</a>。

`imsg` 集成是旧版，可能在未来版本中移除。
:::


状态：旧版外部 CLI 集成。网关启动 `imsg rpc` 并通过 stdio 上的 JSON-RPC 进行通信（没有单独的守护进程/端口）。


  - [BlueBubbles（推荐）](/channels/bluebubbles) — 新设置首选的 iMessage 方案。

  - [配对](/channels/pairing) — iMessage 私信默认为配对模式。

  - [配置参考](/gateway/configuration-reference#imessage) — 完整的 iMessage 字段参考。

---

## 快速设置


  **本地 Mac（快速路径）：**


      ### 步骤 1：安装并验证 imsg


```bash
brew install steipete/tap/imsg
imsg rpc --help
```


      ### 步骤 2：配置 OpenClaw


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


      ### 步骤 3：启动网关


```bash
openclaw gateway
```


      ### 步骤 4：批准首次私信配对（默认 dmPolicy）


```bash
openclaw pairing list imessage
openclaw pairing approve imessage <CODE>
```

        配对请求在 1 小时后过期。


  **通过 SSH 的远程 Mac：**

    OpenClaw 只需要一个 stdio 兼容的 `cliPath`，因此你可以将 `cliPath` 指向一个通过 SSH 连接到远程 Mac 并运行 `imsg` 的包装脚本。

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

    启用附件时的推荐配置：

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

    如果未设置 `remoteHost`，OpenClaw 会尝试通过解析 SSH 包装脚本自动检测。

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


  **DM 策略：**

    `channels.imessage.dmPolicy` 控制直接消息：

    - `pairing`（默认）
    - `allowlist`
    - `open`（需要 `allowFrom` 包含 `"*"`）
    - `disabled`

    白名单字段：`channels.imessage.allowFrom`。

    白名单条目可以是 handle 或聊天目标（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。


  **群组策略 + 提及：**

    `channels.imessage.groupPolicy` 控制群组处理：

    - `allowlist`（配置后的默认值）
    - `open`
    - `disabled`

    群组发送者白名单：`channels.imessage.groupAllowFrom`。

    运行时回退：如果未设置 `groupAllowFrom`，当可用时 iMessage 群组发送者检查会回退到 `allowFrom`。

    群组的提及门控：

    - iMessage 没有原生提及元数据
    - 提及检测使用正则模式（`agents.list[].groupChat.mentionPatterns`，回退 `messages.groupChat.mentionPatterns`）
    - 如果没有配置模式，则无法强制提及门控

    来自授权发送者的控制命令可以在群组中绕过提及门控。


  **会话和确定性回复：**

    - 私信使用直接路由；群组使用群组路由。
    - 使用默认 `session.dmScope=main` 时，iMessage 私信折叠到智能体主会话。
    - 群组会话是隔离的（`agent:<agentId>:imessage:group:<chat_id>`）。
    - 回复使用来源通道/目标元数据路由回 iMessage。

    类群组线程行为：

    某些多参与者 iMessage 线程可能以 `is_group=false` 到达。
    如果该 `chat_id` 明确配置在 `channels.imessage.groups` 下，OpenClaw 将其视为群组流量（群组门控 + 群组会话隔离）。

---

## 部署模式


::: details 专用机器人 macOS 用户（独立 iMessage 身份）

    使用专用 Apple ID 和 macOS 用户，使机器人流量与你的个人 Messages 配置文件隔离。

    典型流程：

    1. 创建/登录专用 macOS 用户。
    2. 在该用户中使用机器人 Apple ID 登录 Messages。
    3. 在该用户中安装 `imsg`。
    4. 创建 SSH 包装器，以便 OpenClaw 可以在该用户上下文中运行 `imsg`。
    5. 将 `channels.imessage.accounts.<id>.cliPath` 和 `.dbPath` 指向该用户配置文件。

    首次运行可能需要在该机器人用户会话中进行 GUI 批准（自动化 + 完全磁盘访问）。

  

:::


::: details 通过 Tailscale 的远程 Mac（示例）

    常见拓扑：

    - 网关运行在 Linux/VM 上
    - iMessage + `imsg` 运行在你 tailnet 中的 Mac 上
    - `cliPath` 包装器使用 SSH 运行 `imsg`
    - `remoteHost` 启用 SCP 附件获取

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

    使用 SSH 密钥以确保 SSH 和 SCP 都是非交互式的。

  

:::


::: details 多账户模式

    iMessage 支持在 `channels.imessage.accounts` 下进行按账户配置。

    每个账户可以覆盖 `cliPath`、`dbPath`、`allowFrom`、`groupPolicy`、`mediaMaxMb` 和历史设置等字段。

  

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

    首选显式目标：

    - `chat_id:123`（推荐用于稳定路由）
    - `chat_guid:...`
    - `chat_identifier:...`

    Handle 目标也受支持：

    - `imessage:+1555...`
    - `sms:+1555...`
    - `user@example.com`

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
    - 提及模式配置（`agents.list[].groupChat.mentionPatterns`）

  

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

    确认运行 OpenClaw/`imsg` 的进程上下文已授予完全磁盘访问 + 自动化权限。

  

:::

---

## 配置参考指引

- [配置参考 - iMessage](/gateway/configuration-reference#imessage)
- [网关配置](/gateway/configuration)
- [配对](/channels/pairing)
- [BlueBubbles](/channels/bluebubbles)
