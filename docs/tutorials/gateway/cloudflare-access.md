---
title: "Cloudflare Access 保护 Gateway"
sidebarTitle: "Cloudflare Access"
description: "用 Cloudflare Tunnel 与 Access 保护远程 Gateway，并让 Node 通过 service token 安全加入。"
---

# 用 Cloudflare Access 保护 Gateway

Cloudflare Tunnel 可以让 Gateway 继续只监听回环地址，Access 则在公网入口前增加身份验证。安全边界应是：Gateway 端口只对本机开放，外部流量只能经过 Tunnel 与 Access。

::: danger 不要直接暴露 18789
Cloudflare Access 只保护经过指定 hostname 的流量。确认安全组、防火墙和容器端口没有把 Gateway 原始端口同时暴露到公网。
:::

## 推荐拓扑

1. Gateway 监听 `127.0.0.1:18789` 并启用 Token 或密码认证。
2. `cloudflared` 把一个 HTTPS hostname 转发到本地 Gateway。
3. Access Application 保护整个 hostname。
4. 浏览器用户走交互式身份策略；Node 使用 Access service token。

## Node 加入：优先使用 service token

Access 会保护 join、Gateway WebSocket、worker socket 和 worker transfer 等路径。推荐给 Node 创建 Service Auth policy，并在 Node 主机执行：

```bash
export CF_ACCESS_CLIENT_ID="<client-id>"
export CF_ACCESS_CLIENT_SECRET="<client-secret>"

openclaw connect https://gateway.example.com/j/<code> --service
```

`openclaw connect` 会把这两个值保存为 `gateway.cloudflareAccess.clientId` / `clientSecret` 的环境变量 SecretRef。加入链接不再是单独复制就能用，但无需公开任何 Node 路由。

详细命令见 [connect](/tutorials/cli/connect)。

## 备选：只豁免自认证路由

如果必须保留“只粘贴 join link”的体验，可在 Access 中豁免：

- `/j/*`
- `/__openclaw__/worker`

worker 路由必须保留 WebSocket upgrade。这两条路都有自己的短期凭据：join code 单次使用、有 TTL、按 IP 限流，并对失败返回不透明 404；worker admission 也有独立过期凭据。

这仍会让两个路由可从公网到达，因此只应作为明确权衡后的备选，不要整站绕过 Access。

## 验收

```bash
openclaw gateway status
openclaw nodes status
openclaw logs --follow
```

从未登录浏览器访问 hostname，应进入 Access 登录；使用 service token 的 Node 应能完成 join 并保持 WebSocket。若浏览器可用但 `openclaw connect` 被重定向到登录页，通常是 service token 未应用到全部所需路径，或既没有 service token 也没有正确豁免自认证路由。

上游来源：[`docs/gateway/cloudflare-access.md`](https://github.com/openclaw/openclaw/blob/main/docs/gateway/cloudflare-access.md)。
