# 42 函数级剖析：协议帧与 Schema 验证

核心文件：
- `src/gateway/protocol/index.ts`
- `src/gateway/protocol/schema/frames.ts`
- `src/gateway/protocol/schema/protocol-schemas.ts`
- `src/gateway/protocol/schema/error-codes.ts`
- `src/gateway/protocol/schema/agent.ts`

## 模块定位

协议层定义 OpenClaw gateway WS 协议的帧格式、连接参数约束、错误码体系和 AJV 编译校验器。所有 WS 通信的合法性在进入业务逻辑之前在此层被验证。

## 一、PROTOCOL_VERSION

```ts
// src/gateway/protocol/schema/protocol-schemas.ts  最后一行

export const PROTOCOL_VERSION = 3 as const;
```

握手时客户端必须满足：`minProtocol <= 3 <= maxProtocol`，否则直接拒绝连接。

## 二、GatewayFrameSchema（三种顶层帧）

```ts
// src/gateway/protocol/schema/frames.ts

export const GatewayFrameSchema = Type.Union(
  [RequestFrameSchema, ResponseFrameSchema, EventFrameSchema],
  { discriminator: "type" },  // 按 type 字段判别
);
```

三种帧的 `type` 字面量值：
```
RequestFrameSchema  → type: Type.Literal("req")    // 客户端请求
ResponseFrameSchema → type: Type.Literal("res")    // 网关响应
EventFrameSchema    → type: Type.Literal("event")  // 网关异步事件
```

**设计简洁性：** 只有 3 种顶层帧，不需要复杂的分发逻辑，客户端实现更简单稳定。

## 三、ConnectParamsSchema（关键约束字段）

```ts
// src/gateway/protocol/schema/frames.ts

export const ConnectParamsSchema = Type.Object(
  {
    minProtocol: Type.Integer({ minimum: 1 }),    // 必填，整数 ≥ 1
    maxProtocol: Type.Integer({ minimum: 1 }),    // 必填，整数 ≥ 1
    client: Type.Object(
      {
        id: GatewayClientIdSchema,               // 必填
        displayName: Type.Optional(NonEmptyString),
        version: NonEmptyString,                 // 必填，非空字符串
        platform: NonEmptyString,                // 必填，非空字符串
        deviceFamily: Type.Optional(NonEmptyString),
        modelIdentifier: Type.Optional(NonEmptyString),
        mode: GatewayClientModeSchema,           // 必填
        instanceId: Type.Optional(NonEmptyString),
      },
      { additionalProperties: false },
    ),
    caps: Type.Optional(Type.Array(NonEmptyString, { default: [] })),
    commands: Type.Optional(Type.Array(NonEmptyString)),
    permissions: Type.Optional(Type.Record(NonEmptyString, Type.Boolean())),
    pathEnv: Type.Optional(Type.String()),
    role: Type.Optional(NonEmptyString),
    scopes: Type.Optional(Type.Array(NonEmptyString)),
    device: Type.Optional(Type.Object({
      id, publicKey, signature, signedAt, nonce
    }, { additionalProperties: false })),
    auth: Type.Optional(Type.Object({
      token?, password?
    }, { additionalProperties: false })),
    locale: Type.Optional(Type.String()),
    userAgent: Type.Optional(Type.String()),
  },
  { additionalProperties: false },  // 全局严格模式
);
```

**必填字段（不含 Optional）：** `minProtocol`, `maxProtocol`, `client.id`, `client.version`, `client.platform`, `client.mode`
**严格模式：** 全局 `additionalProperties: false`，未知字段直接拒绝，不做静默忽略。

## 四、validateConnectParams / validateRequestFrame（AJV 编译校验器）

```ts
// src/gateway/protocol/index.ts

import AjvPkg, { type ErrorObject } from "ajv";

const ajv = new (AjvPkg as unknown as new (opts?: object) => import("ajv").default)({
  allErrors: true,      // 收集所有错误，不在第一个错误时停止
  strict: false,        // 宽松模式（兼容 TypeBox 生成的 schema）
  removeAdditional: false, // 不自动删除额外字段（保持原始数据）
});

export const validateConnectParams = ajv.compile<ConnectParams>(ConnectParamsSchema);
export const validateRequestFrame = ajv.compile<RequestFrame>(RequestFrameSchema);
```

