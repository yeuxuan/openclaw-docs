---
title: "Webhook 外部触发"
sidebarTitle: "Webhook"
description: "配置 OpenClaw HTTP hooks，区分请求接纳、Agent 执行与消息交付，并安全处理唤醒、会话键和重试。"
---

# Webhook：让外部事件触发 OpenClaw

HTTP hooks 让 CI、监控或内部系统向 Gateway 提交事件。它不同于[内部 Hooks](/tutorials/automation/hooks)，也不同于管理 TaskFlow 记录的 [Webhooks 插件](/tutorials/plugins/webhooks)。

## 先在本机测试

在 Gateway 所在主机合并以下配置，替换随机 token 和已存在的 Agent ID：

```json5
{
  hooks: {
    enabled: true,
    token: "<long-random-hook-token>",
    path: "/hooks",
    allowedAgentIds: ["main"],
    allowRequestSessionKey: false,
  },
}
```

这是 `hooks` 配置，不是旧的 `webhooks.secret/agents` 结构。使用专用 hook token，不要复用 Gateway token 或密码。

```bash
openclaw config validate
openclaw gateway restart
openclaw logs --follow
```

前台运行的 Gateway 应停止并重新启动该进程。另开终端发送一个不交付成功通知的测试请求：

```bash
curl --include http://127.0.0.1:18789/hooks/agent \
  -H 'Authorization: Bearer <long-random-hook-token>' \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: webhook-smoke-001' \
  --data '{"message":"总结测试事件：示例导入已完成。","name":"Webhook smoke test","agentId":"main","deliver":false}'
```

预期 HTTP 200 和 `{ "ok": true, "runId": "..." }`。它只表示取得会话/全局运行位置的接纳，**不表示模型、工具或交付完成**。单次请求可能等待接纳最多 15 秒。

同一事件的重试应复用相同 Idempotency-Key 和 payload；新测试要换一个 key。重放得到 HTTP 200 不代表又执行了一轮，修改配置后不要拿旧测试 key 验证新的运行行为。

在日志查 `hook agent run completed` 和该 HTTP runId，确认终态 status。这个 ID 用于关联 hook 日志，不是可以直接传给 `openclaw tasks show` 的 task/TaskFlow ID。`status=ok` 但有 deliveryError 表示执行成功、交付失败，不会自动再公告一次。

## 唤醒事件不是完成信号

```bash
curl --include http://127.0.0.1:18789/hooks/wake \
  -H 'Authorization: Bearer <long-random-hook-token>' \
  -H 'Content-Type: application/json' \
  --data '{"text":"示例导入已完成","mode":"now","agentId":"main"}'
```

HTTP 200 的 `eventOutcome`：

- `queued`：队列接纳了唤醒事件。
- `coalesced`：相同唤醒已是队列最新待处理事件，被合并。

`mode: "now"` 两种情况都会请求唤醒，不表示 heartbeat 已完成。`next-heartbeat` 只入队，不请求立即唤醒。

Wake 文本进入可信系统事件，只发送你控制的短通知。原始邮件、文档等不可信内容应通过权限受限的 Agent reader 处理，不能当系统指令灌入 wake。

## 会话与交付

`/hooks/agent` 必填 `message`，选择 Agent 的字段是 `agentId`。默认 `sessionMode: "isolated"` 使用新上下文；逻辑 hook key 不保证与底层会话存储键一致。

需要跨事件复用上下文时才使用 `persistent`。直接请求还要求显式 sessionKey、`hooks.allowRequestSessionKey: true` 和非空 `hooks.allowedSessionKeyPrefixes`，不要为了方便开放任意会话键。

直接投递通道必须同时指定具体 `channel` 与 `to`，多账号再加 accountId。不支持 `channel: "last"`，也不自动继承主会话最后收件人。

没有目标时，默认 deliver=true 可向主会话提交完成系统事件；deliver=false 抑制成功公告，但失败仍可发系统事件。它不是工具限制，若 Agent 不能发消息，应另外限制工具。

## 安全与重试

所有 hook endpoint 仅接受 POST JSON。认证使用 Bearer 或 `x-openclaw-token` header，不支持 `?token=` 查询字符串认证。loopback 之外应使用 HTTPS 并限制暴露路径。

自定义 `/hooks/<name>` 由 mappings 的第一个匹配项处理；transform 返回 null 则 HTTP 204，不创建运行。批量 forEach 可能部分接纳后返回非 2xx；仍在等待的工作可继续启动，不能据 HTTP 错误盲目重交整批。

批量 Agent 重放只在有界内存缓存保留期间复用 pending/admitted 项，不承诺持久的 exactly-once。映射 wake 没有重放身份，队列可以合并重复唤醒。

| 现象 | 优先检查 |
|------|----------|
| 401 | 专用 hook token 和代理是否保留认证 header |
| 404 | hooks.enabled、path 或 mapping 是否匹配 |
| 400 | JSON、Agent、会话策略或投递坐标 |
| 405 / 408 / 413 | 方法、读取超时、请求体大小 |
| 429 | 认证失败节流，修复 token 并遵守 Retry-After |
| 409 | 目标会话冲突 |
| 502 / 503 | Gateway 准备、容量、重启或挂起状态 |
| 200 但没收到消息 | 查终态日志及 deliver/channel/to，不把接纳当成送达 |

继续阅读：[Automations](/tutorials/automation/cron-jobs)、[Gateway 配置参考](/tutorials/gateway/configuration-reference)、[Webhooks CLI](/tutorials/cli/webhooks)。

上游来源：[Automations 的 HTTP hooks](https://github.com/openclaw/openclaw/blob/2e3bf941b7848fa9dfcbcfc8c9a89d99e2feeb30/docs/automation/cron-jobs.md#webhooks)。
