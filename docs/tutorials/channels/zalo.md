---
title: "Zalo"
sidebarTitle: "Zalo"
---

# Zalo（Bot API）

状态：实验性。仅支持私信；群组功能根据 Zalo 文档即将推出。

---

## 需要插件

Zalo 作为插件提供，不包含在核心安装中。

- 通过 CLI 安装：`openclaw plugins install @openclaw/zalo`
- 或在引导向导中选择 **Zalo** 并确认安装提示
- 详情：[插件](/tools/plugin)

---

## 快速设置（新手）

1. 安装 Zalo 插件：
   - 从源码检出：`openclaw plugins install ./extensions/zalo`
   - 从 npm（如已发布）：`openclaw plugins install @openclaw/zalo`
   - 或在引导向导中选择 **Zalo** 并确认安装提示
2. 设置 Token：
   - 环境变量：`ZALO_BOT_TOKEN=...`
   - 或配置：`channels.zalo.botToken: "..."`。
3. 重启网关（或完成引导向导）。
4. 私信默认为配对模式；首次联系时批准配对码。

最小配置：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

---

## 它是什么

Zalo 是一款以越南为中心的即时通讯应用；其 Bot API 允许网关运行一个用于一对一对话的机器人。
适合需要确定性路由回 Zalo 的客服或通知场景。

- 由网关管理的 Zalo Bot API 通道。
- 确定性路由：回复返回 Zalo；模型不会选择通道。
- 私信共享智能体的主会话。
- 群组尚不支持（Zalo 文档标注为"即将推出"）。

---

## 设置（快速路径）

### 1) 创建机器人 Token（Zalo Bot Platform）

1. 前往 [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) 并登录。
2. 创建新机器人并配置设置。
3. 复制机器人 Token（格式：`12345689:abc-xyz`）。

### 2) 配置 Token（环境变量或配置）

示例：

```json5
{
  channels: {
    zalo: {
      enabled: true,
      botToken: "12345689:abc-xyz",
      dmPolicy: "pairing",
    },
  },
}
```

环境变量选项：`ZALO_BOT_TOKEN=...`（仅适用于默认账户）。

多账户支持：使用 `channels.zalo.accounts` 进行按账户的 Token 配置和可选的 `name`。

3. 重启网关。当 Token 解析成功（环境变量或配置）时 Zalo 启动。
4. 私信默认为配对模式。机器人首次被联系时批准配对码。

---

## 工作原理（行为）

- 入站消息被规范化为共享的通道信封，包含媒体占位符。
- 回复始终路由回相同的 Zalo 聊天。
- 默认使用长轮询；通过 `channels.zalo.webhookUrl` 可使用 Webhook 模式。

---

## 限制

- 出站文本分块至 2000 字符（Zalo API 限制）。
- 媒体下载/上传受 `channels.zalo.mediaMaxMb` 限制（默认 5）。
- 由于 2000 字符限制使流式传输意义不大，默认阻止流式传输。

---

## 访问控制（私信）

### 私信访问

- 默认：`channels.zalo.dmPolicy = "pairing"`。未知发送者收到配对码；消息在批准前被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- 配对是默认的令牌交换方式。详情：[配对](/channels/pairing)
- `channels.zalo.allowFrom` 接受数字用户 ID（无用户名查找功能）。

---

## 长轮询 vs Webhook

- 默认：长轮询（不需要公网 URL）。
- Webhook 模式：设置 `channels.zalo.webhookUrl` 和 `channels.zalo.webhookSecret`。
  - Webhook 密钥必须为 8-256 个字符。
  - Webhook URL 必须使用 HTTPS。
  - Zalo 发送事件时使用 `X-Bot-Api-Secret-Token` 头进行验证。
  - 网关 HTTP 在 `channels.zalo.webhookPath` 处理 Webhook 请求（默认为 Webhook URL 路径）。

**注意：** 根据 Zalo API 文档，getUpdates（轮询）和 Webhook 是互斥的。

---

## 支持的消息类型

- **文本消息**：完全支持，2000 字符分块。
- **图片消息**：下载并处理入站图片；通过 `sendPhoto` 发送图片。
- **贴纸**：记录但未完全处理（无智能体响应）。
- **不支持的类型**：记录日志（如来自受保护用户的消息）。

---

## 功能支持

| 功能         | 状态                           |
| ------------ | ------------------------------ |
| 私信         | ✅ 已支持                      |
| 群组         | ❌ 即将推出（根据 Zalo 文档）  |
| 媒体（图片） | ✅ 已支持                      |
| 表情回应     | ❌ 不支持                      |
| 线程         | ❌ 不支持                      |
| 投票         | ❌ 不支持                      |
| 原生命令     | ❌ 不支持                      |
| 流式传输     | ⚠️ 已阻止（2000 字符限制）     |

---

## 投递目标（CLI/定时任务）

- 使用聊天 ID 作为目标。
- 示例：`openclaw message send --channel zalo --target 123456789 --message "hi"`。

---

## 故障排查

**机器人不响应：**

- 检查 Token 是否有效：`openclaw channels status --probe`
- 验证发送者已获批准（配对或 allowFrom）
- 检查网关日志：`openclaw logs --follow`

**Webhook 未接收到事件：**

- 确保 Webhook URL 使用 HTTPS
- 验证密钥 Token 为 8-256 个字符
- 确认网关 HTTP 端点在配置的路径上可达
- 检查 getUpdates 轮询是否未运行（两者互斥）

---

## 配置参考（Zalo）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.zalo.enabled`：启用/禁用通道启动。
- `channels.zalo.botToken`：Zalo Bot Platform 的机器人 Token。
- `channels.zalo.tokenFile`：从文件路径读取 Token。
- `channels.zalo.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.zalo.allowFrom`：私信白名单（用户 ID）。`open` 需要 `"*"`。向导会要求输入数字 ID。
- `channels.zalo.mediaMaxMb`：入站/出站媒体上限（MB，默认 5）。
- `channels.zalo.webhookUrl`：启用 Webhook 模式（需要 HTTPS）。
- `channels.zalo.webhookSecret`：Webhook 密钥（8-256 字符）。
- `channels.zalo.webhookPath`：网关 HTTP 服务器上的 Webhook 路径。
- `channels.zalo.proxy`：API 请求的代理 URL。

多账户选项：

- `channels.zalo.accounts.<id>.botToken`：按账户 Token。
- `channels.zalo.accounts.<id>.tokenFile`：按账户 Token 文件。
- `channels.zalo.accounts.<id>.name`：显示名称。
- `channels.zalo.accounts.<id>.enabled`：启用/禁用账户。
- `channels.zalo.accounts.<id>.dmPolicy`：按账户私信策略。
- `channels.zalo.accounts.<id>.allowFrom`：按账户白名单。
- `channels.zalo.accounts.<id>.webhookUrl`：按账户 Webhook URL。
- `channels.zalo.accounts.<id>.webhookSecret`：按账户 Webhook 密钥。
- `channels.zalo.accounts.<id>.webhookPath`：按账户 Webhook 路径。
- `channels.zalo.accounts.<id>.proxy`：按账户代理 URL。