**技术栈：** `@sinclair/typebox`（定义 schema）+ `ajv`（编译为验证函数），不使用 zod。
**`allErrors: true`：** 验证失败时返回所有错误，方便调试。

## 五、ErrorCodes（完整枚举）

```ts
// src/gateway/protocol/schema/error-codes.ts

export const ErrorCodes = {
  NOT_LINKED:      "NOT_LINKED",      // 未关联（未完成配对流程）
  NOT_PAIRED:      "NOT_PAIRED",      // 未配对（设备未通过配对认证）
  AGENT_TIMEOUT:   "AGENT_TIMEOUT",   // agent 执行超时
  INVALID_REQUEST: "INVALID_REQUEST", // 请求格式或参数无效
  UNAVAILABLE:     "UNAVAILABLE",     // 服务不可用（临时状态）
} as const;
```

共 5 个值，所有 handler 通过 `errorShape(ErrorCodes.XXX, message)` 统一返回，前端可以写统一错误处理器。

## 六、WS 请求处理流程

```
客户端发送 WS 消息
    │
    ▼
JSON.parse（格式错误 → 关闭连接）
    │
    ▼
validateRequestFrame（AJV 校验）
    失败 → respond INVALID_REQUEST，不进入业务逻辑
    │
    ▼
route to method handler（根据 method 字段）
    │
    ▼
validateXxxParams（各方法自己的 schema 校验）
    失败 → respond INVALID_REQUEST
    │
    ▼
执行业务逻辑 → 返回 res 帧
```

**"错误前置"设计：** 把格式错误拦截在协议层，不让"脏数据"进入业务层，业务代码可以假设入参已经合法。

## 七、ProtocolSchemas 注册表

```ts
// src/gateway/protocol/schema/protocol-schemas.ts

export const ProtocolSchemas = {
  ConnectParams: ConnectParamsSchema,
  RequestFrame: RequestFrameSchema,
  ResponseFrame: ResponseFrameSchema,
  EventFrame: EventFrameSchema,
  // ... 所有 method 的 params schema
};
```

按名称暴露所有 schema，可用于：
- 工具自动生成（TypeScript 类型推导）
- 测试（生成合法/非法测试用例）
- 文档对齐（schema 即文档）

## 八、协议版本协商

```
客户端发送 connect 帧：
  { type: "req", method: "connect", params: { minProtocol: 3, maxProtocol: 5, ... } }

网关校验：
  if (PROTOCOL_VERSION < params.minProtocol || PROTOCOL_VERSION > params.maxProtocol)
    → 拒绝，返回 UNAVAILABLE（版本不兼容）
  else
    → 接受，握手完成
```

**设计原则：** 显式版本协商，客户端和网关能做明确的兼容性声明，不靠"试错"。

## 九、ErrorCodes 使用模式

```ts
// 任意 handler 中的错误返回方式

respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "session not found"));
respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, "model not available"));
respond(false, undefined, errorShape(ErrorCodes.AGENT_TIMEOUT, "agent run timed out"));
```

`errorShape()` 返回统一的错误结构，所有 handler 使用同一形状。

## 十、自检清单

1. `PROTOCOL_VERSION = 3`，定义在 `protocol-schemas.ts` 最后一行，以 `as const` 固定。
2. `GatewayFrameSchema` 只允许 `"req"` / `"res"` / `"event"` 三种 type（TypeBox 联合类型）。
3. `validateConnectParams` 和 `validateRequestFrame` 都是 AJV 编译的验证函数，不是 runtime zod 解析。
4. `allErrors: true` 确保返回所有验证错误，便于客户端一次修正全部问题。
5. `ConnectParamsSchema` 全局 `additionalProperties: false`，未知字段导致 400。

## 十一、开发避坑

1. **TypeBox + AJV 的组合**：TypeBox 生成标准 JSON Schema，AJV strict=false 才能正确处理 TypeBox 扩展字段，不能改为 strict=true。
2. **discriminator 字段 type 必须是字面量**：`Type.Literal("req")` 不能改成 `Type.String()`，否则 AJV 无法按 discriminator 快速分发。
3. **errorShape 的错误体**：前端应按 `error.code`（ErrorCodes 值）而不是 `error.message` 做逻辑判断，message 可能变化。
4. **版本区间设计**：客户端建议 `minProtocol = maxProtocol = PROTOCOL_VERSION`（精确匹配），而不是宽泛区间（防止与未知未来版本产生歧义）。
