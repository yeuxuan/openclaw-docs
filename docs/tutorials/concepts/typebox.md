---
title: "TypeBox"
sidebarTitle: "TypeBox"
---

# TypeBox 作为协议的唯一事实来源

最后更新：2026-01-10

TypeBox 是一个 TypeScript 优先的 schema 库。我们用它来定义 **网关 WebSocket 协议**（握手、请求/响应、服务器事件）。这些 schema 驱动 **运行时验证**、**JSON Schema 导出** 和为 macOS 应用生成的 **Swift 代码**。一个事实来源；其他一切都是生成的。

如果你想了解更高层的协议上下文，从[网关架构](/concepts/architecture)开始。

---

## 心智模型（30 秒）

每个网关 WS 消息都是三种帧之一：

- **Request**：`{ type: "req", id, method, params }`
- **Response**：`{ type: "res", id, ok, payload | error }`
- **Event**：`{ type: "event", event, payload, seq?, stateVersion? }`

第一帧 **必须** 是 `connect` 请求。之后，客户端可以调用方法（如 `health`、`send`、`chat.send`）并订阅事件（如 `presence`、`tick`、`agent`）。

连接流程（最小化）：

```
Client                    Gateway
  |---- req:connect -------->|
  |<---- res:hello-ok --------|
  |<---- event:tick ----------|
  |---- req:health ---------->|
  |<---- res:health ----------|
```

常用方法 + 事件：

| 类别      | 示例                                                       | 注意                                |
| --------- | --------------------------------------------------------- | ---------------------------------- |
| 核心      | `connect`、`health`、`status`                              | `connect` 必须第一个               |
| 消息      | `send`、`poll`、`agent`、`agent.wait`                      | 有副作用的需要 `idempotencyKey`     |
| 聊天      | `chat.history`、`chat.send`、`chat.abort`、`chat.inject`   | WebChat 使用这些                    |
| 会话      | `sessions.list`、`sessions.patch`、`sessions.delete`       | 会话管理                            |
| 节点      | `node.list`、`node.invoke`、`node.pair.*`                  | 网关 WS + 节点操作                  |
| 事件      | `tick`、`presence`、`agent`、`chat`、`health`、`shutdown`   | 服务器推送                          |

权威列表在 `src/gateway/server.ts`（`METHODS`、`EVENTS`）中。

---

## Schema 位置

- 源：`src/gateway/protocol/schema.ts`
- 运行时验证器（AJV）：`src/gateway/protocol/index.ts`
- 服务器握手 + 方法分发：`src/gateway/server.ts`
- 节点客户端：`src/gateway/client.ts`
- 生成的 JSON Schema：`dist/protocol.schema.json`
- 生成的 Swift 模型：`apps/macos/Sources/OpenClawProtocol/GatewayModels.swift`

---

## 当前管道

- `pnpm protocol:gen`
  - 将 JSON Schema（draft-07）写入 `dist/protocol.schema.json`
- `pnpm protocol:gen:swift`
  - 生成 Swift 网关模型
- `pnpm protocol:check`
  - 运行两个生成器并验证输出已提交

---

## Schema 在运行时如何使用

- **服务器端**：每个入站帧通过 AJV 验证。握手仅接受参数匹配 `ConnectParams` 的 `connect` 请求。
- **客户端**：JS 客户端在使用之前验证事件和响应帧。
- **方法表面**：网关在 `hello-ok` 中公布支持的 `methods` 和 `events`。

---

## 示例帧

Connect（第一条消息）：

```json
{
  "type": "req",
  "id": "c1",
  "method": "connect",
  "params": {
    "minProtocol": 2,
    "maxProtocol": 2,
    "client": {
      "id": "openclaw-macos",
      "displayName": "macos",
      "version": "1.0.0",
      "platform": "macos 15.1",
      "mode": "ui",
      "instanceId": "A1B2"
    }
  }
}
```

Hello-ok 响应：

```json
{
  "type": "res",
  "id": "c1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 2,
    "server": { "version": "dev", "connId": "ws-1" },
    "features": { "methods": ["health"], "events": ["tick"] },
    "snapshot": {
      "presence": [],
      "health": {},
      "stateVersion": { "presence": 0, "health": 0 },
      "uptimeMs": 0
    },
    "policy": { "maxPayload": 1048576, "maxBufferedBytes": 1048576, "tickIntervalMs": 30000 }
  }
}
```

