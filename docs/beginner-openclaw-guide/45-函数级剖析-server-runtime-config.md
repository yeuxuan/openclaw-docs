# 45 函数级剖析：server-runtime-config

核心文件：`src/gateway/server-runtime-config.ts`

## 模块定位

网关启动时的配置合并与安全约束校验器。
这是**启动前最后一道防误配闸门**，把所有危险配置在启动阶段直接报错，阻止网关带风险上线。

## 一、resolveGatewayRuntimeConfig（完整签名）

```ts
export async function resolveGatewayRuntimeConfig(params: {
  cfg: ReturnType<typeof loadConfig>;
  port: number;
  bind?: GatewayBindMode;
  host?: string;
  controlUiEnabled?: boolean;
  openAiChatCompletionsEnabled?: boolean;
  openResponsesEnabled?: boolean;
  auth?: GatewayAuthConfig;
  tailscale?: GatewayTailscaleConfig;
}): Promise<GatewayRuntimeConfig>
```

调用链：
```
startGatewayServer(...)
    │
    ▼
resolveGatewayRuntimeConfig(...)   ← 本模块
    │
    ▼
GatewayRuntimeConfig（被 createGatewayRuntimeState / startGatewayTailscaleExposure 消费）
```

## 二、配置合并优先级

```
bindMode    = params.bind       ?? cfg.gateway?.bind       ?? "loopback"
bindHost    = params.host       ?? resolveGatewayBindHost(bindMode, customBindHost)
controlUi   = params.controlUiEnabled ?? cfg.gateway?.controlUi?.enabled ?? true
auth        = params.auth       ?? cfg.gateway?.auth       （叠加启动参数 override）
tailscale   = params.tailscale  ?? cfg.gateway?.tailscale
```

**原则**：启动参数 override > 配置文件 > 默认值。

## 三、五条安全约束（源码精确错误消息）

约束校验顺序如下，任意一条失败直接抛错，网关不启动：

### 约束 1：assertGatewayAuthConfigured（auth 内部一致性）

```ts
// src/gateway/auth.ts
export function assertGatewayAuthConfigured(auth: ResolvedGatewayAuth): void {
  if (auth.mode === "token" && !auth.token) {
    if (auth.allowTailscale) return;  // tailscale serve 时可豁免
    throw new Error(
      "gateway auth mode is token, but no token was configured (set gateway.auth.token or OPENCLAW_GATEWAY_TOKEN)"
    );
  }
  if (auth.mode === "password" && !auth.password) {
    throw new Error("gateway auth mode is password, but no password was configured");
  }
}
```

### 约束 2：funnel 必须 password

```ts
if (tailscaleMode === "funnel" && authMode !== "password") {
  throw new Error(
    "tailscale funnel requires gateway auth mode=password (set gateway.auth.password or OPENCLAW_GATEWAY_PASSWORD)"
  );
}
```

### 约束 3：tailscale 必须 loopback 绑定

```ts
if (tailscaleMode !== "off" && !isLoopbackHost(bindHost)) {
  throw new Error("tailscale serve/funnel requires gateway bind=loopback (127.0.0.1)");
}
```

### 约束 4：非 loopback 必须有认证

```ts
if (!isLoopbackHost(bindHost) && !hasSharedSecret && authMode !== "trusted-proxy") {
  throw new Error(
    `refusing to bind gateway to ${bindHost}:${params.port} without auth ` +
    `(set gateway.auth.token/password, or set OPENCLAW_GATEWAY_TOKEN/OPENCLAW_GATEWAY_PASSWORD)`
  );
}
```

### 约束 5：trusted-proxy 的两个子约束

```ts
if (authMode === "trusted-proxy") {
  if (isLoopbackHost(bindHost)) {
    throw new Error(
      "gateway auth mode=trusted-proxy makes no sense with bind=loopback; " +
      "use bind=lan or bind=custom with gateway.trustedProxies configured"
    );
  }
  if (trustedProxies.length === 0) {
    throw new Error(
      "gateway auth mode=trusted-proxy requires gateway.trustedProxies to be configured " +
      "with at least one proxy IP"
    );
  }
}
```

## 四、约束矩阵（快速查表）

