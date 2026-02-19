---
title: "Nextcloud Talk"
sidebarTitle: "Nextcloud Talk"
---

# Nextcloud Talk（插件）

状态：通过插件支持（Webhook 机器人）。支持私信、房间、表情回应和 Markdown 消息。

---

## 需要插件

Nextcloud Talk 作为插件提供，不包含在核心安装中。

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/nextcloud-talk
```

如果你在配置/引导向导中选择 Nextcloud Talk 且检测到 git 检出，
OpenClaw 会自动提供本地安装路径。

详情：[插件](/tools/plugin)

---

## 快速设置（新手）

1. 安装 Nextcloud Talk 插件。
2. 在你的 Nextcloud 服务器上创建机器人：

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. 在目标房间设置中启用机器人。
4. 配置 OpenClaw：
   - 配置：`channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - 或环境变量：`NEXTCLOUD_TALK_BOT_SECRET`（仅默认账户）
5. 重启网关（或完成引导向导）。

最小配置：

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

---

## 说明

- 机器人无法主动发起私信。用户必须先向机器人发送消息。
- Webhook URL 必须可被网关访问；如在代理后面，请设置 `webhookPublicUrl`。
- 机器人 API 不支持媒体上传；媒体以 URL 形式发送。
- Webhook 载荷不区分私信和房间；设置 `apiUser` + `apiPassword` 以启用房间类型查找（否则私信会被当作房间处理）。

---

## 访问控制（私信）

- 默认：`channels.nextcloud-talk.dmPolicy = "pairing"`。未知发送者获得配对码。
- 批准方式：
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- 公开私信：`channels.nextcloud-talk.dmPolicy="open"` 加 `channels.nextcloud-talk.allowFrom=["*"]`。
- `allowFrom` 仅匹配 Nextcloud 用户 ID；显示名称会被忽略。

---

## 房间（群组）

- 默认：`channels.nextcloud-talk.groupPolicy = "allowlist"`（提及门控）。
- 使用 `channels.nextcloud-talk.rooms` 白名单房间：

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- 要禁止所有房间，保持白名单为空或设置 `channels.nextcloud-talk.groupPolicy="disabled"`。

---

## 功能支持

| 功能         | 状态     |
| ------------ | -------- |
| 私信         | 已支持   |
| 房间         | 已支持   |
| 线程         | 不支持   |
| 媒体         | 仅 URL   |
| 表情回应     | 已支持   |
| 原生命令     | 不支持   |

---

## 配置参考（Nextcloud Talk）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.nextcloud-talk.enabled`：启用/禁用通道启动。
- `channels.nextcloud-talk.baseUrl`：Nextcloud 实例 URL。
- `channels.nextcloud-talk.botSecret`：机器人共享密钥。
- `channels.nextcloud-talk.botSecretFile`：密钥文件路径。
- `channels.nextcloud-talk.apiUser`：用于房间查找（私信检测）的 API 用户。
- `channels.nextcloud-talk.apiPassword`：用于房间查找的 API/应用密码。
- `channels.nextcloud-talk.apiPasswordFile`：API 密码文件路径。
- `channels.nextcloud-talk.webhookPort`：Webhook 监听端口（默认：8788）。
- `channels.nextcloud-talk.webhookHost`：Webhook 主机（默认：0.0.0.0）。
- `channels.nextcloud-talk.webhookPath`：Webhook 路径（默认：/nextcloud-talk-webhook）。
- `channels.nextcloud-talk.webhookPublicUrl`：外部可达的 Webhook URL。
- `channels.nextcloud-talk.dmPolicy`：`pairing | allowlist | open | disabled`。
- `channels.nextcloud-talk.allowFrom`：私信白名单（用户 ID）。`open` 需要 `"*"`。
- `channels.nextcloud-talk.groupPolicy`：`allowlist | open | disabled`。
- `channels.nextcloud-talk.groupAllowFrom`：群组白名单（用户 ID）。
- `channels.nextcloud-talk.rooms`：按房间设置和白名单。
- `channels.nextcloud-talk.historyLimit`：群组历史限制（0 禁用）。
- `channels.nextcloud-talk.dmHistoryLimit`：私信历史限制（0 禁用）。
- `channels.nextcloud-talk.dms`：按私信覆盖（historyLimit）。
- `channels.nextcloud-talk.textChunkLimit`：出站文本分块大小（字符）。
- `channels.nextcloud-talk.chunkMode`：`length`（默认）或 `newline`，在段落边界（空行）处分割后再按长度分块。
- `channels.nextcloud-talk.blockStreaming`：禁用此通道的块流式传输。
- `channels.nextcloud-talk.blockStreamingCoalesce`：块流式传输合并调优。
- `channels.nextcloud-talk.mediaMaxMb`：入站媒体上限（MB）。
