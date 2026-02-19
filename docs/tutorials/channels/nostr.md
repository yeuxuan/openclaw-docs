---
title: "Nostr"
sidebarTitle: "Nostr"
---

# Nostr

**状态：** 可选插件（默认禁用）。

Nostr 是一个去中心化的社交网络协议。此通道使 OpenClaw 能够通过 NIP-04 接收和回复加密私信（DM）。

---

## 安装（按需）

### 引导安装（推荐）

- 引导向导（`openclaw onboard`）和 `openclaw channels add` 列出可选的通道插件。
- 选择 Nostr 时会提示你按需安装插件。

安装默认值：

- **开发通道 + git 检出可用：** 使用本地插件路径。
- **稳定版/Beta 版：** 从 npm 下载。

你始终可以在提示中覆盖选择。

### 手动安装

```bash
openclaw plugins install @openclaw/nostr
```

使用本地检出（开发工作流）：

```bash
openclaw plugins install --link <path-to-openclaw>/extensions/nostr
```

安装或启用插件后重启网关。

---

## 快速设置

1. 生成 Nostr 密钥对（如需要）：

```bash
# 使用 nak
nak key generate
```

2. 添加到配置：

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}"
    }
  }
}
```

3. 导出密钥：

```bash
export NOSTR_PRIVATE_KEY="nsec1..."
```

4. 重启网关。

---

## 配置参考

| 键          | 类型     | 默认值                                     | 描述                         |
| ------------ | -------- | ------------------------------------------- | ----------------------------------- |
| `privateKey` | string   | 必填                                    | `nsec` 或十六进制格式的私钥 |
| `relays`     | string[] | `['wss://relay.damus.io', 'wss://nos.lol']` | 中继 URL（WebSocket）              |
| `dmPolicy`   | string   | `pairing`                                   | DM 访问策略                    |
| `allowFrom`  | string[] | `[]`                                        | 允许的发送者公钥              |
| `enabled`    | boolean  | `true`                                      | 启用/禁用通道              |
| `name`       | string   | -                                           | 显示名称                        |
| `profile`    | object   | -                                           | NIP-01 个人资料元数据             |

---

## 个人资料元数据

个人资料数据以 NIP-01 `kind:0` 事件发布。你可以从控制 UI（Channels -> Nostr -> Profile）管理它，或直接在配置中设置。

示例：

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "profile": {
        "name": "openclaw",
        "displayName": "OpenClaw",
        "about": "Personal assistant DM bot",
        "picture": "https://example.com/avatar.png",
        "banner": "https://example.com/banner.png",
        "website": "https://example.com",
        "nip05": "openclaw@example.com",
        "lud16": "openclaw@example.com"
      }
    }
  }
}
```

说明：

- 个人资料 URL 必须使用 `https://`。
- 从中继导入时会合并字段并保留本地覆盖。

---

## 访问控制

### DM 策略

- **pairing**（默认）：未知发送者获得配对码。
- **allowlist**：仅 `allowFrom` 中的公钥可以发私信。
- **open**：公开入站私信（需要 `allowFrom: ["*"]`）。
- **disabled**：忽略入站私信。

### 白名单示例

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "dmPolicy": "allowlist",
      "allowFrom": ["npub1abc...", "npub1xyz..."]
    }
  }
}
```

---

## 密钥格式

接受的格式：

- **私钥：** `nsec...` 或 64 字符十六进制
- **公钥（`allowFrom`）：** `npub...` 或十六进制

---

## 中继

默认值：`relay.damus.io` 和 `nos.lol`。

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["wss://relay.damus.io", "wss://relay.primal.net", "wss://nostr.wine"]
    }
  }
}
```

建议：

- 使用 2-3 个中继以提供冗余。
- 避免过多中继（延迟、重复）。
- 付费中继可以提高可靠性。
- 本地中继适用于测试（`ws://localhost:7777`）。

---

## 协议支持

| NIP    | 状态    | 描述                           |
| ------ | --------- | ------------------------------------- |
| NIP-01 | 已支持 | 基本事件格式 + 个人资料元数据 |
| NIP-04 | 已支持 | 加密私信（`kind:4`）              |
| NIP-17 | 计划中   | Gift-wrapped DM                      |
| NIP-44 | 计划中   | 版本化加密                  |

---

## 测试

### 本地中继

```bash
# 启动 strfry
docker run -p 7777:7777 ghcr.io/hoytech/strfry
```

```json
{
  "channels": {
    "nostr": {
      "privateKey": "${NOSTR_PRIVATE_KEY}",
      "relays": ["ws://localhost:7777"]
    }
  }
}
```

### 手动测试

1. 从日志中记下机器人公钥（npub）。
2. 打开 Nostr 客户端（Damus、Amethyst 等）。
3. 向机器人公钥发私信。
4. 验证响应。

---

## 故障排查

### 没有收到消息

- 验证私钥是否有效。
- 确保中继 URL 可达且使用 `wss://`（或本地使用 `ws://`）。
- 确认 `enabled` 不是 `false`。
- 检查网关日志中的中继连接错误。

### 没有发送响应

- 检查中继是否接受写入。
- 验证出站连接。
- 注意中继速率限制。

### 重复响应

- 使用多个中继时这是预期行为。
- 消息按事件 ID 去重；只有第一次投递触发响应。

---

## 安全

- 永远不要提交私钥。
- 使用环境变量存储密钥。
- 生产机器人建议使用 `allowlist`。

---

## 限制（MVP）

- 仅支持直接消息（不支持群聊）。
- 不支持媒体附件。
- 仅支持 NIP-04（NIP-17 gift-wrap 计划中）。
