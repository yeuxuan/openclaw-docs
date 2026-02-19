# 01 网关控制平面框架（连接、鉴权、分发、广播）

## 小白先懂（30秒）

- 这套模块就是“总门卫”。  
- 先验身份，再看权限，再转给对应功能，最后把结果推回去。  
- 你可以把它想成“医院分诊台”：先挂号，再分科室，再叫号回传结果。

## 你先照着做（不求全懂）

1. 先实现 `connect` 握手，只允许握手成功后发业务请求。  
2. 再实现 `authorize(method, role, scopes)`。  
3. 再实现 `dispatch(method, params)`。  
4. 最后实现 `broadcast(event, payload)`，并加事件权限过滤。

对应核心代码：
- `src/gateway/server.impl.ts`
- `src/gateway/server-runtime-state.ts`
- `src/gateway/server-ws-runtime.ts`
- `src/gateway/server/ws-connection.ts`
- `src/gateway/server/ws-connection/message-handler.ts`
- `src/gateway/server-methods.ts`
- `src/gateway/server-broadcast.ts`

## 步骤一：执行链路拆解（具体到函数）

1. 网关入口  
`startGatewayServer(...)`（`src/gateway/server.impl.ts`）启动全局依赖。
2. 建运行态容器  
`createGatewayRuntimeState(...)`（`src/gateway/server-runtime-state.ts`）创建：
- http server / ws server
- clients 集合
- broadcast 函数
- chat run 状态
3. 绑定 WS 入口  
`attachGatewayWsHandlers(...)` -> `attachGatewayWsConnectionHandler(...)`。
4. 握手阶段  
`message-handler.ts` 要求先完成 `connect.challenge + connect`，并校验协议与 auth。
5. 请求分发  
普通 `req` 进入 `handleGatewayRequest(...)`（`src/gateway/server-methods.ts`）。
6. 权限校验  
`authorizeGatewayMethod(...)` 按 `role + scope` 判断是否允许。
7. 事件广播  
`createGatewayBroadcaster(...)` 广播事件，并做事件级 scope 过滤和慢连接保护。

## 步骤二：实现细节（开发者/小白都能照抄）

1. 握手必须是“第一包 connect”
- 代码中 `connect` 作为首包约束，防止未认证请求直接打业务方法。
- 失败直接拒绝，不进入 method 层。

2. method 分发是“两层 handler”
- `extraHandlers`（插件注入）优先。
- `coreGatewayHandlers`（内建）兜底。
- 未命中返回 `unknown method`，不是静默忽略。

3. 广播不是全量广播
- `EVENT_SCOPE_GUARDS` 对敏感事件（审批/配对）做 scope 限制。
- 慢消费者根据 `bufferedAmount` 和阈值保护，不让单连接拖垮系统。

4. 实际请求/响应示例（简化）

```json
// request frame
{ "type": "req", "id": "1", "method": "chat.send", "params": { "text": "hi" } }
```

```json
// response frame
{ "type": "res", "id": "1", "ok": true, "result": { "runId": "r_123" } }
```

```json
// event frame
{ "type": "event", "event": "agent.delta", "payload": { "runId": "r_123", "delta": "hello" } }
```

## 最小复刻骨架（可直接改成你的代码）

```ts
type Role = "operator" | "node";
type Client = { role: Role; scopes: string[] };

function authorize(method: string, client: Client): boolean {
  if (client.role === "node") {
    return method.startsWith("node.");
  }
  if (client.scopes.includes("operator.admin")) return true;
  if (method.startsWith("chat.") && client.scopes.includes("operator.write")) return true;
  if (method.startsWith("health") && client.scopes.includes("operator.read")) return true;
  return false;
}

async function handleReq(client: Client, method: string, params: unknown) {
  if (!authorize(method, client)) throw new Error("unauthorized");
  const handler = coreHandlers[method];
  if (!handler) throw new Error("unknown method");
  return await handler(params);
}
```


