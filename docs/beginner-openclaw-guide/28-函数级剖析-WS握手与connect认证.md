# 28 函数级剖析：WS 握手与 connect 认证

核心文件：
- `src/gateway/server/ws-connection.ts`
- `src/gateway/server/ws-connection/message-handler.ts`
- `src/gateway/auth.ts`

## 模块定位

WebSocket 握手是整个认证链路的起点。每个新连接必须在握手超时内完成认证；失败则服务端主动关闭，不允许半连接挂起。

## 一、attachGatewayWsConnectionHandler（连接生命周期总控）

```ts
// src/gateway/server/ws-connection.ts

attachGatewayWsConnectionHandler({
  ws,
  upgradeReq,
  wss,
  resolvedAuth,
  trustedProxies,
  clients,
  rateLimiter,
  canvasHost,
  ...
})
```

每次新 WS 连接触发时的行为：
1. 生成唯一 `connId = randomUUID()`
2. 记录连接上下文：`remoteAddr`、`origin`、`ua`（User-Agent）
3. **启动握手超时定时器**：调用 `getHandshakeTimeoutMs()`（默认 10 秒），超时后关闭连接
4. 立即向客户端发送 `connect.challenge`（含随机 `nonce`）
5. 在 `close` 事件中做全量清理：presence、node unregister、unsubscribeAll

```ts
// 握手超时：10 秒内未完成 connect 握手则关闭
const handshakeTimer = setTimeout(() => {
  ws.close(1008, "handshake timeout");
}, getHandshakeTimeoutMs());
```

## 二、attachGatewayWsMessageHandler（帧级状态机）

```ts
// src/gateway/server/ws-connection/message-handler.ts

attachGatewayWsMessageHandler({
  ws,
  upgradeReq,
  connId,
  connectNonce,    // ← 服务端生成的 challenge nonce
  resolvedAuth,
  trustedProxies,
  clients,
  rateLimiter,
  ...
})
```

**两阶段状态机：**

| 阶段 | 接受的帧 | 拒绝时行为 |
|------|---------|----------|
| 未连接 | 仅 `method=connect` | 关闭连接，不允许其他方法 |
| 已连接 | 普通 request frame | 交给 `handleGatewayRequest` |

**关键安全检查（connect 阶段）：**
1. 协议版本：`minProtocol/maxProtocol` 必须覆盖 `PROTOCOL_VERSION`
2. 角色：只接受 `operator` 或 `node`
3. origin：浏览器类客户端（control-ui/webchat）额外校验 origin
4. 代理头安全：来自非受信地址的 forwarded 头被拒绝（不允许伪造本地 IP）

## 三、authorizeGatewayConnect（完整签名）

```ts
// src/gateway/auth.ts:297-309

export async function authorizeGatewayConnect(params: {
  auth: ResolvedGatewayAuth;
  connectAuth?: ConnectAuth | null;
  req?: IncomingMessage;
  trustedProxies?: string[];
  tailscaleWhois?: TailscaleWhoisLookup;
  /** Optional rate limiter instance; when provided, failed attempts are tracked per IP. */
  rateLimiter?: AuthRateLimiter;
  /** Client IP used for rate-limit tracking. Falls back to proxy-aware request IP resolution. */
  clientIp?: string;
  /** Optional limiter scope; defaults to shared-secret auth scope. */
  rateLimitScope?: string;
}): Promise<GatewayAuthResult>
```

**认证判定顺序：**
1. `trusted-proxy` 模式：验证代理来源 + 指定用户头
2. 限速检查（`rateLimiter`）
3. tailscale 身份验证（`tailscaleWhois`，`allowTailscale=true` 时）
4. token 或 password 比对

## 四、isLocalDirectRequest（本地直连检测）

```ts
// src/gateway/auth.ts:101-121

export function isLocalDirectRequest(req?: IncomingMessage, trustedProxies?: string[]): boolean {
  if (!req) return false;
  const clientIp = resolveRequestClientIp(req, trustedProxies) ?? "";
  if (!isLoopbackAddress(clientIp)) return false;

  const host = getHostName(req.headers?.host);
  const hostIsLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  const hostIsTailscaleServe = host.endsWith(".ts.net");

  const hasForwarded = Boolean(
    req.headers?.["x-forwarded-for"] ||
    req.headers?.["x-real-ip"] ||
    req.headers?.["x-forwarded-host"],
  );

  const remoteIsTrustedProxy = isTrustedProxyAddress(req.socket?.remoteAddress, trustedProxies);
  return (hostIsLocal || hostIsTailscaleServe) && (!hasForwarded || remoteIsTrustedProxy);
}
```

