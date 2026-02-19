# 36 函数级剖析：HTTP 请求路由与安全网

核心文件：`src/gateway/server-http.ts`

## 模块定位

网关的 HTTP 请求路由层。`handleRequest` 是所有 HTTP 请求的统一入口，按固定优先级顺序匹配路由。`attachGatewayUpgradeHandler` 处理 WS 升级（Canvas WS 也在此鉴权）。

## 一、handleRequest（路由优先级顺序，精确源码）

```ts
// src/gateway/server-http.ts

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  // WS 升级帧：不干涉，由 ws 的 upgrade 事件处理
  if (String(req.headers.upgrade ?? "").toLowerCase() === "websocket") {
    return;
  }

  try {
    const configSnapshot = loadConfig();
    const trustedProxies = configSnapshot.gateway?.trustedProxies ?? [];
    const requestPath = new URL(req.url ?? "/", "http://localhost").pathname;

    // 路由 1：hooks（最高优先级）
    if (await handleHooksRequest(req, res)) return;

    // 路由 2：tools-invoke（含自身鉴权）
    if (await handleToolsInvokeHttpRequest(req, res, {
      auth: resolvedAuth, trustedProxies, rateLimiter,
    })) return;

    // 路由 3：Slack HTTP
    if (await handleSlackHttpRequest(req, res)) return;

    // （其他 plugin HTTP 路由在此处展开）

    // 路由 4：/v1/responses（OpenResponses）
    if (openResponsesEnabled) {
      if (await handleOpenResponsesHttpRequest(req, res, {
        auth: resolvedAuth, config: openResponsesConfig,
        trustedProxies, rateLimiter,
      })) return;
    }

    // 路由 5：/v1/chat/completions（OpenAI 兼容）
    if (openAiChatCompletionsEnabled) {
      if (await handleOpenAiHttpRequest(req, res, {
        auth: resolvedAuth, trustedProxies, rateLimiter,
      })) return;
    }

    // 路由 6：Canvas（含鉴权检查）
    if (canvasHost) {
      if (isCanvasPath(requestPath)) {
        const ok = await authorizeCanvasRequest({
          req, auth: resolvedAuth, trustedProxies, clients, rateLimiter,
        });
        if (!ok.ok) {
          sendGatewayAuthFailure(res, ok);
          return;
        }
      }
      if (await handleA2uiHttpRequest(req, res)) return;
      if (await canvasHost.handleHttpRequest(req, res)) return;
    }

    // 路由 7：Control UI（头像 + 静态资源）
    if (controlUiEnabled) {
      if (handleControlUiAvatarRequest(req, res, {
        basePath: controlUiBasePath,
        resolveAvatar: (agentId) => resolveAgentAvatar(configSnapshot, agentId),
      })) return;
      if (handleControlUiHttpRequest(req, res, {
        basePath: controlUiBasePath, config: configSnapshot, root: controlUiRoot,
      })) return;
    }

    // 全部不命中 → 404
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Not Found");
  } catch {
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
}
```

**路由优先级总结：**

| 顺序 | 路由 | 自带鉴权 |
|------|------|---------|
| 1 | hooks | 由 hooks 系统自行处理 |
| 2 | tools-invoke | ✅ 传入 `auth + rateLimiter` |
| 3 | Slack | 由扩展处理 |
| 4 | `/v1/responses` | ✅ 传入 `auth + rateLimiter` |
| 5 | `/v1/chat/completions` | ✅ 传入 `auth + rateLimiter` |
| 6 | Canvas | ✅ `authorizeCanvasRequest` 前置检查 |
| 7 | Control UI | 无鉴权（头像/静态资源） |
| - | 404 | — |

## 二、authorizeCanvasRequest（三层授权）

```ts
// src/gateway/server-http.ts

async function authorizeCanvasRequest(params: {
  req: IncomingMessage;
  auth: ResolvedGatewayAuth;
  trustedProxies: string[];
  clients: Set<GatewayWsClient>;
  rateLimiter?: AuthRateLimiter;
}): Promise<GatewayAuthResult> {
  const { req, auth, trustedProxies, clients, rateLimiter } = params;

  // Layer 1：本地直连 → 直接通过
  if (isLocalDirectRequest(req, trustedProxies)) {
    return { ok: true };
  }

  let lastAuthFailure: GatewayAuthResult | null = null;

  // Layer 2：Bearer Token
  const token = getBearerToken(req);
  if (token) {
    const authResult = await authorizeGatewayConnect({
      auth: { ...auth, allowTailscale: false },  // Canvas 不允许 Tailscale auth
      connectAuth: { token, password: token },
      req, trustedProxies, rateLimiter,
    });
    if (authResult.ok) return authResult;
    lastAuthFailure = authResult;
  }

  // Layer 3：私网 IP 且有已授权 WS 客户端同 IP（fallback）
  // ...
}
```

