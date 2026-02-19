# 02 智能体执行框架（run/attempt/订阅/回退）

## 小白先懂（30秒）

- 这套模块就是“智能体发动机”。  
- `run` 负责总调度，`attempt` 负责一次真实执行。  
- 如果执行失败，按备选模型继续尝试，直到成功或全部失败。

## 你先照着做（不求全懂）

1. 先写 `runTurn()`，里面只做“循环尝试候选模型”。  
2. 再写 `runSingleAttempt()`，只做“建会话 + 发 prompt + 收结果”。  
3. 再加 `subscribe`，把流式文本和工具事件分开收集。  
4. 最后加 fallback 错误记录，便于定位失败原因。

对应核心代码：
- `src/auto-reply/reply/agent-runner.ts`
- `src/agents/pi-embedded-runner/run.ts`
- `src/agents/pi-embedded-runner/run/attempt.ts`
- `src/agents/pi-embedded-subscribe.ts`
- `src/agents/model-fallback.ts`

## 步骤一：执行链路拆解（具体到函数）

1. 入口层  
`agent-runner.ts` 调 `runAgentTurnWithFallback(...)`。
2. 调度层  
`runEmbeddedPiAgent(...)` 负责：
- lane 解析
- 模型/provider 选择
- 执行与重试调度
3. 执行层  
`runEmbeddedAttempt(...)` 负责一次真实尝试：
- 构建 system prompt
- 创建 agent session
- 发起 prompt
4. 事件翻译层  
`subscribeEmbeddedPiSession(...)` 订阅模型事件，产出：
- assistant 文本片段
- tool 调用元数据
- compaction/usage 信息
5. 回退层  
`runWithModelFallback(...)` 在可回退错误下切换候选模型。

## 步骤二：实现细节（关键参数和状态）

1. `runEmbeddedPiAgent` 的关键输入
- `sessionId/sessionKey`：用于 lane 隔离和路由回填。
- `provider/modelId`：当前尝试目标。
- `messageChannel`：决定默认输出格式（markdown/plain）。

2. `runEmbeddedAttempt` 的核心过程
- 组 prompt：`buildEmbeddedSystemPrompt(...)`。
- 组工具：`createOpenClawCodingTools(...)` + `splitSdkTools(...)`。
- 建会话：`createAgentSession(...)`。
- 挂订阅：`subscribeEmbeddedPiSession(...)`。
- 发 prompt：`session.prompt(...)`（有图像就带 images，无图像走纯文本）。

3. `subscribeEmbeddedPiSession` 的职责边界
- 不是“直接回复用户”，而是维护订阅状态机：
- `assistantTexts`
- `toolMetas`
- compaction retry promise
- usage totals

4. 回退层的真实行为
- 候选模型按顺序尝试，不是随机。
- 记录每次失败原因（provider/model/error）。
- 遇到不可回退错误会直接抛出，不继续降级。

## 最小复刻骨架（含回退）

```ts
async function runTurn(prompt: string) {
  const candidates = ["p1/m1", "p2/m2"];
  const attempts: Array<{ model: string; error: string }> = [];

  for (const model of candidates) {
    try {
      return await runSingleAttempt({ model, prompt });
    } catch (err) {
      attempts.push({ model, error: String(err) });
    }
  }
  throw new Error(`all attempts failed: ${JSON.stringify(attempts)}`);
}
```


