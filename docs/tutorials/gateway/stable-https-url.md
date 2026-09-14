---
title: "稳定的 Tailscale HTTPS 地址"
sidebarTitle: "稳定 HTTPS 地址"
description: "用 Tailscale Serve 给只监听回环地址的 Gateway 提供稳定、仅 tailnet 可访问的 HTTPS/WSS 地址。"
---

# 给 Gateway 一个稳定的 HTTPS 地址

Tailscale Serve 可以让 Gateway 继续只监听 `127.0.0.1`，同时提供 `https://<host>.<tailnet>.ts.net` 和对应的 `wss://` 地址。它不会把端口暴露到 LAN 或公网。

开始前要启用 MagicDNS 与 HTTPS 证书，Gateway 主机已登录 Tailscale，并配置 Token、密码或可信代理认证；不能与 `gateway.auth.mode: "none"` 组合。

## 配置

```bash
openclaw config set gateway.bind loopback
openclaw config set gateway.tailscale.mode serve
openclaw gateway restart
```

可选地允许经过验证的 Tailscale 身份头满足控制 UI WebSocket 共享密钥检查：

```bash
openclaw config set gateway.auth.allowTailscale true
```

这个开关不会替 HTTP API 认证、设备身份或 Node 配对；它只对经过 Serve、来源为回环并通过 `tailscale whois` 核验的请求生效。

## 验收

```bash
tailscale serve status
curl -sS -o /dev/null -w '%{http_code}\n' \
  https://<host>.<tailnet>.ts.net/
lsof -nP -iTCP:18789 -sTCP:LISTEN
```

期望 HTTPS 返回 `200`，而 Gateway 自身仍只监听 `127.0.0.1:18789`。如果 Gateway 主机能打开、其他 tailnet 设备超时，先检查 Tailscale ACL/Grants 是否允许客户端访问该主机的 TCP 443。

客户端连接地址使用：

```text
wss://<host>.<tailnet>.ts.net
```

上游来源：[`docs/gateway/stable-https-url.md`](https://github.com/openclaw/openclaw/blob/main/docs/gateway/stable-https-url.md)。