| 场景 | 通过？ | 原因 |
|------|--------|------|
| `tailscaleMode=funnel` + `authMode=token` | ❌ | funnel 必须 password |
| `tailscaleMode=serve` + `bind=lan` | ❌ | tailscale 必须 loopback |
| `bind=lan` + 无 token/password | ❌ | 非 loopback 必须认证 |
| `authMode=trusted-proxy` + `bind=loopback` | ❌ | trusted-proxy 不能 loopback |
| `authMode=trusted-proxy` + `trustedProxies=[]` | ❌ | 必须配置代理 IP 列表 |
| `bind=loopback` + 无认证 | ✅ | 本机访问，loopback 豁免 |
| `tailscaleMode=serve` + `authMode=none` + `allowTailscale=true` | ✅ | tailscale 白名单豁免 |

## 五、GatewayRuntimeConfig 返回结构

```ts
return {
  bindHost,              // 实际绑定 IP（已解析）
  controlUiEnabled,      // Control UI 开关
  openAiChatCompletionsEnabled,
  openResponsesEnabled,
  openResponsesConfig,   // undefined 如果未配置
  controlUiBasePath,     // UI 路径前缀
  controlUiRoot,         // UI 静态资源根目录
  resolvedAuth,          // ResolvedGatewayAuth（含 mode/token/password/allowTailscale）
  authMode,              // "none" | "token" | "password" | "trusted-proxy"
  tailscaleConfig,       // 原始 tailscale 配置
  tailscaleMode,         // "off" | "serve" | "funnel"
  hooksConfig,           // gateway hooks 配置
  canvasHostEnabled,     // Canvas 服务开关
};
```

## 六、resolveGatewayAuth 的自动模式推断

```ts
// src/gateway/auth.ts
export function resolveGatewayAuth(params: {...}): ResolvedGatewayAuth {
  let mode: ResolvedGatewayAuth["mode"];
  if (authConfig.mode) {
    mode = authConfig.mode;            // 显式配置优先
  } else if (password) {
    mode = "password";                 // 有 password 自动推断
  } else if (token) {
    mode = "token";                    // 有 token 自动推断
  } else {
    mode = "none";                     // 无任何认证
  }

  // allowTailscale 默认规则：serve 模式 + 非 password/trusted-proxy
  const allowTailscale =
    authConfig.allowTailscale ??
    (params.tailscaleMode === "serve" && mode !== "password" && mode !== "trusted-proxy");
}
```

## 七、configure.gateway 的自动纠错逻辑

`src/commands/configure.gateway.ts` 在 wizard 中会提前纠正冲突配置（不抛错，只提示）：

```ts
// tailscale 自动改 loopback
if (tailscaleMode !== "off" && bind !== "loopback") {
  note("Tailscale requires bind=loopback. Adjusting bind to loopback.");
  bind = "loopback";
}
// funnel 自动改 password
if (tailscaleMode === "funnel" && authMode !== "password") {
  note("Tailscale funnel requires password auth.");
  authMode = "password";
}
// trusted-proxy 自动改 lan
if (authMode === "trusted-proxy" && bind === "loopback") {
  note("Trusted proxy auth requires network bind. Adjusting bind to lan.");
  bind = "lan";
}
```

> 注意：wizard 的自动纠错只在交互式配置时运行。
> 直接写配置文件启动时，约束由 `resolveGatewayRuntimeConfig` 校验，不自动纠错，直接抛错。

## 八、自检清单

1. funnel 模式下 `authMode` 是否为 `"password"`（不是 token，不是 none）。
2. 开了 tailscale 时 `bindHost` 是否确实是 `127.0.0.1`。
3. 绑定非 loopback 时 `hasSharedSecret`（token/password 其一有值）或 `authMode === "trusted-proxy"`。
4. trusted-proxy 时 `trustedProxies` 非空数组（至少一个代理 IP）。
5. trusted-proxy 不能与 loopback 同时使用（两者语义互相矛盾）。
6. 返回的 `GatewayRuntimeConfig` 被下游 `startGatewayTailscaleExposure` 和 `startGatewayDiscovery` 直接消费。

## 九、开发避坑

1. 错误消息里包含修复提示（`"set gateway.auth.password or OPENCLAW_GATEWAY_PASSWORD"`），
   直接复制报错信息到搜索引擎就能找到文档。
2. `trusted-proxy + loopback` 是逻辑悖论（loopback 本地直连，trusted-proxy 期待外部代理），
   运行时会直接抛错，不静默忽略。
3. `resolveGatewayAuth` 的自动模式推断有顺序：`mode > password > token > none`，
   建议显式设置 mode，避免 token/password 同时存在时的歧义。
