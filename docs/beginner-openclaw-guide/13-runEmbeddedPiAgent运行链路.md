# 13 runEmbeddedPiAgent 运行链路

## 模块目标

精确理解 `runEmbeddedPiAgent(...)` 这一条核心执行路径。

## 步骤一：实现拆解（执行链路）

核心文件: `src/agents/pi-embedded-runner/run.ts`

1. 解析 lane:
- `resolveSessionLane`
- `resolveGlobalLane`

2. 双层入队:
- 先 session lane，再 global lane（`enqueueCommandInLane`）

3. 执行准备:
- `ensureOpenClawModelsJson`
- `resolveModel`
- 上下文窗口检查
- auth profile 选择/轮换

4. 运行尝试:
- `runEmbeddedAttempt(...)`

5. 失败处理:
- profile 轮换
- compaction
- tool result 截断
- think level 降级
- FailoverError 抛出

## 步骤二：细粒度讲解（小白版）

1. 为什么是“双 lane”
- session lane: 保证同一会话串行
- global lane: 控制全局共享资源并发

2. 为什么先检查 context window
- 太小的模型会直接失败或行为异常
- 提前拦截比跑到中间崩掉更稳

3. 为什么 auth profile 要轮换
- 同一个 provider 可能配置了多个 key/profile
- 限流或失效时可自动切下一组

4. 为什么运行过程会循环
- 第一次失败不一定是致命失败
- 可尝试 compaction 或截断大 tool 结果后重跑

5. 返回结果不只是文本
- 包含 payloads、usage、tool 元信息、错误标记
- 上层再决定如何输出给用户/通道