请求 + 响应：

```json
{ "type": "req", "id": "r1", "method": "health" }
```

```json
{ "type": "res", "id": "r1", "ok": true, "payload": { "ok": true } }
```

事件：

```json
{ "type": "event", "event": "tick", "payload": { "ts": 1730000000 }, "seq": 12 }
```

---

## 最小客户端（Node.js）

最小的有用流程：连接 + 健康检查。

```ts
import { WebSocket } from "ws";

const ws = new WebSocket("ws://127.0.0.1:18789");

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "req",
      id: "c1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "cli",
          displayName: "example",
          version: "dev",
          platform: "node",
          mode: "cli",
        },
      },
    }),
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(String(data));
  if (msg.type === "res" && msg.id === "c1" && msg.ok) {
    ws.send(JSON.stringify({ type: "req", id: "h1", method: "health" }));
  }
  if (msg.type === "res" && msg.id === "h1") {
    console.log("health:", msg.payload);
    ws.close();
  }
});
```

---

## 完整示例：端到端添加一个方法

示例：添加新的 `system.echo` 请求，返回 `{ ok: true, text }`。

1. **Schema（事实来源）**

在 `src/gateway/protocol/schema.ts` 中添加：

```ts
export const SystemEchoParamsSchema = Type.Object(
  { text: NonEmptyString },
  { additionalProperties: false },
);

export const SystemEchoResultSchema = Type.Object(
  { ok: Type.Boolean(), text: NonEmptyString },
  { additionalProperties: false },
);
```

将两者添加到 `ProtocolSchemas` 并导出类型：

```ts
  SystemEchoParams: SystemEchoParamsSchema,
  SystemEchoResult: SystemEchoResultSchema,
```

```ts
export type SystemEchoParams = Static<typeof SystemEchoParamsSchema>;
export type SystemEchoResult = Static<typeof SystemEchoResultSchema>;
```

2. **验证**

在 `src/gateway/protocol/index.ts` 中导出 AJV 验证器：

```ts
export const validateSystemEchoParams = ajv.compile<SystemEchoParams>(SystemEchoParamsSchema);
```

3. **服务器行为**

在 `src/gateway/server-methods/system.ts` 中添加处理程序：

```ts
export const systemHandlers: GatewayRequestHandlers = {
  "system.echo": ({ params, respond }) => {
    const text = String(params.text ?? "");
    respond(true, { ok: true, text });
  },
};
```

在 `src/gateway/server-methods.ts` 中注册（已合并 `systemHandlers`），然后在 `src/gateway/server.ts` 的 `METHODS` 中添加 `"system.echo"`。

4. **重新生成**

```bash
pnpm protocol:check
```

5. **测试 + 文档**

在 `src/gateway/server.*.test.ts` 中添加服务器测试，并在文档中记录该方法。

---

## Swift 代码生成行为

Swift 生成器生成：

- `GatewayFrame` 枚举，包含 `req`、`res`、`event` 和 `unknown` case
- 强类型的负载结构体/枚举
- `ErrorCode` 值和 `GATEWAY_PROTOCOL_VERSION`

未知帧类型作为原始负载保留，以实现前向兼容。

---

## 版本控制 + 兼容性

- `PROTOCOL_VERSION` 位于 `src/gateway/protocol/schema.ts`。
- 客户端发送 `minProtocol` + `maxProtocol`；服务器拒绝不匹配的。
- Swift 模型保留未知帧类型以避免破坏旧客户端。

---

## Schema 模式和约定

- 大多数对象使用 `additionalProperties: false` 实现严格负载。
- `NonEmptyString` 是 ID 和方法/事件名称的默认类型。
- 顶级 `GatewayFrame` 在 `type` 上使用 **discriminator**。
- 有副作用的方法通常在参数中需要 `idempotencyKey`（例如：`send`、`poll`、`agent`、`chat.send`）。

---

## 在线 Schema JSON

生成的 JSON Schema 在仓库中位于 `dist/protocol.schema.json`。发布的原始文件通常可在以下位置获取：

- [https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json](https://raw.githubusercontent.com/openclaw/openclaw/main/dist/protocol.schema.json)

---

## 当你修改 Schema 时

1. 更新 TypeBox schema。
2. 运行 `pnpm protocol:check`。
3. 提交重新生成的 schema + Swift 模型。
