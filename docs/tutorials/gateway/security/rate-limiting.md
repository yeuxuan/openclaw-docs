---
title: "Gateway 限流"
sidebarTitle: "限流"
description: "理解 Gateway 登录失败、Webhook、控制面写入、ACP 会话和重启冷却的不同限流。"
---

# Gateway 限流

Gateway 有多套互相独立的限流器。遇到 429、`AUTH_RATE_LIMITED` 或 `rate limit exceeded for <method>` 时，先确认是哪一层，不要立即轮换正确凭据或无限重试。

| 表面 | 默认限制 | 可配置 |
|------|----------|--------|
| Token/密码/设备认证失败 | 60 秒 10 次，锁定 5 分钟 | `gateway.auth.rateLimit` |
| 浏览器 Origin 的 WS 认证失败 | 同上，回环地址也不豁免 | 同上 |
| `/hooks` Webhook 认证失败 | 60 秒 20 次，锁定 60 秒 | 否 |
| 控制面写 RPC | 每方法 60 秒 30 次 | 否 |
| ACP 新建会话 | 10 秒 120 个 | 内部值 |
| Gateway 重启周期 | 两次至少间隔 30 秒 | 否 |

认证失败限流只计算错误凭据；成功认证会重置对应计数。默认本地 CLI 的回环地址豁免，但带浏览器 `Origin` 的连接不会豁免，以防恶意网页从本机撞库。

可调整的认证配置：

```json5
{
  gateway: {
    auth: {
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
  },
}
```

Webhook 超限返回 HTTP 429 与 `Retry-After`；Gateway RPC 通常返回 `retryable: true` 和 `retryAfterMs`。客户端应按服务器给出的时长退避。

如果日志反复出现 `AUTH_RATE_LIMITED`，应按暴露事件排查：核对公网入口、可信代理 IP 解析、认证方式和来源地址，而不是靠重启 Gateway 清空内存计数来掩盖问题。

上游来源：[`docs/gateway/security/rate-limiting.md`](https://github.com/openclaw/openclaw/blob/main/docs/gateway/security/rate-limiting.md)。