**判定逻辑：**客户端 IP 是 loopback **且** Host 是本地域名（或 `.ts.net`）**且** （无转发头 **或** 转发来自可信代理）→ 判定为本地直连。

## 五、device nonce 校验

```ts
// 非本地场景：必须携带与 connect.challenge 相同的 nonce

const providedNonce = connectParams.auth?.nonce;
if (providedNonce && providedNonce !== connectNonce) {
  ws.close(1008, "device nonce mismatch");
  return;
}
```

**为什么需要 nonce：**
- 纯 token 校验存在重放攻击风险
- `connect.challenge` 携带随机 nonce，客户端签名必须包含该 nonce
- 旧签名无法复用到新连接（nonce 不同就拒绝）

## 六、device 签名校验流程

```ts
// 有 device 身份时的校验链

const authPayload = buildDeviceAuthPayload(connectParams.auth);
const verified = verifyDeviceSignature({
  deviceId: device.id,
  publicKey: device.publicKey,
  payload: authPayload,
  nonce: connectNonce,
});
```

**v1/v2 兼容：** 系统支持 legacy v1 签名格式的回退验证，确保老版本客户端平滑升级。

**校验内容：**
- `device.id` 与公钥推导一致
- 签名时间戳未过期
- 非本地场景必须带正确 nonce
- 签名内容匹配（含 role/scopes/token/nonce）

## 七、握手成功后的 hello-ok 组装

```ts
// 认证成功后，服务端发送 hello-ok 帧

{
  type: "hello-ok",
  server: {
    version: SERVER_VERSION,
    protocolVersion: PROTOCOL_VERSION,
  },
  methods: [...],      // 当前角色可用方法清单
  events: [...],       // 可订阅事件列表
  snapshot: {
    presence: [...],   // 当前在线状态快照
    health: {...},     // 服务健康状态
  },
  policy: {
    payload: {...},    // 消息体大小限制
    buffer: {...},     // 缓冲策略
    tick: {...},       // 心跳间隔
  },
  deviceToken: "...",  // 可选：device 的访问令牌
}
```

若 `role=node`，成功后自动注册进 `NodeRegistry`，并下发初始同步事件（如 voicewake 配置）。

## 八、完整握手时序

```
客户端                    服务端
  │                          │
  │── WS upgrade ──────────→ │ 生成 connId，启动握手超时（10s）
  │                          │
  │←── connect.challenge ──── │ 发送 {type: "challenge", nonce: "..."}
  │                          │
  │── connect req ─────────→ │ 校验 protocol/role/origin/auth
  │  {method: "connect",     │ authorizeGatewayConnect(...)
  │   auth: {token, nonce}}  │ 校验 device 签名（如有）
  │                          │
  │←── hello-ok ──────────── │ 清除握手超时，组装 hello-ok
  │                          │
  │── 正常 req 帧 ──────────→ │ handleGatewayRequest(...)
```

## 九、自检清单

1. `getHandshakeTimeoutMs()` 控制握手超时，默认 10 秒；超时关闭 1008。
2. `connectNonce` 是连接级别的随机值，每次新连接不同。
3. device nonce 不匹配时关闭码 1008，错误消息 `"device nonce mismatch"`。
4. `isLocalDirectRequest` 检查 loopback + host + 无转发头三重条件。
5. 本地直连 (`isLocalDirectRequest=true`) 会绕过部分 nonce 要求。
6. `trusted-proxy` 模式在 `authorizeGatewayConnect` 中最先判断。

## 十、开发避坑

1. 握手超时计时器必须在 hello-ok 发送**之后**清除，否则超时竞争会断正常连接。
2. 代理头（`x-forwarded-for`）只能来自 `trustedProxies` 列表中的 IP，否则忽略（防伪造本地身份）。
3. device token 和 shared secret 使用**独立限速 scope**，互不影响计数。
4. `buildDeviceAuthPayload` + `verifyDeviceSignature` 是 device 认证的两端——调试签名失败时先确认两侧使用相同的 payload 构建规则。
