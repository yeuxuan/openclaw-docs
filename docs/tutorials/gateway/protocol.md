---
title: "网关（Gateway）协议"
sidebarTitle: "网关"
description: "OpenClaw Gateway：网关（Gateway）协议（WebSocket）。网关（Gateway）WS 协议是 OpenClaw 的单一控制平面 + 节点传输。所有客户端（CLI、Web U…"
---

# 网关（Gateway）协议（WebSocket）

网关（Gateway）WS 协议是 OpenClaw 的单一控制平面 + 节点传输。所有客户端（CLI、Web UI、macOS 应用、iOS/Android 节点、无头节点）通过 WebSocket 连接，并在握手时声明其角色 + 作用域。

---

## 传输

- WebSocket，文本帧包含 JSON 载荷。
- 第一帧必须是 `connect` 请求。

---

## 握手（connect）

网关（Gateway）到客户端（预连接质询）：

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": { "nonce": "…", "ts": 1737264000000 }
}
```

客户端到网关（Gateway）：

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

网关（Gateway）到客户端：

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
    "caps": ["camera", "canvas", "screen", "location", "voice", "talk"],
    "commands": ["camera.snap", "canvas.navigate", "screen.record", "location.get", "talk.ptt.start"],
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

- 请求：`{type:"req", id, method, params}`
- 响应：`{type:"res", id, ok, payload|error}`
- 事件：`{type:"event", event, payload, seq?, stateVersion?}`

有副作用的方法需要幂等键（参阅 schema）。

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

- `caps`：高层能力类别，例如 `camera`、`canvas`、`screen`、`location`、`voice`、`talk`。
- `commands`：invoke 的命令白名单。
- `permissions`：粒度开关（例如 `screen.record`、`camera.capture`）。

网关（Gateway）将这些视为声明并强制执行服务端白名单。

---

## Talk RPC 速查

Talk 相关 RPC 统一走 Gateway 协议：

- `talk.catalog`：返回 Talk provider 目录，包括 speech、streaming transcription、realtime voice 的 provider、model、voice、mode、transport、brain 能力，不返回密钥。
- `talk.config`：返回有效 Talk 配置；带密钥需要 `operator.talk.secrets` 或 `operator.admin`。
- `talk.client.create`：创建客户端持有的 realtime provider 会话，例如浏览器 WebRTC 或 provider WebSocket。
- `talk.client.toolCall`：客户端把 provider tool call 转给 Gateway 策略处理，当前核心用途是 `openclaw_agent_consult`。
- `talk.session.create`：创建 Gateway 持有的 `realtime/gateway-relay`、`transcription/gateway-relay` 或 `stt-tts/managed-room` 会话。
- `talk.session.appendAudio`：向 Gateway Talk session 追加 base64 PCM 音频。
- `talk.session.startTurn` / `talk.session.endTurn` / `talk.session.cancelTurn`：管理 managed-room 的一轮说话生命周期。
- `talk.session.cancelOutput`：停止助手音频输出，常用于插话打断。
- `talk.session.submitToolResult`：把 Gateway-owned realtime relay session 里的 provider tool call 结果提交回去。
- `talk.session.close`：关闭 Gateway 管理的 Talk session。
- `talk.event`：统一的 Talk 事件通道，覆盖 realtime、transcription、STT/TTS、managed-room、电话和会议适配器。
- `talk.speak`：通过当前 Talk speech provider 合成语音。

---

## 在线状态

- `system-presence` 返回按设备标识为键的条目。
- 在线状态条目包含 `deviceId`、`roles` 和 `scopes`，以便 UI 即使设备同时以 operator 和 node 连接，也能为每个设备显示单行。

### 节点辅助方法

- 节点可以调用 `skills.bins` 获取当前技能可执行文件列表，用于自动允许检查。

---

## 执行审批

- 当执行请求需要审批时，网关（Gateway）广播 `exec.approval.requested`。
- Operator 客户端通过调用 `exec.approval.resolve` 来解决（需要 `operator.approvals` 作用域）。

---

## 环境发现

Gateway 协议现在提供两个只读环境方法：

- `environments.list`
- `environments.status`

把它翻成人话：

- `environments.list` 用来问 Gateway：“现在有哪些地方可以跑任务？”
- `environments.status` 用来问 Gateway：“这个地方现在能不能用？”

返回结果里常见字段：

| 字段 | 人话解释 |
|------|----------|
| `id` | 环境编号，例如 `gateway` 或 `node:xxx` |
| `type` | 环境类型，例如 Gateway 本机或节点 |
| `label` | 给人看的名字 |
| `status` | 是否可用，例如 `available` / `unavailable` / `error` |
| `capabilities` | 这个环境声明自己会做什么 |

它是只读接口。客户端可以看环境、查状态，但不能通过这两个方法创建或删除环境。

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
- 配对后，网关（Gateway）签发一个作用域为连接角色 + 作用域的设备 Token。它在 `hello-ok.auth.deviceToken` 中返回，客户端应将其持久化以供后续连接使用。
- 设备 Token 可以通过 `device.token.rotate` 和 `device.token.revoke` 进行轮换/撤销（需要 `operator.pairing` 作用域）。

---

## 设备标识 + 配对

- 节点应包含从密钥对指纹派生的稳定设备标识（`device.id`）。
- 网关（Gateway）按设备 + 角色签发 Token。
- 新设备 ID 需要配对审批，除非启用了本地自动审批。
- 本地连接包括 loopback 和网关（Gateway）主机自身的 tailnet 地址（因此同主机 tailnet 绑定仍可自动审批）。
- 所有 WS 客户端在 `connect` 期间必须包含 `device` 标识（operator + node）。Control UI 仅在启用 `gateway.controlUi.allowInsecureAuth` 时才可以省略它（或使用 `gateway.controlUi.dangerouslyDisableDeviceAuth` 作为紧急措施）。
- 非本地连接必须签名服务端提供的 `connect.challenge` nonce。

---

## TLS + 固定

- WS 连接支持 TLS。
- 客户端可以可选地固定网关（Gateway）证书指纹（参阅 `gateway.tls` 配置以及 `gateway.remote.tlsFingerprint` 或 CLI `--tls-fingerprint`）。

---

## 范围

### 客户端兼容和重试

- 仅当 `hello-ok.features.capabilities` 包含 `session-scoped-chat-metadata` 时，才给 `chat.metadata` 传 `sessionKey`。旧 Gateway 返回的是 Agent 范围能力，方法名存在不代表支持会话级元数据。
- `sessions.changed` 删除通知若带 `sessionId`，只能删除缓存中同代次的会话；相同 key 已指向新 ID 时不要删除新会话。只有 key 或无行的全局通知用于失效并重读列表，不足以证明当前代次已删除。
- `sessions.groups.put` 只替换分组名与顺序，不能省略仍有成员的分组来隐式删除；先显式 delete。改成员关系使用会话 patch。
- `openclaw.setup.verify` 在保存配置尚未应用、重启未完成或探测中运行态变化时返回 `ok: false, status: "unavailable"`。保留所选模型，等应用/重启完成再重试，不要把它当成模型凭据失败。
- 节点只有尚未执行 handler、尚未发出进度且因生命周期清理阻止执行时才能返回 `NODE_NOT_READY`，Gateway 在原始 deadline 内最多重试四次并复查授权。一般断线、超时、`UNAVAILABLE` 或已有进度的失败不会自动重放。

新客户端不要写旧 `execSecurity` / `execAsk` 字段；即使为 `null` 也会被拒绝，改用[会话权限模式](/tutorials/gateway/permission-modes)。

此协议暴露完整的网关（Gateway）API（状态、通道（Channel）、模型、聊天、智能体（Agent）、会话（Session）、节点、审批、环境发现等）。确切的接口由 `src/gateway/protocol/schema.ts` 中的 TypeBox schema 定义。
