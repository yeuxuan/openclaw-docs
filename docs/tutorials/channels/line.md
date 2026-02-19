---
title: LINE
sidebarTitle: "LINE"
---

# LINE（插件）

LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件作为网关上的 Webhook 接收器运行，使用你的通道访问 Token + 通道密钥进行认证。

状态：通过插件支持。支持直接消息、群聊、媒体、位置、Flex 消息、模板消息和快速回复。不支持表情回应和线程。

---

## 需要插件

安装 LINE 插件：

```bash
openclaw plugins install @openclaw/line
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/line
```

---

## 设置

1. 创建 LINE Developers 账户并打开控制台：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 创建（或选择）一个 Provider 并添加 **Messaging API** 通道。
3. 从通道设置中复制 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 设置中启用 **Use webhook**。
5. 将 Webhook URL 设置为你的网关端点（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

网关响应 LINE 的 Webhook 验证（GET）和入站事件（POST）。
如果你需要自定义路径，请设置 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath` 并相应更新 URL。

---

## 配置

最小配置：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

环境变量（仅默认账户）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/密钥文件：

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

多账户：

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

---

## 访问控制

直接消息默认为配对模式。未知发送者获得配对码，其消息在批准前会被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

白名单和策略：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：DM 允许的 LINE 用户 ID 白名单
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：群组允许的 LINE 用户 ID 白名单
- 按群组覆盖：`channels.line.groups.<groupId>.allowFrom`

LINE ID 区分大小写。有效 ID 格式如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 房间：`R` + 32 个十六进制字符

---

## 消息行为

- 文本在 5000 字符处分块。
- Markdown 格式被去除；代码块和表格尽可能转换为 Flex 卡片。
- 流式响应被缓冲；LINE 在智能体工作时收到完整分块并显示加载动画。
- 媒体下载受 `channels.line.mediaMaxMb` 限制（默认 10）。

---

## 通道数据（富消息）

使用 `channelData.line` 发送快速回复、位置、Flex 卡片或模板消息。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE 插件还提供了 `/card` 命令用于 Flex 消息预设：

```
/card info "Welcome" "Thanks for joining!"
```

---

## 故障排查

- **Webhook 验证失败：** 确保 Webhook URL 是 HTTPS 且 `channelSecret` 与 LINE 控制台匹配。
- **没有入站事件：** 确认 Webhook 路径与 `channels.line.webhookPath` 匹配且网关可从 LINE 访问。
- **媒体下载错误：** 如果媒体超过默认限制，请增大 `channels.line.mediaMaxMb`。
