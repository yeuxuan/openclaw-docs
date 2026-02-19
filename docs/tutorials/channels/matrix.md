---
title: "Matrix"
sidebarTitle: "Matrix"
---

# Matrix（插件）

Matrix 是一个开放的去中心化消息协议。OpenClaw 以 Matrix **用户**身份连接到任意 homeserver，因此你需要一个 Matrix 账户作为机器人。登录后，你可以直接私聊机器人或将其邀请到房间（Matrix 中的"群组"）。Beeper 也是一个有效的客户端选择，但需要启用 E2EE。

状态：通过插件（@vector-im/matrix-bot-sdk）支持。私聊、房间、线程、媒体、反应（Reaction）、投票（发送 + poll-start 转为文本）、位置和 E2EE（需要加密支持）。

---

## 需要安装插件

Matrix 作为插件发布，不包含在核心安装中。

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/matrix
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/matrix
```

如果你在配置/引导设置过程中选择 Matrix，且检测到 git 检出，OpenClaw 将自动提供本地安装路径。

详情：[插件](/tools/plugin)

---

## 设置

1. 安装 Matrix 插件：
   - 从 npm：`openclaw plugins install @openclaw/matrix`
   - 从本地检出：`openclaw plugins install ./extensions/matrix`
2. 在 homeserver 上创建 Matrix 账户：
   - 在 [https://matrix.org/ecosystem/hosting/](https://matrix.org/ecosystem/hosting/) 浏览托管选项
   - 或自行托管。
3. 获取机器人账户的访问 Token：
   - 在你的 homeserver 上使用 `curl` 调用 Matrix 登录 API：

   ```bash
   curl --request POST \
     --url https://matrix.example.org/_matrix/client/v3/login \
     --header 'Content-Type: application/json' \
     --data '{
     "type": "m.login.password",
     "identifier": {
       "type": "m.id.user",
       "user": "your-user-name"
     },
     "password": "your-password"
   }'
   ```

   - 将 `matrix.example.org` 替换为你的 homeserver URL。
   - 或者设置 `channels.matrix.userId` + `channels.matrix.password`：OpenClaw 会调用相同的登录端点，将访问 Token 存储在 `~/.openclaw/credentials/matrix/credentials.json` 中，并在下次启动时复用。

4. 配置凭证：
   - 环境变量：`MATRIX_HOMESERVER`、`MATRIX_ACCESS_TOKEN`（或 `MATRIX_USER_ID` + `MATRIX_PASSWORD`）
   - 或配置：`channels.matrix.*`
   - 如果两者都设置了，配置优先。
   - 使用访问 Token 时：用户 ID 通过 `/whoami` 自动获取。
   - 设置时，`channels.matrix.userId` 应为完整的 Matrix ID（示例：`@bot:example.org`）。
5. 重启网关（Gateway）（或完成引导设置）。
6. 从任何 Matrix 客户端与机器人开始私聊或将其邀请到房间（Element、Beeper 等；参见 [https://matrix.org/ecosystem/clients/](https://matrix.org/ecosystem/clients/)）。Beeper 需要 E2EE，因此请设置 `channels.matrix.encryption: true` 并验证设备。

最小配置（访问 Token，用户 ID 自动获取）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      dm: { policy: "pairing" },
    },
  },
}
```

