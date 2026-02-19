# 06 自动回复与 Agent 执行流水线

## 模块目标

理解“消息进来后，系统如何一步步变成最终回复”的核心流水线。

## 步骤一：实现拆解（执行链路）

1. 调度入口: `src/auto-reply/dispatch.ts`
2. 具体调度: `src/auto-reply/reply/dispatch-from-config.ts`
3. 回复决策: `src/auto-reply/reply/get-reply.ts`
4. 执行准备与队列: `src/auto-reply/reply/get-reply-run.ts`
5. Agent 实际执行: `runReplyAgent` / embedded runner（由上一步调用）
6. 回复下发: dispatcher 或 `routeReply`（跨通道时）

## 步骤二：细粒度讲解（小白版）

1. dispatch 层做“流程控制”
- 创建 dispatcher（支持 typing、block、final）
- 保证 finally 里释放资源，避免卡死

2. dispatch-from-config 做“消息编排”
- 去重（避免重复消息重复回复）
- 快速中断（例如 stop 指令）
- message_received hooks
- block 片段回调、tool result 回调、final 回调
- TTS 自动应用（按配置和会话状态）

3. get-reply 做“决策与上下文构建”
- 解析路由后 session 与 agent
- 处理 directives（think/model/verbose/queue 等）
- 处理 inline 命令（例如模型切换）
- 媒体与链接理解预处理
- 进入 runPreparedReply

4. get-reply-run 做“执行前最后组装”
- 生成系统前缀、群聊引导、用户上下文
- 处理会话重置、队列策略（interrupt/steer/followup）
- 处理模型思考等级与兼容性
- 组装最终 run 参数交给 agent runner

5. 输出路径有两种
- 同通道: 走 dispatcher
- 跨通道: 走 `routeReply` 发送到 originating channel


