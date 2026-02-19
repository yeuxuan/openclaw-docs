# 41 函数级剖析：hooks 与 tools-invoke HTTP 入口

核心文件：
- `src/gateway/hooks.ts`
- `src/gateway/server-http.ts`（含 `createHooksRequestHandler`）
- `src/gateway/tools-invoke-http.ts`
- `src/security/dangerous-tools.ts`

## 模块定位

`/hooks/*` 提供公网 webhook 接入（受策略约束），`/tools/invoke` 提供 HTTP 直调工具能力（含多层安全过滤）。两者都复用 `http-common.ts` 的统一错误返回。

## 一、createHooksRequestHandler 函数签名

```ts
// src/gateway/server-http.ts

export type HooksRequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<boolean>;

export function createHooksRequestHandler(
  opts: {
    getHooksConfig: () => HooksConfigResolved | null;
    bindHost: string;
    port: number;
    logHooks: SubsystemLogger;
  } & HookDispatchers,
): HooksRequestHandler {
```

**HookDispatchers 类型：**
```ts
type HookDispatchers = {
  dispatchWakeHook: (value: {
    text: string;
    mode: "now" | "next-heartbeat";
  }) => void;
  dispatchAgentHook: (value: {
    message: string;
    name: string;
    agentId?: string;
    wakeMode: string;
    sessionKey: string;
    deliver: boolean;
    channel: string;
    to?: string;
    model?: string;
    thinking?: string;
    timeoutSeconds?: number;
    allowUnsafeExternalContent?: boolean;
  }) => string;  // 返回 runId
};
```

## 二、hooks 的三重安全保护

### 保护 1：Token 认证（精确 header 名）

```ts
// src/gateway/hooks.ts

export function extractHookToken(req: IncomingMessage): string | undefined {
  // 主要：Authorization: Bearer <token>
  const auth = typeof req.headers.authorization === "string" ? req.headers.authorization.trim() : "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) { return token; }
  }
  // 备用：X-OpenClaw-Token header
  const headerToken =
    typeof req.headers["x-openclaw-token"] === "string"
      ? req.headers["x-openclaw-token"].trim()
      : "";
  if (headerToken) { return headerToken; }
  return undefined;
}
```

**两个 header，按优先级：**
1. 主要：`Authorization: Bearer <token>`
2. 备用：`X-OpenClaw-Token`

**明确禁止** query string `?token=` 方式（返回 400）。

### 保护 2：限速

```
认证失败计数 + 时间窗口 → 超出阈值 → 429 Too Many Requests
```

### 保护 3：Body 大小限制

```ts
// src/gateway/hooks.ts  行 14

const DEFAULT_HOOKS_MAX_BODY_BYTES = 256 * 1024;  // 262,144 字节 = 256 KB
```

默认限制 **256 KB**，可通过 `cfg.hooks.maxBodyBytes` 覆盖。

## 三、resolveHooksConfig

```ts
// src/gateway/hooks.ts

export function resolveHooksConfig(cfg: OpenClawConfig): HooksConfigResolved | null {
```

返回 `null` 表示 hooks 未启用（`cfg.hooks?.enabled !== true`）。

**HooksConfigResolved 完整类型：**
```ts
export type HooksConfigResolved = {
  basePath: string;
  token: string;
  maxBodyBytes: number;
  mappings: HookMappingResolved[];
  agentPolicy: HookAgentPolicyResolved;
  sessionPolicy: HookSessionPolicyResolved;
};

export type HookAgentPolicyResolved = {
  defaultAgentId: string;       // 默认 agent
  knownAgentIds: Set<string>;   // 所有已知的 agent ID
  allowedAgentIds?: Set<string>; // 白名单（未设则允许所有已知 agent）
};

export type HookSessionPolicyResolved = {
  defaultSessionKey?: string;          // 默认 session key
  allowRequestSessionKey: boolean;     // 是否允许请求方自带 sessionKey
  allowedSessionKeyPrefixes?: string[]; // sessionKey 前缀白名单
};
```

## 四、hooks 路由结构

```
POST /hooks/wake          → dispatchWakeHook({ text, mode })
POST /hooks/agent         → dispatchAgentHook({ message, ... })
POST /hooks/{mappingName} → 按 mapping 规则转换外部 payload → 上述两个动作之一
```