E2EE 配置（启用端到端加密）：

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_***",
      encryption: true,
      dm: { policy: "pairing" },
    },
  },
}
```

---

## 加密（E2EE）

通过 Rust crypto SDK **支持**端到端加密。

使用 `channels.matrix.encryption: true` 启用：

- 如果加密模块加载成功，加密房间会自动解密。
- 发送到加密房间时，出站媒体会被加密。
- 首次连接时，OpenClaw 会从你的其他会话（Session）请求设备验证。
- 在另一个 Matrix 客户端（Element 等）中验证设备以启用密钥共享。
- 如果加密模块无法加载，E2EE 将被禁用，加密房间将无法解密；OpenClaw 会记录警告。
- 如果你看到缺少加密模块的错误（例如 `@matrix-org/matrix-sdk-crypto-nodejs-*`），请允许 `@matrix-org/matrix-sdk-crypto-nodejs` 的构建脚本并运行 `pnpm rebuild @matrix-org/matrix-sdk-crypto-nodejs`，或通过 `node node_modules/@matrix-org/matrix-sdk-crypto-nodejs/download-lib.js` 获取二进制文件。

加密状态按账户 + 访问 Token 存储在
`~/.openclaw/matrix/accounts/<account>/<homeserver>__<user>/<token-hash>/crypto/`
（SQLite 数据库）。同步状态存储在旁边的 `bot-storage.json` 中。
如果访问 Token（设备）发生变化，将创建新的存储，机器人必须在加密房间中重新验证。

**设备验证：**
启用 E2EE 后，机器人将在启动时从你的其他会话（Session）请求验证。打开 Element（或其他客户端）并批准验证请求以建立信任。验证后，机器人可以在加密房间中解密消息。

---

## 多账户

多账户支持：使用 `channels.matrix.accounts` 配置每个账户的凭证和可选的 `name`。参见 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) 了解共享模式。

每个账户作为独立的 Matrix 用户在任意 homeserver 上运行。每个账户的配置继承自顶级 `channels.matrix` 设置，并可覆盖任何选项（私聊策略、群组、加密等）。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      dm: { policy: "pairing" },
      accounts: {
        assistant: {
          name: "Main assistant",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_assistant_***",
          encryption: true,
        },
        alerts: {
          name: "Alerts bot",
          homeserver: "https://matrix.example.org",
          accessToken: "syt_alerts_***",
          dm: { policy: "allowlist", allowFrom: ["@admin:example.org"] },
        },
      },
    },
  },
}
```

说明：

- 账户启动是串行化的，以避免并发模块导入的竞态条件。
- 环境变量（`MATRIX_HOMESERVER`、`MATRIX_ACCESS_TOKEN` 等）仅适用于**默认**账户。
- 基础通道（Channel）设置（私聊策略、群组策略、提及门控等）适用于所有账户，除非按账户覆盖。
- 使用 `bindings[].match.accountId` 将每个账户路由到不同的智能体（Agent）。
- 加密状态按账户 + 访问 Token 存储（每个账户有独立的密钥存储）。

---

## 路由模型

- 回复总是返回到 Matrix。
- 私聊共享智能体（Agent）的主会话（Session）；房间映射到群组会话。

---

## 访问控制（私聊）

- 默认：`channels.matrix.dm.policy = "pairing"`。未知发送者会收到配对码。
- 批准方式：
  - `openclaw pairing list matrix`
  - `openclaw pairing approve matrix <CODE>`
- 公开私聊：`channels.matrix.dm.policy="open"` 加 `channels.matrix.dm.allowFrom=["*"]`。
- `channels.matrix.dm.allowFrom` 接受完整的 Matrix 用户 ID（示例：`@user:server`）。当目录搜索找到唯一精确匹配时，向导会将显示名称解析为用户 ID。
- 不要使用显示名称或裸本地部分（示例：`"Alice"` 或 `"alice"`）。它们是模糊的，会被允许列表匹配忽略。请使用完整的 `@user:server` ID。

---

## 房间（群组）

- 默认：`channels.matrix.groupPolicy = "allowlist"`（需提及门控）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- 使用 `channels.matrix.groups` 添加房间白名单（房间 ID 或别名；当目录搜索找到唯一精确匹配时，名称会被解析为 ID）：

```json5
{
  channels: {
    matrix: {
      groupPolicy: "allowlist",
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
      groupAllowFrom: ["@owner:example.org"],
    },
  },
}
```

- `requireMention: false` 启用该房间的自动回复。
- `groups."*"` 可以设置跨房间的提及门控默认值。
- `groupAllowFrom` 限制哪些发送者可以在房间中触发机器人（需完整的 Matrix 用户 ID）。
- 每个房间的 `users` 允许列表可以进一步限制特定房间中的发送者（使用完整的 Matrix 用户 ID）。
- 配置向导提示房间允许列表（房间 ID、别名或名称），仅在精确唯一匹配时解析名称。
- 启动时，OpenClaw 将允许列表中的房间/用户名称解析为 ID 并记录映射；未解析的条目将被允许列表匹配忽略。
- 默认自动加入邀请；通过 `channels.matrix.autoJoin` 和 `channels.matrix.autoJoinAllowlist` 控制。
- 要**不允许任何房间**，设置 `channels.matrix.groupPolicy: "disabled"`（或保持空的允许列表）。
- 旧版键名：`channels.matrix.rooms`（与 `groups` 相同结构）。

