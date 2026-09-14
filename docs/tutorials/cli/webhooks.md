---
title: "openclaw webhooks"
sidebarTitle: "webhooks"
---

# `openclaw webhooks`

管理 Webhook 相关能力。

Webhook 适合让外部系统通知 OpenClaw，比如 CI 构建完成、监控告警、内部系统事件。

常见排查：

```bash
openclaw gateway status
openclaw logs --follow
openclaw security audit
```

安全重点是 token、签名、来源限制和重放防护。不要把无鉴权 webhook 暴露到公网。

`POST /hooks/wake` 的 HTTP 200 只表示已接纳或合并唤醒事件：`eventOutcome` 为 `queued` 或 `coalesced`。`mode: "now"` 两种情况都会请求唤醒，不表示 heartbeat 已完成；延后唤醒用 `next-heartbeat`。

继续阅读：[Webhooks](/tutorials/plugins/webhooks) 和 [Webhook 自动化](/tutorials/automation/webhook)。

## 新手提醒

Webhook 调不通时，先确认请求是否真的到了 Gateway。
如果日志里完全没有记录，多半是 URL、端口、反向代理或网络问题；如果有记录但被拒绝，多半是 token、签名或权限问题。
