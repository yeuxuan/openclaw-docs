---
title: "网关（Gateway）协议"
sidebarTitle: "网关"
---

# 网关（Gateway）协议（WebSocket）

网关（Gateway）WS 协议是 OpenClaw 的**单一控制平面 + 节点传输**。所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）通过 WebSocket 连接，并在握手时声明其**角色** + **作用域**。

---

## 传输

- WebSocket，文本帧包含 JSON 载荷。
- 第一帧**必须**是 `connect` 请求。

---

## 握手（connect）

网关（Gateway） → 客户端（预连接质询）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端 → 网关（Gateway）：

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "operator"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-cli/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

网关（Gateway） → 客户端：

```json
{
  "type": "res",
  "id": "…",
  "ok": true,
  "payload": { "type": "hello-ok", "protocol": 3, "policy": { "tickIntervalMs": 15000 } }
}
```

当签发设备 Token 时，`hello-ok` 还包含：

```json
{
  "auth": {
    "deviceToken": "…",
    "role": "operator",
    "scopes": ["operator.read", "operator.write"]
  }
}
```

### 节点示例

```json
{
  "type": "req",
  "id": "…",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "ios-node",
      "version": "1.2.3",
      "platform": "ios",
      "mode": "node"
    },
    "role": "node",
    "scopes": [],
    "caps": ["camera", "canvas", "screen", "location", "voice"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    "permissions": { "camera.capture": true, "screen.record": false },
    "auth": { "token": "…" },
    "locale": "en-US",
    "userAgent": "openclaw-ios/1.2.3",
    "device": {
      "id": "device_fingerprint",
      "publicKey": "…",
      "signature": "…",
      "signedAt": 1737264000000,
      "nonce": "…"
    }
  }
}
```

---

## 帧格式

- **请求**：`{type:"req", id, method, params}`
- **响应**：`{type:"res", id, ok, payload|error}`
- **事件**：`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要**幂等键**（参阅 schema）。

---

## 角色 + 作用域

### 角色

- `operator` = 控制平面客户端（CLI/UI/自动化）。
- `node` = 能力宿主（camera/screen/canvas/system.run）。

### 作用域（operator）

常见作用域：

- `operator.read`
- `operator.write`
- `operator.admin`
- `operator.approvals`
- `operator.pairing`

### 能力/命令/权限（node）

节点在连接时声明能力声明：

- `caps`：高层能力类别。
- `commands`：invoke 的命令白名单。
- `permissions`：粒度开关（例如 `screen.record`、`camera.capture`）。

网关（Gateway）将这些视为**声明**并强制执行服务端白名单。

---

## 在线状态

- `system-presence` 返回按设备标识为键的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，以便 UI 即使设备同时以 **operator** 和 **node** 连接，也能为每个设备显示单行。

### 节点辅助方法

- 节点可以调用 `skills.bins` 获取当前技能可执行文件列表，用于自动允许检查。

---

## 执行审批

- 当执行请求需要审批时，网关（Gateway）广播 `exec.approval.requested`。
- Operator 客户端通过调用 `exec.approval.resolve` 来解决（需要 `operator.approvals` 作用域）。

---

## 版本管理

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务端拒绝不匹配的版本。
- Schema 和模型从 TypeBox 定义生成：
  - `pnpm protocol:gen`
  - `pnpm protocol:gen:swift`
  - `pnpm protocol:check`

---

## 认证

- 如果设置了 `OPENCLAW_GATEWAY_TOKEN`（或 `--token`），`connect.params.auth.token` 必须匹配，否则套接字将被关闭。
- 配对后，网关（Gateway）签发一个作用域为连接角色 + 作用域的**设备 Token**。它在 `hello-ok.auth.deviceToken` 中返回，客户端应将其持久化以供后续连接使用。
- 设备 Token 可以通过 `device.token.rotate` 和 `device.token.revoke` 进行轮换/撤销（需要 `operator.pairing` 作用域）。

---

## 设备标识 + 配对

- 节点应包含从密钥对指纹派生的稳定设备标识（`device.id`）。
- 网关（Gateway）按设备 + 角色签发 Token。
- 新设备 ID 需要配对审批，除非启用了本地自动审批。
- **本地**连接包括 loopback 和网关（Gateway）主机自身的 tailnet 地址（因此同主机 tailnet 绑定仍可自动审批）。
- 所有 WS 客户端在 `connect` 期间必须包含 `device` 标识（operator + node）。Control UI 仅在启用 `gateway.controlUi.allowInsecureAuth` 时才可以省略它（或使用 `gateway.controlUi.dangerouslyDisableDeviceAuth` 作为紧急措施）。
- 非本地连接必须签名服务端提供的 `connect.challenge` nonce。

---

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以可选地固定网关（Gateway）证书指纹（参阅 `gateway.tls` 配置以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

---

## 范围

此协议暴露**完整的网关（Gateway）API**（状态、通道（Channel）、模型、聊天、智能体（Agent）、会话（Session）、节点、审批等）。确切的接口由 `src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。
