---
title: grammY
sidebarTitle: "grammY"
---

# grammY 集成（Telegram Bot API）

# 为什么选择 grammY

- TypeScript 优先的 Bot API 客户端，内置长轮询 + Webhook 助手、中间件、错误处理、速率限制器。
- 比手动编写 fetch + FormData 更简洁的媒体助手；支持所有 Bot API 方法。
- 可扩展：通过自定义 fetch 支持代理、会话中间件（可选）、类型安全上下文。

# 我们发布了什么

- **单一客户端路径：** 基于 fetch 的实现已移除；grammY 现在是唯一的 Telegram 客户端（发送 + 网关），默认启用 grammY 节流器。
- **网关：** `monitorTelegramProvider` 构建一个 grammY `Bot`，连接提及/白名单门控、通过 `getFile`/`download` 下载媒体，并通过 `sendMessage/sendPhoto/sendVideo/sendAudio/sendDocument` 投递回复。支持通过 `webhookCallback` 进行长轮询或 Webhook。
- **代理：** 可选的 `channels.telegram.proxy` 通过 grammY 的 `client.baseFetch` 使用 `undici.ProxyAgent`。
- **Webhook 支持：** `webhook-set.ts` 封装了 `setWebhook/deleteWebhook`；`webhook.ts` 托管回调，包含健康检查 + 优雅关闭。当设置了 `channels.telegram.webhookUrl` + `channels.telegram.webhookSecret` 时，网关启用 Webhook 模式（否则使用长轮询）。
- **会话（Session）：** 直接聊天折叠到智能体主会话（`agent:<agentId>:<mainKey>`）；群组使用 `agent:<agentId>:telegram:group:<chatId>`；回复路由回同一通道。
- **配置项：** `channels.telegram.botToken`、`channels.telegram.dmPolicy`、`channels.telegram.groups`（白名单 + 提及默认值）、`channels.telegram.allowFrom`、`channels.telegram.groupAllowFrom`、`channels.telegram.groupPolicy`、`channels.telegram.mediaMaxMb`、`channels.telegram.linkPreview`、`channels.telegram.proxy`、`channels.telegram.webhookSecret`、`channels.telegram.webhookUrl`、`channels.telegram.webhookHost`。
- **草稿流式传输：** 可选的 `channels.telegram.streamMode` 在私有话题聊天中使用 `sendMessageDraft`（Bot API 9.3+）。这与通道块流式传输是分开的。
- **测试：** grammY 模拟覆盖了私信 + 群组提及门控和出站发送；欢迎更多媒体/Webhook 测试用例。

待定问题

- 如果遇到 Bot API 429 错误，可选 grammY 插件（节流器）。
- 添加更多结构化媒体测试（贴纸、语音消息）。
- 使 Webhook 监听端口可配置（目前固定为 8787，除非通过网关连接）。
