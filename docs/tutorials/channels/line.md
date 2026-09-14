---
title: LINE
sidebarTitle: "LINE"
description: "OpenClaw 通道接入：LINE（插件）。LINE 通过 LINE Messaging API 连接到 OpenClaw。该插件作为网关上的 Webhook 接收器运行，使用你的通道访问 Tok…"
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
2. 创建（或选择）一个 Provider 并添加 Messaging API 通道。
3. 从通道设置中复制 Channel access token 和 Channel secret。
4. 在 Messaging API 设置中启用 Use webhook。
5. 将 Webhook URL 设置为你的网关端点（需要 HTTPS）：

```text
https://gateway-host/line/webhook
```

LINE 的 Webhook 验证是带签名、`events: []` 的 **POST**，不是 GET。普通入站事件也通过签名 POST 投递；Gateway 先持久化事件，再返回 `200`，之后异步处理。持久化失败返回 `500`，不会先确认再丢消息。

收到事件且已持久化时，响应包含 `x-openclaw-delivery-accepted: durable`；空事件验证请求不带这个标记。反向代理不能只凭普通 `200` 判断消息已经可靠接收。

在 LINE Developers Console 的 Messaging API 设置中同时开启 **Use webhook** 和 **Webhook redelivery**。未开启重投时，Gateway 返回 `500` 也不会让 LINE 自动重发；开启后仍只是尽力重投，可能重复或乱序。
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

`channels.line.groups."*"` 是每个群组/房间的逐字段默认值；命名条目只覆盖自己明确填写的字段。升级前检查通配条目中的 `enabled: false` 和 `allowFrom`：以前命名条目可能没继承它们，现在会继承，可能改变可访问范围。

引用机器人近期发出的消息也算提及，不必再手动 @。这个识别依赖当前账号记住的最近几百条已发消息；旧消息或 Gateway 重启前的消息仍可能需要显式提及，且 LINE 不读取 `implicitMentions` 开关。

LINE ID 区分大小写。有效 ID 格式如下：

- 用户：`U` + 32 个十六进制字符
- 群组：`C` + 32 个十六进制字符
- 房间：`R` + 32 个十六进制字符

---

## 消息行为

- 文本在 5000 字符处分块。
- Markdown 格式被去除；代码块和表格尽可能转换为 Flex 卡片。
- 流式响应被缓冲，最终按完整分块发送。加载动画只支持一对一私聊，群组和房间没有动画不代表处理失败。
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

```text
/card info "Welcome" "Thanks for joining!"
```

---

## 故障排查

### 事件排队、重试与死信 {#line-delivery-recovery}

同一群组、房间或私聊按收到顺序串行处理，重试中的事件会阻挡同一会话后续消息；不同会话共用最多 8 个并发投递槽。失败以 1 秒起的指数退避重试，第 8 次失败后进入死信。已提交副作用、损坏事件、LINE API `401/403` 等不可重试错误直接进入死信。

```bash
openclaw channels dead-letters list --channel line --account default
openclaw logs --follow
```

先检查失败原因，修好根因后，只对确认**没有已提交副作用**的事件执行：

```bash
openclaw channels dead-letters resubmit <event-id> --channel line --account default
```

不要重提 `delivery-side-effects-committed`：事件可能已启动 Agent 回合或消费回复 Token，重提会重复工作甚至再次回复。`resubmit` 不会替你判断是否安全。详见 [通道 CLI](/tutorials/cli/channels#入站死信)。

`handler-timeout` 表示事件被领取后 5 分钟仍未进入 Agent 回合，也没有报告延后处理进展；检查媒体下载、投递准备和 Gateway 是否接收新工作。这不是正在运行的长回合被强制中断，也不会立刻变成死信；持续超时耗尽重试才记为 `retry-limit-exceeded`。

进程崩溃后的未完成投递会恢复重试，因此整体是至少一次投递。去重记录按账号保留一定窗口（30 天、完成/失败各最近 4096 条，入站时清理），不能替代业务副作用自己的幂等校验。

### 连接检查

- Webhook 验证失败： 确保 Webhook URL 是 HTTPS 且 `channelSecret` 与 LINE 控制台匹配。
- 没有入站事件： 确认 Webhook 路径与 `channels.line.webhookPath` 匹配且网关可从 LINE 访问。
- 媒体下载错误： 如果媒体超过默认限制，请增大 `channels.line.mediaMaxMb`。
