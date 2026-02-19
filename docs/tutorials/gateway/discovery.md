---
title: "发现与传输"
sidebarTitle: "发现与传输"
---

# 发现与传输

OpenClaw 有两个看起来相似但本质不同的问题：

1. **运维远程控制**：macOS 菜单栏应用控制在其他地方运行的网关（Gateway）。
2. **节点配对**：iOS/Android（以及未来的节点）发现网关（Gateway）并安全配对。

设计目标是将所有网络发现/广播保留在**节点网关（Gateway）**（`openclaw gateway`）中，让客户端（mac 应用、iOS）作为消费者。

---

## 术语

- **网关（Gateway）**：一个长时间运行的网关（Gateway）进程，拥有状态（会话（Session）、配对、节点注册表）并运行通道（Channel）。大多数场景每个主机使用一个；隔离的多网关（Gateway）设置也是可行的。
- **网关（Gateway）WS（控制平面）**：默认在 `127.0.0.1:18789` 上的 WebSocket 端点；可通过 `gateway.bind` 绑定到局域网/tailnet。
- **直连 WS 传输**：面向局域网/tailnet 的网关（Gateway）WS 端点（无 SSH）。
- **SSH 传输（回退）**：通过 SSH 转发 `127.0.0.1:18789` 进行远程控制。
- **旧版 TCP 桥接（已弃用/移除）**：旧的节点传输（参阅[桥接协议](/gateway/bridge-protocol)）；不再用于发现广播。

协议详情：

- [网关（Gateway）协议](/gateway/protocol)
- [桥接协议（旧版）](/gateway/bridge-protocol)

---

## 为什么同时保留"直连"和 SSH

- **直连 WS** 在同一网络和 tailnet 内提供最佳用户体验：
  - 通过 Bonjour 在局域网上自动发现
  - 配对 Token + ACL 由网关（Gateway）管理
  - 无需 shell 访问；协议接口可以保持紧凑和可审计
- **SSH** 仍然是通用回退方案：
  - 在任何有 SSH 访问的地方都可工作（即使跨不相关的网络）
  - 不受组播/mDNS 问题影响
  - 除 SSH 外不需要新的入站端口

---

## 发现输入（客户端如何获知网关（Gateway）位置）

### 1) Bonjour / mDNS（仅限局域网）

Bonjour 是尽力而为的，不跨网络。它仅用于"同一局域网"的便利。

目标方向：

- **网关（Gateway）**通过 Bonjour 广播其 WS 端点。
- 客户端浏览并显示"选择网关（Gateway）"列表，然后存储所选端点。

故障排查和信标详情：[Bonjour](/gateway/bonjour)。

#### 服务信标详情

- 服务类型：
  - `_openclaw-gw._tcp`（网关（Gateway）传输信标）
- TXT 键（非机密）：
  - `role=gateway`
  - `lanHost=<hostname>.local`
  - `sshPort=22`（或广播的端口）
  - `gatewayPort=18789`（网关（Gateway）WS + HTTP）
  - `gatewayTls=1`（仅在启用 TLS 时）
  - `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
  - `canvasPort=<port>`（canvas host 端口；当启用 canvas host 时当前与 `gatewayPort` 相同）
  - `cliPath=<path>`（可选；`openclaw` 可运行入口或二进制文件的绝对路径）
  - `tailnetDns=<magicdns>`（可选提示；Tailscale 可用时自动检测）

安全说明：

- Bonjour/mDNS TXT 记录是**未经认证的**。客户端必须仅将 TXT 值视为用户体验提示。
- 路由（主机/端口）应优先使用**解析的服务端点**（SRV + A/AAAA）而非 TXT 提供的 `lanHost`、`tailnetDns` 或 `gatewayPort`。
- TLS 固定不得允许广播的 `gatewayTlsSha256` 覆盖之前存储的固定值。
- iOS/Android 节点应将基于发现的直连视为**仅限 TLS**，并在存储首次固定值之前要求明确的"信任此指纹"确认（带外验证）。

禁用/覆盖：

- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广播。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制网关（Gateway）绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖 TXT 中广播的 SSH 端口（默认 22）。
- `OPENCLAW_TAILNET_DNS` 发布 `tailnetDns` 提示（MagicDNS）。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径。

### 2) Tailnet（跨网络）

对于伦敦/维也纳式的部署场景，Bonjour 无法帮助。推荐的"直连"目标是：

- Tailscale MagicDNS 名称（首选）或稳定的 tailnet IP。

如果网关（Gateway）能检测到它在 Tailscale 下运行，它会将 `tailnetDns` 作为客户端的可选提示发布（包括广域信标）。

### 3) 手动/SSH 目标

当没有直连路由（或直连被禁用）时，客户端始终可以通过 SSH 转发 loopback 网关（Gateway）端口来连接。

参阅[远程访问](/gateway/remote)。

---

## 传输选择（客户端策略）

推荐的客户端行为：

1. 如果已配对的直连端点已配置且可达，则使用它。
2. 否则，如果 Bonjour 在局域网上找到网关（Gateway），提供一键"使用此网关（Gateway）"选择并将其保存为直连端点。
3. 否则，如果配置了 tailnet DNS/IP，尝试直连。
4. 否则，回退到 SSH。

---

## 配对 + 认证（直连传输）

网关（Gateway）是节点/客户端准入的权威来源。

- 配对请求在网关（Gateway）中创建/批准/拒绝（参阅[网关（Gateway）配对](/gateway/pairing)）。
- 网关（Gateway）强制执行：
  - 认证（Token / 密钥对）
  - 作用域/ACL（网关（Gateway）不是对每个方法的原始代理）
  - 速率限制

---

## 各组件职责

- **网关（Gateway）**：广播发现信标，拥有配对决策权，托管 WS 端点。
- **macOS 应用**：帮助你选择网关（Gateway），显示配对提示，仅将 SSH 作为回退方案使用。
- **iOS/Android 节点**：将 Bonjour 浏览作为便捷方式，连接到已配对的网关（Gateway）WS。
