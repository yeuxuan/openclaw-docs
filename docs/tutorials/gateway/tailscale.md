---
title: "Tailscale"
sidebarTitle: "Tailscale"
---

# Tailscale（网关（Gateway）仪表盘）

OpenClaw 可以为网关（Gateway）仪表盘和 WebSocket 端口自动配置 Tailscale **Serve**（tailnet）或 **Funnel**（公共）。这使网关（Gateway）保持绑定到 loopback，同时 Tailscale 提供 HTTPS、路由，以及（对于 Serve）身份头。

---

## 模式

- `serve`：仅 Tailnet 的 Serve，通过 `tailscale serve`。网关（Gateway）保持在 `127.0.0.1`。
- `funnel`：公共 HTTPS，通过 `tailscale funnel`。OpenClaw 要求共享密码。
- `off`：默认（无 Tailscale 自动化）。

---

## 认证

设置 `gateway.auth.mode` 来控制握手：

- `token`（设置 `OPENCLAW_GATEWAY_TOKEN` 时默认）
- `password`（通过 `OPENCLAW_GATEWAY_PASSWORD` 或配置的共享密钥）

当 `tailscale.mode = "serve"` 且 `gateway.auth.allowTailscale` 为 `true` 时，有效的 Serve 代理请求可以通过 Tailscale 身份头（`tailscale-user-login`）进行认证，无需提供 Token/密码。OpenClaw 通过本地 Tailscale 守护进程（`tailscale whois`）解析 `x-forwarded-for` 地址并匹配头来验证身份，然后再接受。OpenClaw 仅在请求从 loopback 到达且携带 Tailscale 的 `x-forwarded-for`、`x-forwarded-proto` 和 `x-forwarded-host` 头时才将其视为 Serve。
要求显式凭证，请设置 `gateway.auth.allowTailscale: false` 或强制 `gateway.auth.mode: "password"`。

---

## 配置示例

### 仅 Tailnet（Serve）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

打开：`https://<magicdns>/`（或你配置的 `gateway.controlUi.basePath`）

### 仅 Tailnet（绑定到 Tailnet IP）

当你希望网关（Gateway）直接监听 Tailnet IP 时使用此方式（无 Serve/Funnel）。

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

从另一个 Tailnet 设备连接：

- Control UI：`http://<tailscale-ip>:18789/`
- WebSocket：`ws://<tailscale-ip>:18789`

注意：此模式下 loopback（`http://127.0.0.1:18789`）将**不**工作。

### 公共互联网（Funnel + 共享密码）

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

推荐使用 `OPENCLAW_GATEWAY_PASSWORD` 而非将密码提交到磁盘。

---

## CLI 示例

```bash
openclaw gateway --tailscale serve
openclaw gateway --tailscale funnel --auth password
```

---

## 注意事项

- Tailscale Serve/Funnel 需要安装并登录 `tailscale` CLI。
- `tailscale.mode: "funnel"` 在认证模式不是 `password` 时拒绝启动，以避免公开暴露。
- 如果你希望 OpenClaw 在关闭时撤销 `tailscale serve` 或 `tailscale funnel` 配置，请设置 `gateway.tailscale.resetOnExit`。
- `gateway.bind: "tailnet"` 是直接 Tailnet 绑定（无 HTTPS，无 Serve/Funnel）。
- `gateway.bind: "auto"` 优先 loopback；如果你想仅 Tailnet，使用 `tailnet`。
- Serve/Funnel 仅暴露**网关（Gateway）Control UI + WS**。节点通过相同的网关（Gateway）WS 端点连接，因此 Serve 可用于节点访问。

---

## 浏览器控制（远程网关（Gateway） + 本地浏览器）

如果你在一台机器上运行网关（Gateway）但想在另一台机器上驱动浏览器，在浏览器机器上运行一个**节点宿主**，并保持两者在同一个 tailnet 上。网关（Gateway）将代理浏览器操作到节点；无需单独的控制服务器或 Serve URL。

避免对浏览器控制使用 Funnel；将节点配对视为 operator 访问。

---

## Tailscale 前提条件 + 限制

- Serve 要求为你的 tailnet 启用 HTTPS；如果缺失 CLI 会提示。
- Serve 注入 Tailscale 身份头；Funnel 不会。
- Funnel 要求 Tailscale v1.38.3+、MagicDNS、启用 HTTPS 和 funnel 节点属性。
- Funnel 仅支持端口 `443`、`8443` 和 `10000` 的 TLS。
- macOS 上的 Funnel 需要开源版本的 Tailscale 应用。

---

## 了解更多

- Tailscale Serve 概览：[https://tailscale.com/kb/1312/serve](https://tailscale.com/kb/1312/serve)
- `tailscale serve` 命令：[https://tailscale.com/kb/1242/tailscale-serve](https://tailscale.com/kb/1242/tailscale-serve)
- Tailscale Funnel 概览：[https://tailscale.com/kb/1223/tailscale-funnel](https://tailscale.com/kb/1223/tailscale-funnel)
- `tailscale funnel` 命令：[https://tailscale.com/kb/1311/tailscale-funnel](https://tailscale.com/kb/1311/tailscale-funnel)
