---
title: "桥接协议"
sidebarTitle: "桥接协议"
---

# 桥接协议（旧版节点传输）

桥接协议是一种**旧版**节点传输协议（TCP JSONL）。新的节点客户端
应改用统一的网关（Gateway）WebSocket 协议。

如果你正在构建运维工具或节点客户端，请使用
[网关（Gateway）协议](/gateway/protocol)。

**注意：**当前的 OpenClaw 版本不再提供 TCP 桥接监听器；本文档仅作为历史参考保留。
旧版 `bridge.*` 配置键不再属于配置架构的一部分。

---

## 为什么同时存在两种协议

- **安全边界**：桥接暴露一个小的白名单，而不是
  完整的网关（Gateway）API 接口。
- **配对 + 节点身份**：节点准入由网关（Gateway）管理，并与
  每个节点的 Token 关联。
- **发现用户体验**：节点可以通过局域网上的 Bonjour 发现网关（Gateway），或直接
  通过 tailnet 连接。
- **Loopback WS**：完整的 WS 控制平面保持本地，除非通过 SSH 隧道转发。

---

## 传输

- TCP，每行一个 JSON 对象（JSONL）。
- 可选 TLS（当 `bridge.tls.enabled` 为 true 时）。
- 旧版默认监听端口为 `18790`（当前版本不启动 TCP 桥接）。

启用 TLS 时，发现 TXT 记录包含 `bridgeTls=1` 和
`bridgeTlsSha256` 作为非机密提示。注意，Bonjour/mDNS TXT 记录是
未经认证的；客户端不应将广播的指纹视为
权威固定值，除非有明确的用户意图或其他带外验证。

---

## 握手 + 配对

1. 客户端发送 `hello`，包含节点元数据 + Token（如果已配对）。
2. 如果未配对，网关（Gateway）回复 `error`（`NOT_PAIRED`/`UNAUTHORIZED`）。
3. 客户端发送 `pair-request`。
4. 网关（Gateway）等待审批，然后发送 `pair-ok` 和 `hello-ok`。

`hello-ok` 返回 `serverName`，可能包含 `canvasHostUrl`。

---

## 帧

客户端 → 网关（Gateway）：

- `req` / `res`：作用域限定的网关（Gateway）RPC（chat、sessions、config、health、voicewake、skills.bins）
- `event`：节点信号（语音转录、智能体（Agent）请求、聊天订阅、exec 生命周期）

网关（Gateway）→ 客户端：

- `invoke` / `invoke-res`：节点命令（`canvas.*`、`camera.*`、`screen.record`、
  `location.get`、`sms.send`）
- `event`：已订阅会话（Session）的聊天更新
- `ping` / `pong`：保活

旧版白名单执行位于 `src/gateway/server-bridge.ts`（已移除）。

---

## Exec 生命周期事件

节点可以发出 `exec.finished` 或 `exec.denied` 事件来展示 system.run 活动。
这些在网关（Gateway）中映射为系统事件。（旧版节点可能仍会发出 `exec.started`。）

负载字段（除非注明否则均为可选）：

- `sessionKey`（必需）：接收系统事件的智能体（Agent）会话（Session）。
- `runId`：用于分组的唯一 exec id。
- `command`：原始或格式化的命令字符串。
- `exitCode`、`timedOut`、`success`、`output`：完成详情（仅 finished）。
- `reason`：拒绝原因（仅 denied）。

---

## Tailnet 使用

- 将桥接绑定到 tailnet IP：在 `~/.openclaw/openclaw.json` 中设置
  `bridge.bind: "tailnet"`。
- 客户端通过 MagicDNS 名称或 tailnet IP 连接。
- Bonjour **不会**跨网络；需要时使用手动 host/port 或广域 DNS-SD。

---

## 版本控制

桥接当前为**隐式 v1**（无 min/max 协商）。预期向后兼容；
在任何破坏性变更之前添加桥接协议版本字段。