**三层逻辑：**
1. **本地直连**：loopback 客户端 + 本地 Host + 无转发头 → 直接通过
2. **Bearer Token**：`Authorization: Bearer <token>` → 走 `authorizeGatewayConnect`（不允许 Tailscale）
3. **私网回退**：私网 IP 且有同 IP 的已授权 WS 客户端 → 通过（让本机 UI 体验更好）

## 三、isLocalDirectRequest（精确实现）

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

## 四、getBearerToken（Header 提取）

```ts
// src/gateway/http-utils.ts

export function getBearerToken(req: IncomingMessage): string | undefined {
  const raw = getHeader(req, "authorization")?.trim() ?? "";
  if (!raw.toLowerCase().startsWith("bearer ")) return undefined;
  const token = raw.slice(7).trim();
  return token || undefined;
}
```

## 五、attachGatewayUpgradeHandler（WS 升级处理）

```ts
// src/gateway/server-http.ts

export function attachGatewayUpgradeHandler(opts: {
  httpServer: HttpServer;
  wss: WebSocketServer;
  canvasHost: CanvasHostHandler | null;
  clients: Set<GatewayWsClient>;
  resolvedAuth: ResolvedGatewayAuth;
  rateLimiter?: AuthRateLimiter;
}) {
  const { httpServer, wss, canvasHost, clients, resolvedAuth, rateLimiter } = opts;
  httpServer.on("upgrade", (req, socket, head) => {
    void (async () => {
      if (canvasHost) {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (url.pathname === CANVAS_WS_PATH) {
          // Canvas WS 升级也需要通过 authorizeCanvasRequest
          const configSnapshot = loadConfig();
          const trustedProxies = configSnapshot.gateway?.trustedProxies ?? [];
          const ok = await authorizeCanvasRequest({
            req, auth: resolvedAuth, trustedProxies, clients, rateLimiter,
          });
          if (!ok.ok) {
            socket.destroy();
            return;
          }
          // ...升级处理
        }
      }
      // 普通 WS 升级
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    })();
  });
}
```

**关键点：** Canvas WS 升级走 `authorizeCanvasRequest`（同 HTTP Canvas 路由），普通 WS 升级则直接交给 `wss`（认证在 ws-connection 的 connect 握手中进行）。

## 六、plugin HTTP 的鉴权边界

```
/api/channels/*    → 由 gateway 层强制鉴权（在 handleHooksRequest 之后）
其他插件路由       → 由插件自己负责鉴权
```

**这条边界非常重要：** 插件端点看起来在网关后面，但如果插件没有自行鉴权，实际上是裸露的。`/api/channels/*` 是特例，gateway 为其提供统一鉴权。

## 七、自检清单

1. `handleRequest` 第一行检查 `upgrade` 头，WS 升级帧直接 return，不进入路由逻辑。
2. Canvas 路由在全部命中之前做 `authorizeCanvasRequest` 前置检查（而非在 handler 内部）。
3. `isLocalDirectRequest` 三重条件：loopback IP + 本地 Host + 无转发头（或来自可信代理）。
4. `getBearerToken` 大小写不敏感匹配 `"bearer "`（`.toLowerCase().startsWith`）。
5. Canvas WS 升级在 `httpServer.upgrade` 事件中走相同的授权路径。
6. 全部不命中返回 404（文本类型 `text/plain; charset=utf-8`）。

## 八、开发避坑

1. **路由顺序是代码顺序**，不是框架路由表。越靠前优先级越高，新增路由必须思考放在哪个位置。
2. **Canvas 的 `authorizeCanvasRequest` 不允许 Tailscale auth**（`allowTailscale: false`），与普通 WS 握手不同。
3. **500 错误被 catch 兜底**，但不记录具体错误信息（响应体只有 "Internal Server Error"）——调试时需看日志，不要指望从响应里获取信息。
4. **`openResponsesEnabled` 和 `openAiChatCompletionsEnabled` 是运行时开关**，关闭后对应路由完全跳过。
