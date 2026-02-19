---
title: "网关（Gateway）配对"
sidebarTitle: "网关"
---

# 网关（Gateway）配对（方案 B）

在网关（Gateway）配对中，**网关（Gateway）**是哪些节点被允许加入的权威来源。
UI（macOS 应用、未来客户端）只是批准或拒绝待处理请求的前端。

**重要提示：**WS 节点在 `connect` 期间使用**设备配对**（角色 `node`）。
`node.pair.*` 是一个独立的配对存储，**不会**控制 WS 握手。
只有显式调用 `node.pair.*` 的客户端使用此流程。

---

## 概念

- **待处理请求**：节点请求加入；需要审批。
- **已配对节点**：已批准的节点，拥有签发的认证 Token。
- **传输**：网关（Gateway）WS 端点转发请求但不决定
  成员资格。（旧版 TCP 桥接支持已弃用/移除。）

---

## 配对工作原理

1. 节点连接到网关（Gateway）WS 并请求配对。
2. 网关（Gateway）存储一个**待处理请求**并发出 `node.pair.requested`。
3. 你批准或拒绝请求（CLI 或 UI）。
4. 批准后，网关（Gateway）签发一个**新 Token**（重新配对时 Token 会轮换）。
5. 节点使用 Token 重新连接，现在已"配对"。

待处理请求在 **5 分钟**后自动过期。

---

## CLI 工作流程（支持无头环境）

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` 显示已配对/已连接的节点及其能力。

---

## API 接口（网关（Gateway）协议）

事件：

- `node.pair.requested` — 当新的待处理请求创建时发出。
- `node.pair.resolved` — 当请求被批准/拒绝/过期时发出。

方法：

- `node.pair.request` — 创建或复用待处理请求。
- `node.pair.list` — 列出待处理 + 已配对节点。
- `node.pair.approve` — 批准待处理请求（签发 Token）。
- `node.pair.reject` — 拒绝待处理请求。
- `node.pair.verify` — 验证 `{ nodeId, token }`。

注意：

- `node.pair.request` 对每个节点是幂等的：重复调用返回相同的
  待处理请求。
- 批准**总是**生成新 Token；`node.pair.request` 永远不会返回 Token。
- 请求可以包含 `silent: true` 作为自动批准流程的提示。

---

## 自动批准（macOS 应用）

macOS 应用可以在以下情况下可选地尝试**静默批准**：

- 请求标记为 `silent`，且
- 应用可以使用相同用户验证到网关（Gateway）主机的 SSH 连接。

如果静默批准失败，它会回退到正常的"批准/拒绝"提示。

---

## 存储（本地，私有）

配对状态存储在网关（Gateway）状态目录下（默认 `~/.openclaw`）：

- `~/.openclaw/nodes/paired.json`
- `~/.openclaw/nodes/pending.json`

如果你覆盖了 `OPENCLAW_STATE_DIR`，`nodes/` 文件夹会随之移动。

安全说明：

- Token 是密钥；将 `paired.json` 视为敏感文件。
- 轮换 Token 需要重新批准（或删除节点条目）。

---

## 传输行为

- 传输是**无状态的**；它不存储成员资格。
- 如果网关（Gateway）离线或配对被禁用，节点无法配对。
- 如果网关（Gateway）处于远程模式，配对仍然针对远程网关（Gateway）的存储进行。