---

## 线程

- 支持回复线程。
- `channels.matrix.threadReplies` 控制回复是否留在线程中：
  - `off`、`inbound`（默认）、`always`
- `channels.matrix.replyToMode` 控制不在线程中回复时的 reply-to 元数据：
  - `off`（默认）、`first`、`all`

---

## 功能

| 功能         | 状态                                                               |
| ------------ | ------------------------------------------------------------------ |
| 私聊         | 支持                                                               |
| 房间         | 支持                                                               |
| 线程         | 支持                                                               |
| 媒体         | 支持                                                               |
| E2EE         | 支持（需要加密模块）                                                 |
| 反应         | 支持（通过工具发送/读取）                                            |
| 投票         | 发送支持；入站 poll-start 转为文本（response/end 被忽略）              |
| 位置         | 支持（geo URI；忽略海拔）                                           |
| 原生命令     | 支持                                                               |

---

## 故障排查

首先按照以下步骤排查：

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

如需确认私聊配对状态：

```bash
openclaw pairing list matrix
```

常见故障：

- 已登录但房间消息被忽略：房间被 `groupPolicy` 或房间允许列表阻止。
- 私聊被忽略：当 `channels.matrix.dm.policy="pairing"` 时发送者等待批准。
- 加密房间失败：加密支持或加密设置不匹配。

排查流程请参见：[/channels/troubleshooting](/channels/troubleshooting)。

---

## 配置参考（Matrix）

完整配置：[配置](/gateway/configuration)

提供商（Provider）选项：

- `channels.matrix.enabled`：启用/禁用通道（Channel）启动。
- `channels.matrix.homeserver`：homeserver URL。
- `channels.matrix.userId`：Matrix 用户 ID（使用访问 Token 时可选）。
- `channels.matrix.accessToken`：访问 Token。
- `channels.matrix.password`：登录密码（Token 会被存储）。
- `channels.matrix.deviceName`：设备显示名称。
- `channels.matrix.encryption`：启用 E2EE（默认：false）。
- `channels.matrix.initialSyncLimit`：初始同步限制。
- `channels.matrix.threadReplies`：`off | inbound | always`（默认：inbound）。
- `channels.matrix.textChunkLimit`：出站文本分块大小（字符数）。
- `channels.matrix.chunkMode`：`length`（默认）或 `newline`，在空行（段落边界）处拆分后再按长度分块。
- `channels.matrix.dm.policy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.matrix.dm.allowFrom`：私聊允许列表（完整的 Matrix 用户 ID）。`open` 模式需要 `"*"`。向导会在可能时将名称解析为 ID。
- `channels.matrix.groupPolicy`：`allowlist | open | disabled`（默认：allowlist）。
- `channels.matrix.groupAllowFrom`：群组消息的允许发送者列表（完整的 Matrix 用户 ID）。
- `channels.matrix.allowlistOnly`：强制对私聊 + 房间使用允许列表规则。
- `channels.matrix.groups`：群组允许列表 + 每个房间的设置映射。
- `channels.matrix.rooms`：旧版群组允许列表/配置。
- `channels.matrix.replyToMode`：线程/标签的 reply-to 模式。
- `channels.matrix.mediaMaxMb`：入站/出站媒体上限（MB）。
- `channels.matrix.autoJoin`：邀请处理（`always | allowlist | off`，默认：always）。
- `channels.matrix.autoJoinAllowlist`：自动加入的允许房间 ID/别名。
- `channels.matrix.accounts`：按账户 ID 为键的多账户配置（每个账户继承顶级设置）。
- `channels.matrix.actions`：按操作的工具门控（reactions/messages/pins/memberInfo/channelInfo）。
