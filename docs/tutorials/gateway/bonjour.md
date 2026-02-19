---
title: "Bonjour 发现"
sidebarTitle: "Bonjour 发现"
---

# Bonjour / mDNS 发现

OpenClaw 使用 Bonjour（mDNS / DNS-SD）作为**仅限局域网的便捷方式**来发现
活跃的网关（Gateway）（WebSocket 端点）。这是尽力而为的机制，**不能**替代 SSH 或
基于 Tailnet 的连接。

---

## 广域 Bonjour（单播 DNS-SD）通过 Tailscale

如果节点和网关（Gateway）在不同网络上，组播 mDNS 无法跨越
边界。你可以通过 Tailscale 切换到**单播 DNS-SD**
（"广域 Bonjour"）来保持相同的发现用户体验。

高层步骤：

1. 在网关（Gateway）主机上运行 DNS 服务器（通过 Tailnet 可达）。
2. 在专用区域下发布 `_openclaw-gw._tcp` 的 DNS-SD 记录
   （示例：`openclaw.internal.`）。
3. 配置 Tailscale **分割 DNS**，使你选择的域名通过该
   DNS 服务器为客户端（包括 iOS）解析。

OpenClaw 支持任何发现域名；`openclaw.internal.` 只是一个示例。
iOS/Android 节点会同时浏览 `local.` 和你配置的广域域名。

### 网关（Gateway）配置（推荐）

```json5
{
  gateway: { bind: "tailnet" }, // 仅 tailnet（推荐）
  discovery: { wideArea: { enabled: true } }, // 启用广域 DNS-SD 发布
}
```

### 一次性 DNS 服务器设置（网关（Gateway）主机）

```bash
openclaw dns setup --apply
```

这会安装 CoreDNS 并将其配置为：

- 仅在网关（Gateway）的 Tailscale 接口上监听 53 端口
- 从 `~/.openclaw/dns/<domain>.db` 提供你选择的域名（示例：`openclaw.internal.`）

从 Tailnet 连接的机器上验证：

```bash
dns-sd -B _openclaw-gw._tcp openclaw.internal.
dig @<TAILNET_IPV4> -p 53 _openclaw-gw._tcp.openclaw.internal PTR +short
```

### Tailscale DNS 设置

在 Tailscale 管理控制台中：

- 添加一个指向网关（Gateway）tailnet IP 的域名服务器（UDP/TCP 53）。
- 添加分割 DNS，使你的发现域名使用该域名服务器。

一旦客户端接受 tailnet DNS，iOS 节点就可以在你的发现域名中浏览
`_openclaw-gw._tcp`，无需组播。

### 网关（Gateway）监听器安全（推荐）

网关（Gateway）WS 端口（默认 `18789`）默认绑定到 loopback。对于局域网/tailnet
访问，需要显式绑定并保持认证启用。

对于仅 tailnet 的设置：

- 在 `~/.openclaw/openclaw.json` 中设置 `gateway.bind: "tailnet"`。
- 重启网关（Gateway）（或重启 macOS 菜单栏应用）。

---

## 广播内容

仅网关（Gateway）广播 `_openclaw-gw._tcp`。

---

## 服务类型

- `_openclaw-gw._tcp` — 网关（Gateway）传输信标（由 macOS/iOS/Android 节点使用）。

---

## TXT 键（非机密提示）

网关（Gateway）广播小型非机密提示以方便 UI 流程：

- `role=gateway`
- `displayName=<friendly name>`
- `lanHost=<hostname>.local`
- `gatewayPort=<port>`（网关（Gateway）WS + HTTP）
- `gatewayTls=1`（仅在启用 TLS 时）
- `gatewayTlsSha256=<sha256>`（仅在启用 TLS 且指纹可用时）
- `canvasPort=<port>`（仅在启用 canvas host 时；当前与 `gatewayPort` 相同）
- `sshPort=<port>`（未覆盖时默认为 22）
- `transport=gateway`
- `cliPath=<path>`（可选；`openclaw` 可执行入口的绝对路径）
- `tailnetDns=<magicdns>`（Tailnet 可用时的可选提示）

安全说明：

- Bonjour/mDNS TXT 记录是**未经认证的**。客户端不应将 TXT 视为权威路由。
- 客户端应使用解析的服务端点（SRV + A/AAAA）进行路由。将 `lanHost`、`tailnetDns`、`gatewayPort` 和 `gatewayTlsSha256` 仅作为提示。
- TLS 固定不得允许广播的 `gatewayTlsSha256` 覆盖之前存储的固定值。
- iOS/Android 节点应将基于发现的直连视为**仅限 TLS**，并在信任首次指纹前要求用户显式确认。

---

## 在 macOS 上调试

有用的内置工具：

- 浏览实例：

  ```bash
  dns-sd -B _openclaw-gw._tcp local.
  ```

- 解析单个实例（替换 `<instance>`）：

  ```bash
  dns-sd -L "<instance>" _openclaw-gw._tcp local.
  ```

如果浏览正常但解析失败，通常是局域网策略或
mDNS 解析器问题。

---

## 在网关（Gateway）日志中调试

网关（Gateway）写入滚动日志文件（启动时打印为
`gateway log file: ...`）。查找 `bonjour:` 行，特别是：

- `bonjour: advertise failed ...`
- `bonjour: ... name conflict resolved` / `hostname conflict resolved`
- `bonjour: watchdog detected non-announced service ...`

---

## 在 iOS 节点上调试

iOS 节点使用 `NWBrowser` 来发现 `_openclaw-gw._tcp`。

要捕获日志：

- 设置 → Gateway → Advanced → **Discovery Debug Logs**
- 设置 → Gateway → Advanced → **Discovery Logs** → 复现 → **Copy**

日志包含浏览器状态转换和结果集变更。

---

## 常见故障模式

- **Bonjour 不跨网络**：使用 Tailnet 或 SSH。
- **组播被阻止**：某些 Wi-Fi 网络禁用了 mDNS。
- **休眠/接口变动**：macOS 可能临时丢失 mDNS 结果；请重试。
- **浏览正常但解析失败**：保持机器名简单（避免表情符号或
  标点），然后重启网关（Gateway）。服务实例名称来源于
  主机名，因此过于复杂的名称可能会混淆某些解析器。

---

## 转义的实例名称（`\032`）

Bonjour/DNS-SD 经常将服务实例名称中的字节转义为十进制 `\DDD`
序列（例如空格变为 `\032`）。

- 这在协议级别是正常的。
- UI 应该解码显示（iOS 使用 `BonjourEscapes.decode`）。

---

## 禁用/配置

- `OPENCLAW_DISABLE_BONJOUR=1` 禁用广播（旧版：`OPENCLAW_DISABLE_BONJOUR`）。
- `~/.openclaw/openclaw.json` 中的 `gateway.bind` 控制网关（Gateway）绑定模式。
- `OPENCLAW_SSH_PORT` 覆盖 TXT 中广播的 SSH 端口（旧版：`OPENCLAW_SSH_PORT`）。
- `OPENCLAW_TAILNET_DNS` 在 TXT 中发布 MagicDNS 提示（旧版：`OPENCLAW_TAILNET_DNS`）。
- `OPENCLAW_CLI_PATH` 覆盖广播的 CLI 路径（旧版：`OPENCLAW_CLI_PATH`）。

---

## 相关文档

- 发现策略和传输选择：[发现](/gateway/discovery)
- 节点配对 + 审批：[网关（Gateway）配对](/gateway/pairing)
