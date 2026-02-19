---
title: "配对"
sidebarTitle: "配对"
---

# 配对

"配对"是 OpenClaw 的显式**所有者批准**步骤。
它用于两个场景：

1. **私信配对**（谁被允许与机器人对话）
2. **节点配对**（哪些设备/节点被允许加入网关网络）

安全上下文：[安全](/gateway/security)

---

## 1) 私信配对（入站聊天访问）

当通道配置了 DM 策略 `pairing` 时，未知发送者会收到一个短码，其消息**不会被处理**，直到你批准。

默认 DM 策略文档见：[安全](/gateway/security)

配对码：

- 8 个字符，大写，不含易混淆字符（`0O1I`）。
- **1 小时后过期**。机器人仅在创建新请求时发送配对消息（大约每个发送者每小时一次）。
- 待处理的私信配对请求默认每个通道上限为 **3 个**；在一个过期或被批准之前，额外的请求将被忽略。

### 批准发送者

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

支持的通道：`telegram`、`whatsapp`、`signal`、`imessage`、`discord`、`slack`、`feishu`。

### 状态存储位置

存储在 `~/.openclaw/credentials/` 下：

- 待处理请求：`<channel>-pairing.json`
- 已批准白名单存储：`<channel>-allowFrom.json`

请将这些文件视为敏感数据（它们控制对你助手的访问权限）。

---

## 2) 节点设备配对（iOS/Android/macOS/无头节点）

节点以 `role: node` 的**设备**身份连接到网关。网关会创建一个设备配对请求，必须被批准。

### 通过 Telegram 配对（推荐用于 iOS）

如果你使用了 `device-pair` 插件，可以完全通过 Telegram 进行首次设备配对：

1. 在 Telegram 中给你的机器人发消息：`/pair`
2. 机器人回复两条消息：一条指令消息和一条单独的**设置码**消息（方便在 Telegram 中复制/粘贴）。
3. 在手机上打开 OpenClaw iOS 应用 → 设置 → 网关。
4. 粘贴设置码并连接。
5. 回到 Telegram：`/pair approve`

设置码是一个 base64 编码的 JSON 负载，包含：

- `url`：网关 WebSocket URL（`ws://...` 或 `wss://...`）
- `token`：短期有效的配对 Token

在设置码有效期间，请像对待密码一样保管它。

### 批准节点设备

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

### 节点配对状态存储

存储在 `~/.openclaw/devices/` 下：

- `pending.json`（短期有效；待处理请求会过期）
- `paired.json`（已配对设备 + Token）

### 说明

- 旧版 `node.pair.*` API（CLI：`openclaw nodes pending/approve`）是一个单独的网关拥有的配对存储。WS 节点仍需设备配对。

---

## 相关文档

- 安全模型 + 提示注入：[安全](/gateway/security)
- 安全更新（运行 doctor）：[更新](/install/updating)
- 通道配置：
  - Telegram：[Telegram](/channels/telegram)
  - WhatsApp：[WhatsApp](/channels/whatsapp)
  - Signal：[Signal](/channels/signal)
  - BlueBubbles（iMessage）：[BlueBubbles](/channels/bluebubbles)
  - iMessage（旧版）：[iMessage](/channels/imessage)
  - Discord：[Discord](/channels/discord)
  - Slack：[Slack](/channels/slack)
