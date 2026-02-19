---
title: "Twitch"
sidebarTitle: "Twitch"
---

# Twitch（插件）

通过 IRC 连接支持 Twitch 聊天。OpenClaw 以 Twitch 用户（机器人账户）身份连接，在频道中接收和发送消息。

---

## 需要插件

Twitch 作为插件提供，不包含在核心安装中。

通过 CLI 安装（npm 注册表）：

```bash
openclaw plugins install @openclaw/twitch
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/twitch
```

详情：[插件](/tools/plugin)

---

## 快速设置（新手）

1. 为机器人创建一个专用 Twitch 账户（或使用现有账户）。
2. 生成凭据：[Twitch Token Generator](https://twitchtokengenerator.com/)
   - 选择 **Bot Token**
   - 验证已选择 `chat:read` 和 `chat:write` scope
   - 复制 **Client ID** 和 **Access Token**
3. 查找你的 Twitch 用户 ID：[https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
4. 配置 Token：
   - 环境变量：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（仅默认账户）
   - 或配置：`channels.twitch.accessToken`
   - 如果两者都设置，配置优先（环境变量回退仅适用于默认账户）。
5. 启动网关。

**重要：** 添加访问控制（`allowFrom` 或 `allowedRoles`）以防止未授权用户触发机器人。`requireMention` 默认为 `true`。

最小配置：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 机器人的 Twitch 账户
      accessToken: "oauth:abc123...", // OAuth Access Token（或使用 OPENCLAW_TWITCH_ACCESS_TOKEN 环境变量）
      clientId: "xyz789...", // Token Generator 中的 Client ID
      channel: "vevisk", // 要加入的 Twitch 频道聊天（必填）
      allowFrom: ["123456789"], // （推荐）仅限你的 Twitch 用户 ID - 从 https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ 获取
    },
  },
}
```

---

## 它是什么

- 一个由网关拥有的 Twitch 通道。
- 确定性路由：回复始终路由回 Twitch。
- 每个账户映射到一个隔离的会话键 `agent:<agentId>:twitch:<accountName>`。
- `username` 是机器人的账户（进行认证），`channel` 是要加入的聊天室。

---

## 设置（详细）

### 生成凭据

使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

- 选择 **Bot Token**
- 验证已选择 `chat:read` 和 `chat:write` scope
- 复制 **Client ID** 和 **Access Token**

无需手动注册应用。Token 在几小时后过期。

### 配置机器人

**环境变量（仅默认账户）：**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**或配置：**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

如果两者都设置，配置优先。

### 访问控制（推荐）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // （推荐）仅限你的 Twitch 用户 ID
    },
  },
}
```

推荐使用 `allowFrom` 作为硬白名单。如果你想要基于角色的访问，请改用 `allowedRoles`。

**可用角色：** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

**为什么用用户 ID？** 用户名可以更改，允许冒充。用户 ID 是永久的。

查找你的 Twitch 用户 ID：[https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-%20to-user-id/)（将你的 Twitch 用户名转换为 ID）

---

## Token 刷新（可选）

来自 [Twitch Token Generator](https://twitchtokengenerator.com/) 的 Token 无法自动刷新 - 过期后重新生成。

如需自动 Token 刷新，在 [Twitch Developer Console](https://dev.twitch.tv/console) 创建你自己的 Twitch 应用程序并添加到配置：

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

机器人在过期前自动刷新 Token 并记录刷新事件。

---

## 多账户支持

使用 `channels.twitch.accounts` 进行按账户的 Token 配置。参见 [`gateway/configuration`](/gateway/configuration) 了解共享模式。

示例（一个机器人账户在两个频道中）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**注意：** 每个账户需要自己的 Token（每个频道一个 Token）。

---

## 访问控制

### 基于角色的限制

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### 按用户 ID 的白名单（最安全）

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### 基于角色的访问（替代方案）

`allowFrom` 是硬白名单。设置后，仅允许那些用户 ID。
如果你想要基于角色的访问，请不设置 `allowFrom`，改为配置 `allowedRoles`：

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### 禁用 @提及要求

默认情况下，`requireMention` 为 `true`。要禁用并响应所有消息：

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

---

## 故障排查

首先，运行诊断命令：

```bash
openclaw doctor
openclaw channels status --probe
```

### 机器人不响应消息

**检查访问控制：** 确保你的用户 ID 在 `allowFrom` 中，或临时移除 `allowFrom` 并设置 `allowedRoles: ["all"]` 以进行测试。

**检查机器人是否在频道中：** 机器人必须加入 `channel` 中指定的频道。

### Token 问题

**"Failed to connect" 或认证错误：**

- 验证 `accessToken` 是 OAuth access token 值（通常以 `oauth:` 前缀开头）
- 检查 Token 是否有 `chat:read` 和 `chat:write` scope
- 如果使用 Token 刷新，验证 `clientSecret` 和 `refreshToken` 是否已设置

### Token 刷新不工作

**检查日志中的刷新事件：**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

如果你看到 "token refresh disabled (no refresh token)"：

- 确保提供了 `clientSecret`
- 确保提供了 `refreshToken`

---

## 配置

**账户配置：**

- `username` - 机器人用户名
- `accessToken` - 带有 `chat:read` 和 `chat:write` 的 OAuth access token
- `clientId` - Twitch Client ID（来自 Token Generator 或你的应用）
- `channel` - 要加入的频道（必填）
- `enabled` - 启用此账户（默认：`true`）
- `clientSecret` - 可选：用于自动 Token 刷新
- `refreshToken` - 可选：用于自动 Token 刷新
- `expiresIn` - Token 过期时间（秒）
- `obtainmentTimestamp` - Token 获取时间戳
- `allowFrom` - 用户 ID 白名单
- `allowedRoles` - 基于角色的访问控制（`"moderator" | "owner" | "vip" | "subscriber" | "all"`）
- `requireMention` - 需要 @提及（默认：`true`）

**提供商选项：**

- `channels.twitch.enabled` - 启用/禁用通道启动
- `channels.twitch.username` - 机器人用户名（简化的单账户配置）
- `channels.twitch.accessToken` - OAuth access token（简化的单账户配置）
- `channels.twitch.clientId` - Twitch Client ID（简化的单账户配置）
- `channels.twitch.channel` - 要加入的频道（简化的单账户配置）
- `channels.twitch.accounts.<accountName>` - 多账户配置（以上所有账户字段）

完整示例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

---

## 工具操作

智能体可以使用 `twitch` 操作：

- `send` - 向频道发送消息

示例：

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

---

## 安全和运维

- **将 Token 视为密码** - 永远不要将 Token 提交到 git
- **使用自动 Token 刷新** 用于长期运行的机器人
- **使用用户 ID 白名单** 而非用户名进行访问控制
- **监控日志** 查看 Token 刷新事件和连接状态
- **最小化 Token scope** - 仅请求 `chat:read` 和 `chat:write`
- **如果卡住**：确认没有其他进程拥有该会话后重启网关

---

## 限制

- 每条消息 **500 个字符**（在单词边界自动分块）
- 发送前去除 Markdown
- 无速率限制（使用 Twitch 内置速率限制）
