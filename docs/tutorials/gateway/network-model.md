---
title: "网络模型"
sidebarTitle: "网络模型"
---

大多数操作通过网关（Gateway）（`openclaw gateway`）进行，这是一个长时间运行的
进程，拥有通道（Channel）连接和 WebSocket 控制平面。

## 核心规则

- 推荐每个主机一个网关（Gateway）。它是唯一允许拥有 WhatsApp Web 会话（Session）的进程。对于救援机器人或严格隔离，使用隔离的 profile 和端口运行多个网关（Gateway）。参阅[多网关（Gateway）](/gateway/multiple-gateways)。
- Loopback 优先：网关（Gateway）WS 默认为 `ws://127.0.0.1:18789`。向导默认生成网关（Gateway）Token，即使是 loopback。对于 tailnet 访问，运行 `openclaw gateway --bind tailnet --token ...`，因为非 loopback 绑定需要 Token。
- 节点通过局域网、tailnet 或 SSH 按需连接到网关（Gateway）WS。旧版 TCP 桥接已弃用。
- Canvas host 由网关（Gateway）HTTP 服务器在**相同端口**上提供（默认 `18789`）：
  - `/__openclaw__/canvas/`
  - `/__openclaw__/a2ui/`
    当配置了 `gateway.auth` 且网关（Gateway）绑定超出 loopback 时，这些路由受网关（Gateway）认证保护（loopback 请求豁免）。参阅[网关（Gateway）配置](/gateway/configuration)（`canvasHost`、`gateway`）。
- 远程使用通常通过 SSH 隧道或 tailnet VPN。参阅[远程访问](/gateway/remote)和[发现](/gateway/discovery)。