**mapping 的意义：** 外部系统（GitHub、Stripe 等）不需要了解 OpenClaw 内部参数，通过 mapping 规则将 webhook payload 转换为内部动作。

## 五、DEFAULT_GATEWAY_HTTP_TOOL_DENY

```ts
// src/security/dangerous-tools.ts

export const DEFAULT_GATEWAY_HTTP_TOOL_DENY = [
  "sessions_spawn",   // 远程生成 agent = RCE 风险
  "sessions_send",    // 跨 session 注入消息
  "gateway",          // 控制平面重配置
  "whatsapp_login",   // 需要终端扫码，HTTP 下会挂起
] as const;
```

**在 tools-invoke-http.ts 中的使用方式：**
```ts
import { DEFAULT_GATEWAY_HTTP_TOOL_DENY } from "../security/dangerous-tools.js";

const defaultGatewayDeny: string[] = DEFAULT_GATEWAY_HTTP_TOOL_DENY.filter(
  (name) => !gatewayToolsCfg?.allow?.includes(name),  // 管理员可显式解封
);
```

## 六、/tools/invoke 的多层策略链

```
HTTP 请求 /tools/invoke
    │
    ▼
1. 鉴权（authorizeGatewayConnect，Bearer token）
    │
    ▼
2. 解析 sessionKey / channel / accountId hints
    │
    ▼
3. 构建完整工具集（所有可用工具）
    │
    ▼
4. 应用多层过滤：
   - profile policy（用户级）
   - provider profile policy（provider 级）
   - global / agent / group / subagent policy（配置级）
   - DEFAULT_GATEWAY_HTTP_TOOL_DENY（gateway HTTP 专属拒绝列表）
    │
    ▼
5. 执行目标工具 → 返回结果
```

**策略分层原因：** 确保"HTTP 直调工具"不会绕过正常会话安全边界（相比 WS 连接，HTTP 调用更容易被外部攻击者利用）。

## 七、统一 HTTP 错误码（http-common.ts）

```ts
// src/gateway/http-common.ts

// 所有 HTTP 入口使用统一的错误形状
```

| HTTP 状态码 | 场景 |
|------------|------|
| 401 | 鉴权失败（token 无效） |
| 429 | 认证失败次数超过限速阈值 |
| 400 | 请求格式错误 / body 解析失败 |
| 408 | body 读取超时 |
| 413 | body 超过大小限制（256 KB） |
| 500 | 工具执行失败 |

## 八、hooks basePath 与路由

```ts
// basePath 来自 cfg.hooks.path（默认 "/hooks"）
// 请求路径 = basePath + "/" + mappingName

// 路由匹配规则：
if (url.startsWith(hooksConfig.basePath + "/wake"))  → wake handler
if (url.startsWith(hooksConfig.basePath + "/agent")) → agent handler
else                                                  → mapping lookup
```

## 九、自检清单

1. hooks token 认证优先 `Authorization: Bearer`，其次 `X-OpenClaw-Token`，禁止 query param。
2. body 大小默认 256 KB，超出返回 413（不是直接断连）。
3. `resolveHooksConfig` 返回 `null` = hooks 未启用，处理器直接返回 404。
4. `DEFAULT_GATEWAY_HTTP_TOOL_DENY` 定义在 `src/security/dangerous-tools.ts`，管理员可通过 `allow` 列表解封。
5. `/tools/invoke` 使用 `authorizeGatewayConnect` 鉴权，与 WS 握手复用同一函数。

## 十、开发避坑

1. **hooks mapping 的 `ignore` 动作**：可以把特定 webhook 事件映射为 `ignore`（无操作），避免引发 agent 执行。
2. **allowRequestSessionKey = false 时**：请求方带的 sessionKey 被忽略，强制使用 defaultSessionKey，防止 session 跨用户注入。
3. **tools/invoke 不走 WS 连接**：没有 context.dedupe 去重，调用方需要自己保证幂等性。
4. **sessions_spawn 被封**：无法通过 HTTP 触发子 agent 生成，防止 HTTP 接口成为 RCE 向量。
