---
title: Feishu
sidebarTitle: "Feishu"
---

# Feishu 机器人

Feishu（Lark）是企业用于消息和协作的团队沟通平台。此插件通过平台的 WebSocket 事件订阅将 OpenClaw 连接到 Feishu/Lark 机器人，无需暴露公共 Webhook URL 即可接收消息。

---

## 需要安装插件

安装 Feishu 插件：

```bash
openclaw plugins install @openclaw/feishu
```

本地检出（从 git 仓库运行时）：

```bash
openclaw plugins install ./extensions/feishu
```

---

## 快速开始

有两种方式添加 Feishu 通道（Channel）：

### 方法 1：引导向导（推荐）

如果你刚安装 OpenClaw，运行向导：

```bash
openclaw onboard
```

向导将引导你完成：

1. 创建 Feishu 应用并收集凭证
2. 在 OpenClaw 中配置应用凭证
3. 启动网关（Gateway）

**配置完成后**，检查网关（Gateway）状态：

- `openclaw gateway status`
- `openclaw logs --follow`

### 方法 2：CLI 设置

如果你已完成初始安装，通过 CLI 添加通道（Channel）：

```bash
openclaw channels add
```

选择 **Feishu**，然后输入 App ID 和 App Secret。

**配置完成后**，管理网关（Gateway）：

- `openclaw gateway status`
- `openclaw gateway restart`
- `openclaw logs --follow`

---

## 步骤 1：创建 Feishu 应用

### 1. 打开飞书开放平台

