---
title: "BlueBubbles"
sidebarTitle: "BlueBubbles"
---

# BlueBubbles（macOS REST）

状态：内置插件，通过 HTTP 与 BlueBubbles macOS 服务器通信。**推荐用于 iMessage 集成**，相比旧版 imsg 通道（Channel），它提供更丰富的 API 和更简单的设置。

---

## 概述

- 通过 BlueBubbles 辅助应用在 macOS 上运行（[bluebubbles.app](https://bluebubbles.app)）。
- 推荐/已测试版本：macOS Sequoia (15)。macOS Tahoe (26) 可用；但在 Tahoe 上编辑功能目前不可用，群组图标更新可能报告成功但实际未同步。
- OpenClaw 通过其 REST API 与之通信（`GET /api/v1/ping`、`POST /message/text`、`POST /chat/:id/*`）。
- 收到的消息通过 Webhook 传入；发送回复、输入指示器、已读回执和 Tapback 反应均为 REST 调用。
- 附件和贴纸作为入站媒体被接收（并在可能时呈现给智能体（Agent））。
- 配对/允许列表的工作方式与其他通道（Channel）相同（`/channels/pairing` 等），使用 `channels.bluebubbles.allowFrom` + 配对码。
- 反应（Reaction）以系统事件的形式呈现，与 Slack/Telegram 类似，智能体（Agent）可以在回复前"提及"它们。
- 高级功能：编辑、撤回、回复线程、消息特效、群组管理。

---

## 快速开始

1. 在 Mac 上安装 BlueBubbles 服务器（按照 [bluebubbles.app/install](https://bluebubbles.app/install) 上的说明操作）。
2. 在 BlueBubbles 配置中，启用 Web API 并设置密码。
3. 运行 `openclaw onboard` 并选择 BlueBubbles，或手动配置：

   ```json5
   {
     channels: {
       bluebubbles: {
         enabled: true,
         serverUrl: "http://192.168.1.100:1234",
         password: "example-password",
         webhookPath: "/bluebubbles-webhook",
       },
     },
   }
   ```

4. 将 BlueBubbles Webhook 指向你的网关（Gateway）（示例：`https://your-gateway-host:3000/bluebubbles-webhook?password=<password>`）。
5. 启动网关（Gateway）；它将注册 Webhook 处理程序并开始配对。

安全提示：

- 始终设置 Webhook 密码。如果你通过反向代理暴露网关（Gateway）（Tailscale Serve/Funnel、nginx、Cloudflare Tunnel、ngrok），代理可能通过回环地址连接到网关。BlueBubbles Webhook 处理程序会将带有转发头的请求视为代理请求，不会接受无密码的 Webhook。

---

## 保持 Messages.app 活跃（虚拟机/无头设置）

某些 macOS 虚拟机/常开设置可能导致 Messages.app 进入"空闲"状态（收到的事件停止，直到应用被打开/前台化）。一个简单的解决方法是**每 5 分钟唤醒一次 Messages**，使用 AppleScript + LaunchAgent。

### 1）保存 AppleScript

保存为：

- `~/Scripts/poke-messages.scpt`

示例脚本（非交互式；不会抢占焦点）：

```applescript
try
  tell application "Messages"
    if not running then
      launch
    end if

    -- Touch the scripting interface to keep the process responsive.
    set _chatCount to (count of chats)
  end tell
on error
  -- Ignore transient failures (first-run prompts, locked session, etc).
end try
```

### 2）安装 LaunchAgent

保存为：

- `~/Library/LaunchAgents/com.user.poke-messages.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.user.poke-messages</string>

    <key>ProgramArguments</key>
    <array>
      <string>/bin/bash</string>
      <string>-lc</string>
      <string>/usr/bin/osascript &quot;$HOME/Scripts/poke-messages.scpt&quot;</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StartInterval</key>
    <integer>300</integer>

    <key>StandardOutPath</key>
    <string>/tmp/poke-messages.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/poke-messages.err</string>
  </dict>
</plist>
```

说明：

- 此任务**每 300 秒**运行一次，且在**登录时**运行。
- 首次运行可能触发 macOS **自动化**权限提示（`osascript` → Messages）。请在运行 LaunchAgent 的同一用户会话（Session）中批准它们。

加载方法：

```bash
launchctl unload ~/Library/LaunchAgents/com.user.poke-messages.plist 2>/dev/null || true
launchctl load ~/Library/LaunchAgents/com.user.poke-messages.plist
```

---

## 引导设置

BlueBubbles 在交互式设置向导中可用：

```
openclaw onboard
```

向导会提示以下内容：

- **服务器 URL**（必填）：BlueBubbles 服务器地址（例如 `http://192.168.1.100:1234`）
- **密码**（必填）：来自 BlueBubbles Server 设置的 API 密码
- **Webhook 路径**（可选）：默认为 `/bluebubbles-webhook`
- **私聊策略**：配对、允许列表、开放或禁用
- **允许列表**：电话号码、邮箱或聊天目标

你也可以通过 CLI 添加 BlueBubbles：

```
openclaw channels add bluebubbles --http-url http://192.168.1.100:1234 --password <password>
```

---

## 访问控制（私聊 + 群组）

私聊：

- 默认：`channels.bluebubbles.dmPolicy = "pairing"`。
- 未知发送者会收到配对码；在批准之前消息将被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list bluebubbles`
  - `openclaw pairing approve bluebubbles <CODE>`
- 配对是默认的 Token 交换方式。详情：[配对](/channels/pairing)

群组：

- `channels.bluebubbles.groupPolicy = open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom` 控制当设置为 `allowlist` 时谁可以在群组中触发。

### 提及门控（群组）

BlueBubbles 支持群聊的提及门控，与 iMessage/WhatsApp 行为一致：

- 使用 `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）来检测提及。
- 当群组启用 `requireMention` 时，智能体（Agent）仅在被提及时才会回复。
- 来自已授权发送者的控制命令可绕过提及门控。

按群组配置：

```json5
{
  channels: {
    bluebubbles: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: {
        "*": { requireMention: true }, // 所有群组的默认设置
        "iMessage;-;chat123": { requireMention: false }, // 特定群组的覆盖
      },
    },
  },
}
```

### 命令门控

- 控制命令（例如 `/config`、`/model`）需要授权。
- 使用 `allowFrom` 和 `groupAllowFrom` 来确定命令授权。
- 已授权发送者可以在群组中不提及的情况下运行控制命令。

---

## 输入指示器 + 已读回执

- **输入指示器**：在回复生成之前和期间自动发送。
- **已读回执**：由 `channels.bluebubbles.sendReadReceipts` 控制（默认：`true`）。
- **输入指示器**：OpenClaw 发送输入开始事件；BlueBubbles 在发送或超时时自动清除输入状态（通过 DELETE 手动停止不可靠）。

```json5
{
  channels: {
    bluebubbles: {
      sendReadReceipts: false, // 禁用已读回执
    },
  },
}
```

---

## 高级操作

BlueBubbles 在配置中启用后支持高级消息操作：

```json5
{
  channels: {
    bluebubbles: {
      actions: {
        reactions: true, // Tapback 反应（默认：true）
        edit: true, // 编辑已发送消息（macOS 13+，macOS 26 Tahoe 上不可用）
        unsend: true, // 撤回消息（macOS 13+）
        reply: true, // 通过消息 GUID 进行回复线程
        sendWithEffect: true, // 消息特效（slam、loud 等）
        renameGroup: true, // 重命名群聊
        setGroupIcon: true, // 设置群聊图标/头像（macOS 26 Tahoe 上不稳定）
        addParticipant: true, // 向群组添加成员
        removeParticipant: true, // 从群组移除成员
        leaveGroup: true, // 离开群聊
        sendAttachment: true, // 发送附件/媒体
      },
    },
  },
}
```

可用操作：

- **react**：添加/移除 Tapback 反应（`messageId`、`emoji`、`remove`）
- **edit**：编辑已发送的消息（`messageId`、`text`）
- **unsend**：撤回消息（`messageId`）
- **reply**：回复特定消息（`messageId`、`text`、`to`）
- **sendWithEffect**：发送带 iMessage 特效的消息（`text`、`to`、`effectId`）
- **renameGroup**：重命名群聊（`chatGuid`、`displayName`）
- **setGroupIcon**：设置群聊图标/头像（`chatGuid`、`media`）— 在 macOS 26 Tahoe 上不稳定（API 可能返回成功，但图标未同步）。
- **addParticipant**：向群组添加成员（`chatGuid`、`address`）
- **removeParticipant**：从群组移除成员（`chatGuid`、`address`）
- **leaveGroup**：离开群聊（`chatGuid`）
- **sendAttachment**：发送媒体/文件（`to`、`buffer`、`filename`、`asVoice`）
  - 语音备忘录：设置 `asVoice: true` 并使用 **MP3** 或 **CAF** 音频来发送 iMessage 语音消息。BlueBubbles 在发送语音备忘录时会将 MP3 转换为 CAF。

### 消息 ID（短格式 vs 完整格式）

OpenClaw 可能会显示_短_消息 ID（例如 `1`、`2`）以节省 Token。

- `MessageSid` / `ReplyToId` 可以是短 ID。
- `MessageSidFull` / `ReplyToIdFull` 包含提供商（Provider）的完整 ID。
- 短 ID 存储在内存中；在重启或缓存淘汰时可能会过期。
- 操作接受短或完整 `messageId`，但短 ID 在不再可用时会报错。

对于持久化自动化和存储，请使用完整 ID：

- 模板：`\{\{MessageSidFull\}\}`、`\{\{ReplyToIdFull\}\}`
- 上下文：入站有效载荷中的 `MessageSidFull` / `ReplyToIdFull`

参见[配置](/gateway/configuration)了解模板变量。

---

## 分块流式传输

控制响应是作为单条消息发送还是分块流式传输：

```json5
{
  channels: {
    bluebubbles: {
      blockStreaming: true, // 启用分块流式传输（默认关闭）
    },
  },
}
```

---

## 媒体 + 限制

- 入站附件会被下载并存储在媒体缓存中。
- 媒体上限通过 `channels.bluebubbles.mediaMaxMb` 设置（默认：8 MB）。
- 出站文本会按 `channels.bluebubbles.textChunkLimit` 分块（默认：4000 字符）。

---

## 配置参考

完整配置：[配置](/gateway/configuration)

提供商（Provider）选项：

- `channels.bluebubbles.enabled`：启用/禁用通道（Channel）。
- `channels.bluebubbles.serverUrl`：BlueBubbles REST API 基础 URL。
- `channels.bluebubbles.password`：API 密码。
- `channels.bluebubbles.webhookPath`：Webhook 端点路径（默认：`/bluebubbles-webhook`）。
- `channels.bluebubbles.dmPolicy`：`pairing | allowlist | open | disabled`（默认：`pairing`）。
- `channels.bluebubbles.allowFrom`：私聊允许列表（句柄、邮箱、E.164 号码、`chat_id:*`、`chat_guid:*`）。
- `channels.bluebubbles.groupPolicy`：`open | allowlist | disabled`（默认：`allowlist`）。
- `channels.bluebubbles.groupAllowFrom`：群组发送者允许列表。
- `channels.bluebubbles.groups`：按群组配置（`requireMention` 等）。
- `channels.bluebubbles.sendReadReceipts`：发送已读回执（默认：`true`）。
- `channels.bluebubbles.blockStreaming`：启用分块流式传输（默认：`false`；流式回复需要启用）。
- `channels.bluebubbles.textChunkLimit`：出站分块大小（字符数，默认：4000）。
- `channels.bluebubbles.chunkMode`：`length`（默认）仅在超过 `textChunkLimit` 时拆分；`newline` 在空行（段落边界）处拆分，然后再按长度分块。
- `channels.bluebubbles.mediaMaxMb`：入站媒体上限（MB，默认：8）。
- `channels.bluebubbles.mediaLocalRoots`：允许出站本地媒体路径使用的绝对本地目录白名单。除非配置此项，否则默认拒绝本地路径发送。按账户覆盖：`channels.bluebubbles.accounts.<accountId>.mediaLocalRoots`。
- `channels.bluebubbles.historyLimit`：上下文中的最大群组消息数（0 表示禁用）。
- `channels.bluebubbles.dmHistoryLimit`：私聊历史限制。
- `channels.bluebubbles.actions`：启用/禁用特定操作。
- `channels.bluebubbles.accounts`：多账户配置。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（或 `messages.groupChat.mentionPatterns`）。
- `messages.responsePrefix`。

---

## 寻址/投递目标

优先使用 `chat_guid` 进行稳定路由：

- `chat_guid:iMessage;-;+15555550123`（群组推荐使用）
- `chat_id:123`
- `chat_identifier:...`
- 直接句柄：`+15555550123`、`user@example.com`
  - 如果直接句柄没有现有的私聊会话（Session），OpenClaw 将通过 `POST /api/v1/chat/new` 创建一个。这需要启用 BlueBubbles Private API。

---

## 安全

- Webhook 请求通过比较 `guid`/`password` 查询参数或请求头与 `channels.bluebubbles.password` 进行验证。来自 `localhost` 的请求也会被接受。
- 请保密 API 密码和 Webhook 端点（视为凭证处理）。
- Localhost 信任意味着同主机反向代理可能无意中绕过密码。如果你为网关（Gateway）设置代理，请在代理端要求认证并配置 `gateway.trustedProxies`。参见[网关安全](/gateway/security#reverse-proxy-configuration)。
- 如果将 BlueBubbles 服务器暴露到局域网外，请启用 HTTPS + 防火墙规则。

---

## 故障排查

- 如果输入/已读事件停止工作，请检查 BlueBubbles Webhook 日志并验证网关（Gateway）路径是否与 `channels.bluebubbles.webhookPath` 匹配。
- 配对码 1 小时后过期；使用 `openclaw pairing list bluebubbles` 和 `openclaw pairing approve bluebubbles <code>`。
- 反应（Reaction）需要 BlueBubbles Private API（`POST /api/v1/message/react`）；确保服务器版本暴露了该接口。
- 编辑/撤回需要 macOS 13+ 和兼容的 BlueBubbles 服务器版本。在 macOS 26（Tahoe）上，由于 Private API 变更，编辑功能目前不可用。
- 群组图标更新在 macOS 26（Tahoe）上可能不稳定：API 可能返回成功，但新图标未同步。
- OpenClaw 会根据 BlueBubbles 服务器的 macOS 版本自动隐藏已知不可用的操作。如果在 macOS 26（Tahoe）上编辑功能仍然显示，请手动通过 `channels.bluebubbles.actions.edit=false` 禁用它。
- 查看状态/健康信息：`openclaw status --all` 或 `openclaw status --deep`。

有关通道（Channel）工作流的一般参考，请参见[通道](/channels)和[插件](/tools/plugin)指南。
