---
title: "远程访问"
sidebarTitle: "远程访问"
---

# 远程访问（SSH、隧道和 tailnet）

本仓库支持"SSH 远程"模式，通过在专用主机（桌面/服务器）上保持单个网关（Gateway）（主控）运行，并将客户端连接到它。

- 对于 **operator（你 / macOS 应用）**：SSH 隧道是通用的回退方案。
- 对于**节点（iOS/Android 和未来设备）**：连接到网关（Gateway）**WebSocket**（局域网/tailnet 或根据需要使用 SSH 隧道）。

---

## 核心理念

- 网关（Gateway）WebSocket 绑定到配置端口上的 **loopback**（默认 18789）。
- 对于远程使用，你通过 SSH 转发该 loopback 端口（或使用 tailnet/VPN 减少隧道需求）。

---

## 常见的 VPN/tailnet 设置（智能体（Agent）所在位置）

将**网关（Gateway）主机**视为"智能体（Agent）所在的地方"。它拥有会话（Session）、认证 profile、通道（Channel）和状态。
你的笔记本/桌面（和节点）连接到该主机。

### 1) tailnet 中的常驻网关（Gateway）（VPS 或家庭服务器）

在持久主机上运行网关（Gateway），通过 **Tailscale** 或 SSH 访问。

- **最佳体验：**保持 `gateway.bind: "loopback"` 并使用 **Tailscale Serve** 提供 Control UI。
- **回退方案：**保持 loopback + 从任何需要访问的机器建立 SSH 隧道。
- **示例：**[exe.dev](/install/exe-dev)（简易 VM）或 [Hetzner](/install/hetzner)（生产 VPS）。

当你的笔记本经常休眠但希望智能体（Agent）始终在线时，这是理想方案。

### 2) 家庭桌面运行网关（Gateway），笔记本作为远程控制

笔记本**不**运行智能体（Agent）。它远程连接：

- 使用 macOS 应用的**远程 SSH**模式（设置 → 通用 → "OpenClaw 运行位置"）。
- 应用打开并管理隧道，因此 WebChat + 健康检查"开箱即用"。

操作手册：[macOS 远程访问](/platforms/mac/remote)。

### 3) 笔记本运行网关（Gateway），从其他机器远程访问

保持网关（Gateway）在本地但安全地暴露：

- 从其他机器建立到笔记本的 SSH 隧道，或
- Tailscale Serve 提供 Control UI 并保持网关（Gateway）仅 loopback。

指南：[Tailscale](/gateway/tailscale) 和 [Web 概览](/web)。

---

## 命令流程（什么在哪里运行）

一个网关（Gateway）服务拥有状态 + 通道（Channel）。节点是外围设备。

流程示例（Telegram → 节点）：

- Telegram 消息到达**网关（Gateway）**。
- 网关（Gateway）运行**智能体（Agent）**并决定是否调用节点工具。
- 网关（Gateway）通过网关（Gateway）WebSocket 调用**节点**（`node.*` RPC）。
- 节点返回结果；网关（Gateway）将回复发回 Telegram。

注意：

- **节点不运行网关（Gateway）服务。**除非你有意运行隔离的 profile，否则每台主机只应运行一个网关（Gateway）（参阅[多网关（Gateway）](/gateway/multiple-gateways)）。
- macOS 应用的"节点模式"只是通过网关（Gateway）WebSocket 的节点客户端。

---

## SSH 隧道（CLI + 工具）

创建到远程网关（Gateway）WS 的本地隧道：

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

隧道建立后：

- `openclaw health` 和 `openclaw status --deep` 现在通过 `ws://127.0.0.1:18789` 到达远程网关（Gateway）。
- `openclaw gateway {status,health,send,agent,call}` 也可以在需要时通过 `--url` 目标转发 URL。

注意：将 `18789` 替换为你配置的 `gateway.port`（或 `--port`/`OPENCLAW_GATEWAY_PORT`）。
注意：当你传入 `--url` 时，CLI 不会回退到配置或环境凭证。
需要显式包含 `--token` 或 `--password`。缺少显式凭证会导致错误。

---

## CLI 远程默认值

你可以持久化远程目标，以便 CLI 命令默认使用它：

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

当网关（Gateway）仅 loopback 时，保持 URL 为 `ws://127.0.0.1:18789` 并先打开 SSH 隧道。

---

## SSH 上的聊天 UI

WebChat 不再使用单独的 HTTP 端口。SwiftUI 聊天 UI 直接连接到网关（Gateway）WebSocket。

- 通过 SSH 转发 `18789`（见上文），然后将客户端连接到 `ws://127.0.0.1:18789`。
- 在 macOS 上，推荐使用应用的"远程 SSH"模式，它会自动管理隧道。

---

## macOS 应用"远程 SSH"

macOS 菜单栏应用可以端到端驱动相同的设置（远程状态检查、WebChat 和语音唤醒转发）。

操作手册：[macOS 远程访问](/platforms/mac/remote)。

---

## 安全规则（远程/VPN）

简而言之：除非你确定需要绑定，否则**保持网关（Gateway）仅 loopback**。

- **Loopback + SSH/Tailscale Serve** 是最安全的默认设置（无公开暴露）。
- **非 loopback 绑定**（`lan`/`tailnet`/`custom`，或 loopback 不可用时的 `auto`）必须使用认证 Token/密码。
- `gateway.remote.token` **仅**用于远程 CLI 调用——它**不会**启用本地认证。
- `gateway.remote.tlsFingerprint` 在使用 `wss://` 时固定远程 TLS 证书。
- **Tailscale Serve** 在 `gateway.auth.allowTailscale: true` 时可通过身份头进行认证。如果你想使用 Token/密码代替，将其设为 `false`。
- 将浏览器控制视为 operator 访问：仅 tailnet + 有意的节点配对。

深入了解：[安全](/gateway/security)。