访问[飞书开放平台](https://open.feishu.cn/app)并登录。

Lark（国际版）租户应使用 [https://open.larksuite.com/app](https://open.larksuite.com/app)，并在 Feishu 配置中设置 `domain: "lark"`。

### 2. 创建应用

1. 点击**创建企业自建应用**
2. 填写应用名称和描述
3. 选择应用图标

<!-- image: feishu-step2-create-app.png -->

### 3. 复制凭证

在**凭证与基础信息**中，复制：

- **App ID**（格式：`cli_xxx`）
- **App Secret**

**重要提示：** 请妥善保管 App Secret。

<!-- image: feishu-step3-credentials.png -->

### 4. 配置权限

在**权限管理**页面，点击**批量导入**并粘贴：

```json
{
  "scopes": {
    "tenant": [
      "aily:file:read",
      "aily:file:write",
      "application:application.app_message_stats.overview:readonly",
      "application:application:self_manage",
      "application:bot.menu:write",
      "contact:user.employee_id:readonly",
      "corehr:file:download",
      "event:ip_list",
      "im:chat.access_event.bot_p2p_chat:read",
      "im:chat.members:bot_access",
      "im:message",
      "im:message.group_at_msg:readonly",
      "im:message.p2p_msg:readonly",
      "im:message:readonly",
      "im:message:send_as_bot",
      "im:resource"
    ],
    "user": ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"]
  }
}
```

<!-- image: feishu-step4-permissions.png -->

### 5. 启用机器人能力

在**应用能力** > **机器人**中：

1. 启用机器人能力
2. 设置机器人名称

<!-- image: feishu-step5-bot-capability.png -->

### 6. 配置事件订阅

**重要提示：** 在设置事件订阅之前，请确保：

1. 你已经为 Feishu 运行了 `openclaw channels add`
2. 网关（Gateway）正在运行（`openclaw gateway status`）

在**事件订阅**中：

1. 选择**使用长连接接收事件**（WebSocket）
2. 添加事件：`im.message.receive_v1`

如果网关（Gateway）未运行，长连接设置可能无法保存。

<!-- image: feishu-step6-event-subscription.png -->

### 7. 发布应用

1. 在**版本管理与发布**中创建版本
2. 提交审核并发布
3. 等待管理员审批（企业应用通常会自动审批）

---

## 步骤 2：配置 OpenClaw

### 通过向导配置（推荐）

```bash
openclaw channels add
```

选择 **Feishu** 并粘贴你的 App ID + App Secret。

### 通过配置文件配置

编辑 `~/.openclaw/openclaw.json`：

```json5
{
  channels: {
    feishu: {
      enabled: true,
      dmPolicy: "pairing",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "My AI assistant",
        },
      },
    },
  },
}
```

### 通过环境变量配置

```bash
export FEISHU_APP_ID="cli_xxx"
export FEISHU_APP_SECRET="xxx"
```

### Lark（国际版）域名

如果你的租户在 Lark（国际版），请将域名设置为 `lark`（或完整的域名字符串）。你可以在 `channels.feishu.domain` 或按账户设置（`channels.feishu.accounts.<id>.domain`）。

```json5
{
  channels: {
    feishu: {
      domain: "lark",
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
        },
      },
    },
  },
}
```

---

## 步骤 3：启动 + 测试

### 1. 启动网关（Gateway）

```bash
openclaw gateway
```

### 2. 发送测试消息

在 Feishu 中找到你的机器人并发送一条消息。

### 3. 批准配对

默认情况下，机器人会回复一个配对码。批准方式：

```bash
openclaw pairing approve feishu <CODE>
```

批准后即可正常聊天。

---

## 概述

- **Feishu 机器人通道（Channel）**：由网关（Gateway）管理的 Feishu 机器人
- **确定性路由**：回复总是返回到 Feishu
- **会话（Session）隔离**：私聊共享主会话（Session）；群组单独隔离
- **WebSocket 连接**：通过 Feishu SDK 的长连接，无需公共 URL

---

## 访问控制

### 私聊

- **默认**：`dmPolicy: "pairing"`（未知用户收到配对码）
- **批准配对**：

  ```bash
  openclaw pairing list feishu
  openclaw pairing approve feishu <CODE>
  ```

- **允许列表模式**：将 `channels.feishu.allowFrom` 设置为允许的 Open ID

### 群聊

**1. 群组策略**（`channels.feishu.groupPolicy`）：

- `"open"` = 允许群组中的所有人（默认）
- `"allowlist"` = 仅允许 `groupAllowFrom` 中的用户
- `"disabled"` = 禁用群组消息

**2. 提及要求**（`channels.feishu.groups.<chat_id>.requireMention`）：

- `true` = 需要 @提及（默认）
- `false` = 无需提及即可回复

---

## 群组配置示例

### 允许所有群组，需要 @提及（默认）

```json5
{
  channels: {
    feishu: {
      groupPolicy: "open",
      // 默认 requireMention: true
    },
  },
}
```

### 允许所有群组，无需 @提及

```json5
{
  channels: {
    feishu: {
      groups: {
        oc_xxx: { requireMention: false },
      },
    },
  },
}
```

### 仅允许群组中的特定用户

```json5
{
  channels: {
    feishu: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["ou_xxx", "ou_yyy"],
    },
  },
}
```

---

## 获取群组/用户 ID

### 群组 ID（chat_id）

群组 ID 类似 `oc_xxx`。

**方法 1（推荐）**

1. 启动网关（Gateway）并在群组中 @提及机器人
2. 运行 `openclaw logs --follow` 查找 `chat_id`

**方法 2**

使用飞书 API 调试器列出群聊。

### 用户 ID（open_id）

用户 ID 类似 `ou_xxx`。

**方法 1（推荐）**

1. 启动网关（Gateway）并私聊机器人
2. 运行 `openclaw logs --follow` 查找 `open_id`

**方法 2**

检查配对请求以获取用户 Open ID：

```bash
openclaw pairing list feishu
```

---

## 常用命令

| 命令      | 描述          |
| --------- | ------------- |
| `/status` | 显示机器人状态 |
| `/reset`  | 重置会话（Session） |
| `/model`  | 显示/切换模型  |

> 注意：Feishu 目前不支持原生命令菜单，因此命令需要作为文本发送。

## 网关管理命令

| 命令                       | 描述            |
| -------------------------- | --------------- |
| `openclaw gateway status`  | 显示网关（Gateway）状态 |
| `openclaw gateway install` | 安装/启动网关服务 |
| `openclaw gateway stop`    | 停止网关服务     |
| `openclaw gateway restart` | 重启网关服务     |
| `openclaw logs --follow`   | 实时查看网关日志  |

---

## 故障排查

### 机器人在群聊中不回复

1. 确保机器人已添加到群组
2. 确保 @提及了机器人（默认行为）
3. 检查 `groupPolicy` 是否设置为 `"disabled"`
4. 检查日志：`openclaw logs --follow`

### 机器人不接收消息

1. 确保应用已发布并审批通过
2. 确保事件订阅包含 `im.message.receive_v1`
3. 确保启用了**长连接**
4. 确保应用权限完整
5. 确保网关（Gateway）正在运行：`openclaw gateway status`
6. 检查日志：`openclaw logs --follow`

### App Secret 泄露

1. 在飞书开放平台重置 App Secret
2. 更新配置中的 App Secret
3. 重启网关（Gateway）

### 消息发送失败

1. 确保应用具有 `im:message:send_as_bot` 权限
2. 确保应用已发布
3. 检查日志以获取详细错误信息

---

## 高级配置

### 多账户

```json5
{
  channels: {
    feishu: {
      accounts: {
        main: {
          appId: "cli_xxx",
          appSecret: "xxx",
          botName: "Primary bot",
        },
        backup: {
          appId: "cli_yyy",
          appSecret: "yyy",
          botName: "Backup bot",
          enabled: false,
        },
      },
    },
  },
}
```

### 消息限制

- `textChunkLimit`：出站文本分块大小（默认：2000 字符）
- `mediaMaxMb`：媒体上传/下载限制（默认：30MB）

### 流式传输

Feishu 支持通过互动卡片进行流式回复。启用后，机器人在生成文本时会更新卡片。

```json5
{
  channels: {
    feishu: {
      streaming: true, // 启用流式卡片输出（默认 true）
      blockStreaming: true, // 启用分块流式传输（默认 true）
    },
  },
}
```

设置 `streaming: false` 以等待完整回复后再发送。

### 多智能体路由

使用 `bindings` 将 Feishu 私聊或群组路由到不同的智能体（Agent）。

```json5
{
  agents: {
    list: [
      { id: "main" },
      {
        id: "clawd-fan",
        workspace: "/home/user/clawd-fan",
        agentDir: "/home/user/.openclaw/agents/clawd-fan/agent",
      },
      {
        id: "clawd-xi",
        workspace: "/home/user/clawd-xi",
        agentDir: "/home/user/.openclaw/agents/clawd-xi/agent",
      },
    ],
  },
  bindings: [
    {
      agentId: "main",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_xxx" },
      },
    },
    {
      agentId: "clawd-fan",
      match: {
        channel: "feishu",
        peer: { kind: "direct", id: "ou_yyy" },
      },
    },
    {
      agentId: "clawd-xi",
      match: {
        channel: "feishu",
        peer: { kind: "group", id: "oc_zzz" },
      },
    },
  ],
}
```

路由字段：

- `match.channel`：`"feishu"`
- `match.peer.kind`：`"direct"` 或 `"group"`
- `match.peer.id`：用户 Open ID（`ou_xxx`）或群组 ID（`oc_xxx`）

参见[获取群组/用户 ID](#获取群组用户-id)了解查询方法。

---

## 配置参考

完整配置：[网关配置](/gateway/configuration)

关键选项：

| 设置                                              | 描述                        | 默认值    |
| ------------------------------------------------- | --------------------------- | --------- |
| `channels.feishu.enabled`                         | 启用/禁用通道（Channel）       | `true`    |
| `channels.feishu.domain`                          | API 域名（`feishu` 或 `lark`） | `feishu`  |
| `channels.feishu.accounts.<id>.appId`             | App ID                      | -         |
| `channels.feishu.accounts.<id>.appSecret`         | App Secret                  | -         |
| `channels.feishu.accounts.<id>.domain`            | 按账户 API 域名覆盖           | `feishu`  |
| `channels.feishu.dmPolicy`                        | 私聊策略                     | `pairing` |
| `channels.feishu.allowFrom`                       | 私聊允许列表（open_id 列表）   | -         |
| `channels.feishu.groupPolicy`                     | 群组策略                     | `open`    |
| `channels.feishu.groupAllowFrom`                  | 群组允许列表                  | -         |
| `channels.feishu.groups.<chat_id>.requireMention` | 需要 @提及                   | `true`    |
| `channels.feishu.groups.<chat_id>.enabled`        | 启用群组                     | `true`    |
| `channels.feishu.textChunkLimit`                  | 消息分块大小                  | `2000`    |
| `channels.feishu.mediaMaxMb`                      | 媒体大小限制                  | `30`      |
| `channels.feishu.streaming`                       | 启用流式卡片输出              | `true`    |
| `channels.feishu.blockStreaming`                   | 启用分块流式传输              | `true`    |

---

## dmPolicy 参考

| 值            | 行为                                             |
| ------------- | ------------------------------------------------ |
| `"pairing"`   | **默认。** 未知用户收到配对码；需要批准             |
| `"allowlist"` | 仅 `allowFrom` 中的用户可以聊天                    |
| `"open"`      | 允许所有用户（需要在 allowFrom 中设置 `"*"`）       |
| `"disabled"`  | 禁用私聊                                          |

---

## 支持的消息类型

### 接收

- 文本
- 富文本（post）
- 图片
- 文件
- 音频
- 视频
- 贴纸

### 发送

- 文本
- 图片
- 文件
- 音频
- 富文本（部分支持）
